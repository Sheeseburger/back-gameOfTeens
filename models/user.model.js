const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
//name, email, photo, password, passwordConfirm

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'We need your name :3']
  },
  email: {
    type: String,
    required: [true, 'We need your email ;3'],
    unique: true,
    validate: [validator.isEmail, 'Email is not correct']
  },

  role: {
    type: String,
    enum: ['admin', 'jury'],
    default: 'jury'
  },
  password: {
    type: String,
    required: true,
    minlength: 3,
    select: false
  },

  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date
});
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});
userSchema.pre('save', async function (next) {
  //only run if password was modified

  if (!this.isModified('password')) return next();
  // hash the password
  this.password = await bcrypt.hash(this.password, 12);

  next();
});

userSchema.pre(/^find/, async function (next) {
  // this points to current query
  this.find({active: {$ne: false}});
  next();
});

userSchema.methods.correctPassword = async function (passwordForCheck, userPassword) {
  return await bcrypt.compare(passwordForCheck, userPassword);
};

// false means not changed, true - changed password
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

    return JWTTimestamp < changedTimestamp;
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User;
