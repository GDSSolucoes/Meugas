## Plan: Migrate AccountsReceivable filtering to backend (v2)

TL;DR: Move the current `AccountsReceivable` screen filter logic from client-side in `frontend/src/pages/AccountsReceivable.jsx` into the backend `accountsReceivables` list endpoint. Use **Service Pattern override** instead of CQRS (better fit for current architecture). Add `paymentTypeId` persistence via Sales service and leverage **LEFT JOIN with `sales` table** for indirect filters (`nfeNumber`, `personDocument`, `sectorId`). Keep the DTO lean—no denormalized fields.

---

## Architecture Decision: Service Pattern vs CQRS

**Chosen: Service Pattern Override**
- **Why**: Current codebase uses `BaseCrudService` uniformly across all resources. Introducing CQRS would require new handlers, command/query objects, and event infrastructure with minimal immediate ROI.
- **Alternative considered**: CQRS (with separate query handlers + commands). Viable if filters grow significantly more complex, but overkill today.
- **Path forward**: Override `AccountsReceivablesService.list()` to build complex WHERE clauses and joins. If future queries become harder to maintain, refactor to CQRS at that point.

---

## Steps

### 1. Schema & Persistence Layer

**Backend schema** (`backend/src/database/schemas/accountsReceivable.schema.ts`)
- ✅ Add `paymentTypeId: uuid` column (foreign key to paymentTypes table).
- ✅ Do **NOT** add `nfeNumber`, `personDocument`, `sectorId`—fetch these via LEFT JOIN from `sales` table.
- ✅ Do **NOT** add `respCobrancaId`—remove from filters entirely (unused elsewhere).
- ✅ Add index on `paymentTypeId` for filter performance.

**Backend DTO** (`backend/src/resources/accountsReceivables/dto/accountsreceivables.base.dto.ts`)
- ✅ Add `paymentTypeId?: string` (optional, populated by Sales service).
- ❌ Do NOT include `nfeNumber`, `personDocument`, `sectorId`.
- ❌ Do NOT include `respCobrancaId`.

**Sales Service persistence** (`backend/src/resources/sales/sales.service.ts`)
- Update `completeCreate()` and `completeUpdate()` to extract `paymentTypeId` from the payment method and store it in each `AccountsReceivable` record.
- When creating/updating accounts receivable rows, copy `paymentTypeId` from the sale's primary payment method (or first installment method).

### 2. Backend Filter Support with Joins

**Override `list()` in** `backend/src/resources/accountsReceivables/accountsReceivables.service.ts`

Build a custom query that:
- LEFT JOINs `accountsReceivables` with `sales` on `accountsReceivables.saleId = sales.id`.
- Supports filters on:
  - **Direct fields**: `companyId`, `personId`, `cashAccountId`, `paymentTypeId`, `status`, `dueDate_gt`/`dueDate_lt`.
  - **Via LEFT JOIN (from sales)**: 
    - `nfeNumber_like` → filter on `sales.nfeNumber`
    - `personDocument_like` → filter on `sales.personDocument` or via `Person` join
    - `sectorId_eq` → filter on `sales.sectorId`
  - **Boolean status state**: Map `naoPagas`, `pagas`, `emCobranca` to `status IN (...)` clause.
  - **Search**: `saleId_like`, `id_like` for code/id search.

**Query shape** (pseudocode):
```sql
SELECT ar.* FROM accountsReceivables ar
LEFT JOIN sales s ON ar.saleId = s.id
WHERE ar.active = true
  AND ar.companyId = <company_from_rls>
  AND (ar.status IN (...) -- based on naoPagas/pagas/emCobranca)
  AND (ar.dueDate BETWEEN ? AND ? -- optional period filter)
  AND (ar.personId = ? OR <sacado filter>)
  AND (ar.cashAccountId = ? OR <account filter>)
  AND (ar.paymentTypeId = ? OR <payment type filter>)
  AND (s.sectorId = ? OR <sector filter>) -- via LEFT JOIN
  AND (s.nfeNumber ILIKE ? OR ar.saleId ILIKE ? OR ...) -- search filters
ORDER BY <sort_field>
LIMIT <limit> OFFSET <offset>
```

**Query building approach**:
- Override `AccountsReceivablesService.list()` to accept filter params and call a custom query method.
- Use Drizzle's `.leftJoin()` and `.where()` to build the WHERE clauses dynamically.
- Return paginated results with `{ data, total, page, limit, totalPages }`.

### 3. Frontend Page Migration

**In** `frontend/src/pages/AccountsReceivable.jsx`:

