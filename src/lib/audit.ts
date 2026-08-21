import { prisma } from './db';

export interface AuditLogOptions {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeState?: Record<string, any> | null;
  afterState?: Record<string, any> | null;
  ipAddress?: string | null;
}

export async function logAuditEvent(options: AuditLogOptions) {
  try {
    return await prisma.auditLog.create({
      data: {
        actor_id: options.actorId || null,
        action: options.action,
        entity_type: options.entityType,
        entity_id: options.entityId,
        before_state: options.beforeState ? JSON.stringify(options.beforeState) : null,
        after_state: options.afterState ? JSON.stringify(options.afterState) : null,
        ip_address: options.ipAddress || null,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
