const crypto = require('crypto');
const { Op } = require('sequelize');
const { PTRequest, PTPlan, User, Subscription } = require('../models');
const { sendMail } = require('../utils/email');
const { getSetting } = require('./settingService');

const err = (message, statusCode) => Object.assign(new Error(message), { statusCode });

const hasActiveMembership = async (userId) => {
  const today = new Date().toISOString().split('T')[0];
  const membership = await Subscription.findOne({
    where: { userId, status: 'active', endDate: { [Op.gte]: today } },
  });
  return !!membership;
};

const sendPTRequestNotification = async (member, ptRequest) => {
  const notifEmail = await getSetting('receptionist_notification_email').catch(() => '');
  let toEmail = notifEmail || '';
  if (!toEmail) {
    const receptionist = await User.findOne({ where: { role: 'receptionist' } });
    if (!receptionist) return;
    toEmail = receptionist.email;
  }
  if (!toEmail) return;

  const amount = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(ptRequest.totalAmount);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New PT Request</title>
</head>
<body style="margin:0;padding:0;background-color:#1b1b19;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1b1b19;">
    <tr>
      <td align="center" style="padding:40px 16px 48px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin-bottom:24px;">
          <tr>
            <td style="text-align:center;">
              <span style="font-size:13px;font-weight:900;color:#f4ede6;letter-spacing:5px;text-transform:uppercase;">APEX</span><span style="font-size:13px;font-weight:900;color:#f9a97b;letter-spacing:5px;text-transform:uppercase;">FITNESS</span>
            </td>
          </tr>
        </table>
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#1e2621;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">
          <tr><td style="height:3px;background:linear-gradient(90deg,#215235 0%,#f9a97b 50%,#215235 100%);"></td></tr>
          <tr>
            <td style="padding:44px;">
              <h2 style="margin:0 0 16px 0;font-size:22px;font-weight:800;color:#f4ede6;letter-spacing:-0.5px;">New Personal Trainer Request</h2>
              <p style="margin:0 0 16px 0;font-size:15px;color:rgba(244,237,230,0.75);line-height:1.75;">A member has requested a personal trainer. Please confirm payment and assign a trainer.</p>
              <div style="background-color:#273229;border-left:3px solid #f9a97b;padding:20px 24px;border-radius:8px;margin:24px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:9px 0;font-size:12px;color:#7a7570;text-transform:uppercase;letter-spacing:1.5px;width:38%;border-bottom:1px solid rgba(255,255,255,0.05);">Member</td>
                    <td style="padding:9px 0;font-size:14px;font-weight:600;color:#f4ede6;border-bottom:1px solid rgba(255,255,255,0.05);">${member.firstName} ${member.lastName}</td>
                  </tr>
                  <tr>
                    <td style="padding:9px 0;font-size:12px;color:#7a7570;text-transform:uppercase;letter-spacing:1.5px;width:38%;border-bottom:1px solid rgba(255,255,255,0.05);">Email</td>
                    <td style="padding:9px 0;font-size:14px;font-weight:600;color:#f4ede6;border-bottom:1px solid rgba(255,255,255,0.05);">${member.email}</td>
                  </tr>
                  <tr>
                    <td style="padding:9px 0;font-size:12px;color:#7a7570;text-transform:uppercase;letter-spacing:1.5px;width:38%;border-bottom:1px solid rgba(255,255,255,0.05);">Package</td>
                    <td style="padding:9px 0;font-size:14px;font-weight:600;color:#f4ede6;border-bottom:1px solid rgba(255,255,255,0.05);">${ptRequest.sessions ? `${ptRequest.sessions} sessions` : `${ptRequest.durationMonths} month${ptRequest.durationMonths !== 1 ? 's' : ''}`}</td>
                  </tr>
                  <tr>
                    <td style="padding:9px 0;font-size:12px;color:#7a7570;text-transform:uppercase;letter-spacing:1.5px;width:38%;">Amount Due</td>
                    <td style="padding:9px 0;font-size:14px;font-weight:600;color:#f9a97b;">${amount}</td>
                  </tr>
                </table>
              </div>
              <p style="margin:0;font-size:14px;color:rgba(244,237,230,0.75);line-height:1.75;">Please log in to the receptionist portal to confirm payment once received.</p>
            </td>
          </tr>
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

  await sendMail(toEmail, 'New Personal Trainer Request', html);
};

const createPTRequest = async ({ ptPlanId, notes }, user) => {
  if (!ptPlanId) throw err('ptPlanId is required', 400);

  if (!await hasActiveMembership(user.id)) {
    throw err('You need an active membership to book personal training. Please subscribe to a plan first.', 403);
  }

  const plan = await PTPlan.findOne({ where: { id: ptPlanId, isActive: true } });
  if (!plan) throw err('Selected PT plan not found or is no longer available', 404);

  const existing = await PTRequest.findOne({
    where: { userId: user.id, status: ['pending', 'paid'] },
  });
  if (existing) throw err('You already have an active PT request', 400);

  const ptRequest = await PTRequest.create({
    userId: user.id,
    ptPlanId: plan.id,
    reference: `APEX-PT-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    durationMonths: plan.durationMonths ?? null,
    sessions: plan.sessions ?? null,
    status: 'pending',
    totalAmount: parseFloat(plan.price),
    notes: notes || null,
  });

  sendPTRequestNotification(user, ptRequest).catch((e) => {
    console.error('[email] PT request notification failed:', e?.message || e);
  });

  return { ptRequest };
};

const getMyPTRequests = async (user) => {
  const ptRequests = await PTRequest.findAll({
    where: { userId: user.id },
    include: [{ model: PTPlan, as: 'plan', required: false }],
    order: [['createdAt', 'DESC']],
  });
  return { ptRequests };
};

const getAllPTRequests = async () => {
  const ptRequests = await PTRequest.findAll({
    include: [
      { model: User, foreignKey: 'userId', attributes: ['id', 'firstName', 'lastName', 'email', 'memberNumber'] },
      { model: PTPlan, as: 'plan', required: false },
    ],
    order: [['createdAt', 'DESC']],
  });
  return { ptRequests };
};

const getPTRequestCount = async () => {
  const pending = await PTRequest.count({ where: { status: 'pending' } });
  return { pending };
};

const confirmPTRequest = async (id, confirmedByUser) => {
  const ptRequest = await PTRequest.findByPk(id);
  if (!ptRequest) throw err('PT request not found', 404);
  if (ptRequest.status !== 'pending') throw err('This request has already been processed', 400);

  await ptRequest.update({
    status: 'paid',
    confirmedAt: new Date(),
    confirmedById: confirmedByUser.id,
  });

  return { ptRequest };
};

const cancelPTRequest = async (id, user) => {
  const ptRequest = await PTRequest.findOne({ where: { id, userId: user.id } });
  if (!ptRequest) throw err('PT request not found', 404);
  if (ptRequest.status !== 'pending') {
    throw err('Only pending requests can be cancelled. If payment was already confirmed, please speak to the front desk.', 400);
  }

  await ptRequest.update({ status: 'cancelled' });
  return { ptRequest };
};

module.exports = { createPTRequest, getMyPTRequests, getAllPTRequests, getPTRequestCount, confirmPTRequest, cancelPTRequest };
