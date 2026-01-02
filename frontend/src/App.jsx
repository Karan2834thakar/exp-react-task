import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreatePass from './pages/CreatePass';
import MyRequests from './pages/MyRequests';
import PassDetails from './pages/PassDetails';
import GateScanner from './pages/GateScanner';
import UserManagement from './pages/UserManagement';

function AppRoutes() {
    const { isAuthenticated } = useAuth();

    return (
        <Routes>
            <Route
                path="/login"
                element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
            />

            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Dashboard />} />
                <Route
                    path="create-pass"
                    element={
                        <ProtectedRoute allowedRoles={['Requestor', 'Admin']}>
                            <CreatePass />
                        </ProtectedRoute>
                    }
                />
                <Route path="my-requests" element={<MyRequests />} />
                <Route path="passes/:id" element={<PassDetails />} />
                <Route
                    path="gate-scanner"
                    element={
                        <ProtectedRoute allowedRoles={['Security', 'Admin']}>
                            <GateScanner />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="user-management"
                    element={
                        <ProtectedRoute allowedRoles={['Admin']}>
                            <UserManagement />
                        </ProtectedRoute>
                    }
                />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </Router>
    );
}

export default App;
