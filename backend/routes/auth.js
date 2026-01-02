const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate, loginSchema, registerSchema } = require('../middleware/validation');
const { logAction } = require('../services/auditService');
const jwt = require('jsonwebtoken');

// @route   POST /api/auth/register
// @desc    Register new user (Admin only)
// @access  Private/Admin
router.post('/register',
    protect,
    authorize('Admin'),
    validate(registerSchema),
    asyncHandler(async (req, res) => {
        const { email, password, name, role, tenantId, department, phone, employeeId } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400);
            throw new Error('User already exists with this email');
        }

        // Create user
        const user = await User.create({
            email,
            password,
            name,
            role,
            tenantId,
            department,
            phone,
            employeeId
        });

        // Log action
        await logAction(req.user._id, 'Created', 'User', user._id,
            { email, role, tenantId }, req);

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                _id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                tenantId: user.tenantId
            }
        });
    })
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login',
    validate(loginSchema),
    asyncHandler(async (req, res) => {
        const { email, password } = req.body;

        // Check for user
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            res.status(401);
            throw new Error('Invalid credentials');
        }

        // Check if user is active
        if (!user.isActive) {
            res.status(401);
            throw new Error('User account is deactivated');
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401);
            throw new Error('Invalid credentials');
        }

        // Generate tokens
        const token = user.generateToken();
        const refreshToken = user.generateRefreshToken();

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    _id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    tenantId: user.tenantId,
                    department: user.department
                },
                token,
                refreshToken
            }
        });
    })
);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh',
    asyncHandler(async (req, res) => {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            res.status(401);
            throw new Error('Refresh token required');
        }

        try {
            // Verify refresh token
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

            // Get user
            const user = await User.findById(decoded.id);
            if (!user || !user.isActive) {
                res.status(401);
                throw new Error('Invalid refresh token');
            }

            // Generate new access token
            const newToken = user.generateToken();

            res.json({
                success: true,
                data: {
                    token: newToken
                }
            });
        } catch (error) {
            res.status(401);
            throw new Error('Invalid refresh token');
        }
    })
);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me',
    protect,
    asyncHandler(async (req, res) => {
        const user = await User.findById(req.user._id).populate('tenantId', 'name sites');

        res.json({
            success: true,
            data: user
        });
    })
);

module.exports = router;
