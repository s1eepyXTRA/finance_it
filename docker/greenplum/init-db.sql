CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category VARCHAR(50) NOT NULL,
    cost NUMERIC(12, 2) NOT NULL,
    CONSTRAINT chk_category CHECK (
        category IN (
            'Продукты',
            'Сладкое',
            'Заказы на дом',
            'Такси',
            'Интернет/Связь',
            'Хозяйственное',
            'Аптека',
            'Отдых/Развлечения'
        )
    )
);

CREATE TABLE income (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    profit NUMERIC(12, 2) NOT NULL
);

CREATE TABLE constants (
    id SERIAL PRIMARY KEY,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC(12, 2) NOT NULL,
    start_date DATE NOT NULL,
    description VARCHAR(200) NOT NULL DEFAULT ''
);
