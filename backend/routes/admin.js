const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { logAction } = require('../services/auditService');

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users',
    protect,
    authorize('Admin'),
    asyncHandler(async (req, res) => {
        const { tenantId, role, isActive, page = 1, limit = 20 } = req.query;

        let query = {};
        if (tenantId) query.tenantId = tenantId;
        if (role) query.role = role;
        if (isActive !== undefined) query.isActive = isActive === 'true';

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const users = await User.find(query)
            .populate('tenantId', 'name')
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    })
);

// @route   POST /api/admin/users
// @desc    Create user (handled by auth/register route)
// @access  Private/Admin
// Note: User creation is handled by /api/auth/register

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Private/Admin
router.put('/users/:id',
    protect,
    authorize('Admin'),
    asyncHandler(async (req, res) => {
        const user = await User.findById(req.params.id);

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        const allowedUpdates = ['name', 'role', 'department', 'phone', 'employeeId', 'isActive'];
        const updates = {};

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
                user[field] = req.body[field];
            }
        });

        await user.save();

        // Log action
        await logAction(req.user._id, 'Updated', 'User', user._id, updates, req);

        res.json({
            success: true,
            message: 'User updated successfully',
            data: user
        });
    })
);

// @route   DELETE /api/admin/users/:id
// @desc    Deactivate user
// @access  Private/Admin
router.delete('/users/:id',
    protect,
    authorize('Admin'),
    asyncHandler(async (req, res) => {
        const user = await User.findById(req.params.id);

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        user.isActive = false;
        await user.save();

        // Log action
        await logAction(req.user._id, 'Updated', 'User', user._id,
            { isActive: false }, req);

        res.json({
            success: true,
            message: 'User deactivated successfully'
        });
    })
);

// @route   GET /api/admin/tenants
// @desc    Get all tenants
// @access  Private/Admin
router.get('/tenants',
    protect,
    authorize('Admin'),
    asyncHandler(async (req, res) => {
        const tenants = await Tenant.find().sort({ createdAt: -1 });

        res.json({
            success: true,
            data: tenants
        });
    })
);

// @route   POST /api/admin/tenants
// @desc    Create tenant
// @access  Private/Admin
router.post('/tenants',
    protect,
    authorize('Admin'),
    asyncHandler(async (req, res) => {
        const { name, sites, settings } = req.body;

        const tenant = await Tenant.create({
            name,
            sites,
            settings
        });

        // Log action
        await logAction(req.user._id, 'Created', 'Tenant', tenant._id,
            { name }, req);

        res.status(201).json({
            success: true,
            message: 'Tenant created successfully',
            data: tenant
        });
    })
);

// @route   PUT /api/admin/tenants/:id
// @desc    Update tenant
// @access  Private/Admin
router.put('/tenants/:id',
    protect,
    authorize('Admin'),
    asyncHandler(async (req, res) => {
        const tenant = await Tenant.findById(req.params.id);

        if (!tenant) {
            res.status(404);
            throw new Error('Tenant not found');
        }

        const allowedUpdates = ['name', 'sites', 'settings', 'isActive'];
        const updates = {};

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
                tenant[field] = req.body[field];
            }
        });

        await tenant.save();

        // Log action
        await logAction(req.user._id, 'Updated', 'Tenant', tenant._id, updates, req);

        res.json({
            success: true,
            message: 'Tenant updated successfully',
            data: tenant
        });
    })
);

module.exports = router;
