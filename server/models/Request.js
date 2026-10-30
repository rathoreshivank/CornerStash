const mongoose = require('mongoose');

// Request model: tracks a user's request for a giveaway item
const requestSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent the same user from requesting the same item more than once
requestSchema.index({ item: 1, requester: 1 }, { unique: true });

module.exports = mongoose.model('Request', requestSchema);
