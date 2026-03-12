import React, { useState, useEffect } from 'react';

interface Constant {
  id: number;
  type: string;
  amount: number;
  start_date: string;
  description: string;
}

export default function ConstantsTab() {
  const [constants, setConstants] = useState<Constant[]>([]);
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadConstants = async () => {
    try {
      const data = await window.api.getConstants();
      setConstants(data);
    } catch {}
  };

  useEffect(() => { loadConstants(); }, []);

  const resetForm = () => {
    setType('income');
    setAmount('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;

    try {
      if (editingId !== null) {
        await window.api.updateConstant(editingId, type, numAmount, startDate, description);
        setStatus({ type: 'success', message: 'Константа обновлена' });
      } else {
        await window.api.insertConstant(type, numAmount, startDate, description);
        setStatus({ type: 'success', message: 'Константа добавлена' });
      }
      resetForm();
      loadConstants();
      setTimeout(() => setStatus(null), 3000);
    } catch {
      setStatus({ type: 'error', message: 'Ошибка при сохранении' });
    }
  };

  const handleEdit = (c: Constant) => {
    setEditingId(c.id);
    setType(c.type as 'income' | 'expense');
    setAmount(String(c.amount));
    setStartDate(c.start_date);
    setDescription(c.description);
  };

  const handleDelete = async (id: number) => {
    try {
      await window.api.deleteConstant(id);
      if (editingId === id) resetForm();
      loadConstants();
    } catch {
      setStatus({ type: 'error', message: 'Ошибка при удалении' });
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const incomeConstants = constants.filter(c => c.type === 'income');
  const expenseConstants = constants.filter(c => c.type === 'expense');
  const totalIncome = incomeConstants.reduce((s, c) => s + c.amount, 0);
  const totalExpense = expenseConstants.reduce((s, c) => s + c.amount, 0);
  const freeMonthly = totalIncome - totalExpense;

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-border rounded-2xl p-5">
          <p className="text-xs text-text-secondary mb-1">Постоянный доход</p>
          <p className="text-2xl font-semibold text-success tracking-tight">
            {totalIncome.toLocaleString('ru-RU')} <span className="text-base font-normal">₽/мес</span>
          </p>
        </div>
        <div className="bg-white border border-border rounded-2xl p-5">
          <p className="text-xs text-text-secondary mb-1">Постоянный расход</p>
          <p className="text-2xl font-semibold text-danger tracking-tight">
            {totalExpense.toLocaleString('ru-RU')} <span className="text-base font-normal">₽/мес</span>
          </p>
        </div>
        <div className="bg-white border border-border rounded-2xl p-5">
          <p className="text-xs text-text-secondary mb-1">Свободные деньги</p>
          <p className={`text-2xl font-semibold tracking-tight ${freeMonthly >= 0 ? 'text-success' : 'text-danger'}`}>
            {freeMonthly.toLocaleString('ru-RU')} <span className="text-base font-normal">₽/мес</span>
          </p>
        </div>
      </div>

      {/* Status */}
      {status && (
        <div className={`text-center text-sm py-2 rounded-lg ${
          status.type === 'success' ? 'text-success bg-green-50' : 'text-danger bg-red-50'
        }`}>
          {status.message}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-4">
        <h3 className="text-sm font-medium text-text-secondary">
          {editingId !== null ? 'Редактирование константы' : 'Добавить константу'}
        </h3>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              type === 'income'
                ? 'bg-success/10 text-success border border-success/30'
                : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            Доход
          </button>
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              type === 'expense'
                ? 'bg-danger/10 text-danger border border-danger/30'
                : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            Расход
          </button>
        </div>

        <input
          type="text"
          placeholder="Описание (напр. Зарплата, Аренда)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-3 border border-border rounded-xl bg-white text-sm
                     focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
        />

        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            placeholder="Сумма"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.01"
            required
            className="px-4 py-3 border border-border rounded-xl bg-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
          />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="px-4 py-3 border border-border rounded-xl bg-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 bg-text-primary text-white py-3 rounded-xl text-sm font-medium
                       hover:bg-black/80 active:scale-[0.98] transition-all"
          >
            {editingId !== null ? 'Сохранить' : 'Добавить'}
          </button>
          {editingId !== null && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-3 rounded-xl text-sm font-medium border border-border
                         text-text-secondary hover:text-text-primary hover:bg-white transition-all"
            >
              Отмена
            </button>
          )}
        </div>
      </form>

      {/* List */}
      <div className="max-w-2xl mx-auto space-y-6">
        {incomeConstants.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Постоянные доходы</h3>
            <div className="space-y-2">
              {incomeConstants.map(c => (
                <div key={c.id} className="flex items-center justify-between py-3 px-4 bg-white rounded-lg border border-border">
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-text-secondary">с {formatDate(c.start_date)}</span>
                    <span className="text-sm font-medium">{c.description || 'Доход'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-success">
                      +{c.amount.toLocaleString('ru-RU')} ₽
                    </span>
                    <button onClick={() => handleEdit(c)}
                      className="text-text-secondary hover:text-text-primary transition-colors text-xs" title="Редактировать">
                      &#9998;
                    </button>
                    <button onClick={() => handleDelete(c.id)}
                      className="text-text-secondary hover:text-danger transition-colors text-xs" title="Удалить">
                      &#10005;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {expenseConstants.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Постоянные расходы</h3>
            <div className="space-y-2">
              {expenseConstants.map(c => (
                <div key={c.id} className="flex items-center justify-between py-3 px-4 bg-white rounded-lg border border-border">
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-text-secondary">с {formatDate(c.start_date)}</span>
                    <span className="text-sm font-medium">{c.description || 'Расход'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-danger">
                      -{c.amount.toLocaleString('ru-RU')} ₽
                    </span>
                    <button onClick={() => handleEdit(c)}
                      className="text-text-secondary hover:text-text-primary transition-colors text-xs" title="Редактировать">
                      &#9998;
                    </button>
                    <button onClick={() => handleDelete(c.id)}
                      className="text-text-secondary hover:text-danger transition-colors text-xs" title="Удалить">
                      &#10005;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {constants.length === 0 && (
          <p className="text-sm text-text-secondary text-center py-8">
            Нет констант. Добавьте постоянные доходы и расходы для отображения лимитов на графиках.
          </p>
        )}
      </div>
    </div>
  );
}
