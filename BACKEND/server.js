const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

// Storage folders
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'inventory.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

// ----------------- SUPABASE CLIENT SETUP -----------------
const supabaseUrl = process.env.SUPABASE_URL ? process.env.SUPABASE_URL.trim() : '';
const supabaseKey = process.env.SUPABASE_KEY ? process.env.SUPABASE_KEY.trim() : '';

let supabase = null;
const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  !supabaseUrl.includes('your-project-ref') &&
  supabaseUrl.startsWith('http')
);

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log(`✓ Supabase client configured for: ${supabaseUrl}`);
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err.message);
  }
} else {
  console.log('ℹ Supabase not configured or missing SUPABASE_URL / SUPABASE_KEY in BACKEND/.env.');
  console.log('ℹ Running with local JSON database fallback (data/inventory.json).');
}

// Map PostgreSQL snake_case row to frontend camelCase item
function mapFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    fileName: row.file_name,
    title: row.title || row.file_name,
    category: row.category,
    categoryId: row.category_id,
    subCategory: row.sub_category,
    subCategoryId: row.sub_category_id,
    entity: row.entity,
    year: row.year,
    month: row.month,
    amount: Number(row.amount) || 0,
    currency: row.currency || 'PHP',
    quantity: Number(row.quantity) || 0,
    unit: row.unit || '',
    status: row.status || 'Active',
    fileFormat: row.file_format || 'PDF',
    fileSize: row.file_size || '0 KB',
    filePath: row.file_path || '',
    notes: row.notes || '',
    tags: Array.isArray(row.tags) ? row.tags : [],
    previewData: row.preview_data || null,
    createdAt: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '',
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString().split('T')[0] : ''
  };
}

// Map frontend camelCase item to PostgreSQL snake_case row
function mapToDb(item) {
  return {
    id: item.id,
    file_name: item.fileName,
    title: item.title || item.fileName,
    category: item.category || '',
    category_id: item.categoryId || '',
    sub_category: item.subCategory || '',
    sub_category_id: item.subCategoryId || '',
    entity: item.entity || '',
    year: item.year || '',
    month: item.month || '',
    amount: Number(item.amount) || 0,
    currency: item.currency || 'PHP',
    quantity: Number(item.quantity) || 0,
    unit: item.unit || '',
    status: item.status || 'Active',
    file_format: item.fileFormat || 'PDF',
    file_size: item.fileSize || '0 KB',
    file_path: item.filePath || '',
    notes: item.notes || '',
    tags: Array.isArray(item.tags) ? item.tags : [],
    preview_data: item.previewData || null,
    updated_at: new Date().toISOString()
  };
}

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const upload = multer({ storage: storage });

// Category structure exactly mirroring the handwritten diagram
const CATEGORY_TREE = [
  {
    id: 'petc-sales',
    name: 'PETC Sales',
    entity: 'PETC',
    type: 'finance',
    years: [
      {
        year: '2026',
        months: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
      },
      {
        year: '2027',
        months: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
      }
    ]
  },
  {
    id: 'petc-income',
    name: 'PETC Income',
    entity: 'PETC',
    type: 'finance',
    years: [
      {
        year: '2026',
        months: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
      },
      {
        year: '2027',
        months: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
      }
    ]
  },
  {
    id: 'expenses',
    name: 'Expenses',
    type: 'expense',
    subcategories: [
      { id: 'expenses-2026-petc', name: 'Expenses 2026 (PETC)', entity: 'PETC', year: '2026' },
      { id: 'expenses-2027-petc', name: 'Expenses 2027 (PETC)', entity: 'PETC', year: '2027' },
      { id: 'red-goose-2026', name: 'Red Goose Expenses 2026', entity: 'Red Goose', year: '2026' },
      { id: 'red-goose-2027', name: 'Red Goose Expenses 2027', entity: 'Red Goose', year: '2027' },
      { id: 'knoah-mari-2026', name: 'Knoah Mari Expenses 2026', entity: 'Knoah Mari', year: '2026' },
      { id: 'knoah-mari-2027', name: 'Knoah Mari Expenses 2027', entity: 'Knoah Mari', year: '2027' }
    ]
  },
  {
    id: 'consumables',
    name: 'Consumables',
    type: 'inventory',
    subcategories: [
      { id: 'office-supply', name: 'Office supply', entity: 'General / Office' },
      { id: 'cleaning-supply', name: 'Cleaning supply', entity: 'Facility' },
      { id: 'red-goose-consumables', name: 'Red Goose', entity: 'Red Goose' },
      { id: 'knoah-mari-consumables', name: 'Knoah Mari', entity: 'Knoah Mari' }
    ]
  },
  {
    id: 'vouchers',
    name: 'Vouchers',
    type: 'accounting',
    subcategories: [
      { id: 'vouchers-petc', name: 'PETC', entity: 'PETC' },
      { id: 'vouchers-stc', name: 'STC', entity: 'STC' },
      { id: 'vouchers-knoah-mari', name: 'Knoah Mari', entity: 'Knoah Mari' },
      { id: 'vouchers-red-goose', name: 'Red Goose', entity: 'Red Goose' }
    ]
  },
  {
    id: 'petc-insurance',
    name: 'PETC Insurance',
    entity: 'PETC',
    type: 'insurance',
    years: [
      {
        year: '2026',
        months: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
      },
      {
        year: '2027',
        months: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
      }
    ]
  }
];

