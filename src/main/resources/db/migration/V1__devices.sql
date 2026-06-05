CREATE TABLE devices (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL,
    location VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    model VARCHAR(255),
    mac_address VARCHAR(255),
    ip_address VARCHAR(255),
    manufacturer VARCHAR(255)
);
