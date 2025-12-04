const rateLimit = require('express-rate-limit');

// Basic rate limiter to protect file endpoints from excessive traffic
const fileRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.'
});

module.exports = fileRateLimit;
