import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { UserPlus, UserX, Edit2, Search, Filter, Shield, User as UserIcon, Check, X } from 'lucide-react';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'Requestor',
        tenantId: '',
        department: '',
        phone: '',
        employeeId: ''
    });
    const [filters, setFilters] = useState({
        role: '',
        status: 'all'
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchData();
    }, [filters]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = {
                ...(filters.role && { role: filters.role }),
                ...(filters.status !== 'all' && { isActive: filters.status === 'active' })
            };
            const [usersRes, tenantsRes] = await Promise.all([
                adminService.getUsers(params),
                adminService.getTenants()
            ]);
            setUsers(usersRes.data.users);
            setTenants(tenantsRes.data);

            // Set default tenant if not set and available
            if (!formData.tenantId && tenantsRes.data.length > 0) {
                setFormData(prev => ({ ...prev, tenantId: tenantsRes.data[0]._id }));
            }
        } catch (err) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            if (editingUser) {
                await adminService.updateUser(editingUser._id, formData);
                setSuccess('User updated successfully');
            } else {
                await adminService.createUser(formData);
                setSuccess('User created successfully');
            }
            setShowModal(false);
            setEditingUser(null);
            setFormData({
                name: '', email: '', password: '', role: 'Requestor',
                tenantId: tenants[0]?._id || '', department: '', phone: '', employeeId: ''
            });
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Action failed');
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '', // Don't show password
            role: user.role,
            tenantId: user.tenantId?._id || user.tenantId,
            department: user.department || '',
            phone: user.phone || '',
            employeeId: user.employeeId || ''
        });
        setShowModal(true);
    };

    const handleDeactivate = async (id, currentStatus) => {
        if (window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'reactivate'} this user?`)) {
            try {
                if (currentStatus) {
                    await adminService.deactivateUser(id);
                } else {
                    await adminService.updateUser(id, { isActive: true });
                }
                fetchData();
            } catch (err) {
                setError('Failed to update user status');
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                <button
                    onClick={() => {
                        setEditingUser(null);
                        setFormData({
                            name: '', email: '', password: '', role: 'Requestor',
                            tenantId: tenants[0]?._id || '', department: '', phone: '', employeeId: ''
                        });
                        setShowModal(true);
                    }}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <UserPlus className="h-5 w-5" />
                    Add New User
                </button>
            </div>

            {/* Filters */}
            <div className="card flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Filter by:</span>
                </div>
                <select
                    value={filters.role}
                    onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                    className="input py-1 text-sm max-w-xs"
                >
                    <option value="">All Roles</option>
                    <option value="Requestor">Requestor</option>
                    <option value="Approver">Approver</option>
                    <option value="Security">Security</option>
                    <option value="Admin">Admin</option>
                </select>
                <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="input py-1 text-sm max-w-xs"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>

            {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">{error}</div>}
            {success && <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200">{success}</div>}

            {/* User Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map(user => (
                                <tr key={user._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {user.tenantId?.name || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {user.isActive ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                Inactive
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-3">
                                            <button onClick={() => handleEdit(user)} className="text-primary-600 hover:text-primary-900">
                                                <Edit2 className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeactivate(user._id, user.isActive)}
                                                className={user.isActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                                            >
                                                {user.isActive ? <UserX className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!loading && users.length === 0 && (
                        <div className="text-center py-12 text-gray-500">No users found</div>
                    )}
                </div>
            </div>

            {/* User Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setShowModal(false)}>
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <form onSubmit={handleSubmit} className="p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-6 font-primary">
                                    {editingUser ? 'Edit User' : 'Add New User'}
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                        <input
                                            name="name" required value={formData.name} onChange={handleChange}
                                            className="input" placeholder="John Doe"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                        <input
                                            name="email" type="email" required value={formData.email} onChange={handleChange}
                                            disabled={!!editingUser}
                                            className="input disabled:bg-gray-50" placeholder="john@company.com"
                                        />
                                    </div>

                                    {!editingUser && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                            <input
                                                name="password" type="password" required value={formData.password} onChange={handleChange}
                                                className="input" placeholder="••••••••" minLength={6}
                                            />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                            <select name="role" value={formData.role} onChange={handleChange} className="input">
                                                <option value="Requestor">Requestor</option>
                                                <option value="Approver">Approver</option>
                                                <option value="Security">Security</option>
                                                <option value="Admin">Admin</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Tenant</label>
                                            <select name="tenantId" value={formData.tenantId} onChange={handleChange} className="input" required>
                                                {tenants.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                            <input
                                                name="department" value={formData.department} onChange={handleChange}
                                                className="input" placeholder="IT, HR, etc."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                            <input
                                                name="phone" value={formData.phone} onChange={handleChange}
                                                className="input" placeholder="10 Digits"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                                        <input
                                            name="employeeId" value={formData.employeeId} onChange={handleChange}
                                            className="input" placeholder="EMP123"
                                        />
                                    </div>
                                </div>

                                <div className="mt-8 flex gap-3">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary flex-1">
                                        {editingUser ? 'Save Changes' : 'Create User'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
