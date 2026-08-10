// services/emailService.js
// Service using Nodemailer to dispatch confirmation emails on tour registrations

const nodemailer = require('nodemailer');
const twilio = require('twilio');

/**
 * Sends a booking confirmation email to the user.
 * @param {Object} user - User mongoose object containing email and name.
 * @param {Object} booking - Booking mongoose object containing ID, date, and numberOfPeople.
 * @param {Object} site - Site mongoose object containing name and region.
 */
const sendBookingConfirmation = async (user, booking, site) => {
  // Check if SMTP credentials exist, else fallback to console logging
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('WARNING: EMAIL_USER or EMAIL_PASS not set in environment variables. Email confirmation skipped or mocked.');
    console.log('--- Mock Email Dispatch ---');
    console.log(`To: ${user.email}`);
    console.log(`Subject: ✅ Booking Confirmed — ${site.name}`);
    console.log(`Content: Assalam o Alaikum, ${user.name}! Your booking for ${site.name} is confirmed. Booking ID: ${booking._id.toString().substring(0, 8).toUpperCase()}`);
    console.log('---------------------------');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // TLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const formattedDate = new Date(booking.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const bookingId = booking._id.toString().substring(0, 8).toUpperCase();

  const mailOptions = {
    from: `"HeritageAI Pakistan" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `✅ Booking Confirmed — ${site.name}`,
    html: `
      <div style="font-family: 'Outfit', -apple-system, sans-serif; background-color: #141618; color: #EDE9DF; padding: 40px 20px; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid #3D494F;">
        <div style="background-color: #1D9E75; padding: 24px; text-align: center; border-radius: 12px 12px 0 0; margin-bottom: 30px;">
          <h1 style="color: #ffffff; margin: 0; font-family: 'Libre Baskerville', Georgia, serif; font-size: 26px; font-weight: bold;">HeritageAI Pakistan</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0 0; font-size: 13px; letter-spacing: 0.05em; text-transform: uppercase;">Archaeological Expedition Confirmation</p>
        </div>
        
        <div style="padding: 0 16px;">
          <h2 style="font-family: 'Libre Baskerville', serif; color: #EDE9DF; font-size: 18px; font-weight: bold; margin-bottom: 12px;">Assalam o Alaikum, ${user.name}!</h2>
          <p style="font-size: 14px; color: #C8B89A; line-height: 1.6; margin-bottom: 24px;">Your tour booking has been successfully confirmed. A summary of your journey coordinates and ticket parameters can be found below:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; background-color: #23282D; border: 1px solid #3D494F; border-radius: 12px; overflow: hidden;">
            <thead>
              <tr style="background-color: rgba(61, 73, 79, 0.4);">
                <th style="text-align: left; padding: 14px 18px; border-bottom: 1px solid #3D494F; color: #C8B89A; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">Parameter</th>
                <th style="text-align: right; padding: 14px 18px; border-bottom: 1px solid #3D494F; color: #C8B89A; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 14px 18px; border-bottom: 1px solid rgba(61, 73, 79, 0.5); color: #C8B89A; font-size: 13px;">Site Name</td>
                <td style="padding: 14px 18px; border-bottom: 1px solid rgba(61, 73, 79, 0.5); text-align: right; color: #EDE9DF; font-size: 13px; font-weight: bold;">${site.name}</td>
              </tr>
              <tr>
                <td style="padding: 14px 18px; border-bottom: 1px solid rgba(61, 73, 79, 0.5); color: #C8B89A; font-size: 13px;">Region</td>
                <td style="padding: 14px 18px; border-bottom: 1px solid rgba(61, 73, 79, 0.5); text-align: right; color: #EDE9DF; font-size: 13px;">${site.region}</td>
              </tr>
              <tr>
                <td style="padding: 14px 18px; border-bottom: 1px solid rgba(61, 73, 79, 0.5); color: #C8B89A; font-size: 13px;">Expedition Date</td>
                <td style="padding: 14px 18px; border-bottom: 1px solid rgba(61, 73, 79, 0.5); text-align: right; color: #EDE9DF; font-size: 13px;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 14px 18px; border-bottom: 1px solid rgba(61, 73, 79, 0.5); color: #C8B89A; font-size: 13px;">Guests Count</td>
                <td style="padding: 14px 18px; border-bottom: 1px solid rgba(61, 73, 79, 0.5); text-align: right; color: #EDE9DF; font-size: 13px;">${booking.numberOfPeople} traveler(s)</td>
              </tr>
              <tr>
                <td style="padding: 14px 18px; border-bottom: 1px solid rgba(61, 73, 79, 0.5); color: #C8B89A; font-size: 13px;">Booking ID</td>
                <td style="padding: 14px 18px; border-bottom: 1px solid rgba(61, 73, 79, 0.5); text-align: right; color: #EDE9DF; font-family: monospace; font-size: 13px; letter-spacing: 0.05em;">#${bookingId}</td>
              </tr>
              <tr>
                <td style="padding: 14px 18px; color: #C8B89A; font-size: 13px;">Booking Status</td>
                <td style="padding: 14px 18px; text-align: right; color: #1D9E75; font-size: 13px; font-weight: bold;">Confirmed ✅</td>
              </tr>
            </tbody>
          </table>
          
          <div style="text-align: center; margin-top: 30px; border-top: 1px solid #3D494F; padding-top: 24px;">
            <p style="font-family: 'Libre Baskerville', serif; font-size: 14px; color: #C8B89A; font-style: italic; margin: 0 0 4px 0;">Safe travels!</p>
            <p style="font-size: 12px; color: #C8B89A; margin: 0; font-weight: 300;">— HeritageAI Pakistan Team</p>
          </div>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

const sendAdminNotification = async (booking, site, user) => {
  console.log(`[Admin Notification] New Booking confirmed for site: ${site.name} by ${user.name}`);
};

async function sendWhatsAppNotification(booking, site, user) {
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )

    const message = `
🏛️ *New Booking — HeritageAI Pakistan*

*Site:* ${site.name}
*Region:* ${site.region}
*Date:* ${new Date(booking.date).toDateString()}
*Guests:* ${booking.numberOfPeople}
*Total Paid:* PKR ${booking.totalAmount}

*Customer Details:*
👤 ${user.name}
📧 ${booking.contactEmail || user.email}
📱 ${booking.phone || 'N/A'}

*Booking ID:* #${booking._id.toString().slice(0,8).toUpperCase()}
*Status:* Confirmed ✅
    `.trim()

    await client.messages.create({
      from: 'whatsapp:+14155238886',
      to: `whatsapp:${process.env.ADMIN_PHONE}`,
      body: message
    })

    console.log('✅ WhatsApp notification sent')
  } catch (err) {
    console.error('WhatsApp notification failed:', err.message)
  }
}

module.exports = { 
  sendBookingConfirmation,
  sendAdminNotification,
  sendWhatsAppNotification
};
