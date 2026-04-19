const jwt = require('jsonwebtoken');

/**
 * @desc    Verify incoming JWT Tokens and extract User payload
 * @middleware protect
 */
exports.protect = (req, res, next) => {
    let token;

    // Standard extraction from Bearer Token header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ error: 'Not authorized to access this route. No session token provided.' });
    }

    try {
        // Verify token signature and structural integrity
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sacme-super-secret-key-fallback');
        
        // Attach decoded payload (containing user role and id) to request object
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Session invalid or expired. Please login again.' });
    }
};

/**
 * @desc    Role-based Access Control (RBAC) Middleware wrapper
 * @param   {...string} roles - Array of permitted roles (e.g. 'MAIN_ADMIN', 'INSTITUTE_ADMIN')
 * @returns Express Middleware Function
 */
exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        // Safety check to ensure protect middleware ran first
        if (!req.user || !req.user.role) {
            return res.status(401).json({ error: 'Role verification failed. User identity payload is missing.' });
        }

        // Validating against allowed roles for the specific endpoint
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: `Security Check: Role '${req.user.role}' is not authorized to access this administrative resource.` 
            });
        }
        
        next();
    };
};
