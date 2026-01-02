import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { reportService } from '../services/reportService';
import { BarChart3, Users, FileCheck, Clock, TrendingUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const response = await reportService.getDashboardStats();
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusCount = (status) => {
        const item = stats?.passesByStatus?.find(s => s._id === status);
        return item?.count || 0;
    };

    const getTypeCount = (type) => {
        const item = stats?.passesByType?.find(t => t._id === type);
        return item?.count || 0;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
                </div>
                {user?.role === 'Requestor' && (
                    <Link to="/create-pass" className="btn btn-primary">
                        Create New Pass
                    </Link>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Active Visitors</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {stats?.activeVisitors || 0}
                            </p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-full">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {stats?.pendingApprovals || 0}
                            </p>
                        </div>
                        <div className="bg-yellow-100 p-3 rounded-full">
                            <Clock className="h-6 w-6 text-yellow-600" />
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Today's Check-ins</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {stats?.todayCheckIns || 0}
                            </p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-full">
                            <FileCheck className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Passes</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {stats?.passesByStatus?.reduce((sum, s) => sum + s.count, 0) || 0}
                            </p>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-full">
                            <BarChart3 className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Passes by Type */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Passes by Type</h3>
                    <div className="space-y-3">
                        {['Employee', 'Visitor', 'Vehicle', 'Material'].map(type => (
                            <div key={type} className="flex justify-between items-center">
                                <span className="text-gray-700">{type}</span>
                                <span className="font-semibold text-gray-900">{getTypeCount(type)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Passes by Status</h3>
                    <div className="space-y-3">
                        {['Pending', 'Approved', 'Active', 'Expired', 'Rejected'].map(status => (
                            <div key={status} className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className={`badge badge-${status.toLowerCase()}`}>{status}</span>
                                </div>
                                <span className="font-semibold text-gray-900">{getStatusCount(status)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Passes</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pass ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requester</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {stats?.recentPasses?.map(pass => (
                                <tr key={pass._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/passes/${pass._id}`)}>
                                    <td className="px-4 py-3 text-sm font-medium text-primary-600">{pass.passId}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{pass.type}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{pass.requesterId?.name}</td>
                                    <td className="px-4 py-3">
                                        <span className={`badge badge-${pass.status.toLowerCase()}`}>{pass.status}</span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                        {new Date(pass.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
