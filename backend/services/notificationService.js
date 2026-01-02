const nodemailer = require('nodemailer');

// Create transporter for Gmail
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send approval request email
const sendApprovalRequest = async (approver, pass, requester) => {
  try {
    const transporter = createTransporter();

    const approvalLink = `${process.env.FRONTEND_URL}/approvals`;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: approver.email,
      subject: `New Pass Approval Request - ${pass.passId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Pass Approval Request</h2>
          <p>Dear ${approver.name},</p>
          <p>A new gate pass requires your approval:</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Pass ID:</strong> ${pass.passId}</p>
            <p><strong>Type:</strong> ${pass.type}</p>
            <p><strong>Requested by:</strong> ${requester.name}</p>
            <p><strong>Purpose:</strong> ${pass.purpose}</p>
            <p><strong>Valid From:</strong> ${new Date(pass.validFrom).toLocaleString()}</p>
            <p><strong>Valid To:</strong> ${new Date(pass.validTo).toLocaleString()}</p>
          </div>
          
          <p>
            <a href="${approvalLink}" 
               style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Review & Approve
            </a>
          </p>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated email from the Gate Pass Management System.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Approval request email sent to ${approver.email}`);
  } catch (error) {
    console.error('Email sending error:', error);
    // Don't throw error - email failure shouldn't break the workflow
  }
};

// Send status update email
const sendStatusUpdate = async (requester, pass, status, remarks = '') => {
  try {
    const transporter = createTransporter();

    const statusColors = {
      Approved: '#4CAF50',
      Rejected: '#f44336',
      Cancelled: '#ff9800'
    };

    const passLink = `${process.env.FRONTEND_URL}/my-requests`;
    const targetEmail = pass.dispatchEmail || requester.email;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: targetEmail,
      subject: `Pass ${status} - ${pass.passId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; padding: 20px;">
          <h2 style="color: ${statusColors[status] || '#333'}; text-align: center;">Pass ${status}</h2>
          <p>Dear ${requester.name},</p>
          <p>Your gate pass has been <strong>${status.toLowerCase()}</strong>:</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Pass ID:</strong> ${pass.passId}</p>
            <p><strong>Type:</strong> ${pass.type}</p>
            <p><strong>Purpose:</strong> ${pass.purpose}</p>
            <p><strong>Valid From:</strong> ${new Date(pass.validFrom).toLocaleString()}</p>
            <p><strong>Valid To:</strong> ${new Date(pass.validTo).toLocaleString()}</p>
            ${remarks ? `<p><strong>Remarks:</strong> ${remarks}</p>` : ''}
          </div>
          
          ${status === 'Approved' && pass.qrCodeImage ? `
            <div style="text-align: center; margin: 30px 0; border: 2px dashed #4CAF50; padding: 20px; border-radius: 10px;">
              <h3 style="color: #4CAF50; margin-top: 0;">Your Entry QR Code</h3>
              <img src="cid:qrcode" alt="QR Code" style="width: 250px; height: 250px;" />
              <p style="font-size: 14px; color: #666; margin-bottom: 0;">Show this code at the gate for fast entry.</p>
            </div>
          ` : ''}
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${passLink}" 
               style="background-color: #2196F3; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
              View Full Pass Details
            </a>
          </div>
          
          <p style="color: #666; font-size: 12px; margin-top: 40px; border-top: 1px solid #eee; pt: 10px;">
            This is an automated email from the Gate Pass Management System. 
            ${pass.dispatchEmail ? `<br>This email was sent to ${pass.dispatchEmail} as requested.` : ''}
          </p>
        </div>
      `
    };

    // Attach QR code image if approved
    if (status === 'Approved' && pass.qrCodeImage) {
      mailOptions.attachments = [{
        filename: 'qrcode.png',
        content: pass.qrCodeImage.split('base64,')[1],
        encoding: 'base64',
        cid: 'qrcode'
      }];
    }

    await transporter.sendMail(mailOptions);
    console.log(`Status update email sent to ${targetEmail}`);
  } catch (error) {
    console.error('Email sending error:', error);
  }
};

// Send arrival notification to host
const sendArrivalNotification = async (host, pass, visitor) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: host.email,
      subject: `Visitor Arrived - ${pass.passId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Visitor Has Arrived</h2>
          <p>Dear ${host.name},</p>
          <p>Your visitor has checked in at the gate:</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Pass ID:</strong> ${pass.passId}</p>
            <p><strong>Visitor Name:</strong> ${visitor.name}</p>
            <p><strong>Company:</strong> ${visitor.company || 'N/A'}</p>
            <p><strong>Phone:</strong> ${visitor.phone}</p>
            <p><strong>Check-in Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated email from the Gate Pass Management System.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Arrival notification sent to ${host.email}`);
  } catch (error) {
    console.error('Email sending error:', error);
  }
};

// Send expiry reminder
const sendExpiryReminder = async (requester, pass) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: requester.email,
      subject: `Pass Expiring Soon - ${pass.passId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff9800;">Pass Expiring Soon</h2>
          <p>Dear ${requester.name},</p>
          <p>Your gate pass will expire soon:</p>
          
          <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff9800;">
            <p><strong>Pass ID:</strong> ${pass.passId}</p>
            <p><strong>Type:</strong> ${pass.type}</p>
            <p><strong>Expires At:</strong> ${new Date(pass.validTo).toLocaleString()}</p>
          </div>
          
          <p>Please ensure all activities are completed before the expiry time.</p>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated email from the Gate Pass Management System.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Expiry reminder sent to ${requester.email}`);
  } catch (error) {
    console.error('Email sending error:', error);
  }
};

module.exports = {
  sendApprovalRequest,
  sendStatusUpdate,
  sendArrivalNotification,
  sendExpiryReminder
};
