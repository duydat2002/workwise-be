const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const renderTemplate = async (templateName, data) => {
  const filePath = path.join(__dirname, "templates", `${templateName}.ejs`);
  return await ejs.renderFile(filePath, data);
};

const sendMail = async (to, subject, templateName, templateData) => {
  try {
    let html = await renderTemplate(templateName, templateData);

    let info = await transporter.sendMail({
      from: `WorkWise`,
      to: to,
      subject: subject,
      html: html,
    });
    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

// await sendMail(
//   "phamduydat2002@gmail.com",
//   "Welcome to Our App!",
//   "test", // Tên file template
//   {
//     name: "Duy Đạt",
//     isNewUser: true,
//     tips: ["Complete your profile", "Explore our features", "Connect with other users"],
//   }
// );

module.exports = { sendMail };
