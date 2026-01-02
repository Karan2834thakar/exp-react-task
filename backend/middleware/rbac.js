// Role-based access control middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401);
            throw new Error('Not authorized');
        }

        if (!roles.includes(req.user.role)) {
            res.status(403);
            throw new Error(`User role '${req.user.role}' is not authorized to access this route`);
        }

        next();
    };
};

// Permission-based access control
const checkPermission = (permission) => {
    return (req, res, next) => {
        const rolePermissions = {
            Admin: ['all'],
            Approver: ['pass:read', 'pass:approve', 'pass:reject', 'report:read'],
            Security: ['pass:read', 'gate:scan', 'gate:checkin', 'gate:checkout', 'gate:deny'],
            Requestor: ['pass:create', 'pass:read:own', 'pass:update:own', 'pass:cancel:own']
        };

        const userPermissions = rolePermissions[req.user.role] || [];

        if (userPermissions.includes('all') || userPermissions.includes(permission)) {
            next();
        } else {
            res.status(403);
            throw new Error('Insufficient permissions');
        }
    };
};

module.exports = { authorize, checkPermission };
