/**
 * Rate limiter for failed login attempts
 * Tracks only FAILED login attempts per IP address
 * Limits to 10 failures per 10 minutes
 */

const failedAttempts = new Map();

// Clean up old entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  const tenMinutes = 10 * 60 * 1000;

  for (const [ip, attempts] of failedAttempts.entries()) {
    // Remove attempts older than 10 minutes
    const recentAttempts = attempts.filter(timestamp => now - timestamp < tenMinutes);
    if (recentAttempts.length === 0) {
      failedAttempts.delete(ip);
    } else {
      failedAttempts.set(ip, recentAttempts);
    }
  }
}, 5 * 60 * 1000);

/**
 * Check if IP has exceeded failed login attempt limit
 * Returns { allowed: boolean, remaining: number }
 */
const checkFailedAttempts = (ip) => {
  const now = Date.now();
  const tenMinutes = 10 * 60 * 1000;
  const maxAttempts = 10;

  if (!failedAttempts.has(ip)) {
    return { allowed: true, remaining: maxAttempts };
  }

  // Get attempts for this IP
  const attempts = failedAttempts.get(ip);

  // Filter to only recent attempts (within 10 minutes)
  const recentAttempts = attempts.filter(timestamp => now - timestamp < tenMinutes);
  failedAttempts.set(ip, recentAttempts);

  // Check if limit exceeded
  if (recentAttempts.length >= maxAttempts) {
    // Calculate time until oldest attempt expires
    const oldestAttempt = recentAttempts[0];
    const timeUntilReset = tenMinutes - (now - oldestAttempt);
    const minutesUntilReset = Math.ceil(timeUntilReset / 60000);

    return {
      allowed: false,
      remaining: 0,
      retryAfter: minutesUntilReset
    };
  }

  return {
    allowed: true,
    remaining: maxAttempts - recentAttempts.length
  };
};

/**
 * Record a failed login attempt
 */
const recordFailedAttempt = (ip) => {
  const now = Date.now();
  const tenMinutes = 10 * 60 * 1000;

  if (!failedAttempts.has(ip)) {
    failedAttempts.set(ip, [now]);
    return;
  }

  const attempts = failedAttempts.get(ip);

  // Filter to only recent attempts, then add new one
  const recentAttempts = attempts.filter(timestamp => now - timestamp < tenMinutes);
  recentAttempts.push(now);
  failedAttempts.set(ip, recentAttempts);
};

/**
 * Clear failed attempts (for successful login)
 */
const clearFailedAttempts = (ip) => {
  failedAttempts.delete(ip);
};

/**
 * Middleware to check rate limit before processing login
 */
const loginRateLimiter = (req, res, next) => {
  const ip = req.ip ||
             req.connection.remoteAddress ||
             req.socket.remoteAddress ||
             (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
             'unknown';

  const result = checkFailedAttempts(ip);

  if (!result.allowed) {
    return res.status(429).json({
      message: `Too many failed login attempts. Please try again in ${result.retryAfter} minute(s).`,
      retryAfter: result.retryAfter
    });
  }

  // Store IP in request for later use
  req.clientIp = ip;
  next();
};

export {
  loginRateLimiter,
  recordFailedAttempt,
  clearFailedAttempts,
  checkFailedAttempts
};
