const { Resend } = require('resend');

const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 'your_resend_api_key') {
    throw new Error('RESEND_API_KEY is not configured. Get a free key at https://resend.com');
  }
  return new Resend(apiKey);
};

const sendPasswordResetEmail = async ({ to, resetUrl, name }) => {
  const resend = getResend();

  await resend.emails.send({
    from: 'SmartConstruct AI <onboarding@resend.dev>',
    to,
    subject: 'SmartConstruct AI — Password Reset Request',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#1a56db;padding:32px 40px;border-radius:12px 12px 0 0;text-align:center;">
            <div style="display:inline-flex;align-items:center;gap:10px;">
              <div style="width:40px;height:40px;background:rgba(255,255,255,0.2);border-radius:8px;display:inline-flex;align-items:center;justify-content:center;">
                <span style="color:#fff;font-size:20px;font-weight:800;">S</span>
              </div>
              <div style="text-align:left;">
                <div style="color:#fff;font-size:20px;font-weight:700;line-height:1.2;">SmartConstruct AI</div>
                <div style="color:#bfdbfe;font-size:12px;">Construction Delay Prediction Platform</div>
              </div>
            </div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:40px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
            <h2 style="color:#0f172a;margin:0 0 8px;font-size:22px;font-weight:700;">Password Reset Request</h2>
            <p style="color:#475569;margin:0 0 24px;font-size:15px;line-height:1.6;">Hello <strong>${name || 'User'}</strong>,</p>
            <p style="color:#475569;margin:0 0 32px;font-size:15px;line-height:1.6;">
              We received a request to reset the password for your SmartConstruct AI account.
              Click the button below to choose a new password.
            </p>

            <!-- CTA Button -->
            <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 32px;">
              <tr>
                <td align="center">
                  <a href="${resetUrl}"
                     style="background:#1a56db;color:#ffffff;padding:16px 40px;text-decoration:none;
                            border-radius:8px;font-weight:600;font-size:15px;display:inline-block;
                            letter-spacing:0.3px;">
                    Reset My Password
                  </a>
                </td>
              </tr>
            </table>

            <!-- Link fallback -->
            <p style="color:#94a3b8;font-size:13px;margin:0 0 16px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="margin:0 0 32px;">
              <a href="${resetUrl}" style="color:#1a56db;font-size:13px;word-break:break-all;">${resetUrl}</a>
            </p>

            <!-- Warnings -->
            <table cellpadding="0" cellspacing="0" width="100%"
                   style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-bottom:32px;">
              <tr>
                <td style="padding:16px;">
                  <p style="color:#92400e;font-size:13px;margin:0 0 6px;font-weight:600;">⚠ Important</p>
                  <p style="color:#92400e;font-size:13px;margin:0;">
                    This link expires in <strong>1 hour</strong>. If you did not request this reset,
                    you can safely ignore this email — your password will not change.
                  </p>
                </td>
              </tr>
            </table>

            <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 24px;">
            <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">
              © 2026 SmartConstruct AI · All rights reserved
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
    `,
  });
};

const sendWelcomeEmail = async ({ to, name, role, code }) => {
  const resend = getResend();
  const isAdmin = role === 'admin';

  await resend.emails.send({
    from: 'SmartConstruct AI <onboarding@resend.dev>',
    to,
    subject: isAdmin
      ? 'SmartConstruct AI — Admin Account Created'
      : 'SmartConstruct AI — Welcome!',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:${isAdmin ? '#dc2626' : '#1a56db'};padding:32px 40px;border-radius:12px 12px 0 0;text-align:center;">
            <div style="color:#fff;font-size:22px;font-weight:700;">SmartConstruct AI</div>
            <div style="color:${isAdmin ? '#fecaca' : '#bfdbfe'};font-size:13px;margin-top:4px;">
              ${isAdmin ? '🛡 Admin Account Activated' : 'Construction Delay Prediction Platform'}
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:40px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
            <h2 style="color:#0f172a;margin:0 0 16px;font-size:22px;">
              Welcome, ${name}!
            </h2>
            <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
              ${isAdmin
                ? `Your <strong>administrator account</strong> has been successfully created using invite code <strong>${code}</strong>.`
                : 'Your SmartConstruct AI account has been created successfully.'}
            </p>
            ${isAdmin ? `
            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-bottom:24px;">
              <p style="color:#991b1b;font-size:13px;margin:0;font-weight:600;">Admin Access Granted</p>
              <p style="color:#991b1b;font-size:13px;margin:8px 0 0;">
                You have full platform access. Keep your credentials secure and never share your admin code.
              </p>
            </div>` : ''}
            <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 32px;">
              You can now log in at <a href="${process.env.CLIENT_URL}/login" style="color:#1a56db;">${process.env.CLIENT_URL}/login</a>
            </p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 24px;">
            <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">
              © 2026 SmartConstruct AI · All rights reserved
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
};

const sendOtpEmail = async ({ to, otp, name }) => {
  const resend = getResend();

  await resend.emails.send({
    from: 'SmartConstruct AI <onboarding@resend.dev>',
    to,
    subject: 'SmartConstruct AI — Your Password Reset OTP',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:#1a56db;padding:32px 40px;border-radius:12px 12px 0 0;text-align:center;">
            <div style="color:#fff;font-size:22px;font-weight:700;">SmartConstruct AI</div>
            <div style="color:#bfdbfe;font-size:13px;margin-top:4px;">Construction Delay Prediction Platform</div>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:40px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
            <h2 style="color:#0f172a;margin:0 0 8px;font-size:22px;font-weight:700;">Password Reset OTP</h2>
            <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
              Hello <strong>${name || 'User'}</strong>, use the code below to reset your password.
            </p>

            <!-- OTP box -->
            <div style="text-align:center;margin:32px 0;">
              <div style="display:inline-block;background:#eff6ff;border:2px solid #1a56db;border-radius:12px;padding:20px 48px;">
                <div style="font-size:42px;font-weight:900;letter-spacing:12px;color:#1a56db;font-family:monospace;">${otp}</div>
              </div>
            </div>

            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-bottom:32px;">
              <p style="color:#92400e;font-size:13px;margin:0;font-weight:600;">⚠ Important</p>
              <p style="color:#92400e;font-size:13px;margin:8px 0 0;">
                This code expires in <strong>15 minutes</strong>. Do not share it with anyone.
                If you did not request this, you can safely ignore this email.
              </p>
            </div>

            <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 24px;">
            <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">
              © 2026 SmartConstruct AI · All rights reserved
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
};

module.exports = { sendPasswordResetEmail, sendWelcomeEmail, sendOtpEmail };
