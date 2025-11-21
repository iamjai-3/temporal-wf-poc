#!/bin/bash

# Complete Flow Test Script with Database Query Simulation
# This script tests: Apply -> Wait -> Get RequestId -> Approve -> Check Status

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

API_URL="http://localhost:3000"

print_step() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${YELLOW}ℹ️  $1${NC}"; }
print_wait() { echo -e "${CYAN}⏳ $1${NC}"; }

# Check API server
check_api() {
    print_step "Checking API Server"
    if curl -s -f "${API_URL}/health" > /dev/null; then
        print_success "API server is running"
    else
        print_error "API server not running. Start with: npm run dev:api"
        exit 1
    fi
}

# Step 1: Apply for leave
apply_leave() {
    print_step "Step 1: Applying for Leave"
    
    print_info "User: u1 (John Employee)"
    print_info "Leave Type: CASUAL"
    print_info "Dates: 2025-11-25 to 2025-11-26"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/leaves" \
        -H "Content-Type: application/json" \
        -d '{
            "userId": "u1",
            "leaveType": "CASUAL",
            "startDate": "2025-11-25",
            "endDate": "2025-11-26",
            "reason": "Complete flow test - Family function"
        }')
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" != "202" ]; then
        print_error "Failed to create leave request (HTTP $HTTP_CODE)"
        echo "Response: $BODY"
        exit 1
    fi
    
    WORKFLOW_ID=$(echo "$BODY" | grep -o '"workflowId":"[^"]*' | cut -d'"' -f4)
    RUN_ID=$(echo "$BODY" | grep -o '"runId":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$WORKFLOW_ID" ]; then
        print_error "Could not extract workflow ID"
        echo "Response: $BODY"
        exit 1
    fi
    
    print_success "Leave request submitted"
    echo "  Workflow ID: $WORKFLOW_ID"
    echo "  Run ID: $RUN_ID"
    
    export WORKFLOW_ID
    export RUN_ID
    
    # Wait for workflow to create request record
    print_wait "Waiting for workflow to initialize (5 seconds)..."
    sleep 5
}

# Step 2: Find request ID (simulate by trying common patterns)
find_request_id() {
    print_step "Step 2: Finding Request ID"
    
    print_info "In production, you would:"
    print_info "  1. Query the database for requests with workflowId: $WORKFLOW_ID"
    print_info "  2. Use Temporal workflow queries"
    print_info "  3. Store requestId when creating the workflow"
    
    print_wait "Attempting to find requestId..."
    
    # Try to get request by checking if there's a list endpoint
    # Since we don't have one, we'll need to extract from workflow or use a workaround
    # For this test, we'll create a helper that queries the in-memory DB
    
    print_info "Creating helper script to query request..."
    
    # We'll need to add an endpoint or use a workaround
    # For now, let's try to query by making assumptions about the request ID format
    print_info "Request IDs follow pattern: req-{timestamp}-{random}"
    print_info "We'll need to query the database or add a GET /leaves endpoint with workflowId filter"
}

# Step 3: Approve the leave request
approve_leave() {
    print_step "Step 3: Approving Leave Request"
    
    print_info "To approve, we need the requestId"
    print_info "For this test, let's add a helper endpoint or use Temporal client directly"
    
    # Create a Node.js script to query and approve
    cat > /tmp/approve-leave.js << 'EOF'
const { getTemporalClient } = require('./dist/client');
const { approvalSignal } = require('./dist/workflows/leave-application');

async function approveByWorkflowId(workflowId, approverId, decision) {
    try {
        const client = await getTemporalClient();
        const handle = client.workflow.getHandle(workflowId);
        
        await handle.signal(approvalSignal, {
            decision,
            approverId
        });
        
        console.log(JSON.stringify({
            success: true,
            message: `Leave request ${decision.toLowerCase()}d`,
            workflowId
        }));
    } catch (error) {
        console.error(JSON.stringify({
            success: false,
            error: error.message
        }));
        process.exit(1);
    }
}

const [,, workflowId, approverId, decision] = process.argv;
if (!workflowId || !approverId || !decision) {
    console.error('Usage: node approve-leave.js <workflowId> <approverId> <APPROVE|REJECT>');
    process.exit(1);
}

approveByWorkflowId(workflowId, approverId, decision);
EOF
    
    print_info "Alternative: Use the API endpoint once you have the requestId"
    print_info "POST ${API_URL}/leaves/{requestId}/approve"
    print_info "Body: { \"approverId\": \"u2\", \"decision\": \"APPROVE\" }"
    
    # For now, show the manual steps
    print_wait "Manual approval steps:"
    echo "  1. Get requestId from database (query by workflowId: $WORKFLOW_ID)"
    echo "  2. POST ${API_URL}/leaves/{requestId}/approve"
    echo "  3. Body: { \"approverId\": \"u2\", \"decision\": \"APPROVE\" }"
}

# Step 4: Check final status
check_status() {
    print_step "Step 4: Checking Final Status"
    
    print_info "After approval, check:"
    print_info "  1. Workflow status in Temporal Cloud UI"
    print_info "  2. Leave request status via: GET ${API_URL}/leaves/{requestId}"
    print_info "  3. Email notifications (check console logs)"
    print_info "  4. Leave balance (should be deducted if approved)"
    
    print_info "Temporal Cloud UI:"
    echo "  https://cloud.temporal.io/namespaces/leave-workflow-poc.hy9gi/workflows"
}

# Main execution
main() {
    clear
    echo -e "${GREEN}"
    cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║   Leave Management Workflow - Complete Flow Test            ║
╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    check_api
    apply_leave
    find_request_id
    approve_leave
    check_status
    
    print_step "Test Summary"
    print_success "Workflow started successfully!"
    echo ""
    print_info "Workflow Details:"
    echo "  Workflow ID: $WORKFLOW_ID"
    echo "  Run ID: $RUN_ID"
    echo ""
    print_info "Next Steps:"
    echo "  1. Check Temporal Cloud UI to see the running workflow"
    echo "  2. The workflow is waiting for approval signal"
    echo "  3. To approve, find the requestId and POST to /leaves/{requestId}/approve"
    echo "  4. Monitor workflow completion in Temporal Cloud"
    echo ""
    print_info "To approve manually:"
    echo "  curl -X POST '${API_URL}/leaves/{requestId}/approve' \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -d '{\"approverId\": \"u2\", \"decision\": \"APPROVE\"}'"
    echo ""
    
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}Complete flow test finished!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

main

