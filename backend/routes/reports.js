const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { Pass } = require('../models/Pass');
const GateEvent = require('../models/GateEvent');
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// @route   GET /api/reports/dashboard
// @desc    Get dashboard statistics
// @access  Private
router.get('/dashboard',
    protect,
    asyncHandler(async (req, res) => {
        const tenantId = req.user.role === 'Admin' && req.query.tenantId
            ? req.query.tenantId
            : req.user.tenantId;

        // Total passes by status
        const passesByStatus = await Pass.aggregate([
            { $match: { tenantId: tenantId } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Passes by type
        const passesByType = await Pass.aggregate([
            { $match: { tenantId: tenantId } },
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);

        // Active visitors (checked in but not checked out)
        const activeVisitors = await GateEvent.countDocuments({
            eventType: 'CheckIn',
            checkOutAt: null
        });

        // Pending approvals
        const pendingApprovals = await Pass.countDocuments({
            tenantId: tenantId,
            status: 'Pending'
        });

        // Today's check-ins
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCheckIns = await GateEvent.countDocuments({
            eventType: 'CheckIn',
            checkInAt: { $gte: today }
        });

        // Recent activity
        const recentPasses = await Pass.find({ tenantId: tenantId })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('requesterId', 'name email');

        res.json({
            success: true,
            data: {
                passesByStatus,
                passesByType,
                activeVisitors,
                pendingApprovals,
                todayCheckIns,
                recentPasses
            }
        });
    })
);

// @route   GET /api/reports/daily-register
// @desc    Get daily in/out register
// @access  Private
router.get('/daily-register',
    protect,
    asyncHandler(async (req, res) => {
        const { date, format } = req.query;

        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        const events = await GateEvent.find({
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        }).populate({
            path: 'passId',
            populate: {
                path: 'requesterId',
                select: 'name email phone department'
            }
        }).populate('scannedBy', 'name')
            .sort({ createdAt: 1 });

        if (format === 'csv') {
            // Generate CSV
            let csv = 'Time,Event Type,Pass ID,Pass Type,Name,Department,Gate,Scanned By\n';

            events.forEach(event => {
                const pass = event.passId;
                const time = event.checkInAt || event.checkOutAt || event.createdAt;
                csv += `${time.toLocaleString()},${event.eventType},${pass.passId},${pass.type},`;
                csv += `${pass.requesterId.name},${pass.requesterId.department || 'N/A'},`;
                csv += `${event.gateName},${event.scannedBy.name}\n`;
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=daily-register-${targetDate.toISOString().split('T')[0]}.csv`);
            return res.send(csv);
        }

        res.json({
            success: true,
            data: events
        });
    })
);

// @route   GET /api/reports/active-visitors
// @desc    Get currently active visitors/vehicles
// @access  Private
router.get('/active-visitors',
    protect,
    asyncHandler(async (req, res) => {
        // Find all active check-ins
        const activeEvents = await GateEvent.find({
            eventType: 'CheckIn',
            checkOutAt: null
        }).populate({
            path: 'passId',
            populate: {
                path: 'requesterId hostId',
                select: 'name email phone department'
            }
        }).sort({ checkInAt: -1 });

        res.json({
            success: true,
            data: activeEvents
        });
    })
);

// @route   GET /api/reports/pass-history
// @desc    Get pass history with filters
// @access  Private
router.get('/pass-history',
    protect,
    asyncHandler(async (req, res) => {
        const { type, status, startDate, endDate, userId, page = 1, limit = 50 } = req.query;

        let query = {};

        // Role-based filtering
        if (req.user.role !== 'Admin') {
            query.tenantId = req.user.tenantId;
        }

        if (type) query.type = type;
        if (status) query.status = status;
        if (userId) query.requesterId = userId;

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const passes = await Pass.find(query)
            .populate('requesterId', 'name email department')
            .populate('approvedBy.userId', 'name')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Pass.countDocuments(query);

        res.json({
            success: true,
            data: {
                passes,
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

// @route   GET /api/reports/audit-trail
// @desc    Get audit trail logs
// @access  Private (Admin only)
router.get('/audit-trail',
    protect,
    authorize('Admin'),
    asyncHandler(async (req, res) => {
        const { action, entityType, userId, startDate, endDate, page = 1, limit = 50 } = req.query;

        let query = {};

        if (action) query.action = action;
        if (entityType) query.entityType = entityType;
        if (userId) query.userId = userId;

        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const logs = await AuditLog.find(query)
            .populate('userId', 'name email role')
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await AuditLog.countDocuments(query);

        res.json({
            success: true,
            data: {
                logs,
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

module.exports = router;
