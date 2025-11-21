import { LeaveType, LeaveStatus } from "../types";
import { leaveService } from "../services/leave.service";

export async function createLeaveRequestRecord(
  userId: string,
  leaveType: LeaveType,
  startDate: string,
  endDate: string,
  reason: string,
  workflowId?: string
) {
  return leaveService.create(userId, leaveType, startDate, endDate, reason, workflowId);
}

export async function updateLeaveRequestStatus(
  requestId: string,
  status: LeaveStatus,
  approverId?: string
): Promise<void> {
  return leaveService.updateStatus(requestId, status, approverId);
}

