import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Camera,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Edit3,
  Filter,
  LogOut,
  Plus,
  Radar,
  RefreshCw,
  Save,
  Shield,
  Trash2,
  X
} from "lucide-react";

const DEVICE_TYPES = ["CAMERA", "CARD_READER", "ALARM_PANEL", "MOTION_SENSOR"];
const DEVICE_STATUSES = ["ONLINE", "OFFLINE", "MAINTENANCE", "ALERTING"];
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const SESSION_STORAGE_KEY = "psd.session";

const DEMO_DEVICES = [
  {
    id: "demo-1",
    name: "Front entrance camera",
    type: "CAMERA",
    location: "Main Lobby",
    status: "ONLINE",
    model: "P3265-LV",
    macAddress: "00:1A:2B:3C:4D:5E",
    ipAddress: "10.20.1.12",
    manufacturer: "Axis",
    createdAt: "2026-06-01T14:25:00Z"
  },
  {
    id: "demo-2",
    name: "Rear door card reader",
    type: "CARD_READER",
    location: "Rear Entrance",
    status: "OFFLINE",
    model: "RPK40",
    macAddress: "00:1A:2B:3C:4D:61",
    ipAddress: "10.20.2.8",
    manufacturer: "HID",
    createdAt: "2026-06-02T16:40:00Z"
  },
  {
    id: "demo-3",
    name: "East wing alarm panel",
    type: "ALARM_PANEL",
    location: "East Wing",
    status: "MAINTENANCE",
    model: "Vista-128BPT",
    macAddress: "00:1A:2B:3C:4D:72",
    ipAddress: "10.20.3.4",
    manufacturer: "Honeywell",
    createdAt: "2026-06-03T19:05:00Z"
  },
  {
    id: "demo-4",
    name: "Lobby motion sensor",
    type: "MOTION_SENSOR",
    location: "Main Lobby",
    status: "ONLINE",
    model: "ISC-BPR2",
    macAddress: "00:1A:2B:3C:4D:83",
    ipAddress: "10.20.1.28",
    manufacturer: "Bosch",
    createdAt: "2026-06-05T11:30:00Z"
  },
  {
    id: "demo-5",
    name: "Server room camera",
    type: "CAMERA",
    location: "Server Room",
    status: "ALERTING",
    model: "Q3538-LVE",
    macAddress: "00:1A:2B:3C:4D:94",
    ipAddress: "10.20.4.15",
    manufacturer: "Axis",
    createdAt: "2026-06-06T21:15:00Z"
  }
];

const EMPTY_FORM = {
  name: "",
  type: "CAMERA",
  location: "",
  status: "ONLINE",
  model: "",
  macAddress: "",
  ipAddress: "",
  manufacturer: ""
};

const statusLabels = {
  ONLINE: "Online",
  OFFLINE: "Offline",
  MAINTENANCE: "Maintenance",
  ALERTING: "Alerting"
};

const typeLabels = {
  CAMERA: "Camera",
  CARD_READER: "Card Reader",
  ALARM_PANEL: "Alarm Panel",
  MOTION_SENSOR: "Motion Sensor"
};

const roleLabels = {
  ADMIN: "Admin",
  OPERATOR: "Operator",
  VIEWER: "Viewer"
};

const auditActionLabels = {
  CREATE: "Created",
  UPDATE: "Updated",
  DELETE: "Deleted"
};

function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

function toTitle(value) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatTimestamp(value) {
  if (!value) return "Unknown time";
  return new Date(value).toLocaleString();
}

