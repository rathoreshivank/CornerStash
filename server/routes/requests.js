const express = require('express');
const { protect } = require('../middleware/auth');
const Request = require('../models/Request');
const Item = require('../models/Item');

const router = express.Router();

// GET /api/requests/my-requests
// Returns all requests made by the logged-in user with item and owner details
router.get('/my-requests', protect, async (req, res) => {
  try {
    const requests = await Request.find({ requester: req.user._id })
      .populate('item', 'title description category imageUrl status')
      .populate('owner', 'name email avatarUrl neighborhood createdAt')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (err) {
    console.error('Fetch my-requests error:', err.message);
    res.status(500).json({ error: 'Failed to fetch your requests' });
  }
});

// GET /api/requests/my-requested-ids
// Returns list of item IDs the logged-in user has already requested
router.get('/my-requested-ids', protect, async (req, res) => {
  try {
    const requests = await Request.find({ requester: req.user._id }).select('item status');
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch requested items' });
  }
});

// GET /api/requests/pending-count
// Returns count of pending requests received for the logged-in user's active items
router.get('/pending-count', protect, async (req, res) => {
  try {
    const count = await Request.countDocuments({
      owner: req.user._id,
      status: 'pending',
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to count pending requests' });
  }
});

// PATCH /api/requests/:id/accept
// Owner accepts one request: marks the item claimed, accepts this request, and rejects all others
router.patch('/:id/accept', protect, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Only the owner of the item can accept requests
    if (request.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the item owner can accept requests' });
    }

    if (request.status === 'accepted') {
      return res.status(400).json({ error: 'This request is already accepted' });
    }
    if (request.status === 'rejected') {
      return res.status(400).json({ error: 'Cannot accept a rejected request' });
    }

    // ATOMIC UPDATE: find the item ONLY IF its status is still 'available'
    // If two requests are accepted concurrently, MongoDB's atomic document lock
    // guarantees only ONE update matches { status: 'available' }. The other will get null.
    const updatedItem = await Item.findOneAndUpdate(
      { _id: request.item, status: 'available' },
      { status: 'claimed' },
      { new: true }
    );

    if (!updatedItem) {
      // The item was already claimed by another request or is no longer available
      request.status = 'rejected';
      await request.save();
      return res.status(409).json({ error: 'This item has already been claimed' });
    }

    // 1. Mark this request as accepted
    request.status = 'accepted';
    await request.save();

    // 2. Reject all other pending requests for this item
    await Request.updateMany(
      {
        item: request.item,
        _id: { $ne: request._id },
        status: 'pending',
      },
      { status: 'rejected' }
    );

    res.json({
      message: 'Request accepted successfully',
      request,
      item: updatedItem,
    });
  } catch (err) {
    console.error('Accept request error:', err.message);
    res.status(500).json({ error: 'Failed to accept request' });
  }
});

// PATCH /api/requests/:id/reject
// Owner rejects a request
router.patch('/:id/reject', protect, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Only the item owner can reject requests
    if (request.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the item owner can reject requests' });
    }

    if (request.status === 'accepted') {
      return res.status(400).json({ error: 'Cannot reject an already accepted request' });
    }

    request.status = 'rejected';
    await request.save();

    res.json({ message: 'Request rejected', request });
  } catch (err) {
    console.error('Reject request error:', err.message);
    res.status(500).json({ error: 'Failed to reject request' });
  }
});

module.exports = router;
