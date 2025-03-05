const express = require("express");
const Task = require("../models/Task");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

/** 
 * ✅ Create a new Task 
 * Route: POST /api/tasks
 * Protected: Yes
 */
router.post("/u", authMiddleware, async (req, res) => {
  try {
    const { title } = req.body;
    const newTask = new Task({ userId: req.user.userId, title });
    await newTask.save();
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ message: "Error creating task", error });
  }
});

/** 
 * ✅ Get all tasks of the logged-in user
 * Route: GET /api/tasks
 * Protected: Yes
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.userId });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tasks", error });
  }
});

/** 
 * ✅ Update Task Status (Success/Decline)
 * Route: PUT /api/tasks/:id
 * Protected: Yes
 */
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "success", "declined"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { status },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: "Error updating task", error });
  }
});

/** 
 * ✅ Delete Task
 * Route: DELETE /api/tasks/:id
 * Protected: Yes
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const deletedTask = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting task", error });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    let query = { user: req.user.userId };

    // Apply filtering if status is provided
    if (status) {
      query.status = status; // status can be 'pending' or 'completed'
    }

    const tasks = await Task.find(query);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tasks", error });
  }
});


router.get("/", authMiddleware, async (req, res) => {
  try {
    const { status, sortBy } = req.query;
    let query = { user: req.user.userId };

    if (status) query.status = status;

    // Default sorting by newest first (-1 means descending)
    let sortOption = { createdAt: -1 };

    if (sortBy === "oldest") {
      sortOption = { createdAt: 1 };
    }

    const tasks = await Task.find(query).sort(sortOption);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tasks", error });
  }
});


router.get("/", authMiddleware, async (req, res) => {
  try {
    const { status, sortBy, page, limit } = req.query;
    let query = { user: req.user.userId };

    if (status) query.status = status;

    let sortOption = { createdAt: -1 };
    if (sortBy === "oldest") sortOption = { createdAt: 1 };

    // Default pagination values
    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 5;
    const skip = (pageNumber - 1) * pageSize;

    const tasks = await Task.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(pageSize);

    // Count total tasks for pagination info
    const totalTasks = await Task.countDocuments(query);

    res.json({
      tasks,
      totalPages: Math.ceil(totalTasks / pageSize),
      currentPage: pageNumber,
      totalTasks,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching tasks", error });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const { status, sortBy, page, limit, search } = req.query;
    let query = { user: req.user.userId, isDeleted: false }; // Ignore deleted tasks

    if (status) query.status = status;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } }, // Case-insensitive search
        { description: { $regex: search, $options: "i" } }
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sortBy === "oldest") sortOption = { createdAt: 1 };

    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 5;
    const skip = (pageNumber - 1) * pageSize;

    const tasks = await Task.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(pageSize);

    const totalTasks = await Task.countDocuments(query);

    res.json({
      success: true,
      message: "Tasks retrieved successfully",
      tasks,
      totalPages: Math.ceil(totalTasks / pageSize),
      currentPage: pageNumber,
      totalTasks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching tasks", error });
  }
});
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.userId });

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    task.isDeleted = true; // Mark as deleted
    await task.save();

    res.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting task", error });
  }
});
router.patch("/restore/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.userId });

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (!task.isDeleted) {
      return res.status(400).json({ success: false, message: "Task is not deleted" });
    }

    task.isDeleted = false;
    await task.save();

    res.json({ success: true, message: "Task restored successfully", task });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error restoring task", error });
  }
});
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password"); // Exclude password

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "User profile retrieved", user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching profile", error });
  }
});
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, email } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();
    res.json({ success: true, message: "Profile updated successfully", user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating profile", error });
  }
});
router.post("/logout", authMiddleware, (req, res) => {
  res.json({ success: true, message: "User logged out successfully" });
});

module.exports = router;
