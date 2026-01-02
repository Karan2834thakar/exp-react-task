const AuditLog = require('../models/AuditLog');

// Log action to audit trail
const logAction = async (userId, action, entityType, entityId, changes = {}, req = null) => {
    try {
        const auditLog = new AuditLog({
            userId,
            action,
            entityType,
            entityId,
            changes,
            ipAddress: req ? (req.ip || req.connection.remoteAddress) : null,
            userAgent: req ? req.get('user-agent') : null
        });

        await auditLog.save();
        console.log(`Audit log created: ${action} on ${entityType} by user ${userId}`);
    } catch (error) {
        console.error('Audit logging error:', error);
        // Don't throw error - audit failure shouldn't break the main operation
    }
};

module.exports = {
    logAction
};