// Helper to load inventory data from local JSON
function loadLocalInventory() {
  if (!fs.existsSync(DB_FILE)) {
    saveLocalInventory([]);
    return [];
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading db file:', err);
    saveLocalInventory([]);
    return [];
  }
}

// Helper to save inventory data to local JSON
function saveLocalInventory(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving local db file:', err);
  }
}

// ----------------- API ROUTES -----------------

// Status Endpoint to check Supabase connection
app.get('/api/supabase-status', async (req, res) => {
  if (!isSupabaseConfigured || !supabase) {
    return res.json({
      configured: false,
      connected: false,
      storage: 'local',
      message: 'Supabase credentials not configured in BACKEND/.env. Using local JSON storage.'
    });
  }

  try {
    const { count, error } = await supabase
      .from('inventory_items')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return res.json({
        configured: true,
        connected: false,
        storage: 'supabase',
        error: error.message,
        hint: 'Table public.inventory_items may not exist yet. Please run supabase_schema.sql in Supabase SQL Editor.'
      });
    }

    return res.json({
      configured: true,
      connected: true,
      storage: 'supabase',
      projectUrl: supabaseUrl,
      recordCount: count || 0,
      message: 'Successfully connected to Supabase PostgreSQL database!'
    });
  } catch (err) {
    return res.status(500).json({
      configured: true,
      connected: false,
      error: err.message
    });
  }
});

// ----------------- AUTH ROUTES (SUPABASE AUTH) -----------------

// Admin Registration
app.post('/api/auth/register-admin', async (req, res) => {
  const { email, password, fullName } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  if (!supabase) {
    return res.status(503).json({ success: false, message: 'Supabase authentication is not configured on the server' });
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          role: 'admin',
          full_name: fullName || 'System Admin',
          is_admin: true
        }
      }
    });

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const user = data.user;
    const session = data.session;

    return res.status(201).json({
      success: true,
      message: session ? 'Admin account created and logged in!' : 'Admin account created! You can now log in.',
      user: user ? {
        id: user.id,
        email: user.email,
        fullName: user.user_metadata?.full_name || fullName || 'System Admin',
        role: 'admin'
      } : null,
      session
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error during registration' });
  }
});

// Admin Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  if (!supabase) {
    return res.status(503).json({ success: false, message: 'Supabase authentication is not configured on the server' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) {
      let msg = error.message;
      if (error.code === 'email_not_confirmed' || error.message.toLowerCase().includes('not confirmed')) {
        msg = 'Email is not confirmed yet. To allow instant logins without email verification, turn off "Confirm email" in Supabase Dashboard (Authentication > Providers > Email).';
      }
      return res.status(401).json({ success: false, message: msg });
    }

    const user = data.user;
    const session = data.session;

    return res.json({
      success: true,
      message: 'Admin authentication successful',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.user_metadata?.full_name || 'System Admin',
        role: user.user_metadata?.role || 'admin'
      },
      session
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error during login' });
  }
});

// Admin Logout
app.post('/api/auth/logout', async (req, res) => {
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore
    }
  }
  return res.json({ success: true, message: 'Logged out successfully' });
});

