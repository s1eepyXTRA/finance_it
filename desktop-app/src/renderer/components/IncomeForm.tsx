import React, { useState } from 'react';

interface Props {
  onSubmit: (date: string, profit: number) => Promise<void>;
}

export default function IncomeForm({ onSubmit }: Props) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [profit, setProfit] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profit || parseFloat(profit) <= 0) return;

    setLoading(true);
    try {
      await onSubmit(date, parseFloat(profit));
      setProfit('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Дата</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-2.5 bg-white border border-border rounded-lg text-sm text-text-primary"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Прибыль, ₽</label>
        <input
          type="number"
          value={profit}
          onChange={(e) => setProfit(e.target.value)}
          placeholder="0.00"
          min="0.01"
          step="0.01"
          className="w-full px-4 py-2.5 bg-white border border-border rounded-lg text-sm text-text-primary"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading || !profit}
        className="w-full py-2.5 bg-text-primary text-white text-sm font-medium rounded-lg
          hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Сохранение...' : 'Добавить доход'}
      </button>
    </form>
  );
}
