const { Pass } = require('../models/Pass');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const { sendApprovalRequest, sendStatusUpdate } = require('./notificationService');
const { generateQR } = require('./qrService');
const { logAction } = require('./auditService');

// Submit pass for approval
const submitForApproval = async (pass, req) => {
    try {
        // Get tenant settings
        const tenant = await Tenant.findById(pass.tenantId);
        if (!tenant) {
            throw new Error('Tenant not found');
        }

        // Set required approval levels
        pass.requiredApprovalLevels = tenant.settings.approvalLevels;

        // Check if auto-approve is enabled for employee passes
        if (pass.type === 'Employee' && tenant.settings.autoApproveEmployee) {
            pass.status = 'Approved';
            pass.approvalLevel = pass.requiredApprovalLevels;

            // Generate QR code
            const { qrData, qrCodeImage } = await generateQR(pass);
            pass.qrCodeData = qrData;
            pass.qrCodeImage = qrCodeImage;

            await pass.save();

            // Log action
            await logAction(pass.requesterId, 'Approved', 'Pass', pass._id,
                { status: 'Approved', autoApproved: true }, req);

            // Send notification
            const requester = await User.findById(pass.requesterId);
            await sendStatusUpdate(requester, pass, 'Approved', 'Auto-approved by system');

            return pass;
        }

        // Find approvers for level 1
        const approvers = await User.find({
            role: 'Approver',
            tenantId: pass.tenantId,
            isActive: true
        });

        if (approvers.length === 0) {
            throw new Error('No approvers found for this tenant');
        }

        // Send approval request emails
        const requester = await User.findById(pass.requesterId);
        for (const approver of approvers) {
            await sendApprovalRequest(approver, pass, requester);
        }

        // Log action
        await logAction(pass.requesterId, 'Created', 'Pass', pass._id,
            { status: 'Pending', type: pass.type }, req);

        return pass;
    } catch (error) {
        console.error('Approval submission error:', error);
        throw error;
    }
};

// Process approval/rejection
const processApproval = async (passId, approverId, decision, remarks, req) => {
    try {
        const pass = await Pass.findById(passId);
        if (!pass) {
            throw new Error('Pass not found');
        }

        if (pass.status !== 'Pending') {
            throw new Error(`Cannot ${decision.toLowerCase()} pass with status: ${pass.status}`);
        }

        const approver = await User.findById(approverId);
        if (!approver) {
            throw new Error('Approver not found');
        }

        if (decision === 'Approved') {
            // Add to approved list
            pass.approvedBy.push({
                userId: approverId,
                name: approver.name,
                level: pass.approvalLevel + 1,
                remarks: remarks || '',
                approvedAt: new Date()
            });

            pass.approvalLevel += 1;

            // Check if all required approvals are obtained
            if (pass.approvalLevel >= pass.requiredApprovalLevels) {
                pass.status = 'Approved';

                // Generate QR code
                const { qrData, qrCodeImage } = await generateQR(pass);
                pass.qrCodeData = qrData;
                pass.qrCodeImage = qrCodeImage;

                await pass.save();

                // Log action
                await logAction(approverId, 'Approved', 'Pass', pass._id,
                    { status: 'Approved', level: pass.approvalLevel }, req);

                // Send notification to requester
                const requester = await User.findById(pass.requesterId);
                await sendStatusUpdate(requester, pass, 'Approved', remarks);
            } else {
                // More approvals needed
                await pass.save();

                // Log action
                await logAction(approverId, 'Approved', 'Pass', pass._id,
                    { level: pass.approvalLevel, pendingLevel: pass.approvalLevel + 1 }, req);

                // Notify next level approvers (simplified - in production, you'd have level-specific approvers)
                const nextApprovers = await User.find({
                    role: 'Approver',
                    tenantId: pass.tenantId,
                    isActive: true
                });

                const requester = await User.findById(pass.requesterId);
                for (const nextApprover of nextApprovers) {
                    await sendApprovalRequest(nextApprover, pass, requester);
                }
            }
        } else if (decision === 'Rejected') {
            pass.status = 'Rejected';
            pass.rejectedBy = {
                userId: approverId,
                name: approver.name,
                remarks: remarks || '',
                rejectedAt: new Date()
            };

            await pass.save();

            // Log action
            await logAction(approverId, 'Rejected', 'Pass', pass._id,
                { status: 'Rejected', remarks }, req);

            // Send notification to requester
            const requester = await User.findById(pass.requesterId);
            await sendStatusUpdate(requester, pass, 'Rejected', remarks);
        }

        return pass;
    } catch (error) {
        console.error('Approval processing error:', error);
        throw error;
    }
};

// Check and expire passes (cron job function)
const checkExpiry = async () => {
    try {
        const now = new Date();

        // Find all active/approved passes that have expired
        const expiredPasses = await Pass.find({
            status: { $in: ['Approved', 'Active'] },
            validTo: { $lt: now }
        });

        for (const pass of expiredPasses) {
            pass.status = 'Expired';
            await pass.save();

            console.log(`Pass ${pass.passId} marked as expired`);

            // Log action
            await logAction(null, 'Updated', 'Pass', pass._id,
                { status: 'Expired', autoExpired: true });
        }

        console.log(`Expiry check completed. ${expiredPasses.length} passes expired.`);
    } catch (error) {
        console.error('Expiry check error:', error);
    }
};

module.exports = {
    submitForApproval,
    processApproval,
    checkExpiry
};
