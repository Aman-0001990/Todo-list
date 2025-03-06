const cron = require("node-cron");
const Task = require("../models/taskModel");
const User = require("../models/userModel");
const sendReminderEmail = require("./mailer");

// Function to check for tasks due soon
const checkTasksForReminders = async () => {
  try {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1); // 24 hours ahead

    // Find tasks due in the next 24 hours
    const tasks = await Task.find({
      dueDate: { $gte: now, $lte: tomorrow },
      isCompleted: false
    });

    // Send reminders to users
    for (const task of tasks) {
      const user = await User.findById(task.user);
      if (user) {
        await sendReminderEmail(user.email, task);
      }
    }
  } catch (error) {
    console.error("Error checking tasks for reminders:", error);
  }
};

// Schedule the job to run every hour
cron.schedule("0 * * * *", async () => {
  console.log("Checking for tasks due soon...");
  await checkTasksForReminders();
});

module.exports = checkTasksForReminders;
