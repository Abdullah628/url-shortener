
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    url_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for email lookups during authentication
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- PRE-GENERATED SHORT CODE POOL
-- ============================================
CREATE TABLE IF NOT EXISTS short_code_pool (
    id SERIAL PRIMARY KEY,
    short_code VARCHAR(7) NOT NULL UNIQUE,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast unused key lookups
CREATE INDEX IF NOT EXISTS idx_short_code_pool_unused 
    ON short_code_pool(is_used) WHERE is_used = FALSE;
CREATE INDEX IF NOT EXISTS idx_short_code_pool_code 
    ON short_code_pool(short_code);

-- ============================================
-- URLS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS urls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    short_code VARCHAR(7) NOT NULL UNIQUE,
    original_url TEXT NOT NULL,
    click_count BIGINT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Critical index for redirection (O(1) lookup)
CREATE INDEX IF NOT EXISTS idx_urls_short_code ON urls(short_code);
-- Index for user's URLs listing with pagination
CREATE INDEX IF NOT EXISTS idx_urls_user_id_created ON urls(user_id, created_at DESC);
-- Index for active URLs check
CREATE INDEX IF NOT EXISTS idx_urls_active ON urls(is_active) WHERE is_active = TRUE;

-- ============================================
-- CLICK EVENTS TABLE (For Analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS click_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url_id UUID NOT NULL REFERENCES urls(id) ON DELETE CASCADE,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent VARCHAR(512),
    referer VARCHAR(2048),
    country_code VARCHAR(2),
    device_type VARCHAR(20)
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_click_events_url_id ON click_events(url_id);
CREATE INDEX IF NOT EXISTS idx_click_events_clicked_at ON click_events(clicked_at);

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist and recreate
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_urls_updated_at ON urls;
CREATE TRIGGER update_urls_updated_at 
    BEFORE UPDATE ON urls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION:  Get and Reserve Short Code (Atomic)
-- ============================================
CREATE OR REPLACE FUNCTION get_available_short_code()
RETURNS VARCHAR(7) AS $$
DECLARE
    code VARCHAR(7);
BEGIN
    UPDATE short_code_pool
    SET is_used = TRUE, used_at = CURRENT_TIMESTAMP
    WHERE id = (
        SELECT id FROM short_code_pool
        WHERE is_used = FALSE
        ORDER BY id
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    )
    RETURNING short_code INTO code;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Release Short Code (for recycling)
-- ============================================
CREATE OR REPLACE FUNCTION release_short_code(code_to_release VARCHAR(7))
RETURNS VOID AS $$
BEGIN
    UPDATE short_code_pool
    SET is_used = FALSE, used_at = NULL
    WHERE short_code = code_to_release;
END;
$$ LANGUAGE plpgsql;