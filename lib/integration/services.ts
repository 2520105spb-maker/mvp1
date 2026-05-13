import { getPersistence } from "./persistence";
import {
  DispatchRepository,
  EmergencyRepository,
  MediaRepository,
  NotificationRepository,
  ObjectRepository,
  ReportRepository,
  SessionRepository,
  SyncRepository,
  WarehouseRepository,
  WorkOrderRepository,
} from "./repositories";

const persistence = getPersistence();

export const repositories = {
  sessions: new SessionRepository(persistence),
  objects: new ObjectRepository(persistence),
  workOrders: new WorkOrderRepository(persistence),
  warehouse: new WarehouseRepository(persistence),
  media: new MediaRepository(persistence),
  notifications: new NotificationRepository(persistence),
  dispatch: new DispatchRepository(persistence),
  emergency: new EmergencyRepository(persistence),
  sync: new SyncRepository(persistence),
  reports: new ReportRepository(persistence),
};

export type OperationalRepositories = typeof repositories;
