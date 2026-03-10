CREATE DATABASE whatsapp_automation;

-- =========================
-- EXTENSIONES
-- =========================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- TIPOS ENUM
-- =========================
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'agent');
CREATE TYPE business_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE whatsapp_session_status AS ENUM ('pending', 'connected', 'disconnected', 'expired');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE message_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE message_type AS ENUM ('text', 'image', 'document', 'audio', 'video', 'location', 'interactive');
CREATE TYPE flow_node_type AS ENUM ('welcome', 'menu', 'text_response', 'products', 'appointments', 'support', 'registration', 'fallback');
CREATE TYPE customer_status AS ENUM ('lead', 'active', 'blocked');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'cancelled', 'expired');

-- =========================
-- TABLA DE NEGOCIOS
-- =========================
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    description TEXT,
    phone VARCHAR(20),
    email VARCHAR(120),
    address TEXT,
    industry VARCHAR(80),
    timezone VARCHAR(50) DEFAULT 'America/Guayaquil',
    status business_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- USUARIOS DEL PANEL
-- =========================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'agent',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- CONFIGURACIÓN DEL NEGOCIO
-- =========================
CREATE TABLE business_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
    welcome_message TEXT,
    fallback_message TEXT,
    support_message TEXT,
    ask_for_name BOOLEAN NOT NULL DEFAULT TRUE,
    ask_for_email BOOLEAN NOT NULL DEFAULT FALSE,
    ask_for_registration BOOLEAN NOT NULL DEFAULT FALSE,
    appointments_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    products_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    support_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- SESIONES / VINCULACIÓN DE WHATSAPP
-- =========================
CREATE TABLE whatsapp_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
    session_key VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(20),
    qr_code TEXT,
    status whatsapp_session_status NOT NULL DEFAULT 'pending',
    connected_at TIMESTAMP,
    last_seen_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- CLIENTES DEL NEGOCIO
-- =========================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(120),
    status customer_status NOT NULL DEFAULT 'lead',
    source VARCHAR(50) DEFAULT 'whatsapp',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_customer_phone_per_business UNIQUE (business_id, phone),
    CONSTRAINT uq_customer_email_per_business UNIQUE (business_id, email)
);

-- =========================
-- PRODUCTOS / SERVICIOS
-- =========================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    price NUMERIC(10,2),
    currency VARCHAR(10) DEFAULT 'USD',
    stock INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- CITAS / RESERVAS
-- =========================
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    description TEXT,
    status appointment_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- MENSAJES DE WHATSAPP
-- =========================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    whatsapp_session_id UUID REFERENCES whatsapp_sessions(id) ON DELETE SET NULL,
    direction message_direction NOT NULL,
    message_type message_type NOT NULL DEFAULT 'text',
    content TEXT,
    media_url TEXT,
    external_message_id VARCHAR(255),
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- FLUJOS AUTOMÁTICOS
-- =========================
CREATE TABLE flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    trigger_keyword VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE flow_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
    node_type flow_node_type NOT NULL,
    title VARCHAR(120) NOT NULL,
    content TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE flow_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_node_id UUID NOT NULL REFERENCES flow_nodes(id) ON DELETE CASCADE,
    option_label VARCHAR(120) NOT NULL,
    option_value VARCHAR(120) NOT NULL,
    next_node_id UUID NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE flow_options
ADD CONSTRAINT fk_flow_options_next_node
FOREIGN KEY (next_node_id) REFERENCES flow_nodes(id) ON DELETE SET NULL;

-- =========================
-- NOTAS INTERNAS
-- =========================
CREATE TABLE customer_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- PAGOS (OPCIONAL)
-- =========================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    amount NUMERIC(10,2) NOT NULL,
    due_date DATE,
    status payment_status NOT NULL DEFAULT 'pending',
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- ÍNDICES
-- =========================
CREATE INDEX idx_users_business_id ON users(business_id);
CREATE INDEX idx_customers_business_id ON customers(business_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_appointments_business_date ON appointments(business_id, appointment_date);
CREATE INDEX idx_messages_business_id ON messages(business_id);
CREATE INDEX idx_messages_customer_id ON messages(customer_id);
CREATE INDEX idx_flow_business_id ON flows(business_id);
CREATE INDEX idx_products_business_id ON products(business_id);
CREATE INDEX idx_payments_business_id ON payments(business_id);
CREATE INDEX idx_whatsapp_sessions_business_id ON whatsapp_sessions(business_id);