import { LeaveType, LeaveBalance } from "../types";
import { db } from "../db";

export class BalanceRepository {
  getBalance(userId: string, leaveType: LeaveType): LeaveBalance {
    return db.getLeaveBalance(userId, leaveType);
  }

  reserve(userId: string, leaveType: LeaveType, days: number): boolean {
    return db.reserveLeaveBalance(userId, leaveType, days);
  }

  commit(userId: string, leaveType: LeaveType, days: number): void {
    db.commitLeaveDeduction(userId, leaveType, days);
  }

  rollback(userId: string, leaveType: LeaveType, days: number): void {
    db.rollbackLeaveReservation(userId, leaveType, days);
  }
}

export const balanceRepository = new BalanceRepository();

