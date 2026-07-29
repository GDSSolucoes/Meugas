CREATE OR REPLACE FUNCTION fn_valida_exclusao_logica()
RETURNS TRIGGER AS $$
DECLARE
    fk_record RECORD;
    has_children BOOLEAN;
    pk_value TEXT;
BEGIN
    IF OLD.active = true AND NEW.active = false THEN
        
        FOR fk_record IN 
            SELECT 
                c.conname AS fk_name,
                cl.relname AS child_table,    -- Nome puro da tabela
                ns.nspname AS child_schema,   -- Nome puro do schema (ex: public)
                a.attname AS child_col,
                af.attname AS parent_col
            FROM pg_constraint c
            JOIN pg_class cl ON cl.oid = c.conrelid
            JOIN pg_namespace ns ON ns.oid = cl.relnamespace
            JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
            JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
            WHERE c.confrelid = TG_RELID AND c.contype = 'f'
        LOOP
            pk_value := (row_to_json(OLD)->>fk_record.parent_col);

            -- Agora usamos %I.%I passando o schema e a tabela separados. 
            -- O format vai gerar algo seguro como: "public"."vasilhameLoans"
            EXECUTE format(
                'SELECT EXISTS(SELECT 1 FROM %I.%I WHERE %I = %L)', 
                fk_record.child_schema, fk_record.child_table, fk_record.child_col, pk_value
            ) INTO has_children;

            IF has_children THEN
                RAISE EXCEPTION 'Exclusão bloqueada: O registro possui vínculos com "%"', 
                    fk_record.child_table;
            END IF;
            
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;