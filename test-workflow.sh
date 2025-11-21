#!/bin/bash

# Test script to create a leave request workflow
# Make sure both worker and API server are running

echo "Creating leave request..."

curl -X POST http://localhost:3000/leaves \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "u1",
    "leaveType": "CASUAL",
    "startDate": "2025-11-25",
    "endDate": "2025-11-26",
    "reason": "Family function"
  }' | jq .

echo -e "\n✅ Leave request submitted! Check Temporal Cloud UI for the workflow."

