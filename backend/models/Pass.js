const mongoose = require('mongoose');

// Base Pass Schema
const passSchema = new mongoose.Schema({
    passId: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        enum: ['Employee', 'Visitor', 'Vehicle', 'Material'],
        required: true
    },
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true
    },
    siteId: {
        type: String,
        required: true
    },
    gateId: {
        type: String
    },
    requesterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    hostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Active', 'Expired', 'CheckedOut', 'Cancelled'],
        default: 'Pending'
    },
    purpose: {
        type: String,
        required: true,
        trim: true
    },
    validFrom: {
        type: Date,
        required: true
    },
    validTo: {
        type: Date,
        required: true
    },
    approvalLevel: {
        type: Number,
        default: 0
    },
    requiredApprovalLevels: {
        type: Number,
        default: 1
    },
    approvedBy: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        name: String,
        level: Number,
        remarks: String,
        approvedAt: {
            type: Date,
            default: Date.now
        }
    }],
    rejectedBy: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        name: String,
        remarks: String,
        rejectedAt: Date
    },
    remarks: {
        type: String
    },
    qrCodeData: {
        type: String
    },
    qrCodeImage: {
        type: String
    },
    attachments: [{
        filename: String,
        path: String,
        mimetype: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    dispatchEmail: {
        type: String,
        trim: true,
        lowercase: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    discriminatorKey: 'type',
    timestamps: true
});

// Indexes for performance

passSchema.index({ status: 1 });
passSchema.index({ requesterId: 1 });
passSchema.index({ validFrom: 1, validTo: 1 });
passSchema.index({ tenantId: 1, siteId: 1 });

const Pass = mongoose.model('Pass', passSchema);

// Employee Pass Discriminator
const employeePassSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: true
    },
    passType: {
        type: String,
        enum: ['OnDuty', 'ShortExit', 'LateEntry'],
        required: true
    }
});

const EmployeePass = Pass.discriminator('Employee', employeePassSchema);

// Visitor Pass Discriminator
const visitorPassSchema = new mongoose.Schema({
    persons: [{
        name: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        company: {
            type: String
        },
        photo: {
            type: String
        },
        idType: {
            type: String,
            enum: ['Aadhar', 'PAN', 'DrivingLicense', 'Passport', 'VoterID', 'Other']
        },
        idNumber: {
            type: String
        }
    }],
    numPeople: {
        type: Number,
        default: 1,
        min: 1
    }
});

const VisitorPass = Pass.discriminator('Visitor', visitorPassSchema);

// Vehicle Pass Discriminator
const vehiclePassSchema = new mongoose.Schema({
    vehicleNumber: {
        type: String,
        required: true,
        uppercase: true
    },
    vehicleType: {
        type: String,
        enum: ['Car', 'Bike', 'Truck', 'Van', 'Other'],
        required: true
    },
    driverName: {
        type: String,
        required: true
    },
    driverPhone: {
        type: String,
        required: true
    },
    driverLicense: {
        type: String
    },
    linkedPassId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pass'
    }
});

const VehiclePass = Pass.discriminator('Vehicle', vehiclePassSchema);

// Material Pass Discriminator
const materialPassSchema = new mongoose.Schema({
    materials: [{
        itemName: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        serialTag: {
            type: String
        },
        returnable: {
            type: Boolean,
            default: false
        },
        expectedReturnDate: {
            type: Date
        },
        actualReturnDate: {
            type: Date
        },
        receiver: {
            type: String
        },
        department: {
            type: String
        }
    }]
});

const MaterialPass = Pass.discriminator('Material', materialPassSchema);

module.exports = {
    Pass,
    EmployeePass,
    VisitorPass,
    VehiclePass,
    MaterialPass
};
