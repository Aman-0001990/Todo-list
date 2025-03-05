const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ["pending", "completed"], default: "pending" },
    isDeleted: { type: Boolean, default: false }, // Soft delete flag
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", TaskSchema);
