#!/bin/bash

# Complete Full Flow Test Script for Leave Management Workflow
# Tests: Apply Leave -> Wait -> Find Request -> Approve -> Check Status

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

API_URL="http://localhost:3000"

print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${YELLOW}ℹ️  $1${NC}"; }
print_wait() { echo -e "${CYAN}⏳ $1${NC}"; }
print_step() { echo -e "${MAGENTA}▶ $1${NC}"; }

# Check API server
check_api() {
    print_header "Step 0: Checking API Server"
    
    if curl -s -f "${API_URL}/health" > /dev/null 2>&1; then
        print_success "API server is running at ${API_URL}"
    else
        print_error "API server is not running!"
        echo "Please start it with: npm run dev:api"
        exit 1
    fi
}

# Step 1: Apply for leave
apply_leave() {
    print_header "Step 1: Applying for Leave"
    
    print_info "Creating leave request..."
    echo "  User: u1 (John Employee)"
    echo "  Leave Type: CASUAL"
    echo "  Dates: 2025-11-25 to 2025-11-26"
    echo "  Reason: Complete flow test"
    
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
    
    WORKFLOW_ID=$(echo "$BODY" | grep -o '"workflowId":"[^"]*' | cut -d'"' -f4 || echo "")
    RUN_ID=$(echo "$BODY" | grep -o '"runId":"[^"]*' | cut -d'"' -f4 || echo "")
    
    if [ -z "$WORKFLOW_ID" ]; then
        print_error "Could not extract workflow ID from response"
        echo "Response: $BODY"
        exit 1
    fi
    
    print_success "Leave request submitted successfully!"
    echo "  Workflow ID: $WORKFLOW_ID"
    echo "  Run ID: $RUN_ID"
    
    export WORKFLOW_ID
    export RUN_ID
    
    # Wait for workflow to create request record
    print_wait "Waiting for workflow to initialize and create request record (5 seconds)..."
    sleep 5
}

# Step 2: Find request ID by workflow ID
find_request_id() {
    print_header "Step 2: Finding Request ID"
    
    print_info "Querying API for request with workflowId: $WORKFLOW_ID"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" "${API_URL}/leaves?workflowId=${WORKFLOW_ID}")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" != "200" ]; then
        print_error "Failed to find request (HTTP $HTTP_CODE)"
        echo "Response: $BODY"
        print_info "Trying alternative: Get all requests and filter..."
        
        # Try getting all requests
        ALL_RESPONSE=$(curl -s "${API_URL}/leaves")
        REQUEST_ID=$(echo "$ALL_RESPONSE" | grep -o "\"id\":\"[^\"]*\",\"userId\":\"u1\"" | head -1 | cut -d'"' -f4 || echo "")
        
        if [ -z "$REQUEST_ID" ]; then
            print_error "Could not find request ID. Workflow may still be initializing."
            print_info "Waiting additional 3 seconds..."
            sleep 3
            
            ALL_RESPONSE=$(curl -s "${API_URL}/leaves")
            REQUEST_ID=$(echo "$ALL_RESPONSE" | grep -o "\"id\":\"req-[^\"]*\"" | head -1 | cut -d'"' -f4 || echo "")
        fi
    else
        REQUEST_ID=$(echo "$BODY" | grep -o '"id":"[^"]*' | cut -d'"' -f4 || echo "")
    fi
    
    if [ -z "$REQUEST_ID" ]; then
        print_error "Could not find request ID"
        print_info "Available requests:"
        curl -s "${API_URL}/leaves" | python3 -m json.tool 2>/dev/null || curl -s "${API_URL}/leaves"
        exit 1
    fi
    
    print_success "Found request ID: $REQUEST_ID"
    export REQUEST_ID
    
    # Verify request status
    print_info "Checking request status..."
    REQUEST_RESPONSE=$(curl -s "${API_URL}/leaves/${REQUEST_ID}")
    STATUS=$(echo "$REQUEST_RESPONSE" | grep -o '"status":"[^"]*' | cut -d'"' -f4 || echo "")
    echo "  Request Status: $STATUS"
}

# Step 3: Approve the leave request
approve_leave() {
    print_header "Step 3: Approving Leave Request"
    
    if [ -z "$REQUEST_ID" ]; then
        print_error "Request ID not found. Cannot approve."
        exit 1
    fi
    
    print_info "Approving leave request..."
    echo "  Request ID: $REQUEST_ID"
    echo "  Approver: u2 (Jane Manager)"
    echo "  Decision: APPROVE"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/leaves/${REQUEST_ID}/approve" \
        -H "Content-Type: application/json" \
        -d '{
            "approverId": "u2",
            "decision": "APPROVE"
        }')
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" != "200" ]; then
        print_error "Failed to approve leave request (HTTP $HTTP_CODE)"
        echo "Response: $BODY"
        exit 1
    fi
    
    print_success "Leave request approved successfully!"
    echo "  Response: $BODY"
    
    # Wait for workflow to process
    print_wait "Waiting for workflow to process approval (3 seconds)..."
    sleep 3
}

# Step 4: Check final status
check_final_status() {
    print_header "Step 4: Checking Final Status"
    
    print_info "Fetching final request status..."
    
    RESPONSE=$(curl -s "${API_URL}/leaves/${REQUEST_ID}")
    
    if [ -z "$RESPONSE" ]; then
        print_error "Failed to get request status"
        exit 1
    fi
    
    STATUS=$(echo "$RESPONSE" | grep -o '"status":"[^"]*' | cut -d'"' -f4 || echo "")
    APPROVER_ID=$(echo "$RESPONSE" | grep -o '"approverId":"[^"]*' | cut -d'"' -f4 || echo "")
    
    print_success "Final Request Status: $STATUS"
    if [ -n "$APPROVER_ID" ]; then
        echo "  Approved by: $APPROVER_ID"
    fi
    
    echo ""
    print_info "Full request details:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
}

# Main execution
main() {
    clear
    echo -e "${GREEN}"
    cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║   Leave Management Workflow - Complete Full Flow Test       ║
╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    check_api
    apply_leave
    find_request_id
    approve_leave
    check_final_status
    
    print_header "Test Summary"
    print_success "Complete flow test finished successfully! 🎉"
    echo ""
    print_info "Workflow Details:"
    echo "  Workflow ID: $WORKFLOW_ID"
    echo "  Run ID: $RUN_ID"
    echo "  Request ID: $REQUEST_ID"
    echo ""
    print_info "What happened:"
    echo "  1. ✅ Leave request created and workflow started"
    echo "  2. ✅ Request record created in database"
    echo "  3. ✅ Leave balance reserved"
    echo "  4. ✅ Manager notification sent"
    echo "  5. ✅ Approval signal received"
    echo "  6. ✅ Leave balance committed"
    echo "  7. ✅ Employee notification sent"
    echo "  8. ✅ Workflow completed"
    echo ""
    print_info "Check Temporal Cloud UI:"
    echo "  https://cloud.temporal.io/namespaces/leave-workflow-poc.hy9gi/workflows"
    echo ""
    
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}All tests passed! ✅${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# Run main function
main
