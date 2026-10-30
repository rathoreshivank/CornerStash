const express = require('express');
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Item = require('../models/Item');
const Request = require('../models/Request');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/reviews (Protected – rate and review a neighbor for a completed exchange)
router.post('/', protect, async (req, res) => {
  const { itemId, rating, comment } = req.body;

  if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
    return res.status(400).json({ error: 'Valid itemId is required' });
  }

  const numericRating = parseInt(rating, 10);
  if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ error: 'Rating must be a whole number between 1 and 5' });
  }

  if (!comment || typeof comment !== 'string' || comment.trim().length < 3) {
    return res.status(400).json({ error: 'Please write a helpful comment of at least 3 characters' });
  }

  const cleanComment = comment.trim().slice(0, 400);

  try {
    // 1. Fetch item and verify it is claimed
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    if (item.status !== 'claimed') {
      return res.status(400).json({ error: 'You can only review exchanges for claimed items' });
    }

    // 2. Fetch the accepted request for this item
    const acceptedRequest = await Request.findOne({ item: itemId, status: 'accepted' });
    if (!acceptedRequest) {
      return res.status(400).json({ error: 'No completed exchange record found for this item' });
    }

    const currentUserId = req.user._id.toString();
    const ownerId = item.owner.toString();
    const requesterId = acceptedRequest.requester.toString();

    // 3. Security: ensure the reviewer was actually part of this exchange
    let recipientId;
    if (currentUserId === ownerId) {
      // Owner is rating the requester
      recipientId = requesterId;
    } else if (currentUserId === requesterId) {
      // Requester is rating the owner
      recipientId = ownerId;
    } else {
      return res.status(403).json({
        error: 'Only the giver and receiver of this item can leave a review',
      });
    }

    // 4. Check if current user already submitted a review for this exchange
    const existing = await Review.findOne({ reviewer: req.user._id, item: itemId });
    if (existing) {
      return res.status(400).json({ error: 'You have already reviewed this exchange' });
    }

    // 5. Create review
    const review = await Review.create({
      reviewer: req.user._id,
      recipient: recipientId,
      item: itemId,
      rating: numericRating,
      comment: cleanComment,
    });

    res.status(201).json({
      message: 'Review submitted successfully',
      review,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'You have already reviewed this exchange' });
    }
    console.error('Submit review error:', err.message);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// GET /api/reviews/my-reviews (Protected – list of review IDs user has submitted, keyed by itemId)
router.get('/my-reviews', protect, async (req, res) => {
  try {
    const reviews = await Review.find({ reviewer: req.user._id }).select('item rating comment createdAt');
    // Map by itemId
    const reviewedMap = {};
    reviews.forEach((r) => {
      reviewedMap[r.item.toString()] = {
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
      };
    });
    res.json({ reviews: reviewedMap });
  } catch (err) {
    console.error('Fetch my-reviews error:', err.message);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

module.exports = router;
