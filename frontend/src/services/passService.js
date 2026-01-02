import api from './api';

export const passService = {
    // Create pass
    createPass: async (passData, files) => {
        const formData = new FormData();
        formData.append('data', JSON.stringify(passData));

        if (files?.photos) {
            files.photos.forEach((photo) => {
                formData.append('photo', photo);
            });
        }

        if (files?.attachments) {
            files.attachments.forEach((attachment) => {
                formData.append('attachments', attachment);
            });
        }

        const response = await api.post('/passes', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // Get passes with filters
    getPasses: async (filters = {}) => {
        const response = await api.get('/passes', { params: filters });
        return response.data;
    },

    // Get pass by ID
    getPassById: async (id) => {
        const response = await api.get(`/passes/${id}`);
        return response.data;
    },

    // Update pass
    updatePass: async (id, updates) => {
        const response = await api.put(`/passes/${id}`, updates);
        return response.data;
    },

    // Cancel pass
    cancelPass: async (id) => {
        const response = await api.delete(`/passes/${id}`);
        return response.data;
    },

    // Approve pass
    approvePass: async (id, remarks) => {
        const response = await api.post(`/passes/${id}/approve`, { remarks });
        return response.data;
    },

    // Reject pass
    rejectPass: async (id, remarks) => {
        const response = await api.post(`/passes/${id}/reject`, { remarks });
        return response.data;
    },

    // Get QR code
    getQRCode: async (id) => {
        const response = await api.get(`/passes/${id}/qr`);
        return response.data;
    }
};

export default passService;
