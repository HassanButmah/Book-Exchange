const jwt = require('jsonwebtoken');

/**
 * authMiddleware – verifies the Bearer JWT.
 * If `required` is false the middleware still attaches req.user when a
 * valid token IS present, but does NOT reject requests without one.
 * All existing usages (router.use / route-level) remain backwards-compatible
 * because a missing/invalid token simply leaves req.user as undefined.
 *
 * To enforce authentication, wrap with `requireAuth` below.
 */
const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            // Token absent → continue without user context (optional-auth routes)
            req.user = null;
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        // Invalid / expired token
        req.user = null;
        return next();
    }
};

/**
 * requireAuth – use this when a route MUST have a logged-in user.
 * Chain after authMiddleware: router.post('/', authMiddleware, requireAuth, handler)
 * Or simply use authMiddleware alone for optional-auth routes.
 */
const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
};

module.exports = authMiddleware;
module.exports.requireAuth = requireAuth;
