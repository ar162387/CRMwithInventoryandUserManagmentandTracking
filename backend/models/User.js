const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  fullname: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['Admin', 'Worker'],
    required: true,
  },
  permissions: {
    type: Object,
    default: {},
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true }); // Adds createdAt and updatedAt automatically

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    console.log('Hashing password for user:', this.username);
    console.log('Original password length:', this.password.length);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);

    console.log('Hashed password length:', hashedPassword.length);
    console.log('Salt used:', salt);

    this.password = hashedPassword;
    console.log('Password hashed successfully');
    console.log('Final stored hash:', this.password);

    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    console.log('Comparing passwords for user:', this.username);
    console.log('Candidate password length:', candidatePassword.length);
    console.log('Stored hash length:', this.password.length);

    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('Password match result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
};

// Update lastUpdated timestamp on modification (except for password changes handled by pre-save)
userSchema.pre('findOneAndUpdate', function (next) {
  if (!this.getUpdate().password) {
    this.set({ lastUpdated: new Date() });
  }
  next();
});


const User = mongoose.model('User', userSchema);

module.exports = User; 