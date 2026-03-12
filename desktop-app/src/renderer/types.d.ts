interface Window {
  api: {
    insertExpense: (date: string, category: string, cost: number) => Promise<{ success: boolean }>;
    insertIncome: (date: string, profit: number) => Promise<{ success: boolean }>;
    getRecentExpenses: (limit?: number) => Promise<Array<{ id: number; date: string; category: string; cost: number }>>;
    getRecentIncome: (limit?: number) => Promise<Array<{ id: number; date: string; profit: number }>>;
    deleteExpense: (id: number) => Promise<{ success: boolean }>;
    deleteIncome: (id: number) => Promise<{ success: boolean }>;
    testConnection: () => Promise<boolean>;
    getCategories: () => Promise<Array<{ id: number; name: string }>>;
    addCategory: (name: string) => Promise<{ id: number; name: string }>;
    renameCategory: (id: number, newName: string) => Promise<void>;
    deleteCategory: (id: number) => Promise<void>;
    getExpensesByCategory: (since?: string) => Promise<Array<{ category: string; total: number }>>;
    getExpensesByDate: (since?: string) => Promise<Array<{ date: string; total: number }>>;
    getIncomeByDate: (since?: string) => Promise<Array<{ date: string; total: number }>>;
    getMonthlyBalance: (since?: string) => Promise<Array<{ month: string; income: number; expenses: number }>>;
    getSummary: (since?: string) => Promise<{ totalExpenses: number; totalIncome: number; balance: number }>;
    getDailyExpensesByCategory: (since?: string) => Promise<Array<{ date: string; category: string; total: number }>>;
    getMonthlyExpensesByCategory: (since?: string) => Promise<Array<{ month: string; category: string; total: number }>>;
    getConstants: () => Promise<Array<{ id: number; type: string; amount: number; start_date: string; description: string }>>;
    insertConstant: (type: string, amount: number, startDate: string, description: string) => Promise<{ id: number; type: string; amount: number; start_date: string; description: string }>;
    updateConstant: (id: number, type: string, amount: number, startDate: string, description: string) => Promise<{ success: boolean }>;
    deleteConstant: (id: number) => Promise<{ success: boolean }>;
    getActiveConstants: (forDate?: string) => Promise<{ income: number; expense: number }>;
  };
}
