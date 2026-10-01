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
        'job_sale', 'collection', 'received_check', 'adjustment'
    )),
    CONSTRAINT customer_transactions_direction_valid CHECK (direction IN ('debit', 'credit')),
    CONSTRAINT customer_transactions_amount_positive CHECK (amount > 0)
);

CREATE INDEX customer_transactions_customer_idx
    ON customer_transactions (customer_id, transaction_date DESC);
CREATE INDEX customer_transactions_job_idx ON customer_transactions (job_id);
