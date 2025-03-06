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
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, description, dueDate, priority } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    const newTask = new Task({
      user: req.user.userId,
      title,
      description,
      dueDate,
      priority, // Save priority
    });

    await newTask.save();
    res.status(201).json({ success: true, message: "Task created", task: newTask });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error creating task", error });
  }
});
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { sortBy } = req.query; // Get sorting query

    let sortOption = {};
    if (sortBy === "priority") {
      sortOption = { 
        priority: { "High": 1, "Medium": 2, "Low": 3 } 
      };
    } else if (sortBy === "dueDate") {
      sortOption = { dueDate: 1 }; // Ascending order
    } else {
      sortOption = { createdAt: -1 }; // Default: Newest first
    }

    const tasks = await Task.find({ user: req.user.userId, isDeleted: false }).sort(sortOption);
    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching tasks", error });
  }
});
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { priority, status, sortBy, page, limit } = req.query;

    let filter = { user: req.user.userId, isDeleted: false };

    // Filter by priority
    if (priority) {
      filter.priority = priority;
    }

    // Filter by status (completed or pending)
    if (status === "completed") {
      filter.isCompleted = true;
    } else if (status === "pending") {
      filter.isCompleted = false;
    }

    // Sorting logic
    let sortOption = {};
    if (sortBy === "priority") {
      sortOption = { priority: { "High": 1, "Medium": 2, "Low": 3 } };
    } else if (sortBy === "dueDate") {
      sortOption = { dueDate: 1 }; // Ascending order
    } else {
      sortOption = { createdAt: -1 }; // Default: Newest first
    }

    const tasks = await Task.find(filter).sort(sortOption);
    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching tasks", error });
  }
});
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { priority, status, sortBy, page = 1, limit = 5 } = req.query;

    let filter = { user: req.user.userId, isDeleted: false };

    if (priority) filter.priority = priority;
    if (status === "completed") filter.isCompleted = true;
    else if (status === "pending") filter.isCompleted = false;

    let sortOption = {};
    if (sortBy === "priority") {
      sortOption = { priority: { "High": 1, "Medium": 2, "Low": 3 } };
    } else if (sortBy === "dueDate") {
      sortOption = { dueDate: 1 };
    } else {
      sortOption = { createdAt: -1 };
    }

    const tasks = await Task.find(filter)
      .sort(sortOption)
      .skip((page - 1) * limit) // Skip previous pages
      .limit(parseInt(limit)); // Limit results

    res.json({ success: true, page, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching tasks", error });
  }
});
const { body, validationResult } = require("express-validator");

