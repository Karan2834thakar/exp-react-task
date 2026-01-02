require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const cron = require('node-cron');
const { checkExpiry } = require('./services/approvalService');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/passes', require('./routes/passes'));
app.use('/api/gates', require('./routes/gates'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Gate Pass Management System API is running',
        timestamp: new Date().toISOString()
    });
});

// Cron jobs
// Check for expired passes every hour
cron.schedule('0 * * * *', () => {
    console.log('Running expiry check...');
    checkExpiry();
});

// Error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = app;
