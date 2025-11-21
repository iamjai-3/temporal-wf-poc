import { LeaveRequest, LeaveType, LeaveStatus } from "../types";
import { leaveRepository } from "../repositories/leave.repository";
import { generateRequestId } from "../utils/id";
import { writeAuditLog } from "../utils/audit";

export class LeaveService {
  async create(
    userId: string,
    leaveType: LeaveType,
    startDate: string,
    endDate: string,
    reason: string,
    workflowId?: string
  ): Promise<LeaveRequest> {
    const request: LeaveRequest = {
      id: generateRequestId(),
      userId,
      leaveType,
      startDate,
      endDate,
      reason,
      status: LeaveStatus.PENDING_APPROVAL,
      workflowId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    leaveRepository.create(request);
    await writeAuditLog("createLeaveRequestRecord", { requestId: request.id, userId, leaveType, workflowId }, userId, request.id);
    return request;
  }

  async updateStatus(requestId: string, status: LeaveStatus, approverId?: string): Promise<void> {
    leaveRepository.updateStatus(requestId, status, approverId);
    await writeAuditLog("updateLeaveRequestStatus", { requestId, status, approverId }, approverId, requestId);
  }

  getById(requestId: string): LeaveRequest | undefined {
    return leaveRepository.getById(requestId);
  }
}

export const leaveService = new LeaveService();

