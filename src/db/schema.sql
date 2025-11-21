-- SQLite Schema for Leave Management System

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK(role IN ('EMPLOYEE', 'MANAGER', 'HR', 'ADMIN')),
    manager_id TEXT,
    FOREIGN KEY (manager_id) REFERENCES users(id)
);

-- Leave requests table
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

-- Leave balances table
CREATE TABLE IF NOT EXISTS leave_balances (
    user_id TEXT NOT NULL,
    leave_type TEXT NOT NULL CHECK(leave_type IN ('CASUAL', 'SICK', 'EARNED', 'WELLNESS')),
    total INTEGER NOT NULL DEFAULT 10,
    used INTEGER NOT NULL DEFAULT 0,
    reserved INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, leave_type),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leave_requests_user_id ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_workflow_id ON leave_requests(workflow_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);

