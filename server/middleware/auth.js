const { verifyToken } = require('../utils/jwt');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = {
        id: decoded.userId,
        isAdmin: decoded.isAdmin
    };

    next();
}

function requireAdmin(req, res, next) {
    const isUserAdmin = req.user.isAdmin === 1;

    if (!isUserAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    next();
}

module.exports = {
    authenticateToken,
    requireAdmin
};
