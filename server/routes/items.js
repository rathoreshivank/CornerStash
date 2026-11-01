const express = require('express');
const cloudinary = require('../config/cloudinary');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const Item = require('../models/Item');
const Request = require('../models/Request');

const router = express.Router();

// Upload an image buffer to Cloudinary using a stream
// Returns a promise that resolves with the Cloudinary result
function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'giveaway', resource_type: 'image' },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

// GET /api/items/my-listings
// Returns items listed by the logged-in user with received requests
router.get('/my-listings', protect, async (req, res) => {
  try {
    const items = await Item.find({ owner: req.user._id }).sort({ createdAt: -1 });
    const itemIds = items.map((i) => i._id);

    // Fetch all requests received for these items
    const requests = await Request.find({ item: { $in: itemIds } })
      .populate('requester', 'name email avatarUrl neighborhood createdAt')
      .sort({ createdAt: -1 });

    // Attach requests to each item
    const itemsWithRequests = items.map((item) => {
      const itemObj = item.toObject();
      itemObj.requests = requests.filter(
        (r) => r.item.toString() === item._id.toString()
      );
      return itemObj;
    });

    res.json({ items: itemsWithRequests });
  } catch (err) {
    console.error('Fetch my-listings error:', err.message);
    res.status(500).json({ error: 'Failed to fetch your listings' });
  }
});

// GET /api/items/nearby
// Returns available items within 5 km of the specified coordinates, nearest first
router.get('/nearby', async (req, res) => {
  const { lat, lng, category, q } = req.query;

  // Validate coordinates
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ error: 'Valid lat and lng query parameters are required' });
  }
  if (latitude < -90 || latitude > 90) {
    return res.status(400).json({ error: 'Latitude must be between -90 and 90' });
  }
  if (longitude < -180 || longitude > 180) {
    return res.status(400).json({ error: 'Longitude must be between -180 and 180' });
  }

  // Base query: only available items within 5 km
  const matchQuery = { status: 'available' };

  // Optional category filter
  const validCategories = ['Books', 'Electronics', 'Furniture', 'Clothes', 'Other'];
  if (category && category !== 'All' && validCategories.includes(category)) {
    matchQuery.category = category;
  }

  // Optional title search (case-insensitive)
  if (q && q.trim()) {
    const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    matchQuery.title = { $regex: escaped, $options: 'i' };
  }

  try {
    const items = await Item.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [longitude, latitude], // GeoJSON order: [lng, lat]
          },
          distanceField: 'distance', // Distance in meters
          maxDistance: 5000, // 5 km = 5,000 meters
          spherical: true,
          query: matchQuery,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'owner',
          foreignField: '_id',
          as: 'ownerDetails',
        },
      },
      {
        $unwind: {
          path: '$ownerDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          title: 1,
          description: 1,
          category: 1,
          imageUrl: 1,
          status: 1,
          location: 1,
          locationName: { $ifNull: ['$locationName', ''] },
          condition: { $ifNull: ['$condition', 'Gently Used'] },
          pickupNotes: { $ifNull: ['$pickupNotes', ''] },
          createdAt: 1,
          distance: 1,
          distanceKm: {
            $round: [{ $divide: ['$distance', 1000] }, 1],
          },
          'owner._id': '$ownerDetails._id',
          'owner.name': '$ownerDetails.name',
          'owner.avatarUrl': { $ifNull: ['$ownerDetails.avatarUrl', ''] },
          'owner.neighborhood': { $ifNull: ['$ownerDetails.neighborhood', ''] },
          'owner.createdAt': '$ownerDetails.createdAt',
        },
      },
    ]);

    res.json({ items });
  } catch (err) {
    console.error('Nearby search error:', err.message);
    res.status(500).json({ error: 'Failed to search nearby items' });
  }
});

