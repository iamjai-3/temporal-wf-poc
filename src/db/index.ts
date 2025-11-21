import Database from "better-sqlite3";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { User, LeaveRequest, LeaveBalance, UserRole, LeaveType, LeaveStatus } from "../types";
import { DEFAULT_LEAVE_BALANCE } from "../config/constants";

class SQLiteDatabase {
  private readonly db: Database.Database;

  constructor(dbPath?: string) {
    const path = dbPath ?? join(process.cwd(), "leave-management.db");
    this.db = new Database(path);
    this.db.pragma("journal_mode = WAL"); // Better concurrency
    this.initializeSchema();
  }

  private initializeSchema(): void {
    // Try multiple paths for schema file (development vs production)
    const possiblePaths = [
      join(__dirname, "schema.sql"),
      join(process.cwd(), "src", "db", "schema.sql"),
      join(process.cwd(), "dist", "db", "schema.sql"),
    ];

    let schema: string | null = null;
    for (const path of possiblePaths) {
      try {
        schema = readFileSync(path, "utf-8");
        break;
      } catch {
        // Try next path
      }
    }

    if (!schema) {
      // Fallback: create schema inline
      schema = `
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          role TEXT NOT NULL CHECK(role IN ('EMPLOYEE', 'MANAGER', 'HR', 'ADMIN')),
          manager_id TEXT,
          FOREIGN KEY (manager_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS leave_requests (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          leave_type TEXT NOT NULL CHECK(leave_type IN ('CASUAL', 'SICK', 'EARNED', 'WELLNESS')),
          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
          reason TEXT NOT NULL,
          status TEXT NOT NULL CHECK(status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED')),
          approver_id TEXT,
          workflow_id TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (approver_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS leave_balances (
          user_id TEXT NOT NULL,
          leave_type TEXT NOT NULL CHECK(leave_type IN ('CASUAL', 'SICK', 'EARNED', 'WELLNESS')),
          total INTEGER NOT NULL DEFAULT 10,
          used INTEGER NOT NULL DEFAULT 0,
          reserved INTEGER NOT NULL DEFAULT 0,
          PRIMARY KEY (user_id, leave_type),
          FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE INDEX IF NOT EXISTS idx_leave_requests_user_id ON leave_requests(user_id);
        CREATE INDEX IF NOT EXISTS idx_leave_requests_workflow_id ON leave_requests(workflow_id);
        CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
        CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);
      `;
    }

    this.db.exec(schema);
  }

