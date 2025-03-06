
const nodemailer = require("nodemailer");

// Configure the mail transport
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "your-email@gmail.com",
    pass: "your-email-password"
  }
});

// Function to send reminder emails
const sendReminderEmail = async (email, task) => {
  try {
    const mailOptions = {
      from: "your-email@gmail.com",
      to: email,
      subject: `Reminder: Task "${task.title}" is due soon!`,
      text: `Hello,\n\nYour task "${task.title}" is due on ${task.dueDate}.\nPlease make sure to complete it on time.\n\nBest,\nTask Manager`
    };

    await transporter.sendMail(mailOptions);
    console.log(`Reminder sent to ${email} for task: ${task.title}`);
  } catch (error) {
    console.error("Error sending reminder email:", error);
  }
};

module.exports = sendReminderEmail;
