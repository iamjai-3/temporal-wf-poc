# Leave Management Workflow - Temporal Cloud POC

A fault-tolerant leave management system built with Temporal Cloud, Node.js, TypeScript, and SQLite.

## Features

- ✅ Automated leave application workflow
- ✅ Role-based approval system (Manager, HR, Admin)
- ✅ Leave balance validation and reservation
- ✅ Email notifications
- ✅ Audit logging
- ✅ SQLite database for persistence

## Quick Start

### Prerequisites

- Node.js 18+
- Temporal Cloud account (or local Temporal server)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

Edit `.env` with your Temporal Cloud credentials:

```env
TEMPORAL_ADDRESS=your-namespace.tmprl.cloud:7233
TEMPORAL_NAMESPACE=your-namespace
TEMPORAL_API_KEY=your-api-key
TEMPORAL_TASK_QUEUE=LEAVE_TASK_QUEUE
```

### Running the Application

**Terminal 1 - Start Worker:**

```bash
npm run dev:worker
```

**Terminal 2 - Start API Server:**

```bash
npm run dev:api
```

The API server runs on `http://localhost:3000`

## API Endpoints

### Apply for Leave

```bash
POST /leaves
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
POST /leaves/:requestId/approve
Content-Type: application/json

{
  "approverId": "u2",
  "decision": "APPROVE"
}
```

### Get Leave Request

```bash
GET /leaves/:requestId
```

### Get All Requests

```bash
GET /leaves
```

### Get Request by Workflow ID

```bash
GET /leaves?workflowId=leave-u1-1234567890
```

## Testing

### Using HTTP File (Recommended)

1. Install REST Client extension in VS Code
2. Open `test-full-flow.http`
3. Click "Send Request" on each request in order

### Using cURL

See `README-TESTING.md` for detailed testing instructions.

## Sample Users

| ID  | Name          | Role     | Can Approve         |
| --- | ------------- | -------- | ------------------- |
| u1  | John Employee | EMPLOYEE | None                |
| u2  | Jane Manager  | MANAGER  | Direct reports (u1) |
| u3  | Bob HR        | HR       | Any request         |
| u4  | Alice Admin   | ADMIN    | Any request         |

## Database

Uses **SQLite** for persistence. Database file: `leave-management.db`

- Automatically created on first run
- Schema defined in `src/db/schema.sql`
- Tables: `users`, `leave_requests`, `leave_balances`

## Project Structure

```
src/
├── activities/        # Temporal activities (DB, email, etc.)
├── api/              # Express API server
│   ├── routes/       # API routes
│   ├── middleware/   # Express middleware
│   └── validators/   # Input validation
├── config/           # Configuration
├── db/               # SQLite database
│   ├── index.ts      # Database implementation
│   └── schema.sql    # Database schema
├── repositories/     # Data access layer
├── services/         # Business logic layer
├── utils/            # Utility functions
├── workflows/        # Temporal workflows
├── client.ts         # Temporal client
├── worker.ts         # Temporal worker
└── types.ts          # TypeScript types
```

## Architecture Pattern

### One Long-Lived Workflow Per User

This system follows the **"One Long-Lived Workflow Per User"** pattern:

**Key Principles:**

- Each user has a **single, long-running workflow instance** that persists across multiple leave requests
- All leave requests for a user flow through their dedicated workflow
- The workflow maintains state and can handle multiple requests over time
- Signals are sent to the user's workflow, which routes them to the appropriate request
- The workflow remains active and ready for new requests (doesn't complete after each request)

**Workflow ID Pattern:**

```
leave-{userId}
```

**Example:**

- User `u1` has workflow: `leave-u1`
- All leave requests from `u1` are processed by this single workflow
- The workflow handles requests sequentially or maintains a queue
- The workflow stays active even after processing requests

**Benefits:**

- ✅ **Centralized state management** - All user's leave data in one workflow
- ✅ **Better observability** - See all user's requests in Temporal Cloud UI
- ✅ **Simplified signal routing** - One workflow ID per user
- ✅ **User-level state** - Can maintain preferences, totals, history
- ✅ **Efficient resource usage** - One workflow handles all requests
- ✅ **Easier debugging** - All user activity in one place

**Implementation Details:**

- Workflow is created on first leave request from a user
- Subsequent requests reuse the same workflow instance
- Workflow processes requests and remains active
- Can maintain a queue of pending requests
- Signals are routed to the workflow which handles routing internally

## Workflow Flow

1. **Employee applies** → API sends request to user's workflow
2. **Workflow receives** → Creates request record, reserves balance, emails manager
3. **Manager approves** → API sends signal to user's workflow
4. **Workflow processes** → Commits/rolls back balance, updates status, emails employee
5. **Workflow continues** → Ready for next request (long-lived)

## Monitoring

View workflows in Temporal Cloud UI:

```
https://cloud.temporal.io/namespaces/leave-workflow-poc.hy9gi/workflows
```

## Scripts

- `npm run build` - Build TypeScript
- `npm run start:worker` - Start worker (production)
- `npm run start:api` - Start API server (production)
- `npm run dev:worker` - Start worker with auto-reload
- `npm run dev:api` - Start API server with auto-reload

## License

ISC
