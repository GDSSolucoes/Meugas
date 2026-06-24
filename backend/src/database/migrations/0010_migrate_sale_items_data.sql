-- Script de Migração de Dados de sales.items (JSON) para saleItems com Tratamento de Erros
-- Execute este script após rodar a migração 0009_dashing_morg.sql

-- 1. Criar tabela temporária para armazenar erros
CREATE TEMPORARY TABLE IF NOT EXISTS temp_migration_errors (
  sale_id uuid,
  error_message text,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Função PL/pgSQL para migrar cada venda (apenas as que não tem items em saleItems) e capturar erros
CREATE OR REPLACE FUNCTION migrate_sale_items()
RETURNS void AS $$
DECLARE
  v_sale record;
  v_item jsonb;
  v_error text;
BEGIN
  -- Iterar apenas sobre vendas que ainda não tem itens na tabela saleItems
  FOR v_sale IN 
    SELECT s.id, s.company_id, s.company_name, s.items
    FROM sales s
    LEFT JOIN "saleItems" si ON s.id = si.sale_id
    WHERE si.sale_id IS NULL
  LOOP
    BEGIN
      -- Verificar se items existe e é um array
      IF v_sale.items IS NOT NULL AND jsonb_typeof(v_sale.items::jsonb) = 'array' THEN
        -- Inserir cada item da venda
        FOR v_item IN SELECT jsonb_array_elements(v_sale.items::jsonb) LOOP
          INSERT INTO "saleItems" (
            id,
            sale_id,
            product_id,
            product_code,
            product_name,
            category,
            vasilhame_id,
            vasilhame_name,
            quantity,
            unit_price,
            discount,
            total,
            quantity_to_pickup,
            vasilhame_loan_quantity,
            company_id,
            company_name,
            created_at
          ) VALUES (
            gen_random_uuid(),
            v_sale.id,
            (v_item->>'productId')::uuid,
            v_item->>'productCode',
            v_item->>'productName',
            v_item->>'category',
            (v_item->>'vasilhameId')::uuid,
            v_item->>'vasilhameName',
            (v_item->>'quantity')::numeric,
            (v_item->>'unitPrice')::numeric,
            (v_item->>'discount')::numeric,
            (v_item->>'total')::numeric,
            (v_item->>'quantityToPickup')::numeric,
            (v_item->>'vasilhameLoanQuantity')::numeric,
            v_sale.company_id,
            v_sale.company_name,
            now()
          );
        END LOOP;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        v_error := SQLERRM;
        INSERT INTO temp_migration_errors (sale_id, error_message)
        VALUES (v_sale.id, v_error);
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. Executar a migração
SELECT migrate_sale_items();

-- 4. Verificar contagem de itens migrados e erros
WITH 
  count_sales_items AS (
    SELECT 
      COALESCE(SUM(
        CASE 
          WHEN items IS NOT NULL AND jsonb_typeof(items::jsonb) = 'array' THEN jsonb_array_length(items::jsonb)
          ELSE 0
        END
      ), 0) AS total
    FROM sales s
    LEFT JOIN "saleItems" si ON s.id = si.sale_id
    WHERE si.sale_id IS NULL
  ),
  count_sale_items AS (
    SELECT COUNT(*) AS total FROM "saleItems"
  ),
  count_remaining_sales AS (
    SELECT COUNT(*) AS total FROM sales s
    LEFT JOIN "saleItems" si ON s.id = si.sale_id
    WHERE si.sale_id IS NULL
  )
SELECT
  count_remaining_sales.total AS vendas_restantes_para_migrar,
  count_sales_items.total AS total_items_para_migrar,
  count_sale_items.total AS total_items_ja_migrados,
  (SELECT COUNT(*) FROM temp_migration_errors) AS total_vendas_com_erro,
  CASE 
    WHEN (SELECT COUNT(*) FROM temp_migration_errors) = 0 AND count_remaining_sales.total = 0 THEN '✅ TODAS AS VENDAS JA FORAM MIGRADAS COM SUCESSO'
    WHEN (SELECT COUNT(*) FROM temp_migration_errors) = 0 AND count_remaining_sales.total > 0 THEN '⚠️ MIGRACAO INCOMPLETA (AINDA HA VENDAS RESTANTES)'
    ELSE '⚠️ MIGRACAO CONCLUIDA COM ERROS (VER TABELA temp_migration_errors)'
  END AS status
FROM count_sales_items, count_sale_items, count_remaining_sales;

-- 5. Exibir lista de vendas que deram erro
SELECT sale_id, error_message, created_at FROM temp_migration_errors ORDER BY created_at;
