-- BerciiMart V1
-- Initial migration marker for the existing database.
-- Existing tables are preserved because this database already contains data.

CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(50) PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);