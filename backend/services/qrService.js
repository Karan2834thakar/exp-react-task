const QRCode = require('qrcode');
const crypto = require('crypto');

// Generate signed QR code
const generateQR = async (passData) => {
    try {
        // Create payload
        const payload = {
            passId: passData.passId,
            type: passData.type,
            validFrom: passData.validFrom,
            validTo: passData.validTo,
            status: passData.status,
            timestamp: Date.now()
        };

        // Create signature
        const signature = crypto
            .createHmac('sha256', process.env.QR_SECRET)
            .update(JSON.stringify(payload))
            .digest('hex');

        // Combine payload and signature
        const qrData = {
            ...payload,
            signature
        };

        // Generate QR code image (base64)
        const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrData), {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            quality: 0.95,
            margin: 1,
            width: 300
        });

        return {
            qrData: JSON.stringify(qrData),
            qrCodeImage
        };
    } catch (error) {
        console.error('QR Generation Error:', error);
        throw new Error('Failed to generate QR code');
    }
};

// Validate QR code
const validateQR = (qrDataString) => {
    try {
        const qrData = JSON.parse(qrDataString);

        // Extract signature
        const { signature, ...payload } = qrData;

        // Verify signature
        const expectedSignature = crypto
            .createHmac('sha256', process.env.QR_SECRET)
            .update(JSON.stringify(payload))
            .digest('hex');

        if (signature !== expectedSignature) {
            return {
                valid: false,
                error: 'Invalid QR signature - QR code has been tampered with'
            };
        }

        // Check expiry
        const now = new Date();
        const validTo = new Date(payload.validTo);

        if (now > validTo) {
            return {
                valid: false,
                error: 'Pass has expired'
            };
        }

        // Check if pass is approved or active/recently checked out (for re-entry)
        const allowedStatuses = ['Approved', 'Active', 'CheckedOut'];
        if (!allowedStatuses.includes(payload.status)) {
            return {
                valid: false,
                error: `Pass is not in a valid state for entry (Status: ${payload.status})`
            };
        }

        // Check time window
        const validFrom = new Date(payload.validFrom);
        if (now < validFrom) {
            return {
                valid: false,
                error: `Pass is not valid yet (Starts at: ${validFrom.toLocaleString()})`
            };
        }

        return {
            valid: true,
            data: payload
        };
    } catch (error) {
        console.error('QR Validation Error:', error);
        return {
            valid: false,
            error: 'Invalid QR code format'
        };
    }
};

module.exports = {
    generateQR,
    validateQR
};
