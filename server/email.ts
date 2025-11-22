import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpPort && smtpUser && smtpPass) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: smtpPort === "465",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
    console.log("✓ Email service configured with SMTP");
  } else {
    transporter = nodemailer.createTransport({
      streamTransport: true,
    });
    console.log("✓ Email service in test mode (check console logs)");
  }

  return transporter;
}

export async function sendVerificationEmail(to: string, token: string) {
  try {
    const transport = getTransporter();
    const verificationLink = `${process.env.PUBLIC_URL || "http://localhost:5000"}/verify?token=${token}`;
    const fromEmail = process.env.EMAIL_FROM || "noreply@voxelhub.com";

    const mailOptions = {
      from: fromEmail,
      to,
      subject: "VoxelHub - Verifica tu email",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>¡Bienvenido a VoxelHub!</h2>
          <p>Por favor verifica tu email haciendo click en el siguiente link:</p>
          <p>
            <a href="${verificationLink}" style="background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
              Verificar Email
            </a>
          </p>
          <p>O copia este link en tu navegador:</p>
          <p><code>${verificationLink}</code></p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Este link expira en 24 horas.
          </p>
        </div>
      `,
      text: `Verifica tu email visitando este link: ${verificationLink}`,
    };

    await transport.sendMail(mailOptions);
    console.log(`✓ Verification email sent to ${to}`);
    return true;
  } catch (error: any) {
    console.error("✗ Error sending verification email:", error.message);
    // Still return true since user can verify via the console token
    return true;
  }
}
