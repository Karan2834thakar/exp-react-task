const { Pass } = require('../models/Pass');

// Generate unique pass ID
const generatePassId = async (type) => {
    const typePrefix = {
        Employee: 'EMP',
        Visitor: 'VIS',
        Vehicle: 'VEH',
        Material: 'MAT'
    };

    const prefix = typePrefix[type] || 'GP';
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

    // Find the last pass of this type created today
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const lastPass = await Pass.findOne({
        type,
        createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ createdAt: -1 });

    let sequence = 1;
    if (lastPass && lastPass.passId) {
        // Extract sequence from last pass ID
        const parts = lastPass.passId.split('-');
        if (parts.length === 4) {
            sequence = parseInt(parts[3]) + 1;
        } else if (parts.length === 3) {
            // Fallback for any legacy 3-part IDs
            sequence = parseInt(parts[2]) + 1;
        }
    }

    // Format: GP-VIS-20260101-0042
    const passId = `GP-${prefix}-${dateStr}-${sequence.toString().padStart(4, '0')}`;

    return passId;
};

module.exports = { generatePassId };
