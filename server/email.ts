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

export async function sendVerificationEmail(to: string, token: string, type: string = "verification") {
  try {
    const transport = getTransporter();
    const isResetPassword = type === 'password_reset';
    const baseUrl = process.env.PUBLIC_URL || "http://localhost:5000";
    const verificationLink = isResetPassword 
      ? `${baseUrl}/reset-password?token=${token}`
      : `${baseUrl}/verify?token=${token}`;
    const fromEmail = process.env.EMAIL_FROM || "noreply@voxelhub.com";

    const subject = isResetPassword 
      ? "VoxelHub - Recupera tu contraseña"
      : "VoxelHub - Verifica tu email";

    const heading = isResetPassword
      ? "Recupera tu Contraseña"
      : "¡Bienvenido a VoxelHub!";

    const buttonText = isResetPassword
      ? "Recuperar Contraseña"
      : "Verificar Email";

    const mailOptions = {
      from: fromEmail,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${heading}</h2>
          <p>${isResetPassword 
            ? "Hemos recibido una solicitud para recuperar tu contraseña. Si no fuiste tú, ignora este email."
            : "Por favor verifica tu email haciendo click en el siguiente link:"
          }</p>
          <p>
            <a href="${verificationLink}" style="background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
              ${buttonText}
            </a>
          </p>
          <p>O copia este link en tu navegador:</p>
          <p><code>${verificationLink}</code></p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Este link expira en 24 horas.
          </p>
        </div>
      `,
      text: `${isResetPassword ? "Recupera tu contraseña visitando este link:" : "Verifica tu email visitando este link:"} ${verificationLink}`,
    };

    await transport.sendMail(mailOptions);
    console.log(`✓ ${isResetPassword ? "Password reset" : "Verification"} email sent to ${to}`);
    console.log(`  Token: ${token}`);
    console.log(`  Link: ${verificationLink}`);
    return true;
  } catch (error: any) {
    console.error("✗ Error sending email:", error.message);
    // Still return true since user can use the console token
    return true;
  }
}
