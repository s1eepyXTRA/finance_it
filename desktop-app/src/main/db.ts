import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.GP_HOST || 'localhost',
  port: parseInt(process.env.GP_PORT || '5432'),
  database: process.env.GP_DB || 'tracker',
  user: process.env.GP_USER || 'gpadmin',
  password: process.env.GP_PASSWORD || 'tracker123',
  max: 5,
});

export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (err) {
    console.error('Database connection failed:', err);
    return false;
  }
}

// --- Categories ---

export async function ensureCategoriesTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      sort_order INT NOT NULL DEFAULT 0
    )
  `);
  // Seed defaults if empty
  const { rows } = await pool.query('SELECT COUNT(*) AS cnt FROM categories');
  if (parseInt(rows[0].cnt) === 0) {
    const defaults = [
      'Продукты', 'Сладкое', 'Заказы на дом', 'Такси',
      'Интернет/Связь', 'Хозяйственное', 'Аптека', 'Отдых/Развлечения',
    ];
    for (let i = 0; i < defaults.length; i++) {
      await pool.query('INSERT INTO categories (name, sort_order) VALUES ($1, $2)', [defaults[i], i]);
    }
  }
  // Drop CHECK constraint if exists (allow dynamic categories)
  await pool.query(`
    ALTER TABLE expenses DROP CONSTRAINT IF EXISTS chk_category
  `);
}

export async function getCategories() {
  const result = await pool.query('SELECT id, name FROM categories ORDER BY sort_order, id');
  return result.rows;
}

export async function addCategory(name: string) {
  const result = await pool.query(
    'INSERT INTO categories (name, sort_order) VALUES ($1, (SELECT COALESCE(MAX(sort_order),0)+1 FROM categories)) RETURNING id, name',
    [name]
  );
  return result.rows[0];
}

export async function renameCategory(id: number, newName: string) {
  const { rows } = await pool.query('SELECT name FROM categories WHERE id = $1', [id]);
  if (rows.length > 0) {
    const oldName = rows[0].name;
    await pool.query('UPDATE categories SET name = $1 WHERE id = $2', [newName, id]);
    await pool.query('UPDATE expenses SET category = $1 WHERE category = $2', [newName, oldName]);
  }
}

export async function deleteCategory(id: number) {
  await pool.query('DELETE FROM categories WHERE id = $1', [id]);
}

// --- CRUD ---

export async function insertExpense(date: string, category: string, cost: number): Promise<void> {
  await pool.query(
    'INSERT INTO expenses (date, category, cost) VALUES ($1, $2, $3)',
    [date, category, cost]
  );
}

export async function insertIncome(date: string, profit: number): Promise<void> {
  await pool.query(
    'INSERT INTO income (date, profit) VALUES ($1, $2)',
    [date, profit]
  );
}

export async function getRecentExpenses(limit: number = 10) {
  const result = await pool.query(
    'SELECT id, date, category, cost FROM expenses ORDER BY date DESC, id DESC LIMIT $1',
    [limit]
  );
  return result.rows;
}

export async function getRecentIncome(limit: number = 10) {
  const result = await pool.query(
    'SELECT id, date, profit FROM income ORDER BY date DESC, id DESC LIMIT $1',
    [limit]
  );
  return result.rows;
}

export async function deleteExpense(id: number): Promise<void> {
  await pool.query('DELETE FROM expenses WHERE id = $1', [id]);
}

export async function deleteIncome(id: number): Promise<void> {
  await pool.query('DELETE FROM income WHERE id = $1', [id]);
}

// --- Statistics with date filter ---

export async function getExpensesByCategory(since?: string) {
  const where = since ? 'WHERE date >= $1' : '';
  const params = since ? [since] : [];
  const result = await pool.query(
    `SELECT category, SUM(cost)::float AS total FROM expenses ${where} GROUP BY category ORDER BY total DESC`,
    params
  );
  return result.rows;
}

export async function getSummary(since?: string) {
  const where = since ? 'WHERE date >= $1' : '';
  const params = since ? [since] : [];
  const expRes = await pool.query(`SELECT COALESCE(SUM(cost), 0)::float AS total FROM expenses ${where}`, params);
  const incRes = await pool.query(`SELECT COALESCE(SUM(profit), 0)::float AS total FROM income ${where}`, params);
  return {
    totalExpenses: expRes.rows[0].total,
    totalIncome: incRes.rows[0].total,
    balance: incRes.rows[0].total - expRes.rows[0].total,
  };
}

export async function getExpensesByDate(since?: string) {
  const where = since ? 'WHERE date >= $1' : '';
  const params = since ? [since] : [];
  const result = await pool.query(
    `SELECT date::text, SUM(cost)::float AS total FROM expenses ${where} GROUP BY date ORDER BY date`,
    params
  );
  return result.rows;
}

export async function getDailyExpensesByCategory(since?: string) {
  const where = since ? 'WHERE date >= $1' : '';
  const params = since ? [since] : [];
  const result = await pool.query(`
    SELECT date::text, category, SUM(cost)::float AS total
    FROM expenses ${where}
    GROUP BY date, category
    ORDER BY date
  `, params);
  return result.rows;
}

export async function getMonthlyExpensesByCategory(since?: string) {
  const where = since ? 'WHERE date >= $1' : '';
  const params = since ? [since] : [];
  const result = await pool.query(`
    SELECT TO_CHAR(date, 'YYYY-MM') AS month, category, SUM(cost)::float AS total
    FROM expenses ${where}
    GROUP BY 1, category
    ORDER BY 1
  `, params);
  return result.rows;
}

export async function getIncomeByDate(since?: string) {
  const where = since ? 'WHERE date >= $1' : '';
  const params = since ? [since] : [];
  const result = await pool.query(
    `SELECT date::text, SUM(profit)::float AS total FROM income ${where} GROUP BY date ORDER BY date`,
    params
  );
  return result.rows;
}

export async function getMonthlyBalance(since?: string) {
  const incWhere = since ? 'WHERE date >= $1' : '';
  const expWhere = since ? 'WHERE date >= $2' : '';
  const params = since ? [since, since] : [];
  const result = await pool.query(`
    SELECT month,
           COALESCE(inc, 0)::float AS income,
           COALESCE(exp, 0)::float AS expenses
    FROM (
      SELECT TO_CHAR(date, 'YYYY-MM') AS month, SUM(profit) AS inc
      FROM income ${incWhere} GROUP BY 1
    ) i
    FULL OUTER JOIN (
      SELECT TO_CHAR(date, 'YYYY-MM') AS month, SUM(cost) AS exp
      FROM expenses ${expWhere} GROUP BY 1
    ) e USING (month)
    ORDER BY month
  `, params);
  return result.rows;
}

// --- Constants ---

export async function ensureConstantsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS constants (
      id SERIAL PRIMARY KEY,
      type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
      amount NUMERIC(12, 2) NOT NULL,
      start_date DATE NOT NULL,
      description VARCHAR(200) NOT NULL DEFAULT ''
    )
  `);
}

