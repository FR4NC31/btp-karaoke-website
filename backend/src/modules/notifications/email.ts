import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
})

export async function sendEmailOtp(to: string, otp: string) {
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!user || !pass) {
    console.warn('SMTP credentials missing. Mock email OTP outbox fallback:')
    console.log('\n========================================')
    console.log('[EMAIL OTP MOCK] To: ' + to)
    console.log('OTP Code: ' + otp)
    console.log('========================================\n')
    return { success: true, mock: true, otp }
  }

    const from = (() => {
    const raw = process.env.SMTP_FROM?.trim()
    if (raw && /@/.test(raw)) return raw
    return user || 'btp.music.production2024@gmail.com'
  })()

  const mailOptions = {
    from,
    to,
    subject: 'BTP Karaoke Verification Code',
    headers: {
      'X-Priority': '1 (Highest)',
      'X-MSMail-Priority': 'High',
      Importance: 'High',
    },
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Verification Code</title>
        </head>
        <body style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; background-color: #0f1117; color: #f8fafc; padding: 40px 20px; margin: 0;">
          <div style="max-width: 480px; margin: 0 auto; background: #181b22; border: 1px solid #2d333b; border-radius: 12px; padding: 32px; box-shadow: 0 4px 24px rgba(0,0,0,0.4);">
            <h2 style="color: #f8fafc; font-size: 22px; font-weight: 700; margin-top: 0; margin-bottom: 16px; letter-spacing: 0.05em; text-transform: uppercase;">BTP Karaoke Studio</h2>
            <p style="color: #94a3b8; font-size: 15px; line-height: 1.5; margin-bottom: 24px;">Please use the verification code below to verify your email address. This code is valid for 5 minutes.</p>
            <div style="background: #21262d; border: 1px solid #30363d; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
              <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 0.25em; color: #6366f1;">${otp}</span>
            </div>
            <p style="color: #64748b; font-size: 13px; line-height: 1.4; margin: 0;">If you didn't request this verification code, please ignore this email.</p>
          </div>
        </body>
      </html>
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('SMTP transmission error:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to send email via SMTP')
  }
}
