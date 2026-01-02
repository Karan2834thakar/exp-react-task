import api from './api';

export const adminService = {
    // User Management
    getUsers: async (params = {}) => {
        const response = await api.get('/admin/users', { params });
        return response.data;
    },

    createUser: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },

    updateUser: async (id, userData) => {
        const response = await api.put(`/admin/users/${id}`, userData);
        return response.data;
    },

    deactivateUser: async (id) => {
        const response = await api.delete(`/admin/users/${id}`);
        return response.data;
    },

    // Tenant Management
    getTenants: async () => {
        const response = await api.get('/admin/tenants');
        return response.data;
    },

    createTenant: async (tenantData) => {
        const response = await api.post('/admin/tenants', tenantData);
        return response.data;
    },

    updateTenant: async (id, tenantData) => {
        const response = await api.put(`/admin/tenants/${id}`, tenantData);
        return response.data;
    }
};

export default adminService;
