import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Camera,
  CheckCircle2,
  DoorOpen,
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

function encodeBasicAuth(username, password) {
  return btoa(`${username}:${password}`);
}

function toTitle(value) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function App() {
  const [credentials, setCredentials] = useState(() => {
    const saved = sessionStorage.getItem("psd.credentials");
    return saved ? JSON.parse(saved) : null;
  });
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [devices, setDevices] = useState([]);
  const [filters, setFilters] = useState({ status: "", type: "", location: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [deviceForm, setDeviceForm] = useState(EMPTY_FORM);

  const authHeader = useMemo(() => {
    if (!credentials) return null;
    return `Basic ${encodeBasicAuth(credentials.username, credentials.password)}`;
  }, [credentials]);

  const metrics = useMemo(() => {
    return DEVICE_STATUSES.map((status) => ({
      status,
      label: statusLabels[status],
      count: devices.filter((device) => device.status === status).length
    }));
  }, [devices]);

  async function apiRequest(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
        ...(options.headers || {})
      }
    });

    if (response.status === 401) {
      throw new Error("Invalid username or password.");
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

  async function loadDevices() {
    if (!credentials) return;

    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      if (filters.type) params.set("type", filters.type);
      if (filters.location.trim()) params.set("location", filters.location.trim());

      const query = params.toString();
      const data = await apiRequest(`/api/devices${query ? `?${query}` : ""}`);
      setDevices(data);
    } catch (err) {
      setError(err.message);
      if (err.message.includes("Invalid")) {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDevices();
  }, [credentials, filters.status, filters.type]);

  function handleLogin(event) {
    event.preventDefault();
    const nextCredentials = {
      username: loginForm.username.trim(),
      password: loginForm.password
    };
    sessionStorage.setItem("psd.credentials", JSON.stringify(nextCredentials));
    setCredentials(nextCredentials);
    setLoginForm({ username: "", password: "" });
  }

  function logout() {
    sessionStorage.removeItem("psd.credentials");
    setCredentials(null);
    setDevices([]);
  }

  function openCreatePanel() {
    setEditingDevice(null);
    setDeviceForm(EMPTY_FORM);
    setIsPanelOpen(true);
  }

  function openEditPanel(device) {
    setEditingDevice(device);
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

  if (!credentials) {
    return (
      <main className="login-shell">
        <section className="login-panel">
          <div className="brand-mark">
            <Shield size={30} />
          </div>
          <h1>Physical Security Dashboard</h1>
          <p>Sign in with the Basic Auth credentials from your local backend environment.</p>

          <form onSubmit={handleLogin} className="login-form">
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
            <button type="submit" className="primary-button">
              <Shield size={18} />
              Sign In
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Security Operations</p>
          <h1>Device Dashboard</h1>
        </div>
        <div className="top-actions">
          <button type="button" className="icon-button" onClick={loadDevices} title="Refresh devices">
            <RefreshCw size={18} />
          </button>
          <button type="button" className="secondary-button" onClick={logout}>
            <LogOut size={17} />
            Sign Out
          </button>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

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
        <button type="button" className="primary-button" onClick={openCreatePanel}>
          <Plus size={18} />
          Add Device
        </button>
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
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device.id}>
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
                  <td>
                    <div className="row-actions">
                      <button type="button" className="icon-button" title="Edit device" onClick={() => openEditPanel(device)}>
                        <Edit3 size={16} />
                      </button>
                      <button type="button" className="icon-button danger" title="Delete device" onClick={() => deleteDevice(device)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!devices.length && !isLoading && (
                <tr>
                  <td colSpan="7" className="empty-state">
                    No devices match the current view.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isPanelOpen && (
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
    </main>
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
    CARD_READER: <DoorOpen size={18} />,
    ALARM_PANEL: <Shield size={18} />,
    MOTION_SENSOR: <Radar size={18} />
  };
  return <span className="type-icon">{icons[type] || <Shield size={18} />}</span>;
}
