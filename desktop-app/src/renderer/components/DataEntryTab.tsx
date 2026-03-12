import React, { useState, useEffect } from 'react';
import ExpenseForm from './ExpenseForm';
import IncomeForm from './IncomeForm';

type Mode = 'expense' | 'income';

interface ExpenseRecord {
  id: number;
  date: string;
  category: string;
  cost: number;
}

interface IncomeRecord {
  id: number;
  date: string;
  profit: number;
}

export default function DataEntryTab() {
  const [mode, setMode] = useState<Mode>('expense');
  const [recentExpenses, setRecentExpenses] = useState<ExpenseRecord[]>([]);
  const [recentIncome, setRecentIncome] = useState<IncomeRecord[]>([]);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadRecent = async () => {
    try {
      const [expenses, income] = await Promise.all([
        window.api.getRecentExpenses(10),
        window.api.getRecentIncome(10),
      ]);
      setRecentExpenses(expenses);
      setRecentIncome(income);
    } catch {
      // DB might not be available yet
    }
  };

  useEffect(() => {
    loadRecent();
  }, []);

  const handleExpenseSubmit = async (date: string, category: string, cost: number) => {
    try {
      await window.api.insertExpense(date, category, cost);
      setStatus({ type: 'success', message: 'Расход добавлен' });
      loadRecent();
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setStatus({ type: 'error', message: 'Ошибка при добавлении расхода' });
    }
  };

  const handleIncomeSubmit = async (date: string, profit: number) => {
    try {
      await window.api.insertIncome(date, profit);
      setStatus({ type: 'success', message: 'Доход добавлен' });
      loadRecent();
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setStatus({ type: 'error', message: 'Ошибка при добавлении дохода' });
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      await window.api.deleteExpense(id);
      loadRecent();
    } catch {
      setStatus({ type: 'error', message: 'Ошибка при удалении' });
    }
  };

  const handleDeleteIncome = async (id: number) => {
    try {
      await window.api.deleteIncome(id);
      loadRecent();
    } catch {
      setStatus({ type: 'error', message: 'Ошибка при удалении' });
    }
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="space-y-8">
      {/* Mode Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex bg-bg-secondary rounded-lg p-1">
          <button
            onClick={() => setMode('expense')}
            className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
              mode === 'expense'
                ? 'bg-white text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Расходы
          </button>
          <button
            onClick={() => setMode('income')}
            className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
              mode === 'income'
                ? 'bg-white text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Доходы
          </button>
        </div>
      </div>

      {/* Status Message */}
      {status && (
        <div
          className={`text-center text-sm py-2 rounded-lg transition-opacity ${
            status.type === 'success'
              ? 'text-success bg-green-50'
              : 'text-danger bg-red-50'
          }`}
        >
          {status.message}
        </div>
      )}

      {/* Form */}
      <div className="max-w-lg mx-auto">
        {mode === 'expense' ? (
          <ExpenseForm onSubmit={handleExpenseSubmit} />
        ) : (
          <IncomeForm onSubmit={handleIncomeSubmit} />
        )}
      </div>

      {/* Recent Records */}
      <div className="max-w-2xl mx-auto">
        <h3 className="text-sm font-medium text-text-secondary mb-4">
          {mode === 'expense' ? 'Последние расходы' : 'Последние доходы'}
        </h3>

        {mode === 'expense' ? (
          <div className="space-y-2">
            {recentExpenses.length === 0 ? (
              <p className="text-sm text-text-secondary text-center py-8">Нет записей</p>
            ) : (
              recentExpenses.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 px-4 bg-white rounded-lg border border-border"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-text-secondary">{formatDate(item.date)}</span>
                    <span className="text-sm font-medium">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-danger">
                      -{Number(item.cost).toLocaleString('ru-RU')} ₽
                    </span>
                    <button
                      onClick={() => handleDeleteExpense(item.id)}
                      className="text-text-secondary hover:text-danger transition-colors text-xs"
                      title="Удалить"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {recentIncome.length === 0 ? (
              <p className="text-sm text-text-secondary text-center py-8">Нет записей</p>
            ) : (
              recentIncome.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 px-4 bg-white rounded-lg border border-border"
                >
                  <span className="text-xs text-text-secondary">{formatDate(item.date)}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-success">
                      +{Number(item.profit).toLocaleString('ru-RU')} ₽
                    </span>
                    <button
                      onClick={() => handleDeleteIncome(item.id)}
                      className="text-text-secondary hover:text-danger transition-colors text-xs"
                      title="Удалить"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
