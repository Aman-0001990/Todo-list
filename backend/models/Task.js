const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  description: { type: String },
  isDeleted: { type: Boolean, default: false },
  dueDate: { type: Date }, // New Field
  priority: { 
    type: String, 
    enum: ["High", "Medium", "Low"], 
    default: "Medium" 
  } // New Field
}, { timestamps: true });

const Task = mongoose.model("Task", TaskSchema);
module.exports = Task;
