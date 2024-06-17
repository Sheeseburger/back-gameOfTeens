const nodemailer = require('nodemailer');

const sendEmail = async options => {
  // create a transporter

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    service: process.env.EMAIL_SERVICE,
    port: 587,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  //Define the email options
  const mailOptions = {
    from: 'Booking',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html ? options.html : ''
  };
  // send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
