import { LeaveType, ApprovalDecision } from "../types";
import { emailService } from "../services/email.service";

export async function sendEmailToManager(
  managerEmail: string,
  employeeName: string,
  leaveType: LeaveType,
  startDate: string,
  endDate: string,
  reason: string,
  requestId: string
): Promise<void> {
  return emailService.sendToManager(managerEmail, employeeName, leaveType, startDate, endDate, reason, requestId);
}

export async function sendEmailToEmployee(
  employeeEmail: string,
  decision: ApprovalDecision,
  leaveType: LeaveType,
  startDate: string,
  endDate: string
): Promise<void> {
  return emailService.sendToEmployee(employeeEmail, decision, leaveType, startDate, endDate);
}

