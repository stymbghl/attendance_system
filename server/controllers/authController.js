const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { generateToken } = require('../utils/jwt');

async function register(req, res) {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const isValidEmail = email.includes('@');
    if (!isValidEmail) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    const isPasswordLongEnough = password.length >= 6;
    if (!isPasswordLongEnough) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    try {
        // Check if email already exists
        const existingUser = await new Promise((resolve, reject) => {
            db.get('SELECT id FROM users WHERE email = ?', [email], (error, row) => {
                if (error) reject(error);
                else resolve(row);
            });
        });

        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const result = await new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
                [name, email, hashedPassword],
                function(error) {
                    if (error) reject(error);
                    else resolve({ id: this.lastID });
                }
            );
        });

        res.status(201).json({
            message: 'User registered successfully',
            userId: result.id
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
}

async function login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Find user by email
        const user = await new Promise((resolve, reject) => {
            db.get(
                'SELECT id, name, email, password, isAdmin FROM users WHERE email = ?',
                [email],
                (error, row) => {
                    if (error) reject(error);
                    else resolve(row);
                }
            );
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(user.id, user.isAdmin);

        res.status(200).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
}

module.exports = {
    register,
    login
};
