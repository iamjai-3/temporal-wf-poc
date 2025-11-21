import { proxyActivities, defineSignal, setHandler, condition, workflowInfo } from "@temporalio/workflow";
import type * as activities from "../activities";
import { LeaveStatus, ApprovalDecision, ApprovalSignal } from "../types";
import { APPROVAL_TIMEOUT_MS } from "../config/constants";

const {
  getUserById,
  getManagerForUser,
  createLeaveRequestRecord,
  updateLeaveRequestStatus,
  checkAndReserveLeaveBalance,
  commitLeaveDeduction,
  rollbackLeaveReservation,
  sendEmailToManager,
  sendEmailToEmployee,
  validateApproverPermission,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: "1 minute",
});

export const approvalSignal = defineSignal<[ApprovalSignal]>("approvalSignal");

export interface LeaveApplicationInput {
  userId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export async function LeaveApplicationWorkflow(
  input: LeaveApplicationInput
): Promise<{ status: LeaveStatus; requestId: string }> {
  let approvalDecision: ApprovalDecision | null = null;
  let approverId: string | null = null;

  // Set up signal handler
  setHandler(approvalSignal, (signal: ApprovalSignal) => {
    approvalDecision = signal.decision;
    approverId = signal.approverId;
  });

  // Step 1: Get user and manager information
  const user = await getUserById(input.userId);
  if (!user) {
    throw new Error(`User not found: ${input.userId}`);
  }

  const manager = await getManagerForUser(input.userId);
  if (!manager) {
    throw new Error(`Manager not found for user: ${input.userId}`);
  }

  // Step 2: Create leave request record
  const info = workflowInfo();
  const request = await createLeaveRequestRecord(
    input.userId,
    input.leaveType as any,
    input.startDate,
    input.endDate,
    input.reason,
    info.workflowId
  );

  // Step 3: Check and reserve leave balance
  const balanceReserved = await checkAndReserveLeaveBalance(
    input.userId,
    input.leaveType as any,
    input.startDate,
    input.endDate
  );

  if (!balanceReserved) {
    await updateLeaveRequestStatus(request.id, LeaveStatus.REJECTED);
    throw new Error("Insufficient leave balance");
  }

  // Step 4: Send email to manager
  await sendEmailToManager(
    manager.email,
    user.name,
    input.leaveType as any,
    input.startDate,
    input.endDate,
    input.reason,
    request.id
  );

  // Step 5: Wait for approval signal (with timeout)
  const approvalReceived = await condition(() => approvalDecision !== null, APPROVAL_TIMEOUT_MS);

  if (!approvalReceived) {
    // Timeout - rollback reservation
    await rollbackLeaveReservation(input.userId, input.leaveType as any, input.startDate, input.endDate);
    await updateLeaveRequestStatus(request.id, LeaveStatus.REJECTED);
    return { status: LeaveStatus.REJECTED, requestId: request.id };
  }

  // Step 6: Validate approver permission
  if (!approverId) {
    throw new Error("Approver ID is required");
  }

  const hasPermission = await validateApproverPermission(approverId, input.userId);
  if (!hasPermission) {
    // Rollback reservation
    await rollbackLeaveReservation(input.userId, input.leaveType as any, input.startDate, input.endDate);
    await updateLeaveRequestStatus(request.id, LeaveStatus.REJECTED);
    throw new Error("Approver does not have permission to approve this request");
  }

  // Step 7: Process approval decision
  if (approvalDecision === ApprovalDecision.APPROVE) {
    await commitLeaveDeduction(input.userId, input.leaveType as any, input.startDate, input.endDate);
    await updateLeaveRequestStatus(request.id, LeaveStatus.APPROVED, approverId);
  } else {
    await rollbackLeaveReservation(input.userId, input.leaveType as any, input.startDate, input.endDate);
    await updateLeaveRequestStatus(request.id, LeaveStatus.REJECTED, approverId);
  }

  // Step 8: Send email to employee
  if (approvalDecision) {
    await sendEmailToEmployee(user.email, approvalDecision, input.leaveType as any, input.startDate, input.endDate);
  }

  return {
    status: approvalDecision === ApprovalDecision.APPROVE ? LeaveStatus.APPROVED : LeaveStatus.REJECTED,
    requestId: request.id,
  };
}
