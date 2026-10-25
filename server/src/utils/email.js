const nodemailer = require('nodemailer');

let _transporter = null;
const getTransporter = () => {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: (process.env.SMTP_PASS || '').replace(/\s/g, ''),
      },
    });
  }
  return _transporter;
};

const baseTemplate = (content) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Apex Fitness</title>
</head>
<body style="margin:0;padding:0;background-color:#1b1b19;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1b1b19;">
    <tr>
      <td align="center" style="padding:40px 16px 48px;">

        <!-- Wordmark -->
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin-bottom:24px;">
          <tr>
            <td style="text-align:center;">
              <span style="font-size:13px;font-weight:900;color:#f4ede6;letter-spacing:5px;text-transform:uppercase;">APEX</span><span style="font-size:13px;font-weight:900;color:#f9a97b;letter-spacing:5px;text-transform:uppercase;">FITNESS</span>
            </td>
          </tr>
        </table>

        <!-- Card -->
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#1e2621;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">

          <!-- Accent bar -->
          <tr><td style="height:3px;background:linear-gradient(90deg,#215235 0%,#f9a97b 50%,#215235 100%);"></td></tr>

          <!-- Body -->
          <tr>
            <td style="padding:44px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr><td style="height:1px;background-color:rgba(255,255,255,0.06);"></td></tr>
          <tr>
            <td style="padding:24px 44px;background-color:#1b1b19;text-align:center;">
              <p style="margin:0;font-size:12px;color:#7a7570;line-height:1.8;">
                Apex Fitness &bull; Lagos, Nigeria<br>
                You received this because you have an account with us.<br>
                &copy; ${new Date().getFullYear()} Apex Fitness. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const h2 = (text) => `<h2 style="margin:0 0 16px 0;font-size:22px;font-weight:800;color:#f4ede6;letter-spacing:-0.5px;">${text}</h2>`;
const p = (text) => `<p style="margin:0 0 16px 0;font-size:15px;color:rgba(244,237,230,0.75);line-height:1.75;">${text}</p>`;
const highlight = (inner) => `<div style="background-color:#273229;border-left:3px solid #f9a97b;padding:20px 24px;border-radius:8px;margin:24px 0;">${inner}</div>`;
const btn = (href, text) => `<table cellpadding="0" cellspacing="0" style="margin:24px 0 8px;"><tr><td style="border-radius:10px;background-color:#f9a97b;"><a href="${href}" style="display:inline-block;padding:14px 32px;font-size:13px;font-weight:800;color:#1b1b19;text-decoration:none;letter-spacing:1.5px;text-transform:uppercase;border-radius:10px;">${text}</a></td></tr></table>`;

const sendMail = async (to, subject, html, replyTo = null) => {
  const transporter = getTransporter();
  const msg = {
    from: `"${process.env.FROM_NAME || 'Apex Fitness'}" <${process.env.FROM_EMAIL || 'noreply@apexfitness.ng'}>`,
    to,
    subject,
    html,
  };
  if (replyTo) msg.replyTo = replyTo;
  await transporter.sendMail(msg);
};

