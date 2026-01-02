const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { Pass, EmployeePass, VisitorPass, VehiclePass, MaterialPass } = require('../models/Pass');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate, createPassSchema, approveRejectSchema } = require('../middleware/validation');
const upload = require('../middleware/upload');
const { generatePassId } = require('../utils/generatePassId');
const { submitForApproval, processApproval } = require('../services/approvalService');
const { logAction } = require('../services/auditService');

// @route   POST /api/passes
// @desc    Create new pass
// @access  Private (Requestor, Admin)
router.post('/',
    protect,
    authorize('Requestor', 'Admin'),
    upload.fields([
        { name: 'photo', maxCount: 10 },
        { name: 'attachments', maxCount: 5 }
    ]),
    asyncHandler(async (req, res) => {
        const passData = JSON.parse(req.body.data || '{}');

        // Validate pass data
        const { error } = createPassSchema.validate(passData);
        if (error) {
            res.status(400);
            throw new Error(error.details[0].message);
        }

        // Generate unique pass ID
        const passId = await generatePassId(passData.type);

        // Prepare common pass data
        const commonData = {
            passId,
            type: passData.type,
            tenantId: req.user.tenantId,
            siteId: passData.siteId,
            gateId: passData.gateId,
            requesterId: req.user._id,
            purpose: passData.purpose,
            validFrom: passData.validFrom,
            validTo: passData.validTo,
            remarks: passData.remarks
        };

        // Handle file uploads
        if (req.files) {
            if (req.files.attachments) {
                commonData.attachments = req.files.attachments.map(file => ({
                    filename: file.filename,
                    path: file.path,
                    mimetype: file.mimetype
                }));
            }
        }

        let pass;

        // Create pass based on type
        switch (passData.type) {
            case 'Employee':
                pass = await EmployeePass.create({
                    ...commonData,
                    employeeId: passData.employeeId,
                    passType: passData.passType
                });
                break;

            case 'Visitor':
                // Handle visitor photos
                if (req.files && req.files.photo) {
                    passData.persons = passData.persons.map((person, index) => ({
                        ...person,
                        photo: req.files.photo[index] ? req.files.photo[index].path : null
                    }));
                }

                pass = await VisitorPass.create({
                    ...commonData,
                    persons: passData.persons,
                    numPeople: passData.numPeople || passData.persons.length
                });
                break;

            case 'Vehicle':
                pass = await VehiclePass.create({
                    ...commonData,
                    vehicleNumber: passData.vehicleNumber,
                    vehicleType: passData.vehicleType,
                    driverName: passData.driverName,
                    driverPhone: passData.driverPhone,
                    driverLicense: passData.driverLicense,
                    linkedPassId: passData.linkedPassId
                });
                break;

            case 'Material':
                pass = await MaterialPass.create({
                    ...commonData,
                    materials: passData.materials
                });
                break;

            default:
                res.status(400);
                throw new Error('Invalid pass type');
        }

        // Submit for approval
        await submitForApproval(pass, req);

        res.status(201).json({
            success: true,
            message: 'Pass created successfully',
            data: pass
        });
    })
);

