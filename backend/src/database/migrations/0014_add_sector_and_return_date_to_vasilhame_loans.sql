DO $$
DECLARE
    tabela RECORD;
BEGIN
    -- Busca todas as tabelas que têm a coluna 'active' usando os IDs internos (seguro para Case-Sensitive)
    FOR tabela IN 
        SELECT n.nspname AS schemaname, c.relname AS tablename
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_attribute a ON a.attrelid = c.oid
        WHERE n.nspname = 'public' 
          AND c.relkind = 'r' -- r = relation (Apenas tabelas)
          AND a.attname = 'active' -- ATENÇÃO: Se o nome da COLUNA também tiver letra maiúscula (ex: "Active"), mude aqui
          AND a.attisdropped = false
    LOOP
        -- Cria a trigger dinamicamente. O %I força o PostgreSQL a colocar aspas duplas em "cashAccounts"
        EXECUTE format('
            DROP TRIGGER IF EXISTS trg_valida_exclusao_logica ON %I.%I;
            CREATE TRIGGER trg_valida_exclusao_logica
            BEFORE UPDATE ON %I.%I
            FOR EACH ROW
            EXECUTE FUNCTION fn_valida_exclusao_logica();', 
        tabela.schemaname, tabela.tablename, tabela.schemaname, tabela.tablename);
        
        RAISE NOTICE 'Trigger criada na tabela: %."%"', tabela.schemaname, tabela.tablename;
    END LOOP;
END;