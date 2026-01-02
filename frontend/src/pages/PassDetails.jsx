import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { passService } from '../services/passService';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, CheckCircle, XCircle, Clock, MapPin, User, Calendar, FileText, Mail } from 'lucide-react';

const PassDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [pass, setPass] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [remarks, setRemarks] = useState('');

    useEffect(() => {
        fetchPassDetails();
    }, [id]);

    const fetchPassDetails = async () => {
        try {
            const response = await passService.getPassById(id);
            setPass(response.data);
        } catch (error) {
            console.error('Failed to fetch pass details:', error);
            setError('Failed to load pass details');
        } finally {
            setLoading(false);
        }
    };

    const handleApproval = async (decision) => {
        setSubmitting(true);
        try {
            if (decision === 'Approved') {
                await passService.approvePass(id, remarks);
            } else {
                await passService.rejectPass(id, remarks);
            }
            fetchPassDetails();
            setRemarks('');
        } catch (error) {
            alert(`Failed to ${decision.toLowerCase()} pass`);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error || !pass) {
        return (
            <div className="card text-center py-12">
                <p className="text-red-600">{error || 'Pass not found'}</p>
                <button onClick={() => navigate(-1)} className="mt-4 btn btn-secondary">Go Back</button>
            </div>
        );
    }

    const canApprove = (user.role === 'Approver' || user.role === 'Admin') && pass.status === 'Pending';

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Back
                </button>
                <div className="flex gap-2">
                    <span className={`badge badge-${pass.status.toLowerCase()} text-sm px-4 py-1`}>
                        {pass.status}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Pass Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <FileText className="h-5 w-5 mr-2 text-primary-600" />
                            Pass Information - {pass.passId}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Valid Period</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {new Date(pass.validFrom).toLocaleString()}<br />
                                        to<br />
                                        {new Date(pass.validTo).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Location</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        Site: {pass.siteId}<br />
                                        Gate: {pass.gateId || 'Main Gate'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 md:col-span-2">
                                <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Purpose</p>
                                    <p className="text-sm font-medium text-gray-900">{pass.purpose}</p>
                                </div>
                            </div>

                            {pass.remarks && (
                                <div className="flex items-start gap-3 md:col-span-2">
                                    <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-semibold">Requester Remarks</p>
                                        <p className="text-sm italic text-gray-700">{pass.remarks}</p>
                                    </div>
                                </div>
                            )}

                            {pass.dispatchEmail && (
                                <div className="flex items-start gap-3 md:col-span-2 border-t pt-4">
                                    <Mail className="h-5 w-5 text-primary-500 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-semibold">QR Delivery Email</p>
                                        <p className="text-sm font-medium text-primary-700">{pass.dispatchEmail}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Type Specific Info */}
                    <div className="card">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">{pass.type} Details</h3>

                        {pass.type === 'Visitor' && pass.persons?.map((person, idx) => (
                            <div key={idx} className="flex items-start gap-4">
                                <div className="bg-gray-100 p-4 rounded-lg">
                                    <User className="h-8 w-8 text-gray-400" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-lg font-bold text-gray-900">{person.name}</p>
                                    <p className="text-sm text-gray-600">📞 {person.phone}</p>
                                    {person.company && <p className="text-sm text-gray-600">🏢 {person.company}</p>}
                                    {person.idType && <p className="text-xs text-gray-500">{person.idType}: {person.idNumber}</p>}
                                </div>
                            </div>
                        ))}

                        {pass.type === 'Employee' && (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-500">Employee ID</p>
                                    <p className="text-lg font-bold text-gray-900">{pass.employeeId}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Pass Type</p>
                                    <p className="inline-block bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm font-bold">
                                        {pass.passType}
                                    </p>
                                </div>
                            </div>
                        )}

                        {pass.type === 'Vehicle' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Vehicle Number</p>
                                    <p className="text-xl font-bold text-gray-900">{pass.vehicleNumber}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Type</p>
                                    <p className="text-lg font-medium text-gray-900">{pass.vehicleType}</p>
                                </div>
                                <div className="col-span-2 border-t pt-4">
                                    <p className="text-sm text-gray-500">Driver</p>
                                    <p className="text-lg font-bold text-gray-900">{pass.driverName}</p>
                                    <p className="text-sm text-gray-600">📞 {pass.driverPhone}</p>
                                </div>
                            </div>
                        )}

                        {pass.type === 'Material' && pass.materials?.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                                <div>
                                    <p className="font-bold text-gray-900">{item.itemName}</p>
                                    <p className="text-xs text-gray-500 italic">{item.returnable ? 'Returnable' : 'Non-returnable'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-primary-600">{item.quantity}</p>
                                    <p className="text-xs text-gray-500 text-uppercase">Items</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar: QR / Actions */}
                <div className="space-y-6">
                    {pass.status === 'Approved' && pass.qrCodeImage ? (
                        <div className="card text-center border-2 border-green-500">
                            <h3 className="text-lg font-bold text-green-700 mb-4">Pass Approved!</h3>
                            <div className="bg-white p-2 border inline-block rounded-lg mb-4">
                                <img src={pass.qrCodeImage} alt="Pass QR" className="w-48 h-48" />
                            </div>
                            <p className="text-xs text-gray-500 mb-4">Scan this at the gate for entry</p>
                            <button
                                onClick={() => window.print()}
                                className="w-full btn btn-primary flex items-center justify-center gap-2"
                            >
                                <FileText className="h-4 w-4" />
                                Print / Save PDF
                            </button>
                        </div>
                    ) : pass.status === 'Pending' ? (
                        <div className="card bg-yellow-50 border border-yellow-200">
                            <h3 className="text-lg font-bold text-yellow-800 mb-4 flex items-center">
                                <Clock className="h-5 w-5 mr-2" />
                                Pending Approval
                            </h3>
                            <p className="text-sm text-yellow-700 mb-4">
                                This pass is waiting for {pass.requiredApprovalLevels - pass.approvalLevel} more approval level(s).
                            </p>

                            {canApprove && (
                                <div className="space-y-4 pt-4 border-t border-yellow-200">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Approval Remarks</label>
                                        <textarea
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            className="input"
                                            rows="2"
                                            placeholder="Reason for approval/rejection..."
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            disabled={submitting}
                                            onClick={() => handleApproval('Approved')}
                                            className="btn bg-green-600 text-white hover:bg-green-700 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                            {submitting ? 'Processing...' : 'Approve Pass'}
                                        </button>
                                        <button
                                            disabled={submitting}
                                            onClick={() => handleApproval('Rejected')}
                                            className="btn bg-red-600 text-white hover:bg-red-700 flex items-center justify-center gap-2"
                                        >
                                            <XCircle className="h-4 w-4" />
                                            Reject Request
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}

                    <div className="card">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Pass Overview</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Requested By</span>
                                <span className="font-medium text-gray-900">{pass.requesterId?.name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Created On</span>
                                <span className="font-medium text-gray-900">{new Date(pass.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Approvals</span>
                                <span className="font-medium text-gray-900">{pass.approvalLevel} / {pass.requiredApprovalLevels}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PassDetails;
