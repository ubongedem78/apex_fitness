const { sendContactEmail } = require('../utils/email');

const submit = async ({ name, email, phone, message }) => {
  if (!name || typeof name !== 'string' || !name.trim()) {
    const err = new Error('name is required');
    err.statusCode = 400;
    throw err;
  }
  if (!email || typeof email !== 'string') {
    const err = new Error('email is required');
    err.statusCode = 400;
    throw err;
  }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email.trim())) {
    const err = new Error('Invalid email address');
    err.statusCode = 400;
    throw err;
  }
  if (!message || typeof message !== 'string' || !message.trim()) {
    const err = new Error('message is required');
    err.statusCode = 400;
    throw err;
  }

  try {
    await sendContactEmail({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      message: message.trim(),
    });
  } catch (_) {}

  return { message: 'Message received. We will be in touch shortly.' };
};

module.exports = { submit };
