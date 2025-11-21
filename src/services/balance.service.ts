import { LeaveType } from "../types";
import { balanceRepository } from "../repositories/balance.repository";
import { calculateDaysBetween } from "../utils/date";
import { writeAuditLog } from "../utils/audit";

export class BalanceService {
  async reserve(userId: string, leaveType: LeaveType, startDate: string, endDate: string): Promise<boolean> {
    const days = calculateDaysBetween(startDate, endDate);
    const reserved = balanceRepository.reserve(userId, leaveType, days);

    await writeAuditLog("checkAndReserveLeaveBalance", { userId, leaveType, days, reserved }, userId);
    return reserved;
  }

  async commit(userId: string, leaveType: LeaveType, startDate: string, endDate: string): Promise<void> {
    const days = calculateDaysBetween(startDate, endDate);
    balanceRepository.commit(userId, leaveType, days);
    await writeAuditLog("commitLeaveDeduction", { userId, leaveType, days }, userId);
  }

  async rollback(userId: string, leaveType: LeaveType, startDate: string, endDate: string): Promise<void> {
    const days = calculateDaysBetween(startDate, endDate);
    balanceRepository.rollback(userId, leaveType, days);
    await writeAuditLog("rollbackLeaveReservation", { userId, leaveType, days }, userId);
  }
}

export const balanceService = new BalanceService();

