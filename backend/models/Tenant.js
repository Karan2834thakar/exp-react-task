const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tenant name is required'],
        trim: true
    },
    sites: [{
        siteId: {
            type: String,
            required: true
        },
        siteName: {
            type: String,
            required: true
        },
        address: {
            type: String
        },
        gates: [{
            gateId: {
                type: String,
                required: true
            },
            gateName: {
                type: String,
                required: true
            },
            location: {
                type: String
            }
        }]
    }],
    settings: {
        approvalLevels: {
            type: Number,
            default: 1,
            min: 1,
            max: 3
        },
        defaultPassExpiry: {
            employee: { type: Number, default: 24 }, // hours
            visitor: { type: Number, default: 12 },
            vehicle: { type: Number, default: 12 },
            material: { type: Number, default: 48 }
        },
        autoApproveEmployee: {
            type: Boolean,
            default: false
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Tenant', tenantSchema);
