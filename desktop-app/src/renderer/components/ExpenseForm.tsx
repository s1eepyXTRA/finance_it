import React, { useState, useEffect } from 'react';
import CategoryManager from './CategoryManager';

interface Props {
  onSubmit: (date: string, category: string, cost: number) => Promise<void>;
}

export default function ExpenseForm({ onSubmit }: Props) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [cost, setCost] = useState('');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [showManager, setShowManager] = useState(false);

  const loadCategories = async () => {
    try {
      const cats = await window.api.getCategories();
      setCategories(cats);
      if (cats.length > 0 && !category) setCategory(cats[0].name);
    } catch {}
  };

  useEffect(() => { loadCategories(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cost || parseFloat(cost) <= 0) return;
    setLoading(true);
    try {
      await onSubmit(date, category, parseFloat(cost));
      setCost('');
    } finally {
      setLoading(false);
    }
  };

  const handleManagerClose = () => {
    setShowManager(false);
    loadCategories();
  };

  return (
    <>
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
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-text-secondary">Категория</label>
            <button
              type="button"
              onClick={() => setShowManager(true)}
              className="p-1 text-text-secondary hover:text-text-primary transition-colors rounded-md hover:bg-bg-secondary"
              title="Управление категориями"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.5 1.75a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM8 3.25a1.75 1.75 0 0 0 1.668-1.225 8 8 0 0 1 .87.44l-.328.568a1.75 1.75 0 1 0 1.757 1.757l.568-.328c.183.278.34.57.47.87A1.75 1.75 0 1 0 12.78 6.5h.47a8 8 0 0 1 0 3h-.47a1.75 1.75 0 1 0-.225 1.168l-.568.328a1.75 1.75 0 1 0-1.757 1.757l.328.568a8 8 0 0 1-.87.44A1.75 1.75 0 1 0 8 12.75a1.75 1.75 0 0 0-1.668 1.225 8 8 0 0 1-.87-.44l.328-.568a1.75 1.75 0 1 0-1.757-1.757l-.568.328a8 8 0 0 1-.44-.87A1.75 1.75 0 1 0 3.25 9.5h-.47a8 8 0 0 1 0-3h.47a1.75 1.75 0 1 0 .225-1.168l.568-.328A1.75 1.75 0 1 0 5.8 3.247l-.328-.568a8 8 0 0 1 .87-.44A1.75 1.75 0 0 0 8 3.25Z" fill="currentColor" fillRule="evenodd"/>
                <path d="M8 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm0-1a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" fill="currentColor" fillRule="evenodd"/>
              </svg>
            </button>
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-border rounded-lg text-sm text-text-primary appearance-none cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Стоимость, ₽</label>
          <input
            type="number"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="0.00"
            min="0.01"
            step="0.01"
            className="w-full px-4 py-2.5 bg-white border border-border rounded-lg text-sm text-text-primary"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || !cost}
          className="w-full py-2.5 bg-text-primary text-white text-sm font-medium rounded-lg
            hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Сохранение...' : 'Добавить расход'}
        </button>
      </form>

      {showManager && <CategoryManager onClose={handleManagerClose} />}
    </>
  );
}
