const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOADS_DIR));

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
    type: 'voucher',
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

// Helper to load inventory data
function loadInventory() {
  if (!fs.existsSync(DB_FILE)) {
    saveInventory([]);
    return [];
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading db file:', err);
    saveInventory([]);
    return [];
  }
}

// Helper to save inventory data
function saveInventory(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ----------------- API ROUTES -----------------

// 1. Get Categories & Hierarchy
app.get('/api/categories', (req, res) => {
  res.json({ success: true, categories: CATEGORY_TREE });
});

// 2. Get Inventory Items with comprehensive filtering & search
app.get('/api/items', (req, res) => {
  const { category, categoryId, subCategory, subCategoryId, entity, year, month, search, status } = req.query;
  let items = loadInventory();

  if (category) {
    items = items.filter(i => i.category.toLowerCase() === category.toLowerCase());
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
      i.fileName.toLowerCase().includes(q) ||
      i.title.toLowerCase().includes(q) ||
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
app.get('/api/items/:id', (req, res) => {
  const items = loadInventory();
  const item = items.find(i => i.id === req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Item not found' });
  }
  res.json({ success: true, item });
});

// 4. Create new Inventory Item
app.post('/api/items', (req, res) => {
  const items = loadInventory();
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
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
    notes: body.notes || '',
    tags: body.tags || [body.category, body.entity].filter(Boolean),
    previewData: body.previewData || null
  };

  items.unshift(newItem);
  saveInventory(items);
  res.status(201).json({ success: true, item: newItem });
});

// 5. Update existing item
app.put('/api/items/:id', (req, res) => {
  const items = loadInventory();
  const index = items.findIndex(i => i.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Item not found' });
  }

  const updatedItem = {
    ...items[index],
    ...req.body,
    updatedAt: new Date().toISOString().split('T')[0]
  };

  items[index] = updatedItem;
  saveInventory(items);
  res.json({ success: true, item: updatedItem });
});

// 6. Delete item
app.delete('/api/items/:id', (req, res) => {
  let items = loadInventory();
  const initialLen = items.length;
  items = items.filter(i => i.id !== req.params.id);

  if (items.length === initialLen) {
    return res.status(404).json({ success: false, message: 'Item not found' });
  }

  saveInventory(items);
  res.json({ success: true, message: 'Item deleted successfully' });
});

// 7. Overall Dashboard Statistics
app.get('/api/stats', (req, res) => {
  const items = loadInventory();

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

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  res.json({
    success: true,
    file: {
      originalName: req.file.originalname,
      fileName: req.file.filename,
      size: `${(req.file.size / 1024).toFixed(1)} KB`,
      path: req.file.path
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Inventory Backend Server running on http://localhost:${PORT}`);
});
