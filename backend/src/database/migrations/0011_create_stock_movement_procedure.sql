-- Storage Procedure para Gerenciar Histórico de Movimentações de Estoque
-- Função PL/pgSQL que gerencia a criação e atualização do histórico de movimentações

-- 1. Função principal para recriar o histórico de um produto/setor a partir de uma data
CREATE OR REPLACE FUNCTION rebuild_stock_movement_history(
  p_product_id uuid,
  p_sector_id uuid,
  p_from_date timestamp with time zone
)
RETURNS void AS $$
DECLARE
  v_current_balance numeric;
  v_movement record;
BEGIN
  -- Primeiro, deletar movimentações existentes a partir da data especificada
  -- Delete movements for this product/owner sector from the given date
  DELETE FROM "productStockMovements"
  WHERE 
    product_id = p_product_id AND
    owner_sector_id = p_sector_id AND
    movement_date >= p_from_date;

  -- Obter o último saldo anterior à data de início
  -- Get last balance for this product/owner sector before start date
  SELECT COALESCE(new_balance, 0) INTO v_current_balance
  FROM "productStockMovements"
  WHERE
    product_id = p_product_id AND
    owner_sector_id = p_sector_id AND
    movement_date < p_from_date
  ORDER BY movement_date DESC, created_at DESC
  LIMIT 1;

  -- Se não tiver movimentações anteriores, pegar o saldo inicial de productStocks
  IF NOT FOUND THEN
    -- If none, get initial quantity from productStocks using owner_sector_id
    SELECT COALESCE(quantity, 0) INTO v_current_balance
    FROM "productStocks"
    WHERE
      product_id = p_product_id AND
      owner_sector_id = p_sector_id;
    
    -- Se não tiver nenhum registro em productStocks, começar com 0
    IF NOT FOUND THEN
      v_current_balance := 0;
    END IF;
  END IF;

  -- 1. Recriar histórico de compras
  -- 1. Recreate purchase history. Derive owner/actor by joining sectors.
  FOR v_movement IN 
    SELECT 
      p.id AS purchase_id,
      p.company_id,
      p.company_name,
      pi.product_id,
      pi.product_name,
      p.purchase_date AS movement_date,
      pi.quantity AS quantity,
      'purchase' AS type,
      s.id AS actor_sector_id,
      s.name AS actor_sector_name,
      CASE WHEN s.is_own_stock THEN s.id ELSE s.master_sector_id END AS owner_sector_id
    FROM purchases p
    JOIN "purchaseItems" pi ON p.id = pi.purchase_id
    LEFT JOIN sectors s ON s.id = p.sector_id
    WHERE
      pi.product_id = p_product_id AND
      p.purchase_date >= p_from_date::date AND
      (CASE WHEN s.is_own_stock THEN s.id ELSE s.master_sector_id END) = p_sector_id
  LOOP
    INSERT INTO "productStockMovements" (
      id, product_id, product_name, sector_id, sector_name,
      owner_sector_id, actor_sector_id, type, purchase_id, quantity, previous_balance, new_balance,
      movement_date, company_id, company_name, created_at
    ) VALUES (
      gen_random_uuid(), v_movement.product_id, v_movement.product_name,
      v_movement.actor_sector_id, v_movement.actor_sector_name,
      v_movement.owner_sector_id, v_movement.actor_sector_id,
      v_movement.type, v_movement.purchase_id, v_movement.quantity,
      v_current_balance, v_current_balance + v_movement.quantity,
      v_movement.movement_date, v_movement.company_id, v_movement.company_name,
      now()
    );
    v_current_balance := v_current_balance + v_movement.quantity;
  END LOOP;

  -- 2. Recriar histórico de vendas
  -- 2. Recreate sale history (negative quantities). derive owner/actor
  FOR v_movement IN 
    SELECT 
      s.id AS sale_id,
      s.company_id,
      s.company_name,
      si.product_id,
      si.product_name,
      s.sale_date AS movement_date,
      -si.quantity AS quantity,
      'sale' AS type,
      sec.id AS actor_sector_id,
      sec.name AS actor_sector_name,
      CASE WHEN sec.is_own_stock THEN sec.id ELSE sec.master_sector_id END AS owner_sector_id
    FROM sales s
    JOIN "saleItems" si ON s.id = si.sale_id
    LEFT JOIN sectors sec ON sec.id = s.sector_id
    WHERE
      si.product_id = p_product_id AND
      s.sale_date >= p_from_date::date AND
      (CASE WHEN sec.is_own_stock THEN sec.id ELSE sec.master_sector_id END) = p_sector_id
  LOOP
    INSERT INTO "productStockMovements" (
      id, product_id, product_name, sector_id, sector_name,
      owner_sector_id, actor_sector_id, type, sale_id, quantity, previous_balance, new_balance,
      movement_date, company_id, company_name, created_at
    ) VALUES (
      gen_random_uuid(), v_movement.product_id, v_movement.product_name,
      v_movement.actor_sector_id, v_movement.actor_sector_name,
      v_movement.owner_sector_id, v_movement.actor_sector_id,
      v_movement.type, v_movement.sale_id, v_movement.quantity,
      v_current_balance, v_current_balance + v_movement.quantity,
      v_movement.movement_date, v_movement.company_id, v_movement.company_name,
      now()
    );
    v_current_balance := v_current_balance + v_movement.quantity;
  END LOOP;

  -- 3. Recriar histórico de transferências (saída)
  -- 3. Recreate transfer (outgoing) history
  FOR v_movement IN 
    SELECT 
      st.id AS stock_transfer_id,
      st.company_id,
      st.company_name,
      st.product_id,
      st.product_name,
      st.transfer_date AS movement_date,
      -st.quantity AS quantity,
      'transfer' AS type,
      fs.id AS actor_sector_id,
      fs.name AS actor_sector_name,
      CASE WHEN fs.is_own_stock THEN fs.id ELSE fs.master_sector_id END AS owner_sector_id
    FROM "stockTransfers" st
    LEFT JOIN sectors fs ON fs.id = st.from_sector_id
    WHERE
      st.product_id = p_product_id AND
      st.transfer_date >= p_from_date AND
      (CASE WHEN fs.is_own_stock THEN fs.id ELSE fs.master_sector_id END) = p_sector_id
  LOOP
    INSERT INTO "productStockMovements" (
      id, product_id, product_name, sector_id, sector_name,
      owner_sector_id, actor_sector_id, type, stock_transfer_id, quantity, previous_balance, new_balance,
      movement_date, company_id, company_name, created_at
    ) VALUES (
      gen_random_uuid(), v_movement.product_id, v_movement.product_name,
      v_movement.actor_sector_id, v_movement.actor_sector_name,
      v_movement.owner_sector_id, v_movement.actor_sector_id,
      v_movement.type, v_movement.stock_transfer_id, v_movement.quantity,
      v_current_balance, v_current_balance + v_movement.quantity,
      v_movement.movement_date, v_movement.company_id, v_movement.company_name,
      now()
    );
    v_current_balance := v_current_balance + v_movement.quantity;
  END LOOP;

  -- 4. Recriar histórico de transferências (entrada)
  -- 4. Recreate transfer (incoming) history
  FOR v_movement IN 
    SELECT 
      st.id AS stock_transfer_id,
      st.company_id,
      st.company_name,
      st.product_id,
      st.product_name,
      st.transfer_date AS movement_date,
      st.quantity AS quantity,
      'transfer' AS type,
      ts.id AS actor_sector_id,
      ts.name AS actor_sector_name,
      CASE WHEN ts.is_own_stock THEN ts.id ELSE ts.master_sector_id END AS owner_sector_id
    FROM "stockTransfers" st
    LEFT JOIN sectors ts ON ts.id = st.to_sector_id
    WHERE
      st.product_id = p_product_id AND
      st.transfer_date >= p_from_date AND
      (CASE WHEN ts.is_own_stock THEN ts.id ELSE ts.master_sector_id END) = p_sector_id
  LOOP
    INSERT INTO "productStockMovements" (
      id, product_id, product_name, sector_id, sector_name,
      owner_sector_id, actor_sector_id, type, stock_transfer_id, quantity, previous_balance, new_balance,
      movement_date, company_id, company_name, created_at
    ) VALUES (
      gen_random_uuid(), v_movement.product_id, v_movement.product_name,
      v_movement.actor_sector_id, v_movement.actor_sector_name,
      v_movement.owner_sector_id, v_movement.actor_sector_id,
      v_movement.type, v_movement.stock_transfer_id, v_movement.quantity,
      v_current_balance, v_current_balance + v_movement.quantity,
      v_movement.movement_date, v_movement.company_id, v_movement.company_name,
      now()
    );
    v_current_balance := v_current_balance + v_movement.quantity;
  END LOOP;

  -- 5. Recriar histórico de retiradas
  -- 5. Recreate pickups: derive owner/actor from pickup sector
  FOR v_movement IN 
    SELECT 
      pp.id AS product_pickup_id,
      pp.company_id,
      pp.company_name,
      pp.product_id,
      pp.product_name,
      pp.sale_date AS movement_date,
      -pp.pickup_quantity AS quantity,
      'pickup' AS type,
      s.id AS actor_sector_id,
      s.name AS actor_sector_name,
      CASE WHEN s.is_own_stock THEN s.id ELSE s.master_sector_id END AS owner_sector_id
    FROM "productPickups" pp
    LEFT JOIN sectors s ON s.id = pp.sector_id
    WHERE
      pp.product_id = p_product_id AND
      pp.sale_date >= p_from_date AND
      (CASE WHEN s.is_own_stock THEN s.id ELSE s.master_sector_id END) = p_sector_id
  LOOP
    INSERT INTO "productStockMovements" (
      id, product_id, product_name, sector_id, sector_name,
      owner_sector_id, actor_sector_id, type, product_pickup_id, quantity, previous_balance, new_balance,
      movement_date, company_id, company_name, created_at
    ) VALUES (
      gen_random_uuid(), v_movement.product_id, v_movement.product_name,
      v_movement.actor_sector_id, v_movement.actor_sector_name,
      v_movement.owner_sector_id, v_movement.actor_sector_id,
      v_movement.type, v_movement.product_pickup_id, v_movement.quantity,
      v_current_balance, v_current_balance + v_movement.quantity,
      v_movement.movement_date, v_movement.company_id, v_movement.company_name,
      now()
    );
    v_current_balance := v_current_balance + v_movement.quantity;
  END LOOP;

  -- 6. Recriar histórico de empréstimos
  -- 6. Recreate loans: derive owner/actor from loan sector
  FOR v_movement IN 
    SELECT 
      vl.id AS vasilhame_loan_id,
      vl.company_id,
      vl.company_name,
      vl.vasilhame_id AS product_id,
      vl.vasilhame_name AS product_name,
      vl.loan_date AS movement_date,
      -vl.loan_quantity AS quantity,
      'loan' AS type,
      s.id AS actor_sector_id,
      s.name AS actor_sector_name,
      CASE WHEN s.is_own_stock THEN s.id ELSE s.master_sector_id END AS owner_sector_id
    FROM "vasilhameLoans" vl
    LEFT JOIN sectors s ON s.id = vl.sector_id
    WHERE
      vl.vasilhame_id = p_product_id AND
      vl.loan_date >= p_from_date AND
      (CASE WHEN s.is_own_stock THEN s.id ELSE s.master_sector_id END) = p_sector_id
  LOOP
    INSERT INTO "productStockMovements" (
      id, product_id, product_name, sector_id, sector_name,
      owner_sector_id, actor_sector_id, type, vasilhame_loan_id, quantity, previous_balance, new_balance,
      movement_date, company_id, company_name, created_at
    ) VALUES (
      gen_random_uuid(), v_movement.product_id, v_movement.product_name,
      v_movement.actor_sector_id, v_movement.actor_sector_name,
      v_movement.owner_sector_id, v_movement.actor_sector_id,
      v_movement.type, v_movement.vasilhame_loan_id, v_movement.quantity,
      v_current_balance, v_current_balance + v_movement.quantity,
      v_movement.movement_date, v_movement.company_id, v_movement.company_name,
      now()
    );
    v_current_balance := v_current_balance + v_movement.quantity;
  END LOOP;

END;
$$ LANGUAGE plpgsql;

-- 2. Função auxiliar para recriar todo o histórico de movimentações de estoque (para todas as combinações produto/setor)
-- Inclui limite de 60 dias para manutenções
CREATE OR REPLACE FUNCTION rebuild_all_stock_movement_history()
RETURNS void AS $$
DECLARE
  v_product_stock record;
  v_sixty_days_ago timestamp with time zone := NOW() - INTERVAL '60 days';
BEGIN
  -- Iterar sobre todas as combinações produto/setor existentes em productStocks
  FOR v_product_stock IN 
    SELECT product_id, sector_id FROM "productStocks"
  LOOP
    PERFORM rebuild_stock_movement_history(
      v_product_stock.product_id,
      v_product_stock.sector_id,
      v_sixty_days_ago
    );
  END LOOP;

END;
$$ LANGUAGE plpgsql;
