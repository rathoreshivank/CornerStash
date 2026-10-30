const mongoose = require('mongoose');

// Review schema for community ratings and credibility
const reviewSchema = new mongoose.Schema(
  {
    // The user writing the review (must be party to the claimed transaction)
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // The user receiving the review
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // The claimed item that facilitated this transaction
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    // Rating from 1 to 5 stars
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars'],
    },
    // Review comment or feedback note
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      maxlength: [400, 'Comment cannot exceed 400 characters'],
    },
  },
  { timestamps: true }
);

// One review per reviewer per item exchange
reviewSchema.index({ reviewer: 1, item: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