const sendWelcomeEmail = async (user) => {

  const dashboardUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard`;
  const membershipsUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/memberships`;
  const classesUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/classes`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Apex Fitness, ${user.firstName}</title>
</head>
<body style="margin:0;padding:0;background-color:#1b1b19;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1b1b19;">
    <tr>
      <td align="center" style="padding:40px 16px 48px;">

        <!-- Wordmark -->
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin-bottom:28px;">
          <tr>
            <td style="text-align:center;">
              <span style="font-size:13px;font-weight:900;color:#f4ede6;letter-spacing:5px;text-transform:uppercase;">APEX</span><span style="font-size:13px;font-weight:900;color:#f9a97b;letter-spacing:5px;text-transform:uppercase;">FITNESS</span>
            </td>
          </tr>
        </table>

        <!-- Main card -->
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#1e2621;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">

          <!-- Peach accent bar -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,#215235 0%,#f9a97b 50%,#215235 100%);"></td>
          </tr>

          <!-- Personal hero -->
          <tr>
            <td style="padding:52px 44px 44px;background-color:#1e2621;">

              <!-- Greeting -->
              <p style="margin:0 0 6px 0;font-size:13px;font-weight:700;color:#7a7570;letter-spacing:3px;text-transform:uppercase;">For ${user.firstName} ${user.lastName}</p>
              <h1 style="margin:0 0 24px 0;font-size:38px;font-weight:900;color:#f4ede6;letter-spacing:-1.5px;line-height:1.1;">
                We&rsquo;re genuinely<br>glad you&rsquo;re here.
              </h1>

              <!-- Personal message -->
              <p style="margin:0 0 16px 0;font-size:16px;color:#f4ede6;line-height:1.75;">
                ${user.firstName}, taking that first step - creating this account - is the one that matters most. Everything else flows from here.
              </p>
              <p style="margin:0 0 16px 0;font-size:16px;color:rgba(244,237,230,0.75);line-height:1.75;">
                You didn&rsquo;t sign up for average. You signed up for Apex - and that says something about who you are and where you&rsquo;re going.
              </p>
              <p style="margin:0 0 36px 0;font-size:16px;color:rgba(244,237,230,0.75);line-height:1.75;">
                We have elite trainers, world-class facilities across Nigeria, and a community of people who show up every single day to get better. You belong here.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:10px;background-color:#f9a97b;">
                    <a href="${dashboardUrl}" style="display:inline-block;padding:15px 36px;font-size:14px;font-weight:800;color:#1b1b19;text-decoration:none;letter-spacing:1.5px;text-transform:uppercase;border-radius:10px;">
                      Go to your dashboard &rarr;
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="height:1px;background-color:rgba(255,255,255,0.06);"></td></tr>

          <!-- What happens next -->
          <tr>
            <td style="padding:40px 44px;background-color:#273229;">
              <p style="margin:0 0 28px 0;font-size:12px;font-weight:700;color:#7a7570;letter-spacing:3px;text-transform:uppercase;">Your next three moves</p>

              <!-- Step 1 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td width="48" valign="top" style="padding-right:18px;padding-top:2px;">
                    <div style="width:40px;height:40px;border-radius:50%;background-color:#215235;border:1px solid rgba(249,169,123,0.3);text-align:center;line-height:40px;font-size:16px;font-weight:900;color:#f9a97b;">1</div>
                  </td>
                  <td valign="top">
                    <p style="margin:0 0 3px 0;font-size:15px;font-weight:700;color:#f4ede6;">Pick your plan</p>
                    <p style="margin:0;font-size:13px;color:#7a7570;line-height:1.6;">Monthly, quarterly, or annual - there&rsquo;s a plan built around your life and your goals.</p>
                    <a href="${membershipsUrl}" style="display:inline-block;margin-top:8px;font-size:12px;font-weight:700;color:#f9a97b;text-decoration:none;letter-spacing:0.5px;">View plans &rarr;</a>
                  </td>
                </tr>
              </table>

              <!-- Step 2 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td width="48" valign="top" style="padding-right:18px;padding-top:2px;">
                    <div style="width:40px;height:40px;border-radius:50%;background-color:#1e2621;border:1px solid rgba(255,255,255,0.08);text-align:center;line-height:40px;font-size:16px;font-weight:900;color:rgba(244,237,230,0.4);">2</div>
                  </td>
                  <td valign="top">
                    <p style="margin:0 0 3px 0;font-size:15px;font-weight:700;color:#f4ede6;">Book your first class</p>
                    <p style="margin:0;font-size:13px;color:#7a7570;line-height:1.6;">HIIT, strength, yoga, boxing - over 50 classes a week. Find one that excites you.</p>
                    <a href="${classesUrl}" style="display:inline-block;margin-top:8px;font-size:12px;font-weight:700;color:#f9a97b;text-decoration:none;letter-spacing:0.5px;">Browse classes &rarr;</a>
                  </td>
                </tr>
              </table>

              <!-- Step 3 -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="48" valign="top" style="padding-right:18px;padding-top:2px;">
                    <div style="width:40px;height:40px;border-radius:50%;background-color:#1e2621;border:1px solid rgba(255,255,255,0.08);text-align:center;line-height:40px;font-size:16px;font-weight:900;color:rgba(244,237,230,0.4);">3</div>
                  </td>
                  <td valign="top">
                    <p style="margin:0 0 3px 0;font-size:15px;font-weight:700;color:#f4ede6;">Just show up</p>
                    <p style="margin:0;font-size:13px;color:#7a7570;line-height:1.6;">That&rsquo;s the whole secret. Your trainer is ready. The class is waiting. All that&rsquo;s left is you.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="height:1px;background-color:rgba(255,255,255,0.06);"></td></tr>

          <!-- Closing message -->
          <tr>
            <td style="padding:40px 44px;background-color:#1e2621;">
              <p style="margin:0 0 12px 0;font-size:22px;font-weight:900;color:#f4ede6;letter-spacing:-0.5px;line-height:1.4;">
                &ldquo;The only bad workout is the one that didn&rsquo;t happen.&rdquo;
              </p>
              <p style="margin:0;font-size:14px;color:#7a7570;line-height:1.7;">
                We&rsquo;ll be with you every rep, every class, every milestone. Welcome to the family, <strong style="color:#f9a97b;">${user.firstName}</strong>.
              </p>
            </td>
          </tr>

          <!-- Peach divider -->
          <tr><td style="height:1px;background-color:rgba(249,169,123,0.12);"></td></tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 44px;background-color:#1b1b19;text-align:center;">
              <p style="margin:0;font-size:12px;color:#7a7570;line-height:1.8;">
                Apex Fitness &bull; Lagos, Nigeria<br>
                You received this because you just created an account with us.<br>
                &copy; ${new Date().getFullYear()} Apex Fitness. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

  await sendMail(user.email, `${user.firstName}, welcome to Apex Fitness. Let's get to work.`, html);
};

