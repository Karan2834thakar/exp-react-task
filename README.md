# Gate Pass Management System

A comprehensive full-stack Gate Pass Management System built with React.js, Node.js, Express, and MongoDB. Features QR-based verification, role-based access control, approval workflows, and real-time notifications.

## 🚀 Features

- **Four Pass Types**: Employee, Visitor, Vehicle, and Material passes
- **QR Code Verification**: Secure, tamper-proof QR codes with HMAC signatures
- **Role-Based Access Control**: Admin, Approver, Security, and Requestor roles
- **Approval Workflows**: Multi-level approval system with email notifications
- **Gate Operations**: Real-time check-in/check-out with QR scanning
- **Comprehensive Reporting**: Dashboard stats, daily registers, audit trails
- **Multi-Tenancy**: Support for multiple locations and sites
- **Email Notifications**: Gmail SMTP integration for approval and status updates

## 📋 Tech Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing
- QR Code generation with signed payloads
- Nodemailer for Gmail notifications
- Joi for validation
- Multer for file uploads

### Frontend
- React 18 with Vite
- React Router for navigation
- Tailwind CSS for styling
- Axios for API calls
- html5-qrcode for QR scanning
- react-qr-code for QR display
- Lucide React for icons

## 🛠️ Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/gatepass_db
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_REFRESH_EXPIRE=30d

# Gmail SMTP Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=Gate Pass System <your-email@gmail.com>

UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
QR_SECRET=your_qr_signature_secret
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

5. Seed the database:
```bash
npm run seed
```

6. Start the backend server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## 👤 Default Credentials

For development and testing, you can use the following default accounts after seeding the database (`npm run seed`):

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@gatepass.com` | `Admin@123` |
| **Approver** | `approver@gatepass.com` | `Approver@123` |
| **Security** | `security@gatepass.com` | `Security@123` |
| **Requestor** | `requestor@gatepass.com` | `Requestor@123` |

> [!NOTE]
> For security reasons, these credentials have been removed from the login screen.

## 📁 Project Structure

```
gate-pass-system/
├── backend/
│   ├── config/          # Database configuration
│   ├── middleware/      # Auth, RBAC, validation, error handling
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic (QR, email, approval, audit)
│   ├── utils/           # Helper functions
│   ├── seeders/         # Database seed scripts
│   └── server.js        # Express server entry point
│
└── frontend/
    ├── src/
    │   ├── components/  # Reusable components
    │   ├── context/     # Auth context
    │   ├── pages/       # Page components
    │   ├── services/    # API service functions
    │   ├── App.jsx      # Main app with routing
    │   └── main.jsx     # React entry point
    └── public/          # Static assets
