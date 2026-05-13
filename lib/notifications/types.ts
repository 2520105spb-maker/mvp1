export type NotificationPriority =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "silent";
export type AlertType =
  | "emergency"
  | "sla"
  | "overdue_job"
  | "sync_failure"
  | "missing_photo"
  | "low_stock"
  | "approval_request"
  | "system"
  | "security"
  | "ai_anomaly";
export type NotificationStatus =
  | "unread"
  | "acknowledged"
  | "in_progress"
  | "resolved"
  | "snoozed"
  | "escalated"
  | "failed";
export type NotificationChannelType =
  | "in_app"
  | "push"
  | "email"
  | "sms"
  | "telegram";
export type DeliveryStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "throttled";
export type EscalationLevel =
  | "mechanic"
  | "dispatcher"
  | "supervisor"
  | "director"
  | "security";

export type Notification = {
  id: string;
  alertId: string;
  priority: NotificationPriority;
  type: AlertType;
  title: string;
  body: string;
  source: string;
  objectAddress: string;
  elevatorFactoryNumber?: string;
  assignedUser: string;
  assignedRole: EscalationLevel;
  createdAt: string;
  status: NotificationStatus;
  channels: NotificationChannelType[];
  sensitive: boolean;
  actionUrl: string;
};

export type Alert = {
  id: string;
  type: AlertType;
  priority: NotificationPriority;
  sourceEntityId: string;
  sourceEntityType:
    | "work_order"
    | "media"
    | "sync"
    | "warehouse"
    | "approval"
    | "security"
    | "ai";
  objectAddress: string;
  elevatorFactoryNumber?: string;
  status: NotificationStatus;
  createdAt: string;
  updatedAt: string;
  dedupeKey: string;
  slaEventId?: string;
  escalationPolicyId: string;
};

export type AlertRule = {
  id: string;
  name: string;
  type: AlertType;
  condition: string;
  priority: NotificationPriority;
  channels: NotificationChannelType[];
  throttleMinutes: number;
  dedupeWindowMinutes: number;
  enabled: boolean;
};

export type EscalationPolicy = {
  id: string;
  name: string;
  alertType: AlertType;
  steps: Array<{
    level: EscalationLevel;
    afterMinutes: number;
    channels: NotificationChannelType[];
    action: string;
  }>;
};

export type NotificationChannel = {
  id: string;
  type: NotificationChannelType;
  name: string;
  enabled: boolean;
  deliverySlaSeconds: number;
  retryPolicy: string;
};

export type PushSubscriptionRecord = {
  id: string;
  userId: string;
  deviceId: string;
  endpointHash: string;
  pwaInstall: boolean;
  emergencyFullscreen: boolean;
  actionsEnabled: boolean;
  lastSeenAt: string;
};

export type NotificationQueueItem = {
  id: string;
  notificationId: string;
  channel: NotificationChannelType;
  priority: NotificationPriority;
  status: DeliveryStatus;
  attempts: number;
  nextAttemptAt?: string;
  lockedBy?: string;
};

export type AlertHistoryEntry = {
  id: string;
  alertId: string;
  actor: string;
  action:
    | "created"
    | "sent"
    | "delivered"
    | "read"
    | "acknowledged"
    | "escalated"
    | "resolved"
    | "failed"
    | "suppressed";
  channel?: NotificationChannelType;
  createdAt: string;
  details: string;
};

export type DeliveryAttempt = {
  id: string;
  notificationId: string;
  channel: NotificationChannelType;
  status: DeliveryStatus;
  attemptedAt: string;
  latencyMs: number;
  error?: string;
};

export type SLAEvent = {
  id: string;
  workOrderId: string;
  objectAddress: string;
  elevatorFactoryNumber: string;
  dueAt: string;
  warnAt: string;
  breachAt: string;
  remainingMinutes: number;
  risk: "normal" | "warning" | "breach" | "escalated";
};

export type EmergencyEvent = {
  id: string;
  workOrderId: string;
  objectAddress: string;
  elevatorFactoryNumber: string;
  receivedAt: string;
  acceptedAt?: string;
  dispatcher: string;
  mechanic: string;
  escalationPolicyId: string;
  fullscreenPushSent: boolean;
};

export type ApprovalRequest = {
  id: string;
  type:
    | "material_writeoff"
    | "high_cost_part"
    | "overtime"
    | "unsafe_closure"
    | "document_access";
  requester: string;
  approverChain: string[];
  amount?: string;
  status: "pending" | "approved" | "rejected" | "escalated";
  createdAt: string;
  dueAt: string;
};

export type UserPreference = {
  userId: string;
  quietHours: { enabled: boolean; start: string; end: string };
  enabledAlertTypes: AlertType[];
  channels: NotificationChannelType[];
  sound: boolean;
  vibration: boolean;
  emergencyOverride: boolean;
  escalationPreference: "normal" | "aggressive" | "minimal";
};

export type AIRiskAssessment = {
  id: string;
  alertId: string;
  score: number;
  category:
    | "sla_breach"
    | "safety"
    | "customer_impact"
    | "sync_risk"
    | "fraud"
    | "stockout";
  explanation: string;
  recommendation: string;
};

export type NotificationStreamRow = {
  notification: Notification;
  alert?: Alert;
  sla?: SLAEvent;
  queueItems: NotificationQueueItem[];
  ai?: AIRiskAssessment;
};