const sendPasswordOtp = async (user, otp) => {
  const digitBoxes = String(otp).split('').map((d) =>
    `<td style="padding:0 5px;">
      <div style="width:48px;height:60px;background-color:#273229;border:1.5px solid #f9a97b;border-radius:10px;
                  text-align:center;line-height:60px;font-size:28px;font-weight:900;color:#f9a97b;
                  font-family:'Courier New','Lucida Console',monospace;">${d}</div>
    </td>`
  ).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your reset code</title>
</head>
<body style="margin:0;padding:0;background-color:#1b1b19;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1b1b19;">
    <tr>
      <td align="center" style="padding:40px 16px 48px;">

        <!-- Wordmark -->
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin-bottom:24px;">
          <tr>
            <td style="text-align:center;">
              <span style="font-size:13px;font-weight:900;color:#f4ede6;letter-spacing:5px;text-transform:uppercase;">APEX</span><span style="font-size:13px;font-weight:900;color:#f9a97b;letter-spacing:5px;text-transform:uppercase;">FITNESS</span>
            </td>
          </tr>
        </table>

        <!-- Card -->
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#1e2621;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">

          <!-- Accent bar -->
          <tr><td style="height:3px;background:linear-gradient(90deg,#215235 0%,#f9a97b 50%,#215235 100%);"></td></tr>

          <!-- Header -->
          <tr>
            <td style="padding:44px 44px 32px;">
              <p style="margin:0 0 6px 0;font-size:12px;font-weight:700;color:#7a7570;letter-spacing:3px;text-transform:uppercase;">Password reset</p>
              <h1 style="margin:0 0 16px 0;font-size:30px;font-weight:900;color:#f4ede6;letter-spacing:-1px;line-height:1.15;">
                Here&rsquo;s your<br>reset code, ${user.firstName}.
              </h1>
              <p style="margin:0;font-size:15px;color:rgba(244,237,230,0.65);line-height:1.7;">
                Enter the 6-digit code below on the verification screen. It&rsquo;s only valid for <strong style="color:#f9a97b;">15 minutes</strong> and can be used once.
              </p>
            </td>
          </tr>

          <!-- Digit boxes -->
          <tr>
            <td style="padding:0 44px 40px;">
              <table cellpadding="0" cellspacing="0">
                <tr>${digitBoxes}</tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="height:1px;background-color:rgba(255,255,255,0.06);margin:0 44px;"></td></tr>

          <!-- Security note -->
          <tr>
            <td style="padding:28px 44px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="32" valign="top" style="padding-right:14px;padding-top:2px;">
                    <div style="width:32px;height:32px;border-radius:50%;background-color:#273229;border:1px solid rgba(249,169,123,0.2);text-align:center;line-height:32px;font-size:14px;">&#128274;</div>
                  </td>
                  <td valign="top">
                    <p style="margin:0 0 4px 0;font-size:13px;font-weight:700;color:#f4ede6;">Security notice</p>
                    <p style="margin:0;font-size:13px;color:#7a7570;line-height:1.65;">
                      If you didn&rsquo;t request this, your account is safe - just ignore this email.
                      Never share this code with anyone, including Apex Fitness staff.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr><td style="height:1px;background-color:rgba(255,255,255,0.06);"></td></tr>
          <tr>
            <td style="padding:24px 44px;background-color:#1b1b19;text-align:center;">
              <p style="margin:0;font-size:12px;color:#7a7570;line-height:1.8;">
                Apex Fitness &bull; Lagos, Nigeria<br>
                &copy; ${new Date().getFullYear()} Apex Fitness. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await sendMail(user.email, `${user.firstName}, your Apex Fitness reset code`, html);
};

