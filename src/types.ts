export enum UserRole {
  EMPLOYEE = "EMPLOYEE",
  MANAGER = "MANAGER",
  HR = "HR",
  ADMIN = "ADMIN",
}

export enum LeaveType {
  CASUAL = "CASUAL",
  SICK = "SICK",
  EARNED = "EARNED",
  WELLNESS = "WELLNESS",
}

export enum LeaveStatus {
  PENDING_APPROVAL = "PENDING_APPROVAL",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export enum ApprovalDecision {
  APPROVE = "APPROVE",
  REJECT = "REJECT",
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  managerId?: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  approverId?: string;
  workflowId?: string; // Temporal workflow ID
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalance {
  userId: string;
  leaveType: LeaveType;
  total: number;
  used: number;
  reserved: number;
}

export interface ApprovalSignal {
  decision: ApprovalDecision;
  approverId: string;
}

export interface ApplyLeaveRequest {
  userId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface ApproveLeaveRequest {
  approverId: string;
  decision: ApprovalDecision;
}