  // User operations
  createUser(user: User): void {
    const stmt = this.db.prepare(`
      INSERT INTO users (id, name, email, role, manager_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(user.id, user.name, user.email, user.role, user.managerId ?? null);
  }

  getUserById(id: string): User | undefined {
    const stmt = this.db.prepare("SELECT * FROM users WHERE id = ?");
    const row = stmt.get(id) as any;
    if (!row) return undefined;

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role as UserRole,
      managerId: row.manager_id ?? undefined,
    };
  }

  getManagerForUser(userId: string): User | undefined {
    const user = this.getUserById(userId);
    if (!user?.managerId) {
      return undefined;
    }
    return this.getUserById(user.managerId);
  }

  // Leave request operations
  createLeaveRequest(request: LeaveRequest): void {
    const stmt = this.db.prepare(`
      INSERT INTO leave_requests (
        id, user_id, leave_type, start_date, end_date, reason,
        status, approver_id, workflow_id, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      request.id,
      request.userId,
      request.leaveType,
      request.startDate,
      request.endDate,
      request.reason,
      request.status,
      request.approverId ?? null,
      request.workflowId ?? null,
      request.createdAt,
      request.updatedAt
    );
  }

  getLeaveRequestById(id: string): LeaveRequest | undefined {
    const stmt = this.db.prepare("SELECT * FROM leave_requests WHERE id = ?");
    const row = stmt.get(id) as any;
    if (!row) return undefined;

    return this.mapRowToLeaveRequest(row);
  }

  updateLeaveRequestStatus(id: string, status: LeaveStatus, approverId?: string): void {
    const stmt = this.db.prepare(`
      UPDATE leave_requests
      SET status = ?, approver_id = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(status, approverId ?? null, new Date().toISOString(), id);
  }

  setWorkflowId(requestId: string, workflowId: string): void {
    const stmt = this.db.prepare(`
      UPDATE leave_requests
      SET workflow_id = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(workflowId, new Date().toISOString(), requestId);
  }

  getLeaveRequestByWorkflowId(workflowId: string): LeaveRequest | undefined {
    const stmt = this.db.prepare("SELECT * FROM leave_requests WHERE workflow_id = ?");
    const row = stmt.get(workflowId) as any;
    if (!row) return undefined;

    return this.mapRowToLeaveRequest(row);
  }

  getAllLeaveRequests(): LeaveRequest[] {
    const stmt = this.db.prepare("SELECT * FROM leave_requests ORDER BY created_at DESC");
    const rows = stmt.all() as any[];
    return rows.map((row) => this.mapRowToLeaveRequest(row));
  }

  private mapRowToLeaveRequest(row: any): LeaveRequest {
    return {
      id: row.id,
      userId: row.user_id,
      leaveType: row.leave_type as LeaveType,
      startDate: row.start_date,
      endDate: row.end_date,
      reason: row.reason,
      status: row.status as LeaveStatus,
      approverId: row.approver_id ?? undefined,
      workflowId: row.workflow_id ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // Leave balance operations
  getLeaveBalance(userId: string, leaveType: LeaveType): LeaveBalance {
    const stmt = this.db.prepare(`
      SELECT * FROM leave_balances WHERE user_id = ? AND leave_type = ?
    `);
    const row = stmt.get(userId, leaveType) as any;

    if (row) {
      return {
        userId: row.user_id,
        leaveType: row.leave_type as LeaveType,
        total: row.total,
        used: row.used,
        reserved: row.reserved,
      };
    }

    // Create default balance if not exists
    const insertStmt = this.db.prepare(`
      INSERT INTO leave_balances (user_id, leave_type, total, used, reserved)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertStmt.run(userId, leaveType, DEFAULT_LEAVE_BALANCE, 0, 0);

    return {
      userId,
      leaveType,
      total: DEFAULT_LEAVE_BALANCE,
      used: 0,
      reserved: 0,
    };
  }

  reserveLeaveBalance(userId: string, leaveType: LeaveType, days: number): boolean {
    const balance = this.getLeaveBalance(userId, leaveType);
    const available = balance.total - balance.used - balance.reserved;

    if (available >= days) {
      const stmt = this.db.prepare(`
        UPDATE leave_balances
        SET reserved = reserved + ?
        WHERE user_id = ? AND leave_type = ?
      `);
      stmt.run(days, userId, leaveType);
      return true;
    }
    return false;
  }

  commitLeaveDeduction(userId: string, leaveType: LeaveType, days: number): void {
    const stmt = this.db.prepare(`
      UPDATE leave_balances
      SET reserved = reserved - ?, used = used + ?
      WHERE user_id = ? AND leave_type = ?
    `);
    stmt.run(days, days, userId, leaveType);
  }

  rollbackLeaveReservation(userId: string, leaveType: LeaveType, days: number): void {
    const stmt = this.db.prepare(`
      UPDATE leave_balances
      SET reserved = reserved - ?
      WHERE user_id = ? AND leave_type = ?
    `);
    stmt.run(days, userId, leaveType);
  }

  // Initialize with sample data
  initialize(): void {
    // Check if users already exist
    const userCount = this.db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
    if (userCount.count > 0) {
      return; // Already initialized
    }

    // Disable foreign key checks temporarily for initialization
    this.db.pragma("foreign_keys = OFF");

    try {
      // Create users in order: managers first, then employees
      // u3 (HR) - no manager
      this.createUser({
        id: "u3",
        name: "Bob HR",
        email: "bob@example.com",
        role: UserRole.HR,
      });

      // u4 (Admin) - no manager
      this.createUser({
        id: "u4",
        name: "Alice Admin",
        email: "alice@example.com",
        role: UserRole.ADMIN,
      });

      // u2 (Manager) - manager is u3
      this.createUser({
        id: "u2",
        name: "Jane Manager",
        email: "jane@example.com",
        role: UserRole.MANAGER,
        managerId: "u3",
      });

      // u1 (Employee) - manager is u2
      this.createUser({
        id: "u1",
        name: "John Employee",
        email: "john@example.com",
        role: UserRole.EMPLOYEE,
        managerId: "u2",
      });
    } finally {
      // Re-enable foreign key checks
      this.db.pragma("foreign_keys = ON");
    }
  }

  // Close database connection (useful for cleanup)
  close(): void {
    this.db.close();
  }
}

export const db = new SQLiteDatabase();
db.initialize();
