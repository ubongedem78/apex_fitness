const validate = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues ?? result.error.errors ?? [];
      const errors = issues.map(e => ({ field: e.path.join('.'), message: e.message }));
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    req.body = result.data;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = validate;
