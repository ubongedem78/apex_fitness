const { AuditLog } = require('../models');

const STAFF_ROLES = ['admin', 'manager', 'staff', 'receptionist'];

const REDACT = new Set([
  'password', 'oldPassword', 'newPassword', 'passwordHash', 'token', 'refreshToken',
  'otp', 'cvv', 'card', 'authorization_code',
]);

const sanitize = (body) => {
  if (!body || typeof body !== 'object') return null;
  const out = {};
  for (const [k, v] of Object.entries(body)) {
    if (REDACT.has(k)) continue;
    out[k] = v;
  }
  return Object.keys(out).length ? out : null;
};

const resourceOf = (path) => {
  const parts = path.replace(/^\/api\//, '').split('/').filter(Boolean);
  if (parts[0] === 'admin' || parts[0] === 'receptionist') return parts[1] || parts[0];
  return parts[0] || 'api';
};

const NOISE = /\/(health|auth\/refresh|auth\/me|users\/me|notifications)(\/|$|\?)/;

const auditLog = (req, res, next) => {
  res.on('finish', () => {
    try {
      const user = req.user;
      if (!user) return;

      const method = req.method;
      if (method === 'OPTIONS' || method === 'HEAD') return;

      const isWrite = method !== 'GET';
      const isStaff = STAFF_ROLES.includes(user.role);
      if (!isWrite && !isStaff) return;

      const path = (req.originalUrl || req.url || '').split('?')[0];
      if (!isWrite && NOISE.test(path)) return;

      AuditLog.create({
        userId: user.id,
        action: `${method} ${path}`,
        resource: resourceOf(path),
        resourceId: req.params && req.params.id ? String(req.params.id) : null,
        newValues: isWrite ? sanitize(req.body) : null,
        ipAddress: req.ip,
        userAgent: (req.headers['user-agent'] || '').slice(0, 255) || null,
      }).catch(() => {});
    } catch (_) {  }
  });
  next();
};

module.exports = auditLog;
