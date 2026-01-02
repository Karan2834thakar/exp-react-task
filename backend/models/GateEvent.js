const mongoose = require('mongoose');

const gateEventSchema = new mongoose.Schema({
    passId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pass',
        required: true
    },
    gateId: {
        type: String,
        required: true
    },
    gateName: {
        type: String,
        required: true
    },
    scannedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    eventType: {
        type: String,
        enum: ['CheckIn', 'CheckOut', 'Denied'],
        required: true
    },
    checkInAt: {
        type: Date
    },
    checkOutAt: {
        type: Date
    },
    denyReason: {
        type: String
    },
    location: {
        latitude: Number,
        longitude: Number
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes
gateEventSchema.index({ passId: 1 });
gateEventSchema.index({ gateId: 1 });
gateEventSchema.index({ createdAt: -1 });

module.exports = mongoose.model('GateEvent', gateEventSchema);