```

## � User Roles and Permissions

The system uses Role-Based Access Control (RBAC) to ensure security and proper workflow management.

### 👤 Requestor / Host (Employee)
*   **Primary Action**: Creates pass requests for themselves (Employee Pass) or for visitors (Visitor/Vehicle/Material Pass).
*   **Permissions**:
    *   Create new pass requests of all four types.
    *   View status and details of their own requests.
    *   Update pass details while the status is still "Pending".
    *   Cancel their own requests if no longer needed.
    *   Download and print approved passes.

### 👤 Approver (Manager / HR)
*   **Primary Action**: Reviews and either approves or rejects pending pass requests.
*   **Permissions**:
    *   All "Requestor" permissions.
    *   View a list of all "Pending" requests within their site/tenant.
    *   Multi-level approval support (Level 1, Level 2, etc.).
    *   Provide remarks for approval or reasons for rejection.
    *   Access to summary reports of approved/rejected passes.

### 👤 Security / Gate Officer
*   **Primary Action**: Verification and gate operations using the QR scanner.
*   **Permissions**:
    *   Access to the **Mobile-Friendly QR Scanner**.
    *   Validate QR code authenticity and expiry.
    *   Perform **Check-In** (timestamps the arrival).
    *   Perform **Check-Out** (timestamps the departure).
    *   **Deny Entry**: Refuse entry with a recorded reason.
    *   View "Active Visitors" – a real-time list of who is currently inside the premises.

### 👤 Administrator
*   **Primary Action**: System configuration and oversight.
*   **Permissions**:
    *   **User Management**: Create, update, or deactivate accounts for all roles.
    *   **Tenant/Site Setup**: Configure multiple locations, sites, and specific gates.
    *   **Workflow Config**: Set the number of required approval levels.
    *   **Full Audit Trail**: View every action taken in the system for compliance.
    *   **Advanced Reporting**: Export historical data and view global dashboards.

---

## 🛠️ Functional Guide (Pass Types)

The system manages four distinct types of gate passes, each with unique data requirements:

### 1. Employee Gate Pass
Used when an employee needs to leave the premises during work hours or for late entry.
*   **Sub-types**: On-Duty (Client visit), Short Exit (Personal work), Late Entry.
*   **Workflow**: Employee requests → Manager approves → Security scans for out/in.

### 2. Visitor Gate Pass
For guests, contractors, or interview candidates.
*   **Features**: Includes **Photo Capture** (via webcam), phone verification, and ID proof details (Aadhar/PAN).
*   **Workflow**: Host (Employee) pre-registers visitor → Optional approval → Visitor arrives → Security scans & captures arrival.

### 3. Vehicle Gate Pass
Tied to a visitor or employee, managing the vehicle's entry/exit.
*   **Fields**: Vehicle Number, Type (Car/Truck/Van), Driver Name, and Driver License info.
*   **Workflow**: Can be linked to a Visitor Pass or created independently for material delivery vehicles.

### 4. Material Gate Pass
For tracking assets or goods moving in/out of the site.
*   **Sub-types**: **Returnable** (e.g., laptop for repair) and **Non-Returnable** (e.g., scrap or consumables).
*   **Workflow**: Records item name, quantity, serial numbers, and expected return date.

---

## 🔑 Key Workflows

## 📧 Gmail SMTP Setup (App Password)

To enable email notifications, you must use a Google **App Password**:

1. Enable **2-Step Verification** on your Gmail account.
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords).
3. Create a new app password for "Other (Custom name)" and call it `Gate Pass System`.
4. Copy the **16-character code** generated.
5. In your `backend/.env` file, use this code for `EMAIL_PASSWORD` and your full Gmail for `EMAIL_USER`.

## 🐳 Docker Deployment (Optional)

Build and run with Docker Compose:

```bash
docker-compose up -d
```

This will start:
- MongoDB container
- Backend API container
- Frontend container (served with Nginx)

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register user (Admin only)
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Passes
- `POST /api/passes` - Create pass
- `GET /api/passes` - List passes
- `GET /api/passes/:id` - Get pass details
- `PUT /api/passes/:id` - Update pass
- `DELETE /api/passes/:id` - Cancel pass
- `POST /api/passes/:id/approve` - Approve pass
- `POST /api/passes/:id/reject` - Reject pass
- `GET /api/passes/:id/qr` - Get QR code

### Gate Operations
- `POST /api/gates/scan` - Scan QR code
- `POST /api/gates/checkin` - Check-in
- `POST /api/gates/checkout` - Check-out
- `POST /api/gates/deny` - Deny entry
- `GET /api/gates/active` - Get active passes

### Reports
- `GET /api/reports/dashboard` - Dashboard stats
- `GET /api/reports/daily-register` - Daily register (CSV export)
- `GET /api/reports/active-visitors` - Active visitors
- `GET /api/reports/pass-history` - Pass history
- `GET /api/reports/audit-trail` - Audit logs

### Admin
- `GET /api/admin/users` - List users
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Deactivate user
- `GET /api/admin/tenants` - List tenants
- `POST /api/admin/tenants` - Create tenant
- `PUT /api/admin/tenants/:id` - Update tenant

## 🔒 Security Features

- JWT-based authentication with refresh tokens
- Password hashing with bcryptjs
- Signed QR codes with HMAC to prevent tampering
- Role-based access control (RBAC)
- Request validation with Joi
- CORS protection
- File upload restrictions

## 📝 License

MIT

## 👨‍💻 Support

For issues or questions, please create an issue in the repository.
