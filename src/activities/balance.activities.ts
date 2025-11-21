import { LeaveType } from "../types";
import { balanceService } from "../services/balance.service";

export async function checkAndReserveLeaveBalance(
  userId: string,
  leaveType: LeaveType,
  startDate: string,
  endDate: string
): Promise<boolean> {
  return balanceService.reserve(userId, leaveType, startDate, endDate);
}

export async function commitLeaveDeduction(
  userId: string,
  leaveType: LeaveType,
  startDate: string,
  endDate: string
): Promise<void> {
  return balanceService.commit(userId, leaveType, startDate, endDate);
}

export async function rollbackLeaveReservation(
  userId: string,
  leaveType: LeaveType,
  startDate: string,
  endDate: string
): Promise<void> {
  return balanceService.rollback(userId, leaveType, startDate, endDate);
}