// Verify Current Session
app.get('/api/auth/session', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No auth token provided' });
  }

  const token = authHeader.split(' ')[1];
  if (!supabase) {
    return res.status(503).json({ success: false, message: 'Supabase not configured' });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ success: false, message: 'Invalid or expired session' });
    }

    return res.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.user_metadata?.full_name || 'System Admin',
        role: data.user.user_metadata?.role || 'admin'
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 1. Get Categories & Hierarchy
app.get('/api/categories', (req, res) => {
  res.json({ success: true, categories: CATEGORY_TREE });
});

// 2. Get Inventory Items with comprehensive filtering & search
app.get('/api/items', async (req, res) => {
  const { category, categoryId, subCategory, subCategoryId, entity, year, month, search, status } = req.query;
  let items = [];

  // Try fetching from Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        items = data.map(mapFromDb);
      } else {
        console.warn('Supabase query error, falling back to local storage:', error?.message);
        items = loadLocalInventory();
      }
    } catch (err) {
      console.warn('Supabase fetch exception, falling back to local storage:', err.message);
      items = loadLocalInventory();
    }
  } else {
    items = loadLocalInventory();
  }

  // Filter in memory for maximum search responsiveness
  if (category) {
    items = items.filter(i => i.category && i.category.toLowerCase() === category.toLowerCase());
  }
  if (categoryId) {
    items = items.filter(i => i.categoryId === categoryId);
  }
  if (subCategory) {
    items = items.filter(i => i.subCategory && i.subCategory.toLowerCase() === subCategory.toLowerCase());
  }
  if (subCategoryId) {
    items = items.filter(i => i.subCategoryId === subCategoryId);
  }
  if (entity) {
    items = items.filter(i => i.entity && i.entity.toLowerCase().includes(entity.toLowerCase()));
  }
  if (year) {
    items = items.filter(i => i.year === year);
  }
  if (month) {
    items = items.filter(i => i.month === month);
  }
  if (status) {
    items = items.filter(i => i.status && i.status.toLowerCase() === status.toLowerCase());
  }
  if (search) {
    const q = search.toLowerCase();
    items = items.filter(i =>
      (i.fileName && i.fileName.toLowerCase().includes(q)) ||
      (i.title && i.title.toLowerCase().includes(q)) ||
      (i.notes && i.notes.toLowerCase().includes(q)) ||
      (i.entity && i.entity.toLowerCase().includes(q)) ||
      (i.subCategory && i.subCategory.toLowerCase().includes(q))
    );
  }

  res.json({
    success: true,
    total: items.length,
    items
  });
});

// 3. Get Single Item detail
app.get('/api/items/:id', async (req, res) => {
  const itemId = req.params.id;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (!error && data) {
        return res.json({ success: true, item: mapFromDb(data) });
      }
    } catch (err) {
      console.warn('Supabase get error:', err.message);
    }
  }

  const localItems = loadLocalInventory();
  const item = localItems.find(i => i.id === itemId);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Item not found' });
  }
  res.json({ success: true, item });
});

// 4. Create new Inventory Item
app.post('/api/items', async (req, res) => {
  const body = req.body;

  const newItem = {
    id: body.id || `ITEM-${Date.now()}`,
    fileName: body.fileName || `Document_${Date.now()}.pdf`,
    title: body.title || body.fileName,
    category: body.category || '',
    categoryId: body.categoryId || '',
    subCategory: body.subCategory || '',
    subCategoryId: body.subCategoryId || '',
    entity: body.entity || '',
    year: body.year || '',
    month: body.month || '',
    amount: body.amount !== undefined && body.amount !== '' ? Number(body.amount) : 0,
    currency: body.currency || 'PHP',
    quantity: body.quantity !== undefined && body.quantity !== '' ? Number(body.quantity) : 0,
    unit: body.unit || '',
    status: body.status || 'Active',
    fileFormat: (body.fileName && body.fileName.includes('.')) ? body.fileName.split('.').pop().toUpperCase() : 'PDF',
    fileSize: body.fileSize || '0 KB',
    filePath: body.filePath || '',
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
    notes: body.notes || '',
    tags: body.tags || [body.category, body.entity].filter(Boolean),
    previewData: body.previewData || null
  };

  // 1. Save to Supabase if connected
  if (isSupabaseConfigured && supabase) {
    try {
      const dbRow = mapToDb(newItem);
      const { error } = await supabase
        .from('inventory_items')
        .upsert(dbRow);

      if (error) {
        console.error('Supabase insert error:', error.message);
      } else {
        console.log(`✓ Inserted item ${newItem.id} into Supabase`);
      }
    } catch (err) {
      console.error('Supabase insert exception:', err.message);
    }
  }

  // 2. Also keep local JSON updated as reliable cache/fallback
  const localItems = loadLocalInventory();
  localItems.unshift(newItem);
  saveLocalInventory(localItems);

  res.status(201).json({ success: true, item: newItem });
});

