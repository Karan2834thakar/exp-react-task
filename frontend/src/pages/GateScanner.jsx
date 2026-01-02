import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { gateService } from '../services/gateService';
import { QrCode, CheckCircle, XCircle, Upload, Camera, FileImage } from 'lucide-react';

const GateScanner = () => {
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [error, setError] = useState('');
    const [selectedGate, setSelectedGate] = useState('GATE001');
    const [isDragging, setIsDragging] = useState(false);
    const scannerRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (scanning) {
            const scanner = new Html5QrcodeScanner('qr-reader', {
                qrbox: { width: 250, height: 250 },
                fps: 10
            });

            scanner.render(onScanSuccess, onScanError);
            scannerRef.current = scanner;

            return () => {
                scanner.clear();
            };
        }
    }, [scanning]);

    const onScanSuccess = async (decodedText) => {
        try {
            const response = await gateService.scanQR(decodedText, selectedGate);
            setScanResult(response.data);
            setError('');
            setScanning(false);
            if (scannerRef.current) {
                scannerRef.current.clear();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid QR code');
        }
    };

    const onScanError = (err) => {
        // Ignore scan errors (happens continuously while scanning)
    };

    const gateNames = {
        'GATE001': 'Main Gate',
        'GATE002': 'Parking Gate',
        'GATE003': 'Warehouse Gate'
    };

    const handleCheckIn = async () => {
        try {
            await gateService.checkIn(
                scanResult.pass._id,
                selectedGate,
                gateNames[selectedGate] || 'Unknown Gate',
                undefined
            );
            alert('Check-in successful!');
            setScanResult(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Check-in failed');
        }
    };

    const handleCheckOut = async () => {
        try {
            await gateService.checkOut(
                scanResult.pass._id,
                selectedGate,
                gateNames[selectedGate] || 'Unknown Gate',
                undefined
            );
            alert('Check-out successful!');
            setScanResult(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Check-out failed');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        processFile(file);
    };

    const processFile = async (file) => {
        setError('');
        const html5QrCode = new Html5Qrcode("qr-reader-hidden");
        try {
            const decodedText = await html5QrCode.scanFile(file, true);
            onScanSuccess(decodedText);
        } catch (err) {
            setError('Could not find a QR code in this image. Please try a clearer picture.');
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            processFile(file);
        } else {
            setError('Please drop a valid image file.');
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Gate Scanner</h1>

            <div className="card mb-6">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Gate</label>
                    <select
                        value={selectedGate}
                        onChange={(e) => setSelectedGate(e.target.value)}
                        className="input max-w-xs"
                    >
                        <option value="GATE001">Main Gate</option>
                        <option value="GATE002">Parking Gate</option>
                        <option value="GATE003">Warehouse Gate</option>
                    </select>
                </div>

                {!scanning && !scanResult && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => setScanning(true)}
                            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-primary-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all group"
                        >
                            <Camera className="h-10 w-10 text-primary-400 group-hover:text-primary-600 mb-2" />
                            <span className="font-semibold text-gray-700">Scan with Camera</span>
                        </button>

                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${isDragging
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-primary-500 hover:bg-primary-50'
                                }`}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept="image/*"
                                className="hidden"
                            />
                            <Upload className={`h-10 w-10 mb-2 ${isDragging ? 'text-green-600' : 'text-gray-400'}`} />
                            <span className="font-semibold text-gray-700">
                                {isDragging ? 'Drop Image Here' : 'Upload QR Image'}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">Drag and drop or click to choose</p>
                        </div>
                    </div>
                )}

                <div id="qr-reader-hidden" style={{ display: 'none' }}></div>

                {scanning && (
                    <div>
                        <div id="qr-reader" className="mb-4 overflow-hidden rounded-lg border"></div>
                        <button
                            onClick={() => {
                                setScanning(false);
                                if (scannerRef.current) {
                                    scannerRef.current.clear();
                                }
                            }}
                            className="btn btn-secondary w-full"
                        >
                            Cancel Camera Scan
                        </button>
                    </div>
                )}

                {error && (
                    <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}
            </div>

            {scanResult && (
                <div className="card">
                    <div className="flex items-center gap-3 mb-6">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                        <h2 className="text-2xl font-bold text-gray-900">Valid Pass</h2>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Pass ID</p>
                                <p className="font-semibold text-gray-900">{scanResult.pass.passId}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Type</p>
                                <p className="font-semibold text-gray-900">{scanResult.pass.type}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Status</p>
                                <span className={`badge badge-${scanResult.pass.status.toLowerCase()}`}>
                                    {scanResult.pass.status}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Requester</p>
                                <p className="font-semibold text-gray-900">{scanResult.pass.requesterId?.name}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-sm text-gray-600">Purpose</p>
                                <p className="font-semibold text-gray-900">{scanResult.pass.purpose}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Valid From</p>
                                <p className="font-semibold text-gray-900">
                                    {new Date(scanResult.pass.validFrom).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Valid To</p>
                                <p className="font-semibold text-gray-900">
                                    {new Date(scanResult.pass.validTo).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        {scanResult.canCheckIn && (
                            <button onClick={handleCheckIn} className="btn btn-primary flex-1">
                                Check In
                            </button>
                        )}
                        {scanResult.canCheckOut && (
                            <button onClick={handleCheckOut} className="btn btn-primary flex-1">
                                Check Out
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setScanResult(null);
                                setScanning(true);
                            }}
                            className="btn btn-secondary"
                        >
                            Scan Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GateScanner;
