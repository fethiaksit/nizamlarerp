# Tekstil Baskı ERP İlk Sürüm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Yerelde Docker Compose ile çalışan, müşteri ve iş yönetimini gerçek API üzerinden sağlayan ilk Tekstil Baskı ERP sürümünü oluşturmak.

**Architecture:** React/TypeScript arayüzü Go/Gin REST API ile konuşur; API PostgreSQL'e modül bazlı handler-service-repository katmanlarıyla erişir. Müşteri bakiyesi, iş oluşturulurken transaction içinde yazılan hareket defterinden hesaplanır; dashboard salt-okunur toplulaştırma uçlarını kullanır.

**Tech Stack:** React, TypeScript, Vite, Go, Gin, PostgreSQL, pgx, golang-migrate, Docker Compose, Vitest ve Go test paketi.

**Spec:** `docs/superpowers/specs/2026-10-02-tekstil-baski-erp-ilk-surum-design.md`

## Global Constraints

- Arayüz dili Türkçe; mobil, tablet ve masaüstünde yalın ve responsive olmalıdır.
- Para değerleri PostgreSQL `NUMERIC(14,2)` kullanır; Go veya TypeScript tarafında float kullanılmaz.
- Ana kayıtlarda `created_at` ve `updated_at` bulunur.
- Finansal bakiye, saklanan toplamdan değil `customer_transactions` hareketlerinden hesaplanır.
- İş oluşturma ile başlangıç durum geçmişi ve satış hareketi tek PostgreSQL transaction içinde yazılır.
- Backend tüm girdileri doğrular ve kullanıcıya Türkçe, anlaşılır hata döner.
- İlk sürüm yerel ağdaki tek yönetici kullanımına odaklanır ve giriş ekranı içermez; rol yönetimi, çekler, tahsilatlar, personel ve raporlar kapsam dışıdır.

## Review Focus

- Aynı iş numarasının tekrar girilmesi reddedilmeli; kullanıcı “iş numarası zaten kullanılıyor” hatasını görmelidir.
- Sıfır veya negatif miktar/fiyat reddedilmeli; tutar hiçbir zaman float yuvarlama hatası üretmemelidir.
- Geçmiş bir teslim tarihi ve teslim edilmemiş durumdaki iş dashboard'da geciken görünmelidir.
- Bir iş yazılırken satış hareketi yazılamazsa iş kaydı da kalmamalıdır.
- Müşteri araması Türkçe karakter, telefonun bir bölümü ve büyük/küçük harf farklılıklarıyla sonuç döndürmelidir.

---

## Dosya Yapısı

- `docker-compose.yml`: Yerel PostgreSQL, API ve frontend servisleri.
- `.env.example`: Hassas bilgi içermeyen gerekli ortam değişkenleri.
- `backend/cmd/api/main.go`: Uygulama başlatma, yapılandırma ve HTTP sunucusu.
- `backend/internal/platform/*`: Veritabanı bağlantısı, hata yanıtları, router ve middleware.
- `backend/internal/customers/*`: Müşteri HTTP, servis, repository ve veri tipleri.
- `backend/internal/jobs/*`: İş, durum tarihi ve iş oluşturma transaction kodu.
- `backend/internal/ledger/*`: Müşteri hareketleri ve bakiye sorgusu.
- `backend/internal/dashboard/*`: İş ve müşteri alacak toplamı sorguları.
- `backend/migrations/*`: PostgreSQL şema değişiklikleri.
- `backend/**/*_test.go`: Birim ve API entegrasyon testleri.
- `frontend/src/*`: Uygulama kabuğu, API istemcisi, sayfalar ve ortak bileşenler.
- `frontend/src/**/*.test.tsx`: Form ve ekranda görünür hata testleri.

### Task 1: Çalıştırılabilir iskelet ve PostgreSQL migration altyapısı

**Files:**
- Create: `docker-compose.yml`, `.env.example`, `backend/go.mod`, `backend/cmd/api/main.go`
- Create: `backend/internal/platform/config.go`, `backend/internal/platform/database.go`, `backend/internal/platform/router.go`
- Create: `backend/migrations/000001_initial_schema.up.sql`, `backend/migrations/000001_initial_schema.down.sql`
- Test: `backend/internal/platform/config_test.go`

**Interfaces:**
- Produces: `LoadConfig() (Config, error)`, `OpenDatabase(ctx context.Context, cfg Config) (*pgxpool.Pool, error)`, `NewRouter(deps Dependencies) *gin.Engine`.

- [ ] **Step 1: Write failing configuration tests**

Test `LoadConfig` with missing `DATABASE_URL` and assert it returns the Turkish message `Veritabanı bağlantı bilgisi eksik.`.

- [ ] **Step 2: Run the configuration test and verify failure**

Run: `cd backend && go test ./internal/platform -run TestLoadConfig -v`
Expected: FAIL because configuration package is absent.

- [ ] **Step 3: Implement configuration, database pool, health endpoint, migrations and Compose services**

