export function filterDevices(devices, filters) {
  const locationFilter = (filters.location || "").trim().toLowerCase();

  return devices.filter((device) => {
    const matchesStatus = !filters.status || device.status === filters.status;
    const matchesType = !filters.type || device.type === filters.type;
    const matchesLocation =
      !locationFilter || device.location.toLowerCase().includes(locationFilter);

    return matchesStatus && matchesType && matchesLocation;
  });
}

export function filterAuditLogs(auditLogs, filters) {
  const entityTypeFilter = (filters.entityType || "").trim().toLowerCase();

  return auditLogs.filter((entry) => {
    const matchesAction = !filters.action || entry.action === filters.action;
    const matchesEntityType =
      !entityTypeFilter || entry.entityType.toLowerCase().includes(entityTypeFilter);

    return matchesAction && matchesEntityType;
  });
}
