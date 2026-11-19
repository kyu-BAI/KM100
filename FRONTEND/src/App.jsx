import { RECEIPT_TYPES } from './constants/receiptTypes';
import { EMPLOYEE_ROLES, EMPLOYEE_DEPARTMENTS, DEFAULT_DEMO_EMPLOYEE } from './constants/employeeConfig';
import { SHORT_MONTHS as months } from './constants/calendar';
import { createStyles } from './styles/themeStyles';
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
  Image,
  useWindowDimensions
} from 'react-native';
import {
  UserCheck,
  Briefcase,
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

  // Seed default Knoah Mari demo employee if empty or missing
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('petc_employee_accounts') || '[]');
      const hasKnoah = saved.some(e => e.email.toLowerCase() === 'knoahmari@km100.ph');
      if (!hasKnoah) {
        const demoEmp = {
          id: 'emp-demo-knoahmari',
          fullName: 'Maria Santos (Staff)',
          email: 'knoahmari@km100.ph',
          password: 'knoahmari123',
          role: 'Staff / Data Encoder',
          department: 'Knoah Mari',
          createdAt: new Date().toISOString(),
          active: true
        };
        saved.push(demoEmp);
        localStorage.setItem('petc_employee_accounts', JSON.stringify(saved));
      }
    } catch (e) {
      console.warn('Seed employee note:', e);
    }
  }, []);

  // Current logged in user (Admin or Employee)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('petc_admin_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      // Strictly enforce: ONLY accounts with role === 'admin' and NO branch department have admin privileges
      const isActuallyAdmin = parsed.role === 'admin' && parsed.isAdmin !== false && !parsed.department;
      if (!isActuallyAdmin) {
        return {
          ...parsed,
          role: 'employee',
          isAdmin: false,
          employeeRole: parsed.employeeRole || (parsed.role !== 'employee' && parsed.role !== 'admin' ? parsed.role : 'Staff')
        };
      }
      return parsed;
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
        // Direct Employee login verification from provisioned accounts
        const savedEmps = (() => {
          try {
            return JSON.parse(localStorage.getItem('petc_employee_accounts') || '[]');
          } catch { return []; }
        })();
        const matchedEmp = savedEmps.find(
          e => e.email.toLowerCase() === authEmail.trim().toLowerCase() && e.password === authPassword
        );
        if (matchedEmp) {
          const user = {
            id: matchedEmp.id,
            email: matchedEmp.email,
            fullName: matchedEmp.fullName,
            role: 'employee',
            employeeRole: matchedEmp.role || 'Staff',
            department: matchedEmp.department || 'Knoah Mari',
            assignedBranch: matchedEmp.department || 'Knoah Mari',
            isAdmin: false
          };
          localStorage.setItem('petc_admin_user', JSON.stringify(user));
          setCurrentUser(user);
          setCurrentPage('inventory');
          showNotice(`Authenticated as ${user.fullName} (${user.employeeRole} - ${user.department})`);
          fetchData();
          return;
        }

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

        const matchedEmpRecord = savedEmps.find(e => e.email.toLowerCase() === authEmail.trim().toLowerCase());
        const isEmployeeLogin = authPortal === 'employee' || !!matchedEmpRecord || data.user.user_metadata?.role === 'employee' || data.user.user_metadata?.is_admin === false;

        const user = {
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.user_metadata?.full_name || matchedEmpRecord?.fullName || (isEmployeeLogin ? 'Staff Member' : 'Administrator'),
          role: isEmployeeLogin ? 'employee' : 'admin',
          employeeRole: data.user.user_metadata?.employee_role || matchedEmpRecord?.role || 'Staff / Data Encoder',
          department: data.user.user_metadata?.department || matchedEmpRecord?.department || (isEmployeeLogin ? 'Knoah Mari' : null),
          assignedBranch: data.user.user_metadata?.department || matchedEmpRecord?.department || (isEmployeeLogin ? 'Knoah Mari' : null),
          isAdmin: !isEmployeeLogin
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
    setCurrentPage('inventory');
    setAuthEmail('');
    setAuthPassword('');
    setAuthConfirmPassword('');
    showNotice('You have been signed out.');
  };

  // Current active main view / page: 'inventory' | 'admin'
  const [currentPage, setCurrentPage] = useState('inventory');

  // Route & Portal state: 'admin' | 'employee'
  const [authPortal, setAuthPortal] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      if (hash.includes('employee') || search.includes('employee') || path.includes('/employee')) {
        return 'employee';
      }
    }
    return 'admin';
  });

  const switchAuthPortal = (portal) => {
    setAuthPortal(portal);
    setAuthError('');
    if (typeof window !== 'undefined') {
      window.location.hash = portal === 'employee' ? 'employee' : 'admin';
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('employee')) {
        setAuthPortal('employee');
      } else if (hash.includes('admin')) {
        setAuthPortal('admin');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Employee Profile Modal state for logged-in employees
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);

  useEffect(() => {
    // If not an admin, ALWAYS force page to 'inventory'
    const isUserAdmin = currentUser?.role === 'admin' && currentUser?.isAdmin !== false && !currentUser?.department;
    if (!isUserAdmin && currentPage === 'admin') {
      setCurrentPage('inventory');
    }
  }, [currentUser, currentPage]);

  // Employee Accounts Directory & Creation State
  const [employees, setEmployees] = useState(() => {
    try {
      const raw = localStorage.getItem('petc_employee_accounts');
      if (raw) return JSON.parse(raw);
    } catch { }
    return [
      {
        id: 'emp-101',
        fullName: 'Maria Santos',
        email: 'maria.santos@km100.ph',
        password: 'password123',
        role: 'Staff / Data Encoder',
        department: 'PETC Sales & Income',
        createdAt: '2026-11-15',
        status: 'Active'
      },
      {
        id: 'emp-102',
        fullName: 'Carlos Reyes',
        email: 'carlos.reyes@km100.ph',
        password: 'password123',
        role: 'Cashier & Billing',
        department: 'Expenses (Knoah Mari / Red Goose)',
        createdAt: '2026-11-16',
        status: 'Active'
      },
      {
        id: 'emp-103',
        fullName: 'Ana Lim',
        email: 'ana.lim@km100.ph',
        password: 'password123',
        role: 'Inventory Auditor',
        department: 'Consumables & Office Supplies',
        createdAt: '2026-11-17',
        status: 'Active'
      }
    ];
  });

  const [empFullName, setEmpFullName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [empConfirmPassword, setEmpConfirmPassword] = useState('');
  const [empRole, setEmpRole] = useState('Staff / Data Encoder');
  const [empDepartment, setEmpDepartment] = useState('All Branches & Categories');
  const [showEmpPassword, setShowEmpPassword] = useState(false);
  const [empLoading, setEmpLoading] = useState(false);
  const [empError, setEmpError] = useState('');



  // Employee Account Creation Handler
  const handleCreateEmployee = async () => {
    setEmpError('');
    if (!empFullName.trim()) {
      setEmpError('Please enter the employee full name.');
      return;
    }
    if (!empEmail.trim() || !empEmail.includes('@')) {
      setEmpError('Please enter a valid email address.');
      return;
    }
    if (!empPassword || empPassword.length < 6) {
      setEmpError('Initial password must be at least 6 characters.');
      return;
    }
    if (empPassword !== empConfirmPassword) {
      setEmpError('Passwords do not match.');
      return;
    }

    setEmpLoading(true);
    try {
      let authUserId = null;
      try {
        const { data: authData } = await supabase.auth.signUp({
          email: empEmail.trim(),
          password: empPassword,
          options: {
            data: {
              full_name: empFullName.trim(),
              role: 'employee',
              employee_role: empRole,
              department: empDepartment,
              is_admin: false,
              created_by: currentUser?.email || 'admin'
            }
          }
        });
        if (authData && authData.user) {
          authUserId = authData.user.id;
        }
      } catch (authEx) {
        console.warn('Supabase Auth signUp note:', authEx);
      }

      const newEmp = {
        id: authUserId || 'emp-' + Date.now(),
        fullName: empFullName.trim(),
        email: empEmail.trim(),
        password: empPassword,
        role: empRole,
        department: empDepartment,
        createdAt: new Date().toISOString().split('T')[0],
        status: 'Active'
      };

      const updated = [newEmp, ...employees.filter(e => e.email.toLowerCase() !== newEmp.email.toLowerCase())];
      setEmployees(updated);
      try {
        localStorage.setItem('petc_employee_accounts', JSON.stringify(updated));
      } catch { }

      setEmpFullName('');
      setEmpEmail('');
      setEmpPassword('');
      setEmpConfirmPassword('');
      showNotice(`Employee account successfully created for ${newEmp.fullName}!`);
    } catch (err) {
      setEmpError(err.message || 'Failed to create employee account.');
    } finally {
      setEmpLoading(false);
    }
  };

  const handleDeleteEmployee = (id, name) => {
    if (window.confirm(`Are you sure you want to deactivate and remove employee account for "${name}"?`)) {
      const updated = employees.filter(e => e.id !== id);
      setEmployees(updated);
      try {
        localStorage.setItem('petc_employee_accounts', JSON.stringify(updated));
      } catch { }
      showNotice(`Employee account for "${name}" removed.`);
    }
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

  // Absolute Admin vs Employee Role & Store Access Control
  const isAdmin = currentUser?.role === 'admin' && currentUser?.isAdmin !== false && !currentUser?.department;
  const isEmployee = !isAdmin && !!currentUser;
  const userDept = (currentUser?.department || currentUser?.assignedBranch || '').toLowerCase();

  const isKnoahEmployee = isEmployee && (userDept.includes('knoah') || userDept === 'knoah mari');
  const isRedGooseEmployee = isEmployee && (userDept.includes('red-goose') || userDept.includes('red goose') || (userDept.includes('red') && !userDept.includes('all')));
  const isPetcEmployee = isEmployee && userDept.includes('petc') && !userDept.includes('all') && !userDept.includes('sales') && !userDept.includes('income');
  const isConsumablesEmployee = isEmployee && (userDept.includes('consumable') || userDept.includes('supplies') || userDept.includes('office'));
  const isSalesIncomeEmployee = isEmployee && (userDept.includes('sales') || userDept.includes('income'));

  // Filter items strictly based on the left sidebar navigation and employee branch scope
  const filteredItems = useMemo(() => {
    // If viewing All Inventory Files and the user has toggled off displaying all files
    if (activeNav.type === 'all' && !showAllFiles) {
      return [];
    }

    return items.filter(item => {
      // 0. STRICT EMPLOYEE STORE & DEPARTMENT ACCESS RESTRICTION
      if (isKnoahEmployee) {
        const itemEntity = (item.entity || '').toLowerCase();
        const itemSub = (item.subCategory || '').toLowerCase();
        const itemTitle = (item.title || item.fileName || '').toLowerCase();
        const isKnoah = itemEntity.includes('knoah') || itemSub.includes('knoah') || itemTitle.includes('knoah');
        if (!isKnoah) return false;
      } else if (isRedGooseEmployee) {
        const itemEntity = (item.entity || '').toLowerCase();
        const itemSub = (item.subCategory || '').toLowerCase();
        const itemTitle = (item.title || item.fileName || '').toLowerCase();
        const isRg = itemEntity.includes('red') || itemSub.includes('red') || itemTitle.includes('red');
        if (!isRg) return false;
      } else if (isPetcEmployee) {
        const itemEntity = (item.entity || '').toLowerCase();
        const itemSub = (item.subCategory || '').toLowerCase();
        const itemTitle = (item.title || item.fileName || '').toLowerCase();
        const isPetc = itemEntity.includes('petc') || itemSub.includes('petc') || itemTitle.includes('petc');
        if (!isPetc) return false;
      } else if (isConsumablesEmployee) {
        const itemCat = (item.category || item.categoryId || '').toLowerCase();
        if (!itemCat.includes('consumable')) return false;
      } else if (isSalesIncomeEmployee) {
        const itemCat = (item.category || item.categoryId || '').toLowerCase();
        if (!itemCat.includes('sale') && !itemCat.includes('income') && !itemCat.includes('emission')) return false;
      }
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
        ['KM100 SKILLS & TRAINING CENTER, INC. - ' + folderLabel.toUpperCase() + ' AUDIT REPORT'],
        ['COMPANY: KM100 SKILLS AND TRAINING CENTER, INC.   |   FOLDER: ' + folderLabel + '   |   EXPORT DATE: ' + dateStr + ' ' + timeStr + '   |   AUDIT STATUS: OFFICIAL VERIFIED INVENTORY'],
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
        '', '', '', '', '', '', '', '', 'TOTAL SUM (PHP):', totalAmount, '', ''
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

    if (isKnoahEmployee) {
      const match = RECEIPT_TYPES.find(r => r.id === 'expenses-knoah-mari');
      if (match) { setSelectedReceiptType(match); return; }
    }
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


  // ----------------------------------------------------
  // LOGIN / CREATE ADMIN ACCOUNT VIEW (If not logged in)
  // ----------------------------------------------------
  if (!currentUser) {
    const isEmployeePortal = authPortal === 'employee';

    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: isLight ? '#f1f5f9' : '#0b1120' }}
        contentContainerStyle={[styles.authContainer, isMobile && { padding: 12 }, { flexGrow: 1, position: 'relative' }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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
          {/* Top Brand Logo */}
          <View style={styles.authHeader}>
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <View style={{
                width: 76,
                height: 76,
                borderRadius: 38,
                backgroundColor: '#ffffff',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isEmployeePortal ? '0 8px 24px rgba(16, 185, 129, 0.28)' : '0 8px 24px rgba(249, 115, 22, 0.28)',
                borderWidth: 2.5,
                borderColor: isEmployeePortal ? '#10b981' : '#f97316',
                padding: 3
              }}>
                <Image
                  source={{ uri: '/km100-logo.png' }}
                  style={{ width: '100%', height: '100%', borderRadius: 34 }}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Portal Badge */}
            <View style={[
              styles.authBadgePill,
              isEmployeePortal && { backgroundColor: isLight ? '#dcfce7' : 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981' }
            ]}>
              <Text style={[
                styles.authBadgePillText,
                isEmployeePortal && { color: isLight ? '#047857' : '#34d399' }
              ]}>
                {isEmployeePortal ? 'STAFF & EMPLOYEE PORTAL' : 'OFFICIAL ADMINISTRATOR PORTAL'}
              </Text>
            </View>

            <Text style={[styles.authTitle, isLight && styles.authTitleLight]}>
              KM100 Skills & Training Center
            </Text>

            <Text style={[styles.authSubtitle, isLight && styles.authSubtitleLight]}>
              {isEmployeePortal
                ? 'Sign in with your employee account to view assigned branch records.'
                : authMode === 'login'
                  ? 'Sign in with your Administrator credentials to access full system records.'
                  : 'Register a new Administrator account with full system privileges.'}
            </Text>
          </View>

          {/* Portal Switcher Tabs: Admin Portal vs Employee Portal */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: isLight ? '#e2e8f0' : '#1e293b',
            borderRadius: 10,
            padding: 4,
            marginBottom: 16,
            gap: 4
          }}>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 9,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: !isEmployeePortal ? (isLight ? '#ffffff' : '#0f172a') : 'transparent',
                boxShadow: !isEmployeePortal ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
              }}
              onPress={() => switchAuthPortal('admin')}
            >
              <ShieldCheck size={14} color={!isEmployeePortal ? (isLight ? '#0284c7' : '#38bdf8') : '#94a3b8'} />
              <Text style={{
                fontSize: 12,
                fontWeight: '700',
                color: !isEmployeePortal ? (isLight ? '#0f172a' : '#f8fafc') : '#94a3b8'
              }}>
                Administrator
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 9,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: isEmployeePortal ? (isLight ? '#ffffff' : '#0f172a') : 'transparent',
                boxShadow: isEmployeePortal ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
              }}
              onPress={() => switchAuthPortal('employee')}
            >
              <UserCheck size={14} color={isEmployeePortal ? '#10b981' : '#94a3b8'} />
              <Text style={{
                fontSize: 12,
                fontWeight: '700',
                color: isEmployeePortal ? (isLight ? '#0f172a' : '#f8fafc') : '#94a3b8'
              }}>
                Employee Staff
              </Text>
            </TouchableOpacity>
          </View>

          {/* EMPLOYEE PORTAL SPECIFIC: Branch Access Notice & Demo Account Card */}
          {isEmployeePortal && (
            <View style={{ gap: 10, marginBottom: 16 }}>
              {/* Branch Restriction Notice */}
              <View style={{
                backgroundColor: isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.08)',
                borderWidth: 1,
                borderColor: isLight ? '#bbf7d0' : 'rgba(16, 185, 129, 0.25)',
                borderRadius: 10,
                padding: 12,
                gap: 4
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Building2 size={15} color="#10b981" />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: isLight ? '#15803d' : '#34d399' }}>
                    Branch-Restricted Scope
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: isLight ? '#166534' : '#a7f3d0', lineHeight: 16 }}>
                  Employee access is strictly limited to your designated branch (e.g. Knoah Mari). Records and folders outside your assigned scope remain private and protected.
                </Text>
              </View>

              {/* Knoah Mari Demo Auto-Fill Box */}
              <View style={{
                backgroundColor: isLight ? '#f8fafc' : '#0f172a',
                borderWidth: 1,
                borderColor: isLight ? '#e2e8f0' : '#1e293b',
                borderRadius: 10,
                padding: 10,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8
              }}>
                <View style={{ gap: 2 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: isLight ? '#334155' : '#e2e8f0' }}>
                    Demo Account: Knoah Mari Branch
                  </Text>
                  <Text style={{ fontSize: 10, color: isLight ? '#64748b' : '#94a3b8' }}>
                    knoahmari@km100.ph • knoahmari123
                  </Text>
                </View>
                <TouchableOpacity
                  style={{
                    backgroundColor: isLight ? '#10b981' : '#059669',
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 6
                  }}
                  onPress={() => {
                    setAuthEmail('knoahmari@km100.ph');
                    setAuthPassword('knoahmari123');
                    setAuthError('');
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#ffffff' }}>
                    Auto-Fill Credentials
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ADMIN PORTAL ONLY: Mode Switch Tabs (Sign In vs Create Admin) */}
          {!isEmployeePortal && (
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
          )}

          {/* Error Message Box */}
          {authError ? (
            <View style={styles.authErrorBox}>
              <AlertTriangle size={16} color="#ef4444" />
              <Text style={styles.authErrorText}>{authError}</Text>
            </View>
          ) : null}

          {/* Form Fields */}
          <View style={styles.authForm}>
            {/* Full Name field (Only in Admin registration mode) */}
            {!isEmployeePortal && authMode === 'register' && (
              <View style={styles.authInputGroup}>
                <Text style={[styles.authLabel, isLight && styles.authLabelLight]}>ADMIN FULL NAME</Text>
                <View style={[styles.authInputWrapper, isLight && styles.authInputWrapperLight]}>
                  <User size={16} color={isLight ? '#64748b' : '#94a3b8'} />
                  <TextInput
                    style={[styles.authInput, isLight && styles.authInputLight]}
                    placeholder="Enter your full name"
                    placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                    value={authFullName}
                    onChangeText={setAuthFullName}
                  />
                </View>
              </View>
            )}

            {/* Email Field */}
            <View style={styles.authInputGroup}>
              <Text style={[styles.authLabel, isLight && styles.authLabelLight]}>
                {isEmployeePortal ? 'EMPLOYEE EMAIL' : 'ADMIN EMAIL'}
              </Text>
              <View style={[styles.authInputWrapper, isLight && styles.authInputWrapperLight]}>
                <Mail size={16} color={isLight ? '#64748b' : '#94a3b8'} />
                <TextInput
                  style={[styles.authInput, isLight && styles.authInputLight]}
                  placeholder={isEmployeePortal ? 'knoahmari@km100.ph' : 'admin@km100.ph'}
                  placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={authEmail}
                  onChangeText={setAuthEmail}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.authInputGroup}>
              <Text style={[styles.authLabel, isLight && styles.authLabelLight]}>PASSWORD</Text>
              <View style={[styles.authInputWrapper, isLight && styles.authInputWrapperLight]}>
                <Lock size={16} color={isLight ? '#64748b' : '#94a3b8'} />
                <TextInput
                  style={[styles.authInput, isLight && styles.authInputLight, { paddingRight: 36 }]}
                  placeholder="Enter your password"
                  placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                  secureTextEntry={!showPassword}
                  value={authPassword}
                  onChangeText={setAuthPassword}
                />
                <TouchableOpacity
                  style={{ position: 'absolute', right: 10 }}
                  onPress={() => setShowPassword(p => !p)}
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password (Admin registration only) */}
            {!isEmployeePortal && authMode === 'register' && (
              <View style={styles.authInputGroup}>
                <Text style={[styles.authLabel, isLight && styles.authLabelLight]}>CONFIRM PASSWORD</Text>
                <View style={[styles.authInputWrapper, isLight && styles.authInputWrapperLight]}>
                  <Key size={16} color={isLight ? '#64748b' : '#94a3b8'} />
                  <TextInput
                    style={[styles.authInput, isLight && styles.authInputLight]}
                    placeholder="Re-enter password"
                    placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                    secureTextEntry={!showPassword}
                    value={authConfirmPassword}
                    onChangeText={setAuthConfirmPassword}
                  />
                </View>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.authSubmitBtn,
                isEmployeePortal && { backgroundColor: '#10b981' },
                authLoading && { opacity: 0.7 }
              ]}
              onPress={handleAuthSubmit}
              disabled={authLoading}
            >
              {authLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  {isEmployeePortal ? (
                    <UserCheck size={18} color="#ffffff" />
                  ) : authMode === 'login' ? (
                    <LogIn size={18} color="#ffffff" />
                  ) : (
                    <UserPlus size={18} color="#ffffff" />
                  )}
                  <Text style={styles.authSubmitBtnText}>
                    {isEmployeePortal
                      ? 'Sign In to Employee Portal'
                      : authMode === 'login'
                        ? 'Sign In as Administrator'
                        : 'Create Administrator Account'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Bottom Portal Switcher Link */}
            <View style={{ alignItems: 'center', marginTop: 14 }}>
              <TouchableOpacity
                onPress={() => switchAuthPortal(isEmployeePortal ? 'admin' : 'employee')}
                style={{ paddingVertical: 4 }}
              >
                <Text style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: isLight ? '#0284c7' : '#38bdf8',
                  textDecorationLine: 'underline'
                }}>
                  {isEmployeePortal
                    ? '← Are you an Administrator? Switch to Admin Portal'
                    : 'Branch Staff Member? Switch to Employee Portal →'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    );  }

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
            <Menu size={isSmallMobile ? 16 : 18} color={isLight ? '#0284c7' : '#38bdf8'} />
            {!isMobile && (
              <Text style={[styles.sidebarToggleBtnText, isLight && styles.sidebarToggleBtnTextLight]}>
                {sidebarOpen ? 'Hide' : 'Folders'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.brandContainer}>
            <View style={{
              width: isSmallMobile ? 30 : 36,
              height: isSmallMobile ? 30 : 36,
              borderRadius: isSmallMobile ? 15 : 18,
              backgroundColor: '#ffffff',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1.5,
              borderColor: '#f97316',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(249, 115, 22, 0.25)',
              flexShrink: 0
            }}>
              <Image
                source={{ uri: '/km100-logo.png' }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
              />
            </View>
            <View style={{ gap: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.brandTitle, isLight && styles.brandTitleLight]}>
                  KM100
                </Text>
                {width >= 620 && (
                  <View style={styles.brandBadge}>
                    <Text style={styles.brandBadgeText}>INVENTORY</Text>
                  </View>
                )}
              </View>
              {isDesktop && (
                <Text style={[styles.brandSub, isLight && styles.brandSubLight]} numberOfLines={1}>
                  Skills & Training Center, Inc. • Emission Testing Portal
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Center Search Bar on Desktop & Large Tablet */}
        {width >= 960 && (
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
              {width < 440 ? 'Scan' : 'Scan Receipt'}
            </Text>
          </TouchableOpacity>

          {/* SECONDARY ACTION: EXPORT EXCEL (Desktop & Tablet) */}
          {width >= 1180 && (
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
          {width >= 1280 && (
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

          {/* User Profile / Admin & Employee Session Management */}
          {currentUser && (
            <TouchableOpacity
              style={[
                styles.headerUserBlock,
                currentPage === 'admin' && {
                  borderColor: '#38bdf8',
                  backgroundColor: isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.15)',
                  boxShadow: '0 0 10px rgba(56, 189, 248, 0.35)'
                },
                isEmployee && {
                  borderColor: isLight ? '#a7f3d0' : '#065f46',
                  backgroundColor: isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.12)'
                },
                isSmallMobile && { marginLeft: 0 }
              ]}
              onPress={() => {
                if (isEmployee) {
                  setShowEmployeeModal(true);
                } else {
                  setCurrentPage(prev => (prev === 'admin' ? 'inventory' : 'admin'));
                }
              }}
              title={isEmployee ? "Click to view Employee Profile & Logout" : "Click to open Admin Portal, Logout & Employee Creation"}
              accessibilityLabel="User Profile Management"
            >
              <View style={[
                styles.headerUserAvatar,
                isEmployee && { backgroundColor: '#10b981' },
                isSmallMobile && { width: 26, height: 26 },
                isLight && !isEmployee && styles.headerUserAvatarLight
              ]}>
                <Text style={[styles.headerUserInitial, isSmallMobile && { fontSize: 11 }]}>
                  {(currentUser.fullName || currentUser.name || currentUser.email || 'A').charAt(0).toUpperCase()}
                </Text>
              </View>
              {!isSmallMobile && (
                <View style={{ gap: 1, paddingRight: 4 }}>
                  <Text style={[styles.headerUserName, isLight && styles.headerUserNameLight]} numberOfLines={1}>
                    {currentUser.fullName ? currentUser.fullName.split(' ')[0] : (isEmployee ? 'Staff' : 'Admin')}
                  </Text>
                  <Text style={[
                    styles.headerUserRole,
                    isEmployee && { color: isLight ? '#047857' : '#34d399', fontWeight: '800' },
                    isLight && !isEmployee && styles.headerUserRoleLight
                  ]}>
                    {isEmployee ? (currentUser.department ? `${currentUser.department.toUpperCase()} • STAFF` : 'STAFF') : (currentUser.role ? currentUser.role.toUpperCase() : 'ADMIN')}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
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
            {/* Top Company Branding Banner in Sidebar */}
            <View style={[styles.sidebarCompanyHeader, isLight && styles.sidebarCompanyHeaderLight]}>
              <View style={styles.sidebarLogoBox}>
                <Image
                  source={{ uri: '/km100-logo.png' }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                />
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
                <Text style={[styles.sidebarCompanyName, isLight && styles.sidebarCompanyNameLight]} numberOfLines={1}>
                  KM100 SKILLS & TRAINING
                </Text>
                <Text style={[styles.sidebarCompanySub, isLight && styles.sidebarCompanySubLight]} numberOfLines={1}>
                  Center, Inc. • Enterprise Portal
                </Text>
              </View>
              {isDrawerMode && (
                <TouchableOpacity
                  onPress={() => setSidebarOpen(false)}
                  style={[styles.sidebarCollapseBtn, isLight && styles.sidebarCollapseBtnLight]}
                  title="Close sidebar navigation"
                >
                  <X size={18} color={isLight ? '#475569' : '#94a3b8'} />
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.sidebarTitleRow, isLight && styles.sidebarTitleRowLight]}>
              <Text style={[styles.sidebarSectionTitle, isLight && styles.sidebarSectionTitleLight]}>DOCUMENT DIRECTORY</Text>
            </View>

            {/* Branch Scope Banner for Employees */}
            {isEmployee && (
              <View style={{
                backgroundColor: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.12)',
                borderWidth: 1,
                borderColor: '#10b981',
                borderRadius: 8,
                padding: 10,
                marginHorizontal: 12,
                marginTop: 6,
                marginBottom: 10,
                gap: 3
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Building2 size={14} color="#10b981" />
                  <Text style={{ fontSize: 11, fontWeight: '800', color: isLight ? '#047857' : '#34d399' }}>
                    BRANCH: {(currentUser.department || 'KNOAH MARI').toUpperCase()}
                  </Text>
                </View>
                <Text style={{ fontSize: 10, color: isLight ? '#065f46' : '#a7f3d0' }}>
                  Restricted to your assigned branch records.
                </Text>
              </View>
            )}

            <View style={{ display: 'none' }}>
              {!isDrawerMode && (
                <TouchableOpacity
                  onPress={() => setSidebarOpen(false)}
                  style={[styles.sidebarCollapseBtn, isLight && styles.sidebarCollapseBtnLight]}
                  title="Hide sidebar"
                >
                  <ChevronLeft size={16} color={isLight ? '#475569' : '#94a3b8'} />
                </TouchableOpacity>
              )}
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
              {(!isKnoahEmployee && !isRedGooseEmployee) && (
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

                            )}

              {/* 3. PETC INCOME */}
              {(!isKnoahEmployee && !isRedGooseEmployee) && (
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

                            )}

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
                    ]
                    .filter(branch => {
                      if (isKnoahEmployee) return branch.id === 'knoah-mari-2026';
                      if (isRedGooseEmployee) return branch.id === 'red-goose-2026';
                      return true;
                    })
                    .map(branch => (
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
              {(!isKnoahEmployee && !isRedGooseEmployee) && (
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

              )}

              {/* 7. PETC INSURANCE */}
              {(!isKnoahEmployee && !isRedGooseEmployee) && (
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
              )}
            </ScrollView>


          </View>
        )}

        {/* MAIN VIEWING AREA */}
        {currentPage === 'admin' && isAdmin ? (
          <ScrollView
            style={[styles.contentArea, isLight && styles.contentAreaLight]}
            contentContainerStyle={{ padding: isMobile ? 14 : 26, gap: 22, maxWidth: 1200, width: '100%', alignSelf: 'center' }}
            showsVerticalScrollIndicator={false}
          >
            {/* Top Navigation Bar of Admin Page */}
            <View style={[styles.adminPortalHeader, isLight && styles.adminPortalHeaderLight]}>
              <View style={{ gap: 4, flex: 1, minWidth: 260 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={24} color={isLight ? '#0284c7' : '#38bdf8'} />
                  <Text style={[styles.adminPortalTitle, isLight && styles.adminPortalTitleLight]}>
                    Administrator & Staff Management
                  </Text>
                </View>
                <Text style={[styles.adminPortalSub, isLight && styles.adminPortalSubLight]}>
                  Manage admin credentials, sign out securely, and register employee staff accounts.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.adminBackBtn, isLight && styles.adminBackBtnLight]}
                onPress={() => setCurrentPage('inventory')}
                title="Return to documents inventory"
              >
                <ArrowLeft size={16} color={isLight ? '#0284c7' : '#38bdf8'} />
                <Text style={[styles.adminBackBtnText, isLight && styles.adminBackBtnTextLight]}>
                  Back to Inventory Records
                </Text>
              </TouchableOpacity>
            </View>

            {/* Top Grid: Admin Account Info on Left + Employee Creation Form on Right */}
            <View style={[styles.adminGrid, isMobile && { flexDirection: 'column' }]}>
              {/* Card 1: Admin Profile & Secure Logout */}
              <View style={[styles.adminProfileCard, isLight && styles.adminProfileCardLight]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={styles.adminLargeAvatarCircle}>
                    <Text style={styles.adminLargeAvatarInitials}>
                      {(currentUser?.fullName || currentUser?.email || 'A').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                    <Text style={[styles.adminProfileName, isLight && styles.adminProfileNameLight]} numberOfLines={1}>
                      {currentUser?.fullName || 'System Administrator'}
                    </Text>
                    <Text style={[styles.adminProfileEmail, isLight && styles.adminProfileEmailLight]} numberOfLines={1}>
                      {currentUser?.email}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <View style={[styles.adminBadgePill, isLight && styles.adminBadgePillLight]}>
                        <Text style={[styles.adminBadgePillText, isLight && styles.adminBadgePillTextLight]}>
                          {currentUser?.role ? currentUser.role.toUpperCase() : 'ADMINISTRATOR'}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#10b981' }} />
                        <Text style={{ fontSize: 11, color: '#10b981', fontWeight: '700' }}>Active</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* System Privileges Box */}
                <View style={[styles.adminPrivilegesBox, isLight && styles.adminPrivilegesBoxLight]}>
                  <Text style={[styles.adminPrivilegesHeading, isLight && styles.adminPrivilegesHeadingLight]}>
                    ADMINISTRATOR PRIVILEGES
                  </Text>
                  <View style={{ gap: 8, marginTop: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 size={14} color="#10b981" />
                      <Text style={[styles.privilegeItemText, isLight && styles.privilegeItemTextLight]}>
                        Full Document CRUD & Supabase Sync
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 size={14} color="#10b981" />
                      <Text style={[styles.privilegeItemText, isLight && styles.privilegeItemTextLight]}>
                        Executive Excel (.xlsx) Audit Reports
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 size={14} color="#10b981" />
                      <Text style={[styles.privilegeItemText, isLight && styles.privilegeItemTextLight]}>
                        AI Optical Character Recognition (OCR)
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 size={14} color="#10b981" />
                      <Text style={[styles.privilegeItemText, isLight && styles.privilegeItemTextLight]}>
                        Staff Account Provisioning & Roles
                      </Text>
                    </View>
                  </View>
                </View>

                {/* The Secure Logout Option */}
                <View style={{ marginTop: 'auto', paddingTop: 14 }}>
                  <Text style={{ fontSize: 11, color: isLight ? '#94a3b8' : '#64748b', marginBottom: 8 }}>
                    Session Security:
                  </Text>
                  <TouchableOpacity
                    style={[styles.adminLogoutBtn, isLight && styles.adminLogoutBtnLight]}
                    onPress={handleLogout}
                    title="End your session and sign out"
                  >
                    <LogOut size={16} color="#ef4444" />
                    <Text style={styles.adminLogoutBtnText}>Log Out of Administrator Account</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Card 2: Employee Account Creation System */}
              <View style={[styles.employeeFormCard, isLight && styles.employeeFormCardLight]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 4 }}>
                  <View style={[styles.empIconBadge, { backgroundColor: isLight ? '#e0f2fe' : 'rgba(2, 132, 199, 0.15)' }]}>
                    <UserPlus size={20} color={isLight ? '#0284c7' : '#38bdf8'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, isLight && styles.cardTitleLight]}>
                      Register New Employee Account
                    </Text>
                    <Text style={[styles.cardSubtitle, isLight && styles.cardSubtitleLight]}>
                      Add credentials and assign access branches for staff members.
                    </Text>
                  </View>
                </View>

                {empError ? (
                  <View style={styles.authErrorBox}>
                    <AlertTriangle size={15} color="#ef4444" />
                    <Text style={styles.authErrorText}>{empError}</Text>
                  </View>
                ) : null}

                <View style={{ gap: 12 }}>
                  {/* Name Input */}
                  <View style={{ gap: 4 }}>
                    <Text style={[styles.formFieldLabel, isLight && styles.formFieldLabelLight]}>EMPLOYEE FULL NAME</Text>
                    <View style={[styles.formInputWrapper, isLight && styles.formInputWrapperLight]}>
                      <User size={15} color={isLight ? '#64748b' : '#94a3b8'} />
                      <TextInput
                        style={[styles.formFieldInput, isLight && styles.formFieldInputLight]}
                        placeholder="e.g. Maria Santos"
                        placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                        value={empFullName}
                        onChangeText={setEmpFullName}
                      />
                    </View>
                  </View>

                  {/* Email Input */}
                  <View style={{ gap: 4 }}>
                    <Text style={[styles.formFieldLabel, isLight && styles.formFieldLabelLight]}>EMPLOYEE EMAIL ADDRESS</Text>
                    <View style={[styles.formInputWrapper, isLight && styles.formInputWrapperLight]}>
                      <Mail size={15} color={isLight ? '#64748b' : '#94a3b8'} />
                      <TextInput
                        style={[styles.formFieldInput, isLight && styles.formFieldInputLight]}
                        placeholder="employee@km100.ph"
                        placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={empEmail}
                        onChangeText={setEmpEmail}
                      />
                    </View>
                  </View>

                  {/* Password & Confirm Inputs */}
                  <View style={[styles.passwordGridRow, isMobile && { flexDirection: 'column', gap: 10 }]}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={[styles.formFieldLabel, isLight && styles.formFieldLabelLight]}>INITIAL PASSWORD</Text>
                      <View style={[styles.formInputWrapper, isLight && styles.formInputWrapperLight]}>
                        <Lock size={15} color={isLight ? '#64748b' : '#94a3b8'} />
                        <TextInput
                          style={[styles.formFieldInput, isLight && styles.formFieldInputLight, { paddingRight: 32 }]}
                          placeholder="Min. 6 chars"
                          placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                          secureTextEntry={!showEmpPassword}
                          value={empPassword}
                          onChangeText={setEmpPassword}
                        />
                        <TouchableOpacity
                          style={{ position: 'absolute', right: 8 }}
                          onPress={() => setShowEmpPassword(p => !p)}
                        >
                          {showEmpPassword ? <EyeOff size={14} color="#94a3b8" /> : <Eye size={14} color="#94a3b8" />}
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={[styles.formFieldLabel, isLight && styles.formFieldLabelLight]}>CONFIRM PASSWORD</Text>
                      <View style={[styles.formInputWrapper, isLight && styles.formInputWrapperLight]}>
                        <Lock size={15} color={isLight ? '#64748b' : '#94a3b8'} />
                        <TextInput
                          style={[styles.formFieldInput, isLight && styles.formFieldInputLight]}
                          placeholder="Re-enter password"
                          placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                          secureTextEntry={!showEmpPassword}
                          value={empConfirmPassword}
                          onChangeText={setEmpConfirmPassword}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Role Selector */}
                  <View style={{ gap: 6 }}>
                    <Text style={[styles.formFieldLabel, isLight && styles.formFieldLabelLight]}>ASSIGNED ROLE</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {EMPLOYEE_ROLES.map(role => (
                        <TouchableOpacity
                          key={role}
                          style={[
                            styles.empRoleChip,
                            isLight && styles.empRoleChipLight,
                            empRole === role && styles.empRoleChipActive
                          ]}
                          onPress={() => setEmpRole(role)}
                        >
                          <Text style={[
                            styles.empRoleChipText,
                            isLight && styles.empRoleChipTextLight,
                            empRole === role && styles.empRoleChipTextActive
                          ]}>
                            {role}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Department Assignment */}
                  <View style={{ gap: 6 }}>
                    <Text style={[styles.formFieldLabel, isLight && styles.formFieldLabelLight]}>ASSIGNED BRANCH / DEPARTMENT</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {EMPLOYEE_DEPARTMENTS.map(dept => (
                        <TouchableOpacity
                          key={dept}
                          style={[
                            styles.empRoleChip,
                            isLight && styles.empRoleChipLight,
                            empDepartment === dept && styles.empRoleChipActive
                          ]}
                          onPress={() => setEmpDepartment(dept)}
                        >
                          <Text style={[
                            styles.empRoleChipText,
                            isLight && styles.empRoleChipTextLight,
                            empDepartment === dept && styles.empRoleChipTextActive
                          ]}>
                            {dept}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[styles.btnCreateEmployee, empLoading && { opacity: 0.6 }]}
                    onPress={handleCreateEmployee}
                    disabled={empLoading}
                  >
                    {empLoading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <UserPlus size={16} color="#ffffff" />
                        <Text style={styles.btnCreateEmployeeText}>Create Employee Account</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Bottom Card: Registered Employee Accounts Directory */}
            <View style={[styles.accountsListCard, isLight && styles.accountsListCardLight]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <View style={{ gap: 2 }}>
                  <Text style={[styles.cardTitle, isLight && styles.cardTitleLight]}>
                    Employee Staff Directory ({employees.length})
                  </Text>
                  <Text style={[styles.cardSubtitle, isLight && styles.cardSubtitleLight]}>
                    Active staff members with granted portal access credentials.
                  </Text>
                </View>
              </View>

              <View style={{ gap: 8, marginTop: 4 }}>
                {employees.map(emp => (
                  <View key={emp.id} style={[styles.employeeRowCard, isLight && styles.employeeRowCardLight]}>
                    <View style={styles.empAvatarCircle}>
                      <Text style={styles.empAvatarInitials}>
                        {emp.fullName ? emp.fullName.charAt(0).toUpperCase() : 'E'}
                      </Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 150, gap: 2 }}>
                      <Text style={[styles.empNameText, isLight && styles.empNameTextLight]}>
                        {emp.fullName}
                      </Text>
                      <Text style={[styles.empEmailText, isLight && styles.empEmailTextLight]}>
                        {emp.email}
                      </Text>
                    </View>

                    <View style={{ gap: 3, minWidth: 140 }}>
                      <View style={[styles.empRoleBadge, isLight && styles.empRoleBadgeLight]}>
                        <Text style={[styles.empRoleBadgeText, isLight && styles.empRoleBadgeTextLight]}>
                          {emp.role}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 10, color: isLight ? '#64748b' : '#94a3b8' }}>
                        {emp.department}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' }} />
                        <Text style={{ fontSize: 11, color: '#10b981', fontWeight: '700' }}>Active</Text>
                      </View>
                      <Text style={{ fontSize: 10, color: isLight ? '#94a3b8' : '#64748b' }}>
                        Joined {emp.createdAt}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.empDeleteBtn}
                      onPress={() => handleDeleteEmployee(emp.id, emp.fullName)}
                      title={`Revoke account for ${emp.fullName}`}
                    >
                      <Trash2 size={14} color="#f87171" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        ) : (
          <View style={[styles.contentArea, isLight && styles.contentAreaLight]}>

          {/* 4. CLEAN SEARCH & FILTER ACTION BAR */}
          <View style={[styles.controlBar, isMobile && styles.controlBarMobile, isLight && styles.controlBarLight]}>
            <View style={[styles.controlBarLeft, isMobile && { width: '100%', justifyContent: 'space-between', gap: 8 }]}>
              <View style={[styles.breadcrumbs, { flex: 1, minWidth: 0 }]}>
                <Text style={[styles.breadcrumbItem, isLight && styles.breadcrumbItemLight]}>Records</Text>
                <ChevronRight size={14} color={isLight ? '#94a3b8' : '#64748b'} />
                <Text style={[styles.breadcrumbActive, isLight && styles.breadcrumbActiveLight]} numberOfLines={1}>{activeNav.label}</Text>
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
                  <Text style={[styles.clearFilterBtnText, isLight && styles.clearFilterBtnTextLight]}>Reset</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.controlBarRight, isMobile && { width: '100%', flexDirection: 'column', gap: 8, alignItems: 'stretch' }]}>
              {/* Search input for screens < 960px where it is not in the top header */}
              {width < 960 && (
                <View style={[styles.searchBox, { width: '100%' }, isLight && styles.searchBoxLight]}>
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

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: isMobile ? 'space-between' : 'flex-end', width: isMobile ? '100%' : 'auto', flexWrap: 'wrap' }}>
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
            /* TABLE LIST VIEW - FULL WIDTH WITH PROPER RESPONSIVE SCROLLING */
            <ScrollView style={styles.tableVertical} showsVerticalScrollIndicator={true}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ minWidth: '100%' }}>
                <View style={styles.table}>
                  <View style={[styles.tableRowHeader, isLight && styles.tableRowHeaderLight]}>
                    <Text style={[styles.th, { width: 45, textAlign: 'center' }, isLight && styles.thLight]}>#</Text>
                    <Text style={[styles.th, { flex: 2.2, minWidth: 220 }, isLight && styles.thLight]}>FILE NAME</Text>
                    <Text style={[styles.th, { flex: 1.2, minWidth: 140 }, isLight && styles.thLight]}>CATEGORY</Text>
                    <Text style={[styles.th, { flex: 1, minWidth: 110 }, isLight && styles.thLight]}>ENTITY</Text>
                    <Text style={[styles.th, { width: 120 }, isLight && styles.thLight]}>PERIOD / DATE</Text>
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
                      <Text style={[styles.td, { width: 45, textAlign: 'center', color: '#64748b' }]}>{idx + 1}</Text>
                      <View style={{ flex: 2.2, minWidth: 220, flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 12 }}>
                        {item.fileFormat === 'XLSX' ? <FileSpreadsheet size={16} color="#34d399" /> : <FileText size={16} color={isLight ? '#0284c7' : '#38bdf8'} />}
                        <Text style={[styles.td, { fontWeight: '600', color: isLight ? '#0f172a' : '#f8fafc', flex: 1 }]} numberOfLines={1}>
                          {item.fileName}
                        </Text>
                      </View>
                      <Text style={[styles.td, { flex: 1.2, minWidth: 140, paddingRight: 8 }, isLight && styles.tdLight]} numberOfLines={1}>{item.category}</Text>
                      <Text style={[styles.td, { flex: 1, minWidth: 110, paddingRight: 8 }, isLight && styles.tdLight]} numberOfLines={1}>{item.entity}</Text>
                      <Text style={[styles.td, { width: 120 }, isLight && styles.tdLight]}>
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
        )}
      </View>

      {/* EMPLOYEE STAFF PROFILE & LOGOUT MODAL */}
      <Modal
        visible={showEmployeeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEmployeeModal(false)}
      >
        <View style={[styles.modalOverlay, isMobile && styles.modalOverlayMobile]}>
          <View style={[
            styles.modalCard,
            {
              maxWidth: 440,
              width: '92%',
              padding: 24,
              borderRadius: 18,
              backgroundColor: isLight ? '#ffffff' : '#0f172a',
              borderColor: isLight ? '#e2e8f0' : '#1e293b',
              borderWidth: 1,
              boxShadow: isLight
                ? '0 25px 60px rgba(0, 0, 0, 0.22), 0 4px 16px rgba(0, 0, 0, 0.08)'
                : '0 25px 60px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            },
            isLight && styles.modalCardLight
          ]}>
            {/* Modal Header */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: isLight ? '#e2e8f0' : '#1e293b'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: isLight ? '#dcfce7' : 'rgba(16, 185, 129, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <UserCheck size={18} color="#10b981" />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '800', color: isLight ? '#0f172a' : '#f8fafc' }}>
                  Employee Staff Session
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowEmployeeModal(false)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isLight ? '#f1f5f9' : '#1e293b'
                }}
              >
                <X size={16} color={isLight ? '#475569' : '#94a3b8'} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 16, paddingTop: 18 }}>
              {/* Profile Card */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{
                  width: 54,
                  height: 54,
                  borderRadius: 27,
                  backgroundColor: '#10b981',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                  flexShrink: 0
                }}>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: '#ffffff' }}>
                    {(currentUser?.fullName || 'E').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: isLight ? '#0f172a' : '#f8fafc' }} numberOfLines={1}>
                    {currentUser?.fullName}
                  </Text>
                  <Text style={{ fontSize: 13, color: isLight ? '#475569' : '#94a3b8', fontWeight: '500' }} numberOfLines={1}>
                    {currentUser?.email}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <View style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                      backgroundColor: isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.15)',
                      borderWidth: 1,
                      borderColor: isLight ? '#bae6fd' : 'rgba(56, 189, 248, 0.3)'
                    }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: isLight ? '#0284c7' : '#38bdf8' }}>
                        {currentUser?.employeeRole || 'STAFF'}
                      </Text>
                    </View>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: 7,
                      paddingVertical: 3,
                      borderRadius: 6,
                      backgroundColor: isLight ? '#dcfce7' : 'rgba(16, 185, 129, 0.15)',
                      borderWidth: 1,
                      borderColor: isLight ? '#bbf7d0' : 'rgba(16, 185, 129, 0.25)'
                    }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' }} />
                      <Text style={{ fontSize: 11, color: isLight ? '#15803d' : '#34d399', fontWeight: '700' }}>Active</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Branch Restriction Scope Card */}
              <View style={{
                backgroundColor: isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.08)',
                borderWidth: 1,
                borderColor: isLight ? '#bbf7d0' : 'rgba(16, 185, 129, 0.25)',
                borderRadius: 12,
                padding: 14,
                gap: 6
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                  <Building2 size={16} color="#059669" />
                  <Text style={{ fontSize: 12, fontWeight: '800', color: isLight ? '#166534' : '#34d399', letterSpacing: 0.5 }}>
                    ASSIGNED SCOPE: {(currentUser?.department || 'KNOAH MARI').toUpperCase()}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: isLight ? '#166534' : '#a7f3d0', lineHeight: 18 }}>
                  Access Level: Limited strictly to {(currentUser?.department || 'Knoah Mari')} records. Administrative tools and employee creation are restricted.
                </Text>
              </View>

              {/* Logout Button */}
              <View style={{ paddingTop: 4 }}>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    paddingVertical: 12,
                    borderRadius: 10,
                    backgroundColor: isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.15)',
                    borderWidth: 1,
                    borderColor: isLight ? '#fca5a5' : 'rgba(239, 68, 68, 0.3)',
                    cursor: 'pointer'
                  }}
                  onPress={() => {
                    setShowEmployeeModal(false);
                    handleLogout();
                  }}
                >
                  <LogOut size={16} color="#dc2626" />
                  <Text style={{ fontSize: 13, fontWeight: '800', color: isLight ? '#dc2626' : '#f87171' }}>
                    Log Out of Staff Account
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

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
                    <Image
                      source={{ uri: viewItem.filePath || viewItem.previewData?.image }}
                      style={{ width: '100%', height: 380, borderRadius: 8, backgroundColor: isLight ? '#f8fafc' : '#0c1322' }}
                      resizeMode="contain"
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
                {addMode !== 'options' ? (
                  <TouchableOpacity
                    onPress={() => {
                      stopCamera();
                      setAddMode('options');
                    }}
                    style={styles.backModalBtn}
                  >
                    <ArrowLeft size={18} color={isLight ? '#0284c7' : '#38bdf8'} />
                  </TouchableOpacity>
                ) : (
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#ffffff',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1.5,
                    borderColor: '#f97316',
                    overflow: 'hidden'
                  }}>
                    <Image
                      source={{ uri: '/km100-logo.png' }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="contain"
                    />
                  </View>
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
                    {RECEIPT_TYPES.filter(rt => !isKnoahEmployee || rt.entity === 'Knoah Mari' || rt.id.includes('knoah') || rt.id === 'consumables-delivery').map(rt => {
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
                          <Image
                            source={{ uri: capturedReceiptPhoto }}
                            style={{ width: 60, height: 75, borderRadius: 6, borderWidth: 2, borderColor: '#ef4444' }}
                            resizeMode="cover"
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
                          <Image
                            source={{ uri: capturedReceiptPhoto }}
                            style={{ width: 60, height: 75, borderRadius: 6, borderWidth: 1, borderColor: isLight ? '#cbd5e1' : '#334155' }}
                            resizeMode="cover"
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
                        <View style={styles.scannerLaserLine} />
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
// STYLES
// STYLES
// STYLES
