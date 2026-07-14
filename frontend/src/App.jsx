import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ClipboardList,
  Edit3,
  Filter,
  LogOut,
  Plus,
  RefreshCw,
  Save,
  Shield,
  Trash2,
  X
} from "lucide-react";
import { Analytics } from "@vercel/analytics/react";

import {
  DEVICE_TYPES,
  DEVICE_STATUSES,
  EMPTY_FORM,
  statusLabels,
  typeLabels,
  roleLabels,
  auditActionLabels,
  API_BASE_URL,
  SESSION_STORAGE_KEY
} from "./data/constants";
import { DEMO_DEVICES } from "./data/demoDevices";
import { DEMO_AUDIT_LOGS } from "./data/demoAuditLogs";
import { apiUrl } from "./utils/api";
import { filterDevices, filterAuditLogs } from "./utils/filters";
import { toTitle, formatTimestamp } from "./utils/format";
import MetricCard from "./components/MetricCard";
import DetailItem from "./components/DetailItem";
import TypeIcon from "./components/TypeIcon";

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

  const isDemo = !!session?.isDemo;
  const canModify = !isDemo && (session?.role === "ADMIN" || session?.role === "OPERATOR");
  const canDelete = !isDemo && session?.role === "ADMIN";
  const isAdmin = session?.role === "ADMIN" || isDemo;

  const metricBaseDevices = useMemo(() => {
    const source = isDemo ? DEMO_DEVICES : devices;
    return filterDevices(source, { ...filters, status: "" });
  }, [isDemo, devices, filters]);

  const metrics = useMemo(() => {
    return DEVICE_STATUSES.map((status) => ({
      status,
      label: statusLabels[status],
      count: metricBaseDevices.filter((device) => device.status === status).length
    }));
  }, [metricBaseDevices]);

  function handleMetricClick(status) {
    setFilters((current) => ({
      ...current,
      status: current.status === status ? "" : status
    }));
  }

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
      if (parsed.isDemo) {
        persistSession({
          username: parsed.username || "demo_admin",
          role: parsed.role || "ADMIN",
          isDemo: true
        });
        setAuditLogs(DEMO_AUDIT_LOGS);
        setIsRestoringSession(false);
        return;
      }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadDevices() {
    if (!session) return;

    setIsLoading(true);
    setError("");

    try {
      if (isDemo) {
        setDevices(filterDevices(DEMO_DEVICES, filters));
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
      if (isDemo) {
        setAuditLogs(filterAuditLogs(DEMO_AUDIT_LOGS, auditFilters));
        return;
      }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, isRestoringSession, activeTab, filters.status, filters.type, filters.location]);

  function startDemo() {
    setLoginError("");
    setError("");
    setFilters({ status: "", type: "", location: "" });
    setAuditFilters({ action: "", entityType: "" });
    setAuditLogs(DEMO_AUDIT_LOGS);
    setActiveTab("devices");
    persistSession({
      username: "demo_admin",
      role: "ADMIN",
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
        <section className="login-frame restoring">
          <h1>RESTORING SESSION</h1>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="login-shell">
        <section className="login-frame">
          <header className="login-nav">
            <div className="login-brand">
              <span className="brand-mark">
                <Shield size={18} />
              </span>
              <span>PHYSEC.DASH</span>
            </div>
            <button type="button" className="login-demo-link" onClick={startDemo}>
              DEMO
            </button>
          </header>

          <div className="login-hero">
            <h1>PhySec.Dash</h1>
            <p className="login-copy">
              A portfolio dashboard for physical security devices, role-based access, and operational audit review.
            </p>
          </div>

          <div className="access-grid">
            <div className="access-node" aria-hidden="true">
              <span>VIEW</span>
              <span>FILTER</span>
              <span>RESPOND</span>
            </div>

            <section className="login-panel" aria-label="Dashboard access">
              <div className="login-header">
                <div>
                  <p className="panel-kicker">ACCESS NODE</p>
                  <h2>Sign In</h2>
                </div>
              </div>

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
                <span>OR</span>
              </div>

              <button type="button" className="demo-button" onClick={startDemo}>
                <Activity size={18} />
                Try Interactive Demo
              </button>
              <p className="demo-note">Sample devices and audit logs. No credentials required.</p>
            </section>

            <div className="access-node right" aria-hidden="true">
              <span>AUTH</span>
              <span>TRACE</span>
              <span>REPORT</span>
            </div>
          </div>
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
          <span className="role-badge">{isDemo ? "Demo Admin" : roleLabels[session.role] || session.role}</span>
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
          You are viewing read-only sample data, including demo audit logs. Sign out to return to the real login screen.
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
            <MetricCard
              icon={<Activity size={20} />}
              label="Total Devices"
              value={metricBaseDevices.length}
              active={!filters.status}
              onClick={() => handleMetricClick("")}
              title="Show all devices"
            />
            {metrics.map((metric) => (
              <MetricCard
                key={metric.status}
                label={metric.label}
                value={metric.count}
                status={metric.status}
                active={filters.status === metric.status}
                onClick={() => handleMetricClick(metric.status)}
                title={`Filter by ${metric.label}`}
              />
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
                          <TypeIcon type={device.type} />
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
                      <td className="mono-data">{formatTimestamp(entry.occurredAt)}</td>
                      <td>{entry.username}</td>
                      <td>{auditActionLabels[entry.action] || entry.action}</td>
                      <td className="mono-data">
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
      <Analytics />
    </main>
  );
}
