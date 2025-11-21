# Testing Guide - Leave Management Workflow

## Quick Start Testing

### Option 1: Using HTTP File (Recommended)

1. Install REST Client extension in VS Code (or similar)
2. Open `test-full-flow.http`
3. Follow the step-by-step requests in order

### Option 2: Using Test Scripts

```bash
# Make sure API server and worker are running
npm run dev:api    # Terminal 1
npm run dev:worker # Terminal 2

# Run full flow test
./test-full-flow.sh
```

### Option 3: Manual cURL Commands

See examples below.

## Full Workflow Test Steps

### Step 1: Apply for Leave

```bash
curl -X POST http://localhost:3000/leaves \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "u1",
    "leaveType": "CASUAL",
    "startDate": "2025-11-25",
    "endDate": "2025-11-26",
    "reason": "Family function"
  }'
```

**Response:**
```json
{
  "message": "Leave request submitted",
  "workflowId": "leave-u1-1763741596609",
  "runId": "019aa730-fc3b-79c0-ad51-e0ebffae1061"
}
```

**Action:** Copy the `workflowId` and wait 5-10 seconds for the workflow to create the request record.

### Step 2: Find Request by Workflow ID

```bash
curl "http://localhost:3000/leaves?workflowId=leave-u1-1763741596609"
```

**Response:**
```json
{
  "id": "req-1763741596609-abc123",
  "userId": "u1",
  "leaveType": "CASUAL",
  "startDate": "2025-11-25",
  "endDate": "2025-11-26",
  "reason": "Family function",
  "status": "PENDING_APPROVAL",
  "workflowId": "leave-u1-1763741596609",
  "createdAt": "2025-11-21T15:32:34.000Z",
  "updatedAt": "2025-11-21T15:32:34.000Z"
}
```

**Action:** Copy the `id` (requestId).

### Step 3: Approve Leave Request

```bash
curl -X POST "http://localhost:3000/leaves/req-1763741596609-abc123/approve" \
  -H "Content-Type: application/json" \
  -d '{
    "approverId": "u2",
    "decision": "APPROVE"
  }'
```

**Response:**
```json
{
  "message": "Leave request approved",
  "requestId": "req-1763741596609-abc123"
}
```

**Action:** Wait 3-5 seconds for the workflow to process the approval.

### Step 4: Verify Final Status

```bash
curl "http://localhost:3000/leaves/req-1763741596609-abc123"
```

**Response:**
```json
{
  "id": "req-1763741596609-abc123",
  "status": "APPROVED",
  "approverId": "u2",
  ...
}
```

## Test Users

| ID | Name | Role | Can Approve |
|----|------|------|-------------|
| u1 | John Employee | EMPLOYEE | None |
| u2 | Jane Manager | MANAGER | Direct reports (u1) |
| u3 | Bob HR | HR | Any request |
| u4 | Alice Admin | ADMIN | Any request |

## Leave Types

- `CASUAL` - Casual leave
- `SICK` - Sick leave
- `EARNED` - Earned leave
- `WELLNESS` - Wellness leave

## Expected Workflow States

1. **PENDING_APPROVAL** - Initial state, waiting for approval
2. **APPROVED** - Request approved, leave balance deducted
3. **REJECTED** - Request rejected, balance reservation rolled back
4. **CANCELLED** - Request cancelled (future feature)

## Monitoring

### Temporal Cloud UI

View workflows in real-time:
```
https://cloud.temporal.io/namespaces/leave-workflow-poc.hy9gi/workflows
```

### Check Worker Logs

The worker will show:
- Workflow execution
- Activity execution
- Email notifications (console logs)
- Audit logs

### Check API Logs

The API server will show:
- Incoming requests
- Errors
- Workflow start confirmations

## Common Issues

### Issue: Request not found after workflow start

**Solution:** Wait 5-10 seconds after creating the workflow. The workflow needs time to execute the activity that creates the request record.

### Issue: Workflow not found when approving

**Solution:** 
1. Verify the requestId exists: `GET /leaves/{requestId}`
2. Check that the request has a `workflowId` field
3. Ensure the workflow is still running (check Temporal Cloud UI)

### Issue: Permission denied when approving

**Solution:**
- Manager (u2) can only approve direct reports
- Use HR (u3) or Admin (u4) to approve any request
- Verify the approver's role in the user service

## Testing Scenarios

### Happy Path
1. Employee applies for leave
2. Manager approves
3. Leave balance deducted
4. Employee notified

### Rejection Path
1. Employee applies for leave
2. Manager rejects
3. Leave balance reservation rolled back
4. Employee notified

### Timeout Path
1. Employee applies for leave
2. No approval within 7 days
3. Request auto-rejected
4. Leave balance reservation rolled back

### Insufficient Balance
1. Employee applies for leave
2. Not enough leave balance
3. Request immediately rejected
4. No workflow continues

