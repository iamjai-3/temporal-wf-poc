import { LeaveType, ApprovalDecision } from "../types";

export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  // Simulate email sending
  console.log("\n📧 EMAIL NOTIFICATION");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body:\n${body}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // In production, replace with actual email service:
  // await emailService.send({ to, subject, body });
}

export function generateManagerNotificationEmail(
  employeeName: string,
  leaveType: LeaveType | string,
  startDate: string,
  endDate: string,
  reason: string,
  requestId: string
): string {
  return `
Dear Manager,

A new leave request requires your approval:

Employee: ${employeeName}
Leave Type: ${leaveType}
Start Date: ${startDate}
End Date: ${endDate}
Reason: ${reason}

Request ID: ${requestId}

Please review and approve/reject this request.

Best regards,
Leave Management System
  `.trim();
}

export function generateEmployeeNotificationEmail(
  decision: ApprovalDecision | string,
  leaveType: LeaveType | string,
  startDate: string,
  endDate: string
): string {
  const status = decision === ApprovalDecision.APPROVE || decision === "APPROVE" ? "approved" : "rejected";
  const statusIcon = decision === ApprovalDecision.APPROVE || decision === "APPROVE" ? "✅ Approved" : "❌ Rejected";
  
  return `
Dear Employee,

Your leave request has been ${status}:

Leave Type: ${leaveType}
Start Date: ${startDate}
End Date: ${endDate}

Status: ${statusIcon}

Best regards,
Leave Management System
  `.trim();
}
