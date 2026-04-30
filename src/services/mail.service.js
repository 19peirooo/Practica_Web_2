import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASS,
  },
});

export const sendVerificationEmail = async (email, code) => {
  await transporter.sendMail({
    from: `"BildyApp" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Código de verificación",
    html: `
      <h2>Bienvenido a BildyApp</h2>
      <p>Tu código de verificación es:</p>
      <h1>${code}</h1>
      <p>Este código expira cuando completes la validación.</p>
    `,
  });
};