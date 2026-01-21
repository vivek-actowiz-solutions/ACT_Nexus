const nodemailer = require("nodemailer");
const email = process.env.EMAIL_SEND;
const password = process.env.EMAIL_PASSWORD;
// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: email,
    pass: password,
  },
});

// Send email function
const sendMail = async ({ to = [], cc = [], subject, html }) => {
  const mailOptions = {
    from: email,
    to: to.join(","), // string | array
    cc: cc.join(","), // optional
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.response);
    return true;
  } catch (err) {
    console.error("❌ Error sending email:", err);
    return false;
  }
};

module.exports = sendMail;