// POST /api/items  –  Create a new item listing (protected)
// Accepts multipart/form-data with fields: title, description, category,
// latitude, longitude, and a single image file
router.post(
  '/',
  protect,
  // Multer middleware: parse the "image" file from the form
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        // Multer error: file too large or wrong type
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Image must be smaller than 5 MB' });
        }
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    const {
      title,
      description,
      category,
      latitude,
      longitude,
      locationName,
      condition,
      pickupNotes,
    } = req.body;

    // --- Field validation ---
    if (!title || !description || !category) {
      return res
        .status(400)
        .json({ error: 'Title, description, and category are required' });
    }

    const validCategories = ['Books', 'Electronics', 'Furniture', 'Clothes', 'Other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        error: 'Category must be Books, Electronics, Furniture, Clothes, or Other',
      });
    }

    // --- Coordinate validation ---
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res
        .status(400)
        .json({ error: 'Latitude and longitude are required and must be numbers' });
    }
    if (lat < -90 || lat > 90) {
      return res.status(400).json({ error: 'Latitude must be between -90 and 90' });
    }
    if (lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'Longitude must be between -180 and 180' });
    }

    // --- Image validation ---
    if (!req.file) {
      return res.status(400).json({ error: 'An image is required' });
    }

    try {
      // Upload the image buffer to Cloudinary via stream
      const cloudResult = await uploadToCloudinary(req.file.buffer);

      // Create the item in MongoDB
      const item = await Item.create({
        title: title.trim(),
        description: description.trim(),
        category,
        imageUrl: cloudResult.secure_url,
        owner: req.user._id,
        status: 'available',
        locationName: typeof locationName === 'string' ? locationName.trim().slice(0, 100) : '',
        condition: typeof condition === 'string' && condition.trim() ? condition.trim() : 'Gently Used',
        pickupNotes: typeof pickupNotes === 'string' ? pickupNotes.trim().slice(0, 150) : '',
        location: {
          type: 'Point',
          coordinates: [lng, lat], // GeoJSON uses [longitude, latitude]
        },
      });

      res.status(201).json({ item });
    } catch (err) {
      if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message });
      }
      console.error('Item creation error:', err.message);

      // Return informative error if Cloudinary upload failed due to credentials or network
      if (err.message && (err.message.includes('Signature') || err.message.includes('api_secret') || err.message.includes('Must supply') || err.http_code)) {
        return res.status(500).json({
          error: `Image upload failed: ${err.message}. Please check your CLOUDINARY_API_SECRET in server/.env`,
        });
      }

      res.status(500).json({ error: 'Failed to create item. Please try again.' });
    }
  }
);

// POST /api/items/:id/request
// Create a new request for an available item (cannot request own item, cannot request twice)
router.post('/:id/request', protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.status !== 'available') {
      return res.status(400).json({ error: 'This item is no longer available' });
    }

    // A user cannot request their own item
    if (item.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'You cannot request your own item' });
    }

    // Check if user already requested this item
    const existing = await Request.findOne({
      item: item._id,
      requester: req.user._id,
    });
    if (existing) {
      return res.status(409).json({ error: 'You have already requested this item' });
    }

    // Create the request
    const request = await Request.create({
      item: item._id,
      requester: req.user._id,
      owner: item.owner,
      status: 'pending',
    });

    res.status(201).json({
      message: 'Request sent successfully',
      request,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'You have already requested this item' });
    }
    console.error('Create request error:', err.message);
    res.status(500).json({ error: 'Failed to request item' });
  }
});

// DELETE /api/items/:id
// Delete a listing (owner only, only if status is available)
router.delete('/:id', protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the owner can delete this listing' });
    }

    if (item.status !== 'available') {
      return res.status(400).json({ error: 'Cannot delete an item that is already claimed' });
    }

    await Item.findByIdAndDelete(req.params.id);
    // Delete any pending requests for this item
    await Request.deleteMany({ item: req.params.id });

    res.json({ message: 'Listing deleted successfully' });
  } catch (err) {
    console.error('Delete item error:', err.message);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});

module.exports = router;
