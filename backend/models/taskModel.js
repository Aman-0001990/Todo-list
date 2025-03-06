const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  description: { type: String },
  isCompleted: { type: Boolean, default: false },
  category: { 
    type: String, 
    enum: ["Work", "Personal", "Study", "Health", "Other"], 
    default: "Other" 
  },
  dueDate: { type: Date }, // New field for task deadline
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Task", taskSchema);
