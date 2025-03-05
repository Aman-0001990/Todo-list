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

module.exports = router;
