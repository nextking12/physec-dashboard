export const DEVICE_TYPES = ["CAMERA", "CARD_READER", "ALARM_PANEL", "MOTION_SENSOR"];
export const DEVICE_STATUSES = ["ONLINE", "OFFLINE", "MAINTENANCE", "ALERTING"];

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
export const SESSION_STORAGE_KEY = "psd.session";

export const EMPTY_FORM = {
  name: "",
  type: "CAMERA",
  location: "",
  status: "ONLINE",
  model: "",
  macAddress: "",
  ipAddress: "",
  manufacturer: ""
};

export const statusLabels = {
  ONLINE: "Online",
  OFFLINE: "Offline",
  MAINTENANCE: "Maintenance",
  ALERTING: "Alerting"
};

export const typeLabels = {
  CAMERA: "Camera",
  CARD_READER: "Card Reader",
  ALARM_PANEL: "Alarm Panel",
  MOTION_SENSOR: "Motion Sensor"
};

export const roleLabels = {
  ADMIN: "Admin",
  OPERATOR: "Operator",
  VIEWER: "Viewer"
};

export const auditActionLabels = {
  CREATE: "Created",
  UPDATE: "Updated",
  DELETE: "Deleted"
};
