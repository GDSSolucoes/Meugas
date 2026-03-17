-- Parameter used for RLS scoping
-- We'll rely on SET LOCAL app.current_company_id = '<uuid>' inside transactions

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Force RLS
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE people FORCE ROW LEVEL SECURITY;
ALTER TABLE products FORCE ROW LEVEL SECURITY;
ALTER TABLE companies FORCE ROW LEVEL SECURITY;

-- Policies: users
DROP POLICY IF EXISTS users_insert ON users;
DROP POLICY IF EXISTS users_select ON users;
DROP POLICY IF EXISTS users_modify ON users;
DROP POLICY IF EXISTS users_delete ON users;
CREATE POLICY users_insert ON users
  FOR INSERT
  WITH CHECK (company_id = current_setting('app.current_company_id', true)::integer);
CREATE POLICY users_select ON users
  FOR SELECT
  USING (
    company_id = current_setting('app.current_company_id', true)::integer
    OR 
    current_setting('app.current_company_id', true) = ''
  );
CREATE POLICY users_modify ON users
  FOR UPDATE
  USING (company_id = current_setting('app.current_company_id', true)::integer);
CREATE POLICY users_delete ON users
  FOR DELETE
  USING (company_id = current_setting('app.current_company_id', true)::integer);

-- Policies: people
DROP POLICY IF EXISTS people_insert ON people;
DROP POLICY IF EXISTS people_select ON people;
DROP POLICY IF EXISTS people_modify ON people;
DROP POLICY IF EXISTS people_delete ON people;
CREATE POLICY people_insert ON people
  FOR INSERT
  WITH CHECK (company_id = current_setting('app.current_company_id', true)::integer);
CREATE POLICY people_select ON people
  FOR SELECT
  USING (company_id = current_setting('app.current_company_id', true)::integer);
CREATE POLICY people_modify ON people
  FOR UPDATE
  USING (company_id = current_setting('app.current_company_id', true)::integer);
CREATE POLICY people_delete ON people
  FOR DELETE
  USING (company_id = current_setting('app.current_company_id', true)::integer);

-- Policies: products
DROP POLICY IF EXISTS products_insert ON products;
DROP POLICY IF EXISTS products_select ON products;
DROP POLICY IF EXISTS products_modify ON products;
DROP POLICY IF EXISTS products_delete ON products;
CREATE POLICY products_insert ON products
  FOR INSERT
  WITH CHECK (company_id = current_setting('app.current_company_id', true)::integer);
CREATE POLICY products_select ON products
  FOR SELECT
  USING (company_id = current_setting('app.current_company_id', true)::integer);
CREATE POLICY products_modify ON products
  FOR UPDATE
  USING (company_id = current_setting('app.current_company_id', true)::integer);
CREATE POLICY products_delete ON products
  FOR DELETE
  USING (company_id = current_setting('app.current_company_id', true)::integer);

-- Policies: companies
DROP POLICY IF EXISTS companies_insert ON companies;
DROP POLICY IF EXISTS companies_select ON companies;
DROP POLICY IF EXISTS companies_modify ON companies;
DROP POLICY IF EXISTS companies_delete ON companies;
-- Allow inserting companies irrespective of current_company_id (administrative)
CREATE POLICY companies_insert ON companies
  FOR INSERT
  WITH CHECK (true);
CREATE POLICY companies_select ON companies
  FOR SELECT
  USING (id = current_setting('app.current_company_id', true)::integer);
CREATE POLICY companies_modify ON companies
  FOR UPDATE
  USING (id = current_setting('app.current_company_id', true)::integer);
CREATE POLICY companies_delete ON companies
  FOR DELETE
  USING (id = current_setting('app.current_company_id', true)::integer);
