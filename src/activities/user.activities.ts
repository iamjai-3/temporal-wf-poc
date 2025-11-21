import { userService } from "../services/user.service";

export async function getUserById(userId: string) {
  return userService.getById(userId);
}

export async function getManagerForUser(userId: string) {
  return userService.getManagerForUser(userId);
}

export async function validateApproverPermission(approverId: string, employeeId: string): Promise<boolean> {
  return userService.validateApproverPermission(approverId, employeeId);
}