router.post(
  "/",
  authMiddleware,
  [
    body("title").not().isEmpty().withMessage("Title is required"),
    body("priority").optional().isIn(["High", "Medium", "Low"]).withMessage("Invalid priority"),
    body("dueDate").optional().isISO8601().withMessage("Invalid due date format")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { title, description, dueDate, priority } = req.body;

      const newTask = new Task({
        user: req.user.userId,
        title,
        description,
        dueDate,
        priority
      });

      await newTask.save();
      res.status(201).json({ success: true, message: "Task created", task: newTask });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error creating task", error });
    }
  }
);
// Update Task (Mark as Completed or Declined)
router.put("/:taskId", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body; // "completed" or "declined"
    const task = await Task.findById(req.params.taskId);

    if (!task) return res.status(404).json({ message: "Task not found" });

    task.isCompleted = status === "completed";
    await task.save();

    // Save task to history
    await TaskHistory.create({
      user: req.user.id,
      taskId: task._id,
      title: task.title,
      description: task.description,
      status: status,
    });

    res.json({ message: `Task marked as ${status}`, task });
  } catch (error) {
    res.status(500).json({ message: "Error updating task", error });
  }
});
// Delete Task (Move to Task History)
router.delete("/:taskId", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) return res.status(404).json({ message: "Task not found" });

    // Save to history before deleting
    await TaskHistory.create({
      user: req.user.id,
      taskId: task._id,
      title: task.title,
      description: task.description,
      status: "deleted",
    });

    await Task.deleteOne({ _id: req.params.taskId });

    res.json({ message: "Task deleted and saved to history" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting task", error });
  }
});
// Get Task History
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const history = await TaskHistory.find({ user: req.user.id }).sort({ timestamp: -1 });

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "Error fetching task history", error });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, description, category } = req.body;

    if (!title) return res.status(400).json({ message: "Title is required" });

    const newTask = await Task.create({
      user: req.user.id,
      title,
      description,
      category, // Assign category
    });

    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ message: "Error creating task", error });
  }
});
router.put("/:taskId", authMiddleware, async (req, res) => {
  try {
    const { title, description, status, category } = req.body;
    const task = await Task.findById(req.params.taskId);

    if (!task) return res.status(404).json({ message: "Task not found" });

    if (title) task.title = title;
    if (description) task.description = description;
    if (category) task.category = category;
    if (status) task.isCompleted = status === "completed";

    await task.save();

    res.json({ message: "Task updated", task });
  } catch (error) {
    res.status(500).json({ message: "Error updating task", error });
  }
});
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { category, status } = req.query;
    let filters = { user: req.user.id };

    if (category) filters.category = category;
    if (status === "completed") filters.isCompleted = true;
    if (status === "pending") filters.isCompleted = false;

    const tasks = await Task.find(filters).sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tasks", error });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, description, category, dueDate } = req.body;

    if (!title) return res.status(400).json({ message: "Title is required" });

    const newTask = await Task.create({
      user: req.user.id,
      title,
      description,
      category,
      dueDate, // Save due date
    });

    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ message: "Error creating task", error });
  }
});
router.put("/:taskId", authMiddleware, async (req, res) => {
  try {
    const { title, description, status, category, dueDate } = req.body;
    const task = await Task.findById(req.params.taskId);

    if (!task) return res.status(404).json({ message: "Task not found" });

    if (title) task.title = title;
    if (description) task.description = description;
    if (category) task.category = category;
    if (dueDate) task.dueDate = dueDate;
    if (status) task.isCompleted = status === "completed";

    await task.save();

    res.json({ message: "Task updated", task });
  } catch (error) {
    res.status(500).json({ message: "Error updating task", error });
  }
});
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { category, status, overdue } = req.query;
    let filters = { user: req.user.id };

    if (category) filters.category = category;
    if (status === "completed") filters.isCompleted = true;
    if (status === "pending") filters.isCompleted = false;
    if (overdue === "true") filters.dueDate = { $lt: new Date(), $ne: null };

    const tasks = await Task.find(filters).sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tasks", error });
  }
});
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { category, status, overdue } = req.query;
    let filters = { user: req.user.id };

    if (category) filters.category = category;
    if (status === "completed") filters.isCompleted = true;
    if (status === "pending") filters.isCompleted = false;
    if (overdue === "true") filters.dueDate = { $lt: new Date(), $ne: null };

    const tasks = await Task.find(filters).sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tasks", error });
  }
});
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { category, status, overdue, sortBy, order } = req.query;
    let filters = { user: req.user.id };

    if (category) filters.category = category;
    if (status === "completed") filters.isCompleted = true;
    if (status === "pending") filters.isCompleted = false;
    if (overdue === "true") filters.dueDate = { $lt: new Date(), $ne: null };

    // Sorting options
    let sortOptions = {};
    if (sortBy === "dueDate") sortOptions.dueDate = order === "desc" ? -1 : 1;
    else if (sortBy === "createdAt") sortOptions.createdAt = order === "desc" ? -1 : 1;
    else if (sortBy === "status") sortOptions.isCompleted = order === "desc" ? -1 : 1;

    const tasks = await Task.find(filters).sort(sortOptions);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tasks", error });
  }
});
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { sortBy, order } = req.query;

    // Sorting options
    let sortOptions = {};
    if (sortBy === "dueDate") sortOptions.dueDate = order === "desc" ? -1 : 1;
    else if (sortBy === "createdAt") sortOptions.createdAt = order === "desc" ? -1 : 1;
    else if (sortBy === "status") sortOptions.isCompleted = order === "desc" ? -1 : 1;

    const tasks = await Task.find({ user: req.user.id }).sort(sortOptions);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tasks", error });
  }
});
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { sortBy, order, page = 1, limit = 5 } = req.query;

    let sortOptions = {};
    if (sortBy === "dueDate") sortOptions.dueDate = order === "desc" ? -1 : 1;
    else if (sortBy === "createdAt") sortOptions.createdAt = order === "desc" ? -1 : 1;
    else if (sortBy === "status") sortOptions.isCompleted = order === "desc" ? -1 : 1;

    const skip = (page - 1) * limit;

    const tasks = await Task.find({ user: req.user.id })
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    const totalTasks = await Task.countDocuments({ user: req.user.id });

    res.json({
      totalTasks,
      totalPages: Math.ceil(totalTasks / limit),
      currentPage: Number(page),
      tasks,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching tasks", error });
  }
});
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { search, sortBy, order, page = 1, limit = 5 } = req.query;

    // Sorting options
    let sortOptions = {};
    if (sortBy === "dueDate") sortOptions.dueDate = order === "desc" ? -1 : 1;
    else if (sortBy === "createdAt") sortOptions.createdAt = order === "desc" ? -1 : 1;
    else if (sortBy === "status") sortOptions.isCompleted = order === "desc" ? -1 : 1;

    const skip = (page - 1) * limit;

    // Search filter
    let searchFilter = { user: req.user.id };
    if (search) {
      searchFilter.$or = [
        { title: { $regex: search, $options: "i" } }, // Case-insensitive title search
        { description: { $regex: search, $options: "i" } }, // Case-insensitive description search
      ];
    }

    const tasks = await Task.find(searchFilter)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    const totalTasks = await Task.countDocuments(searchFilter);

    res.json({
      totalTasks,
      totalPages: Math.ceil(totalTasks / limit),
      currentPage: Number(page),
      tasks,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching tasks", error });
  }
});
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { search, status, sortBy, order, page = 1, limit = 5 } = req.query;

    // Sorting options
    let sortOptions = {};
    if (sortBy === "dueDate") sortOptions.dueDate = order === "desc" ? -1 : 1;
    else if (sortBy === "createdAt") sortOptions.createdAt = order === "desc" ? -1 : 1;
    else if (sortBy === "status") sortOptions.isCompleted = order === "desc" ? -1 : 1;

    const skip = (page - 1) * limit;

    // Search and status filter
    let searchFilter = { user: req.user.id };
    if (search) {
      searchFilter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (status) {
      searchFilter.isCompleted = status === "completed";
    }

    const tasks = await Task.find(searchFilter)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    const totalTasks = await Task.countDocuments(searchFilter);

    res.json({
      totalTasks,
      totalPages: Math.ceil(totalTasks / limit),
      currentPage: Number(page),
      tasks,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const { search, sortBy, order, status, page = 1, limit = 5 } = req.query;

    // Sorting options
    let sortOptions = {};
    if (sortBy === "dueDate") sortOptions.dueDate = order === "desc" ? -1 : 1;
    else if (sortBy === "createdAt") sortOptions.createdAt = order === "desc" ? -1 : 1;
    else if (sortBy === "status") sortOptions.isCompleted = order === "desc" ? -1 : 1;

    const skip = (page - 1) * limit;

    // Search filter
    let searchFilter = { user: req.user.id };
    if (search) {
      searchFilter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Status filter
    if (status === "completed") searchFilter.isCompleted = true;
    else if (status === "pending") searchFilter.isCompleted = false;

    const tasks = await Task.find(searchFilter)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    const totalTasks = await Task.countDocuments(searchFilter);

    res.json({
      totalTasks,
      totalPages: Math.ceil(totalTasks / limit),
      currentPage: Number(page),
      tasks,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching tasks", error });
  }
});

module.exports = router;