// 5. Update existing item
app.put('/api/items/:id', async (req, res) => {
  const itemId = req.params.id;
  const localItems = loadLocalInventory();
  const index = localItems.findIndex(i => i.id === itemId);

  const updatedItem = {
    ...(index !== -1 ? localItems[index] : {}),
    ...req.body,
    updatedAt: new Date().toISOString().split('T')[0]
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const dbRow = mapToDb(updatedItem);
      await supabase
        .from('inventory_items')
        .update(dbRow)
        .eq('id', itemId);
    } catch (err) {
      console.error('Supabase update error:', err.message);
    }
  }

  if (index !== -1) {
    localItems[index] = updatedItem;
    saveLocalInventory(localItems);
  }

  res.json({ success: true, item: updatedItem });
});

// 6. Delete item
app.delete('/api/items/:id', async (req, res) => {
  const itemId = req.params.id;

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Supabase delete error:', error.message);
      }
    } catch (err) {
      console.error('Supabase delete exception:', err.message);
    }
  }

  let localItems = loadLocalInventory();
  const initialLen = localItems.length;
  localItems = localItems.filter(i => i.id !== itemId);
  saveLocalInventory(localItems);

  res.json({ success: true, message: 'Item deleted successfully' });
});

// 7. Overall Dashboard Statistics
app.get('/api/stats', async (req, res) => {
  let items = [];

  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.from('inventory_items').select('*');
      if (Array.isArray(data)) {
        items = data.map(mapFromDb);
      } else {
        items = loadLocalInventory();
      }
    } catch {
      items = loadLocalInventory();
    }
  } else {
    items = loadLocalInventory();
  }

  const totalFiles = items.length;
  const salesItems = items.filter(i => i.categoryId === 'petc-sales');
  const incomeItems = items.filter(i => i.categoryId === 'petc-income');
  const expenseItems = items.filter(i => i.categoryId === 'expenses');
  const consumableItems = items.filter(i => i.categoryId === 'consumables');
  const voucherItems = items.filter(i => i.categoryId === 'vouchers');
  const insuranceItems = items.filter(i => i.categoryId === 'petc-insurance');

  const totalSales = salesItems.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalIncome = incomeItems.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalExpenses = expenseItems.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const lowStockConsumables = consumableItems.filter(i => i.status === 'Low Stock').length;

  res.json({
    success: true,
    stats: {
      totalFiles,
      totalSales,
      totalIncome,
      totalExpenses,
      consumablesCount: consumableItems.length,
      lowStockConsumables,
      vouchersCount: voucherItems.length,
      insurancePoliciesCount: insuranceItems.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0),
      byCategory: {
        'PETC Sales': salesItems.length,
        'PETC Income': incomeItems.length,
        'Expenses': expenseItems.length,
        'Consumables': consumableItems.length,
        'Vouchers': voucherItems.length,
        'PETC Insurance': insuranceItems.length
      }
    }
  });
});

// File upload endpoint (supports local + optional Supabase Storage bucket)
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  let publicUrl = `/uploads/${req.file.filename}`;

  // If Supabase Storage is configured, also upload to 'inventory-files' bucket
  if (isSupabaseConfigured && supabase) {
    try {
      const fileBuffer = fs.readFileSync(req.file.path);
      const storagePath = `uploads/${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('inventory-files')
        .upload(storagePath, fileBuffer, {
          contentType: req.file.mimetype,
          upsert: true
        });

      if (!uploadErr && uploadData) {
        const { data: urlData } = supabase.storage
          .from('inventory-files')
          .getPublicUrl(storagePath);

        if (urlData?.publicUrl) {
          publicUrl = urlData.publicUrl;
        }
      }
    } catch (err) {
      console.warn('Supabase storage upload skipped or failed, using local upload path:', err.message);
    }
  }

  res.json({
    success: true,
    file: {
      originalName: req.file.originalname,
      fileName: req.file.filename,
      size: `${(req.file.size / 1024).toFixed(1)} KB`,
      path: publicUrl
    }
  });
});

// Start server (only when run directly or locally, not as a Vercel serverless function)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Inventory Backend Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