// @route   GET /api/passes
// @desc    Get passes (filtered by role)
// @access  Private
router.get('/',
    protect,
    asyncHandler(async (req, res) => {
        const { status, type, siteId, startDate, endDate, page = 1, limit = 10 } = req.query;

        let query = {};

        // Role-based filtering
        if (req.user.role === 'Requestor') {
            query.requesterId = req.user._id;
        } else if (req.user.role === 'Approver') {
            // Show passes pending approval or all passes for this tenant
            query.tenantId = req.user.tenantId;
        } else if (req.user.role === 'Security') {
            query.tenantId = req.user.tenantId;
        } else if (req.user.role === 'Admin') {
            // Admin can see all passes
            if (req.query.tenantId) {
                query.tenantId = req.query.tenantId;
            }
        }

        // Additional filters
        if (status) query.status = status;
        if (type) query.type = type;
        if (siteId) query.siteId = siteId;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const passes = await Pass.find(query)
            .populate('requesterId', 'name email department')
            .populate('hostId', 'name email')
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

// @route   GET /api/passes/:id
// @desc    Get pass by ID
// @access  Private
router.get('/:id',
    protect,
    asyncHandler(async (req, res) => {
        const pass = await Pass.findById(req.params.id)
            .populate('requesterId', 'name email department phone')
            .populate('hostId', 'name email phone')
            .populate('approvedBy.userId', 'name email')
            .populate('rejectedBy.userId', 'name email');

        if (!pass) {
            res.status(404);
            throw new Error('Pass not found');
        }

        // Check access permissions
        if (req.user.role === 'Requestor' && pass.requesterId._id.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Not authorized to view this pass');
        }

        res.json({
            success: true,
            data: pass
        });
    })
);

// @route   PUT /api/passes/:id
// @desc    Update pass (before approval)
// @access  Private (Requestor/Admin)
router.put('/:id',
    protect,
    authorize('Requestor', 'Admin'),
    asyncHandler(async (req, res) => {
        const pass = await Pass.findById(req.params.id);

        if (!pass) {
            res.status(404);
            throw new Error('Pass not found');
        }

        // Check if pass can be updated
        if (pass.status !== 'Pending') {
            res.status(400);
            throw new Error('Cannot update pass after approval/rejection');
        }

        // Check ownership
        if (req.user.role === 'Requestor' && pass.requesterId.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Not authorized to update this pass');
        }

        // Update allowed fields
        const allowedUpdates = ['purpose', 'validFrom', 'validTo', 'remarks'];
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                pass[field] = req.body[field];
            }
        });

        await pass.save();

        // Log action
        await logAction(req.user._id, 'Updated', 'Pass', pass._id, req.body, req);

        res.json({
            success: true,
            message: 'Pass updated successfully',
            data: pass
        });
    })
);

// @route   DELETE /api/passes/:id
// @desc    Cancel pass
// @access  Private (Requestor/Admin)
router.delete('/:id',
    protect,
    authorize('Requestor', 'Admin'),
    asyncHandler(async (req, res) => {
        const pass = await Pass.findById(req.params.id);

        if (!pass) {
            res.status(404);
            throw new Error('Pass not found');
        }

        // Check ownership
        if (req.user.role === 'Requestor' && pass.requesterId.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Not authorized to cancel this pass');
        }

        pass.status = 'Cancelled';
        await pass.save();

        // Log action
        await logAction(req.user._id, 'Cancelled', 'Pass', pass._id, {}, req);

        res.json({
            success: true,
            message: 'Pass cancelled successfully'
        });
    })
);

// @route   POST /api/passes/:id/approve
// @desc    Approve pass
// @access  Private (Approver/Admin)
router.post('/:id/approve',
    protect,
    authorize('Approver', 'Admin'),
    validate(approveRejectSchema),
    asyncHandler(async (req, res) => {
        const { remarks } = req.body;

        const pass = await processApproval(req.params.id, req.user._id, 'Approved', remarks, req);

        res.json({
            success: true,
            message: 'Pass approved successfully',
            data: pass
        });
    })
);

// @route   POST /api/passes/:id/reject
// @desc    Reject pass
// @access  Private (Approver/Admin)
router.post('/:id/reject',
    protect,
    authorize('Approver', 'Admin'),
    validate(approveRejectSchema),
    asyncHandler(async (req, res) => {
        const { remarks } = req.body;

        const pass = await processApproval(req.params.id, req.user._id, 'Rejected', remarks, req);

        res.json({
            success: true,
            message: 'Pass rejected successfully',
            data: pass
        });
    })
);

// @route   GET /api/passes/:id/qr
// @desc    Get QR code image
// @access  Private
router.get('/:id/qr',
    protect,
    asyncHandler(async (req, res) => {
        const pass = await Pass.findById(req.params.id);

        if (!pass) {
            res.status(404);
            throw new Error('Pass not found');
        }

        if (!pass.qrCodeImage) {
            res.status(400);
            throw new Error('QR code not generated yet. Pass must be approved first.');
        }

        res.json({
            success: true,
            data: {
                passId: pass.passId,
                qrCodeImage: pass.qrCodeImage,
                qrCodeData: pass.qrCodeData
            }
        });
    })
);

module.exports = router;
