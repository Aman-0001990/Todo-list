const mongoose = require("mongoose");

const taskHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, required: true },
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ["completed", "deleted"], required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("TaskHistory", taskHistorySchema);