const detailRow = (label, value, accent = false) =>
  `<tr>
    <td style="padding:9px 0;font-size:12px;color:#7a7570;text-transform:uppercase;letter-spacing:1.5px;width:38%;vertical-align:top;border-bottom:1px solid rgba(255,255,255,0.05);">${label}</td>
    <td style="padding:9px 0;font-size:14px;font-weight:600;color:${accent ? '#f9a97b' : '#f4ede6'};border-bottom:1px solid rgba(255,255,255,0.05);word-break:break-all;overflow-wrap:break-word;">${value}</td>
  </tr>`;

const sendBookingConfirmation = async (user, booking, classInfo) => {
  const trainer = classInfo.Trainer || classInfo.trainer;
  const trainerUser = trainer?.User || trainer?.user;
  const trainerName = trainerUser
    ? `${trainerUser.firstName} ${trainerUser.lastName}`
    : 'TBA';

  const location = classInfo.Location || classInfo.location;
  const locationName = location?.name || 'TBA';

  const html = baseTemplate(`
    ${h2('Your booking is confirmed.')}
    ${p(`${user.firstName}, you&rsquo;re all set. We&rsquo;ll see you there.`)}
    <div style="background-color:#273229;border-left:3px solid #f9a97b;padding:20px 24px;border-radius:8px;margin:24px 0;">
      <p style="margin:0 0 16px 0;font-size:17px;font-weight:800;color:#f9a97b;">${classInfo.name}</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${detailRow('Date', classInfo.date)}
        ${detailRow('Time', `${classInfo.startTime} - ${classInfo.endTime}`)}
        ${detailRow('Location', locationName)}
        ${detailRow('Trainer', trainerName)}
        ${detailRow('Type', classInfo.classType?.toUpperCase() || 'CLASS', true)}
      </table>
    </div>
    ${p('Arrive 10 minutes early. Bring water and your energy.')}
  `);
  await sendMail(user.email, `You&rsquo;re booked: ${classInfo.name}`, html);
};

const sendBookingCancellation = async (user, booking, classInfo) => {
  const html = baseTemplate(`
    ${h2('Booking cancelled.')}
    ${p(`${user.firstName}, your spot in the following class has been cancelled.`)}
    <div style="background-color:#273229;border-left:3px solid rgba(255,255,255,0.15);padding:20px 24px;border-radius:8px;margin:24px 0;">
      <p style="margin:0 0 16px 0;font-size:16px;font-weight:700;color:#f4ede6;">${classInfo.name}</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${detailRow('Date', classInfo.date)}
        ${detailRow('Time', `${classInfo.startTime} - ${classInfo.endTime}`)}
      </table>
    </div>
    ${p('If this was a mistake, rebook the class from your dashboard as long as spots are available.')}
    ${p('See you at the next one.')}
  `);
  await sendMail(user.email, `Booking cancelled: ${classInfo.name}`, html);
};

