import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FileText, QrCode, LogOut, Menu, X, Users } from 'lucide-react';
import { useState } from 'react';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Requestor', 'Approver', 'Security'] },
        { path: '/create-pass', label: 'Create Pass', icon: FileText, roles: ['Requestor', 'Admin'] },
        { path: '/my-requests', label: 'My Requests', icon: FileText, roles: ['Requestor', 'Admin'] },
        { path: '/gate-scanner', label: 'Gate Scanner', icon: QrCode, roles: ['Security', 'Admin'] },
        { path: '/user-management', label: 'User Management', icon: Users, roles: ['Admin'] },
    ];

    const visibleMenuItems = menuItems.filter(item => item.roles.includes(user?.role));

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="lg:hidden mr-4 text-gray-600 hover:text-gray-900"
                            >
                                {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                            <h1 className="text-xl font-bold text-primary-600">Gate Pass System</h1>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                                <p className="text-xs text-gray-500">{user?.role}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                                title="Logout"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex gap-8">
                    {/* Sidebar */}
                    <aside className={`
            ${sidebarOpen ? 'block' : 'hidden'} lg:block
            w-64 flex-shrink-0
          `}>
                        <nav className="space-y-1">
                            {visibleMenuItems.map(item => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors"
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            ))}
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Layout;
