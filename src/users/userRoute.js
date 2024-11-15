const express = require("express");
const User = require("./userModel");
const generateAuthToken = require("../middleware/generateAuthToken");
// const verifyToken = require("../middleware/verifyToken");
const router = express.Router();

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
      return res.status(404).send({ message: "Invalid credentials" });
    }

      const token = await generateAuthToken(user._id);
    //   console.log("token:", token);
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });

      
    res.status(200).send({
        message: "Logged in successful", token, user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        profileImage: user.profileImage,
        bio: user.bio,
        profession: user.profession
    } });
        

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
})

// Delete User Endpoint
router.delete("/users/:id", async (req, res) => {
  try {
    const {id} = req.params
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
      if(!userId) {
        return res.status(404).send({ message: "User Id not found" });
      }
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).send({ message: "User not found" });
      }
      // Update user profile
      if(username !== undefined) {user.username = username;}
      if(email !== undefined) {user.email = email;}
      if(profileImage !== undefined) {user.profileImage = profileImage;} 
      if(bio !== undefined) {user.bio = bio;}
      if (profession !== undefined) { user.profession = profession; }
      
    await user.save();
      res.status(200).send({ message: "User updated successfully",
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          bio: user.bio,
          profession: user.profession
        }
       });
  } catch (error) {
      console.error("Error in updating user", error);
      res.status(500).send({ message: "Error in updating user" });
  }
});

// Update User Role Endpoint
router.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params
    const { role } = req.body
    const user = await User.findByIdAndUpdate(id, {role}, {  
      new: true
    });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    res.status(200).send({ message: "User Role updated successfully" });
  } catch (error) {
    console.log("Error in updating user", error);
    res.status(500).send({ message: "Error in updating user" });
  }
});

module.exports = router;