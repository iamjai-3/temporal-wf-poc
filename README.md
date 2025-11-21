# Leave Management Workflow - Temporal Cloud POC

A fault-tolerant leave management system built with Temporal Cloud, Node.js, and TypeScript.

## Features

- ✅ Automated leave application workflow
- ✅ Role-based approval system (Manager, HR, Admin)
- ✅ Leave balance validation and reservation
- ✅ Email notifications
- ✅ Audit logging
- ✅ Temporal Cloud ready

## Architecture

- **Workflow**: `LeaveApplicationWorkflow` - Orchestrates the entire leave application process
- **Activities**: Database operations, email sending, balance management
- **Signals**: `approvalSignal` - Receives approval/rejection decisions
- **Task Queue**: `LEAVE_TASK_QUEUE`

## Prerequisites

- Node.js 18+
- Temporal Cloud account (or local Temporal server)
- npm or yarn

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your Temporal Cloud credentials:
   ```
   TEMPORAL_ADDRESS=your-namespace.tmprl.cloud:7233
   TEMPORAL_NAMESPACE=your-namespace
   TEMPORAL_API_KEY=your-api-key
   TEMPORAL_TASK_QUEUE=LEAVE_TASK_QUEUE
   ```

3. **For local development** (without Temporal Cloud):
   - Start local Temporal server: `temporal server start-dev`
   - Update `.env`:
     ```
     TEMPORAL_ADDRESS=localhost:7233
     TEMPORAL_NAMESPACE=default
     ```

## Running the Application

### Terminal 1: Start the Worker
```bash
npm run start:worker
# or for development with watch mode:
npm run dev:worker
```

### Terminal 2: Start the API Server
```bash
npm run start:api
# or for development with watch mode:
npm run dev:api
```

## API Endpoints

### Apply for Leave
```bash
POST http://localhost:3000/leaves
Content-Type: application/json

{
  "userId": "u1",
  "leaveType": "CASUAL",
  "startDate": "2025-11-25",
  "endDate": "2025-11-26",
  "reason": "Family function"
}
```

### Approve/Reject Leave
```bash
POST http://localhost:3000/leaves/:requestId/approve
Content-Type: application/json

{
  "approverId": "u2",
  "decision": "APPROVE"
}
```

### Get Leave Request Status
```bash
GET http://localhost:3000/leaves/:requestId
```

### Health Check
```bash
GET http://localhost:3000/health
```

## Sample Users

The system comes with pre-configured sample users:

- **u1** - John Employee (Employee, Manager: u2)
- **u2** - Jane Manager (Manager, Manager: u3)
- **u3** - Bob HR (HR)
- **u4** - Alice Admin (Admin)

## Workflow Flow

1. Employee applies for leave via API
2. Workflow starts and:
   - Creates leave request record
   - Reserves leave balance
   - Sends email to manager
   - Waits for approval signal (7-day timeout)
3. Manager/HR/Admin approves/rejects via API
4. Workflow:
   - Validates approver permissions
   - Commits or rolls back balance
   - Updates request status
   - Sends email to employee
5. Workflow completes

## Role-Based Permissions

- **Employee**: Can apply for leave
- **Manager**: Can approve requests from direct reports
- **HR**: Can approve any request
- **Admin**: Can approve any request

## Project Structure

```
src/
├── activities/        # Temporal activities (DB, email, etc.)
├── workflows/         # Temporal workflows
├── utils/            # Utility functions (email, audit, date)
├── db.ts             # In-memory database (replace with real DB in production)
├── worker.ts         # Temporal worker
├── client.ts         # Temporal client setup
├── api.ts            # Express API server
└── types.ts          # TypeScript types and interfaces
```

## Development

- **Build**: `npm run build`
- **Worker**: `npm run start:worker` or `npm run dev:worker`
- **API**: `npm run start:api` or `npm run dev:api`

## Production Considerations

- Replace in-memory database with persistent storage (PostgreSQL, MongoDB, etc.)
- Integrate with real email service (SendGrid, AWS SES, etc.)
- Add authentication/authorization middleware
- Implement proper error handling and retries
- Add monitoring and observability
- Store workflow IDs in database for better tracking
- Add rate limiting and input validation
- Implement proper logging (Winston, Pino, etc.)

## License

ISC

