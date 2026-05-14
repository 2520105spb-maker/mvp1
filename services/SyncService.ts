import { Prisma, SyncStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/utils/logger";

const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID ?? "tenant_demo";

type IncomingSyncOperation = {
  idempotencyKey?: string;
  entity?: string;
  operation?: string;
  operationType?: string;
  workOrderId?: string;
  payload?: unknown;
  baseVersion?: number;
  localVersion?: number;
};

export class SyncService {
  async replay(input: {
    deviceId: string;
    operations: IncomingSyncOperation[];
    requestId?: string;
    userId?: string;
  }) {
    const applied = [];
    const duplicates = [];
    const conflicts = [];

    for (const operation of input.operations) {
      const idempotencyKey =
        operation.idempotencyKey ??
        `${input.deviceId}:${operation.operation ?? operation.operationType}:${operation.workOrderId ?? "global"}:${operation.localVersion ?? 0}`;
      const duplicate = await prisma.syncOperation.findUnique({
        where: { idempotencyKey },
      });
      if (duplicate) {
        duplicates.push(duplicate);
        if (duplicate.status === SyncStatus.CONFLICT) conflicts.push(duplicate);
        else applied.push(duplicate);
        continue;
      }

      const workOrder = operation.workOrderId
        ? await prisma.workOrder.findUnique({ where: { id: operation.workOrderId } })
        : null;
      const baseVersion = Number(operation.baseVersion ?? 0);
      const localVersion = Number(operation.localVersion ?? baseVersion + 1);
      const hasConflict = Boolean(
        workOrder && baseVersion > 0 && workOrder.serverVersion !== baseVersion,
      );
      const conflictPayload = hasConflict
        ? {
            reason: "OPTIMISTIC_VERSION_MISMATCH",
            server: workOrder,
            client: operation.payload,
            baseVersion,
            serverVersion: workOrder?.serverVersion,
          }
        : undefined;

      const saved = await prisma.$transaction(async (tx) => {
        const stored = await tx.syncOperation.create({
          data: {
            tenantId: DEFAULT_TENANT_ID,
            deviceId: input.deviceId,
            workOrderId: operation.workOrderId,
            operationType: operation.operationType ?? operation.operation ?? "unknown",
            idempotencyKey,
            baseVersion,
            localVersion,
            status: hasConflict ? SyncStatus.CONFLICT : SyncStatus.APPLIED,
            payload: (operation.payload ?? {}) as Prisma.InputJsonValue,
            conflict: conflictPayload as Prisma.InputJsonValue | undefined,
            appliedAt: hasConflict ? undefined : new Date(),
          },
        });

        if (
          !hasConflict &&
          workOrder &&
          operation.payload &&
          typeof operation.payload === "object"
        ) {
          const payload = operation.payload as Record<string, unknown>;
          await tx.workOrder.update({
            where: { id: workOrder.id },
            data: {
              ...(typeof payload.title === "string" ? { title: payload.title } : {}),
              serverVersion: { increment: 1 },
              offlineVersion: localVersion,
            },
          });
        }
        return stored;
      });

      if (hasConflict) conflicts.push(saved);
      else applied.push(saved);
    }

    logger.info(
      {
        requestId: input.requestId,
        userId: input.userId,
        endpoint: "/api/v1/sync",
        operationType: "sync.replay",
        sync: {
          deviceId: input.deviceId,
          operations: input.operations.length,
          applied: applied.length,
          duplicates: duplicates.length,
          conflicts: conflicts.length,
        },
      },
      "sync replay processed",
    );

    return { applied, duplicates, conflicts, cursor: new Date().toISOString() };
  }
}

export const syncService = new SyncService();
