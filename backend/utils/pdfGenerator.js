const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Generate printable pass badge PDF
const generatePassBadge = async (pass, outputPath) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const stream = fs.createWriteStream(outputPath);

            doc.pipe(stream);

            // Header
            doc.fontSize(24).font('Helvetica-Bold').text('GATE PASS', { align: 'center' });
            doc.moveDown(0.5);

            // Pass ID (large and prominent)
            doc.fontSize(16).font('Helvetica-Bold').text(pass.passId, { align: 'center' });
            doc.moveDown(1);

            // Pass details
            doc.fontSize(12).font('Helvetica');

            const details = [
                ['Type:', pass.type],
                ['Purpose:', pass.purpose],
                ['Valid From:', new Date(pass.validFrom).toLocaleString()],
                ['Valid To:', new Date(pass.validTo).toLocaleString()],
                ['Status:', pass.status]
            ];

            details.forEach(([label, value]) => {
                doc.font('Helvetica-Bold').text(label, { continued: true });
                doc.font('Helvetica').text(` ${value}`);
                doc.moveDown(0.3);
            });

            doc.moveDown(1);

            // QR Code (if available)
            if (pass.qrCodeImage) {
                // Remove data URL prefix
                const base64Data = pass.qrCodeImage.replace(/^data:image\/png;base64,/, '');
                const imgBuffer = Buffer.from(base64Data, 'base64');

                // Save temp image
                const tempImgPath = path.join(__dirname, '../uploads/temp_qr.png');
                fs.writeFileSync(tempImgPath, imgBuffer);

                // Add to PDF
                doc.image(tempImgPath, {
                    fit: [200, 200],
                    align: 'center'
                });

                // Clean up temp file
                fs.unlinkSync(tempImgPath);
            }

            doc.moveDown(1);

            // Footer
            doc.fontSize(10).font('Helvetica-Oblique')
                .text('Please present this pass at the gate for verification', { align: 'center' });

            doc.end();

            stream.on('finish', () => {
                resolve(outputPath);
            });

            stream.on('error', (error) => {
                reject(error);
            });
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generatePassBadge };