const sendWaitlistNotification = async (user, classInfo) => {
  const classUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/classes/${classInfo.id}`;
  const html = baseTemplate(`
    ${h2('A spot just opened up.')}
    ${p(`${user.firstName}, someone dropped out of a class you were waiting for. Move fast - spots go quickly.`)}
    <div style="background-color:#273229;border-left:3px solid #f9a97b;padding:20px 24px;border-radius:8px;margin:24px 0;">
      <p style="margin:0 0 16px 0;font-size:17px;font-weight:800;color:#f9a97b;">${classInfo.name}</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${detailRow('Date', classInfo.date)}
        ${detailRow('Time', `${classInfo.startTime} - ${classInfo.endTime}`)}
      </table>
    </div>
    ${btn(classUrl, 'Book now →')}
  `);
  await sendMail(user.email, `Spot available: ${classInfo.name}`, html);
};

const sendPaymentReceipt = async (user, payment) => {
  const amount = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(payment.amount);
  const date = new Date(payment.createdAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });
  const html = baseTemplate(`
    ${h2('Payment received.')}
    ${p(`${user.firstName}, your payment went through. Here&rsquo;s your receipt.`)}
    <div style="background-color:#273229;border-left:3px solid #f9a97b;padding:20px 24px;border-radius:8px;margin:24px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${detailRow('Amount', amount, true)}
        ${detailRow('Reference', payment.paystackReference)}
        ${detailRow('Type', (payment.type || '').replace(/_/g, ' '))}
        ${detailRow('Description', payment.description || 'Apex Fitness Payment')}
        ${detailRow('Date', date)}
      </table>
    </div>
    ${p('Keep pushing. You&rsquo;re investing in the best version of yourself.')}
  `);
  await sendMail(user.email, 'Payment receipt - Apex Fitness', html);
};

const sendMembershipActivation = async (user, plan, subscription) => {
  const startDate = new Date(subscription.startDate).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });
  const endDate   = new Date(subscription.endDate).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });
  const membershipUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/membership`;

  const billingLabel = plan.billingCycle === 'monthly' ? 'Monthly' : plan.billingCycle === 'quarterly' ? 'Quarterly' : 'Annual';

  const featuresHtml = plan.features && plan.features.length > 0
    ? `<tr><td colspan="2" style="padding:12px 0 4px;">
         <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#7a7570;letter-spacing:2px;text-transform:uppercase;">What&rsquo;s included</p>
         ${plan.features.map(f => `<p style="margin:0 0 6px;font-size:14px;color:rgba(244,237,230,0.75);">&#10003;&nbsp; ${f}</p>`).join('')}
       </td></tr>`
    : '';

  const memberNumberRow = user.memberNumber != null
    ? detailRow('Member ID', String(100000 + user.memberNumber), true)
    : '';

  const html = baseTemplate(`
    ${h2(`${user.firstName}, you&rsquo;re in.`)}
    ${p(`Your <strong style="color:#f9a97b;">${plan.name}</strong> membership is now active. The gym is yours.`)}
    <div style="background-color:#273229;border-left:3px solid #f9a97b;padding:20px 24px;border-radius:8px;margin:24px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${memberNumberRow}
        ${detailRow('Plan', plan.name, true)}
        ${detailRow('Billing', billingLabel)}
        ${detailRow('Active from', startDate)}
        ${detailRow('Renews on', endDate)}
        ${featuresHtml}
      </table>
    </div>
    ${p('Show this member ID at reception when you first visit. Everything else is ready for you.')}
    ${btn(membershipUrl, 'View membership →')}
  `);
  await sendMail(user.email, `${user.firstName}, your Apex Fitness membership is active`, html);
};

const sendMembershipExpiry = async (user, subscription) => {
  const expiryDate = new Date(subscription.endDate).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });
  const renewUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/memberships`;
  const html = baseTemplate(`
    ${h2('Your membership is expiring soon.')}
    ${p(`${user.firstName}, your Apex Fitness membership ends on <strong style="color:#f9a97b;">${expiryDate}</strong>. Renew now to keep training without a break.`)}
    <div style="background-color:#273229;border-left:3px solid #f9a97b;padding:20px 24px;border-radius:8px;margin:24px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${detailRow('Plan', subscription.plan?.name || 'Your plan')}
        ${detailRow('Expires', expiryDate, true)}
      </table>
    </div>
    ${p('Don&rsquo;t let momentum slip. Renew and keep going.')}
    ${btn(renewUrl, 'Renew membership →')}
  `);
  await sendMail(user.email, 'Your Apex Fitness membership expires soon', html);
};

const sendBillingReminder = async (user, subscription, plan) => {
  const billingDate = new Date(subscription.nextBillingDate).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });
  const amount = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(plan.price);
  const membershipUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/membership`;

  const html = baseTemplate(`
    ${h2('Your next charge is coming up.')}
    ${p(`${user.firstName}, just a heads-up - your <strong style="color:#f9a97b;">${plan.name}</strong> renewal is scheduled for <strong style="color:#f9a97b;">${billingDate}</strong>.`)}
    <div style="background-color:#273229;border-left:3px solid #f9a97b;padding:20px 24px;border-radius:8px;margin:24px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${detailRow('Plan', plan.name, true)}
        ${detailRow('Amount', amount, true)}
        ${detailRow('Charge date', billingDate)}
      </table>
    </div>
    ${p('Your card on file will be charged automatically. If you need to cancel or update your card, do it before the charge date.')}
    ${btn(membershipUrl, 'Manage membership →')}
  `);
  await sendMail(user.email, `${user.firstName}, your Apex Fitness renewal is in 3 days`, html);
};

const sendPaymentFailed = async (user, subscription) => {
  const gracePeriodEnds = new Date(subscription.gracePeriodEnds).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });
  const profileUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/profile`;

  const html = baseTemplate(`
    ${h2('Your payment didn&rsquo;t go through.')}
    ${p(`${user.firstName}, we tried to charge your card for your membership renewal but the payment failed.`)}
    <div style="background-color:rgba(255,68,68,0.08);border-left:3px solid #ff4444;padding:20px 24px;border-radius:8px;margin:24px 0;">
      <p style="margin:0;font-size:14px;color:rgba(244,237,230,0.85);line-height:1.7;">
        Your membership access will be suspended on <strong style="color:#ff6666;">${gracePeriodEnds}</strong> if the payment issue isn&rsquo;t resolved.
      </p>
    </div>
    ${p('Update your card details to keep your membership active. Your access remains intact until the date above.')}
    ${btn(profileUrl, 'Update card →')}
  `);
  await sendMail(user.email, 'Action required: Your Apex Fitness payment failed', html);
};

