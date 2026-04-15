const rateLimit = require('express-rate-limit');

const AI_LIMITER_OVERRIDES = new Set([
  '/ai/prioritize',
  '/ai/project-breakdown',
  '/ai/assist-write',
  '/ai/plan-day',
]);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many attempts from this IP, please try again after 15 minutes.',
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  skip: (req) => req.method === 'POST' && AI_LIMITER_OVERRIDES.has(req.path),
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please slow down.',
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many AI requests, please try again in a minute.',
});

module.exports = {
  authLimiter,
  apiLimiter,
  aiLimiter,
};