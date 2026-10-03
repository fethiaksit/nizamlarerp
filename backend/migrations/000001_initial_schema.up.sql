CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    contact_name TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    tax_office TEXT NOT NULL DEFAULT '',
    tax_number TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT customers_company_name_not_blank CHECK (length(btrim(company_name)) > 0)
);

CREATE UNIQUE INDEX customers_company_name_unique
    ON customers (lower(btrim(company_name)));
CREATE INDEX customers_phone_idx ON customers (phone);

CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    job_number TEXT NOT NULL UNIQUE,
    pattern_name TEXT NOT NULL DEFAULT '',
    pattern_code TEXT NOT NULL DEFAULT '',
    pattern_reference TEXT NOT NULL DEFAULT '',
    fabric_info TEXT NOT NULL DEFAULT '',
    print_type TEXT NOT NULL DEFAULT '',
    color_info TEXT NOT NULL DEFAULT '',
    quantity NUMERIC(14,3) NOT NULL,
    unit TEXT NOT NULL,
    unit_price NUMERIC(14,2) NOT NULL,
    total_amount NUMERIC(14,2) NOT NULL,
    order_date DATE NOT NULL,
    delivery_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'yeni',
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT jobs_quantity_positive CHECK (quantity > 0),
    CONSTRAINT jobs_unit_price_nonnegative CHECK (unit_price >= 0),
    CONSTRAINT jobs_total_amount_nonnegative CHECK (total_amount >= 0),
    CONSTRAINT jobs_status_valid CHECK (status IN (
        'yeni', 'desen_hazirlaniyor', 'onay_bekliyor', 'baskida',
        'hazir', 'teslim_edildi', 'iptal_edildi'
    ))
);

CREATE INDEX jobs_customer_id_idx ON jobs (customer_id);
CREATE INDEX jobs_pattern_code_idx ON jobs (pattern_code);
CREATE INDEX jobs_delivery_date_idx ON jobs (delivery_date);

CREATE TABLE job_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id),
    previous_status TEXT,
    new_status TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX job_status_history_job_id_idx ON job_status_history (job_id, created_at DESC);

CREATE TABLE customer_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    job_id UUID REFERENCES jobs(id),
    entry_type TEXT NOT NULL,
    direction TEXT NOT NULL,
    amount NUMERIC(14,2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'TRY',
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    reversal_of UUID REFERENCES customer_transactions(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT customer_transactions_type_valid CHECK (entry_type IN (
        'job_sale', 'collection', 'payment', 'received_check', 'issued_check', 'adjustment'
    )),
    CONSTRAINT customer_transactions_direction_valid CHECK (direction IN ('debit', 'credit')),
    CONSTRAINT customer_transactions_amount_positive CHECK (amount > 0)
);

CREATE INDEX customer_transactions_customer_idx
    ON customer_transactions (customer_id, transaction_date DESC);
CREATE INDEX customer_transactions_job_idx ON customer_transactions (job_id);

-- Cash & Bank accounts
CREATE TABLE IF NOT EXISTS cash_bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    account_type TEXT NOT NULL DEFAULT 'kasa', -- 'kasa', 'banka'
    bank_name TEXT NOT NULL DEFAULT '',
    iban TEXT NOT NULL DEFAULT '',
    currency CHAR(3) NOT NULL DEFAULT 'TRY',
    balance NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Finance transactions (Gelir, Gider, Kasa/Banka Hareketleri)
CREATE TABLE IF NOT EXISTS finance_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES cash_bank_accounts(id),
    customer_id UUID REFERENCES customers(id),
    entry_type TEXT NOT NULL, -- 'gelir', 'gider', 'tahsilat', 'odeme'
    category TEXT NOT NULL DEFAULT 'genel', -- 'baski_satisi', 'hammadde', 'kira', 'fatura', 'maas', 'yakit', 'diger'
    amount NUMERIC(14,2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'TRY',
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT finance_transactions_amount_positive CHECK (amount > 0),
    CONSTRAINT finance_transactions_type_valid CHECK (entry_type IN ('gelir', 'gider', 'tahsilat', 'odeme'))
);

-- Checks (Çekler)
CREATE TABLE IF NOT EXISTS checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    check_number TEXT NOT NULL,
    bank_name TEXT NOT NULL DEFAULT '',
    drawer TEXT NOT NULL DEFAULT '',
    amount NUMERIC(14,2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'TRY',
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    check_type TEXT NOT NULL DEFAULT 'alacak', -- 'alacak', 'borc'
    status TEXT NOT NULL DEFAULT 'portfoyde', -- 'portfoyde', 'tahsil_edildi', 'odendi', 'karsiliksiz', 'iadeli'
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT checks_amount_positive CHECK (amount > 0),
    CONSTRAINT checks_type_valid CHECK (check_type IN ('alacak', 'borc')),
    CONSTRAINT checks_status_valid CHECK (status IN ('portfoyde', 'tahsil_edildi', 'odendi', 'karsiliksiz', 'iadeli'))
);

-- Personnel (Personel)
CREATE TABLE IF NOT EXISTS personnel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    monthly_salary NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Personnel Payments (Maaş / Avans Ödemeleri)
CREATE TABLE IF NOT EXISTS personnel_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personnel_id UUID NOT NULL REFERENCES personnel(id),
    account_id UUID REFERENCES cash_bank_accounts(id),
    payment_type TEXT NOT NULL DEFAULT 'maas', -- 'maas', 'avans', 'prim'
    amount NUMERIC(14,2) NOT NULL,
    payment_date DATE NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT personnel_payments_amount_positive CHECK (amount > 0)
);

-- System Settings
CREATE TABLE IF NOT EXISTS company_settings (
    id INT PRIMARY KEY DEFAULT 1,
    company_title TEXT NOT NULL DEFAULT 'Nizamlar Tekstil Baskı San. ve Tic. Ltd. Şti.',
    phone TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    tax_office TEXT NOT NULL DEFAULT '',
    tax_number TEXT NOT NULL DEFAULT '',
    currency CHAR(3) NOT NULL DEFAULT 'TRY',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT company_settings_single_row CHECK (id = 1)
);

-- Indexes
CREATE INDEX IF NOT EXISTS finance_transactions_date_idx ON finance_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS finance_transactions_customer_idx ON finance_transactions(customer_id);
CREATE INDEX IF NOT EXISTS checks_due_date_idx ON checks(due_date);
CREATE INDEX IF NOT EXISTS checks_customer_idx ON checks(customer_id);
CREATE INDEX IF NOT EXISTS personnel_payments_personnel_idx ON personnel_payments(personnel_id);

-- Insert default cash and bank accounts if table empty
INSERT INTO cash_bank_accounts (name, account_type, bank_name, iban, balance)
SELECT 'Merkez Kasa', 'kasa', '', '', 0.00
WHERE NOT EXISTS (SELECT 1 FROM cash_bank_accounts WHERE account_type = 'kasa');

INSERT INTO cash_bank_accounts (name, account_type, bank_name, iban, balance)
SELECT 'Ana Banka Hesabı', 'banka', 'Ziraat Bankası', 'TR000000000000000000000000', 0.00
WHERE NOT EXISTS (SELECT 1 FROM cash_bank_accounts WHERE account_type = 'banka');

INSERT INTO company_settings (id, company_title, phone, email, address, tax_office, tax_number)
VALUES (1, 'Nizamlar Tekstil Baskı San. ve Tic. Ltd. Şti.', '0212 555 0000', 'info@nizamlar.com', 'İstanbul, Türkiye', 'Esenler', '1234567890')
ON CONFLICT (id) DO NOTHING;

