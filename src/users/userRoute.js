const express = require("express");
const crypto = require("crypto"); // This now refers to the built-in Node.js module
const bcrypt = require("bcryptjs");
const User = require("./userModel");
const sendEmail = require("../utils/sendMail"); // A utility for sending emails
const router = express.Router();
const generateAuthToken = require("../middleware/generateAuthToken");
// const verifyToken = require("../middleware/verifyToken");

// Register Endpoint
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = new User({ username, email, password });
    await user.save();
    res.status(201).send({ message: "User created successfully" });
  } catch (error) {
    console.log("Error in creating user", error);
    res.status(500).send({ message: "Error in creating user" });
  }
});

// Login Endpoint
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).send({ message: "Invalid credentials" });
    }

    const token = await generateAuthToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    res.status(200).send({
      message: "Logged in successfully", // Replace `message` with this
      token,
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        profileImage: user.profileImage,
        bio: user.bio,
        profession: user.profession,
      },
    });
  } catch (error) {
    console.log("Error in login", error);
    res.status(500).send({ message: "Error in login" });
  }
});


// All Users Endpoint
// router.get("/users", verifyToken, async (req, res) => {
//   res.send({message: "Protected Users"});
// });

// Logout Endpoint
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.status(200).send({ message: "Logged out successfully" });
});

// Delete User Endpoint
router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    res.status(200).send({ message: "User deleted successfully" });
  } catch (error) {
    console.log("Error in deleting user", error);
    res.status(500).send({ message: "Error in deleting user" });
  }
});

// Get All User Endpoint
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "id email role").sort({ createdAt: -1 });
    res.status(200).send(users);
  } catch (error) {
    console.log("Error in getting users", error);
    res.status(500).send({ message: "Error in getting users" });
  }
});

// Update User Profile Endpoint
router.patch("/edit-profile", async (req, res) => {
  try {
    const { userId, username, email, profileImage, bio, profession } = req.body;
    if (!userId) {
      return res.status(404).send({ message: "User Id not found" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    // Update user profile
    if (username !== undefined) {
      user.username = username;
    }
    if (email !== undefined) {
      user.email = email;
    }
    if (profileImage !== undefined) {
      user.profileImage = profileImage;
    }
    if (bio !== undefined) {
      user.bio = bio;
    }
    if (profession !== undefined) {
      user.profession = profession;
    }

    await user.save();
    res.status(200).send({
      message: "User updated successfully",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        bio: user.bio,
        profession: user.profession,
      },
    });
  } catch (error) {
    console.error("Error in updating user", error);
    res.status(500).send({ message: "Error in updating user" });
  }
});

// Update User Role Endpoint
router.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      id,
      { role },
      {
        new: true,
      }
    );
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    res.status(200).send({ message: "User Role updated successfully" });
  } catch (error) {
    console.log("Error in updating user", error);
    res.status(500).send({ message: "Error in updating user" });
  }
});

// Forgot Password - Generate Reset Token
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send email
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const message = `
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>If you did not request this, please ignore this email.</p>
    `;

    await sendEmail({
      to: user.email,
      subject: "Password Reset",
      text: `Click the link to reset your password: ${resetUrl}`,
      html: message,
    });

    res.status(200).send({ message: "Reset link sent to email" });
  } catch (error) {
    console.error("Error in forgot password", error);
    res.status(500).send({ message: "Error in processing request" });
  }
});


// Reset Password - Verify Token and Update Password
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hash token and find user
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .send({ message: "Invalid or expired reset token" });
    }

    // Update and hash password
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).send({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error in resetting password", error);
    res.status(500).send({ message: "Error in resetting password" });
  }
});

module.exports = router;
