const mongoose = require('mongoose');

// Defines the shape of a giveaway item in MongoDB
const itemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['Books', 'Electronics', 'Furniture', 'Clothes', 'Other'],
      message: 'Category must be Books, Electronics, Furniture, Clothes, or Other',
    },
  },
  imageUrl: {
    type: String,
    required: [true, 'Image URL is required'],
  },
  // The user who listed this item
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['available', 'claimed'],
    default: 'available',
  },
  // GeoJSON Point – coordinates are stored as [longitude, latitude]
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true,
    },
  },
  // Friendly neighborhood or locality name (e.g. "Sector 62", "Indiranagar")
  locationName: {
    type: String,
    default: '',
    trim: true,
    maxlength: [100, 'Location name cannot exceed 100 characters'],
  },
  // Item condition
  condition: {
    type: String,
    enum: ['Like New', 'Gently Used', 'Fair', 'For Parts / Upcycle', ''],
    default: 'Gently Used',
  },
  // Specific pickup instructions (e.g. "Porch pickup", "Needs 2 people")
  pickupNotes: {
    type: String,
    default: '',
    trim: true,
    maxlength: [150, 'Pickup notes cannot exceed 150 characters'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 2dsphere index lets MongoDB run geo queries (nearby search in Stage 4)
itemSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Item', itemSchema);