Define `Config` with `Port`, `DatabaseURL` and `FrontendOrigin`; expose `GET /healthz` returning `{ "status": "ok" }`. Create all initial tables from the spec, primary/foreign keys and indexes for customer name, phone, job number, pattern code and due date.

- [ ] **Step 4: Run Go tests and a clean migration startup**

Run: `cd backend && go test ./...` then `docker compose up --build`
Expected: Go tests pass; `/healthz` returns HTTP 200 after migrations run.

- [ ] **Step 5: Commit**

Run: `git add docker-compose.yml .env.example backend && git commit -m "chore: add local ERP application foundation"`

### Task 2: Müşteri kayıtları, arama ve hesap özeti

**Files:**
- Create: `backend/internal/customers/model.go`, `service.go`, `repository.go`, `handler.go`
- Create: `backend/internal/ledger/repository.go`, `service.go`
- Modify: `backend/internal/platform/router.go`
- Test: `backend/internal/customers/service_test.go`, `backend/internal/customers/handler_test.go`

**Interfaces:**
- Consumes: `pgxpool.Pool`, `NewRouter(deps Dependencies) *gin.Engine`.
- Produces: `CreateCustomer(ctx context.Context, input CreateCustomerInput) (Customer, error)`, `ListCustomers(ctx context.Context, query string) ([]CustomerListItem, error)`, `GetCustomerDetail(ctx context.Context, id uuid.UUID) (CustomerDetail, error)`.

- [ ] **Step 1: Write failing customer service tests**

Cover required company name, duplicate company handling, case-insensitive Turkish search, phone substring search and zero ledger balance for a new customer.

- [ ] **Step 2: Run tests and verify failure**

Run: `cd backend && go test ./internal/customers -v`
Expected: FAIL because customer service is absent.

- [ ] **Step 3: Implement customer and ledger interfaces**

Implement `POST/GET /api/v1/customers`, `GET/PATCH /api/v1/customers/:id` and `GET /api/v1/customers/:id/transactions`. Company name is required; all validation errors are returned as stable Turkish client messages. Calculate `open_balance` with a ledger aggregate, not a stored balance column.

- [ ] **Step 4: Run customer tests**

Run: `cd backend && go test ./internal/customers ./internal/ledger -v`
Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add backend && git commit -m "feat: add customer records and balance summary"`

### Task 3: İşler, durum geçmişi ve satış defteri transaction'ı

**Files:**
- Create: `backend/internal/jobs/model.go`, `service.go`, `repository.go`, `handler.go`
- Modify: `backend/internal/ledger/repository.go`, `backend/internal/platform/router.go`
- Test: `backend/internal/jobs/service_test.go`, `backend/internal/jobs/handler_test.go`

**Interfaces:**
- Consumes: `CreateCustomer`, customer lookup repository and ledger repository.
- Produces: `CreateJob(ctx context.Context, input CreateJobInput) (Job, error)`, `ChangeJobStatus(ctx context.Context, jobID uuid.UUID, input ChangeStatusInput) (Job, error)`, `ListJobs(ctx context.Context, filters JobFilters) ([]JobListItem, error)`.

- [ ] **Step 1: Write failing job service tests**

Assert that a valid job creates a `job_sale` ledger transaction, duplicate job number fails, non-positive quantity/unit price fails, total is stored as exact decimal multiplication, and an injected ledger write failure rolls back the job.

- [ ] **Step 2: Run tests and verify failure**

Run: `cd backend && go test ./internal/jobs -v`
Expected: FAIL because job service is absent.

- [ ] **Step 3: Implement job CRUD and status interfaces**

Provide `GET/POST /api/v1/jobs`, `GET/PATCH /api/v1/jobs/:id` and `POST /api/v1/jobs/:id/status`. Use a PostgreSQL transaction in `CreateJob`; write the initial `job_status_history` row and `customer_transactions` sale row with the job. Permit only spec-defined statuses.

- [ ] **Step 4: Run job and API tests**

Run: `cd backend && go test ./internal/jobs ./... -v`
Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add backend && git commit -m "feat: add jobs and customer ledger sales"`

### Task 4: Dashboard API

**Files:**
- Create: `backend/internal/dashboard/model.go`, `repository.go`, `service.go`, `handler.go`
- Modify: `backend/internal/platform/router.go`
- Test: `backend/internal/dashboard/service_test.go`, `backend/internal/dashboard/handler_test.go`

**Interfaces:**
- Consumes: jobs and ledger database tables.
- Produces: `GetDashboard(ctx context.Context, today time.Time) (DashboardSummary, error)`.

- [ ] **Step 1: Write failing dashboard tests**

Seed new, ready, overdue and delivered jobs plus sales; assert active, due-today, overdue, ready counts and total customer receivable values.

- [ ] **Step 2: Run dashboard tests and verify failure**

Run: `cd backend && go test ./internal/dashboard -v`
Expected: FAIL because dashboard package is absent.

- [ ] **Step 3: Implement `GET /api/v1/dashboard`**

