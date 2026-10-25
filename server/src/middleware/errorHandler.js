const isProd = process.env.NODE_ENV === 'production';

const errorHandler = (err, req, res, next) => {

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid or malformed request body' });
  }

  if (isProd) {
    console.error(`[${new Date().toISOString()}] ${err.name}: ${err.message}`);
  } else {
    console.error(err);
  }

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors ? err.errors.map(e => ({ field: e.path, message: e.message })) : [],
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({ success: false, message: 'Referenced record not found' });
  }

  const status = err.status || err.statusCode || 500;

  const message = status >= 500 && isProd
    ? 'Something went wrong. Please try again later.'
    : (err.message || 'Internal server error');

  res.status(status).json({ success: false, message });
};

module.exports = errorHandler;
