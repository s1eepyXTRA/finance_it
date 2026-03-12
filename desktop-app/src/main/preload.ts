import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  insertExpense: (date: string, category: string, cost: number) =>
    ipcRenderer.invoke('db:insertExpense', { date, category, cost }),
  insertIncome: (date: string, profit: number) =>
    ipcRenderer.invoke('db:insertIncome', { date, profit }),
  getRecentExpenses: (limit?: number) =>
    ipcRenderer.invoke('db:getRecentExpenses', limit),
  getRecentIncome: (limit?: number) =>
    ipcRenderer.invoke('db:getRecentIncome', limit),
  deleteExpense: (id: number) =>
    ipcRenderer.invoke('db:deleteExpense', id),
  deleteIncome: (id: number) =>
    ipcRenderer.invoke('db:deleteIncome', id),
  testConnection: () =>
    ipcRenderer.invoke('db:testConnection'),

  // Categories
  getCategories: () =>
    ipcRenderer.invoke('db:getCategories'),
  addCategory: (name: string) =>
    ipcRenderer.invoke('db:addCategory', name),
  renameCategory: (id: number, newName: string) =>
    ipcRenderer.invoke('db:renameCategory', { id, newName }),
  deleteCategory: (id: number) =>
    ipcRenderer.invoke('db:deleteCategory', id),

  // Statistics (all accept optional `since` date)
  getExpensesByCategory: (since?: string) =>
    ipcRenderer.invoke('db:getExpensesByCategory', since),
  getExpensesByDate: (since?: string) =>
    ipcRenderer.invoke('db:getExpensesByDate', since),
  getIncomeByDate: (since?: string) =>
    ipcRenderer.invoke('db:getIncomeByDate', since),
  getMonthlyBalance: (since?: string) =>
    ipcRenderer.invoke('db:getMonthlyBalance', since),
  getSummary: (since?: string) =>
    ipcRenderer.invoke('db:getSummary', since),
  getDailyExpensesByCategory: (since?: string) =>
    ipcRenderer.invoke('db:getDailyExpensesByCategory', since),
  getMonthlyExpensesByCategory: (since?: string) =>
    ipcRenderer.invoke('db:getMonthlyExpensesByCategory', since),

  // Constants
  getConstants: () =>
    ipcRenderer.invoke('db:getConstants'),
  insertConstant: (type: string, amount: number, startDate: string, description: string) =>
    ipcRenderer.invoke('db:insertConstant', { type, amount, startDate, description }),
  updateConstant: (id: number, type: string, amount: number, startDate: string, description: string) =>
    ipcRenderer.invoke('db:updateConstant', { id, type, amount, startDate, description }),
  deleteConstant: (id: number) =>
    ipcRenderer.invoke('db:deleteConstant', id),
  getActiveConstants: (forDate?: string) =>
    ipcRenderer.invoke('db:getActiveConstants', forDate),
});