export async function getConstants() {
  const result = await pool.query(
    'SELECT id, type, amount::float, start_date::text AS start_date, description FROM constants ORDER BY type, start_date DESC'
  );
  return result.rows;
}

export async function insertConstant(type: string, amount: number, startDate: string, description: string) {
  const result = await pool.query(
    'INSERT INTO constants (type, amount, start_date, description) VALUES ($1, $2, $3, $4) RETURNING id, type, amount::float, start_date::text AS start_date, description',
    [type, amount, startDate, description]
  );
  return result.rows[0];
}

export async function updateConstant(id: number, type: string, amount: number, startDate: string, description: string) {
  await pool.query(
    'UPDATE constants SET type = $1, amount = $2, start_date = $3, description = $4 WHERE id = $5',
    [type, amount, startDate, description, id]
  );
}

export async function deleteConstant(id: number): Promise<void> {
  await pool.query('DELETE FROM constants WHERE id = $1', [id]);
}

export async function getActiveConstants(forDate?: string) {
  const date = forDate || new Date().toISOString().split('T')[0];
  const result = await pool.query(
    `SELECT type, SUM(amount)::float AS total
     FROM constants
     WHERE start_date <= $1
     GROUP BY type`,
    [date]
  );
  const map: { income: number; expense: number } = { income: 0, expense: 0 };
  for (const row of result.rows) {
    map[row.type as 'income' | 'expense'] = row.total;
  }
  return map;
}

export { pool };
