import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { passService } from '../services/passService';
import { ArrowLeft, Trash2, PlusCircle } from 'lucide-react';

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
        visitorIdProofImage: '',
        // Employee fields
        employeeId: '',
        passType: 'OnDuty',
        // Vehicle fields
        vehicleNumber: '',
        vehicleType: 'Car',
        driverName: '',
        driverPhone: '',
        // Material fields (Array)
        materials: [{ itemName: '', quantity: 1, returnable: false }]
    });

    const handleIdProofUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, visitorIdProofImage: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const addMaterialItem = () => {
        setFormData(prev => ({
            ...prev,
            materials: [...prev.materials, { itemName: '', quantity: 1, returnable: false }]
        }));
    };

    const removeMaterialItem = (index) => {
        setFormData(prev => ({
            ...prev,
            materials: prev.materials.filter((_, i) => i !== index)
        }));
    };

    const handleMaterialChange = (index, field, value) => {
        const updatedMaterials = [...formData.materials];
        updatedMaterials[index][field] = value;
        setFormData(prev => ({ ...prev, materials: updatedMaterials }));
    };

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

        if (fromDate < now && formData.type !== 'Employee') {
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

        if (!formData.remarks.trim()) {
            setError('Remarks are mandatory.');
            return;
        }

        const phoneRegex = /^\d{10}$/;
        if (formData.type === 'Visitor' && !phoneRegex.test(formData.visitorPhone)) {
            setError('Please enter a valid 10-digit phone number for the visitor.');
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

            if (formData.type === 'Visitor') {
                passData.persons = [{
                    name: formData.visitorName,
                    phone: formData.visitorPhone,
                    company: formData.visitorCompany || undefined,
                    idType: formData.visitorIdType || undefined,
                    idNumber: formData.visitorIdNumber || undefined,
                    idProofImage: formData.visitorIdProofImage || undefined
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
                passData.materials = formData.materials.map(m => ({
                    itemName: m.itemName,
                    quantity: parseInt(m.quantity),
                    returnable: m.returnable
                }));
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pass Type</label>
                        <select name="type" value={formData.type} onChange={handleChange} className="input">
                            <option value="Visitor">Visitor Pass</option>
                            <option value="Employee">Employee Pass</option>
                            <option value="Vehicle">Vehicle Pass</option>
                            <option value="Material">Material Pass</option>
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
                        <input type="datetime-local" name="validFrom" value={formData.validFrom} onChange={handleChange} required className="input" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Valid To *</label>
                        <input type="datetime-local" name="validTo" value={formData.validTo} onChange={handleChange} required className="input" />
                    </div>
                </div>

                {/* Visitor Section */}
                {formData.type === 'Visitor' && (
                    <div className="border-t pt-6 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Visitor Details</h3>
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
                                    <option value="Aadhar">Aadhar Card</option>
                                    <option value="PAN">PAN Card</option>
                                    <option value="DrivingLicense">Driving License</option>
                                    <option value="Passport">Passport</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Upload ID Proof (Optional)</label>
                                <input type="file" accept="image/*" onChange={handleIdProofUpload} className="input p-1" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Employee Section */}
                {formData.type === 'Employee' && (
                    <div className="border-t pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
                            <input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} required className="input" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pass Action *</label>
                            <select name="passType" value={formData.passType} onChange={handleChange} required className="input">
                                <option value="OnDuty">On Duty</option>
                                <option value="ShortExit">Short Exit</option>
                                <option value="LateEntry">Late Entry</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Vehicle Section */}
                {formData.type === 'Vehicle' && (
                    <div className="border-t pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number *</label>
                            <input type="text" name="vehicleNumber" value={formData.vehicleNumber} onChange={handleChange} required className="input" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name *</label>
                            <input type="text" name="driverName" value={formData.driverName} onChange={handleChange} required className="input" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Driver Phone *</label>
                            <input type="tel" name="driverPhone" value={formData.driverPhone} onChange={handleChange} required className="input" />
                        </div>
                    </div>
                )}

                {/* Material Section (Multi-Item) */}
                {formData.type === 'Material' && (
                    <div className="border-t pt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Material List</h3>
                            <button type="button" onClick={addMaterialItem} className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium">
                                <PlusCircle className="h-4 w-4" /> Add Item
                            </button>
                        </div>
                        <div className="space-y-3">
                            {formData.materials.map((m, idx) => (
                                <div key={idx} className="flex flex-wrap md:flex-nowrap gap-3 items-end bg-gray-50 p-3 rounded-lg border border-gray-100 relative">
                                    <div className="w-full md:flex-1">
                                        <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Item Name</label>
                                        <input type="text" value={m.itemName} onChange={(e) => handleMaterialChange(idx, 'itemName', e.target.value)} required className="input text-sm bg-white" placeholder="Device, Package, etc." />
                                    </div>
                                    <div className="w-24">
                                        <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Qty</label>
                                        <input type="number" value={m.quantity} onChange={(e) => handleMaterialChange(idx, 'quantity', e.target.value)} required min="1" className="input text-sm bg-white" />
                                    </div>
                                    <div className="flex items-center h-10 px-2 group">
                                        <label className="flex items-center cursor-pointer">
                                            <input type="checkbox" checked={m.returnable} onChange={(e) => handleMaterialChange(idx, 'returnable', e.target.checked)} className="mr-2 rounded text-primary-600" />
                                            <span className="text-xs text-gray-600">Returnable</span>
                                        </label>
                                    </div>
                                    {formData.materials.length > 1 && (
                                        <button type="button" onClick={() => removeMaterialItem(idx)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remarks *</label>
                    <textarea
                        name="remarks"
                        value={formData.remarks}
                        onChange={handleChange}
                        rows="2"
                        required
                        className="input"
                        placeholder="Please provide any additional context or remarks"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email for QR Delivery (Optional)</label>
                    <input type="email" name="dispatchEmail" value={formData.dispatchEmail} onChange={handleChange} className="input" placeholder="Guest's email address" />
                </div>

                <div className="flex gap-4 pt-4">
                    <button type="submit" disabled={loading} className="btn btn-primary flex-1 py-3 text-lg">
                        {loading ? 'Processing...' : 'Submit Request'}
                    </button>
                    <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary py-3 px-8">Cancel</button>
                </div>
            </form>
        </div>
    );
};

export default CreatePass;
