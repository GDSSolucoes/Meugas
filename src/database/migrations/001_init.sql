-- Enable required extension for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Companies
CREATE TABLE IF NOT EXISTS companies (
  id serial PRIMARY KEY,
  name text NOT NULL,
  cnpj text,
  state text,
  city text,
  street text,
  number text,
  neighborhood text,
  created_at timestamptz DEFAULT now()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  cpf text,
  name text NOT NULL,
  password_hash text NOT NULL,
  company_id integer NOT NULL,
  role text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- People
CREATE TABLE IF NOT EXISTS people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id integer NOT NULL,
  name text NOT NULL,
  document text,
  street text,
  number text,
  neighborhood text,
  city text,
  state text,
  zipcode text,
  phone text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_people_company_id ON people(company_id);
CREATE INDEX IF NOT EXISTS idx_people_name ON people(name);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id integer NOT NULL,
  name text NOT NULL,
  code text,
  category text,
  unit_price numeric,
  cost_price numeric,
  min_stock integer,
  vasilhame_id text,
  vasilhame_name text,
  ncm text,
  cest text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_company_id ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
