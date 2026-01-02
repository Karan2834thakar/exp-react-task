import api from './api';

export const reportService = {
    // Get dashboard stats
    getDashboardStats: async (tenantId) => {
        const response = await api.get('/reports/dashboard', { params: { tenantId } });
        return response.data;
    },

    // Get daily register
    getDailyRegister: async (date, format = 'json') => {
        const response = await api.get('/reports/daily-register', {
            params: { date, format },
            ...(format === 'csv' && { responseType: 'blob' })
        });
        return response.data;
    },

    // Get active visitors
    getActiveVisitors: async () => {
        const response = await api.get('/reports/active-visitors');
        return response.data;
    },

    // Get pass history
    getPassHistory: async (filters = {}) => {
        const response = await api.get('/reports/pass-history', { params: filters });
        return response.data;
    },

    // Get audit trail
    getAuditTrail: async (filters = {}) => {
        const response = await api.get('/reports/audit-trail', { params: filters });
        return response.data;
    }
};

export default reportService;
