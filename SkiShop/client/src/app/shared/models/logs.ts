export interface SystemLog {
  id: number;
  level: string;
  source: string;
  message: string;
  exception?: string | null;
  stackTrace?: string | null;
  requestMethod?: string | null;
  requestPath?: string | null;
  statusCode?: number | null;
  durationMs?: number | null;
  userEmail?: string | null;
  ipAddress?: string | null;
  traceId?: string | null;
  timestamp: string;
}

export interface AuditLog {
  id: number;
  action: string;
  entityName: string;
  entityId?: string | null;
  userEmail?: string | null;
  userId?: string | null;
  ipAddress?: string | null;
  oldValues?: string | null;
  newValues?: string | null;
  affectedColumns?: string | null;
  details?: string | null;
  timestamp: string;
}

export interface LogStats {
  totalSystemLogs: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  totalAuditLogs: number;
  auditLast24Hours: number;
  auditActions: string[];
  auditEntities: string[];
  logLevels: string[];
  logSources: string[];
}

export interface SystemLogParams {
  pageNumber: number;
  pageSize: number;
  level: string;
  source: string;
  search: string;
}

export interface AuditLogParams {
  pageNumber: number;
  pageSize: number;
  action: string;
  entityName: string;
  search: string;
}
