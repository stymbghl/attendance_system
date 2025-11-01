const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET;
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';

function generateToken(userId, isAdmin) {
    const payload = {
        userId,
        isAdmin
    };

    return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
}

function verifyToken(token) {
    try {
        return jwt.verify(token, jwtSecret);
    } catch (error) {
        return null;
    }
}

module.exports = {
    generateToken,
    verifyToken
};
