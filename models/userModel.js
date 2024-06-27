const mongoose = require("mongoose");
const validator = require("validator");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    require: [true, "Please provide your name"],
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: [true, "Email should be unique"],
    lowercase: true,
    validate: [
      validator.isEmail,
      "Please enter a vaild email",
    ],
  },
  photo: {
    type: String,
    default: "default.jpg",
  },
  role: {
    type: String,
    required: [true, "A user must have a role"],
    enum: {
      values: ["user", "guide", "lead-guide", "admin"],
      message:
        "roles must be either user, guide, lead-guide, admin",
    },
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: [8, "Passowrd must be 8 character long"],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      // This only work on save and create
      validator: function (el) {
        return el === this.password;
      },
      message:
        "PasswordConfirm should be same as the Password",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpire: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// Encrypting the password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  // hash the password with a salt of 12
  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew)
    return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  // this.find({ active: { $ne: false } });
  this.find({ active: true });

  next();
});

// Intance Method
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = function (
  JWTtimestamp
) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTtimestamp < changedTimestamp;
  }

  return false;
};

userSchema.methods.genPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpire = Date.now() + 5 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
