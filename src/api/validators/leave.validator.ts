import { ApplyLeaveRequest, ApproveLeaveRequest } from "../../types";
import { isValidDateRange } from "../../utils/date";

export class LeaveValidator {
  validateApplyLeaveRequest(body: any): { valid: boolean; error?: string } {
    if (!body.userId || !body.leaveType || !body.startDate || !body.endDate || !body.reason) {
      return { valid: false, error: "Missing required fields" };
    }

    if (!isValidDateRange(body.startDate, body.endDate)) {
      return { valid: false, error: "Invalid date range" };
    }

    return { valid: true };
  }

  validateApproveLeaveRequest(body: any): { valid: boolean; error?: string } {
    if (!body.approverId || !body.decision) {
      return { valid: false, error: "Missing required fields" };
    }

    return { valid: true };
  }
}

export const leaveValidator = new LeaveValidator();

