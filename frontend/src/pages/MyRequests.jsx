import { useState, useEffect } from 'react';
import { passService } from '../services/passService';
import { Link } from 'react-router-dom';
import { Eye, X } from 'lucide-react';

const MyRequests = () => {
    const [passes, setPasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchPasses();
    }, [filter]);

    const fetchPasses = async () => {
        try {
            const params = filter !== 'all' ? { status: filter } : {};
            const response = await passService.getPasses(params);
            setPasses(response.data.passes);
        } catch (error) {
            console.error('Failed to fetch passes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id) => {
        if (window.confirm('Are you sure you want to cancel this pass?')) {
            try {
                await passService.cancelPass(id);
                fetchPasses();
            } catch (error) {
                alert('Failed to cancel pass');
            }
        }
    };

    if (loading) {
        return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">My Requests</h1>
                <Link to="/create-pass" className="btn btn-primary">Create New Pass</Link>
            </div>

            <div className="card mb-6">
                <div className="flex gap-2">
                    {['all', 'Pending', 'Approved', 'Active', 'Rejected'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg font-medium ${filter === status
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {status === 'all' ? 'All' : status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="card">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pass ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid From</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {passes.map(pass => (
                                <tr key={pass._id}>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{pass.passId}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{pass.type}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{pass.purpose.substring(0, 50)}...</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{new Date(pass.validFrom).toLocaleDateString()}</td>
                                    <td className="px-4 py-3">
                                        <span className={`badge badge-${pass.status.toLowerCase()}`}>{pass.status}</span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <div className="flex gap-2">
                                            <Link to={`/passes/${pass._id}`} className="text-primary-600 hover:text-primary-800">
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                            {pass.status === 'Pending' && (
                                                <button onClick={() => handleCancel(pass._id)} className="text-red-600 hover:text-red-800">
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {passes.length === 0 && (
                        <div className="text-center py-12 text-gray-500">No passes found</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyRequests;
