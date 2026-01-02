const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { Pass } = require('../models/Pass');
const GateEvent = require('../models/GateEvent');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate, scanQRSchema, checkInOutSchema, denyEntrySchema } = require('../middleware/validation');
const { validateQR } = require('../services/qrService');
const { logAction } = require('../services/auditService');
const { sendArrivalNotification } = require('../services/notificationService');

// @route   POST /api/gates/scan
// @desc    Scan QR code and validate
// @access  Private (Security/Admin)
router.post('/scan',
    protect,
    authorize('Security', 'Admin'),
    validate(scanQRSchema),
    asyncHandler(async (req, res) => {
        const { qrData, gateId } = req.body;

        // Validate QR code
        const validation = validateQR(qrData);

        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.error
            });
        }

        // Get full pass details
        const pass = await Pass.findOne({ passId: validation.data.passId })
            .populate('requesterId', 'name email phone department')
            .populate('hostId', 'name email phone');

        if (!pass) {
            return res.status(404).json({
                success: false,
                message: 'Pass not found'
            });
        }

        // Check if pass is already checked out
        const lastEvent = await GateEvent.findOne({ passId: pass._id })
            .sort({ createdAt: -1 });

        let canCheckIn = true;
        let canCheckOut = false;

        if (lastEvent) {
            if (lastEvent.eventType === 'CheckIn' && !lastEvent.checkOutAt) {
                canCheckIn = false;
                canCheckOut = true;
            }
        }

        res.json({
            success: true,
            message: 'QR code validated successfully',
            data: {
                pass,
                validation: validation.data,
                canCheckIn,
                canCheckOut
            }
        });
    })
);

// @route   POST /api/gates/checkin
// @desc    Check-in at gate
// @access  Private (Security/Admin)
router.post('/checkin',
    protect,
    authorize('Security', 'Admin'),
    validate(checkInOutSchema),
    asyncHandler(async (req, res) => {
        const { passId, gateId, gateName, location } = req.body;

        const pass = await Pass.findById(passId)
            .populate('requesterId', 'name email')
            .populate('hostId', 'name email');

        if (!pass) {
            res.status(404);
            throw new Error('Pass not found');
        }

        const allowedStatuses = ['Approved', 'Active', 'CheckedOut'];
        if (!allowedStatuses.includes(pass.status)) {
            res.status(400);
            throw new Error(`Pass is not in a valid state for entry (Status: ${pass.status})`);
        }

        // Enforce strict time window check
        const now = new Date();
        const validFrom = new Date(pass.validFrom);
        const validTo = new Date(pass.validTo);

        if (now < validFrom) {
            res.status(400);
            throw new Error(`Pass is not valid yet (Starts at: ${validFrom.toLocaleString()})`);
        }

        if (now > validTo) {
            res.status(400);
            throw new Error(`Pass has expired (Expired at: ${validTo.toLocaleString()})`);
        }

        // Check if already checked in (active session)
        const existingCheckIn = await GateEvent.findOne({
            passId: pass._id,
            eventType: 'CheckIn',
            checkOutAt: null
        });

        if (existingCheckIn) {
            res.status(400);
            throw new Error('Already checked in. Please check out first.');
        }

        // Create gate event
        const gateEvent = await GateEvent.create({
            passId: pass._id,
            gateId,
            gateName,
            scannedBy: req.user._id,
            eventType: 'CheckIn',
            checkInAt: new Date(),
            location
        });

        // Update pass status to Active
        pass.status = 'Active';
        await pass.save();

        // Log action
        await logAction(req.user._id, 'CheckedIn', 'Pass', pass._id,
            { gateId, gateName }, req);

        // Send arrival notification to host (for visitor passes)
        if (pass.type === 'Visitor' && pass.hostId) {
            const visitor = pass.persons && pass.persons[0];
            if (visitor) {
                await sendArrivalNotification(pass.hostId, pass, visitor);
            }
        }

        res.json({
            success: true,
            message: 'Check-in successful',
            data: {
                gateEvent,
                pass
            }
        });
    })
);

// @route   POST /api/gates/checkout
// @desc    Check-out at gate
// @access  Private (Security/Admin)
router.post('/checkout',
    protect,
    authorize('Security', 'Admin'),
    validate(checkInOutSchema),
    asyncHandler(async (req, res) => {
        const { passId, gateId, gateName, location } = req.body;

        const pass = await Pass.findById(passId);

        if (!pass) {
            res.status(404);
            throw new Error('Pass not found');
        }

        // Find the check-in event
        const checkInEvent = await GateEvent.findOne({
            passId: pass._id,
            eventType: 'CheckIn',
            checkOutAt: null
        }).sort({ createdAt: -1 });

        if (!checkInEvent) {
            res.status(400);
            throw new Error('No active check-in found');
        }

        // Update check-in event with checkout time
        checkInEvent.checkOutAt = new Date();
        await checkInEvent.save();

        // Also create a checkout event
        const checkOutEvent = await GateEvent.create({
            passId: pass._id,
            gateId,
            gateName,
            scannedBy: req.user._id,
            eventType: 'CheckOut',
            checkOutAt: new Date(),
            location
        });

        // Update pass status
        pass.status = 'CheckedOut';
        await pass.save();

        // Log action
        await logAction(req.user._id, 'CheckedOut', 'Pass', pass._id,
            { gateId, gateName }, req);

        res.json({
            success: true,
            message: 'Check-out successful',
            data: {
                checkInEvent,
                checkOutEvent,
                pass
            }
        });
    })
);

// @route   POST /api/gates/deny
// @desc    Deny entry at gate
// @access  Private (Security/Admin)
router.post('/deny',
    protect,
    authorize('Security', 'Admin'),
    validate(denyEntrySchema),
    asyncHandler(async (req, res) => {
        const { passId, gateId, gateName, denyReason } = req.body;

        const pass = await Pass.findById(passId);

        if (!pass) {
            res.status(404);
            throw new Error('Pass not found');
        }

        // Create deny event
        const gateEvent = await GateEvent.create({
            passId: pass._id,
            gateId,
            gateName,
            scannedBy: req.user._id,
            eventType: 'Denied',
            denyReason
        });

        // Log action
        await logAction(req.user._id, 'Denied', 'Pass', pass._id,
            { gateId, gateName, denyReason }, req);

        res.json({
            success: true,
            message: 'Entry denied',
            data: gateEvent
        });
    })
);

// @route   GET /api/gates/active
// @desc    Get currently active passes at gate
// @access  Private (Security/Admin)
router.get('/active',
    protect,
    authorize('Security', 'Admin'),
    asyncHandler(async (req, res) => {
        const { gateId } = req.query;

        // Find all passes that are checked in but not checked out
        const activeCheckIns = await GateEvent.find({
            eventType: 'CheckIn',
            checkOutAt: null,
            ...(gateId && { gateId })
        }).populate({
            path: 'passId',
            populate: {
                path: 'requesterId',
                select: 'name email phone department'
            }
        }).sort({ checkInAt: -1 });

        res.json({
            success: true,
            data: activeCheckIns
        });
    })
);

module.exports = router;
