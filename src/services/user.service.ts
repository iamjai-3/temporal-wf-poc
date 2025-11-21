import { User, UserRole } from "../types";
import { userRepository } from "../repositories/user.repository";
import { writeAuditLog } from "../utils/audit";

export class UserService {
  async getById(userId: string): Promise<User | undefined> {
    await writeAuditLog("getUserById", { userId });
    return userRepository.getById(userId);
  }

  async getManagerForUser(userId: string): Promise<User | undefined> {
    await writeAuditLog("getManagerForUser", { userId });
    return userRepository.getManagerForUser(userId);
  }

  async validateApproverPermission(approverId: string, employeeId: string): Promise<boolean> {
    const approver = await this.getById(approverId);
    const employee = await this.getById(employeeId);

    if (!approver || !employee) {
      return false;
    }

    // Admin and HR can approve any request
    if (approver.role === UserRole.ADMIN || approver.role === UserRole.HR) {
      return true;
    }

    // Manager can approve requests from their direct reports
    if (approver.role === UserRole.MANAGER) {
      const manager = await this.getManagerForUser(employeeId);
      return manager?.id === approverId;
    }

    return false;
  }
}

export const userService = new UserService();

