import api from './api';

export const gateService = {
    // Scan QR code
    scanQR: async (qrData, gateId) => {
        const response = await api.post('/gates/scan', { qrData, gateId });
        return response.data;
    },

    // Check-in
    checkIn: async (passId, gateId, gateName, location) => {
        const response = await api.post('/gates/checkin', {
            passId,
            gateId,
            gateName,
            location
        });
        return response.data;
    },

    // Check-out
    checkOut: async (passId, gateId, gateName, location) => {
        const response = await api.post('/gates/checkout', {
            passId,
            gateId,
            gateName,
            location
        });
        return response.data;
    },

    // Deny entry
    denyEntry: async (passId, gateId, gateName, denyReason) => {
        const response = await api.post('/gates/deny', {
            passId,
            gateId,
            gateName,
            denyReason
        });
        return response.data;
    },

    // Get active passes
    getActivePasses: async (gateId) => {
        const response = await api.get('/gates/active', { params: { gateId } });
        return response.data;
    }
};

export default gateService;
