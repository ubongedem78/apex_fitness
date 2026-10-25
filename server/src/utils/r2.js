const crypto = require('crypto');

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET = process.env.R2_BUCKET;
const REGION = 'auto';
const SERVICE = 's3';

const isConfigured = () =>
  Boolean(ACCOUNT_ID && ACCESS_KEY_ID && SECRET_ACCESS_KEY && BUCKET);

const host = () => `${ACCOUNT_ID}.r2.cloudflarestorage.com`;

const sha256hex = (data) => crypto.createHash('sha256').update(data).digest('hex');
const hmac = (key, data) => crypto.createHmac('sha256', key).update(data).digest();

const encodeSegment = (str) =>
  encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase()
  );

const encodeKey = (key) => key.split('/').map(encodeSegment).join('/');

const signingKey = (dateStamp) => {
  const kDate = hmac('AWS4' + SECRET_ACCESS_KEY, dateStamp);
  const kRegion = hmac(kDate, REGION);
  const kService = hmac(kRegion, SERVICE);
  return hmac(kService, 'aws4_request');
};

const presign = (method, key, expiresIn) => {
  if (!isConfigured()) throw new Error('R2 storage is not configured');

  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const canonicalUri = `/${BUCKET}/${encodeKey(key)}`;
  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;

  const params = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${ACCESS_KEY_ID}/${credentialScope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expiresIn),
    'X-Amz-SignedHeaders': 'host',
  };

  const canonicalQuery = Object.keys(params)
    .sort()
    .map((k) => `${encodeSegment(k)}=${encodeSegment(params[k])}`)
    .join('&');

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuery,
    `host:${host()}\n`,
    'host',
    'UNSIGNED-PAYLOAD',
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256hex(canonicalRequest),
  ].join('\n');

  const signature = crypto
    .createHmac('sha256', signingKey(dateStamp))
    .update(stringToSign)
    .digest('hex');

  return `https://${host()}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
};

const AVATAR_UPLOAD_TTL = 300;
const AVATAR_VIEW_TTL = 3600;

const buildAvatarKey = (userId) => `avatars/${userId}.webp`;

const presignAvatarUpload = (userId) =>
  presign('PUT', buildAvatarKey(userId), AVATAR_UPLOAD_TTL);

const presignView = (key, expiresIn = AVATAR_VIEW_TTL) => presign('GET', key, expiresIn);

const signAvatarUrl = (value) => {
  if (!value || !isConfigured()) return value || null;
  if (/^https?:\/\//i.test(value)) return value;
  return presignView(value);
};

module.exports = {
  isConfigured,
  buildAvatarKey,
  presignAvatarUpload,
  presignView,
  signAvatarUrl,
};
