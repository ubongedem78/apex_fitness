const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role, tv: user.tokenVersion ?? 0 },
  process.env.JWT_ACCESS_SECRET,
  { expiresIn: '2h' }
);

const generateRefreshToken = (user) => jwt.sign(
  { id: user.id, tv: user.tokenVersion ?? 0 },
  process.env.JWT_REFRESH_SECRET,
  { expiresIn: '30d' }
);

const verifyAccessToken = (token) => jwt.verify(token, process.env.JWT_ACCESS_SECRET);
const verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

module.exports = { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken };
