import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import {
  Folder,
  FileText,
  FileSpreadsheet,
  Calendar,
  Layers,
  PlusCircle,
  Search,
  Download,
  Trash2,
  X,
  Menu,
  CheckCircle2,
  AlertTriangle,
  Package,
  FileCheck,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Eye,
  EyeOff,
  Printer,
  UploadCloud,
  Camera,
  ArrowLeft,
  Check,
  RefreshCw,
  FileUp,
  Image as ImageIcon,
  Lock,
  Mail,
  User,
  LogIn,
  UserPlus,
  LogOut,
  Key,
  Shield,
  Smartphone,
  Building2,
  DollarSign,
  Sparkles,
  Receipt,
  Sun,
  Moon,
  Edit3,
  TrendingUp,
  CreditCard,
  FolderOpen,
  Plus
} from 'lucide-react';
import { supabase, mapFromDb, mapToDb } from './supabase';
import XLSX from 'xlsx-js-style';
import { runOcrOnImage } from './ocrService';
import { loadCachedItems, saveCachedItems, getCacheSyncTime, clearCachedItems } from './cacheService';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

// Receipt Types matching the handwritten diagrams with dedicated DB tables
const RECEIPT_TYPES = [
  {
    id: 'petc-sales',
    name: 'PETC Sales Receipt',
    tableName: 'petc_sales_receipts',
    description: 'Vehicle emission testing fee receipt & inspection certificate',
    category: 'PETC Sales',
    categoryId: 'petc-sales',
    subCategory: 'Emission Testing',
    entity: 'PETC',
    prefix: 'SALES'
  },
  {
    id: 'petc-income',
    name: 'PETC Income Receipt',
    tableName: 'inventory_items',
    description: 'PETC daily collections, revenue vouchers & operational income',
    category: 'PETC Income',
    categoryId: 'petc-income',
    subCategory: 'Daily Collection',
    entity: 'PETC',
    prefix: 'INC'
  },
  {
    id: 'petc-insurance',
    name: 'PETC CTPL Insurance Receipt',
    tableName: 'petc_insurance_receipts',
    description: 'Compulsory third party liability insurance policy payment',
    category: 'PETC Insurance',
    categoryId: 'petc-insurance',
    subCategory: 'CTPL Insurance',
    entity: 'PETC',
    prefix: 'INS'
  },
  {
    id: 'expenses-petc',
    name: 'PETC Expense Receipt',
    tableName: 'petc_expense_receipts',
    description: 'PETC calibration, utilities, rent, and operational disbursements',
    category: 'Expenses',
    categoryId: 'expenses',
    subCategory: 'Expenses 2026 (PETC)',
    entity: 'PETC',
    prefix: 'EXP-PETC'
  },
  {
    id: 'expenses-red-goose',
    name: 'Red Goose Expense Receipt',
    tableName: 'red_goose_expense_receipts',
    description: 'Red Goose branch operational expenses and invoices',
    category: 'Expenses',
    categoryId: 'expenses',
    subCategory: 'Red Goose Expenses 2026',
    entity: 'Red Goose',
    prefix: 'EXP-RG'
  },
  {
    id: 'expenses-knoah-mari',
    name: 'Knoah Mari Expense Receipt',
    tableName: 'knoah_mari_expense_receipts',
    description: 'Knoah Mari testing supplies, rent, and utility disbursements',
    category: 'Expenses',
    categoryId: 'expenses',
    subCategory: 'Knoah Mari Expenses 2026',
    entity: 'Knoah Mari',
    prefix: 'EXP-KM'
  },
  {
    id: 'consumables-delivery',
    name: 'Consumables Purchase Receipt',
    tableName: 'consumables_receipts',
    description: 'Office paper, cleaning chemicals & smoke filter deliveries',
    category: 'Consumables',
    categoryId: 'consumables',
    subCategory: 'Office supply',
    entity: 'General',
    prefix: 'CNS'
  },
  {
    id: 'voucher-disbursement',
    name: 'Payment Voucher Receipt',
    tableName: 'voucher_receipts',
    description: 'Official liquidation slip and petty cash payment voucher',
    category: 'Vouchers',
    categoryId: 'vouchers',
    subCategory: 'PETC',
    entity: 'PETC',
    prefix: 'VCH'
  }
];

export default function App() {
  const { width, height } = useWindowDimensions();
  const isSmallMobile = width < 480;            // Compact smartphones (320px - 480px, e.g. iPhone SE, small Androids)
  const isMobile = width < 768;                 // All smartphones (< 768px)
  const isTablet = width >= 768 && width < 1024;// Tablets (768px - 1023px, iPad portrait, foldables)
  const isDesktop = width >= 1024;              // Desktops & Laptops (>= 1024px)
  const isDrawerMode = width < 1024;            // Sidebar operates as slide-in drawer on mobile & tablet
  const useCardsView = width < 860;             // Document cards view (< 860px), Data table (>= 860px)
  const [sidebarOpen, setSidebarOpen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 1024 : false));

  const [items, setItems] = useState(() => loadCachedItems());
  const [loading, setLoading] = useState(() => loadCachedItems().length === 0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cacheSyncLabel, setCacheSyncLabel] = useState(() => getCacheSyncTime());

  // Unified single-source navigation state controlled 100% by left sidebar
  const [activeNav, _setActiveNav] = useState({
    type: 'all',
    year: null,
    month: null,
    subCategory: null,
    label: 'All Inventory Files'
  });

  const setActiveNav = (nav) => {
    _setActiveNav(nav);
    if (isDrawerMode) {
      setSidebarOpen(false);
    }
  };

  // Toggle state to control whether all files within the system are displayed
  const [showAllFiles, setShowAllFiles] = useState(() => {
    try {
      const saved = localStorage.getItem('petc_show_all_files');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const handleToggleShowAll = () => {
    setShowAllFiles(prev => {
      const next = !prev;
      try {
        localStorage.setItem('petc_show_all_files', JSON.stringify(next));
      } catch { }
      return next;
    });
  };

  // Theme State: 'dark' (default) | 'light'
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('petc_theme');
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });
  const isLight = theme === 'light';
  const styles = useMemo(() => createStyles(isLight), [isLight]);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('petc_theme', next);
      } catch { }
      return next;
    });
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isLight) {
        document.documentElement.classList.add('light-theme');
        document.body.classList.add('light-theme');
      } else {
        document.documentElement.classList.remove('light-theme');
        document.body.classList.remove('light-theme');
      }
    }
  }, [isLight]);

  const [searchQuery, setSearchQuery] = useState('');

  // Live Dashboard Statistics for Quick Overview
  const stats = useMemo(() => {
    let totalSales = 0;
    let totalSalesCount = 0;
    let totalIncome = 0;
    let totalIncomeCount = 0;
    let totalExpenses = 0;
    let totalExpensesCount = 0;
    let totalConsumablesCount = 0;

    items.forEach(item => {
      const amt = parseFloat(item.amount) || 0;
      const cat = (item.category || item.categoryId || '').toLowerCase();

      if (cat.includes('sale') || cat.includes('emission') || cat === 'petc-sales') {
        totalSales += amt;
        totalSalesCount++;
      } else if (cat.includes('income') || cat.includes('revenue') || cat.includes('collection') || cat === 'petc-income') {
        totalIncome += amt;
        totalIncomeCount++;
      } else if (cat.includes('expense') || cat === 'expenses') {
        totalExpenses += amt;
        totalExpensesCount++;
      } else if (cat.includes('consumable')) {
        totalConsumablesCount++;
      }
    });

    return {
      totalRecords: items.length,
      totalSales,
      totalSalesCount,
      totalIncome,
      totalIncomeCount,
      totalExpenses,
      totalExpensesCount,
      totalConsumablesCount
    };
  }, [items]);

  // Tree expansion state
  const [expandedNodes, setExpandedNodes] = useState({
    'petc-sales': true,
    'petc-sales-2026': false,
    'petc-sales-2027': false,
    'petc-income': true,
    'petc-income-2026': false,
    'petc-income-2027': false,
    'expenses': true,
    'consumables': true,
    'vouchers': true,
    'petc-insurance': true,
    'petc-insurance-2026': false,
    'petc-insurance-2027': false
  });

  // Document Viewer Modal State
  const [viewItem, setViewItem] = useState(null);
  const [notification, setNotification] = useState(null);

  // Lazy-load high-resolution document image if opening an item where filePath wasn't in the initial list query
  useEffect(() => {
    if (!viewItem || viewItem.filePath) return;
    let isCancelled = false;
    const fetchPhoto = async () => {
      try {
        const table = viewItem.sourceTable || 'inventory_items';
        const { data } = await supabase.from(table).select('file_path, preview_data').eq('id', viewItem.id).single();
        if (!isCancelled && data && (data.file_path || data.preview_data)) {
          setViewItem(prev => {
            if (!prev || prev.id !== viewItem.id) return prev;
            return {
              ...prev,
              filePath: data.file_path || prev.filePath,
              previewData: data.preview_data || prev.previewData
            };
          });
        }
      } catch (e) {
        console.warn('Lazy photo fetch failed:', e);
      }
    };
    fetchPhoto();
    return () => { isCancelled = true; };
  }, [viewItem?.id]);

  // Add Document Modal State: strictly 'options' | 'insert' | 'scan'
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState('options'); // 'options' | 'insert' | 'scan'

  // Insert Document State
  const [insertedFile, setInsertedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Scan Document State
  const [selectedReceiptType, setSelectedReceiptType] = useState(RECEIPT_TYPES[0]);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' (rear) | 'user' (front)
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedReceiptPhoto, setCapturedReceiptPhoto] = useState(null);
  const [scannedRefNo, setScannedRefNo] = useState('');
  const [scannedAmount, setScannedAmount] = useState('');
  const [isSavingScan, setIsSavingScan] = useState(false);
  const videoRef = useRef(null);

  // Intelligent OCR States (Establishment, Date, Description, Amount)
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrStatusText, setOcrStatusText] = useState('');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrEstablishment, setOcrEstablishment] = useState('');
  const [ocrReceiptDate, setOcrReceiptDate] = useState('');
  const [ocrDescription, setOcrDescription] = useState('');
  const [ocrAmount, setOcrAmount] = useState('');
  const [ocrOrNumber, setOcrOrNumber] = useState('');
  const [isOcrVerifiedView, setIsOcrVerifiedView] = useState(false);
  const [ocrValidationError, setOcrValidationError] = useState('');
  const [ocrReceiptName, setOcrReceiptName] = useState('');

  // Rename Saved Document State
  const [renameItem, setRenameItem] = useState(null);
  const [renameNewName, setRenameNewName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Supabase Auth State (Admin accounts only)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('petc_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Auth Submit Handler
  const handleAuthSubmit = async () => {
    setAuthError('');
    if (!authEmail.trim() || !authPassword) {
      setAuthError('Please enter both your admin email and password.');
      return;
    }

    if (authMode === 'register') {
      if (authPassword.length < 6) {
        setAuthError('Password must be at least 6 characters.');
        return;
      }
      if (authPassword !== authConfirmPassword) {
        setAuthError('Passwords do not match. Please enter a valid admin password.');
        return;
      }
    }

    setAuthLoading(true);
    try {
      if (authMode === 'register') {
        // Direct Supabase Auth for Admin Registration
        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
          options: {
            data: {
              role: 'admin',
              full_name: authFullName.trim() || 'System Admin',
              is_admin: true
            }
          }
        });

        if (error) {
          let msg = error.message;
          if (msg.includes('rate limit')) {
            msg = 'Email rate limit reached. In Supabase Dashboard: Go to Authentication > Providers > Email and toggle OFF "Confirm email" to register instantly.';
          }
          setAuthError(msg);
          return;
        }

        if (data.session && data.user) {
          const user = {
            id: data.user.id,
            email: data.user.email,
            fullName: data.user.user_metadata?.full_name || authFullName || 'Administrator',
            role: 'admin'
          };
          localStorage.setItem('petc_admin_user', JSON.stringify(user));
          localStorage.setItem('petc_admin_token', data.session.access_token);
          setCurrentUser(user);
          showNotice(`Admin account created! Welcome, ${user.fullName}`);
          fetchData();
        } else {
          showNotice('Admin account registered! Please sign in.');
          setAuthMode('login');
          setAuthPassword('');
          setAuthConfirmPassword('');
        }
      } else {
        // Direct Supabase Auth for Admin Sign-In
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword
        });

        if (error) {
          let msg = error.message;
          if (error.code === 'email_not_confirmed' || msg.toLowerCase().includes('not confirmed')) {
            msg = 'Email is not confirmed yet. In Supabase Dashboard: Go to Authentication > Providers > Email and toggle OFF "Confirm email" for instant access.';
          }
          setAuthError(msg);
          return;
        }

        const user = {
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.user_metadata?.full_name || 'Administrator',
          role: 'admin'
        };
        localStorage.setItem('petc_admin_user', JSON.stringify(user));
        localStorage.setItem('petc_admin_token', data.session.access_token);
        setCurrentUser(user);
        showNotice(`Authenticated as Administrator (${user.fullName || user.email})`);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      setAuthError(err.message || 'Authentication error. Please check your credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      // ignore
    }
    localStorage.removeItem('petc_admin_user');
    localStorage.removeItem('petc_admin_token');
    clearCachedItems();
    setCurrentUser(null);
    setAuthEmail('');
    setAuthPassword('');
    setAuthConfirmPassword('');
    showNotice('You have been signed out.');
  };

  const ALL_RECEIPT_TABLES = [
    'inventory_items',
    'knoah_mari_expense_receipts',
    'red_goose_expense_receipts',
    'petc_sales_receipts',
    'petc_insurance_receipts',
    'petc_expense_receipts',
    'consumables_receipts',
    'voucher_receipts'
  ];

  // Ref flag to ensure queries never run concurrently
  const isFetchingRef = useRef(false);

  // Lightweight columns for master inventory table to avoid Postgres statement timeout on large base64 image blobs
  const MASTER_INVENTORY_COLUMNS = 'id, file_name, title, category, category_id, sub_category, sub_category_id, entity, year, month, amount, currency, quantity, unit, status, file_format, file_size, notes, tags, created_at, updated_at, establishment, receipt_date, description';

  // Fetch data directly from Supabase across ALL tables in parallel
  const fetchData = async (silent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!silent) setLoading(true);
    setIsSyncing(true);

    try {
      // Query master inventory (without heavy file_path blobs) and all 7 dedicated receipt tables concurrently
      const queries = ALL_RECEIPT_TABLES.map(table => {
        if (table === 'inventory_items') {
          return supabase
            .from(table)
            .select(MASTER_INVENTORY_COLUMNS)
            .order('created_at', { ascending: false });
        }
        return supabase
          .from(table)
          .select('*')
          .order('created_at', { ascending: false });
      });

      const responses = await Promise.allSettled(queries);
      const itemMap = new Map();

      responses.forEach((res, index) => {
        const tableName = ALL_RECEIPT_TABLES[index];
        if (res.status === 'fulfilled' && res.value && !res.value.error && Array.isArray(res.value.data)) {
          res.value.data.forEach(rawRow => {
            const mapped = mapFromDb(rawRow, tableName);
            if (!mapped || !mapped.id) return;

            if (!itemMap.has(mapped.id)) {
              itemMap.set(mapped.id, { ...mapped, sourceTable: tableName });
            } else {
              // Merge so dedicated table OCR data augments the master record
              const existing = itemMap.get(mapped.id);
              // Ensure genuine non-expense category/entity is strictly preserved
              const finalCategory = (existing.category && existing.category !== 'Expenses') ? existing.category : mapped.category;
              const finalCategoryId = (existing.categoryId && existing.categoryId !== 'expenses') ? existing.categoryId : mapped.categoryId;
              const finalEntity = existing.entity || mapped.entity;

              itemMap.set(mapped.id, {
                ...existing,
                ...mapped,
                category: finalCategory,
                categoryId: finalCategoryId,
                entity: finalEntity,
                filePath: existing.filePath || mapped.filePath || '',
                establishment: mapped.establishment || existing.establishment || '',
                receiptDate: mapped.receiptDate || existing.receiptDate || '',
                description: mapped.description || existing.description || '',
                amount: mapped.amount > 0 ? mapped.amount : existing.amount,
                sourceTable: tableName
              });
            }
          });
        }
      });

      if (itemMap.size > 0) {
        const mergedItems = Array.from(itemMap.values()).sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        setItems(mergedItems);
        saveCachedItems(mergedItems);
        setCacheSyncLabel('Just now');
      } else {
        // Fallback to local server API if Supabase returned 0 rows
        try {
          const res = await fetch(`${API_BASE}/items`);
          const localData = await res.json();
          if (localData.success && Array.isArray(localData.items)) {
            setItems(localData.items);
            saveCachedItems(localData.items);
            setCacheSyncLabel('Just now');
          }
        } catch {
          // silent fallback
        }
      }
    } catch (err) {
      console.warn('Realtime fetch fallback:', err);
    } finally {
      isFetchingRef.current = false;
      setIsSyncing(false);
      setLoading(false);
    }
  };

  // Watchdog timer: unconditionally guarantee loading screen terminates within 2.5s
  useEffect(() => {
    const watchdog = setTimeout(() => {
      setLoading(false);
    }, 2500);
    return () => clearTimeout(watchdog);
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    // Initial load: fetch silently in background if cache already loaded data
    const hasCached = loadCachedItems().length > 0;
    fetchData(hasCached);

    // 1. Instant Realtime Push from Supabase WebSocket (zero polling lag)
    const channel = supabase
      .channel('realtime:all-receipt-tables')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, () => {
        fetchData(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'knoah_mari_expense_receipts' }, () => {
        fetchData(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'red_goose_expense_receipts' }, () => {
        fetchData(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'petc_sales_receipts' }, () => {
        fetchData(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'petc_insurance_receipts' }, () => {
        fetchData(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'petc_expense_receipts' }, () => {
        fetchData(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consumables_receipts' }, () => {
        fetchData(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'voucher_receipts' }, () => {
        fetchData(true);
      })
      .subscribe();

    // 2. Instant sync when user switches back to browser tab
    const handleFocus = () => {
      fetchData(true);
    };
    window.addEventListener('focus', handleFocus);

    // 3. Gentle background sync every 60 seconds (prevents CPU lag)
    const gentleInterval = setInterval(() => {
      fetchData(true);
    }, 60000);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', handleFocus);
      clearInterval(gentleInterval);
    };
  }, [currentUser]);

  const showNotice = (msg, type = 'success') => {
    setNotification({ text: msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const toggleNode = (nodeKey) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeKey]: !prev[nodeKey]
    }));
  };

  // Filter items strictly based on the left sidebar navigation
  const filteredItems = useMemo(() => {
    // If viewing All Inventory Files and the user has toggled off displaying all files
    if (activeNav.type === 'all' && !showAllFiles) {
      return [];
    }

    return items.filter(item => {
      // 1. Category Filtering
      const activeType = (activeNav.type || '').toLowerCase();
      if (activeType && activeType !== 'all') {
        const itemCatId = (item.categoryId || '').toLowerCase();
        const itemCat = (item.category || '').toLowerCase();
        const matchesCategory =
          itemCatId === activeType ||
          itemCat === activeType ||
          itemCat.replace(/\s+/g, '-') === activeType ||
          (activeType === 'expenses' && itemCat.includes('expense')) ||
          (activeType === 'petc-sales' && (itemCat.includes('sale') || itemCat.includes('emission'))) ||
          (activeType === 'petc-income' && (itemCat.includes('income') || itemCat.includes('revenue') || itemCat.includes('collection'))) ||
          (activeType === 'petc-insurance' && (itemCat.includes('insurance') || itemCat.includes('ctpl'))) ||
          (activeType === 'consumables' && itemCat.includes('consumable')) ||
          (activeType === 'vouchers' && itemCat.includes('voucher'));

        if (!matchesCategory) return false;
      }

      // 2. Year Filtering
      if (activeNav.year) {
        const itemYear = String(item.year || '');
        if (itemYear && itemYear !== String(activeNav.year)) {
          return false;
        }
      }

      // 3. Month Filtering
      if (activeNav.month) {
        const itemMonth = (item.month || '').toUpperCase();
        const navMonth = String(activeNav.month).toUpperCase();
        if (itemMonth && itemMonth !== navMonth) {
          return false;
        }
      }

      // 4. SubCategory & Branch Filtering (e.g. 'knoah-mari-2026', 'red-goose-2026')
      if (activeNav.subCategory) {
        const target = activeNav.subCategory.toLowerCase();
        const itemSub = (item.subCategory || '').toLowerCase();
        const itemSubId = (item.subCategoryId || '').toLowerCase();
        const itemEntity = (item.entity || '').toLowerCase();
        const itemTitle = (item.title || '').toLowerCase();
        const itemYear = String(item.year || '').toLowerCase();

        // Exact slug match or direct inclusion
        const exactMatch =
          itemSubId === target ||
          itemSub === target ||
          itemSub.replace(/\s+/g, '-') === target ||
          itemSub.replace(/\s+/g, '-').includes(target);

        let matchesSub = exactMatch;
        if (!matchesSub) {
          const isKnoah = target.includes('knoah');
          const isRedGoose = target.includes('red-goose') || target.includes('redgoose');
          const isPetc = target.includes('petc');
          const has2026 = target.includes('2026');
          const has2027 = target.includes('2027');

          if (isKnoah) {
            matchesSub =
              (itemEntity.includes('knoah') || itemSub.includes('knoah') || itemTitle.includes('knoah')) &&
              (!has2026 || itemYear === '2026' || itemSub.includes('2026') || itemTitle.includes('2026')) &&
              (!has2027 || itemYear === '2027' || itemSub.includes('2027') || itemTitle.includes('2027'));
          } else if (isRedGoose) {
            matchesSub =
              (itemEntity.includes('red') || itemSub.includes('red') || itemTitle.includes('red')) &&
              (!has2026 || itemYear === '2026' || itemSub.includes('2026') || itemTitle.includes('2026')) &&
              (!has2027 || itemYear === '2027' || itemSub.includes('2027') || itemTitle.includes('2027'));
          } else if (isPetc) {
            matchesSub =
              (itemEntity.includes('petc') || itemSub.includes('petc') || itemTitle.includes('petc')) &&
              (!has2026 || itemYear === '2026' || itemSub.includes('2026') || itemTitle.includes('2026')) &&
              (!has2027 || itemYear === '2027' || itemSub.includes('2027') || itemTitle.includes('2027'));
          } else {
            const tokens = target.split(/[-_ ]+/).filter(Boolean);
            matchesSub = tokens.every(
              token =>
                itemSub.includes(token) ||
                itemSubId.includes(token) ||
                itemEntity.includes(token) ||
                itemTitle.includes(token)
            );
          }
        }

        if (!matchesSub) return false;
      }

      // 5. Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const inName = item.fileName?.toLowerCase().includes(q);
        const inTitle = item.title?.toLowerCase().includes(q);
        const inEst = item.establishment?.toLowerCase().includes(q);
        const inDesc = item.description?.toLowerCase().includes(q);
        const inNotes = item.notes?.toLowerCase().includes(q);
        const inEntity = item.entity?.toLowerCase().includes(q);
        const inSub = item.subCategory?.toLowerCase().includes(q);
        if (!inName && !inTitle && !inEst && !inDesc && !inNotes && !inEntity && !inSub) {
          return false;
        }
      }

      return true;
    });
  }, [items, activeNav, searchQuery, showAllFiles]);

  // Helper to extract items matching any specific folder navigation node
  const getItemsForFolder = (navTarget) => {
    const nav = navTarget || activeNav;
    if (nav.type === 'all') {
      return items;
    }

    return items.filter(item => {
      // 1. Category Filtering
      const activeType = (nav.type || '').toLowerCase();
      if (activeType && activeType !== 'all') {
        const itemCatId = (item.categoryId || '').toLowerCase();
        const itemCat = (item.category || '').toLowerCase();
        const matchesCategory =
          itemCatId === activeType ||
          itemCat === activeType ||
          itemCat.replace(/\s+/g, '-') === activeType ||
          (activeType === 'expenses' && itemCat.includes('expense')) ||
          (activeType === 'petc-sales' && (itemCat.includes('sale') || itemCat.includes('emission'))) ||
          (activeType === 'petc-income' && (itemCat.includes('income') || itemCat.includes('revenue') || itemCat.includes('collection'))) ||
          (activeType === 'petc-insurance' && (itemCat.includes('insurance') || itemCat.includes('ctpl'))) ||
          (activeType === 'consumables' && itemCat.includes('consumable')) ||
          (activeType === 'vouchers' && itemCat.includes('voucher'));

        if (!matchesCategory) return false;
      }

      // 2. Year Filtering
      if (nav.year) {
        const itemYear = String(item.year || '');
        if (itemYear && itemYear !== String(nav.year)) {
          return false;
        }
      }

      // 3. Month Filtering
      if (nav.month) {
        const itemMonth = (item.month || '').toUpperCase();
        const navMonth = String(nav.month).toUpperCase();
        if (itemMonth && itemMonth !== navMonth) {
          return false;
        }
      }

      // 4. SubCategory & Branch Filtering
      if (nav.subCategory) {
        const target = nav.subCategory.toLowerCase();
        const itemSub = (item.subCategory || '').toLowerCase();
        const itemSubId = (item.subCategoryId || '').toLowerCase();
        const itemEntity = (item.entity || '').toLowerCase();
        const itemTitle = (item.title || '').toLowerCase();
        const itemYear = String(item.year || '').toLowerCase();

        const exactMatch =
          itemSubId === target ||
          itemSub === target ||
          itemSub.replace(/\s+/g, '-') === target ||
          itemSub.replace(/\s+/g, '-').includes(target);

        let matchesSub = exactMatch;
        if (!matchesSub) {
          const isKnoah = target.includes('knoah');
          const isRedGoose = target.includes('red-goose') || target.includes('redgoose');
          const isPetc = target.includes('petc');
          const has2026 = target.includes('2026');
          const has2027 = target.includes('2027');

          if (isKnoah) {
            matchesSub =
              (itemEntity.includes('knoah') || itemSub.includes('knoah') || itemTitle.includes('knoah')) &&
              (!has2026 || itemYear === '2026' || itemSub.includes('2026') || itemTitle.includes('2026')) &&
              (!has2027 || itemYear === '2027' || itemSub.includes('2027') || itemTitle.includes('2027'));
          } else if (isRedGoose) {
            matchesSub =
              (itemEntity.includes('red') || itemSub.includes('red') || itemTitle.includes('red')) &&
              (!has2026 || itemYear === '2026' || itemSub.includes('2026') || itemTitle.includes('2026')) &&
              (!has2027 || itemYear === '2027' || itemSub.includes('2027') || itemTitle.includes('2027'));
          } else if (isPetc) {
            matchesSub =
              (itemEntity.includes('petc') || itemSub.includes('petc') || itemTitle.includes('petc')) &&
              (!has2026 || itemYear === '2026' || itemSub.includes('2026') || itemTitle.includes('2026')) &&
              (!has2027 || itemYear === '2027' || itemSub.includes('2027') || itemTitle.includes('2027'));
          } else {
            const tokens = target.split(/[-_ ]+/).filter(Boolean);
            matchesSub = tokens.every(
              token =>
                itemSub.includes(token) ||
                itemSubId.includes(token) ||
                itemEntity.includes(token) ||
                itemTitle.includes(token)
            );
          }
        }
        if (!matchesSub) return false;
      }

      return true;
    });
  };

  // Export any selected folder's records into a clean, executive formal Excel (.xlsx) file
  const exportFolderToExcel = (targetNav) => {
    const nav = targetNav || activeNav;
    const folderLabel = nav.label || 'Inventory Folder';
    const folderItems = getItemsForFolder(nav);

    if (!folderItems || folderItems.length === 0) {
      showNotice(`No records found in "${folderLabel}" to export.`, 'error');
      return;
    }

    try {
      const encodeCell = (r, c) => XLSX.utils.encode_cell({ r, c });
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      // 1. Prepare raw matrix with Title and Subtitle Block
      const aoa = [
        ['KM100 DOCUMENT INVENTORY SYSTEM - ' + folderLabel.toUpperCase()],
        ['DEPARTMENT / FOLDER: ' + folderLabel + '   |   EXPORT DATE: ' + dateStr + ' ' + timeStr + '   |   TOTAL DOCUMENTS: ' + folderItems.length + '   |   AUDIT STATUS: VERIFIED RECORDS'],
        [], // Spacer row
        ['No.', 'File Name', 'Document Title', 'Establishment / Store', 'Category', 'Sub-Category', 'Entity / Branch', 'Receipt Date', 'Date Scanned / Recorded', 'Amount (PHP)', 'Invoice / OR No.', 'Audit Status']
      ];

      // 2. Map and clean each item row
      folderItems.forEach((item, index) => {
        const amt = parseFloat(item.amount) || 0;

        // Clean document title: strip invoice/OR/reference numbers from the title so it only appears in its own column
        let rawTitle = (item.title || item.description || '-').trim();
        const matchedInvoice = rawTitle.match(/\s*\(?(?:№|No\.?|OR|Invoice|Ref|#)[\s:#-]*([A-Za-z0-9-]+)\)?/i);
        let invoiceNo = item.orNumber || item.refNo || item.previewData?.invoice_number || item.previewData?.reference_no || '';
        if (!invoiceNo && matchedInvoice && matchedInvoice[1]) {
          invoiceNo = matchedInvoice[1];
        }

        // Clean Title without invoice number
        let cleanDocTitle = rawTitle
          .replace(/\s*\(?(?:№|No\.?|OR|Invoice|Ref|#)[\s:#-]*[A-Za-z0-9-]+\)?/gi, '')
          .replace(/[\s\-()]+$/, '')
          .trim();
        if (!cleanDocTitle) cleanDocTitle = item.description || item.establishment || '-';

        aoa.push([
          index + 1,
          item.fileName || '-',
          cleanDocTitle,
          item.establishment || item.previewData?.establishment || '-',
          item.category || '-',
          item.subCategory || '-',
          item.entity || '-',
          item.receiptDate || item.previewData?.receipt_date || '-',
          item.scannedDate || item.createdAt || '-',
          amt,
          invoiceNo || '-',
          item.status || 'Active'
        ]);
      });

      // 3. Add highlighted Total Summary row at bottom
      const totalAmount = folderItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      const summaryRowIdx = aoa.length;
      aoa.push([
        '', '', '', '', '', '', '', '', 'GRAND TOTAL SUM (PHP):', totalAmount, '', ''
      ]);

      // 4. Generate worksheet from matrix
      const ws = XLSX.utils.aoa_to_sheet(aoa);

      // --- STYLES DEFINITION FOR FORMAL CORPORATE OFFICE ENVIRONMENT ---
      const titleStyle = {
        font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '0F172A' } }, // Deep Executive Navy
        alignment: { horizontal: 'center', vertical: 'center' }
      };

      const metaStyle = {
        font: { name: 'Calibri', sz: 9.5, italic: true, color: { rgb: '475569' } },
        fill: { fgColor: { rgb: 'F1F5F9' } }, // Cool Corporate Gray
        alignment: { horizontal: 'center', vertical: 'center' }
      };

      const headerStyle = {
        font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1E293B' } }, // Navy Header
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'thin', color: { rgb: '475569' } },
          bottom: { style: 'medium', color: { rgb: '0F172A' } },
          left: { style: 'thin', color: { rgb: '475569' } },
          right: { style: 'thin', color: { rgb: '475569' } }
        }
      };

      const cellBorder = {
        top: { style: 'thin', color: { rgb: 'E2E8F0' } },
        bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
        left: { style: 'thin', color: { rgb: 'E2E8F0' } },
        right: { style: 'thin', color: { rgb: 'E2E8F0' } }
      };

      const totalLabelStyle = {
        font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '065F46' } },
        fill: { fgColor: { rgb: 'ECFDF5' } }, // Soft Emerald Mint
        alignment: { horizontal: 'right', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '059669' } },
          bottom: { style: 'double', color: { rgb: '059669' } },
          left: { style: 'thin', color: { rgb: 'A7F3D0' } },
          right: { style: 'thin', color: { rgb: 'A7F3D0' } }
        }
      };

      const totalAmountStyle = {
        font: { name: 'Calibri', sz: 12, bold: true, color: { rgb: '064E3B' } },
        fill: { fgColor: { rgb: 'D1FAE5' } }, // Prominent Emerald Highlight
        alignment: { horizontal: 'right', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '059669' } },
          bottom: { style: 'double', color: { rgb: '047857' } }, // Classic accounting double underline
          left: { style: 'thin', color: { rgb: '059669' } },
          right: { style: 'thin', color: { rgb: '059669' } }
        },
        numFmt: '#,##0.00'
      };

      // 5. Apply Title Row 0 styles
      for (let c = 0; c < 12; c++) {
        const ref = encodeCell(0, c);
        if (!ws[ref]) ws[ref] = { t: 's', v: '' };
        ws[ref].s = titleStyle;
      }
      ws['A1'].v = 'KM100 DOCUMENT INVENTORY SYSTEM - ' + folderLabel.toUpperCase();

      // Apply Meta Row 1 styles
      for (let c = 0; c < 12; c++) {
        const ref = encodeCell(1, c);
        if (!ws[ref]) ws[ref] = { t: 's', v: '' };
        ws[ref].s = metaStyle;
      }

      // Apply Table Header Row 3 styles
      for (let c = 0; c < 12; c++) {
        const ref = encodeCell(3, c);
        if (ws[ref]) ws[ref].s = headerStyle;
      }

      // Apply Data Rows styling (zebra striping & clean cell alignments)
      folderItems.forEach((_, idx) => {
        const r = 4 + idx;
        const isEven = idx % 2 === 0;
        const bg = isEven ? 'FFFFFF' : 'F8FAFC';

        for (let c = 0; c < 12; c++) {
          const ref = encodeCell(r, c);
          if (!ws[ref]) ws[ref] = { t: 's', v: '' };

          let align = 'left';
          if (c === 0 || c === 6 || c === 7 || c === 8 || c === 10 || c === 11) align = 'center';
          if (c === 9) align = 'right';

          let fontColor = '1E293B';
          let bold = false;
          if (c === 2) bold = true; // Highlight Document title
          if (c === 9) { bold = true; fontColor = '0F172A'; } // Amount
          if (c === 10) { bold = true; fontColor = '0284C7'; } // Invoice / OR No.
          if (c === 11) { bold = true; fontColor = '059669'; } // Active status

          const cellStyle = {
            font: { name: 'Calibri', sz: 10, bold, color: { rgb: fontColor } },
            fill: { fgColor: { rgb: bg } },
            alignment: { horizontal: align, vertical: 'center' },
            border: cellBorder
          };

          if (c === 9) {
            cellStyle.numFmt = '#,##0.00';
            ws[ref].t = 'n';
          }

          ws[ref].s = cellStyle;
        }
      });

      // Apply Total Summary Row styling (High Importance Highlight)
      for (let c = 0; c < 12; c++) {
        const ref = encodeCell(summaryRowIdx, c);
        if (!ws[ref]) ws[ref] = { t: 's', v: '' };
        if (c === 9) {
          ws[ref].s = totalAmountStyle;
          ws[ref].t = 'n';
        } else {
          ws[ref].s = totalLabelStyle;
        }
      }

      // Row heights (Title 32pt, Meta 20pt, Spacer 10pt, Header 28pt, Data 22pt, Total 28pt)
      const rowHeights = [
        { hpt: 32 },
        { hpt: 20 },
        { hpt: 10 },
        { hpt: 28 }
      ];
      folderItems.forEach(() => rowHeights.push({ hpt: 22 }));
      rowHeights.push({ hpt: 28 });
      ws['!rows'] = rowHeights;

      // Cell Merges: Title across A-L, Meta across A-L, Summary label across A-I
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } },
        { s: { r: summaryRowIdx, c: 0 }, e: { r: summaryRowIdx, c: 8 } }
      ];

      // Auto-sized professional column widths
      ws['!cols'] = [
        { wch: 8 },   // No.
        { wch: 34 },  // File Name
        { wch: 38 },  // Document Title
        { wch: 28 },  // Establishment / Store
        { wch: 18 },  // Category
        { wch: 24 },  // Sub-Category
        { wch: 18 },  // Entity / Branch
        { wch: 16 },  // Receipt Date
        { wch: 24 },  // Date Scanned / Recorded
        { wch: 22 },  // Amount (PHP)
        { wch: 22 },  // Invoice / OR No.
        { wch: 16 },  // Audit Status
      ];

      // 6. Create workbook and add worksheet
      const wb = XLSX.utils.book_new();
      const safeSheetName = folderLabel.replace(/[\\/?*:[\]]/g, '').slice(0, 31) || 'Inventory';
      XLSX.utils.book_append_sheet(wb, ws, safeSheetName);

      // 7. Clean download file name and initiate instant browser download
      const cleanLabel = folderLabel.replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/_+/g, '_');
      const todayDate = new Date().toISOString().split('T')[0];
      const downloadFileName = `${cleanLabel}_${todayDate}.xlsx`;

      try {
        XLSX.writeFile(wb, downloadFileName);
      } catch (writeErr) {
        // Fallback for browsers or mobile web apps requiring Blob URL trigger
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }

      showNotice(`Exported ${folderItems.length} records to "${downloadFileName}"!`);
    } catch (err) {
      console.error('Failed to export folder to Excel:', err);
      showNotice('Export failed: ' + (err.message || err), 'error');
    }
  };

  // Open & Close Add Document Modal
  const openAddModal = () => {
    setAddMode('options');
    setInsertedFile(null);
    setCapturedReceiptPhoto(null);
    setScannedRefNo(`OR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setScannedAmount('');
    setIsSavingScan(false);
    setIsOcrProcessing(false);
    setIsOcrVerifiedView(false);
    setOcrValidationError('');
    setOcrReceiptName('');
    setOcrEstablishment('');
    setOcrReceiptDate('');
    setOcrDescription('');
    setOcrAmount('');
    setOcrOrNumber('');
    stopCamera();

    // Auto-select receipt classification based on current active navigation context
    if (activeNav.type === 'petc-sales') {
      const match = RECEIPT_TYPES.find(r => r.id === 'petc-sales');
      if (match) setSelectedReceiptType(match);
    } else if (activeNav.type === 'petc-income') {
      const match = RECEIPT_TYPES.find(r => r.id === 'petc-income');
      if (match) setSelectedReceiptType(match);
    } else if (activeNav.type === 'petc-insurance') {
      const match = RECEIPT_TYPES.find(r => r.id === 'petc-insurance');
      if (match) setSelectedReceiptType(match);
    } else if (activeNav.type === 'expenses') {
      let expenseId = 'expenses-petc';
      if (activeNav.subCategory?.includes('Red Goose')) {
        expenseId = 'expenses-red-goose';
      } else if (activeNav.subCategory?.includes('Knoah Mari')) {
        expenseId = 'expenses-knoah-mari';
      }
      const match = RECEIPT_TYPES.find(r => r.id === expenseId);
      if (match) setSelectedReceiptType(match);
    } else if (activeNav.type === 'consumables') {
      const match = RECEIPT_TYPES.find(r => r.id === 'consumables-delivery');
      if (match) setSelectedReceiptType(match);
    } else if (activeNav.type === 'vouchers') {
      const match = RECEIPT_TYPES.find(r => r.id === 'voucher-disbursement');
      if (match) setSelectedReceiptType(match);
    }

    setShowAddModal(true);
  };

  const closeAddModal = () => {
    stopCamera();
    setShowAddModal(false);
  };

  // --- Option 1: Insert Document Handlers ---
  const handleDeviceFileSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setInsertedFile(file);
    }
  };

  const handleSaveInsertedFile = async () => {
    if (!insertedFile) return;
    setIsUploading(true);

    try {
      // 1. Upload to backend
      const formData = new FormData();
      formData.append('file', insertedFile);
      await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      });

      // Target category based on active sidebar selection
      let targetCategory = 'PETC Sales';
      let targetCategoryId = 'petc-sales';
      let targetEntity = 'PETC';
      let targetSubCategory = '';
      let targetYear = activeNav.year || '2026';
      let targetMonth = activeNav.month || 'FEB';

      if (activeNav.type === 'petc-sales') {
        targetCategory = 'PETC Sales';
        targetCategoryId = 'petc-sales';
        targetEntity = 'PETC';
      } else if (activeNav.type === 'petc-income') {
        targetCategory = 'PETC Income';
        targetCategoryId = 'petc-income';
        targetEntity = 'PETC';
      } else if (activeNav.type === 'expenses') {
        targetCategory = 'Expenses';
        targetCategoryId = 'expenses';
        targetSubCategory = activeNav.subCategory || 'Expenses 2026 (PETC)';
        targetEntity = activeNav.subCategory?.includes('Red Goose') ? 'Red Goose' : activeNav.subCategory?.includes('Knoah Mari') ? 'Knoah Mari' : 'PETC';
      } else if (activeNav.type === 'consumables') {
        targetCategory = 'Consumables';
        targetCategoryId = 'consumables';
        targetSubCategory = activeNav.subCategory || 'Office supply';
        targetEntity = 'General';
      } else if (activeNav.type === 'vouchers') {
        targetCategory = 'Vouchers';
        targetCategoryId = 'vouchers';
        targetSubCategory = activeNav.subCategory || 'PETC';
        targetEntity = activeNav.subCategory || 'PETC';
      } else if (activeNav.type === 'petc-insurance') {
        targetCategory = 'PETC Insurance';
        targetCategoryId = 'petc-insurance';
        targetEntity = 'PETC';
      }

      const fileExt = insertedFile.name.includes('.') ? insertedFile.name.split('.').pop().toUpperCase() : 'PDF';

      const newItemPayload = {
        id: `DOC-${Date.now()}`,
        fileName: insertedFile.name,
        title: insertedFile.name.replace(/\.[^/.]+$/, ''),
        category: targetCategory,
        categoryId: targetCategoryId,
        subCategory: targetSubCategory || targetMonth,
        entity: targetEntity,
        year: targetYear,
        month: targetMonth,
        amount: 0,
        currency: 'PHP',
        quantity: 1,
        unit: 'document',
        status: 'Active',
        fileFormat: fileExt,
        fileSize: `${(insertedFile.size / 1024).toFixed(1)} KB`,
        notes: `Document inserted from device storage on ${new Date().toLocaleDateString()}. Destination: ${activeNav.label}`,
        tags: [targetCategory, targetEntity, fileExt]
      };

      // Save directly to Supabase PostgreSQL database
      const dbRow = mapToDb(newItemPayload);
      await supabase.from('inventory_items').upsert(dbRow);

      // Optimistically update state & persist to system cache immediately
      setItems(prev => {
        const next = [newItemPayload, ...prev.filter(i => i.id !== newItemPayload.id)];
        saveCachedItems(next);
        return next;
      });

      // Also notify local backend if available
      try {
        await fetch(`${API_BASE}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItemPayload)
        });
      } catch (e) {
        // local backend optional
      }

      showNotice(`File "${insertedFile.name}" inserted and cataloged!`);
      closeAddModal();
      fetchData(true);
    } catch (err) {
      console.error(err);
      showNotice('Failed to upload and save document', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // --- Option 2: Scan Receipt Handlers ---
  const startCamera = async (facing = cameraFacing) => {
    stopCamera();
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });
      } catch (e1) {
        // Fallback to any available camera without constraint
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.setAttribute('muted', 'true');
        await videoRef.current.play().catch(e => console.warn('Video play warning:', e));
      }
      setCameraStream(stream);
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera access error:', err);
      showNotice('Camera not accessible. Please allow camera permissions or upload a receipt photo.', 'error');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  const flipCamera = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  // Helper to downscale and compress mobile camera photos to ~150KB for fast Supabase storage
  // Helper to downscale and compress camera photos to ~80KB for lightning-fast processing
  const compressReceiptImage = (fileOrDataUrl, maxDim = 1000, quality = 0.7) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => {
        resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : null);
      };

      if (typeof fileOrDataUrl === 'string') {
        img.src = fileOrDataUrl;
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target.result;
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(fileOrDataUrl);
      }
    });
  };

  // Handle OCR processing when image is snapped or uploaded (guaranteed fast response under 2s)
  const handleProcessReceiptPhoto = async (dataUrl) => {
    setCapturedReceiptPhoto(dataUrl);
    setIsOcrProcessing(true);
    setOcrStatusText('Analyzing receipt with Gemini Vision AI...');
    setOcrProgress(0.25);
    stopCamera();

    let finished = false;

    // Apply whatever details were ACTUALLY extracted from the scanned image (NO hardcoded data)
    const applyOcrResult = (parsed) => {
      // 1. Strict Validation: Check if the image was identified as NOT a receipt
      if (parsed && parsed.isReceipt === false) {
        setIsOcrProcessing(false);
        setIsOcrVerifiedView(false);
        setOcrValidationError(parsed.rejectionReason || 'The scanned image is not a recognized official receipt, invoice, or voucher.');
        showNotice('Scan Rejected: The photo is not a receipt and cannot be saved.', 'error');
        return;
      }

      // 2. Secondary verification: ensure valid receipt data exists
      const parsedAmt = parsed?.amount ? parseFloat(parsed.amount) : 0;
      const parsedEst = (parsed?.establishment || '').trim();
      const parsedOr = (parsed?.orNumber || '').trim();

      const hasReceiptData = Boolean((parsedEst.length >= 2) || (parsedAmt > 0) || (parsedOr.length >= 2));
      if (!hasReceiptData) {
        setIsOcrProcessing(false);
        setIsOcrVerifiedView(false);
        setOcrValidationError('Unable to detect any valid receipt data (establishment, amount, or invoice number). Please take a clearer photo of an official receipt.');
        showNotice('Scan Rejected: No receipt data found in photo.', 'error');
        return;
      }

      // Valid receipt detected! Clear any validation error and proceed to review
      setOcrValidationError('');
      setOcrEstablishment(parsedEst || (selectedReceiptType?.entity ? `${selectedReceiptType.entity} Testing Center` : ''));
      setOcrReceiptDate(parsed?.receiptDate || new Date().toISOString().split('T')[0]);

      // Default description MUST match the user's selected receipt classification!
      let defaultDesc = selectedReceiptType?.name || 'Official Receipt';
      if (selectedReceiptType?.id === 'petc-sales') {
        defaultDesc = 'Vehicle Emission Testing Sales';
      } else if (selectedReceiptType?.id === 'petc-income') {
        defaultDesc = 'Daily Collection / Revenue';
      } else if (selectedReceiptType?.id === 'petc-insurance') {
        defaultDesc = 'PETC CTPL Insurance Payment';
      } else if (selectedReceiptType?.id === 'consumables-delivery') {
        defaultDesc = 'Office & Testing Supplies';
      } else if (selectedReceiptType?.id === 'voucher-disbursement') {
        defaultDesc = 'Petty Cash Payment Voucher';
      } else if (selectedReceiptType?.categoryId === 'expenses') {
        defaultDesc = `${selectedReceiptType.entity || 'PETC'} Operational Expense`;
      }

      setOcrDescription(parsed?.description || defaultDesc);
      setOcrAmount(parsedAmt > 0 ? parsedAmt.toString() : '');
      setOcrOrNumber(parsedOr);

      const refCode = (parsedOr || `${Math.floor(1000 + Math.random() * 9000)}`).trim();
      const defaultName = `Scanned_${selectedReceiptType?.prefix || 'REC'}_${refCode}`;
      setOcrReceiptName(defaultName);

      setIsOcrProcessing(false);
      setIsOcrVerifiedView(true);
      showNotice(`Receipt verified as ${selectedReceiptType?.name}! Please review details.`);
    };

    // Safety fallback: maximum 12 seconds wait time for AI recognition
    const safetyTimer = setTimeout(() => {
      if (!finished) {
        finished = true;
        applyOcrResult(null);
      }
    }, 12000);

    try {
      const parsed = await runOcrOnImage(dataUrl, (prog, msg) => {
        setOcrProgress(prog);
        setOcrStatusText(msg);
      }, selectedReceiptType);

      if (!finished) {
        finished = true;
        clearTimeout(safetyTimer);
        applyOcrResult(parsed);
      }
    } catch (err) {
      console.warn('OCR processing error:', err);
      if (!finished) {
        finished = true;
        clearTimeout(safetyTimer);
        applyOcrResult(null);
      }
    }
  };

  // Save the verified receipt data into its dedicated database table
  const saveVerifiedReceiptToDatabase = async () => {
    if (!capturedReceiptPhoto) {
      showNotice('Please capture or select a receipt photo first', 'error');
      return;
    }

    if (ocrValidationError) {
      showNotice('Cannot save: The scanned photo was rejected as not a receipt.', 'error');
      return;
    }

    const amt = parseFloat(ocrAmount) || 0;
    const est = (ocrEstablishment || '').trim();
    const orNum = (ocrOrNumber || '').trim();

    // Strict validation: Reject if there are no valid receipt details at all
    if (!est && amt <= 0 && !orNum) {
      showNotice('Cannot save: No valid receipt details found. The system does not allow saving non-receipt photos.', 'error');
      return;
    }

    setIsSavingScan(true);
    try {
      const establishment = (ocrEstablishment || (selectedReceiptType.entity ? `${selectedReceiptType.entity} Center` : 'Official Store')).trim();
      const receiptDate = (ocrReceiptDate || new Date().toISOString().split('T')[0]).trim();

      let fallbackDesc = selectedReceiptType.name || 'Official Receipt';
      if (selectedReceiptType.id === 'petc-sales') fallbackDesc = 'Vehicle Emission Testing Sales';
      else if (selectedReceiptType.id === 'petc-income') fallbackDesc = 'Daily Collection / Revenue';
      else if (selectedReceiptType.id === 'petc-insurance') fallbackDesc = 'PETC CTPL Insurance Payment';
      else if (selectedReceiptType.id === 'consumables-delivery') fallbackDesc = 'Office & Testing Supplies';
      else if (selectedReceiptType.id === 'voucher-disbursement') fallbackDesc = 'Petty Cash Payment Voucher';
      else if (selectedReceiptType.categoryId === 'expenses') fallbackDesc = `${selectedReceiptType.entity || 'PETC'} Operational Expense`;

      const description = (ocrDescription || fallbackDesc).trim();
      const amt = parseFloat(ocrAmount) || 0;
      const refCode = (ocrOrNumber || `${Math.floor(1000 + Math.random() * 9000)}`).trim();
      
      let rawCustomName = (ocrReceiptName || '').trim();
      let receiptFileName = '';
      let receiptTitle = '';

      if (rawCustomName) {
        receiptFileName = rawCustomName.match(/\.(jpg|jpeg|png|pdf)$/i)
          ? rawCustomName
          : `${rawCustomName}.jpg`;
        receiptTitle = rawCustomName.replace(/\.[^/.]+$/, '');
      } else {
        receiptFileName = `Scanned_${selectedReceiptType.prefix}_${refCode}.jpg`;
        receiptTitle = `${establishment} - ${description}`;
      }

      const scanDateToday = new Date().toISOString().split('T')[0];
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const currentMonthName = monthNames[new Date().getMonth()] || 'FEB';

      const targetYear = activeNav.year || scanDateToday.split('-')[0] || '2026';
      const targetMonth = activeNav.month || currentMonthName;

      let targetSubCat = selectedReceiptType.subCategory || 'Receipt Scan';
      if (selectedReceiptType.categoryId === 'petc-sales') {
        targetSubCat = targetMonth ? `Sales ${targetYear} (${targetMonth})` : 'Emission Testing Sales';
      } else if (selectedReceiptType.categoryId === 'petc-income') {
        targetSubCat = targetMonth ? `Income ${targetYear} (${targetMonth})` : 'Daily Collection';
      }

      const scannedItemPayload = {
        id: `SCN-${Date.now()}`,
        fileName: receiptFileName,
        title: receiptTitle,
        establishment,
        receiptDate,
        scannedDate: scanDateToday,
        description,
        category: selectedReceiptType.category,
        categoryId: selectedReceiptType.categoryId,
        subCategory: targetSubCat,
        entity: selectedReceiptType.entity,
        year: targetYear,
        month: targetMonth,
        amount: amt,
        currency: 'PHP',
        quantity: 1,
        unit: 'receipt',
        status: 'Scanned & Verified',
        fileFormat: 'JPG',
        fileSize: `${Math.round(capturedReceiptPhoto.length * 0.75 / 1024)} KB`,
        filePath: capturedReceiptPhoto,
        notes: `Establishment: ${establishment} | Scanned: ${scanDateToday} | Date: ${receiptDate} | Classification: ${selectedReceiptType.name} | Category: ${selectedReceiptType.category} | Description: ${description} | Amount: PHP ${amt.toLocaleString()} | Reference: ${refCode}.`,
        tags: ['Scanned Receipt', establishment, selectedReceiptType.name, selectedReceiptType.entity, selectedReceiptType.category],
        previewData: {
          establishment,
          receipt_date: receiptDate,
          description,
          amount: amt,
          or_number: refCode,
          category: selectedReceiptType.category,
          entity: selectedReceiptType.entity,
          columns: ['Receipt Field', 'Extracted Value'],
          rows: [
            ['Establishment', establishment],
            ['Receipt Date', receiptDate],
            ['Description', description],
            ['Total Amount', amt > 0 ? `PHP ${amt.toLocaleString()}` : 'Unspecified'],
            ['Official Ref / Invoice No.', refCode],
            ['Assigned Category', selectedReceiptType.category],
            ['Assigned Entity', selectedReceiptType.entity],
            ['Target Database Table', `public.${selectedReceiptType.tableName || 'inventory_items'}`],
            ['Scan Timestamp', new Date().toLocaleString()]
          ],
          summary: {
            'Establishment': establishment,
            'Receipt Date': receiptDate,
            'Category': selectedReceiptType.category,
            'Entity': selectedReceiptType.entity,
            'Total Amount': amt > 0 ? `PHP ${amt.toLocaleString()}` : 'N/A',
            'Official Ref': refCode
          }
        }
      };

      // 1. Direct Supabase PostgreSQL upsert to dedicated receipt table (e.g. petc_sales_receipts, knoah_mari_expense_receipts)
      const targetTable = selectedReceiptType.tableName;
      if (targetTable && targetTable !== 'inventory_items') {
        let dedicatedRecord = {
          id: scannedItemPayload.id,
          or_number: refCode,
          file_name: receiptFileName,
          title: scannedItemPayload.title,
          establishment,
          receipt_date: receiptDate,
          description,
          category: scannedItemPayload.category,
          entity: scannedItemPayload.entity,
          year: scannedItemPayload.year,
          month: scannedItemPayload.month,
          amount: amt,
          currency: 'PHP',
          status: 'Scanned & Verified',
          file_format: 'JPG',
          file_size: scannedItemPayload.fileSize,
          file_path: capturedReceiptPhoto,
          notes: scannedItemPayload.notes,
          tags: scannedItemPayload.tags,
          preview_data: scannedItemPayload.previewData,
          scanned_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        if (targetTable.includes('expense') || targetTable.includes('consumables') || targetTable.includes('voucher')) {
          dedicatedRecord.sub_category = scannedItemPayload.subCategory;
        }

        // Add 7s race timeout so save never hangs indefinitely
        const savePromise = supabase.from(targetTable).upsert(dedicatedRecord);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Network connection timeout. Please verify your connection.')), 7000)
        );

        let { error: dedicatedErr } = await Promise.race([savePromise, timeoutPromise]);
        if (dedicatedErr && dedicatedErr.code === 'PGRST204') {
          delete dedicatedRecord.establishment;
          delete dedicatedRecord.receipt_date;
          delete dedicatedRecord.description;
          delete dedicatedRecord.sub_category;
          const retryRes = await supabase.from(targetTable).upsert(dedicatedRecord);
          dedicatedErr = retryRes.error;
        }

        if (dedicatedErr) {
          console.error(`Dedicated table "${targetTable}" error:`, dedicatedErr);
        }
      }

      // 2. Mirror into master inventory_items
      try {
        let dbRow = mapToDb(scannedItemPayload);
        const invPromise = supabase.from('inventory_items').upsert(dbRow);
        const invTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Master inventory timeout')), 7000)
        );
        let { error: invErr } = await Promise.race([invPromise, invTimeout]);
        if (invErr && invErr.code === 'PGRST204') {
          delete dbRow.establishment;
          delete dbRow.receipt_date;
          delete dbRow.description;
          await supabase.from('inventory_items').upsert(dbRow);
        }
      } catch (mirrorErr) {
        console.warn('Master inventory mirror error:', mirrorErr);
      }

      // 3. Update local state immediately & persist to system cache
      setItems(prev => {
        const next = [scannedItemPayload, ...prev.filter(i => i.id !== scannedItemPayload.id)];
        saveCachedItems(next);
        return next;
      });

      // 4. Success feedback and close modal IMMEDIATELY
      stopCamera();
      closeAddModal();
      showNotice(`Receipt from "${establishment}" (PHP ${amt.toLocaleString()}) saved as ${selectedReceiptType.category}!`);
      fetchData(true);
    } catch (err) {
      console.error('Error saving scanned receipt:', err);
      showNotice('Failed to save scanned receipt: ' + (err.message || err), 'error');
    } finally {
      setIsSavingScan(false);
    }
  };

  const captureCameraSnapshotAndAutoSave = async () => {
    if (videoRef.current) {
      const maxDim = 900;
      let w = videoRef.current.videoWidth || 900;
      let h = videoRef.current.videoHeight || 675;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.65);
      await handleProcessReceiptPhoto(dataUrl);
    }
  };

  const handleReceiptPhotoSelect = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      try {
        const compressedDataUrl = await compressReceiptImage(file, 900, 0.65);
        if (compressedDataUrl) {
          await handleProcessReceiptPhoto(compressedDataUrl);
        } else {
          showNotice('Failed to process receipt image file', 'error');
        }
      } catch (err) {
        showNotice('Failed to process image: ' + err.message, 'error');
      }
    }
  };

  // Delete Item
  const handleDeleteItem = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const itemToDelete = items.find(i => i.id === id);
      if (itemToDelete?.sourceTable) {
        await supabase.from(itemToDelete.sourceTable).delete().eq('id', id);
      }
      await supabase.from('inventory_items').delete().eq('id', id);
      try {
        await fetch(`${API_BASE}/items/${id}`, { method: 'DELETE' });
      } catch (e) {
        // optional local sync
      }
      setItems(prev => {
        const next = prev.filter(i => i.id !== id);
        saveCachedItems(next);
        return next;
      });
      showNotice(`Deleted "${name}"`);
      if (viewItem?.id === id) setViewItem(null);
      fetchData(true);
    } catch (err) {
      console.error(err);
      showNotice('Failed to delete item', 'error');
    }
  };

  // Rename Saved Document
  const handleRenameItem = async () => {
    if (!renameItem || !renameNewName.trim()) return;
    const rawNewName = renameNewName.trim();
    setIsRenaming(true);
    try {
      const id = renameItem.id;
      const ext = (renameItem.fileFormat || 'JPG').toLowerCase();
      const finalFileName = rawNewName.includes('.') ? rawNewName : `${rawNewName}.${ext}`;
      const finalTitle = rawNewName.replace(/\.[^/.]+$/, '');

      // 1. Update master inventory_items table
      await supabase.from('inventory_items').update({
        file_name: finalFileName,
        title: finalTitle,
        updated_at: new Date().toISOString()
      }).eq('id', id);

      // 2. Update dedicated table if present
      const targetTable = renameItem.sourceTable;
      if (targetTable && targetTable !== 'inventory_items') {
        try {
          await supabase.from(targetTable).update({
            file_name: finalFileName,
            title: finalTitle,
            updated_at: new Date().toISOString()
          }).eq('id', id);
        } catch (tableErr) {
          console.warn(`Dedicated table rename (${targetTable}):`, tableErr);
        }
      }

      // 3. Update local state and cached items
      setItems(prev => {
        const next = prev.map(i => i.id === id ? { ...i, fileName: finalFileName, title: finalTitle } : i);
        saveCachedItems(next);
        return next;
      });

      // 4. Update Document Viewer modal if viewing this document
      if (viewItem && viewItem.id === id) {
        setViewItem(prev => ({ ...prev, fileName: finalFileName, title: finalTitle }));
      }

      showNotice(`Document renamed to "${finalFileName}"!`);
      setRenameItem(null);
      setRenameNewName('');
    } catch (err) {
      console.error('Failed to rename document:', err);
      showNotice('Failed to rename document: ' + (err.message || err), 'error');
    } finally {
      setIsRenaming(false);
    }
  };

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  // ----------------------------------------------------
  // LOGIN / CREATE ADMIN ACCOUNT VIEW (If not logged in)
  // ----------------------------------------------------
  if (!currentUser) {
    return (
      <View style={[styles.authContainer, isMobile && { padding: 12 }, isLight && styles.containerLight]}>
        {/* Quick Theme Toggle on Auth Screen */}
        <TouchableOpacity
          style={[{ position: 'absolute', top: 16, right: 16, zIndex: 10 }, styles.themeToggleBtn, isLight && styles.themeToggleBtnLight]}
          onPress={toggleTheme}
          accessibilityLabel={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
          {isLight ? <Moon size={14} color="#6366f1" /> : <Sun size={14} color="#f59e0b" />}
          <Text style={[styles.themeToggleBtnText, isLight && styles.themeToggleBtnTextLight]}>
            {isLight ? 'Dark Mode' : 'Light Mode'}
          </Text>
        </TouchableOpacity>

        {notification && (
          <View style={[styles.toast, notification.type === 'error' ? styles.toastError : styles.toastSuccess]}>
            {notification.type === 'error' ? <AlertTriangle size={18} color="#fff" /> : <CheckCircle2 size={18} color="#fff" />}
            <Text style={styles.toastText}>{notification.text}</Text>
          </View>
        )}

        <View style={[styles.authCard, isMobile && { padding: 18, borderRadius: 12 }, isLight && styles.authCardLight]}>
          {/* Top Brand & Security Tag */}
          <View style={styles.authHeader}>
            <View style={styles.authShieldIconBox}>
              <ShieldCheck size={28} color="#34d399" />
            </View>
            <View style={styles.authBadgePill}>
              <Text style={styles.authBadgePillText}>SUPABASE CLOUD AUTH</Text>
            </View>
            <Text style={[styles.authTitle, isLight && styles.authTitleLight]}>PETC Inventory System</Text>
            <Text style={[styles.authSubtitle, isLight && styles.authSubtitleLight]}>
              {authMode === 'login'
                ? 'Sign in with your Administrator credentials to access files'
                : 'Register a new Administrator account. All accounts have full admin privileges.'}
            </Text>
          </View>

          {/* Mode Switch Tabs */}
          <View style={styles.authTabs}>
            <TouchableOpacity
              style={[styles.authTab, authMode === 'login' && styles.authTabActive]}
              onPress={() => {
                setAuthMode('login');
                setAuthError('');
              }}
            >
              <LogIn size={15} color={authMode === 'login' ? '#38bdf8' : '#94a3b8'} />
              <Text style={[styles.authTabText, authMode === 'login' && styles.authTabTextActive]}>Admin Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.authTab, authMode === 'register' && styles.authTabActive]}
              onPress={() => {
                setAuthMode('register');
                setAuthError('');
              }}
            >
              <UserPlus size={15} color={authMode === 'register' ? '#38bdf8' : '#94a3b8'} />
              <Text style={[styles.authTabText, authMode === 'register' && styles.authTabTextActive]}>Create Admin</Text>
            </TouchableOpacity>
          </View>

          {/* Error Message Banner */}
          {authError ? (
            <View style={styles.authErrorBox}>
              <AlertTriangle size={16} color="#f87171" />
              <Text style={styles.authErrorText}>{authError}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.authForm}>
            {authMode === 'register' && (
              <View style={styles.authFieldGroup}>
                <Text style={styles.authLabel}>ADMIN FULL NAME</Text>
                <View style={styles.authInputWrapper}>
                  <User size={16} color="#64748b" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.authInput}
                    placeholder="e.g. Maria Santos"
                    placeholderTextColor="#475569"
                    value={authFullName}
                    onChangeText={setAuthFullName}
                  />
                </View>
              </View>
            )}

            <View style={styles.authFieldGroup}>
              <Text style={styles.authLabel}>ADMIN EMAIL ADDRESS</Text>
              <View style={styles.authInputWrapper}>
                <Mail size={16} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.authInput}
                  placeholder="admin@petc.com"
                  placeholderTextColor="#475569"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={authEmail}
                  onChangeText={setAuthEmail}
                />
              </View>
            </View>

            <View style={styles.authFieldGroup}>
              <Text style={styles.authLabel}>PASSWORD</Text>
              <View style={styles.authInputWrapper}>
                <Lock size={16} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.authInput, { paddingRight: 40 }]}
                  placeholder={authMode === 'register' ? 'Min. 6 characters' : 'Enter your password'}
                  placeholderTextColor="#475569"
                  secureTextEntry={!showPassword}
                  value={authPassword}
                  onChangeText={setAuthPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(p => !p)}
                  style={styles.authEyeBtn}
                >
                  {showPassword ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
                </TouchableOpacity>
              </View>
            </View>

            {authMode === 'register' && (
              <View style={styles.authFieldGroup}>
                <Text style={styles.authLabel}>CONFIRM PASSWORD</Text>
                <View style={styles.authInputWrapper}>
                  <Lock size={16} color="#64748b" style={{ marginRight: 8 }} />
                  <TextInput
                    style={[styles.authInput, { paddingRight: 40 }]}
                    placeholder="Re-enter password to confirm"
                    placeholderTextColor="#475569"
                    secureTextEntry={!showPassword}
                    value={authConfirmPassword}
                    onChangeText={setAuthConfirmPassword}
                  />
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.authSubmitBtn, authLoading && { opacity: 0.6 }]}
              onPress={handleAuthSubmit}
              disabled={authLoading}
            >
              {authLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Key size={17} color="#fff" />
                  <Text style={styles.authSubmitBtnText}>
                    {authMode === 'login' ? 'Sign In as Administrator' : 'Create Administrator Account'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footnote */}
          <View style={styles.authFooter}>
            <View style={styles.adminSecurityNotice}>
              <ShieldCheck size={14} color="#34d399" />
              <Text style={styles.adminSecurityNoticeText}>
                Restricted System • Only Administrator accounts can be created
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isLight && styles.containerLight]}>
      {/* Notification Toast */}
      {notification && (
        <View style={[styles.toast, notification.type === 'error' ? styles.toastError : styles.toastSuccess]}>
          {notification.type === 'error' ? <AlertTriangle size={18} color="#fff" /> : <CheckCircle2 size={18} color="#fff" />}
          <Text style={styles.toastText}>{notification.text}</Text>
        </View>
      )}

      {/* GLOBAL PROFESSIONAL TOP HEADER BAR */}
      <View style={[
        styles.topHeader,
        isMobile && styles.topHeaderMobile,
        isSmallMobile && styles.topHeaderSmallMobile,
        isLight && styles.topHeaderLight
      ]}>
        <View style={[styles.topHeaderLeft, isSmallMobile && { gap: 6 }]}>
          <TouchableOpacity
            style={[
              styles.sidebarToggleBtn,
              isSmallMobile && { paddingHorizontal: 7, paddingVertical: 6 },
              isLight && styles.sidebarToggleBtnLight
            ]}
            onPress={() => setSidebarOpen(prev => !prev)}
            title={sidebarOpen ? "Hide directory tree" : "Browse all folders & branches"}
          >
            <FolderOpen size={isSmallMobile ? 15 : 16} color={isLight ? '#0284c7' : '#38bdf8'} />
            {!isSmallMobile && (
              <Text style={[styles.sidebarToggleBtnText, isLight && styles.sidebarToggleBtnTextLight]}>
                {sidebarOpen ? 'Hide' : 'Folders'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.brandContainer}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>KM100</Text>
            </View>
            {!isSmallMobile && (
              <View>
                <Text style={[styles.brandTitle, isLight && styles.brandTitleLight]}>
                  RECEIPT & INVENTORY
                </Text>
                {isDesktop && (
                  <Text style={[styles.brandSub, isLight && styles.brandSubLight]}>
                    Emission Testing & Branch Records
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Center Search Bar on Desktop & Large Tablet */}
        {!isMobile && (
          <View style={[styles.headerSearchBox, isLight && styles.headerSearchBoxLight]}>
            <Search size={15} color={isLight ? '#64748b' : '#94a3b8'} />
            <TextInput
              style={[styles.headerSearchInput, isLight && styles.headerSearchInputLight]}
              placeholder="Search store, receipt title, invoice #, amount..."
              placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={14} color={isLight ? '#64748b' : '#94a3b8'} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Right Header Action Cluster */}
        <View style={[styles.topHeaderRight, isSmallMobile && { gap: 5 }]}>
          {/* PRIMARY HERO BUTTON: SCAN RECEIPT */}
          <TouchableOpacity
            style={[styles.heroScanBtn, isSmallMobile && { paddingHorizontal: 9, paddingVertical: 7, gap: 5 }]}
            onPress={openAddModal}
            title="Scan physical receipt or upload document"
          >
            <Camera size={isSmallMobile ? 14 : 16} color="#ffffff" />
            <Text style={[styles.heroScanBtnText, isSmallMobile && { fontSize: 11 }]}>
              {isSmallMobile ? 'Scan' : 'Scan Receipt'}
            </Text>
          </TouchableOpacity>

          {/* SECONDARY ACTION: EXPORT EXCEL (Desktop & Tablet) */}
          {!isMobile && (
            <TouchableOpacity
              style={[styles.heroExportBtn, isLight && styles.heroExportBtnLight]}
              onPress={() => exportFolderToExcel(activeNav)}
              title="Download formal Excel spreadsheet (.xlsx)"
            >
              <FileSpreadsheet size={15} color={isLight ? '#059669' : '#34d399'} />
              <Text style={[styles.heroExportBtnText, isLight && styles.heroExportBtnTextLight]}>
                Export Excel
              </Text>
            </TouchableOpacity>
          )}

          {/* Theme Toggle Button */}
          <TouchableOpacity
            style={[styles.headerIconBtn, isSmallMobile && { padding: 6 }, isLight && styles.headerIconBtnLight]}
            onPress={toggleTheme}
            title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {isLight ? <Moon size={isSmallMobile ? 14 : 16} color="#6366f1" /> : <Sun size={isSmallMobile ? 14 : 16} color="#f59e0b" />}
          </TouchableOpacity>

          {/* Live Sync Pill (Desktop & Tablet only) */}
          {!isMobile && (
            <TouchableOpacity
              style={[styles.headerSyncPill, isLight && styles.headerSyncPillLight]}
              onPress={() => fetchData(false)}
              title="Click to sync with database"
            >
              <RefreshCw size={11} color={isSyncing ? (isLight ? '#0284c7' : '#38bdf8') : '#10b981'} />
              <Text style={[styles.headerSyncText, isLight && styles.headerSyncTextLight]}>
                {isSyncing ? 'Syncing...' : 'Sync'}
              </Text>
            </TouchableOpacity>
          )}

          {/* User Profile / Logout */}
          {currentUser && (
            <View style={[styles.headerUserBlock, isSmallMobile && { marginLeft: 0 }]}>
              <View style={[styles.headerUserAvatar, isSmallMobile && { width: 26, height: 26 }, isLight && styles.headerUserAvatarLight]}>
                <Text style={[styles.headerUserInitial, isSmallMobile && { fontSize: 11 }]}>
                  {(currentUser.name || currentUser.email || 'A').charAt(0).toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.headerLogoutBtn, isSmallMobile && { padding: 5 }, isLight && styles.headerLogoutBtnLight]}
                onPress={handleLogout}
                title="Sign Out"
              >
                <LogOut size={isSmallMobile ? 12 : 14} color="#f87171" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* MAIN WORKSPACE: LEFT SIDEBAR IS THE SOLE NAVIGATION */}
      <View style={[styles.mainContent, isLight && styles.mainContentLight]}>
        {/* Backdrop for Drawer on Mobile & Tablet */}
        {isDrawerMode && sidebarOpen && (
          <TouchableOpacity
            style={styles.mobileDrawerBackdrop}
            activeOpacity={1}
            onPress={() => setSidebarOpen(false)}
          />
        )}

        {/* LEFT SIDEBAR (Desktop docked / Drawer on Tablet & Mobile) */}
        {sidebarOpen && (
          <View style={[
            styles.sidebar,
            isDrawerMode && styles.mobileSidebarDrawer,
            isLight && styles.sidebarLight,
            isDrawerMode && isLight && styles.mobileSidebarDrawerLight
          ]}>
            <View style={[styles.sidebarTitleRow, isLight && styles.sidebarTitleRowLight]}>
              <Text style={[styles.sidebarSectionTitle, isLight && styles.sidebarSectionTitleLight]}>DOCUMENT DIRECTORY</Text>
              <TouchableOpacity
                onPress={() => setSidebarOpen(false)}
                style={[styles.sidebarCollapseBtn, isLight && styles.sidebarCollapseBtnLight]}
                title="Hide sidebar"
              >
                {isDrawerMode ? <X size={18} color={isLight ? '#475569' : '#94a3b8'} /> : <ChevronLeft size={16} color={isLight ? '#475569' : '#94a3b8'} />}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.treeScroll} showsVerticalScrollIndicator={false}>
              {/* 1. All Files Node with Toggle Switch */}
              <View
                style={[
                  styles.treeItem,
                  activeNav.type === 'all' && (isLight ? styles.treeItemActiveLight : styles.treeItemActive),
                  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }
                ]}
              >
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, paddingVertical: 4 }}
                  onPress={() => setActiveNav({
                    type: 'all',
                    year: null,
                    month: null,
                    subCategory: null,
                    label: 'All Inventory Files'
                  })}
                >
                  <Layers size={17} color={activeNav.type === 'all' ? (isLight ? '#0284c7' : '#38bdf8') : (isLight ? '#64748b' : '#94a3b8')} />
                  <Text style={[styles.treeText, isLight && styles.treeTextLight, activeNav.type === 'all' && (isLight ? styles.treeTextActiveLight : styles.treeTextActive)]} numberOfLines={1}>
                    All Inventory Files ({items.length})
                  </Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {/* Export All Records to Excel */}
                  <TouchableOpacity
                    style={styles.treeFolderExportBtn}
                    onPress={() => exportFolderToExcel({
                      type: 'all',
                      year: null,
                      month: null,
                      subCategory: null,
                      label: 'All Inventory Files'
                    })}
                    title="Export All Records to Excel (.xlsx)"
                  >
                    <FileSpreadsheet size={12} color={isLight ? '#059669' : '#34d399'} />
                  </TouchableOpacity>

                  {/* Interactive Toggle Switch Button */}
                  <TouchableOpacity
                    style={[styles.sidebarToggleSwitch, showAllFiles && styles.sidebarToggleSwitchActive]}
                    onPress={handleToggleShowAll}
                    accessibilityLabel={showAllFiles ? "Click to hide all files" : "Click to display all files"}
                  >
                    <View style={[styles.sidebarToggleThumb, showAllFiles && styles.sidebarToggleThumbActive]} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Actions in Sidebar */}
              <TouchableOpacity
                style={styles.treeItem}
                onPress={openAddModal}
              >
                <PlusCircle size={17} color="#34d399" />
                <Text style={styles.treeText}>Add Document</Text>
              </TouchableOpacity>

              <View style={styles.separator} />

              {/* 2. PETC SALES */}
              <View style={styles.categoryBlock}>
                <View
                  style={[
                    styles.treeItem,
                    activeNav.type === 'petc-sales' && !activeNav.year && styles.treeItemActive,
                    { justifyContent: 'space-between' }
                  ]}
                >
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}
                    onPress={() => {
                      setActiveNav({
                        type: 'petc-sales',
                        year: null,
                        month: null,
                        subCategory: null,
                        label: 'PETC Sales'
                      });
                    }}
                  >
                    <TouchableOpacity onPress={() => toggleNode('petc-sales')} style={styles.iconToggle}>
                      {expandedNodes['petc-sales'] ? <ChevronDown size={15} color="#94a3b8" /> : <ChevronRight size={15} color="#94a3b8" />}
                    </TouchableOpacity>
                    <Folder size={17} color="#34d399" />
                    <Text style={[styles.treeCategoryTitle, activeNav.type === 'petc-sales' && styles.treeTextActive]} numberOfLines={1}>
                      PETC SALES
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.treeFolderExportBtn}
                    onPress={() => exportFolderToExcel({
                      type: 'petc-sales',
                      year: null,
                      month: null,
                      subCategory: null,
                      label: 'PETC Sales'
                    })}
                    title="Export PETC Sales to Excel (.xlsx)"
                  >
                    <FileSpreadsheet size={12} color={isLight ? '#059669' : '#34d399'} />
                  </TouchableOpacity>
                </View>

                {expandedNodes['petc-sales'] && (
                  <View style={styles.treeChildren}>
                    {/* 2026 */}
                    <TouchableOpacity
                      style={[styles.treeSubItem, activeNav.type === 'petc-sales' && activeNav.year === '2026' && !activeNav.month && styles.treeItemActive]}
                      onPress={() => {
                        setActiveNav({
                          type: 'petc-sales',
                          year: '2026',
                          month: null,
                          subCategory: null,
                          label: 'PETC Sales > 2026'
                        });
                      }}
                    >
                      <TouchableOpacity onPress={() => toggleNode('petc-sales-2026')} style={styles.iconToggle}>
                        {expandedNodes['petc-sales-2026'] ? <ChevronDown size={13} color="#64748b" /> : <ChevronRight size={13} color="#64748b" />}
                      </TouchableOpacity>
                      <Calendar size={14} color="#38bdf8" />
                      <Text style={[styles.treeSubText, activeNav.type === 'petc-sales' && activeNav.year === '2026' && styles.treeTextActive]} numberOfLines={1}>
                        2026
                      </Text>
                    </TouchableOpacity>

                    {expandedNodes['petc-sales-2026'] && (
                      <View style={styles.monthPillRow}>
                        {months.map(m => (
                          <TouchableOpacity
                            key={`sales-26-${m}`}
                            style={[styles.monthMiniPill, activeNav.type === 'petc-sales' && activeNav.year === '2026' && activeNav.month === m && styles.monthMiniPillActive]}
                            onPress={() => {
                              setActiveNav({
                                type: 'petc-sales',
                                year: '2026',
                                month: m,
                                subCategory: null,
                                label: `PETC Sales > 2026 > ${m}`
                              });
                            }}
                          >
                            <Text style={[styles.monthMiniPillText, activeNav.type === 'petc-sales' && activeNav.year === '2026' && activeNav.month === m && styles.monthMiniPillTextActive]}>
                              {m}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {/* 2027 */}
                    <TouchableOpacity
                      style={[styles.treeSubItem, activeNav.type === 'petc-sales' && activeNav.year === '2027' && !activeNav.month && styles.treeItemActive]}
                      onPress={() => {
                        setActiveNav({
                          type: 'petc-sales',
                          year: '2027',
                          month: null,
                          subCategory: null,
                          label: 'PETC Sales > 2027'
                        });
                      }}
                    >
                      <TouchableOpacity onPress={() => toggleNode('petc-sales-2027')} style={styles.iconToggle}>
                        {expandedNodes['petc-sales-2027'] ? <ChevronDown size={13} color="#64748b" /> : <ChevronRight size={13} color="#64748b" />}
                      </TouchableOpacity>
                      <Calendar size={14} color="#38bdf8" />
                      <Text style={[styles.treeSubText, activeNav.type === 'petc-sales' && activeNav.year === '2027' && styles.treeTextActive]} numberOfLines={1}>
                        2027
                      </Text>
                    </TouchableOpacity>

                    {expandedNodes['petc-sales-2027'] && (
                      <View style={styles.monthPillRow}>
                        {months.map(m => (
                          <TouchableOpacity
                            key={`sales-27-${m}`}
                            style={[styles.monthMiniPill, activeNav.type === 'petc-sales' && activeNav.year === '2027' && activeNav.month === m && styles.monthMiniPillActive]}
                            onPress={() => {
                              setActiveNav({
                                type: 'petc-sales',
                                year: '2027',
                                month: m,
                                subCategory: null,
                                label: `PETC Sales > 2027 > ${m}`
                              });
                            }}
                          >
                            <Text style={[styles.monthMiniPillText, activeNav.type === 'petc-sales' && activeNav.year === '2027' && activeNav.month === m && styles.monthMiniPillTextActive]}>
                              {m}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* 3. PETC INCOME */}
              <View style={styles.categoryBlock}>
                <View
                  style={[
                    styles.treeItem,
                    activeNav.type === 'petc-income' && !activeNav.year && styles.treeItemActive,
                    { justifyContent: 'space-between' }
                  ]}
                >
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}
                    onPress={() => {
                      setActiveNav({
                        type: 'petc-income',
                        year: null,
                        month: null,
                        subCategory: null,
                        label: 'PETC Income'
                      });
                    }}
                  >
                    <TouchableOpacity onPress={() => toggleNode('petc-income')} style={styles.iconToggle}>
                      {expandedNodes['petc-income'] ? <ChevronDown size={15} color="#94a3b8" /> : <ChevronRight size={15} color="#94a3b8" />}
                    </TouchableOpacity>
                    <Folder size={17} color="#60a5fa" />
                    <Text style={[styles.treeCategoryTitle, activeNav.type === 'petc-income' && styles.treeTextActive]} numberOfLines={1}>
                      PETC INCOME
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.treeFolderExportBtn}
                    onPress={() => exportFolderToExcel({
                      type: 'petc-income',
                      year: null,
                      month: null,
                      subCategory: null,
                      label: 'PETC Income'
                    })}
                    title="Export PETC Income to Excel (.xlsx)"
                  >
                    <FileSpreadsheet size={12} color={isLight ? '#059669' : '#34d399'} />
                  </TouchableOpacity>
                </View>

                {expandedNodes['petc-income'] && (
                  <View style={styles.treeChildren}>
                    {/* 2026 */}
                    <TouchableOpacity
                      style={[styles.treeSubItem, activeNav.type === 'petc-income' && activeNav.year === '2026' && !activeNav.month && styles.treeItemActive]}
                      onPress={() => {
                        setActiveNav({
                          type: 'petc-income',
                          year: '2026',
                          month: null,
                          subCategory: null,
                          label: 'PETC Income > 2026'
                        });
                      }}
                    >
                      <TouchableOpacity onPress={() => toggleNode('petc-income-2026')} style={styles.iconToggle}>
                        {expandedNodes['petc-income-2026'] ? <ChevronDown size={13} color="#64748b" /> : <ChevronRight size={13} color="#64748b" />}
                      </TouchableOpacity>
                      <Calendar size={14} color="#60a5fa" />
                      <Text style={[styles.treeSubText, activeNav.type === 'petc-income' && activeNav.year === '2026' && styles.treeTextActive]} numberOfLines={1}>
                        2026
                      </Text>
                    </TouchableOpacity>

                    {expandedNodes['petc-income-2026'] && (
                      <View style={styles.monthPillRow}>
                        {months.map(m => (
                          <TouchableOpacity
                            key={`inc-26-${m}`}
                            style={[styles.monthMiniPill, activeNav.type === 'petc-income' && activeNav.year === '2026' && activeNav.month === m && styles.monthMiniPillActive]}
                            onPress={() => {
                              setActiveNav({
                                type: 'petc-income',
                                year: '2026',
                                month: m,
                                subCategory: null,
                                label: `PETC Income > 2026 > ${m}`
                              });
                            }}
                          >
                            <Text style={[styles.monthMiniPillText, activeNav.type === 'petc-income' && activeNav.year === '2026' && activeNav.month === m && styles.monthMiniPillTextActive]}>
                              {m}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {/* 2027 */}
                    <TouchableOpacity
                      style={[styles.treeSubItem, activeNav.type === 'petc-income' && activeNav.year === '2027' && !activeNav.month && styles.treeItemActive]}
                      onPress={() => {
                        setActiveNav({
                          type: 'petc-income',
                          year: '2027',
                          month: null,
                          subCategory: null,
                          label: 'PETC Income > 2027'
                        });
                      }}
                    >
                      <TouchableOpacity onPress={() => toggleNode('petc-income-2027')} style={styles.iconToggle}>
                        {expandedNodes['petc-income-2027'] ? <ChevronDown size={13} color="#64748b" /> : <ChevronRight size={13} color="#64748b" />}
                      </TouchableOpacity>
                      <Calendar size={14} color="#60a5fa" />
                      <Text style={[styles.treeSubText, activeNav.type === 'petc-income' && activeNav.year === '2027' && styles.treeTextActive]} numberOfLines={1}>
                        2027
                      </Text>
                    </TouchableOpacity>

                    {expandedNodes['petc-income-2027'] && (
                      <View style={styles.monthPillRow}>
                        {months.map(m => (
                          <TouchableOpacity
                            key={`inc-27-${m}`}
                            style={[styles.monthMiniPill, activeNav.type === 'petc-income' && activeNav.year === '2027' && activeNav.month === m && styles.monthMiniPillActive]}
                            onPress={() => {
                              setActiveNav({
                                type: 'petc-income',
                                year: '2027',
                                month: m,
                                subCategory: null,
                                label: `PETC Income > 2027 > ${m}`
                              });
                            }}
                          >
                            <Text style={[styles.monthMiniPillText, activeNav.type === 'petc-income' && activeNav.year === '2027' && activeNav.month === m && styles.monthMiniPillTextActive]}>
                              {m}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* 4. EXPENSES */}
              <View style={styles.categoryBlock}>
                <View
                  style={[
                    styles.treeItem,
                    activeNav.type === 'expenses' && !activeNav.subCategory && styles.treeItemActive,
                    { justifyContent: 'space-between' }
                  ]}
                >
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}
                    onPress={() => {
                      setActiveNav({
                        type: 'expenses',
                        year: null,
                        month: null,
                        subCategory: null,
                        label: 'Expenses'
                      });
                    }}
                  >
                    <TouchableOpacity onPress={() => toggleNode('expenses')} style={styles.iconToggle}>
                      {expandedNodes['expenses'] ? <ChevronDown size={15} color="#94a3b8" /> : <ChevronRight size={15} color="#94a3b8" />}
                    </TouchableOpacity>
                    <Folder size={17} color="#f87171" />
                    <Text style={[styles.treeCategoryTitle, activeNav.type === 'expenses' && styles.treeTextActive]} numberOfLines={1}>
                      EXPENSES
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.treeFolderExportBtn}
                    onPress={() => exportFolderToExcel({
                      type: 'expenses',
                      year: null,
                      month: null,
                      subCategory: null,
                      label: 'Expenses'
                    })}
                    title="Export Expenses to Excel (.xlsx)"
                  >
                    <FileSpreadsheet size={12} color={isLight ? '#059669' : '#34d399'} />
                  </TouchableOpacity>
                </View>

                {expandedNodes['expenses'] && (
                  <View style={styles.treeChildren}>
                    {[
                      { id: 'expenses-2026-petc', label: 'Expenses 2026 (PETC)' },
                      { id: 'red-goose-2026', label: 'Red Goose Expenses 2026' },
                      { id: 'knoah-mari-2026', label: 'Knoah Mari Expenses 2026' },

                    ].map(branch => (
                      <TouchableOpacity
                        key={branch.id}
                        style={[styles.treeSubItem, activeNav.subCategory === branch.id && styles.treeItemActive]}
                        onPress={() => {
                          setActiveNav({
                            type: 'expenses',
                            year: null,
                            month: null,
                            subCategory: branch.id,
                            label: `Expenses > ${branch.label}`
                          });
                        }}
                      >
                        <ChevronRight size={12} color="#94a3b8" />
                        <Text style={[styles.treeSubText, activeNav.subCategory === branch.id && styles.treeTextActive]} numberOfLines={1}>
                          {branch.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* 5. CONSUMABLES */}
              <View style={styles.categoryBlock}>
                <View
                  style={[
                    styles.treeItem,
                    activeNav.type === 'consumables' && !activeNav.subCategory && styles.treeItemActive,
                    { justifyContent: 'space-between' }
                  ]}
                >
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}
                    onPress={() => {
                      setActiveNav({
                        type: 'consumables',
                        year: null,
                        month: null,
                        subCategory: null,
                        label: 'Consumables'
                      });
                    }}
                  >
                    <TouchableOpacity onPress={() => toggleNode('consumables')} style={styles.iconToggle}>
                      {expandedNodes['consumables'] ? <ChevronDown size={15} color="#94a3b8" /> : <ChevronRight size={15} color="#94a3b8" />}
                    </TouchableOpacity>
                    <Package size={17} color="#fbbf24" />
                    <Text style={[styles.treeCategoryTitle, activeNav.type === 'consumables' && styles.treeTextActive]} numberOfLines={1}>
                      CONSUMABLES
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.treeFolderExportBtn}
                    onPress={() => exportFolderToExcel({
                      type: 'consumables',
                      year: null,
                      month: null,
                      subCategory: null,
                      label: 'Consumables'
                    })}
                    title="Export Consumables to Excel (.xlsx)"
                  >
                    <FileSpreadsheet size={12} color={isLight ? '#059669' : '#34d399'} />
                  </TouchableOpacity>
                </View>

                {expandedNodes['consumables'] && (
                  <View style={styles.treeChildren}>
                    {[
                      { id: 'office-supply', label: 'Office supply' },
                      { id: 'cleaning-supply', label: 'Cleaning supply' },
                      { id: 'red-goose-consumables', label: 'Red Goose' },
                      { id: 'knoah-mari-consumables', label: 'Knoah Mari' }
                    ].map(branch => (
                      <TouchableOpacity
                        key={branch.id}
                        style={[styles.treeSubItem, activeNav.subCategory === branch.id && styles.treeItemActive]}
                        onPress={() => {
                          setActiveNav({
                            type: 'consumables',
                            year: null,
                            month: null,
                            subCategory: branch.id,
                            label: `Consumables > ${branch.label}`
                          });
                        }}
                      >
                        <ChevronRight size={12} color="#94a3b8" />
                        <Text style={[styles.treeSubText, activeNav.subCategory === branch.id && styles.treeTextActive]} numberOfLines={1}>
                          {branch.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* 6. VOUCHERS */}
              <View style={styles.categoryBlock}>
                <View
                  style={[
                    styles.treeItem,
                    activeNav.type === 'vouchers' && !activeNav.subCategory && styles.treeItemActive,
                    { justifyContent: 'space-between' }
                  ]}
                >
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}
                    onPress={() => {
                      setActiveNav({
                        type: 'vouchers',
                        year: null,
                        month: null,
                        subCategory: null,
                        label: 'Vouchers'
                      });
                    }}
                  >
                    <TouchableOpacity onPress={() => toggleNode('vouchers')} style={styles.iconToggle}>
                      {expandedNodes['vouchers'] ? <ChevronDown size={15} color="#94a3b8" /> : <ChevronRight size={15} color="#94a3b8" />}
                    </TouchableOpacity>
                    <FileCheck size={17} color="#a78bfa" />
                    <Text style={[styles.treeCategoryTitle, activeNav.type === 'vouchers' && styles.treeTextActive]} numberOfLines={1}>
                      VOUCHERS
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.treeFolderExportBtn}
                    onPress={() => exportFolderToExcel({
                      type: 'vouchers',
                      year: null,
                      month: null,
                      subCategory: null,
                      label: 'Vouchers'
                    })}
                    title="Export Vouchers to Excel (.xlsx)"
                  >
                    <FileSpreadsheet size={12} color={isLight ? '#059669' : '#34d399'} />
                  </TouchableOpacity>
                </View>

                {expandedNodes['vouchers'] && (
                  <View style={styles.treeChildren}>
                    {[
                      { id: 'vouchers-petc', label: 'PETC' },
                      { id: 'vouchers-stc', label: 'STC' },
                      { id: 'vouchers-knoah-mari', label: 'Knoah Mari' },
                      { id: 'vouchers-red-goose', label: 'Red Goose' }
                    ].map(branch => (
                      <TouchableOpacity
                        key={branch.id}
                        style={[styles.treeSubItem, activeNav.subCategory === branch.id && styles.treeItemActive]}
                        onPress={() => {
                          setActiveNav({
                            type: 'vouchers',
                            year: null,
                            month: null,
                            subCategory: branch.id,
                            label: `Vouchers > ${branch.label}`
                          });
                        }}
                      >
                        <ChevronRight size={12} color="#94a3b8" />
                        <Text style={[styles.treeSubText, activeNav.subCategory === branch.id && styles.treeTextActive]} numberOfLines={1}>
                          {branch.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* 7. PETC INSURANCE */}
              <View style={styles.categoryBlock}>
                <View
                  style={[
                    styles.treeItem,
                    activeNav.type === 'petc-insurance' && !activeNav.year && styles.treeItemActive,
                    { justifyContent: 'space-between' }
                  ]}
                >
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}
                    onPress={() => {
                      setActiveNav({
                        type: 'petc-insurance',
                        year: null,
                        month: null,
                        subCategory: null,
                        label: 'PETC Insurance'
                      });
                    }}
                  >
                    <TouchableOpacity onPress={() => toggleNode('petc-insurance')} style={styles.iconToggle}>
                      {expandedNodes['petc-insurance'] ? <ChevronDown size={15} color="#94a3b8" /> : <ChevronRight size={15} color="#94a3b8" />}
                    </TouchableOpacity>
                    <ShieldCheck size={17} color="#2dd4bf" />
                    <Text style={[styles.treeCategoryTitle, activeNav.type === 'petc-insurance' && styles.treeTextActive]} numberOfLines={1}>
                      PETC INSURANCE
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.treeFolderExportBtn}
                    onPress={() => exportFolderToExcel({
                      type: 'petc-insurance',
                      year: null,
                      month: null,
                      subCategory: null,
                      label: 'PETC Insurance'
                    })}
                    title="Export PETC Insurance to Excel (.xlsx)"
                  >
                    <FileSpreadsheet size={12} color={isLight ? '#059669' : '#34d399'} />
                  </TouchableOpacity>
                </View>

                {expandedNodes['petc-insurance'] && (
                  <View style={styles.treeChildren}>
                    {/* 2026 */}
                    <TouchableOpacity
                      style={[styles.treeSubItem, activeNav.type === 'petc-insurance' && activeNav.year === '2026' && !activeNav.month && styles.treeItemActive]}
                      onPress={() => {
                        setActiveNav({
                          type: 'petc-insurance',
                          year: '2026',
                          month: null,
                          subCategory: null,
                          label: 'PETC Insurance > 2026'
                        });
                      }}
                    >
                      <TouchableOpacity onPress={() => toggleNode('petc-insurance-2026')} style={styles.iconToggle}>
                        {expandedNodes['petc-insurance-2026'] ? <ChevronDown size={13} color="#64748b" /> : <ChevronRight size={13} color="#64748b" />}
                      </TouchableOpacity>
                      <Calendar size={14} color="#2dd4bf" />
                      <Text style={[styles.treeSubText, activeNav.type === 'petc-insurance' && activeNav.year === '2026' && styles.treeTextActive]} numberOfLines={1}>
                        2026
                      </Text>
                    </TouchableOpacity>

                    {expandedNodes['petc-insurance-2026'] && (
                      <View style={styles.monthPillRow}>
                        {months.map(m => (
                          <TouchableOpacity
                            key={`ins-26-${m}`}
                            style={[styles.monthMiniPill, activeNav.type === 'petc-insurance' && activeNav.year === '2026' && activeNav.month === m && styles.monthMiniPillActive]}
                            onPress={() => {
                              setActiveNav({
                                type: 'petc-insurance',
                                year: '2026',
                                month: m,
                                subCategory: null,
                                label: `PETC Insurance > 2026 > ${m}`
                              });
                            }}
                          >
                            <Text style={[styles.monthMiniPillText, activeNav.type === 'petc-insurance' && activeNav.year === '2026' && activeNav.month === m && styles.monthMiniPillTextActive]}>
                              {m}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {/* 2027 */}
                    <TouchableOpacity
                      style={[styles.treeSubItem, activeNav.type === 'petc-insurance' && activeNav.year === '2027' && !activeNav.month && styles.treeItemActive]}
                      onPress={() => {
                        setActiveNav({
                          type: 'petc-insurance',
                          year: '2027',
                          month: null,
                          subCategory: null,
                          label: 'PETC Insurance > 2027'
                        });
                      }}
                    >
                      <TouchableOpacity onPress={() => toggleNode('petc-insurance-2027')} style={styles.iconToggle}>
                        {expandedNodes['petc-insurance-2027'] ? <ChevronDown size={13} color="#64748b" /> : <ChevronRight size={13} color="#64748b" />}
                      </TouchableOpacity>
                      <Calendar size={14} color="#2dd4bf" />
                      <Text style={[styles.treeSubText, activeNav.type === 'petc-insurance' && activeNav.year === '2027' && styles.treeTextActive]} numberOfLines={1}>
                        2027
                      </Text>
                    </TouchableOpacity>

                    {expandedNodes['petc-insurance-2027'] && (
                      <View style={styles.monthPillRow}>
                        {months.map(m => (
                          <TouchableOpacity
                            key={`ins-27-${m}`}
                            style={[styles.monthMiniPill, activeNav.type === 'petc-insurance' && activeNav.year === '2027' && activeNav.month === m && styles.monthMiniPillActive]}
                            onPress={() => {
                              setActiveNav({
                                type: 'petc-insurance',
                                year: '2027',
                                month: m,
                                subCategory: null,
                                label: `PETC Insurance > 2027 > ${m}`
                              });
                            }}
                          >
                            <Text style={[styles.monthMiniPillText, activeNav.type === 'petc-insurance' && activeNav.year === '2027' && activeNav.month === m && styles.monthMiniPillTextActive]}>
                              {m}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Logged-in Admin Profile & Logout */}
            {currentUser && (
              <View style={[styles.sidebarAdminBox, isLight && styles.sidebarAdminBoxLight]}>
                <View style={styles.sidebarAdminRow}>
                  <View style={styles.adminAvatarCircle}>
                    <Text style={styles.adminAvatarInitials}>
                      {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'A'}
                    </Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0, paddingRight: 4 }}>
                    <Text style={[styles.adminNameText, isLight && styles.adminNameTextLight]} numberOfLines={1}>
                      {currentUser.fullName || 'Admin User'}
                    </Text>
                    <Text style={[styles.adminEmailText, isLight && styles.adminEmailTextLight]} numberOfLines={1}>
                      {currentUser.email}
                    </Text>
                  </View>
                  <View style={[styles.adminBadgePill, isLight && styles.adminBadgePillLight]}>
                    <Text style={[styles.adminBadgePillText, isLight && styles.adminBadgePillTextLight]}>ADMIN</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.sidebarLogoutBtn} onPress={handleLogout}>
                  <LogOut size={13} color="#f87171" />
                  <Text style={styles.sidebarLogoutBtnText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* MAIN VIEWING AREA */}
        <View style={[styles.contentArea, isLight && styles.contentAreaLight]}>

          {/* 1. CORE METRICS OVERVIEW (AT-A-GLANCE SUMMARY CARDS) */}
          <View style={[styles.statsGrid, isMobile && styles.statsGridMobile]}>
            {/* Card 1: Expenses */}
            <TouchableOpacity
              style={[
                styles.statCard,
                isMobile && styles.statCardMobile,
                activeNav.type === 'expenses' && styles.statCardActive,
                isLight && styles.statCardLight,
                activeNav.type === 'expenses' && isLight && styles.statCardActiveLight
              ]}
              onPress={() => setActiveNav({ type: 'expenses', year: null, month: null, subCategory: null, label: 'Expenses' })}
            >
              <View style={styles.statCardHeader}>
                <Text style={[styles.statCardLabel, isLight && styles.statCardLabelLight]}>TOTAL EXPENSES</Text>
                <View style={[styles.statIconBadge, { backgroundColor: isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.15)' }]}>
                  <CreditCard size={15} color="#ef4444" />
                </View>
              </View>
              <Text style={[styles.statCardValue, isMobile && styles.statCardValueMobile, { color: isLight ? '#b91c1c' : '#f87171' }]} numberOfLines={1}>
                ₱{stats.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text style={[styles.statCardSub, isLight && styles.statCardSubLight]} numberOfLines={1}>
                {stats.totalExpensesCount} Receipts • {isSmallMobile ? 'View' : 'Click to view'}
              </Text>
            </TouchableOpacity>

            {/* Card 2: PETC Sales */}
            <TouchableOpacity
              style={[
                styles.statCard,
                isMobile && styles.statCardMobile,
                activeNav.type === 'petc-sales' && styles.statCardActive,
                isLight && styles.statCardLight,
                activeNav.type === 'petc-sales' && isLight && styles.statCardActiveLight
              ]}
              onPress={() => setActiveNav({ type: 'petc-sales', year: null, month: null, subCategory: null, label: 'PETC Sales' })}
            >
              <View style={styles.statCardHeader}>
                <Text style={[styles.statCardLabel, isLight && styles.statCardLabelLight]}>PETC SALES</Text>
                <View style={[styles.statIconBadge, { backgroundColor: isLight ? '#dcfce7' : 'rgba(16, 185, 129, 0.15)' }]}>
                  <TrendingUp size={15} color="#10b981" />
                </View>
              </View>
              <Text style={[styles.statCardValue, isMobile && styles.statCardValueMobile, { color: isLight ? '#047857' : '#34d399' }]} numberOfLines={1}>
                ₱{stats.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text style={[styles.statCardSub, isLight && styles.statCardSubLight]} numberOfLines={1}>
                {stats.totalSalesCount} Invoices • {isSmallMobile ? 'View' : 'Click to view'}
              </Text>
            </TouchableOpacity>

            {/* Card 3: PETC Income */}
            <TouchableOpacity
              style={[
                styles.statCard,
                isMobile && styles.statCardMobile,
                activeNav.type === 'petc-income' && styles.statCardActive,
                isLight && styles.statCardLight,
                activeNav.type === 'petc-income' && isLight && styles.statCardActiveLight
              ]}
              onPress={() => setActiveNav({ type: 'petc-income', year: null, month: null, subCategory: null, label: 'PETC Income' })}
            >
              <View style={styles.statCardHeader}>
                <Text style={[styles.statCardLabel, isLight && styles.statCardLabelLight]}>PETC INCOME</Text>
                <View style={[styles.statIconBadge, { backgroundColor: isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.15)' }]}>
                  <DollarSign size={15} color="#0284c7" />
                </View>
              </View>
              <Text style={[styles.statCardValue, isMobile && styles.statCardValueMobile, { color: isLight ? '#0369a1' : '#38bdf8' }]} numberOfLines={1}>
                ₱{stats.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text style={[styles.statCardSub, isLight && styles.statCardSubLight]} numberOfLines={1}>
                {stats.totalIncomeCount} Collections • {isSmallMobile ? 'View' : 'Click to view'}
              </Text>
            </TouchableOpacity>

            {/* Card 4: Total Files */}
            <TouchableOpacity
              style={[
                styles.statCard,
                isMobile && styles.statCardMobile,
                activeNav.type === 'all' && styles.statCardActive,
                isLight && styles.statCardLight,
                activeNav.type === 'all' && isLight && styles.statCardActiveLight
              ]}
              onPress={() => setActiveNav({ type: 'all', year: null, month: null, subCategory: null, label: 'All Inventory Files' })}
            >
              <View style={styles.statCardHeader}>
                <Text style={[styles.statCardLabel, isLight && styles.statCardLabelLight]}>ALL RECORDS</Text>
                <View style={[styles.statIconBadge, { backgroundColor: isLight ? '#ede9fe' : 'rgba(139, 92, 246, 0.15)' }]}>
                  <Layers size={15} color="#8b5cf6" />
                </View>
              </View>
              <Text style={[styles.statCardValue, isMobile && styles.statCardValueMobile, { color: isLight ? '#6d28d9' : '#a78bfa' }]} numberOfLines={1}>
                {stats.totalRecords} Records
              </Text>
              <Text style={[styles.statCardSub, isLight && styles.statCardSubLight]} numberOfLines={1}>
                All Categories • {isSmallMobile ? 'View' : 'Click to view'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 2. SIMPLE CATEGORY NAVIGATION TABS (ONE-CLICK ACCESS) */}
          <View style={[styles.categoryNavBar, isLight && styles.categoryNavBarLight]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryNavScroll}>
              {[
                { id: 'all', label: 'All Records', count: stats.totalRecords, icon: Layers },
                { id: 'petc-sales', label: 'PETC Sales', count: stats.totalSalesCount, icon: TrendingUp },
                { id: 'petc-income', label: 'PETC Income', count: stats.totalIncomeCount, icon: DollarSign },
                { id: 'expenses', label: 'Expenses', count: stats.totalExpensesCount, icon: CreditCard },
                { id: 'consumables', label: 'Consumables', count: stats.totalConsumablesCount, icon: Package },
                { id: 'petc-insurance', label: 'Insurance', count: null, icon: ShieldCheck },
                { id: 'vouchers', label: 'Vouchers', count: null, icon: Receipt },
              ].map(cat => {
                const isActive = activeNav.type === cat.id;
                const IconComponent = cat.icon;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryTab,
                      isActive && styles.categoryTabActive,
                      isLight && styles.categoryTabLight,
                      isActive && isLight && styles.categoryTabActiveLight
                    ]}
                    onPress={() => {
                      let defaultLabel = cat.label;
                      if (cat.id === 'all') defaultLabel = 'All Inventory Files';
                      setActiveNav({
                        type: cat.id,
                        year: null,
                        month: null,
                        subCategory: null,
                        label: defaultLabel
                      });
                    }}
                  >
                    <IconComponent size={14} color={isActive ? (isLight ? '#0284c7' : '#38bdf8') : (isLight ? '#64748b' : '#94a3b8')} />
                    <Text style={[
                      styles.categoryTabText,
                      isActive && styles.categoryTabTextActive,
                      isLight && styles.categoryTabTextLight,
                      isActive && isLight && styles.categoryTabTextActiveLight
                    ]}>
                      {cat.label}
                    </Text>
                    {cat.count !== null && (
                      <View style={[
                        styles.categoryTabBadge,
                        isActive && styles.categoryTabBadgeActive,
                        isLight && styles.categoryTabBadgeLight
                      ]}>
                        <Text style={[
                          styles.categoryTabBadgeText,
                          isActive && styles.categoryTabBadgeTextActive,
                          isLight && styles.categoryTabBadgeTextLight
                        ]}>
                          {cat.count}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* 3. CONTEXTUAL SUB-CATEGORY / YEAR FILTER CHIPS */}
          {activeNav.type === 'expenses' && (
            <View style={[styles.subFilterRow, isLight && styles.subFilterRowLight]}>
              <Text style={[styles.subFilterHeading, isLight && styles.subFilterHeadingLight]}>Branch Filter:</Text>
              <TouchableOpacity
                style={[styles.subFilterChip, !activeNav.subCategory && styles.subFilterChipActive, isLight && styles.subFilterChipLight, !activeNav.subCategory && isLight && styles.subFilterChipActiveLight]}
                onPress={() => setActiveNav({ type: 'expenses', year: null, month: null, subCategory: null, label: 'Expenses' })}
              >
                <Text style={[styles.subFilterChipText, !activeNav.subCategory && styles.subFilterChipTextActive, isLight && styles.subFilterChipTextLight, !activeNav.subCategory && isLight && styles.subFilterChipTextActiveLight]}>All Expenses</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.subFilterChip, activeNav.subCategory === 'expenses-2026' && styles.subFilterChipActive, isLight && styles.subFilterChipLight, activeNav.subCategory === 'expenses-2026' && isLight && styles.subFilterChipActiveLight]}
                onPress={() => setActiveNav({ type: 'expenses', year: '2026', month: null, subCategory: 'expenses-2026', label: 'Expenses > Expenses 2026 (PETC)' })}
              >
                <Text style={[styles.subFilterChipText, activeNav.subCategory === 'expenses-2026' && styles.subFilterChipTextActive, isLight && styles.subFilterChipTextLight, activeNav.subCategory === 'expenses-2026' && isLight && styles.subFilterChipTextActiveLight]}>Expenses 2026 (PETC)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.subFilterChip, activeNav.subCategory === 'red-goose-2026' && styles.subFilterChipActive, isLight && styles.subFilterChipLight, activeNav.subCategory === 'red-goose-2026' && isLight && styles.subFilterChipActiveLight]}
                onPress={() => setActiveNav({ type: 'expenses', year: '2026', month: null, subCategory: 'red-goose-2026', label: 'Expenses > Red Goose 2026' })}
              >
                <Text style={[styles.subFilterChipText, activeNav.subCategory === 'red-goose-2026' && styles.subFilterChipTextActive, isLight && styles.subFilterChipTextLight, activeNav.subCategory === 'red-goose-2026' && isLight && styles.subFilterChipTextActiveLight]}>Red Goose 2026</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.subFilterChip, activeNav.subCategory === 'knoah-mari-2026' && styles.subFilterChipActive, isLight && styles.subFilterChipLight, activeNav.subCategory === 'knoah-mari-2026' && isLight && styles.subFilterChipActiveLight]}
                onPress={() => setActiveNav({ type: 'expenses', year: '2026', month: null, subCategory: 'knoah-mari-2026', label: 'Expenses > Knoah Mari 2026' })}
              >
                <Text style={[styles.subFilterChipText, activeNav.subCategory === 'knoah-mari-2026' && styles.subFilterChipTextActive, isLight && styles.subFilterChipTextLight, activeNav.subCategory === 'knoah-mari-2026' && isLight && styles.subFilterChipTextActiveLight]}>Knoah Mari 2026</Text>
              </TouchableOpacity>
            </View>
          )}

          {(activeNav.type === 'petc-sales' || activeNav.type === 'petc-income') && (
            <View style={[styles.subFilterRow, isLight && styles.subFilterRowLight]}>
              <Text style={[styles.subFilterHeading, isLight && styles.subFilterHeadingLight]}>Year Filter:</Text>
              <TouchableOpacity
                style={[styles.subFilterChip, !activeNav.year && styles.subFilterChipActive, isLight && styles.subFilterChipLight, !activeNav.year && isLight && styles.subFilterChipActiveLight]}
                onPress={() => setActiveNav({ type: activeNav.type, year: null, month: null, subCategory: null, label: activeNav.type === 'petc-sales' ? 'PETC Sales' : 'PETC Income' })}
              >
                <Text style={[styles.subFilterChipText, !activeNav.year && styles.subFilterChipTextActive, isLight && styles.subFilterChipTextLight, !activeNav.year && isLight && styles.subFilterChipTextActiveLight]}>All Years</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.subFilterChip, activeNav.year === '2026' && styles.subFilterChipActive, isLight && styles.subFilterChipLight, activeNav.year === '2026' && isLight && styles.subFilterChipActiveLight]}
                onPress={() => setActiveNav({ type: activeNav.type, year: '2026', month: null, subCategory: null, label: `${activeNav.type === 'petc-sales' ? 'PETC Sales' : 'PETC Income'} > 2026` })}
              >
                <Text style={[styles.subFilterChipText, activeNav.year === '2026' && styles.subFilterChipTextActive, isLight && styles.subFilterChipTextLight, activeNav.year === '2026' && isLight && styles.subFilterChipTextActiveLight]}>2026</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.subFilterChip, activeNav.year === '2027' && styles.subFilterChipActive, isLight && styles.subFilterChipLight, activeNav.year === '2027' && isLight && styles.subFilterChipActiveLight]}
                onPress={() => setActiveNav({ type: activeNav.type, year: '2027', month: null, subCategory: null, label: `${activeNav.type === 'petc-sales' ? 'PETC Sales' : 'PETC Income'} > 2027` })}
              >
                <Text style={[styles.subFilterChipText, activeNav.year === '2027' && styles.subFilterChipTextActive, isLight && styles.subFilterChipTextLight, activeNav.year === '2027' && isLight && styles.subFilterChipTextActiveLight]}>2027</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeNav.type === 'consumables' && (
            <View style={[styles.subFilterRow, isLight && styles.subFilterRowLight]}>
              <Text style={[styles.subFilterHeading, isLight && styles.subFilterHeadingLight]}>Category Filter:</Text>
              <TouchableOpacity
                style={[styles.subFilterChip, !activeNav.subCategory && styles.subFilterChipActive, isLight && styles.subFilterChipLight, !activeNav.subCategory && isLight && styles.subFilterChipActiveLight]}
                onPress={() => setActiveNav({ type: 'consumables', year: null, month: null, subCategory: null, label: 'Consumables' })}
              >
                <Text style={[styles.subFilterChipText, !activeNav.subCategory && styles.subFilterChipTextActive, isLight && styles.subFilterChipTextLight, !activeNav.subCategory && isLight && styles.subFilterChipTextActiveLight]}>All Consumables</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.subFilterChip, activeNav.subCategory === 'office-supply' && styles.subFilterChipActive, isLight && styles.subFilterChipLight, activeNav.subCategory === 'office-supply' && isLight && styles.subFilterChipActiveLight]}
                onPress={() => setActiveNav({ type: 'consumables', year: null, month: null, subCategory: 'office-supply', label: 'Consumables > Office supply' })}
              >
                <Text style={[styles.subFilterChipText, activeNav.subCategory === 'office-supply' && styles.subFilterChipTextActive, isLight && styles.subFilterChipTextLight, activeNav.subCategory === 'office-supply' && isLight && styles.subFilterChipTextActiveLight]}>Office Supply</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.subFilterChip, activeNav.subCategory === 'cleaning-supply' && styles.subFilterChipActive, isLight && styles.subFilterChipLight, activeNav.subCategory === 'cleaning-supply' && isLight && styles.subFilterChipActiveLight]}
                onPress={() => setActiveNav({ type: 'consumables', year: null, month: null, subCategory: 'cleaning-supply', label: 'Consumables > Cleaning supply' })}
              >
                <Text style={[styles.subFilterChipText, activeNav.subCategory === 'cleaning-supply' && styles.subFilterChipTextActive, isLight && styles.subFilterChipTextLight, activeNav.subCategory === 'cleaning-supply' && isLight && styles.subFilterChipTextActiveLight]}>Cleaning Supply</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.subFilterChip, activeNav.subCategory === 'red-goose' && styles.subFilterChipActive, isLight && styles.subFilterChipLight, activeNav.subCategory === 'red-goose' && isLight && styles.subFilterChipActiveLight]}
                onPress={() => setActiveNav({ type: 'consumables', year: null, month: null, subCategory: 'red-goose', label: 'Consumables > Red Goose' })}
              >
                <Text style={[styles.subFilterChipText, activeNav.subCategory === 'red-goose' && styles.subFilterChipTextActive, isLight && styles.subFilterChipTextLight, activeNav.subCategory === 'red-goose' && isLight && styles.subFilterChipTextActiveLight]}>Red Goose</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 4. CLEAN SEARCH & FILTER ACTION BAR */}
          <View style={[styles.controlBar, isLight && styles.controlBarLight]}>
            <View style={styles.controlBarLeft}>
              <View style={styles.breadcrumbs}>
                <Text style={[styles.breadcrumbItem, isLight && styles.breadcrumbItemLight]}>Records</Text>
                <ChevronRight size={14} color={isLight ? '#94a3b8' : '#64748b'} />
                <Text style={[styles.breadcrumbActive, isLight && styles.breadcrumbActiveLight]}>{activeNav.label}</Text>
              </View>

              {(activeNav.type !== 'all' || activeNav.year || activeNav.subCategory || searchQuery) && (
                <TouchableOpacity
                  style={[styles.clearFilterBtn, isLight && styles.clearFilterBtnLight]}
                  onPress={() => {
                    setActiveNav({ type: 'all', year: null, month: null, subCategory: null, label: 'All Inventory Files' });
                    setSearchQuery('');
                  }}
                >
                  <X size={12} color={isLight ? '#ef4444' : '#f87171'} />
                  <Text style={[styles.clearFilterBtnText, isLight && styles.clearFilterBtnTextLight]}>Reset Filters</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.controlBarRight}>
              {/* Mobile Search Input */}
              {isMobile && (
                <View style={[styles.searchBox, { width: '100%', marginBottom: 4 }, isLight && styles.searchBoxLight]}>
                  <Search size={15} color={isLight ? '#64748b' : '#94a3b8'} />
                  <TextInput
                    style={[styles.searchInput, isLight && styles.searchInputLight]}
                    placeholder="Search store, invoice #, amount..."
                    placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <X size={14} color={isLight ? '#64748b' : '#94a3b8'} />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                {/* Export Excel Button */}
                <TouchableOpacity
                  style={[styles.exportExcelBtn, isLight && styles.exportExcelBtnLight]}
                  onPress={() => exportFolderToExcel(activeNav)}
                  title={`Export "${activeNav.label}" into formal Excel spreadsheet`}
                >
                  <FileSpreadsheet size={13} color={isLight ? '#059669' : '#34d399'} />
                  <Text style={[styles.exportExcelBtnText, isLight && styles.exportExcelBtnTextLight]}>
                    Export Excel
                  </Text>
                </TouchableOpacity>

                {/* Total Count Pill */}
                <View style={[styles.countBadge, isLight && styles.countBadgeLight]}>
                  <Text style={[styles.countBadgeText, isLight && styles.countBadgeTextLight]}>
                    {filteredItems.length} {filteredItems.length === 1 ? 'record' : 'records'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ITEM DISPLAY */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#38bdf8" />
              <Text style={styles.loadingText}>Loading inventory records</Text>
            </View>
          ) : filteredItems.length === 0 ? (
            activeNav.type === 'all' && !showAllFiles ? (
              <View style={styles.emptyContainer}>
                <EyeOff size={48} color="#64748b" />
                <Text style={styles.emptyTitle}>All Files Display is Hidden</Text>
                <Text style={styles.emptySubtitle}>
                  You have toggled off displaying all {items.length} files. You can turn it back on anytime using the toggle button, or select a specific category folder from the sidebar.
                </Text>
                <TouchableOpacity
                  style={styles.btnToggleEmptyOn}
                  onPress={handleToggleShowAll}
                >
                  <Eye size={15} color="#0f172a" />
                  <Text style={styles.btnToggleEmptyOnText}>Show All Files ({items.length})</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Layers size={44} color={isLight ? '#cbd5e1' : '#334155'} />
                <Text style={[styles.emptyTitle, isLight && styles.emptyTitleLight]}>
                  {searchQuery ? 'No documents match your search' : items.length === 0 ? 'No files or documents currently in system' : `No records found in ${activeNav.label}`}
                </Text>
                <Text style={[styles.emptySubtitle, isLight && styles.emptySubtitleLight]}>
                  {searchQuery
                    ? 'Try searching with a different store name, invoice number, or amount.'
                    : items.length === 0
                      ? 'Your inventory database is currently empty. Tap "Scan Receipt" to add your first record.'
                      : 'You can tap "Scan Receipt" to add a new document, or choose another category from the tabs above.'}
                </Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {searchQuery ? (
                    <TouchableOpacity
                      style={[styles.heroExportBtn, isLight && styles.heroExportBtnLight]}
                      onPress={() => setSearchQuery('')}
                    >
                      <X size={15} color={isLight ? '#0284c7' : '#38bdf8'} />
                      <Text style={[styles.heroExportBtnText, isLight && styles.heroExportBtnTextLight]}>Clear Search</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    style={styles.heroScanBtn}
                    onPress={openAddModal}
                  >
                    <Camera size={15} color="#ffffff" />
                    <Text style={styles.heroScanBtnText}>Scan New Receipt</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          ) : useCardsView ? (
            /* TOUCH-FRIENDLY DOCUMENT CARDS (MOBILE & TABLET) */
            <ScrollView style={styles.mobileCardList} showsVerticalScrollIndicator={false}>
              {filteredItems.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.mobileCard, isLight && styles.mobileCardLight]}
                  onPress={() => setViewItem(item)}
                >
                  <View style={styles.mobileCardHeader}>
                    <View style={styles.mobileCardIcon}>
                      {item.fileFormat === 'XLSX' ? (
                        <FileSpreadsheet size={20} color="#34d399" />
                      ) : item.fileFormat === 'JPG' || item.fileFormat === 'PNG' ? (
                        <ImageIcon size={20} color={isLight ? '#0284c7' : '#38bdf8'} />
                      ) : (
                        <FileText size={20} color={isLight ? '#0284c7' : '#38bdf8'} />
                      )}
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.mobileCardTitle, isLight && styles.mobileCardTitleLight]} numberOfLines={1}>{item.fileName}</Text>
                      <Text style={[styles.mobileCardCategory, isLight && styles.mobileCardCategoryLight]} numberOfLines={1}>
                        {item.category} • {item.entity}
                      </Text>
                    </View>
                    <View style={[
                      styles.statusTag,
                      item.status === 'Low Stock' ? styles.statusTagDanger :
                        item.status === 'Completed' || item.status === 'Audited' || item.status === 'Paid & Reconciled' ? styles.statusTagSuccess :
                          styles.statusTagInfo
                    ]}>
                      <Text style={styles.statusTagText}>{item.status}</Text>
                    </View>
                  </View>

                  <View style={[styles.mobileCardMeta, isLight && styles.mobileCardMetaLight]}>
                    <View style={styles.mobileMetaItem}>
                      <Text style={[styles.mobileMetaLabel, isLight && styles.mobileMetaLabelLight]}>PERIOD / DATE</Text>
                      <Text style={[styles.mobileMetaVal, isLight && styles.mobileMetaValLight]}>
                        {item.scannedDate || item.createdAt || (item.year ? `${item.year} ${item.month !== 'CURRENT' ? item.month : ''}`.trim() : item.receiptDate || 'N/A')}
                      </Text>
                    </View>
                    <View style={styles.mobileMetaItem}>
                      <Text style={[styles.mobileMetaLabel, isLight && styles.mobileMetaLabelLight]}>AMOUNT</Text>
                      <Text style={[styles.mobileMetaVal, { color: isLight ? '#0284c7' : '#38bdf8', fontWeight: '700' }]}>
                        {item.amount > 0 ? `₱${Number(item.amount).toLocaleString()}` : 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.mobileMetaItem}>
                      <Text style={[styles.mobileMetaLabel, isLight && styles.mobileMetaLabelLight]}>FORMAT</Text>
                      <Text style={[styles.mobileMetaVal, isLight && styles.mobileMetaValLight]}>{item.fileFormat || 'PDF'}</Text>
                    </View>
                  </View>

                  <View style={styles.mobileCardActions}>
                    <TouchableOpacity
                      style={[styles.mobileBtnView, isLight && styles.mobileBtnViewLight]}
                      onPress={() => setViewItem(item)}
                    >
                      <Eye size={14} color={isLight ? '#0284c7' : '#38bdf8'} />
                      <Text style={styles.mobileBtnViewText}>View Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.mobileBtnView, isLight && styles.mobileBtnViewLight, { flex: 0, paddingHorizontal: 12 }]}
                      onPress={() => {
                        setRenameItem(item);
                        setRenameNewName(item.fileName || '');
                      }}
                      title="Rename Document"
                    >
                      <Edit3 size={14} color={isLight ? '#0284c7' : '#38bdf8'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.mobileBtnDelete}
                      onPress={() => handleDeleteItem(item.id, item.fileName)}
                    >
                      <Trash2 size={14} color="#f87171" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            /* TABLE LIST VIEW */
            <ScrollView horizontal style={styles.tableHorizontal}>
              <ScrollView style={styles.tableVertical}>
                <View style={styles.table}>
                  <View style={[styles.tableRowHeader, isLight && styles.tableRowHeaderLight]}>
                    <Text style={[styles.th, { width: 45 }, isLight && styles.thLight]}>#</Text>
                    <Text style={[styles.th, { width: 280 }, isLight && styles.thLight]}>FILE NAME</Text>
                    <Text style={[styles.th, { width: 150 }, isLight && styles.thLight]}>CATEGORY</Text>
                    <Text style={[styles.th, { width: 120 }, isLight && styles.thLight]}>ENTITY</Text>
                    <Text style={[styles.th, { width: 115 }, isLight && styles.thLight]}>PERIOD / DATE</Text>
                    <Text style={[styles.th, { width: 130, textAlign: 'right', paddingRight: 16 }, isLight && styles.thLight]}>AMOUNT (PHP)</Text>
                    <Text style={[styles.th, { width: 130 }, isLight && styles.thLight]}>STATUS</Text>
                    <Text style={[styles.th, { width: 125, textAlign: 'center' }, isLight && styles.thLight]}>ACTIONS</Text>
                  </View>

                  {filteredItems.map((item, idx) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.tableRow,
                        isLight && styles.tableRowLight,
                        idx % 2 === 1 && (isLight ? styles.tableRowAltLight : styles.tableRowAlt)
                      ]}
                      onPress={() => setViewItem(item)}
                    >
                      <Text style={[styles.td, { width: 45, color: '#64748b' }]}>{idx + 1}</Text>
                      <View style={{ width: 280, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {item.fileFormat === 'XLSX' ? <FileSpreadsheet size={16} color="#34d399" /> : <FileText size={16} color={isLight ? '#0284c7' : '#38bdf8'} />}
                        <Text style={[styles.td, { fontWeight: '600', color: isLight ? '#0f172a' : '#f8fafc' }]} numberOfLines={1}>
                          {item.fileName}
                        </Text>
                      </View>
                      <Text style={[styles.td, { width: 150 }, isLight && styles.tdLight]} numberOfLines={1}>{item.category}</Text>
                      <Text style={[styles.td, { width: 120 }, isLight && styles.tdLight]} numberOfLines={1}>{item.entity}</Text>
                      <Text style={[styles.td, { width: 115 }, isLight && styles.tdLight]}>
                        {item.scannedDate || item.createdAt || (item.year ? `${item.year} ${item.month !== 'CURRENT' ? item.month : ''}`.trim() : item.receiptDate || '-')}
                      </Text>
                      <Text style={[styles.td, { width: 130, textAlign: 'right', paddingRight: 16, fontWeight: '600', color: isLight ? '#0284c7' : '#38bdf8' }]}>
                        {item.amount > 0 ? `₱${Number(item.amount).toLocaleString()}` : '-'}
                      </Text>
                      <View style={{ width: 130 }}>
                        <View style={[
                          styles.statusTag,
                          item.status === 'Low Stock' ? styles.statusTagDanger :
                            item.status === 'Completed' || item.status === 'Audited' || item.status === 'Paid & Reconciled' ? styles.statusTagSuccess :
                              styles.statusTagInfo,
                          isLight && styles.statusTagLight
                        ]}>
                          <Text style={[
                            styles.statusTagText,
                            isLight && (
                              item.status === 'Low Stock' ? { color: '#dc2626' } :
                                item.status === 'Completed' || item.status === 'Audited' || item.status === 'Paid & Reconciled' ? { color: '#16a34a' } :
                                  { color: '#0284c7' }
                            )
                          ]}>
                            {item.status}
                          </Text>
                        </View>
                      </View>
                      <View style={{ width: 125, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                        <TouchableOpacity
                          style={[styles.btnTableAction, isLight && styles.btnTableActionLight]}
                          onPress={() => setViewItem(item)}
                          title="View Document"
                        >
                          <Eye size={15} color={isLight ? '#0284c7' : '#38bdf8'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.btnTableAction, isLight && styles.btnTableActionLight]}
                          onPress={() => {
                            setRenameItem(item);
                            setRenameNewName(item.fileName || '');
                          }}
                          title="Rename Document"
                        >
                          <Edit3 size={15} color={isLight ? '#0284c7' : '#38bdf8'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.btnTableAction, isLight && styles.btnTableActionLight]}
                          onPress={() => handleDeleteItem(item.id, item.fileName)}
                          title="Delete Document"
                        >
                          <Trash2 size={15} color="#f87171" />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </ScrollView>
          )}
        </View>
      </View>

      {/* ======================================================== */}
      {/* 1. DOCUMENT VIEWER MODAL                                 */}
      {/* ======================================================== */}
      <Modal visible={!!viewItem} transparent animationType="fade">
        <View style={[styles.modalOverlay, isMobile && styles.modalOverlayMobile]}>
          <View style={[styles.viewerModalContainer, isMobile && styles.modalContainerMobile, isLight && styles.viewerModalContainerLight]}>
            <View style={[styles.viewerHeader, isMobile && styles.modalHeaderMobile, isLight && styles.modalHeaderLight]}>
              <View style={[styles.viewerHeaderLeft, isMobile && { gap: 10, flex: 1, minWidth: 0 }]}>
                <View style={[styles.viewerBadge, isMobile && { width: 38, height: 38 }]}>
                  {viewItem?.fileFormat === 'XLSX' ? (
                    <FileSpreadsheet size={isMobile ? 20 : 26} color="#34d399" />
                  ) : (
                    <FileText size={isMobile ? 20 : 26} color={isLight ? '#0284c7' : '#38bdf8'} />
                  )}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.viewerTitle, isMobile && { fontSize: 14 }, isLight && styles.viewerTitleLight]} numberOfLines={1}>{viewItem?.fileName}</Text>
                  <Text style={[styles.viewerSubtitle, isMobile && { fontSize: 10 }, isLight && styles.viewerSubtitleLight]} numberOfLines={1}>
                    {viewItem?.category} • {viewItem?.subCategory} • Entity: {viewItem?.entity}
                  </Text>
                </View>
              </View>

              <View style={styles.viewerHeaderActions}>
                <TouchableOpacity
                  style={[styles.btnOutline, isMobile && { paddingHorizontal: 8, paddingVertical: 6 }]}
                  onPress={() => window.print()}
                  title="Print / Save PDF"
                >
                  <Printer size={16} color={isLight ? '#475569' : '#cbd5e1'} />
                  {!isMobile && <Text style={[styles.btnOutlineText, isLight && { color: '#475569' }]}>Print</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnOutline, isMobile && { paddingHorizontal: 8, paddingVertical: 6 }]}
                  onPress={() => {
                    setRenameItem(viewItem);
                    setRenameNewName(viewItem?.fileName || '');
                  }}
                  title="Rename Document"
                >
                  <Edit3 size={16} color={isLight ? '#0284c7' : '#38bdf8'} />
                  {!isMobile && <Text style={[styles.btnOutlineText, isLight && { color: '#0284c7' }]}>Rename</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnOutline, isMobile && { paddingHorizontal: 8, paddingVertical: 6 }]}
                  onPress={() => {
                    const blob = new Blob([JSON.stringify(viewItem, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = viewItem?.fileName || 'document.json';
                    a.click();
                    showNotice('Document exported!');
                  }}
                  title="Export Data"
                >
                  <Download size={16} color={isLight ? '#475569' : '#cbd5e1'} />
                  {!isMobile && <Text style={[styles.btnOutlineText, isLight && { color: '#475569' }]}>Export</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalCloseBtn, isLight && styles.modalCloseBtnLight]}
                  onPress={() => setViewItem(null)}
                >
                  <X size={20} color={isLight ? '#475569' : '#94a3b8'} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={[styles.viewerBody, isLight && styles.modalBodyLight]}>
              <View style={styles.viewerStatsGrid}>
                <View style={styles.viewerStatBox}>
                  <Text style={styles.viewerStatLabel}>ESTABLISHMENT</Text>
                  <Text style={[styles.viewerStatValue, { color: '#38bdf8' }]} numberOfLines={1}>
                    {viewItem?.establishment || viewItem?.previewData?.establishment || 'General'}
                  </Text>
                </View>
                <View style={styles.viewerStatBox}>
                  <Text style={styles.viewerStatLabel}>DATE SCANNED</Text>
                  <Text style={styles.viewerStatValue}>
                    {viewItem?.scannedDate || viewItem?.createdAt || '-'}
                  </Text>
                </View>
                <View style={styles.viewerStatBox}>
                  <Text style={styles.viewerStatLabel}>RECEIPT DATE (ISSUED)</Text>
                  <Text style={styles.viewerStatValue}>
                    {viewItem?.receiptDate || viewItem?.previewData?.receipt_date || '-'}
                  </Text>
                </View>
                <View style={styles.viewerStatBox}>
                  <Text style={styles.viewerStatLabel}>TOTAL AMOUNT</Text>
                  <Text style={[styles.viewerStatValue, { color: '#34d399' }]}>
                    {viewItem?.amount ? `₱${Number(viewItem.amount).toLocaleString()}` : 'N/A'}
                  </Text>
                </View>
                <View style={styles.viewerStatBox}>
                  <Text style={styles.viewerStatLabel}>DESCRIPTION</Text>
                  <Text style={styles.viewerStatValue} numberOfLines={1}>
                    {viewItem?.description || viewItem?.previewData?.description || viewItem?.title}
                  </Text>
                </View>
                <View style={styles.viewerStatBox}>
                  <Text style={styles.viewerStatLabel}>AUDIT STATUS</Text>
                  <Text style={[styles.viewerStatValue, { color: '#34d399' }]}>
                    {viewItem?.status || 'Active'}
                  </Text>
                </View>
                <View style={styles.viewerStatBox}>
                  <Text style={styles.viewerStatLabel}>FILE TYPE</Text>
                  <Text style={styles.viewerStatValue}>
                    {viewItem?.fileFormat} ({viewItem?.fileSize})
                  </Text>
                </View>
              </View>

              {viewItem?.notes && (
                <View style={styles.viewerSection}>
                  <Text style={styles.viewerSectionTitle}>OFFICIAL NOTES & DESCRIPTIONS</Text>
                  <View style={styles.notesBox}>
                    <Text style={styles.notesText}>{viewItem.notes}</Text>
                  </View>
                </View>
              )}

              {/* Scanned Physical Receipt Image Attachment */}
              {(viewItem?.filePath?.startsWith('data:image') || viewItem?.previewData?.image) && (
                <View style={styles.viewerSection}>
                  <View style={styles.previewHeaderRow}>
                    <Text style={styles.viewerSectionTitle}>SCANNED PHYSICAL DOCUMENT PHOTO</Text>
                    <Text style={[styles.previewBadge, { backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.3)' }]}>
                      Verified Capture
                    </Text>
                  </View>
                  <View style={styles.scannedImageViewerBox}>
                    <img
                      src={viewItem.filePath || viewItem.previewData?.image}
                      alt="Scanned physical document"
                      style={{ width: '100%', maxHeight: 420, objectFit: 'contain', borderRadius: 8, backgroundColor: isLight ? '#f8fafc' : '#0c1322' }}
                    />
                  </View>
                </View>
              )}

              {viewItem?.previewData && (
                <View style={styles.viewerSection}>
                  <View style={styles.previewHeaderRow}>
                    <Text style={styles.viewerSectionTitle}>EMBEDDED DOCUMENT CONTENT PREVIEW</Text>
                    <Text style={styles.previewBadge}>Interactive Preview</Text>
                  </View>

                  <View style={styles.previewTableContainer}>
                    <View style={styles.previewTableRowHeader}>
                      {viewItem.previewData.columns?.map((col, cIdx) => (
                        <Text key={cIdx} style={[styles.previewTh, { flex: cIdx === 0 ? 1.5 : 1 }]}>
                          {col.toUpperCase()}
                        </Text>
                      ))}
                    </View>

                    {viewItem.previewData.rows?.map((row, rIdx) => (
                      <View key={rIdx} style={[styles.previewTableRow, rIdx % 2 === 1 && styles.previewTableRowAlt]}>
                        {row.map((cell, cIdx) => (
                          <Text key={cIdx} style={[styles.previewTd, { flex: cIdx === 0 ? 1.5 : 1 }]}>
                            {cell}
                          </Text>
                        ))}
                      </View>
                    ))}
                  </View>

                  {viewItem.previewData.summary && (
                    <View style={styles.previewSummaryBox}>
                      <Text style={styles.previewSummaryTitle}>SUMMARY METRICS</Text>
                      <View style={styles.previewSummaryGrid}>
                        {Object.entries(viewItem.previewData.summary).map(([key, val]) => (
                          <View key={key} style={styles.previewSummaryItem}>
                            <Text style={styles.summaryItemKey}>{key}:</Text>
                            <Text style={styles.summaryItemVal}>{val}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* 2. ADD DOCUMENT MODAL: TWO OPTIONS ONLY                  */}
      {/* (Insert Document OR Scan Document)                       */}
      {/* ======================================================== */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={[styles.modalOverlay, isMobile && styles.modalOverlayMobile]}>
          <View style={[styles.formModalContainer, isMobile && styles.modalContainerMobile, isLight && styles.formModalContainerLight]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, isMobile && styles.modalHeaderMobile, isLight && styles.modalHeaderLight]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                {addMode !== 'options' && (
                  <TouchableOpacity
                    onPress={() => {
                      stopCamera();
                      setAddMode('options');
                    }}
                    style={styles.backModalBtn}
                  >
                    <ArrowLeft size={18} color={isLight ? '#0284c7' : '#38bdf8'} />
                  </TouchableOpacity>
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.modalTitle, isMobile && { fontSize: 15 }, isLight && styles.modalTitleLight]} numberOfLines={1}>
                    {addMode === 'options' && 'Add Document'}
                    {addMode === 'insert' && 'Insert Document from Device'}
                    {addMode === 'scan' && 'Scan Receipt Document'}
                  </Text>
                  <Text style={[styles.modalHeaderSub, isMobile && { fontSize: 11 }, isLight && styles.viewerSubtitleLight]} numberOfLines={1}>
                    {addMode === 'options' && 'Choose one of the two options below to add records'}
                    {addMode === 'insert' && `Target Category: ${activeNav.label}`}
                    {addMode === 'scan' && 'Choose receipt type and capture with camera'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity onPress={closeAddModal} style={[styles.modalCloseBtn, isLight && styles.modalCloseBtnLight]}>
                <X size={18} color={isLight ? '#475569' : '#94a3b8'} />
              </TouchableOpacity>
            </View>

            {/* ---------------------------------------------------- */}
            {/* STAGE 1: THE TWO OPTIONS (Insert OR Scan)             */}
            {/* ---------------------------------------------------- */}
            {addMode === 'options' && (
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={[styles.optionsBody, isMobile && styles.optionsBodyMobile]}
                showsVerticalScrollIndicator={false}
              >
                {/* Option 1: Insert Document */}
                <TouchableOpacity
                  style={[styles.optionCard, isMobile && styles.optionCardMobile, isLight && styles.optionCardLight]}
                  onPress={() => setAddMode('insert')}
                >
                  <View style={styles.optionCardTopRow}>
                    <View style={styles.optionIconBox}>
                      <UploadCloud size={24} color="#38bdf8" />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.optionTitle, isLight && styles.optionTitleLight]}>Insert Document</Text>
                      <Text style={[styles.optionSubtitle, isLight && styles.optionSubtitleLight]}>Select file from device</Text>
                    </View>
                  </View>
                  <Text style={[styles.optionDescription, isLight && styles.optionDescriptionLight]}>
                    Browse or upload PDF reports, Excel spreadsheets (.xlsx), text files, or pre-scanned digital images stored on your device.
                  </Text>
                  <View style={[styles.optionActionBadge, isMobile && { width: '100%', alignItems: 'center' }]}>
                    <Text style={styles.optionActionText}>Select File →</Text>
                  </View>
                </TouchableOpacity>

                {/* Option 2: Scan Document */}
                <TouchableOpacity
                  style={[styles.optionCard, styles.optionCardScan, isMobile && styles.optionCardMobile, isLight && styles.optionCardLight]}
                  onPress={() => setAddMode('scan')}
                >
                  <View style={styles.optionCardTopRow}>
                    <View style={[styles.optionIconBox, styles.optionIconBoxScan]}>
                      <Camera size={24} color="#34d399" />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.optionTitle, isLight && styles.optionTitleLight]}>Scan Document</Text>
                      <Text style={[styles.optionSubtitle, { color: '#34d399' }]}>Camera receipt scanner</Text>
                    </View>
                  </View>
                  <Text style={[styles.optionDescription, isLight && styles.optionDescriptionLight]}>
                    Capture physical receipts or vouchers (Emission Sales, CTPL Insurance, Expenses, Consumables) via camera with real-time OCR extraction.
                  </Text>
                  <View style={[styles.optionActionBadge, styles.optionActionBadgeScan, isMobile && { width: '100%', alignItems: 'center' }]}>
                    <Text style={[styles.optionActionText, { color: '#34d399' }]}>Scan Receipt →</Text>
                  </View>
                </TouchableOpacity>
              </ScrollView>
            )}

            {/* ---------------------------------------------------- */}
            {/* STAGE 2: INSERT DOCUMENT FROM DEVICE                 */}
            {/* ---------------------------------------------------- */}
            {addMode === 'insert' && (
              <>
                <ScrollView style={styles.modalBody}>
                  {/* Hidden file input */}
                  <input
                    type="file"
                    id="deviceFileInput"
                    style={{ display: 'none' }}
                    onChange={handleDeviceFileSelect}
                  />

                  {!insertedFile ? (
                    <TouchableOpacity
                      style={styles.dropzone}
                      onPress={() => document.getElementById('deviceFileInput')?.click()}
                    >
                      <View style={styles.dropzoneIconBox}>
                        <UploadCloud size={40} color="#38bdf8" />
                      </View>
                      <Text style={styles.dropzoneTitle}>Choose a file from your device</Text>
                      <Text style={styles.dropzoneSub}>
                        Click anywhere in this box to browse existing files on your computer
                      </Text>
                      <View style={styles.supportedFormatsPill}>
                        <Text style={styles.supportedFormatsText}>Supported: PDF, XLSX, DOCX, JPG, PNG, CSV</Text>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.selectedFileContainer}>
                      <View style={styles.selectedFileHeader}>
                        <View style={styles.fileIconBox}>
                          {insertedFile.name.endsWith('.xlsx') ? (
                            <FileSpreadsheet size={26} color="#34d399" />
                          ) : (
                            <FileText size={26} color="#38bdf8" />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.selectedFileName} numberOfLines={1}>{insertedFile.name}</Text>
                          <Text style={styles.selectedFileSize}>
                            {(insertedFile.size / 1024).toFixed(1)} KB • Ready to save
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => setInsertedFile(null)}
                          style={styles.removeFileBtn}
                          title="Choose different file"
                        >
                          <X size={16} color="#f87171" />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.insertMetaBox}>
                        <Text style={styles.insertMetaLabel}>DESTINATION DIRECTORY</Text>
                        <Text style={styles.insertMetaValue}>{activeNav.label}</Text>
                      </View>
                    </View>
                  )}
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.btnSecondary}
                    onPress={() => setAddMode('options')}
                  >
                    <Text style={styles.btnSecondaryText}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.btnPrimary, !insertedFile && { opacity: 0.5 }]}
                    onPress={handleSaveInsertedFile}
                    disabled={!insertedFile || isUploading}
                  >
                    {isUploading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Check size={16} color="#fff" />
                        <Text style={styles.btnPrimaryText}>Save to Inventory</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ---------------------------------------------------- */}
            {/* STAGE 3: SCAN DOCUMENT / RECEIPT                     */}
            {/* ---------------------------------------------------- */}
            {addMode === 'scan' && (
              <>
                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  {/* Step A: Choose what receipt you are about to scan */}
                  <Text style={styles.scanSectionHeading}>
                    1. CHOOSE RECEIPT CLASSIFICATION:
                  </Text>
                  <View style={styles.receiptTypeGrid}>
                    {RECEIPT_TYPES.map(rt => {
                      const isSelected = selectedReceiptType.id === rt.id;
                      return (
                        <TouchableOpacity
                          key={rt.id}
                          style={[
                            styles.receiptTypeCard,
                            isLight && styles.receiptTypeCardLight,
                            isSelected && styles.receiptTypeCardActive,
                            isSelected && isLight && styles.receiptTypeCardActiveLight,
                            isMobile && { width: '100%' }
                          ]}
                          onPress={() => setSelectedReceiptType(rt)}
                        >
                          <View style={styles.receiptTypeHeader}>
                            <Text style={[styles.receiptTypeName, isLight && styles.receiptTypeNameLight, isSelected && styles.receiptTypeNameActive]}>
                              {rt.name}
                            </Text>
                            {isSelected && <CheckCircle2 size={16} color={isLight ? '#059669' : '#34d399'} />}
                          </View>
                          <Text style={[styles.receiptTypeDesc, isLight && styles.receiptTypeDescLight]} numberOfLines={2}>{rt.description}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                            <View style={[styles.receiptEntityBadge, isLight && styles.receiptEntityBadgeLight]}>
                              <Text style={[styles.receiptEntityBadgeText, isLight && styles.receiptEntityBadgeTextLight]}>{rt.category} • {rt.entity}</Text>
                            </View>
                            <View style={[styles.receiptEntityBadge, isLight ? { backgroundColor: 'rgba(2, 132, 199, 0.1)', borderColor: 'rgba(2, 132, 199, 0.25)' } : { backgroundColor: 'rgba(56, 189, 248, 0.12)', borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
                              <Text style={[styles.receiptEntityBadgeText, isLight ? { color: '#0284c7', fontSize: 10, fontFamily: 'monospace' } : { color: '#38bdf8', fontSize: 10, fontFamily: 'monospace' }]}>
                                📁 {rt.tableName}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Step B: Intelligent Camera & OCR Capture Triggers */}
                  <View style={{ marginTop: 18, marginBottom: 8 }}>
                    <Text style={[styles.scanSectionHeading, isLight && { color: '#0284c7' }]}>
                      2. SCAN RECEIPT (AUTO-READS ESTABLISHMENT, DATE, AMOUNT & ITEMS):
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: isLight ? '#f1f5f9' : 'rgba(56, 189, 248, 0.08)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginTop: 6, borderWidth: 1, borderColor: isLight ? '#cbd5e1' : 'rgba(56, 189, 248, 0.2)' }}>
                      <CheckCircle2 size={14} color={isLight ? '#059669' : '#34d399'} />
                      <Text style={{ fontSize: 11, color: isLight ? '#475569' : '#94a3b8', flex: 1 }}>
                        Target Classification: <Text style={{ color: isLight ? '#0284c7' : '#38bdf8', fontWeight: '700' }}>{selectedReceiptType.name} ({selectedReceiptType.category})</Text>
                      </Text>
                    </View>
                  </View>

                  {/* Native mobile camera input */}
                  <input
                    type="file"
                    id="mobileCameraInput"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={handleReceiptPhotoSelect}
                  />

                  {/* Standard file picker input */}
                  <input
                    type="file"
                    id="receiptPhotoUploadInput"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleReceiptPhotoSelect}
                  />

                  {isOcrProcessing ? (
                    /* OCR Processing Screen */
                    <View style={[styles.ocrScanningCard, isLight && { backgroundColor: '#f8fafc', borderColor: '#38bdf8' }]}>
                      <ActivityIndicator size="large" color="#38bdf8" />
                      <View style={{ alignItems: 'center', gap: 4 }}>
                        <Text style={[styles.ocrScanningTitle, isLight && { color: '#0284c7' }]}>Reading Receipt with Gemini Vision AI...</Text>
                        <Text style={[styles.ocrScanningSub, isLight && { color: '#64748b' }]}>{ocrStatusText || 'Extracting establishment, date, description & amount...'}</Text>
                      </View>
                      <View style={styles.ocrProgressBarBg}>
                        <View style={[styles.ocrProgressBarFill, { width: `${Math.round((ocrProgress || 0.4) * 100)}%` }]} />
                      </View>
                    </View>
                  ) : ocrValidationError ? (
                    /* OCR Error Screen: Non-Receipt Rejected */
                    <View style={[styles.ocrErrorCard, isLight && styles.ocrErrorCardLight]}>
                      <View style={styles.ocrErrorHeader}>
                        <View style={styles.ocrErrorIconBox}>
                          <AlertTriangle size={24} color="#ef4444" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.ocrErrorTitle, isLight && { color: '#b91c1c' }]}>
                            Document Rejected: Not a Receipt
                          </Text>
                          <Text style={[styles.ocrErrorSubtitle, isLight && { color: '#64748b' }]}>
                            The scanned photo could not be validated as an official receipt or invoice.
                          </Text>
                        </View>
                      </View>

                      {/* Photo Thumbnail + Reason */}
                      <View style={[styles.ocrErrorBody, isLight && { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
                        {capturedReceiptPhoto && (
                          <img
                            src={capturedReceiptPhoto}
                            alt="Rejected Upload"
                            style={{ width: 60, height: 75, borderRadius: 6, objectFit: 'cover', border: '2px solid #ef4444' }}
                          />
                        )}
                        <View style={{ flex: 1, gap: 4 }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: isLight ? '#991b1b' : '#f87171' }}>
                            Validation Failure Reason:
                          </Text>
                          <Text style={{ fontSize: 12, color: isLight ? '#7f1d1d' : '#fca5a5', lineHeight: 16 }}>
                            {ocrValidationError}
                          </Text>
                          <Text style={{ fontSize: 11, color: isLight ? '#64748b' : '#94a3b8', marginTop: 4 }}>
                            🚫 Database Protection: Non-receipt images cannot be saved to the inventory.
                          </Text>
                        </View>
                      </View>

                      {/* Action buttons to retake or pick file */}
                      <View style={[styles.ocrActionsRow, isMobile && { flexDirection: 'column' }]}>
                        <TouchableOpacity
                          style={[styles.btnRetakeOcr, { flex: 1, backgroundColor: '#0284c7', borderColor: '#0284c7' }]}
                          onPress={() => {
                            setOcrValidationError('');
                            setCapturedReceiptPhoto(null);
                            startCamera();
                          }}
                        >
                          <Camera size={16} color="#ffffff" />
                          <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>
                            Retake Photo with Camera
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.btnRetakeOcr, isLight && styles.btnRetakeOcrLight, { flex: 1 }]}
                          onPress={() => {
                            setOcrValidationError('');
                            setCapturedReceiptPhoto(null);
                            document.getElementById('receiptPhotoUploadInput')?.click();
                          }}
                        >
                          <UploadCloud size={16} color={isLight ? '#334155' : '#cbd5e1'} />
                          <Text style={[styles.btnRetakeOcrText, isLight && styles.btnRetakeOcrTextLight]}>
                            Upload Different File
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : isOcrVerifiedView ? (
                    /* OCR Verification & Review Screen */
                    <View style={[styles.ocrVerificationContainer, isLight && styles.ocrVerificationContainerLight]}>
                      <View style={[styles.ocrVerificationHeader, isLight && { borderBottomColor: '#e2e8f0' }]}>
                        <View style={styles.ocrVerificationTitleRow}>
                          <Sparkles size={18} color={isLight ? '#0284c7' : '#38bdf8'} />
                          <Text style={[styles.ocrVerificationTitle, isLight && styles.ocrVerificationTitleLight]}>Extracted Receipt Details</Text>
                        </View>
                        <View style={[styles.receiptEntityBadge, { backgroundColor: isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(52, 211, 153, 0.15)', borderColor: isLight ? 'rgba(16, 185, 129, 0.3)' : 'rgba(52, 211, 153, 0.3)', borderWidth: 1 }]}>
                          <Text style={[styles.receiptEntityBadgeText, { color: isLight ? '#059669' : '#34d399' }]}>OCR Extracted</Text>
                        </View>
                      </View>

                      {/* Receipt thumbnail + Target Table info */}
                      <View style={[styles.ocrPreviewRow, isLight && styles.ocrPreviewRowLight]}>
                        {capturedReceiptPhoto && (
                          <img
                            src={capturedReceiptPhoto}
                            alt="Captured Receipt"
                            style={{ width: 60, height: 75, borderRadius: 6, objectFit: 'cover', border: isLight ? '1px solid #cbd5e1' : '1px solid #334155' }}
                          />
                        )}
                        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                          <Text style={{ fontSize: 13, color: isLight ? '#0f172a' : '#f8fafc', fontWeight: '700' }} numberOfLines={1}>
                            {ocrEstablishment || selectedReceiptType.name}
                          </Text>
                          <Text style={{ fontSize: 11, color: isLight ? '#64748b' : '#94a3b8' }} numberOfLines={1}>
                            Classification: <Text style={{ color: isLight ? '#0f172a' : '#cbd5e1', fontWeight: '600' }}>{selectedReceiptType.name}</Text>
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <Text style={{ fontSize: 10, color: isLight ? '#059669' : '#34d399', fontFamily: 'monospace', fontWeight: '700' }}>
                              📁 public.{selectedReceiptType.tableName}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Form fields: Receipt Name, Establishment, Date, Description, Amount, OR No */}
                      <View style={styles.ocrFieldsGrid}>
                        {/* 0. Receipt / File Name (Customizable before saving) */}
                        <View style={styles.ocrFieldItem}>
                          <View style={styles.ocrFieldLabelRow}>
                            <Edit3 size={13} color={isLight ? '#0284c7' : '#38bdf8'} />
                            <Text style={[styles.ocrFieldLabel, isLight && styles.ocrFieldLabelLight]}>Receipt / File Name (Customizable):</Text>
                          </View>
                          <TextInput
                            style={[styles.ocrFieldInput, isLight && styles.ocrFieldInputLight, { fontWeight: '700' }]}
                            value={ocrReceiptName}
                            onChangeText={setOcrReceiptName}
                            placeholder="e.g. Scanned_REC_1001 or Custom Receipt Name"
                            placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                          />
                        </View>

                        {/* 1. Establishment */}
                        <View style={styles.ocrFieldItem}>
                          <View style={styles.ocrFieldLabelRow}>
                            <Building2 size={13} color={isLight ? '#0284c7' : '#38bdf8'} />
                            <Text style={[styles.ocrFieldLabel, isLight && styles.ocrFieldLabelLight]}>Establishment / Store Name:</Text>
                          </View>
                          <TextInput
                            style={[styles.ocrFieldInput, isLight && styles.ocrFieldInputLight]}
                            value={ocrEstablishment}
                            onChangeText={setOcrEstablishment}
                            placeholder="e.g. Store or Business Name"
                            placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                          />
                        </View>

                        {/* 2. Date */}
                        <View style={styles.ocrFieldItem}>
                          <View style={styles.ocrFieldLabelRow}>
                            <Calendar size={13} color={isLight ? '#0284c7' : '#38bdf8'} />
                            <Text style={[styles.ocrFieldLabel, isLight && styles.ocrFieldLabelLight]}>Receipt Date:</Text>
                          </View>
                          <TextInput
                            style={[styles.ocrFieldInput, isLight && styles.ocrFieldInputLight]}
                            value={ocrReceiptDate}
                            onChangeText={setOcrReceiptDate}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                          />
                        </View>

                        {/* 3. Description */}
                        <View style={styles.ocrFieldItem}>
                          <View style={styles.ocrFieldLabelRow}>
                            <FileText size={13} color={isLight ? '#0284c7' : '#38bdf8'} />
                            <Text style={[styles.ocrFieldLabel, isLight && styles.ocrFieldLabelLight]}>Description / Nature of Service:</Text>
                          </View>
                          <TextInput
                            style={[styles.ocrFieldInput, isLight && styles.ocrFieldInputLight]}
                            value={ocrDescription}
                            onChangeText={setOcrDescription}
                            placeholder="e.g. Service or Item Details"
                            placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                          />
                        </View>

                        {/* 4. Amount */}
                        <View style={styles.ocrFieldItem}>
                          <View style={styles.ocrFieldLabelRow}>
                            <DollarSign size={13} color={isLight ? '#059669' : '#34d399'} />
                            <Text style={[styles.ocrFieldLabel, isLight && styles.ocrFieldLabelLight]}>Amount (PHP):</Text>
                          </View>
                          <TextInput
                            style={[styles.ocrFieldInput, isLight && styles.ocrFieldInputLight, { color: isLight ? '#059669' : '#34d399', fontWeight: '700' }]}
                            value={ocrAmount}
                            onChangeText={setOcrAmount}
                            placeholder="0.00"
                            placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                            keyboardType="numeric"
                          />
                        </View>

                        {/* 5. OR Number */}
                        <View style={styles.ocrFieldItem}>
                          <View style={styles.ocrFieldLabelRow}>
                            <Receipt size={13} color={isLight ? '#0284c7' : '#38bdf8'} />
                            <Text style={[styles.ocrFieldLabel, isLight && styles.ocrFieldLabelLight]}>Invoice / OR No.:</Text>
                          </View>
                          <TextInput
                            style={[styles.ocrFieldInput, isLight && styles.ocrFieldInputLight]}
                            value={ocrOrNumber}
                            onChangeText={setOcrOrNumber}
                            placeholder="e.g. OR-2026-001"
                            placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                          />
                        </View>
                      </View>

                      {/* Actions */}
                      <View style={[styles.ocrActionsRow, isMobile && { flexDirection: 'column' }]}>
                        <TouchableOpacity
                          style={styles.btnSaveVerified}
                          onPress={saveVerifiedReceiptToDatabase}
                          disabled={isSavingScan}
                        >
                          {isSavingScan ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <CheckCircle2 size={16} color="#fff" />
                              <Text style={styles.btnSaveVerifiedText}>
                                Save as {selectedReceiptType.name}
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.btnRetakeOcr, isLight && styles.btnRetakeOcrLight]}
                          onPress={() => {
                            setIsOcrVerifiedView(false);
                            setCapturedReceiptPhoto(null);
                          }}
                        >
                          <RefreshCw size={14} color={isLight ? '#475569' : '#94a3b8'} />
                          <Text style={[styles.btnRetakeOcrText, isLight && styles.btnRetakeOcrTextLight]}>Retake Photo</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : cameraActive ? (
                    /* Live Camera Viewfinder with Scanner Frame */
                    <View style={styles.cameraContainer}>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{ width: '100%', height: isSmallMobile ? 240 : isMobile ? 300 : 360, objectFit: 'cover', borderRadius: 8, backgroundColor: '#000' }}
                      />
                      <View style={styles.cameraOverlayFrame}>
                        <View style={styles.scannerCornerTL} />
                        <View style={styles.scannerCornerTR} />
                        <View style={styles.scannerCornerBL} />
                        <View style={styles.scannerCornerBR} />
                        <Text style={styles.scannerGuideText}>Center receipt inside frame</Text>
                      </View>

                      <View style={styles.cameraActionRow}>
                        <TouchableOpacity
                          style={styles.btnCaptureShutter}
                          onPress={captureCameraSnapshotAndAutoSave}
                          disabled={isSavingScan || isOcrProcessing}
                        >
                          <Camera size={18} color="#fff" />
                          <Text style={styles.btnCaptureShutterText}>{isSmallMobile ? 'Capture' : 'Capture & Read Receipt'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.btnFlipCamera} onPress={flipCamera}>
                          <RefreshCw size={14} color="#cbd5e1" />
                          <Text style={styles.btnFlipCameraText}>Flip</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.btnCancelCamera} onPress={stopCamera}>
                          <Text style={styles.btnCancelCameraText}>Close</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    /* Scan Mode Options */
                    <View style={[styles.scanTriggerGrid, isMobile && { flexDirection: 'column' }]}>
                      {/* Option 1: Live In-Browser Viewfinder */}
                      <TouchableOpacity style={styles.scanOptionBtn} onPress={() => startCamera('environment')}>
                        <View style={styles.scanOptionIconBox}>
                          <Camera size={26} color="#34d399" />
                        </View>
                        <Text style={styles.scanOptionTitle}>Open Live Camera Viewfinder</Text>
                        <Text style={styles.scanOptionSub}>Point device camera with alignment frame to read receipt</Text>
                      </TouchableOpacity>

                      {/* Option 2: Native Phone Camera App */}
                      <TouchableOpacity
                        style={[styles.scanOptionBtn, styles.scanOptionBtnNative]}
                        onPress={() => document.getElementById('mobileCameraInput')?.click()}
                      >
                        <View style={[styles.scanOptionIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.1)', borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
                          <Smartphone size={26} color="#38bdf8" />
                        </View>
                        <Text style={styles.scanOptionTitle}>Take Photo with Phone Camera</Text>
                        <Text style={styles.scanOptionSub}>Take clear photo, auto-read establishment, date & amount</Text>
                      </TouchableOpacity>

                      {/* Option 3: Upload Existing Photo */}
                      <TouchableOpacity
                        style={[styles.scanOptionBtn, styles.scanOptionBtnUpload]}
                        onPress={() => document.getElementById('receiptPhotoUploadInput')?.click()}
                      >
                        <View style={[styles.scanOptionIconBox, { backgroundColor: 'rgba(148, 163, 184, 0.1)', borderColor: 'rgba(148, 163, 184, 0.3)' }]}>
                          <UploadCloud size={26} color="#94a3b8" />
                        </View>
                        <Text style={styles.scanOptionTitle}>Upload Receipt Photo</Text>
                        <Text style={styles.scanOptionSub}>Upload receipt image from gallery or phone storage</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.btnSecondary}
                    onPress={() => {
                      stopCamera();
                      setAddMode('options');
                    }}
                  >
                    <Text style={styles.btnSecondaryText}>Back</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* 3. RENAME DOCUMENT MODAL                                  */}
      {/* ======================================================== */}
      <Modal visible={!!renameItem} transparent animationType="fade">
        <View style={[styles.modalOverlay, isMobile && styles.modalOverlayMobile]}>
          <View style={[styles.renameModalContainer, isMobile && { width: '92%', maxWidth: '100%' }, isLight && styles.renameModalContainerLight]}>
            <View style={styles.renameModalHeader}>
              <View style={styles.renameIconBox}>
                <Edit3 size={20} color={isLight ? '#0284c7' : '#38bdf8'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.renameModalTitle, isLight && styles.renameModalTitleLight]}>Rename Document</Text>
                <Text style={styles.renameModalSubtitle}>Update the document file name and record title</Text>
              </View>
              <TouchableOpacity
                style={[styles.modalCloseBtn, isLight && styles.modalCloseBtnLight]}
                onPress={() => {
                  setRenameItem(null);
                  setRenameNewName('');
                }}
              >
                <X size={18} color={isLight ? '#475569' : '#94a3b8'} />
              </TouchableOpacity>
            </View>

            <View style={styles.renameModalBody}>
              <Text style={[styles.renameFieldLabel, isLight && styles.renameFieldLabelLight]}>DOCUMENT FILE NAME:</Text>
              <TextInput
                style={[styles.renameInput, isLight && styles.renameInputLight]}
                value={renameNewName}
                onChangeText={setRenameNewName}
                placeholder="Enter new file name..."
                placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                autoFocus
                selectTextOnFocus
              />
              <Text style={styles.renameHint}>
                Format: {renameItem?.fileFormat || 'JPG'} • Current: {renameItem?.fileName}
              </Text>
            </View>

            <View style={styles.renameModalFooter}>
              <TouchableOpacity
                style={[styles.btnSecondary, isLight && styles.btnSecondaryLight]}
                onPress={() => {
                  setRenameItem(null);
                  setRenameNewName('');
                }}
                disabled={isRenaming}
              >
                <Text style={[styles.btnSecondaryText, isLight && styles.btnSecondaryTextLight]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnSaveVerified, isRenaming && { opacity: 0.6 }]}
                onPress={handleRenameItem}
                disabled={isRenaming}
              >
                <CheckCircle2 size={16} color="#ffffff" />
                <Text style={styles.btnSaveVerifiedText}>
                  {isRenaming ? 'Saving...' : 'Save Name'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MOBILE FLOATING ACTION BUTTON (SCAN RECEIPT) */}
      {isMobile && (
        <View style={styles.mobileFloatingBar}>
          <TouchableOpacity
            style={styles.mobileFloatingBtn}
            onPress={openAddModal}
            activeOpacity={0.85}
            title="Scan receipt with camera"
          >
            <Camera size={20} color="#ffffff" />
            <Text style={styles.mobileFloatingBtnText}>Scan Receipt</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// STYLES
function createStyles(isLight) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
    flexDirection: 'column',
    height: '100%',
    width: '100%'
  },

  // TOP PROFESSIONAL HEADER BAR
  topHeader: {
    height: 64,
    backgroundColor: '#0c1322',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 16,
    zIndex: 100
  },
  topHeaderLight: {
    backgroundColor: '#ffffff',
    borderBottomColor: '#e2e8f0'
  },
  topHeaderMobile: {
    height: 56,
    paddingHorizontal: 10,
    gap: 8
  },
  topHeaderSmallMobile: {
    height: 50,
    paddingHorizontal: 6,
    gap: 5
  },
  topHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  sidebarToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155'
  },
  sidebarToggleBtnLight: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1'
  },
  sidebarToggleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38bdf8'
  },
  sidebarToggleBtnTextLight: {
    color: '#0284c7'
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  brandBadge: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  brandBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  brandTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 0.5
  },
  brandTitleLight: {
    color: '#0f172a'
  },
  brandSub: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500'
  },
  brandSubLight: {
    color: '#94a3b8'
  },

  // Header Search Box
  headerSearchBox: {
    flex: 1,
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 38
  },
  headerSearchBoxLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1'
  },
  headerSearchInput: {
    flex: 1,
    fontSize: 12,
    color: '#f8fafc',
    outlineStyle: 'none'
  },
  headerSearchInputLight: {
    color: '#0f172a'
  },

  // Header Actions
  topHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  heroScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
    boxShadow: '0 2px 10px rgba(5, 150, 105, 0.35)'
  },
  heroScanBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  },
  heroExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155'
  },
  heroExportBtnLight: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1'
  },
  heroExportBtnText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '600'
  },
  heroExportBtnTextLight: {
    color: '#059669'
  },
  headerIconBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155'
  },
  headerIconBtnLight: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1'
  },
  headerSyncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  headerSyncPillLight: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0'
  },
  headerSyncText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#34d399'
  },
  headerSyncTextLight: {
    color: '#059669'
  },
  headerUserBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 4
  },
  headerUserAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerUserAvatarLight: {
    backgroundColor: '#0284c7'
  },
  headerUserInitial: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  headerLogoutBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)'
  },
  headerLogoutBtnLight: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca'
  },

  // 1. STATS OVERVIEW GRID (AT-A-GLANCE METRICS)
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4
  },
  statsGridMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 2
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    gap: 4,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
  },
  statCardMobile: {
    flexBasis: '47%',
    flexGrow: 1,
    padding: 10,
    borderRadius: 10
  },
  statCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
  },
  statCardActive: {
    borderColor: '#38bdf8',
    backgroundColor: '#111e38'
  },
  statCardActiveLight: {
    borderColor: '#0284c7',
    backgroundColor: '#f0f9ff'
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  statCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5
  },
  statCardLabelLight: {
    color: '#64748b'
  },
  statIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statCardValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5
  },
  statCardValueMobile: {
    fontSize: 14,
    letterSpacing: -0.2
  },
  statCardSub: {
    fontSize: 11,
    color: '#94a3b8'
  },
  statCardSubLight: {
    color: '#64748b'
  },

  // 2. HORIZONTAL CATEGORY NAVIGATION TABS
  categoryNavBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
  },
  categoryNavBarLight: {
    borderBottomColor: '#e2e8f0'
  },
  categoryNavScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  categoryTabLight: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1'
  },
  categoryTabActive: {
    backgroundColor: '#1e293b',
    borderColor: '#38bdf8'
  },
  categoryTabActiveLight: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0284c7'
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8'
  },
  categoryTabTextLight: {
    color: '#475569'
  },
  categoryTabTextActive: {
    color: '#38bdf8',
    fontWeight: '700'
  },
  categoryTabTextActiveLight: {
    color: '#0284c7',
    fontWeight: '700'
  },
  categoryTabBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10
  },
  categoryTabBadgeLight: {
    backgroundColor: '#f1f5f9'
  },
  categoryTabBadgeActive: {
    backgroundColor: '#0284c7'
  },
  categoryTabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8'
  },
  categoryTabBadgeTextActive: {
    color: '#ffffff'
  },
  categoryTabBadgeTextLight: {
    color: '#64748b'
  },

  // 3. CONTEXTUAL SUB-FILTER CHIPS
  subFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0b1324',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    flexWrap: 'wrap'
  },
  subFilterRowLight: {
    backgroundColor: '#f8fafc',
    borderBottomColor: '#e2e8f0'
  },
  subFilterHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginRight: 4
  },
  subFilterHeadingLight: {
    color: '#64748b'
  },
  subFilterChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155'
  },
  subFilterChipLight: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1'
  },
  subFilterChipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8'
  },
  subFilterChipActiveLight: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7'
  },
  subFilterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#cbd5e1'
  },
  subFilterChipTextLight: {
    color: '#334155'
  },
  subFilterChipTextActive: {
    color: '#ffffff',
    fontWeight: '700'
  },

  // Clear Filter Action
  clearFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    marginLeft: 6
  },
  clearFilterBtnLight: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca'
  },
  clearFilterBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#f87171'
  },
  clearFilterBtnTextLight: {
    color: '#dc2626'
  },

  // Mobile Floating Action Button
  mobileFloatingBar: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 9999
  },
  mobileFloatingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 30,
    boxShadow: '0 8px 24px rgba(5, 150, 105, 0.5)',
    borderWidth: 1,
    borderColor: '#34d399'
  },
  mobileFloatingBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3
  },

  // Toast
  toast: {
    position: 'absolute',
    top: 16,
    right: 24,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
  },
  toastSuccess: {
    backgroundColor: '#059669',
    borderColor: '#10b981',
    borderWidth: 1
  },
  toastError: {
    backgroundColor: '#dc2626',
    borderColor: '#ef4444',
    borderWidth: 1
  },
  toastText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600'
  },

  // Main Workspace
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative'
  },

  // Sidebar Tree
  sidebar: {
    width: 290,
    backgroundColor: '#0f172a',
    borderRightWidth: 1,
    borderRightColor: '#1e293b',
    flexDirection: 'column'
  },
  sidebarTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
  },
  sidebarCollapseBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#1e293b',
    cursor: 'pointer',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sidebarSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8
  },
  treeScroll: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10
  },
  separator: {
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 10
  },
  categoryBlock: {
    marginBottom: 6
  },
  treeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 8
  },
  treeItemActive: {
    backgroundColor: isLight ? '#e0f2fe' : '#1e293b'
  },
  iconToggle: {
    padding: 2
  },
  treeCategoryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: isLight ? '#0f172a' : '#cbd5e1'
  },
  treeText: {
    fontSize: 13,
    color: isLight ? '#334155' : '#94a3b8',
    fontWeight: '500'
  },
  treeTextActive: {
    color: isLight ? '#0284c7' : '#38bdf8',
    fontWeight: '700'
  },
  treeChildren: {
    paddingLeft: 22,
    marginTop: 2
  },
  treeSubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 6
  },
  treeSubText: {
    fontSize: 12,
    color: isLight ? '#475569' : '#94a3b8',
    fontWeight: '500'
  },
  monthPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    paddingLeft: 20,
    paddingVertical: 4
  },
  monthMiniPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155'
  },
  monthMiniPillActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8'
  },
  monthMiniPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8'
  },
  monthMiniPillTextActive: {
    color: '#ffffff',
    fontWeight: '700'
  },

  // Main Content Area
  contentArea: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#090d16'
  },
  controlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0f172a'
  },
  controlBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  burgerToggleBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
    borderWidth: 1,
    borderColor: isLight ? '#cbd5e1' : '#334155',
    cursor: 'pointer',
    alignItems: 'center',
    justifyContent: 'center'
  },
  breadcrumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  breadcrumbItem: {
    fontSize: 13,
    color: '#64748b'
  },
  breadcrumbActive: {
    fontSize: 14,
    color: '#f8fafc',
    fontWeight: '700'
  },
  controlBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 40,
    width: 260,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 10
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 13,
    paddingVertical: 0,
    outlineStyle: 'none'
  },
  countBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155'
  },
  countBadgeText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600'
  },
  cachePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0c1322',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)'
  },
  cachePillText: {
    fontSize: 11,
    color: '#34d399',
    fontWeight: '600'
  },
  allFilesToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#131d31',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 8,
    cursor: 'pointer'
  },
  allFilesToggleBtnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.45)'
  },
  allFilesToggleBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8'
  },
  allFilesToggleBtnTextActive: {
    color: '#38bdf8'
  },
  exportExcelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: isLight ? '#a7f3d0' : 'rgba(52, 211, 153, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    cursor: 'pointer'
  },
  exportExcelBtnLight: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0'
  },
  exportExcelBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: isLight ? '#059669' : '#34d399'
  },
  exportExcelBtnTextLight: {
    color: '#059669'
  },
  treeFolderExportBtn: {
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 4,
    backgroundColor: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: isLight ? '#a7f3d0' : 'rgba(52, 211, 153, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer'
  },
  sidebarToggleSwitch: {
    width: 32,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    padding: 2,
    justifyContent: 'center',
    cursor: 'pointer'
  },
  sidebarToggleSwitchActive: {
    backgroundColor: '#0369a1',
    borderColor: '#38bdf8'
  },
  sidebarToggleThumb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#64748b'
  },
  sidebarToggleThumbActive: {
    backgroundColor: '#ffffff',
    alignSelf: 'flex-end'
  },
  btnToggleEmptyOn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#38bdf8',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    cursor: 'pointer'
  },
  btnToggleEmptyOnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a'
  },

  // Table View
  tableHorizontal: {
    flex: 1,
    width: '100%'
  },
  tableVertical: {
    flex: 1,
    width: '100%'
  },
  table: {
    minWidth: 1000,
    padding: 16
  },
  tableRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131d31',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 4
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: isLight ? '#e2e8f0' : '#1e293b',
    backgroundColor: isLight ? '#ffffff' : '#0f172a'
  },
  tableRowAlt: {
    backgroundColor: isLight ? '#f8fafc' : '#131d31'
  },
  td: {
    fontSize: 12,
    color: isLight ? '#1e293b' : '#cbd5e1'
  },
  btnTableAction: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
    borderWidth: isLight ? 1 : 0,
    borderColor: isLight ? '#e2e8f0' : 'transparent'
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start'
  },
  statusTagSuccess: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)'
  },
  statusTagDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)'
  },
  statusTagInfo: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)'
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#e2e8f0'
  },

  // Loading & Empty states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 12
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#cbd5e1'
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 480,
    lineHeight: 20
  },

  // Buttons in Modals
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0284c7',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38bdf8'
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600'
  },
  btnSecondary: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155'
  },
  btnSecondaryText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600'
  },
  btnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isLight ? '#cbd5e1' : '#334155',
    backgroundColor: isLight ? '#f1f5f9' : '#1e293b'
  },
  btnOutlineText: {
    color: isLight ? '#334155' : '#cbd5e1',
    fontSize: 12,
    fontWeight: '600'
  },

  // Viewer Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  modalOverlayMobile: {
    padding: 8
  },
  modalContainerMobile: {
    width: '100%',
    maxWidth: '100%',
    maxHeight: '96%',
    borderRadius: 12
  },
  modalHeaderMobile: {
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  viewerModalContainer: {
    width: '90%',
    maxWidth: 960,
    maxHeight: '90%',
    backgroundColor: isLight ? '#ffffff' : '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isLight ? '#cbd5e1' : '#334155',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  viewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: isLight ? '#ffffff' : '#131d31',
    borderBottomWidth: 1,
    borderBottomColor: isLight ? '#e2e8f0' : '#1e293b'
  },
  viewerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  viewerBadge: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isLight ? '#bae6fd' : 'rgba(56, 189, 248, 0.3)'
  },
  viewerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: isLight ? '#0f172a' : '#f8fafc',
    fontFamily: 'JetBrains Mono, monospace'
  },
  viewerSubtitle: {
    fontSize: 12,
    color: isLight ? '#64748b' : '#94a3b8',
    marginTop: 2
  },
  viewerHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: isLight ? '#f1f5f9' : '#1e293b'
  },
  viewerBody: {
    padding: 24,
    backgroundColor: isLight ? '#ffffff' : '#0f172a'
  },
  viewerStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20
  },
  viewerStatBox: {
    flex: 1,
    minWidth: 130,
    backgroundColor: isLight ? '#f8fafc' : '#131d31',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: isLight ? '#e2e8f0' : '#1e293b'
  },
  viewerStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: isLight ? '#64748b' : '#64748b',
    marginBottom: 4
  },
  viewerStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: isLight ? '#0f172a' : '#f8fafc'
  },
  viewerSection: {
    marginBottom: 20
  },
  viewerSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: isLight ? '#475569' : '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 10
  },
  notesBox: {
    backgroundColor: isLight ? '#f8fafc' : '#131d31',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: isLight ? '#e2e8f0' : '#1e293b'
  },
  notesText: {
    fontSize: 13,
    color: isLight ? '#334155' : '#cbd5e1',
    lineHeight: 20
  },
  previewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  previewBadge: {
    fontSize: 11,
    color: isLight ? '#059669' : '#34d399',
    backgroundColor: isLight ? '#ecfdf5' : 'rgba(52, 211, 153, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: isLight ? '#a7f3d0' : 'rgba(52, 211, 153, 0.3)'
  },
  previewTableContainer: {
    backgroundColor: isLight ? '#ffffff' : '#131d31',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isLight ? '#e2e8f0' : '#1e293b',
    overflow: 'hidden'
  },
  previewTableRowHeader: {
    flexDirection: 'row',
    backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: isLight ? 1 : 0,
    borderBottomColor: isLight ? '#e2e8f0' : 'transparent'
  },
  previewTh: {
    fontSize: 11,
    fontWeight: '700',
    color: isLight ? '#475569' : '#94a3b8'
  },
  previewTableRow: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: isLight ? '#e2e8f0' : '#1e293b',
    backgroundColor: isLight ? '#ffffff' : 'transparent'
  },
  previewTableRowAlt: {
    backgroundColor: isLight ? '#f8fafc' : 'rgba(30, 41, 59, 0.5)'
  },
  previewTd: {
    fontSize: 12,
    color: isLight ? '#1e293b' : '#cbd5e1'
  },
  previewSummaryBox: {
    backgroundColor: isLight ? '#f8fafc' : '#0c1322',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: isLight ? '#e2e8f0' : '#1e293b',
    marginTop: 10
  },
  previewSummaryTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 6,
    letterSpacing: 0.5
  },
  previewSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16
  },
  previewSummaryItem: {
    flexDirection: 'row',
    gap: 6
  },
  summaryItemKey: {
    fontSize: 12,
    color: isLight ? '#64748b' : '#94a3b8'
  },
  summaryItemVal: {
    fontSize: 12,
    fontWeight: '700',
    color: isLight ? '#0284c7' : '#38bdf8'
  },

  // ADD DOCUMENT MODAL STYLES (TWO OPTIONS)
  formModalContainer: {
    width: '90%',
    maxWidth: 680,
    maxHeight: '90%',
    backgroundColor: isLight ? '#ffffff' : '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: isLight ? '#cbd5e1' : '#334155',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: isLight ? '#ffffff' : '#131d31',
    borderBottomWidth: 1,
    borderBottomColor: isLight ? '#e2e8f0' : '#1e293b'
  },
  backModalBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
    borderWidth: isLight ? 1 : 0,
    borderColor: isLight ? '#cbd5e1' : 'transparent',
    marginRight: 6
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: isLight ? '#0f172a' : '#f8fafc'
  },
  modalHeaderSub: {
    fontSize: 12,
    color: isLight ? '#64748b' : '#94a3b8',
    marginTop: 2
  },
  modalBody: {
    padding: 20,
    backgroundColor: isLight ? '#ffffff' : '#0f172a'
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: isLight ? '#f8fafc' : '#131d31',
    borderTopWidth: 1,
    borderTopColor: isLight ? '#e2e8f0' : '#1e293b'
  },

  // Options Screen (The Two Cards)
  optionsBody: {
    padding: 24,
    gap: 16
  },
  optionsBodyMobile: {
    padding: 12,
    gap: 12
  },
  optionCard: {
    flexDirection: 'column',
    alignItems: 'stretch',
    backgroundColor: isLight ? '#f8fafc' : '#131d31',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: isLight ? '#e2e8f0' : '#1e293b',
    gap: 12
  },
  optionCardMobile: {
    padding: 14,
    gap: 10
  },
  optionCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  optionCardHeaderMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  optionCardScan: {
    borderColor: '#1e293b'
  },
  optionIconBox: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  optionIconBoxScan: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderColor: 'rgba(52, 211, 153, 0.3)'
  },
  optionContent: {
    flex: 1
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: isLight ? '#0f172a' : '#f8fafc',
    marginBottom: 2
  },
  optionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: isLight ? '#0284c7' : '#38bdf8'
  },
  optionDescription: {
    fontSize: 12,
    color: isLight ? '#475569' : '#94a3b8',
    lineHeight: 18
  },
  optionActionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)'
  },
  optionActionBadgeScan: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderColor: 'rgba(52, 211, 153, 0.3)'
  },
  optionActionText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700'
  },

  // Insert Document View
  dropzone: {
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    padding: 36,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12
  },
  dropzoneIconBox: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  dropzoneTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc'
  },
  dropzoneSub: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center'
  },
  supportedFormatsPill: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 4
  },
  supportedFormatsText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600'
  },
  selectedFileContainer: {
    backgroundColor: '#131d31',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  selectedFileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14
  },
  fileIconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center'
  },
  selectedFileName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
    fontFamily: 'JetBrains Mono, monospace'
  },
  selectedFileSize: {
    fontSize: 12,
    color: '#34d399',
    marginTop: 2
  },
  removeFileBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)'
  },
  insertMetaBox: {
    backgroundColor: '#0c1322',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  insertMetaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 2
  },
  insertMetaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#38bdf8'
  },

  // Scan Document View
  scanSectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.6,
    marginBottom: 10
  },
  receiptTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  receiptTypeCard: {
    width: '48%',
    backgroundColor: '#131d31',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  receiptTypeCardActive: {
    borderColor: '#34d399',
    backgroundColor: '#14253a'
  },
  receiptTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  receiptTypeName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#cbd5e1'
  },
  receiptTypeNameActive: {
    color: '#38bdf8'
  },
  receiptTypeDesc: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 15,
    marginBottom: 8
  },
  receiptEntityBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start'
  },
  receiptEntityBadgeText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600'
  },
  scanMetaInputsCard: {
    backgroundColor: '#131d31',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
    marginBottom: 16
  },
  scanTriggerGrid: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 6
  },
  scanTriggerRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 4
  },
  scanOptionBtn: {
    flex: 1,
    backgroundColor: '#131d31',
    borderRadius: 10,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    gap: 8
  },
  scanOptionBtnNative: {
    borderColor: 'rgba(56, 189, 248, 0.3)'
  },
  scanOptionBtnUpload: {
    borderColor: 'rgba(148, 163, 184, 0.2)'
  },
  scanOptionIconBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  scanOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc'
  },
  scanOptionSub: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center'
  },

  // Camera & Photo Preview
  cameraContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cameraOverlayFrame: {
    position: 'absolute',
    top: 20,
    left: '10%',
    right: '10%',
    bottom: 60,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none'
  },
  scannerCornerTL: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#34d399'
  },
  scannerCornerTR: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#34d399'
  },
  scannerCornerBL: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#34d399'
  },
  scannerCornerBR: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#34d399'
  },
  scannerGuideText: {
    position: 'absolute',
    bottom: 8,
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    letterSpacing: 0.5
  },
  cameraActionRow: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  btnCaptureShutter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)'
  },
  btnCaptureShutterText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700'
  },
  btnFlipCamera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155'
  },
  btnFlipCameraText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600'
  },
  btnCancelCamera: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155'
  },
  btnCancelCameraText: {
    color: '#cbd5e1',
    fontSize: 12
  },
  scanSavingCard: {
    backgroundColor: '#131d31',
    borderRadius: 10,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#34d399'
  },
  scanSavingTitle: {
    color: '#34d399',
    fontSize: 15,
    fontWeight: '700'
  },
  scanSavingSub: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center'
  },

  // OCR Scanning & Data Verification Styles
  ocrScanningCard: {
    backgroundColor: '#131d31',
    borderRadius: 12,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#38bdf8',
    marginVertical: 12
  },
  ocrScanningTitle: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: '700'
  },
  ocrScanningSub: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center'
  },
  ocrProgressBarBg: {
    width: '100%',
    maxWidth: 320,
    height: 6,
    backgroundColor: '#1e293b',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 6
  },
  ocrProgressBarFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
    borderRadius: 3
  },
  ocrErrorCard: {
    backgroundColor: '#1c1917',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#ef4444',
    gap: 14,
    marginVertical: 8
  },
  ocrErrorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  ocrErrorIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)'
  },
  ocrErrorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f87171'
  },
  ocrErrorSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2
  },
  ocrErrorBody: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)'
  },
  ocrVerificationContainer: {
    backgroundColor: '#131d31',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 14,
    marginVertical: 8
  },
  ocrVerificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
  },
  ocrVerificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  ocrVerificationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc'
  },
  ocrPreviewRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    backgroundColor: '#0c1322',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  ocrThumb: {
    width: 60,
    height: 75,
    borderRadius: 6,
    objectFit: 'cover'
  },
  ocrFieldsGrid: {
    gap: 10
  },
  ocrFieldItem: {
    gap: 4
  },
  ocrFieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  ocrFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1'
  },
  ocrFieldInput: {
    backgroundColor: '#0c1322',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#f8fafc',
    fontSize: 13
  },
  ocrActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8
  },
  btnSaveVerified: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8
  },
  btnSaveVerifiedText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  },
  btnRetakeOcr: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8
  },
  btnRetakeOcrText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600'
  },
  scannedImageViewerBox: {
    backgroundColor: isLight ? '#f8fafc' : '#0c1322',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: isLight ? '#e2e8f0' : '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  capturedContainer: {
    backgroundColor: isLight ? '#f8fafc' : '#131d31',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: isLight ? '#e2e8f0' : '#1e293b'
  },
  capturedImageWrapper: {
    backgroundColor: isLight ? '#f1f5f9' : '#0c1322',
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14
  },
  scannedFormBox: {
    backgroundColor: '#0c1322',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10
  },
  scannedSuccessText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34d399'
  },
  scannedReceiptCategoryText: {
    fontSize: 12,
    color: '#94a3b8'
  },
  scannedFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  scannedFieldLabel: {
    width: 140,
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1'
  },
  scannedInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#f8fafc',
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#334155',
    outlineStyle: 'none'
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#1e293b',
    marginTop: 4
  },
  retakeBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600'
  },

  // Auth Styles
  authContainer: {
    flex: 1,
    minHeight: '100vh',
    backgroundColor: '#0b1120',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  authCard: {
    width: 440,
    maxWidth: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 30,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 20
  },
  authShieldIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  authBadgePill: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)'
  },
  authBadgePillText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  authTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 6,
    textAlign: 'center'
  },
  authSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18
  },
  authTabs: {
    flexDirection: 'row',
    backgroundColor: '#0b1120',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  authTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 6
  },
  authTabActive: {
    backgroundColor: '#1e293b'
  },
  authTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b'
  },
  authTabTextActive: {
    color: '#38bdf8',
    fontWeight: '700'
  },
  authErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16
  },
  authErrorText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '600',
    flex: 1
  },
  authForm: {
    gap: 14
  },
  authFieldGroup: {
    gap: 6
  },
  authLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5
  },
  authInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0b1120',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    position: 'relative'
  },
  authInputIcon: {
    marginRight: 8
  },
  authInput: {
    flex: 1,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 13,
    outlineStyle: 'none'
  },
  authEyeBtn: {
    position: 'absolute',
    right: 12,
    padding: 4
  },
  authSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 6,
    cursor: 'pointer'
  },
  authSubmitBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700'
  },
  authFooter: {
    marginTop: 20,
    alignItems: 'center'
  },
  adminSecurityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.2)'
  },
  adminSecurityNoticeText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '600'
  },

  // Sidebar Admin User Styles
  sidebarAdminBox: {
    borderTopWidth: 1,
    borderTopColor: isLight ? '#e2e8f0' : '#1e293b',
    padding: 12,
    backgroundColor: isLight ? '#f8fafc' : '#0b1120',
    gap: 8
  },
  sidebarAdminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  adminAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: isLight ? '#e0f2fe' : '#1e293b',
    borderWidth: 1,
    borderColor: isLight ? '#0284c7' : '#38bdf8',
    alignItems: 'center',
    justifyContent: 'center'
  },
  adminAvatarInitials: {
    color: isLight ? '#0284c7' : '#38bdf8',
    fontSize: 13,
    fontWeight: '800'
  },
  adminNameText: {
    color: isLight ? '#0f172a' : '#f8fafc',
    fontSize: 12,
    fontWeight: '700'
  },
  adminEmailText: {
    color: isLight ? '#64748b' : '#64748b',
    fontSize: 10
  },
  adminBadgePill: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  adminBadgePillText: {
    color: '#34d399',
    fontSize: 9,
    fontWeight: '800'
  },
  sidebarLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    cursor: 'pointer'
  },
  sidebarLogoutBtnText: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: '700'
  },

  // Mobile App Responsiveness Styles
  mobileTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    zIndex: 100
  },
  mobileMenuBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1e293b'
  },
  mobileTitleBlock: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8
  },
  mobileAppTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 0.5
  },
  mobileAppSub: {
    fontSize: 11,
    color: '#38bdf8',
    fontWeight: '600'
  },
  mobileAddBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(52, 211, 153, 0.15)'
  },
  mobileDrawerBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    zIndex: 998
  },
  mobileSidebarDrawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '85%',
    maxWidth: 320,
    height: '100%',
    backgroundColor: '#0f172a',
    borderRightWidth: 1,
    borderRightColor: '#1e293b',
    zIndex: 999,
    boxShadow: '10px 0 30px rgba(0, 0, 0, 0.8)'
  },
  mobileCloseDrawerBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#1e293b'
  },
  controlBarMobile: {
    flexDirection: 'column',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  mobileCardList: {
    flex: 1,
    padding: 12
  },
  mobileCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    marginBottom: 10,
    gap: 10
  },
  mobileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  mobileCardIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center'
  },
  mobileCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc'
  },
  mobileCardCategory: {
    fontSize: 11,
    color: '#94a3b8'
  },
  mobileCardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0b1120',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  mobileMetaItem: {
    alignItems: 'center'
  },
  mobileMetaLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 2
  },
  mobileMetaVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e2e8f0'
  },
  mobileCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4
  },
  mobileBtnView: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    paddingVertical: 8,
    borderRadius: 6
  },
  mobileBtnViewText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38bdf8'
  },
  mobileBtnDelete: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)'
  },

  // --- SYSTEM LIGHT MODE STYLES ---
  containerLight: {
    backgroundColor: '#f1f5f9'
  },
  mainContentLight: {
    backgroundColor: '#f1f5f9'
  },
  contentAreaLight: {
    backgroundColor: '#f8fafc'
  },
  sidebarLight: {
    backgroundColor: '#ffffff',
    borderRightColor: '#e2e8f0'
  },
  sidebarTitleRowLight: {
    borderBottomColor: '#e2e8f0'
  },
  sidebarSectionTitleLight: {
    color: '#64748b'
  },
  sidebarCollapseBtnLight: {
    backgroundColor: '#f1f5f9'
  },
  treeItemActiveLight: {
    backgroundColor: '#e0f2fe'
  },
  treeCategoryTitleLight: {
    color: '#0f172a'
  },
  treeTextLight: {
    color: '#334155'
  },
  treeTextActiveLight: {
    color: '#0284c7'
  },
  sidebarAdminBoxLight: {
    backgroundColor: '#f8fafc',
    borderTopColor: '#e2e8f0'
  },
  adminNameTextLight: {
    color: '#0f172a'
  },
  adminEmailTextLight: {
    color: '#64748b'
  },
  adminBadgePillLight: {
    backgroundColor: '#e0f2fe',
    borderColor: '#bae6fd'
  },
  adminBadgePillTextLight: {
    color: '#0284c7'
  },
  controlBarLight: {
    backgroundColor: '#ffffff',
    borderBottomColor: '#e2e8f0'
  },
  breadcrumbItemLight: {
    color: '#64748b'
  },
  breadcrumbActiveLight: {
    color: '#0f172a'
  },
  searchBoxLight: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1'
  },
  searchInputLight: {
    color: '#0f172a'
  },
  themeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    cursor: 'pointer'
  },
  themeToggleBtnLight: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1'
  },
  themeToggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f59e0b'
  },
  themeToggleBtnTextLight: {
    color: '#6366f1'
  },
  allFilesToggleBtnLight: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1'
  },
  allFilesToggleBtnTextLight: {
    color: '#475569'
  },
  allFilesToggleBtnActiveLight: {
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    borderColor: 'rgba(2, 132, 199, 0.4)'
  },
  allFilesToggleBtnTextActiveLight: {
    color: '#0284c7'
  },
  cachePillLight: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1'
  },
  cachePillTextLight: {
    color: '#475569'
  },
  countBadgeLight: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1'
  },
  countBadgeTextLight: {
    color: '#475569'
  },
  tableRowHeaderLight: {
    backgroundColor: '#e2e8f0'
  },
  thLight: {
    color: '#475569'
  },
  tableRowLight: {
    backgroundColor: '#ffffff',
    borderBottomColor: '#e2e8f0'
  },
  tableRowAltLight: {
    backgroundColor: '#f8fafc'
  },
  tdLight: {
    color: '#1e293b'
  },
  burgerToggleBtnLight: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1'
  },
  btnTableActionLight: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  statusTagLight: {
    borderColor: 'transparent'
  },
  mobileTopBarLight: {
    backgroundColor: '#ffffff',
    borderBottomColor: '#e2e8f0'
  },
  mobileAppTitleLight: {
    color: '#0f172a'
  },
  mobileAppSubLight: {
    color: '#64748b'
  },
  mobileThemeBtn: {
    padding: 7,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  mobileThemeBtnLight: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1'
  },
  mobileSidebarDrawerLight: {
    backgroundColor: '#ffffff',
    borderRightColor: '#e2e8f0'
  },
  mobileCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0'
  },
  mobileCardTitleLight: {
    color: '#0f172a'
  },
  mobileCardCategoryLight: {
    color: '#64748b'
  },
  mobileCardMetaLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0'
  },
  mobileMetaLabelLight: {
    color: '#64748b'
  },
  mobileMetaValLight: {
    color: '#0f172a'
  },
  mobileBtnViewLight: {
    backgroundColor: '#f1f5f9'
  },
  modalDialogLight: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1'
  },
  modalHeaderLight: {
    backgroundColor: '#ffffff',
    borderBottomColor: '#e2e8f0'
  },
  viewerHeaderLight: {
    backgroundColor: '#ffffff',
    borderBottomColor: '#e2e8f0'
  },
  modalTitleLight: {
    color: '#0f172a'
  },
  modalCloseBtnLight: {
    backgroundColor: '#f1f5f9'
  },
  modalBodyLight: {
    backgroundColor: '#ffffff'
  },
  modalFooterLight: {
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc'
  },
  viewerCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0'
  },
  viewerTitleLight: {
    color: '#0f172a'
  },
  viewerSubtitleLight: {
    color: '#64748b'
  },
  viewerSectionLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0'
  },
  viewerSectionTitleLight: {
    color: '#334155'
  },
  viewerFieldLabelLight: {
    color: '#64748b'
  },
  viewerFieldValueLight: {
    color: '#0f172a'
  },
  notesBoxLight: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0'
  },
  notesTextLight: {
    color: '#334155'
  },
  formInputLight: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    color: '#0f172a'
  },
  formLabelLight: {
    color: '#334155'
  },
  authCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0'
  },
  authTitleLight: {
    color: '#0f172a'
  },
  authSubtitleLight: {
    color: '#64748b'
  },
  formModalContainerLight: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1'
  },
  viewerModalContainerLight: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1'
  },
  optionCardLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0'
  },
  optionTitleLight: {
    color: '#0f172a'
  },
  optionSubtitleLight: {
    color: '#64748b'
  },
  optionDescriptionLight: {
    color: '#475569'
  },
  receiptTypeCardLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0'
  },
  receiptTypeCardActiveLight: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981'
  },
  receiptTypeNameLight: {
    color: '#0f172a'
  },
  receiptTypeDescLight: {
    color: '#64748b'
  },
  receiptEntityBadgeLight: {
    backgroundColor: '#e2e8f0'
  },
  receiptEntityBadgeTextLight: {
    color: '#334155'
  },
  ocrVerificationContainerLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1'
  },
  ocrPreviewRowLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0'
  },
  ocrFieldInputLight: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    color: '#0f172a'
  },
  ocrFieldLabelLight: {
    color: '#334155'
  },
  ocrVerificationTitleLight: {
    color: '#0f172a'
  },
  ocrErrorCardLight: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5'
  },
  btnRetakeOcrLight: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1'
  },
  btnRetakeOcrTextLight: {
    color: '#334155'
  },

  // Rename Modal Styles
  renameModalContainer: {
    width: '90%',
    maxWidth: 480,
    backgroundColor: isLight ? '#ffffff' : '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: isLight ? '#cbd5e1' : '#334155',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
  },
  renameModalContainerLight: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1'
  },
  renameModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: isLight ? '#ffffff' : '#131d31',
    borderBottomWidth: 1,
    borderBottomColor: isLight ? '#e2e8f0' : '#1e293b'
  },
  renameIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isLight ? '#bae6fd' : 'rgba(56, 189, 248, 0.25)'
  },
  renameModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: isLight ? '#0f172a' : '#f8fafc'
  },
  renameModalTitleLight: {
    color: '#0f172a'
  },
  renameModalSubtitle: {
    fontSize: 12,
    color: isLight ? '#64748b' : '#94a3b8',
    marginTop: 2
  },
  renameModalBody: {
    padding: 20,
    backgroundColor: isLight ? '#ffffff' : '#0f172a'
  },
  renameFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: isLight ? '#64748b' : '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 8
  },
  renameFieldLabelLight: {
    color: '#475569'
  },
  renameInput: {
    backgroundColor: isLight ? '#f8fafc' : '#1e293b',
    borderWidth: 1,
    borderColor: isLight ? '#cbd5e1' : '#334155',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
    color: isLight ? '#0f172a' : '#f8fafc'
  },
  renameInputLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    color: '#0f172a'
  },
  renameHint: {
    fontSize: 11,
    color: isLight ? '#94a3b8' : '#64748b',
    marginTop: 8
  },
  renameModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: isLight ? '#f8fafc' : '#131d31',
    borderTopWidth: 1,
    borderTopColor: isLight ? '#e2e8f0' : '#1e293b'
  }
  });
}
