const Joi = require('joi');

// Validation middleware factory
const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors
            });
        }

        next();
    };
};

// Login validation schema
const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
});

// Register validation schema
const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().required(),
    role: Joi.string().valid('Requestor', 'Approver', 'Security', 'Admin').required(),
    tenantId: Joi.string().required(),
    department: Joi.string().optional(),
    phone: Joi.string().optional(),
    employeeId: Joi.string().optional()
});

// Create pass validation schema
const createPassSchema = Joi.object({
    type: Joi.string().valid('Employee', 'Visitor', 'Vehicle', 'Material').required(),
    siteId: Joi.string().required(),
    gateId: Joi.string().optional(),
    purpose: Joi.string().required(),
    validFrom: Joi.date().iso().required(),
    validTo: Joi.date().iso().greater(Joi.ref('validFrom')).required(),
    remarks: Joi.string().required().messages({
        'any.required': 'Remarks are mandatory for audit purposes',
        'string.empty': 'Remarks cannot be empty'
    }),
    dispatchEmail: Joi.string().email().optional().allow(null, ''),

    // Employee pass fields
    employeeId: Joi.when('type', {
        is: 'Employee',
        then: Joi.string().required(),
        otherwise: Joi.forbidden()
    }),
    passType: Joi.when('type', {
        is: 'Employee',
        then: Joi.string().valid('OnDuty', 'ShortExit', 'LateEntry').required(),
        otherwise: Joi.forbidden()
    }),

    // Visitor pass fields
    persons: Joi.when('type', {
        is: 'Visitor',
        then: Joi.array().items(Joi.object({
            name: Joi.string().required(),
            phone: Joi.string().required(),
            company: Joi.string().optional().allow('', null),
            idType: Joi.string().valid('Aadhar', 'PAN', 'DrivingLicense', 'Passport', 'VoterID', 'Other').optional().allow('', null),
            idNumber: Joi.string().optional().allow('', null),
            idProofImage: Joi.string().optional().allow(null, '')
        })).min(1).required(),
        otherwise: Joi.forbidden()
    }),
    numPeople: Joi.when('type', {
        is: 'Visitor',
        then: Joi.number().min(1).optional(),
        otherwise: Joi.forbidden()
    }),

    // Vehicle pass fields
    vehicleNumber: Joi.when('type', {
        is: 'Vehicle',
        then: Joi.string().required(),
        otherwise: Joi.forbidden()
    }),
    vehicleType: Joi.when('type', {
        is: 'Vehicle',
        then: Joi.string().valid('Car', 'Bike', 'Truck', 'Van', 'Other').required(),
        otherwise: Joi.forbidden()
    }),
    driverName: Joi.when('type', {
        is: 'Vehicle',
        then: Joi.string().required(),
        otherwise: Joi.forbidden()
    }),
    driverPhone: Joi.when('type', {
        is: 'Vehicle',
        then: Joi.string().required(),
        otherwise: Joi.forbidden()
    }),
    driverLicense: Joi.when('type', {
        is: 'Vehicle',
        then: Joi.string().optional(),
        otherwise: Joi.forbidden()
    }),

    // Material pass fields
    materials: Joi.when('type', {
        is: 'Material',
        then: Joi.array().items(Joi.object({
            itemName: Joi.string().required(),
            quantity: Joi.number().min(1).required(),
            serialTag: Joi.string().optional(),
            returnable: Joi.boolean().optional(),
            expectedReturnDate: Joi.date().iso().optional(),
            receiver: Joi.string().optional(),
            department: Joi.string().optional()
        })).min(1).required(),
        otherwise: Joi.forbidden()
    })
});

// Approve/Reject pass schema
const approveRejectSchema = Joi.object({
    remarks: Joi.string().optional()
});

// Scan QR schema
const scanQRSchema = Joi.object({
    qrData: Joi.string().required(),
    gateId: Joi.string().required()
});

// Check-in/out schema
const checkInOutSchema = Joi.object({
    passId: Joi.string().required(),
    gateId: Joi.string().required(),
    gateName: Joi.string().required(),
    location: Joi.object({
        latitude: Joi.number().optional(),
        longitude: Joi.number().optional()
    }).optional().allow(null)
});

// Deny entry schema
const denyEntrySchema = Joi.object({
    passId: Joi.string().required(),
    gateId: Joi.string().required(),
    gateName: Joi.string().required(),
    denyReason: Joi.string().required()
});

module.exports = {
    validate,
    loginSchema,
    registerSchema,
    createPassSchema,
    approveRejectSchema,
    scanQRSchema,
    checkInOutSchema,
    denyEntrySchema
};
