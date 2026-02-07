CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'MANAGER')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  face_template BYTEA,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_inward (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_name VARCHAR(150) NOT NULL,
  item_category VARCHAR(30) NOT NULL CHECK (item_category IN ('raw', 'finished', 'job_work')),
  quantity NUMERIC(12,2) NOT NULL CHECK (quantity >= 0),
  unit VARCHAR(20) NOT NULL CHECK (unit IN ('pieces', 'sqft', 'kg')),
  party_name VARCHAR(150) NOT NULL,
  entry_date TIMESTAMP NOT NULL DEFAULT now(),
  due_date DATE,
  storage_location VARCHAR(80),
  coating_type VARCHAR(60),
  remarks TEXT,
  image_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  uploaded_by UUID REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'RETURNED')),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_outward (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inward_id UUID NOT NULL REFERENCES stock_inward(id) ON DELETE RESTRICT,
  quantity_dispatched NUMERIC(12,2) NOT NULL CHECK (quantity_dispatched > 0),
  party_name VARCHAR(150) NOT NULL,
  dispatch_date TIMESTAMP NOT NULL DEFAULT now(),
  delivery_status VARCHAR(30) NOT NULL DEFAULT 'IN_TRANSIT',
  photos_before_dispatch JSONB NOT NULL DEFAULT '[]'::jsonb,
  remarks TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(80) NOT NULL,
  entity_type VARCHAR(60) NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_inward_party ON stock_inward(party_name);
CREATE INDEX IF NOT EXISTS idx_stock_inward_product ON stock_inward(product_name);
CREATE INDEX IF NOT EXISTS idx_stock_inward_due_date ON stock_inward(due_date);
CREATE INDEX IF NOT EXISTS idx_stock_outward_inward_id ON stock_outward(inward_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
