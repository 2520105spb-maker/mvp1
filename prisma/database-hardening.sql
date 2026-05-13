-- НеоЛифт ERP/PWA production database hardening blueprint.
-- This file documents PostgreSQL/PostGIS indexes, constraints, partitioning
-- and immutability guards that complement Prisma migrations.
-- Review and apply per environment with zero-downtime migration procedures.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Search and operational lookup indexes.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_order_search_trgm
  ON "WorkOrder" USING gin (("number" || ' ' || "title" || ' ' || coalesce("description", '')) gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_object_address_trgm
  ON "ServiceObject" USING gin ("address" gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_elevator_factory_model_trgm
  ON "Elevator" USING gin (("factoryNumber" || ' ' || "manufacturer" || ' ' || coalesce("model", '')) gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_material_name_sku_trgm
  ON "Material" USING gin (("sku" || ' ' || "name") gin_trgm_ops);

-- PostGIS indexes for realtime map and nearest technician/object queries.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_geo_object_point_gist
  ON "GeoObject" USING gist ("point");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_elevator_location_point_gist
  ON "ElevatorLocation" USING gist ("point");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_technician_location_point_gist
  ON "TechnicianLocation" USING gist ("point");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_location_event_point_gist
  ON "LocationEvent" USING gist ("point") WHERE "point" IS NOT NULL;

-- SLA, dispatch and outbox worker scan indexes.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sla_event_active_due
  ON "SLAEvent" ("dueAt", "state") WHERE "breachedAt" IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dispatch_queue_ready
  ON "DispatchQueue" ("tenantId", "status", "priority", "createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_outbox_ready_publish
  ON "OutboxMessage" ("availableAt") WHERE "status" = 'PENDING' AND "lockedAt" IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_domain_event_ready_publish
  ON "DomainEvent" ("occurredAt") WHERE "status" = 'PENDING';

-- Append-heavy table helpers.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_location_event_occurred_brin
  ON "LocationEvent" USING brin ("occurredAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_record_created_brin
  ON "AuditRecord" USING brin ("createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sync_operation_created_brin
  ON "SyncOperation" USING brin ("createdAt");

-- Inventory integrity. Application services still lock StockLevel rows with SELECT FOR UPDATE.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_stock_level_non_negative') THEN
    ALTER TABLE "StockLevel"
      ADD CONSTRAINT chk_stock_level_non_negative
      CHECK ("onHand" >= 0 AND "reserved" >= 0 AND "reserved" <= "onHand");
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_work_order_material_positive') THEN
    ALTER TABLE "WorkOrderMaterial"
      ADD CONSTRAINT chk_work_order_material_positive
      CHECK ("quantity" > 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_material_movement_quantity_non_zero') THEN
    ALTER TABLE "MaterialMovement"
      ADD CONSTRAINT chk_material_movement_quantity_non_zero
      CHECK ("quantity" <> 0);
  END IF;
END;
$$;

-- Generic immutability guard for append-only ledgers.
CREATE OR REPLACE FUNCTION neolift_block_append_only_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'append-only table % cannot be updated or deleted', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_record_append_only ON "AuditRecord";
CREATE TRIGGER trg_audit_record_append_only
  BEFORE UPDATE OR DELETE ON "AuditRecord"
  FOR EACH ROW EXECUTE FUNCTION neolift_block_append_only_mutation();

DROP TRIGGER IF EXISTS trg_material_movement_append_only ON "MaterialMovement";
CREATE TRIGGER trg_material_movement_append_only
  BEFORE UPDATE OR DELETE ON "MaterialMovement"
  FOR EACH ROW EXECUTE FUNCTION neolift_block_append_only_mutation();

DROP TRIGGER IF EXISTS trg_location_event_append_only ON "LocationEvent";
CREATE TRIGGER trg_location_event_append_only
  BEFORE UPDATE OR DELETE ON "LocationEvent"
  FOR EACH ROW EXECUTE FUNCTION neolift_block_append_only_mutation();

DROP TRIGGER IF EXISTS trg_incident_audit_append_only ON "IncidentAuditLog";
CREATE TRIGGER trg_incident_audit_append_only
  BEFORE UPDATE OR DELETE ON "IncidentAuditLog"
  FOR EACH ROW EXECUTE FUNCTION neolift_block_append_only_mutation();

-- Partitioning templates. Convert existing tables through an expand/copy/swap plan;
-- do not run this block directly against populated production tables.
CREATE TABLE IF NOT EXISTS "AuditRecordPartitioned" (
  LIKE "AuditRecord" INCLUDING ALL
) PARTITION BY RANGE ("createdAt");

CREATE TABLE IF NOT EXISTS "LocationEventPartitioned" (
  LIKE "LocationEvent" INCLUDING ALL
) PARTITION BY RANGE ("occurredAt");

CREATE TABLE IF NOT EXISTS "SyncOperationPartitioned" (
  LIKE "SyncOperation" INCLUDING ALL
) PARTITION BY RANGE ("createdAt");

CREATE TABLE IF NOT EXISTS "DomainEventPartitioned" (
  LIKE "DomainEvent" INCLUDING ALL
) PARTITION BY RANGE ("occurredAt");

-- Row-level isolation foundation. Enable only after policies are installed and tested.
-- ALTER TABLE "WorkOrder" ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_work_order_isolation ON "WorkOrder"
--   USING ("tenantId" = current_setting('app.tenant_id', true));
