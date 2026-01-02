import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { passService } from '../services/passService';
import { ArrowLeft } from 'lucide-react';

const CreatePass = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        type: 'Visitor',
        siteId: 'SITE001',
        gateId: 'GATE001',
        purpose: '',
        validFrom: '',
        validTo: '',
        remarks: '',
        dispatchEmail: '',
        // Visitor fields
        visitorName: '',
        visitorPhone: '',
        visitorCompany: '',
        visitorIdType: 'Aadhar',
        visitorIdNumber: '',
        // Employee fields
        employeeId: '',
        passType: 'OnDuty',
        // Vehicle fields
        vehicleNumber: '',
        vehicleType: 'Car',
        driverName: '',
        driverPhone: '',
        // Material fields
        itemName: '',
        quantity: 1,
        returnable: false
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Robust Validation
        const fromDate = new Date(formData.validFrom);
        const toDate = new Date(formData.validTo);
        const now = new Date();

        if (fromDate < now && formData.type !== 'Employee') { // Allow backdating for some employee cases if needed, but generally avoid
            setError('Start date cannot be in the past.');
            return;
        }

        if (toDate <= fromDate) {
            setError('Expiry date must be after the start date.');
            return;
        }

        if (formData.purpose.trim().length < 5) {
            setError('Purpose must be at least 5 characters long.');
            return;
        }

        // Email validation if provided
        if (formData.dispatchEmail && !formData.dispatchEmail.includes('@')) {
            setError('Please enter a valid email for QR delivery.');
            return;
        }

        // Phone validation
        const phoneRegex = /^\d{10}$/;
        if (formData.type === 'Visitor' && !phoneRegex.test(formData.visitorPhone)) {
            setError('Please enter a valid 10-digit phone number for the visitor.');
            return;
        }

        if (formData.type === 'Vehicle' && !phoneRegex.test(formData.driverPhone)) {
            setError('Please enter a valid 10-digit phone number for the driver.');
            return;
        }

        setLoading(true);

        try {
            const passData = {
                type: formData.type,
                siteId: formData.siteId,
                gateId: formData.gateId,
                purpose: formData.purpose,
                validFrom: formData.validFrom,
                validTo: formData.validTo,
                remarks: formData.remarks,
                dispatchEmail: formData.dispatchEmail
            };

            // Add type-specific fields
            if (formData.type === 'Visitor') {
                passData.persons = [{
                    name: formData.visitorName,
                    phone: formData.visitorPhone,
                    company: formData.visitorCompany,
                    idType: formData.visitorIdType,
                    idNumber: formData.visitorIdNumber
                }];
                passData.numPeople = 1;
            } else if (formData.type === 'Employee') {
                passData.employeeId = formData.employeeId;
                passData.passType = formData.passType;
            } else if (formData.type === 'Vehicle') {
                passData.vehicleNumber = formData.vehicleNumber;
                passData.vehicleType = formData.vehicleType;
                passData.driverName = formData.driverName;
                passData.driverPhone = formData.driverPhone;
            } else if (formData.type === 'Material') {
                passData.materials = [{
                    itemName: formData.itemName,
                    quantity: parseInt(formData.quantity),
                    returnable: formData.returnable
                }];
            }

            await passService.createPass(passData);
            navigate('/my-requests');
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to create pass');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6">
                <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Back
                </button>
                <h1 className="text-3xl font-bold text-gray-900">Create Gate Pass</h1>
                <p className="text-gray-600 mt-1">Fill in the details to create a new gate pass</p>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="card space-y-6">
                {/* Pass Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pass Type</label>
                    <select name="type" value={formData.type} onChange={handleChange} className="input">
                        <option value="Visitor">Visitor Pass</option>
                        <option value="Employee">Employee Pass</option>
                        <option value="Vehicle">Vehicle Pass</option>
                        <option value="Material">Material Pass</option>
                    </select>
                </div>

                {/* Common Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
                        <select name="siteId" value={formData.siteId} onChange={handleChange} className="input">
                            <option value="SITE001">Main Office</option>
                            <option value="SITE002">Warehouse</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gate</label>
                        <select name="gateId" value={formData.gateId} onChange={handleChange} className="input">
                            <option value="GATE001">Main Gate</option>
                            <option value="GATE002">Parking Gate</option>
                            <option value="GATE003">Warehouse Gate</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purpose *</label>
                    <textarea
                        name="purpose"
                        value={formData.purpose}
                        onChange={handleChange}
                        required
                        rows="3"
                        className="input"
                        placeholder="Enter the purpose of this pass"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Valid From *</label>
                        <input
                            type="datetime-local"
                            name="validFrom"
                            value={formData.validFrom}
                            onChange={handleChange}
                            required
                            className="input"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Valid To *</label>
                        <input
                            type="datetime-local"
                            name="validTo"
                            value={formData.validTo}
                            onChange={handleChange}
                            required
                            className="input"
                        />
                    </div>
                </div>

                {/* Type-Specific Fields */}
                {formData.type === 'Visitor' && (
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Visitor Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                <input type="text" name="visitorName" value={formData.visitorName} onChange={handleChange} required className="input" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                                <input type="tel" name="visitorPhone" value={formData.visitorPhone} onChange={handleChange} required className="input" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                                <input type="text" name="visitorCompany" value={formData.visitorCompany} onChange={handleChange} className="input" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ID Type</label>
                                <select name="visitorIdType" value={formData.visitorIdType} onChange={handleChange} className="input">
                                    <option value="Aadhar">Aadhar</option>
                                    <option value="PAN">PAN</option>
                                    <option value="DrivingLicense">Driving License</option>
                                    <option value="Passport">Passport</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
                                <input type="text" name="visitorIdNumber" value={formData.visitorIdNumber} onChange={handleChange} className="input" />
                            </div>
                        </div>
                    </div>
                )}

                {formData.type === 'Employee' && (
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
                                <input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} required className="input" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pass Type *</label>
                                <select name="passType" value={formData.passType} onChange={handleChange} required className="input">
                                    <option value="OnDuty">On Duty</option>
                                    <option value="ShortExit">Short Exit</option>
                                    <option value="LateEntry">Late Entry</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {formData.type === 'Vehicle' && (
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number *</label>
                                <input type="text" name="vehicleNumber" value={formData.vehicleNumber} onChange={handleChange} required className="input" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type *</label>
                                <select name="vehicleType" value={formData.vehicleType} onChange={handleChange} required className="input">
                                    <option value="Car">Car</option>
                                    <option value="Bike">Bike</option>
                                    <option value="Truck">Truck</option>
                                    <option value="Van">Van</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name *</label>
                                <input type="text" name="driverName" value={formData.driverName} onChange={handleChange} required className="input" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Driver Phone *</label>
                                <input type="tel" name="driverPhone" value={formData.driverPhone} onChange={handleChange} required className="input" />
                            </div>
                        </div>
                    </div>
                )}

                {formData.type === 'Material' && (
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Material Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                                <input type="text" name="itemName" value={formData.itemName} onChange={handleChange} required className="input" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                                <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} required min="1" className="input" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="flex items-center">
                                    <input type="checkbox" name="returnable" checked={formData.returnable} onChange={handleChange} className="mr-2" />
                                    <span className="text-sm font-medium text-gray-700">Returnable Item</span>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                    <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows="2" className="input" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email for QR Delivery (Optional)</label>
                    <input
                        type="email"
                        name="dispatchEmail"
                        value={formData.dispatchEmail}
                        onChange={handleChange}
                        className="input"
                        placeholder="Where should we send the QR code?"
                    />
                    <p className="text-xs text-gray-500 mt-1">If left blank, it will be sent to your account email.</p>
                </div>

                <div className="flex gap-4">
                    <button type="submit" disabled={loading} className="btn btn-primary flex-1">
                        {loading ? 'Creating...' : 'Create Pass'}
                    </button>
                    <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreatePass;
