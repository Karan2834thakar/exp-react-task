require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const { Pass, EmployeePass, VisitorPass } = require('../models/Pass');

const seedDatabase = async () => {
    try {
        await connectDB();

        // Clear existing data
        console.log('Clearing existing data...');
        await User.deleteMany({});
        await Tenant.deleteMany({});
        await Pass.deleteMany({});

        // Create default tenant
        console.log('Creating default tenant...');
        const tenant = await Tenant.create({
            name: 'Acme Corporation',
            sites: [
                {
                    siteId: 'SITE001',
                    siteName: 'Main Office',
                    address: '123 Business Park, Tech City',
                    gates: [
                        { gateId: 'GATE001', gateName: 'Main Gate', location: 'North Entrance' },
                        { gateId: 'GATE002', gateName: 'Parking Gate', location: 'West Parking' }
                    ]
                },
                {
                    siteId: 'SITE002',
                    siteName: 'Warehouse',
                    address: '456 Industrial Area, Tech City',
                    gates: [
                        { gateId: 'GATE003', gateName: 'Warehouse Gate', location: 'Loading Dock' }
                    ]
                }
            ],
            settings: {
                approvalLevels: 1,
                defaultPassExpiry: {
                    employee: 24,
                    visitor: 12,
                    vehicle: 12,
                    material: 48
                },
                autoApproveEmployee: false
            }
        });

        console.log('Tenant created:', tenant.name);

        // Create users
        console.log('Creating users...');

        const admin = await User.create({
            email: 'admin@gatepass.com',
            password: 'Admin@123',
            name: 'System Administrator',
            role: 'Admin',
            tenantId: tenant._id,
            department: 'IT',
            phone: '+1234567890',
            employeeId: 'EMP001'
        });

        const approver = await User.create({
            email: 'approver@gatepass.com',
            password: 'Approver@123',
            name: 'John Manager',
            role: 'Approver',
            tenantId: tenant._id,
            department: 'HR',
            phone: '+1234567891',
            employeeId: 'EMP002'
        });

        const security = await User.create({
            email: 'security@gatepass.com',
            password: 'Security@123',
            name: 'Mike Guard',
            role: 'Security',
            tenantId: tenant._id,
            department: 'Security',
            phone: '+1234567892',
            employeeId: 'SEC001'
        });

        const requestor = await User.create({
            email: 'requestor@gatepass.com',
            password: 'Requestor@123',
            name: 'Jane Employee',
            role: 'Requestor',
            tenantId: tenant._id,
            department: 'Sales',
            phone: '+1234567893',
            employeeId: 'EMP003'
        });

        console.log('Users created:');
        console.log('- Admin:', admin.email);
        console.log('- Approver:', approver.email);
        console.log('- Security:', security.email);
        console.log('- Requestor:', requestor.email);

        // Create sample passes
        console.log('Creating sample passes...');

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);

        const tomorrowEnd = new Date(tomorrow);
        tomorrowEnd.setHours(18, 0, 0, 0);

        await EmployeePass.create({
            passId: 'GP-EMP-20260101-0001',
            type: 'Employee',
            tenantId: tenant._id,
            siteId: 'SITE001',
            gateId: 'GATE001',
            requesterId: requestor._id,
            status: 'Pending',
            purpose: 'Client meeting at downtown office',
            validFrom: tomorrow,
            validTo: tomorrowEnd,
            employeeId: 'EMP003',
            passType: 'OnDuty',
            requiredApprovalLevels: 1
        });

        await VisitorPass.create({
            passId: 'GP-VIS-20260101-0001',
            type: 'Visitor',
            tenantId: tenant._id,
            siteId: 'SITE001',
            gateId: 'GATE001',
            requesterId: requestor._id,
            hostId: requestor._id,
            status: 'Pending',
            purpose: 'Business discussion and product demo',
            validFrom: tomorrow,
            validTo: tomorrowEnd,
            persons: [
                {
                    name: 'Robert Client',
                    phone: '+1234567899',
                    company: 'Client Corp',
                    idType: 'DrivingLicense',
                    idNumber: 'DL123456789'
                }
            ],
            numPeople: 1,
            requiredApprovalLevels: 1
        });

        console.log('Sample passes created');

        console.log('\n✅ Database seeded successfully!');
        console.log('\n📝 Default Credentials:');
        console.log('Admin:     admin@gatepass.com / Admin@123');
        console.log('Approver:  approver@gatepass.com / Approver@123');
        console.log('Security:  security@gatepass.com / Security@123');
        console.log('Requestor: requestor@gatepass.com / Requestor@123');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