Return the four job counts and total receivable with a single read model service. Overdue means delivery date before the supplied local date and status is neither delivered nor cancelled.

- [ ] **Step 4: Run dashboard tests**

Run: `cd backend && go test ./internal/dashboard -v`
Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add backend && git commit -m "feat: add dashboard summary API"`

### Task 5: React uygulama kabuğu ve API istemcisi

**Files:**
- Create: `frontend/package.json`, `vite.config.ts`, `tsconfig.json`, `src/main.tsx`, `src/App.tsx`
- Create: `frontend/src/lib/api.ts`, `frontend/src/lib/money.ts`, `frontend/src/styles.css`
- Create: `frontend/src/components/AppShell.tsx`, `PageHeader.tsx`, `ErrorState.tsx`, `LoadingState.tsx`
- Test: `frontend/src/lib/money.test.ts`, `frontend/src/components/AppShell.test.tsx`

**Interfaces:**
- Consumes: API base URL from `VITE_API_BASE_URL`.
- Produces: `api<T>(path: string, options?: RequestInit): Promise<T>`, `formatTRY(amount: string): string` and `AppShell({ children }: PropsWithChildren)`.

- [ ] **Step 1: Write failing money formatting and shell tests**

Assert `formatTRY("184500.00")` renders a Turkish TRY amount and navigation displays Ana Sayfa, İşler and Müşteriler.

- [ ] **Step 2: Run frontend tests and verify failure**

Run: `cd frontend && npm test -- --run`
Expected: FAIL because frontend package is absent.

- [ ] **Step 3: Implement frontend foundation**

Set up Vite, React Router, typed fetch wrapper with API error extraction, responsive app shell, shared loading/error components and non-float money presentation.

- [ ] **Step 4: Run frontend checks**

Run: `cd frontend && npm test -- --run && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add frontend && git commit -m "feat: add ERP management panel shell"`

### Task 6: Dashboard, müşteri ve iş ekranlarının API entegrasyonu

**Files:**
- Create: `frontend/src/pages/DashboardPage.tsx`, `CustomersPage.tsx`, `CustomerDetailPage.tsx`, `JobsPage.tsx`, `JobFormPage.tsx`, `JobDetailPage.tsx`
- Create: `frontend/src/components/MetricCard.tsx`, `CustomerForm.tsx`, `JobForm.tsx`, `JobStatusControl.tsx`
- Modify: `frontend/src/App.tsx`, `frontend/src/lib/api.ts`, `frontend/src/styles.css`
- Test: `frontend/src/pages/DashboardPage.test.tsx`, `CustomersPage.test.tsx`, `JobFormPage.test.tsx`

**Interfaces:**
- Consumes: endpoints in Tasks 2–4 and `api<T>`, `formatTRY`.
- Produces: Routes `/`, `/customers`, `/customers/:id`, `/jobs`, `/jobs/new`, `/jobs/:id`.

- [ ] **Step 1: Write failing page tests**

Mock API responses and assert dashboard metrics render, customer search updates the request, invalid customer/job form values show Turkish errors, and status change posts the selected allowed status.

- [ ] **Step 2: Run frontend page tests and verify failure**

Run: `cd frontend && npm test -- --run`
Expected: FAIL because pages are absent.

- [ ] **Step 3: Implement API-backed pages**

Build simple list/detail/form views. Keep required job fields visible; place note and optional pattern-reference text field under “Diğer Bilgiler”. Add no mock data. Use a compact status control in the job detail view and show customer balance, active jobs and transaction list on customer detail.

- [ ] **Step 4: Run frontend tests and production build**

Run: `cd frontend && npm test -- --run && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add frontend && git commit -m "feat: add customer and job management screens"`

### Task 7: Uçtan uca yerel doğrulama ve kullanım belgeleri

**Files:**
- Create: `README.md`
- Modify: `docker-compose.yml`, `.env.example`
- Test: `backend/internal/integration/erp_flow_test.go`

**Interfaces:**
- Consumes: all preceding API and UI interfaces.
- Produces: documented `docker compose up --build` local start flow.

- [ ] **Step 1: Write failing end-to-end API flow test**

Create a customer, create a job, change it to ready, fetch customer detail and dashboard; assert the sale amount is reflected in both balance and receivable summary.

- [ ] **Step 2: Run integration test and verify failure before wiring**

Run: `cd backend && go test ./internal/integration -v`
Expected: FAIL until the full service composition is available.

- [ ] **Step 3: Complete production wiring and README**

Document prerequisites, initial environment setup, start/stop commands, migration behavior, local URLs and the local-network single-user security assumption. Ensure Compose waits for database health before API startup.

- [ ] **Step 4: Run complete verification**

Run: `cd backend && go test ./...` then `cd ../frontend && npm test -- --run && npm run build` then `docker compose up --build`
Expected: all test suites and frontend build pass; browser can create a customer and job against the running API.

- [ ] **Step 5: Commit**

Run: `git add README.md .env.example docker-compose.yml backend frontend && git commit -m "docs: add local ERP setup guide"`
