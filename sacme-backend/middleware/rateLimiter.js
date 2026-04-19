const rateLimit = require('express-rate-limit');

exports.authLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    message: { error: "Too many authentication requests, please try again later." }
});

exports.submissionLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20,
    message: { error: "Too many assignment submissions, please slow down." }
});

exports.attendanceLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: { error: "Too many attendance modifications, please slow down." }
});
