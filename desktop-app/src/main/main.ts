import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import * as path from 'path';
import { spawnSync } from 'child_process';
import * as db from './db';

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

// Suppress uncaught exceptions during shutdown (e.g. PG "administrator command")
process.on('uncaughtException', (err) => {
  if (isQuitting) return;
  console.error('Uncaught exception:', err);
});


/* ---- Docker container management ---- */
function getComposeDir(): string {
  if (!app.isPackaged) {
    return path.resolve(__dirname, '..', '..', '..');
  }
  return process.resourcesPath;
}

function isDockerRunning(): boolean {
  const r = spawnSync('docker', ['info'], { stdio: 'ignore', timeout: 5000, windowsHide: true });
  return r.status === 0;
}

function startContainers(): void {
  const composeDir = getComposeDir();
  const composePath = path.join(composeDir, 'docker-compose.yml');
  try {
    if (!isDockerRunning()) {
      console.warn('Docker is not running, skipping container start');
      return;
    }
    console.log('Starting Docker containers...');
    const r = spawnSync('docker', ['compose', '-f', composePath, 'up', '-d', '--wait'], {
      stdio: 'pipe',
      timeout: 120000,
      windowsHide: true,
    });
    if (r.status !== 0) throw new Error(r.stderr?.toString() || 'docker compose up failed');
    console.log('Docker containers started');
  } catch (err) {
    console.error('Failed to start containers:', err);
  }
}

async function waitForDb(maxRetries = 20, intervalMs = 1500): Promise<boolean> {
  for (let i = 1; i <= maxRetries; i++) {
    const ok = await db.testConnection();
    if (ok) {
      console.log(`Database ready (attempt ${i}/${maxRetries})`);
      return true;
    }
    console.log(`Waiting for database... (attempt ${i}/${maxRetries})`);
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  console.error('Database did not become ready in time');
  return false;
}

function stopContainers(): void {
  const composeDir = getComposeDir();
  const composePath = path.join(composeDir, 'docker-compose.yml');
  try {
    if (!isDockerRunning()) return;
    console.log('Stopping Docker containers...');
    spawnSync('docker', ['compose', '-f', composePath, 'stop'], {
      stdio: 'pipe',
      timeout: 30000,
      windowsHide: true,
    });
    console.log('Docker containers stopped');
  } catch (err) {
    console.error('Failed to stop containers:', err);
  }
}

function createWindow() {
  // Remove default menu bar (File, Edit, View, etc.)
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#FAFAF7',
      symbolColor: '#1A1A1A',
      height: 40,
    },
    backgroundColor: '#FAFAF7',
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

function registerIpcHandlers() {
  // CRUD
  ipcMain.handle('db:insertExpense', async (_, { date, category, cost }) => {
    await db.insertExpense(date, category, cost);
    return { success: true };
  });
  ipcMain.handle('db:insertIncome', async (_, { date, profit }) => {
    await db.insertIncome(date, profit);
    return { success: true };
  });
  ipcMain.handle('db:getRecentExpenses', async (_, limit) => db.getRecentExpenses(limit));
  ipcMain.handle('db:getRecentIncome', async (_, limit) => db.getRecentIncome(limit));
  ipcMain.handle('db:deleteExpense', async (_, id) => { await db.deleteExpense(id); return { success: true }; });
  ipcMain.handle('db:deleteIncome', async (_, id) => { await db.deleteIncome(id); return { success: true }; });
  ipcMain.handle('db:testConnection', async () => db.testConnection());

  // Categories
  ipcMain.handle('db:getCategories', async () => db.getCategories());
  ipcMain.handle('db:addCategory', async (_, name) => db.addCategory(name));
  ipcMain.handle('db:renameCategory', async (_, { id, newName }) => db.renameCategory(id, newName));
  ipcMain.handle('db:deleteCategory', async (_, id) => db.deleteCategory(id));

  // Statistics (all accept optional `since` date string)
  ipcMain.handle('db:getExpensesByCategory', async (_, since) => db.getExpensesByCategory(since));
  ipcMain.handle('db:getExpensesByDate', async (_, since) => db.getExpensesByDate(since));
  ipcMain.handle('db:getIncomeByDate', async (_, since) => db.getIncomeByDate(since));
  ipcMain.handle('db:getMonthlyBalance', async (_, since) => db.getMonthlyBalance(since));
  ipcMain.handle('db:getSummary', async (_, since) => db.getSummary(since));
  ipcMain.handle('db:getDailyExpensesByCategory', async (_, since) => db.getDailyExpensesByCategory(since));
  ipcMain.handle('db:getMonthlyExpensesByCategory', async (_, since) => db.getMonthlyExpensesByCategory(since));

  // Constants
  ipcMain.handle('db:getConstants', async () => db.getConstants());
  ipcMain.handle('db:insertConstant', async (_, { type, amount, startDate, description }) =>
    db.insertConstant(type, amount, startDate, description));
  ipcMain.handle('db:updateConstant', async (_, { id, type, amount, startDate, description }) => {
    await db.updateConstant(id, type, amount, startDate, description);
    return { success: true };
  });
  ipcMain.handle('db:deleteConstant', async (_, id) => { await db.deleteConstant(id); return { success: true }; });
  ipcMain.handle('db:getActiveConstants', async (_, forDate) => db.getActiveConstants(forDate));
}

app.whenReady().then(async () => {
  startContainers();
  registerIpcHandlers();

  // Wait until the database actually accepts connections
  const dbReady = await waitForDb();
  if (dbReady) {
    // Ensure tables exist only after DB is confirmed ready
    try { await db.ensureCategoriesTable(); } catch (e) { console.error('Categories init:', e); }
    try { await db.ensureConstantsTable(); } catch (e) { console.error('Constants init:', e); }
  }

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    isQuitting = true;
    // Silence pool errors during shutdown
    db.pool.on('error', () => {});
    try { await db.pool.end(); } catch { /* ignore */ }
    stopContainers();
    app.quit();
  }
});
