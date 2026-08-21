-- DROP FUNCTION public.rebuild_stock_movement_history(uuid, uuid, timestamptz);

CREATE OR REPLACE FUNCTION public.rebuild_stock_movement_history(p_product_id uuid, p_sector_id uuid, p_from_date timestamp with time zone)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  	v_current_balance numeric;
	v_sum_deteleted_balance numeric;
 	v_movement record;
	v_owner_sector_id uuid;
	v_actor_sector_id uuid;
BEGIN
	SELECT p_sector_id INTO v_actor_sector_id;

	SELECT
		COALESCE(s.master_sector_id, s.id) INTO v_owner_sector_id
	FROM
		sectors s
	WHERE	
		s.id = p_sector_id;

	RAISE NOTICE 'Actor: %, Sector Owner: %', v_actor_sector_id, v_owner_sector_id

	-- Primeiro, Somar o balanco total do estoque que sera removido
	SELECT
		SUM(quantity) INTO v_sum_deleted_balance
	FROM
		"productStockMovements"
	  WHERE 
	    product_id = p_product_id AND
	    sector_id = p_sector_id AND
	    movement_date >= p_from_date;

	RAISE NOTICE 'Balanco de estoque removido %', v_sum_deleted_balance

  -- Primeiro, deletar movimentações existentes a partir da data especificada
  DELETE FROM "productStockMovements"
  WHERE 
    product_id = p_product_id AND
    sector_id = p_sector_id AND
    movement_date >= p_from_date;

  -- Obter o último saldo anterior à data de início
  SELECT COALESCE(new_balance, 0) INTO v_current_balance
  FROM "productStockMovements"
  WHERE
    product_id = p_product_id AND
    sector_id = p_sector_id AND
    movement_date < p_from_date
  ORDER BY movement_date DESC, created_at DESC
  LIMIT 1;

  -- Se não tiver movimentações anteriores, pegar o saldo calculado
  IF NOT FOUND THEN
    SELECT COALESCE(v_sum_deleted_balance, 0) INTO v_current_balance
    
    -- Se não tiver nenhum registro em productStocks, começar com 0
    IF NOT FOUND THEN
      v_current_balance := 0;
    END IF;
  END IF;

  -- 1. Recriar histórico de compras
  FOR v_movement IN 
    SELECT 
      p.id AS purchase_id,
      p.company_id,
      p.company_name,
      pi.product_id,
      pi.product_name,
      p.purchase_date AS movement_date,
      pi.quantity AS quantity,
      'purchase'::stock_movement_type AS type,
	  p.sector_id,
	  p.sector_name,
		
    FROM purchases p
    JOIN "purchaseItems" pi ON p.id = pi.purchase_id
    WHERE
      pi.product_id = p_product_id AND
      p.purchase_date >= p_from_date::date AND
	  p.sector_id = p_sector_id
  LOOP
    INSERT INTO "productStockMovements" (
      id, product_id, product_name, sector_id, sector_name,
      type, purchase_id, quantity, previous_balance, new_balance,
      movement_date, company_id, company_name, created_at, owner_sector_id, actor_sector_id
    ) VALUES (
      gen_random_uuid(), v_movement.product_id, v_movement.product_name,
      p_sector_id, (SELECT name FROM sectors WHERE id = p_sector_id),
      v_movement.type, v_movement.purchase_id, v_movement.quantity,
      v_current_balance, v_current_balance + v_movement.quantity,
      v_movement.movement_date, v_movement.company_id, v_movement.company_name
      now(), v_owner_sector_id, v_actor_sector_id,
    );
    v_current_balance := v_current_balance + v_movement.quantity;
  END LOOP;

  -- 2. Recriar histórico de vendas
  FOR v_movement IN 
    SELECT 
      s.id AS sale_id,
      s.company_id,
      s.company_name,
      si.product_id,
      si.product_name,
      s.sale_date AS movement_date,
      -si.quantity AS quantity,
      'sale'::stock_movement_type AS type,
		s.sector_id,
		s.sector_name
    FROM sales s
    JOIN "saleItems" si ON s.id = si.sale_id
    WHERE
      si.product_id = p_product_id AND
      s.sector_id = p_sector_id AND
      s.sale_date >= p_from_date::date
  LOOP
    INSERT INTO "productStockMovements" (
      id, product_id, product_name, sector_id, sector_name,
      type, sale_id, quantity, previous_balance, new_balance,
      movement_date, company_id, company_name, created_at, owner_sector_id, actor_sector_id
    ) VALUES (
      gen_random_uuid(), v_movement.product_id, v_movement.product_name,
      p_sector_id, v_movement.sector_name,
      v_movement.type, v_movement.sale_id, v_movement.quantity,
      v_current_balance, v_current_balance + v_movement.quantity,
      v_movement.movement_date, v_movement.company_id, v_movement.company_name,
      now(), v_owner_sector_id, v_actor_sector_id,
    );
    v_current_balance := v_current_balance + v_movement.quantity;
  END LOOP;

  -- 3. Recriar histórico de transferências (saída)
  FOR v_movement IN 
    SELECT 
      st.id AS stock_transfer_id,
      st.company_id,
      st.company_name,
      st.product_id,
      st.product_name,
      st.transfer_date AS movement_date,
      -st.quantity AS quantity,
      'transfer'::stock_movement_type AS type
    FROM "stockTransfers" st
    WHERE
      st.product_id = p_product_id AND
      st.from_sector_id = p_sector_id AND
      st.transfer_date >= p_from_date
  LOOP
    INSERT INTO "productStockMovements" (
      id, product_id, product_name, sector_id, sector_name,
      type, stock_transfer_id, quantity, previous_balance, new_balance,
      movement_date, company_id, company_name, created_at, owner_sector_id, actor_sector_id
    ) VALUES (
      gen_random_uuid(), v_movement.product_id, v_movement.product_name,
      p_sector_id, (SELECT name FROM sectors WHERE id = p_sector_id),
      v_movement.type, v_movement.stock_transfer_id, v_movement.quantity,
      v_current_balance, v_current_balance + v_movement.quantity,
      v_movement.movement_date, v_movement.company_id, v_movement.company_name,
      now(), v_owner_sector_id, v_actor_sector_id,
    );
    v_current_balance := v_current_balance + v_movement.quantity;
  END LOOP;

  -- 4. Recriar histórico de transferências (entrada)
  FOR v_movement IN 
    SELECT 
      st.id AS stock_transfer_id,
      st.company_id,
      st.company_name,
      st.product_id,
      st.product_name,
      st.transfer_date AS movement_date,
      st.quantity AS quantity,
      'transfer'::stock_movement_type AS type
    FROM "stockTransfers" st
    WHERE
      st.product_id = p_product_id AND
      st.to_sector_id = p_sector_id AND
      st.transfer_date >= p_from_date
  LOOP
    INSERT INTO "productStockMovements" (
      id, product_id, product_name, sector_id, sector_name,
      type, stock_transfer_id, quantity, previous_balance, new_balance,
      movement_date, company_id, company_name, created_at, owner_sector_id, actor_sector_id
    ) VALUES (
      gen_random_uuid(), v_movement.product_id, v_movement.product_name,
      p_sector_id, (SELECT name FROM sectors WHERE id = p_sector_id),
      v_movement.type, v_movement.stock_transfer_id, v_movement.quantity,
      v_current_balance, v_current_balance + v_movement.quantity,
      v_movement.movement_date, v_movement.company_id, v_movement.company_name,
      now(), v_owner_sector_id, v_actor_sector_id,
    );
    v_current_balance := v_current_balance + v_movement.quantity;
  END LOOP;

  -- 5. Recriar histórico de retiradas
  FOR v_movement IN 
    SELECT 
      pp.id AS product_pickup_id,
      pp.company_id,
      pp.company_name,
      pp.product_id,
      pp.product_name,
      pp.sale_date AS movement_date,
      -pp.pickup_quantity AS quantity,
      'pickup'::stock_movement_type AS type
    FROM "productPickups" pp
    WHERE
      pp.product_id = p_product_id AND
      pp.sale_date >= p_from_date
  LOOP
    INSERT INTO "productStockMovements" (
      id, product_id, product_name, sector_id, sector_name,
      type, product_pickup_id, quantity, previous_balance, new_balance,
      movement_date, company_id, company_name, created_at, owner_sector_id, actor_sector_id
    ) VALUES (
      gen_random_uuid(), v_movement.product_id, v_movement.product_name,
      p_sector_id, (SELECT name FROM sectors WHERE id = p_sector_id),
      v_movement.type, v_movement.product_pickup_id, v_movement.quantity,
      v_current_balance, v_current_balance + v_movement.quantity,
      v_movement.movement_date, v_movement.company_id, v_movement.company_name,
      now(), v_owner_sector_id, v_actor_sector_id,
    );
    v_current_balance := v_current_balance + v_movement.quantity;
  END LOOP;

  -- 6. Recriar histórico de empréstimos
  FOR v_movement IN 
    SELECT 
      vl.id AS vasilhame_loan_id,
      vl.company_id,
      vl.company_name,
      vl.vasilhame_id AS product_id,
      vl.vasilhame_name AS product_name,
      vl.loan_date AS movement_date,
      -vl.loan_quantity AS quantity,
      'loan'::stock_movement_type AS type
    FROM "vasilhameLoans" vl
    WHERE
      vl.vasilhame_id = p_product_id AND
      vl.loan_date >= p_from_date
  LOOP
    INSERT INTO "productStockMovements" (
      id, product_id, product_name, sector_id, sector_name,
      type, vasilhame_loan_id, quantity, previous_balance, new_balance,
      movement_date, company_id, company_name, created_at, owner_sector_id, actor_sector_id
    ) VALUES (
      gen_random_uuid(), v_movement.product_id, v_movement.product_name,
      p_sector_id, (SELECT name FROM sectors WHERE id = p_sector_id),
      v_movement.type, v_movement.vasilhame_loan_id, v_movement.quantity,
      v_current_balance, v_current_balance + v_movement.quantity,
      v_movement.movement_date, v_movement.company_id, v_movement.company_name,
      now(), v_owner_sector_id, v_actor_sector_id,
    );
    v_current_balance := v_current_balance + v_movement.quantity;
  END LOOP;

END;
$function$
;
