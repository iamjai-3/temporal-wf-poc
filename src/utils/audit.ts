// Audit logging utility

export interface AuditLog {
  timestamp: string;
  action: string;
  userId?: string;
  requestId?: string;
  details: Record<string, any>;
}

const auditLogs: AuditLog[] = [];

export async function writeAuditLog(
  action: string,
  details: Record<string, any>,
  userId?: string,
  requestId?: string
): Promise<void> {
  const log: AuditLog = {
    timestamp: new Date().toISOString(),
    action,
    userId,
    requestId,
    details,
  };

  auditLogs.push(log);

  // In production, write to persistent storage (database, log service, etc.)
  console.log(`📝 AUDIT: ${action}`, {
    timestamp: log.timestamp,
    userId,
    requestId,
    details,
  });
}

export function getAuditLogs(requestId?: string): AuditLog[] {
  if (requestId) {
    return auditLogs.filter((log) => log.requestId === requestId);
  }
  return auditLogs;
}

