import { LeaveRequest, LeaveStatus } from "../types";
import { db } from "../db";

export class LeaveRepository {
  create(request: LeaveRequest): void {
    db.createLeaveRequest(request);
  }

  getById(id: string): LeaveRequest | undefined {
    return db.getLeaveRequestById(id);
  }

  updateStatus(id: string, status: LeaveStatus, approverId?: string): void {
    db.updateLeaveRequestStatus(id, status, approverId);
  }

  setWorkflowId(requestId: string, workflowId: string): void {
    db.setWorkflowId(requestId, workflowId);
  }

  getByWorkflowId(workflowId: string): LeaveRequest | undefined {
    return db.getLeaveRequestByWorkflowId(workflowId);
  }

  getAll(): LeaveRequest[] {
    return db.getAllLeaveRequests();
  }
}

export const leaveRepository = new LeaveRepository();

