// const { Schema, model } = require("mongoose");
// const bcrypt = require("bcryptjs");

// const userSchema = new Schema({
//   username: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   password: {
//     type: String,
//     required: true,
//   },
//   role: {
//     type: String,
//     enum: ["admin", "user"],
//     default: "user",
//   },
//   profileImage: {
//     type: String,
//   },
//   bio: {
//     type: String,
//     maxlength: 200
//   },
//   profession: {
//     type: String
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// // Hashing password
// userSchema.pre("save", async function (next) {
//   const user = this;
//   if (!user.isModified("password")) return next();
//     const hashedPassword = await bcrypt.hash(user.password, 10);
//     user.password = hashedPassword;
//     next();
// });

// // Compare password
// userSchema.methods.comparePassword = function (candidatePassword) {
//   return bcrypt.compare(candidatePassword, this.password);
// };

// const User = new model("User", userSchema);
// module.exports = User;

const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  profileImage: {
    type: String,
  },
  bio: {
    type: String,
    maxlength: 200,
  },
  profession: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },

  // Reset password token and expiry fields
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

// Hashing password
userSchema.pre("save", async function (next) {
  const user = this;
  if (!user.isModified("password")) return next();
  const hashedPassword = await bcrypt.hash(user.password, 10);
  user.password = hashedPassword;
  next();
});

// Compare password
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = model("User", userSchema); // Removed unnecessary `new` keyword here
module.exports = User;
