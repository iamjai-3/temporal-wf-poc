import { User, LeaveRequest, LeaveBalance, UserRole, LeaveType, LeaveStatus } from "./types";
import { DEFAULT_LEAVE_BALANCE } from "./config/constants";

// In-memory database for POC
// In production, replace with actual database (PostgreSQL, MongoDB, etc.)

class Database {
  private readonly users: Map<string, User> = new Map();
  private readonly leaveRequests: Map<string, LeaveRequest> = new Map();
  private readonly leaveBalances: Map<string, LeaveBalance> = new Map();

  // User operations
  createUser(user: User): void {
    this.users.set(user.id, user);
  }

  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  getManagerForUser(userId: string): User | undefined {
    const user = this.users.get(userId);
    if (!user?.managerId) {
      return undefined;
    }
    return this.users.get(user.managerId);
  }

  // Leave request operations
  createLeaveRequest(request: LeaveRequest): void {
    this.leaveRequests.set(request.id, request);
  }

  getLeaveRequestById(id: string): LeaveRequest | undefined {
    return this.leaveRequests.get(id);
  }

  updateLeaveRequestStatus(id: string, status: LeaveStatus, approverId?: string): void {
    const request = this.leaveRequests.get(id);
    if (request) {
      request.status = status;
      request.updatedAt = new Date().toISOString();
      if (approverId) {
        request.approverId = approverId;
      }
    }
  }

  setWorkflowId(requestId: string, workflowId: string): void {
    const request = this.leaveRequests.get(requestId);
    if (request) {
      request.workflowId = workflowId;
      request.updatedAt = new Date().toISOString();
    }
  }

  getLeaveRequestByWorkflowId(workflowId: string): LeaveRequest | undefined {
    for (const request of this.leaveRequests.values()) {
      if (request.workflowId === workflowId) {
        return request;
      }
    }
    return undefined;
  }

  getAllLeaveRequests(): LeaveRequest[] {
    return Array.from(this.leaveRequests.values());
  }

  // Leave balance operations
  getLeaveBalance(userId: string, leaveType: LeaveType): LeaveBalance {
    const key = `${userId}-${leaveType}`;
    const balance = this.leaveBalances.get(key);
    if (balance) {
      return balance;
    }
    // Default balance
    const newBalance: LeaveBalance = {
      userId,
      leaveType,
      total: DEFAULT_LEAVE_BALANCE,
      used: 0,
      reserved: 0,
    };
    this.leaveBalances.set(key, newBalance);
    return newBalance;
  }

  reserveLeaveBalance(userId: string, leaveType: LeaveType, days: number): boolean {
    const balance = this.getLeaveBalance(userId, leaveType);
    const available = balance.total - balance.used - balance.reserved;
    if (available >= days) {
      balance.reserved += days;
      return true;
    }
    return false;
  }

  commitLeaveDeduction(userId: string, leaveType: LeaveType, days: number): void {
    const balance = this.getLeaveBalance(userId, leaveType);
    balance.reserved -= days;
    balance.used += days;
  }

  rollbackLeaveReservation(userId: string, leaveType: LeaveType, days: number): void {
    const balance = this.getLeaveBalance(userId, leaveType);
    balance.reserved -= days;
  }

  // Initialize with sample data
  initialize(): void {
    // Create sample users
    this.createUser({
      id: "u1",
      name: "John Employee",
      email: "john@example.com",
      role: UserRole.EMPLOYEE,
      managerId: "u2",
    });

    this.createUser({
      id: "u2",
      name: "Jane Manager",
      email: "jane@example.com",
      role: UserRole.MANAGER,
      managerId: "u3",
    });

    this.createUser({
      id: "u3",
      name: "Bob HR",
      email: "bob@example.com",
      role: UserRole.HR,
    });

    this.createUser({
      id: "u4",
      name: "Alice Admin",
      email: "alice@example.com",
      role: UserRole.ADMIN,
    });
  }
}

export const db = new Database();
db.initialize();
