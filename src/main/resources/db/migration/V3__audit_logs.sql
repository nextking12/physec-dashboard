CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(64) NOT NULL,
    action VARCHAR(32) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id BIGINT,
    details TEXT,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_occurred_at ON audit_logs (occurred_at DESC);
