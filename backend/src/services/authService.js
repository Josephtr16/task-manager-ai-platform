const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const dns = require('dns').promises;
const AppError = require('../utils/AppError');
const BaseService = require('./BaseService');
const emailService = require('./emailService');

class AuthService extends BaseService {
    constructor() {
        super(User);
    }

    generateToken(id) {
        return jwt.sign({ id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE,
        });
    }

    async hashToken(token) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    async checkMX(email) {
        const domain = email.split('@')[1];
        console.log(`[DEBUG] checkMX called for email: "${email}", domain: "${domain}"`);

        // Whitelist common domains to avoid DNS overhead/failures for obvious cases
        const commonDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'me.com', 'live.com'];
        const isWhitelisted = commonDomains.includes(domain) || domain === 'example.com' || domain === 'test.com';
        console.log(`[DEBUG] domain "${domain}" whitelisted: ${isWhitelisted}`);

        if (isWhitelisted) {
            return true;
        }

        try {
            const mx = await dns.resolveMx(domain);
            return mx && mx.length > 0;
        } catch (error) {
            // Log the error for internal monitoring
            console.warn(`MX check DNS failure for ${domain}: ${error.code || error.message}. Falling back to success.`);

            // If DNS lookup fails due to connection issues (ECONNREFUSED, ETIMEOUT, etc.),
            // we should not block the user. We only block if we are certain the domain is invalid,
            // but network errors are not definitive proof of an invalid domain.
            return true;
        }
    }

    async register(userData) {
        let { email } = userData;

        // Normalize email
        email = email.trim().toLowerCase();
        userData.email = email;

        // 1. MX Domain Check
        const isDomainValid = await this.checkMX(email);
        if (!isDomainValid) {
            throw new AppError('Email domain invalid or cannot receive emails', 400);
        }

        // 2. Check if user exists
        let user = await this.model.findOne({ email });

        // If user exists but is not verified, resend verification email instead of failing registration completely.
        if (user && user.isVerified) {
            throw new AppError('User already exists', 400);
        }

        // 3. Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenHash = await this.hashToken(verificationToken);

        // 4. Set verification fields
        userData.isVerified = false;
        userData.verificationTokenHash = verificationTokenHash;
        userData.verificationTokenExpires = Date.now() + 30 * 60 * 1000; // 30 minutes

        // 5. Update or create user
        if (user) {
            user.name = userData.name;
            user.password = userData.password;
            user.verificationTokenHash = verificationTokenHash;
            user.verificationTokenExpires = userData.verificationTokenExpires;
            await user.save();
        } else {
            user = await this.model.create(userData);
        }

        // 6. Send verification email
        try {
            await emailService.sendVerificationEmail(user.email, verificationToken);
        } catch (error) {
            console.error('Error sending verification email:', error);
            // Revert or continue; typically we want to return a specific message
        }

        return {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                preferences: user.preferences,
            },
            message: 'Verification email sent. Please check your inbox.'
        };
    }

    async verifyEmail(email, token) {
        const verificationTokenHash = await this.hashToken(token);

        const user = await this.model.findOne({
            email,
            verificationTokenHash,
            verificationTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            // Check if already verified to make this endpoint idempotent (handles React Strict Mode double-firing)
            const existingUser = await this.model.findOne({ email });
            if (existingUser && existingUser.isVerified) {
                return {
                    success: true,
                    message: 'Email is already verified! You can now log in.'
                };
            }
            throw new AppError('Invalid or expired verification token', 400);
        }

        // Update user status
        user.isVerified = true;
        user.verificationTokenHash = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();

        return {
            success: true,
            message: 'Email verified successfully! You can now log in.'
        };
    }

    async login(email, password) {
        // Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        // Check for user (include password since we set select: false)
        const user = await this.model.findOne({ email: normalizedEmail }).select('+password');

        if (!user) {
            throw new AppError('Invalid credentials', 401);
        }

        // Check if verified
        if (!user.isVerified) {
            throw new AppError('Please verify your email to log in', 401);
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
