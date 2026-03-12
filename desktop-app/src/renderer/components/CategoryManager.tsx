import React, { useState, useEffect } from 'react';

interface Props {
  onClose: () => void;
}

export default function CategoryManager({ onClose }: Props) {
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const load = async () => {
    try {
      setCategories(await window.api.getCategories());
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      await window.api.addCategory(name);
      setNewName('');
      load();
    } catch {}
  };

  const handleRename = async (id: number) => {
    const name = editingName.trim();
    if (!name) return;
    try {
      await window.api.renameCategory(id, name);
      setEditingId(null);
      setEditingName('');
      load();
    } catch {}
  };

  const handleDelete = async (id: number) => {
    try {
      await window.api.deleteCategory(id);
      load();
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl border border-border shadow-xl w-full max-w-md mx-4
                      animate-[modalIn_0.2s_ease-out]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary">Управление категориями</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* List */}
        <div className="px-6 py-4 max-h-72 overflow-y-auto space-y-1.5">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2 group">
              {editingId === cat.id ? (
                <>
                  <input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRename(cat.id)}
                    className="flex-1 px-3 py-1.5 bg-bg border border-accent rounded-lg text-sm text-text-primary focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => handleRename(cat.id)}
                    className="text-xs text-success hover:text-green-700 transition-colors px-2 py-1"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => { setEditingId(null); setEditingName(''); }}
                    className="text-xs text-text-secondary hover:text-text-primary transition-colors px-2 py-1"
                  >
                    Отмена
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-text-primary py-1.5 px-3">{cat.name}</span>
                  <button
                    onClick={() => { setEditingId(cat.id); setEditingName(cat.name); }}
                    className="text-xs text-text-secondary hover:text-accent opacity-0 group-hover:opacity-100
                               transition-all duration-200 px-2 py-1"
                  >
                    Изменить
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="text-xs text-text-secondary hover:text-danger opacity-0 group-hover:opacity-100
                               transition-all duration-200 px-2 py-1"
                  >
                    Удалить
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Add new */}
        <div className="px-6 py-4 border-t border-border">
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Новая категория..."
              className="flex-1 px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text-primary
                         focus:outline-none focus:border-accent"
            />
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="px-4 py-2 bg-text-primary text-white text-sm rounded-lg
                         hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Добавить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
