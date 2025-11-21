import { LeaveType, ApprovalDecision } from "../types";
import { sendEmail, generateManagerNotificationEmail, generateEmployeeNotificationEmail } from "../utils/email";
import { writeAuditLog } from "../utils/audit";

export class EmailService {
  async sendToManager(
    managerEmail: string,
    employeeName: string,
    leaveType: LeaveType,
    startDate: string,
    endDate: string,
    reason: string,
    requestId: string
  ): Promise<void> {
    const subject = `Leave Request Approval Required - ${employeeName}`;
    const body = generateManagerNotificationEmail(employeeName, leaveType, startDate, endDate, reason, requestId);

    await sendEmail(managerEmail, subject, body);
    await writeAuditLog("sendEmailToManager", { managerEmail, requestId }, undefined, requestId);
  }

  async sendToEmployee(
    employeeEmail: string,
    decision: ApprovalDecision,
    leaveType: LeaveType,
    startDate: string,
    endDate: string
  ): Promise<void> {
    const subject = `Leave Request ${decision === ApprovalDecision.APPROVE ? "Approved" : "Rejected"}`;
    const body = generateEmployeeNotificationEmail(decision, leaveType, startDate, endDate);

    await sendEmail(employeeEmail, subject, body);
    await writeAuditLog("sendEmailToEmployee", { employeeEmail, decision });
  }
}

export const emailService = new EmailService();
