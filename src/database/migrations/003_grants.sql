-- Garante permissões básicas para o usuário do banco em todas as tabelas e sequências
-- Execute este script como o dono do banco ou superuser

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gdsystem_hom;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO gdsystem_hom;
GRANT ALL PRIVILEGES ON SCHEMA public TO gdsystem_hom;

-- Se o erro persistir em tabelas específicas criadas via RLS, forçamos o grant individual
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE users TO gdsystem_hom;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE people TO gdsystem_hom;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE products TO gdsystem_hom;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE companies TO gdsystem_hom;
