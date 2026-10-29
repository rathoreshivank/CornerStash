const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Defines the shape of a user document in MongoDB
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      // Store all emails lowercase so "Alice@mail.com" and "alice@mail.com" are the same
      lowercase: true,
      trim: true,
      unique: true,
      match: [/\S+@\S+\.\S+/, 'Email format is invalid'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    // Optional: where the user is located (used later for nearby search)
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
    },
  },
  { timestamps: true }
);

// Hash the password before saving a new or changed password
userSchema.pre('save', async function (next) {
  // Only hash if the password field was actually changed
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare a plain-text password with the stored hash
userSchema.methods.matchPassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

// Return a safe user object – never expose the password hash
userSchema.methods.toSafeObject = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    location: this.location,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
