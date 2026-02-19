const User = require('../models/User');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const BaseService = require('./BaseService');

class AuthService extends BaseService {
    constructor() {
        super(User);
    }

    generateToken(id) {
        return jwt.sign({ id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE,
        });
    }

    async register(userData) {
        const { email } = userData;

        // Check if user exists
        const userExists = await this.model.findOne({ email });
        if (userExists) {
            throw new AppError('User already exists', 400);
        }

        // Create user
        const user = await this.model.create(userData);
        consttoken = this.generateToken(user._id);

        return {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                preferences: user.preferences,
            },
            token
        };
    }

    async login(email, password) {
        // Check for user (include password since we set select: false)
        const user = await this.model.findOne({ email }).select('+password');

        if (!user) {
            throw new AppError('Invalid credentials', 401);
        }

        // Check password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            throw new AppError('Invalid credentials', 401);
        }

        const token = this.generateToken(user._id);

        return {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                preferences: user.preferences,
            },
            token
        };
    }

    async getMe(userId) {
        const user = await this.findById(userId);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        return {
            id: user._id,
            name: user.name,
            email: user.email,
            preferences: user.preferences,
            createdAt: user.createdAt,
        };
    }
}

module.exports = new AuthService();
