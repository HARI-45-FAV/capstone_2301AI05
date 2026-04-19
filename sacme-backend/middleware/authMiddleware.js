const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['warn'] });

const JWT_SECRET = process.env.JWT_SECRET || 'sacme_super_secret_dev_key';

/**
 * Validates the JWT Bearer token and attaches the User object to the request.
 */
exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ error: 'Not authorized, no session token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Fetch the user to ensure they still exist and aren't suspended
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, role: true, account_status: true }
        });

        if (!user) {
            return res.status(401).json({ error: 'User for this token no longer exists' });
        }
        
        if (user.account_status !== 'ACTIVE') {
            return res.status(401).json({ error: 'Account is not active' });
        }

        req.user = user;
        console.log("Authenticated User:", user.email, "Current User Role:", user.role);
        next();
    } catch (error) {
        console.error('JWT Verification Failed:', error);
        res.status(401).json({ error: 'Not authorized, token failed verification' });
    }
};

/**
 * Role-Based Access Control (RBAC) Middleware
 * Ensures the logged-in user has the required roles
 */
exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        console.log("Required:", roles);
        console.log("User Role:", req.user?.role);
        
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: `Role (${req.user?.role}) is not authorized to access this resource` 
            });
        }
        next();
    };
};