- Remove the heavy client-side `applyFiltersAndShow()` function (no more array filtering).
- When user clicks "Pesquisar" or applies filters, build a filter object from form state:
  ```javascript
  const filters = {
    companyId: currentUser.companyId,
    personId: sacadoSelecionado?.id,
    cashAccountId: filtroConta !== "todas" ? filtroConta : undefined,
    paymentTypeId: filtroTipoPagto !== "todos" ? filtroTipoPagto : undefined,
    sectorId: filtroSetor !== "todos" ? filtroSetor : undefined,
    "dueDate_gte": usarPeriodo ? dataInicio : undefined,
    "dueDate_lte": usarPeriodo ? dataFinal : undefined,
    "saleId_like": codigoPesquisa && metodoPesquisa === "codigoVenda" ? codigoPesquisa : undefined,
    "id_like": codigoPesquisa && metodoPesquisa === "codigoVenda" ? codigoPesquisa : undefined,
    "nfeNumber_like": codigoPesquisa && metodoPesquisa === "notaFiscal" ? codigoPesquisa : undefined,
    "personDocument_like": codigoPesquisa && metodoPesquisa === "documento" ? codigoPesquisa : undefined,
    status: Object.keys(statusContas).filter(k => statusContas[k]),
  };
  
  const contas = await AccountsReceivable.filter(filters, { sort: "-dueDate", limit: 100 });
  setDisplayedContas(contas);
  setShowResults(true);
  ```
- After fetch, apply local calculations for `isVencida` and `isEmCobranca` (for row colors/totals).
- Keep `loadData()` fetching lookup lists (cashAccounts, paymentTypes, sectors, people, employees) unchanged.

### 4. Optional Follow-up / Reuse

- If modal variants (`AccountsReceivableFullModal.jsx`, `ContasAReceberModal.jsx`) need the same filtering, update them to call the new backend endpoint in a second pass.
- Document the filter query pattern for future resource services that need complex joins.

---

## Relevant Files

- `backend/src/database/schemas/accountsReceivable.schema.ts` — add `paymentTypeId` column + index
- `backend/src/resources/accountsReceivables/dto/accountsreceivables.base.dto.ts` — add `paymentTypeId` field (lean DTO)
- `backend/src/resources/accountsReceivables/accountsReceivables.service.ts` — override `list()` with custom LEFT JOIN query
- `backend/src/resources/sales/sales.service.ts` — update `completeCreate()` & `completeUpdate()` to persist `paymentTypeId` in AccountsReceivable
- `frontend/src/pages/AccountsReceivable.jsx` — refactor filter logic to call backend API
- `frontend/src/entities/AccountsReceivable.ts` — optionally add `paymentTypeId` to entity type

---

## Verification

1. **Database migration**: Run migration to add `paymentTypeId` column to `accountsReceivables` table + index.
2. **Sales service**: Create a test sale with installment payment and confirm `paymentTypeId` is populated in new `AccountsReceivable` records.
3. **API filter tests**:
   - Call `GET /accountsReceivables?companyId=X&status=pendente&paymentTypeId=Y` and confirm correct records returned.
   - Call with `nfeNumber_like=123` and confirm LEFT JOIN filters by `sales.nfeNumber`.
   - Call with `sectorId=Z` and confirm LEFT JOIN filters by `sales.sectorId`.
   - Call with date range `dueDate_gte=2026-01-01&dueDate_lte=2026-06-30` and confirm date filtering works.
4. **Frontend page**:
   - Open AccountsReceivable page and apply filters.
   - Check browser network tab for GET request with correct query params.
   - Confirm returned list matches applied filters.
   - Check that row colors (red for overdue, green for paid, blue for collection) render correctly.
5. **Modals** (if updated): Re-test any modal dialogs that use AccountsReceivable filtering.

---

## Decisions & Assumptions

- **Service Pattern over CQRS**: Current architecture uses Service Pattern uniformly. CQRS adds infrastructure complexity not justified yet.
- **Lean DTO**: Only `paymentTypeId` is added to the DTO. Filter fields like `nfeNumber`, `personDocument`, `sectorId` are **not** persisted in `accountsReceivables`—they live only in `sales` and are fetched via LEFT JOIN.
- **No `respCobrancaId`**: Field removed entirely; no evidence it's used elsewhere in the system.
- **LEFT JOIN approach**: More efficient than storing denormalized copies of sales data; keeps `accountsReceivables` focused and reduces data duplication.
- **Pagination**: Backend list endpoint always returns paginated results; frontend handles page state.
- **Filtering scope**: This phase covers the main `AccountsReceivable` page; modal variants are a second pass.
