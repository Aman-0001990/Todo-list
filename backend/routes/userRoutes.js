const express = require("express");
const User = require("../models/User");
const authMiddleware = require("../middlewares/authMiddleware");
// const express = require("express");

const { updateProfile } = require("../controllers/userController");

// const router = express.Router();

router.put("/profile", protect, updateProfile);  // Update profile

module.exports = router;

const router = express.Router();

/** 
 * ✅ Fetch User Profile
 * Route: GET /api/users/profile
 * Protected: Yes (Requires JWT Authentication)
 */
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password"); // Exclude password
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user profile", error });
  }
});
const { requestPasswordReset, resetPassword } = require("../controllers/userController");

router.post("/forgot-password", requestPasswordReset); // Request password reset
router.post("/reset-password/:token", resetPassword); // Reset password

module.exports = router;
