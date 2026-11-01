const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Item = require('../models/Item');
const Request = require('../models/Request');
const Review = require('../models/Review');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');

const router = express.Router();

// Helper: upload buffer to Cloudinary
function uploadBufferToCloudinary(buffer, folder = 'giveaway/avatars') {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
}

// GET /api/users/:id/profile (Public neighbor profile view)
router.get('/:id/profile', async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const user = await User.findById(id).select('name email avatarUrl bio neighborhood createdAt');
    if (!user) {
      return res.status(404).json({ error: 'Neighbor not found' });
    }

    // Community Statistics
    const [itemsListedCount, itemsGiftedCount, itemsReceivedCount, activeListings] =
      await Promise.all([
        Item.countDocuments({ owner: user._id }),
        Item.countDocuments({ owner: user._id, status: 'claimed' }),
        Request.countDocuments({ requester: user._id, status: 'accepted' }),
        Item.find({ owner: user._id, status: 'available' })
          .select('title description category imageUrl condition locationName createdAt')
          .sort({ createdAt: -1 })
          .limit(6)
          .lean(),
      ]);

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        avatarUrl: user.avatarUrl || '',
        bio: user.bio || '',
        neighborhood: user.neighborhood || '',
        createdAt: user.createdAt,
      },
      stats: {
        itemsListedCount,
        itemsGiftedCount,
        itemsReceivedCount,
      },
      activeListings,
    });
  } catch (err) {
    console.error('Fetch profile error:', err.message);
    res.status(500).json({ error: 'Failed to load neighbor profile' });
  }
});

// PUT /api/users/profile (Protected – update current user's profile info)
router.put('/profile', protect, async (req, res) => {
  const { name, bio, neighborhood } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (name && typeof name === 'string') {
      const cleanName = name.trim();
      if (!cleanName) return res.status(400).json({ error: 'Name cannot be blank' });
      user.name = cleanName;
    }

    if (typeof bio === 'string') {
      user.bio = bio.trim().slice(0, 300);
    }

    if (typeof neighborhood === 'string') {
      user.neighborhood = neighborhood.trim().slice(0, 100);
    }

    await user.save();

    res.json({ user: user.toSafeObject() });
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/users/avatar (Protected – upload avatar photo to Cloudinary)
router.post(
  '/avatar',
  protect,
  (req, res, next) => {
    upload.single('avatar')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Please choose an image file to upload' });
    }

    try {
      const result = await uploadBufferToCloudinary(req.file.buffer);

      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      user.avatarUrl = result.secure_url;
      await user.save();

      res.json({
        message: 'Profile photo updated successfully',
        avatarUrl: user.avatarUrl,
        user: user.toSafeObject(),
      });
    } catch (err) {
      console.error('Avatar upload error:', err.message);
      res.status(500).json({ error: `Photo upload failed: ${err.message}` });
    }
  }
);

module.exports = router;