export default function App() {
  const [session, setSession] = useState(() => {
    const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [isRestoringSession, setIsRestoringSession] = useState(
    () => !!sessionStorage.getItem(SESSION_STORAGE_KEY)
  );
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState("devices");
  const [devices, setDevices] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [filters, setFilters] = useState({ status: "", type: "", location: "" });
  const [auditFilters, setAuditFilters] = useState({ action: "", entityType: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceForm, setDeviceForm] = useState(EMPTY_FORM);

  const authHeader = useMemo(() => {
    if (!session?.accessToken) return null;
    return `Bearer ${session.accessToken}`;
  }, [session]);

  const canModify = session?.role === "ADMIN" || session?.role === "OPERATOR";
  const canDelete = session?.role === "ADMIN";
  const isAdmin = session?.role === "ADMIN";
  const isDemo = !!session?.isDemo;

  const metrics = useMemo(() => {
    return DEVICE_STATUSES.map((status) => ({
      status,
      label: statusLabels[status],
      count: devices.filter((device) => device.status === status).length
    }));
  }, [devices]);

  async function apiRequest(path, options = {}, authOverride = authHeader) {
    const response = await fetch(apiUrl(path), {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(authOverride ? { Authorization: authOverride } : {}),
        ...(options.headers || {})
      }
    });

    if (response.status === 401) {
      throw new Error("Session expired. Please sign in again.");
    }

    if (response.status === 403) {
      throw new Error("You do not have permission to perform this action.");
    }

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Request failed with status ${response.status}.`);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  function persistSession(nextSession) {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
  }

  function logout() {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setSession(null);
    setDevices([]);
    setAuditLogs([]);
    setActiveTab("devices");
  }

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!saved) {
      setIsRestoringSession(false);
      return;
    }

    const parsed = JSON.parse(saved);

    async function restoreSession() {
      try {
        const me = await apiRequest("/api/auth/me", {}, `Bearer ${parsed.accessToken}`);
        persistSession({
          ...parsed,
          username: me.username,
          role: me.role
        });
      } catch {
        logout();
      } finally {
        setIsRestoringSession(false);
      }
    }

    restoreSession();
  }, []);

  async function loadDevices() {
    if (!session) return;

    setIsLoading(true);
    setError("");

    try {
      if (isDemo) {
        const locationFilter = filters.location.trim().toLowerCase();
        const demoData = DEMO_DEVICES.filter((device) => {
          const matchesStatus = !filters.status || device.status === filters.status;
          const matchesType = !filters.type || device.type === filters.type;
          const matchesLocation =
            !locationFilter || device.location.toLowerCase().includes(locationFilter);

          return matchesStatus && matchesType && matchesLocation;
        });

        setDevices(demoData);
        return;
      }

      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      if (filters.type) params.set("type", filters.type);
      if (filters.location.trim()) params.set("location", filters.location.trim());

      const query = params.toString();
      const data = await apiRequest(`/api/devices${query ? `?${query}` : ""}`);
      setDevices(data);
    } catch (err) {
      setError(err.message);
      if (err.message.includes("Session expired")) {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function loadAuditLogs() {
    if (!session || !isAdmin) return;

    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (auditFilters.action) params.set("action", auditFilters.action);
      if (auditFilters.entityType.trim()) params.set("entityType", auditFilters.entityType.trim());

      const query = params.toString();
      const data = await apiRequest(`/api/audit-logs${query ? `?${query}` : ""}`);
      setAuditLogs(data);
    } catch (err) {
      setError(err.message);
      if (err.message.includes("Session expired")) {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!session || isRestoringSession) return;

    if (activeTab === "devices") {
      loadDevices();
    } else if (activeTab === "audit") {
      loadAuditLogs();
    }
  }, [session, isRestoringSession, activeTab, filters.status, filters.type]);

  function startDemo() {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setLoginError("");
    setError("");
    setFilters({ status: "", type: "", location: "" });
    setAuditLogs([]);
    setActiveTab("devices");
    setSession({
      username: "demo_viewer",
      role: "VIEWER",
      isDemo: true
    });
    setDevices(DEMO_DEVICES);
  }

  async function handleLogin(event) {
    event.preventDefault();
    setIsLoggingIn(true);
    setLoginError("");

    try {
      const response = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginForm.username.trim(),
          password: loginForm.password
        })
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Invalid username or password.");
      }

      const data = await response.json();
      persistSession({
        accessToken: data.accessToken,
        expiresAt: Date.now() + data.expiresIn,
        username: data.username,
        role: data.role
      });
      setLoginForm({ username: "", password: "" });
      setActiveTab("devices");
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  }

  function openCreatePanel() {
    setEditingDevice(null);
    setSelectedDevice(null);
    setDeviceForm(EMPTY_FORM);
    setIsPanelOpen(true);
  }

  function openEditPanel(device) {
    setEditingDevice(device);
    setSelectedDevice(null);
    setDeviceForm({
      name: device.name || "",
      type: device.type || "CAMERA",
      location: device.location || "",
      status: device.status || "ONLINE",
      model: device.model || "",
      macAddress: device.macAddress || "",
      ipAddress: device.ipAddress || "",
      manufacturer: device.manufacturer || ""
    });
    setIsPanelOpen(true);
  }

  function openDeviceDetails(device) {
    if (canModify) return;
    setSelectedDevice(device);
  }

  async function saveDevice(event) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const path = editingDevice ? `/api/devices/${editingDevice.id}` : "/api/devices";
      const method = editingDevice ? "PUT" : "POST";

      await apiRequest(path, {
        method,
        body: JSON.stringify(deviceForm)
      });

      setIsPanelOpen(false);
      await loadDevices();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteDevice(device) {
    const confirmed = window.confirm(`Delete ${device.name}?`);
    if (!confirmed) return;

    setIsLoading(true);
    setError("");

    try {
      await apiRequest(`/api/devices/${device.id}`, { method: "DELETE" });
      await loadDevices();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  if (isRestoringSession) {
    return (
      <main className="login-shell">
        <section className="login-panel">
          <h1>Restoring session...</h1>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="login-shell">
        <section className="login-panel">
          <div className="login-header">
            <div className="brand-mark">
              <Shield size={24} />
            </div>
            <span>Security Operations</span>
          </div>
          <h1>Welcome back</h1>
          <p>Sign in to continue to the Physical Security Dashboard.</p>

          <form onSubmit={handleLogin} className="login-form">
            {loginError && (
              <div className="error-banner compact">
                <AlertTriangle size={18} />
                {loginError}
              </div>
            )}
            <label>
              Username
              <input
                autoFocus
                value={loginForm.username}
                onChange={(event) => setLoginForm({ ...loginForm, username: event.target.value })}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                required
              />
            </label>
            <button type="submit" className="primary-button" disabled={isLoggingIn}>
              <Shield size={18} />
              {isLoggingIn ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="login-divider">
            <span>or</span>
          </div>

          <button type="button" className="demo-button" onClick={startDemo}>
            <Activity size={18} />
            Try Read-Only Demo
          </button>
          <p className="demo-note">Explore sample devices without credentials or production data.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Security Operations</p>
          <h1>{activeTab === "devices" ? "Device Dashboard" : "Audit Log"}</h1>
        </div>
        <div className="top-actions">
          {isDemo && <span className="demo-badge">Demo Mode</span>}
          <span className="role-badge">{roleLabels[session.role] || session.role}</span>
          <button
            type="button"
            className="icon-button"
            onClick={activeTab === "devices" ? loadDevices : loadAuditLogs}
            title="Refresh current view"
          >
            <RefreshCw size={18} />
          </button>
          <button type="button" className="secondary-button" onClick={logout}>
            <LogOut size={17} />
            Sign Out
          </button>
        </div>
      </header>

      <nav className="nav-tabs" aria-label="Dashboard sections">
        <button
          type="button"
          className={`nav-tab ${activeTab === "devices" ? "active" : ""}`}
          onClick={() => setActiveTab("devices")}
        >
          <Shield size={16} />
          Devices
        </button>
        {isAdmin && (
          <button
            type="button"
            className={`nav-tab ${activeTab === "audit" ? "active" : ""}`}
            onClick={() => setActiveTab("audit")}
          >
            <ClipboardList size={16} />
            Audit Log
          </button>
        )}
      </nav>

      {isDemo && (
        <div className="demo-banner">
          <Activity size={18} />
          You are viewing read-only sample data. Sign out to return to the real login screen.
        </div>
      )}

      {error && (
        <div className="error-banner">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {activeTab === "devices" && (
        <>
          <section className="metrics-grid">
            <MetricCard icon={<Activity size={20} />} label="Total Devices" value={devices.length} />
            {metrics.map((metric) => (
              <MetricCard key={metric.status} label={metric.label} value={metric.count} status={metric.status} />
            ))}
          </section>

          <section className="toolbar">
            <div className="filters-title">
              <Filter size={18} />
              <span>Filters</span>
            </div>
            <label>
              Status
              <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
                <option value="">All statuses</option>
                {DEVICE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Type
              <select value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}>
                <option value="">All types</option>
                {DEVICE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {typeLabels[type]}
                  </option>
                ))}
              </select>
            </label>
            <label className="location-filter">
              Location Filter
              <input
                value={filters.location}
                onChange={(event) => setFilters({ ...filters, location: event.target.value })}
                onKeyDown={(event) => {
                  if (event.key === "Enter") loadDevices();
                }}
                placeholder="Search location"
              />
            </label>
            <button type="button" className="secondary-button" onClick={loadDevices}>
              <Filter size={17} />
              Apply
            </button>
            {canModify && (
              <button type="button" className="primary-button" onClick={openCreatePanel}>
                <Plus size={18} />
                Add Device
              </button>
            )}
          </section>

          <section className="table-section">
            <div className="section-heading">
              <h2>Devices</h2>
              <span>{isLoading ? "Loading..." : `${devices.length} shown`}</span>
            </div>

            <div className="device-table-wrap">
              <table className="device-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Location</th>
                    <th>Network</th>
                    <th>Manufacturer</th>
                    {canModify && <th aria-label="Actions" />}
                  </tr>
                </thead>
                <tbody>
                  {devices.map((device) => (
                    <tr
                      key={device.id}
                      className={!canModify ? "clickable-row" : ""}
                      onClick={() => openDeviceDetails(device)}
                    >
                      <td>
                        <div className="name-cell">
                          {typeIcon(device.type)}
                          <div>
                            <strong>{device.name}</strong>
                            <span>{device.model || "No model recorded"}</span>
                          </div>
                        </div>
                      </td>
                      <td>{typeLabels[device.type] || toTitle(device.type)}</td>
                      <td>
                        <span className={`status-pill ${device.status.toLowerCase()}`}>{statusLabels[device.status]}</span>
                      </td>
                      <td>{device.location}</td>
                      <td>
                        <div className="stacked">
                          <span>{device.ipAddress || "No IP"}</span>
                          <small>{device.macAddress || "No MAC"}</small>
                        </div>
                      </td>
                      <td>{device.manufacturer || "Not recorded"}</td>
                      {canModify && (
                        <td>
                          <div className="row-actions">
                            <button type="button" className="icon-button" title="Edit device" onClick={() => openEditPanel(device)}>
                              <Edit3 size={16} />
                            </button>
                            {canDelete && (
                              <button type="button" className="icon-button danger" title="Delete device" onClick={() => deleteDevice(device)}>
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {!devices.length && !isLoading && (
                    <tr>
                      <td colSpan={canModify ? 7 : 6} className="empty-state">
                        No devices match the current view.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {activeTab === "audit" && isAdmin && (
        <>
          <section className="toolbar">
            <div className="filters-title">
              <Filter size={18} />
              <span>Audit Filters</span>
            </div>
            <label>
              Action
              <select
                value={auditFilters.action}
                onChange={(event) => setAuditFilters({ ...auditFilters, action: event.target.value })}
              >
                <option value="">All actions</option>
                <option value="CREATE">Created</option>
                <option value="UPDATE">Updated</option>
                <option value="DELETE">Deleted</option>
              </select>
            </label>
            <label>
              Entity Type
              <input
                value={auditFilters.entityType}
                onChange={(event) => setAuditFilters({ ...auditFilters, entityType: event.target.value })}
                placeholder="DEVICE"
              />
            </label>
            <button type="button" className="secondary-button" onClick={loadAuditLogs}>
              <Filter size={17} />
              Apply
            </button>
          </section>

          <section className="table-section">
            <div className="section-heading">
              <h2>Recent Activity</h2>
              <span>{isLoading ? "Loading..." : `${auditLogs.length} entries`}</span>
            </div>

            <div className="device-table-wrap">
              <table className="device-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((entry) => (
                    <tr key={entry.id}>
                      <td>{formatTimestamp(entry.occurredAt)}</td>
                      <td>{entry.username}</td>
                      <td>{auditActionLabels[entry.action] || entry.action}</td>
                      <td>
                        {entry.entityType}
                        {entry.entityId ? ` #${entry.entityId}` : ""}
                      </td>
                      <td>{entry.details || "—"}</td>
                    </tr>
                  ))}
                  {!auditLogs.length && !isLoading && (
                    <tr>
                      <td colSpan="5" className="empty-state">
                        No audit entries match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {isPanelOpen && canModify && (
        <div className="drawer-backdrop" role="presentation">
          <aside className="drawer" aria-label={editingDevice ? "Edit device" : "Create device"}>
            <div className="drawer-header">
              <div>
                <p className="eyebrow">{editingDevice ? "Update Asset" : "New Asset"}</p>
                <h2>{editingDevice ? "Edit Device" : "Add Device"}</h2>
              </div>
              <button type="button" className="icon-button" onClick={() => setIsPanelOpen(false)} title="Close panel">
                <X size={18} />
              </button>
            </div>

            <form className="device-form" onSubmit={saveDevice}>
              <label>
                Name
                <input
                  value={deviceForm.name}
                  onChange={(event) => setDeviceForm({ ...deviceForm, name: event.target.value })}
                  required
                />
              </label>
              <div className="form-row">
                <label>
                  Type
                  <select value={deviceForm.type} onChange={(event) => setDeviceForm({ ...deviceForm, type: event.target.value })}>
                    {DEVICE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {typeLabels[type]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Status
                  <select value={deviceForm.status} onChange={(event) => setDeviceForm({ ...deviceForm, status: event.target.value })}>
                    {DEVICE_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Location
                <input
                  value={deviceForm.location}
                  onChange={(event) => setDeviceForm({ ...deviceForm, location: event.target.value })}
                  required
                />
              </label>
              <label>
                Model
                <input value={deviceForm.model} onChange={(event) => setDeviceForm({ ...deviceForm, model: event.target.value })} />
              </label>
              <label>
                Manufacturer
                <input
                  value={deviceForm.manufacturer}
                  onChange={(event) => setDeviceForm({ ...deviceForm, manufacturer: event.target.value })}
                />
              </label>
              <div className="form-row">
                <label>
                  IP Address
                  <input
                    value={deviceForm.ipAddress}
                    onChange={(event) => setDeviceForm({ ...deviceForm, ipAddress: event.target.value })}
                  />
                </label>
                <label>
                  MAC Address
                  <input
                    value={deviceForm.macAddress}
                    onChange={(event) => setDeviceForm({ ...deviceForm, macAddress: event.target.value })}
                  />
                </label>
              </div>
              <div className="drawer-actions">
                <button type="button" className="secondary-button" onClick={() => setIsPanelOpen(false)}>
                  <X size={17} />
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={isLoading}>
                  <Save size={17} />
                  {editingDevice ? "Save Changes" : "Create Device"}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}

      {selectedDevice && !canModify && (
        <div className="drawer-backdrop" role="presentation">
          <aside className="drawer" aria-label="Device details">
            <div className="drawer-header">
              <div>
                <p className="eyebrow">Device Details</p>
                <h2>{selectedDevice.name}</h2>
              </div>
              <button type="button" className="icon-button" onClick={() => setSelectedDevice(null)} title="Close details">
                <X size={18} />
              </button>
            </div>

            <div className="details-grid">
              <DetailItem label="Type" value={typeLabels[selectedDevice.type] || toTitle(selectedDevice.type)} />
              <DetailItem
                label="Status"
                value={statusLabels[selectedDevice.status] || toTitle(selectedDevice.status)}
              />
              <DetailItem label="Location" value={selectedDevice.location} />
              <DetailItem label="Model" value={selectedDevice.model || "Not recorded"} />
              <DetailItem label="Manufacturer" value={selectedDevice.manufacturer || "Not recorded"} />
              <DetailItem label="IP Address" value={selectedDevice.ipAddress || "Not recorded"} />
              <DetailItem label="MAC Address" value={selectedDevice.macAddress || "Not recorded"} />
              <DetailItem label="Created" value={formatTimestamp(selectedDevice.createdAt)} />
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MetricCard({ icon, label, value, status }) {
  return (
    <article className="metric-card">
      <div className={`metric-icon ${status ? status.toLowerCase() : ""}`}>
        {icon || <CheckCircle2 size={20} />}
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function typeIcon(type) {
  const icons = {
    CAMERA: <Camera size={18} />,
    CARD_READER: <CreditCard size={18} />,
    ALARM_PANEL: <Shield size={18} />,
    MOTION_SENSOR: <Radar size={18} />
  };
  const typeClass = type ? type.toLowerCase().replaceAll("_", "-") : "";
  return <span className={`type-icon ${typeClass}`}>{icons[type] || <Shield size={18} />}</span>;
}