const sendCardExpiring = async (user) => {
  const profileUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/profile`;
  const expiryDisplay = user.cardExpMonth && user.cardExpYear
    ? `${user.cardExpMonth}/${user.cardExpYear}`
    : 'this month';

  const html = baseTemplate(`
    ${h2('Your card is expiring soon.')}
    ${p(`${user.firstName}, the card we have on file (**** **** **** ${user.cardLast4 || '????'}) expires ${expiryDisplay}.`)}
    ${p('Update your card now to avoid any disruption to your membership when your next billing date arrives.')}
    ${btn(profileUrl, 'Update card →')}
  `);
  await sendMail(user.email, 'Your Apex Fitness card is expiring soon', html);
};

const sendPTAssigned = async (user, trainer) => {
  const trainerUser = trainer.User || trainer.user;
  const trainerName = trainerUser
    ? `${trainerUser.firstName} ${trainerUser.lastName}`
    : 'Your trainer';
  const dashboardUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard`;

  const html = baseTemplate(`
    ${h2('You&rsquo;ve been matched with a trainer.')}
    ${p(`${user.firstName}, great news - <strong style="color:#f9a97b;">${trainerName}</strong> has been assigned as your personal trainer.`)}
    ${highlight(`
      <p style="margin:0 0 4px 0;font-size:13px;font-weight:700;color:#f9a97b;">Next step</p>
      <p style="margin:0;font-size:14px;color:rgba(244,237,230,0.75);line-height:1.7;">
        Speak to the front desk or your trainer directly to schedule your first session. PT sessions are paid offline at the gym.
      </p>
    `)}
    ${p('Your trainer will appear on your dashboard so you always know who to look for.')}
    ${btn(dashboardUrl, 'View dashboard →')}
  `);
  await sendMail(user.email, `${user.firstName}, your personal trainer has been assigned`, html);
};

const sendContactEmail = async ({ name, email, phone, message }) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  if (!adminEmail) return;

  const html = baseTemplate(`
    ${h2('New contact form submission')}
    ${p('Someone reached out through the Apex Fitness website.')}
    <div style="background-color:#273229;border-left:3px solid #f9a97b;padding:20px 24px;border-radius:8px;margin:24px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${detailRow('Name', name)}
        ${detailRow('Email', `<a href="mailto:${email}" style="color:#f9a97b;">${email}</a>`)}
        ${phone ? detailRow('Phone', phone) : ''}
      </table>
    </div>
    <div style="background-color:#273229;border-radius:8px;padding:20px 24px;margin:16px 0;">
      <p style="margin:0 0 8px 0;font-size:11px;font-weight:700;color:#7a7570;letter-spacing:2px;text-transform:uppercase;">Message</p>
      <p style="margin:0;font-size:14px;color:rgba(244,237,230,0.75);line-height:1.75;">${message.replace(/\n/g, '<br>')}</p>
    </div>
    ${p(`Reply to this email to respond directly to ${name}.`)}
  `);

  await sendMail(adminEmail, `[Contact] ${name} - ${email}`, html, email);
};

module.exports = {
  getTransporter,
  sendMail,
  sendWelcomeEmail,
  sendPasswordOtp,
  sendBookingConfirmation,
  sendBookingCancellation,
  sendWaitlistNotification,
  sendPaymentReceipt,
  sendMembershipActivation,
  sendMembershipExpiry,
  sendBillingReminder,
  sendPaymentFailed,
  sendCardExpiring,
  sendPTAssigned,
  sendContactEmail,
};
