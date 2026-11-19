import AddDocumentModal from './components/documents/AddDocumentModal';
import DocumentTableView from './components/documents/DocumentTableView';
import DocumentCardsView from './components/documents/DocumentCardsView';
import DocumentViewerModal from './components/documents/DocumentViewerModal';
import RenameDocumentModal from './components/documents/RenameDocumentModal';
import TopHeader from './components/navigation/TopHeader';
import SidebarDirectory from './components/navigation/SidebarDirectory';
import AdminPortalPage from './components/admin/AdminPortalPage';
import AuthPortalView from './components/auth/AuthPortalView';
import EmployeeSessionModal from './components/employee/EmployeeSessionModal';
import { exportRecordsToExcel } from './services/excelService';
import { RECEIPT_TYPES } from './constants/receiptTypes';
import { EMPLOYEE_ROLES, EMPLOYEE_DEPARTMENTS } from './constants/employeeConfig';
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
import { supabase, mapFromDb, mapToDb } from './services/supabase';
import { runOcrOnImage } from './services/ocrService';
import { loadCachedItems, saveCachedItems, getCacheSyncTime, clearCachedItems } from './services/cacheService';

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
    'petc-income': true,
    'petc-income-2026': false,
    'expenses': true,
    'consumables': true,
    'vouchers': true,
    'petc-insurance': true,
    'petc-insurance-2026': false,
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
      const isActuallyAdmin = parsed.role === 'admin' && parsed.isAdmin === true && !parsed.department && !parsed.assignedBranch;
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
          setAuthEmail('');
        setAuthPassword('');
        setAuthConfirmPassword('');
        setAuthFullName('');
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
        // STRICT rule: Employee portal logins OR any provisioned employee email match = always employee, never admin.
        const isEmployeeLogin = authPortal === 'employee' || !!matchedEmpRecord ||
          data.user.user_metadata?.role === 'employee' ||
          data.user.user_metadata?.is_admin === false ||
          !!data.user.user_metadata?.department;

        const user = {
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.user_metadata?.full_name || matchedEmpRecord?.fullName || (isEmployeeLogin ? 'Staff Member' : 'Administrator'),
          // FORCE role and isAdmin — employee logins NEVER get admin access regardless of Supabase metadata
          role: isEmployeeLogin ? 'employee' : 'admin',
          isAdmin: isEmployeeLogin ? false : true,
          employeeRole: isEmployeeLogin
            ? (data.user.user_metadata?.employee_role || matchedEmpRecord?.role || 'Staff / Data Encoder')
            : undefined,
          department: isEmployeeLogin
            ? (data.user.user_metadata?.department || matchedEmpRecord?.department || 'PETC')
            : null,
          assignedBranch: isEmployeeLogin
            ? (data.user.user_metadata?.department || matchedEmpRecord?.department || 'PETC')
            : null,
        };
        localStorage.setItem('petc_admin_user', JSON.stringify(user));
        setAuthEmail('');
        setAuthPassword('');
        setAuthConfirmPassword('');
        setAuthFullName('');
        localStorage.setItem('petc_admin_token', data.session.access_token);
        setCurrentUser(user);
        if (isEmployeeLogin) {
          showNotice(`Authenticated as ${user.fullName || user.email} (${user.employeeRole || 'Staff'} - ${user.department || 'Branch'})`);
        } else {
          showNotice(`Authenticated as Administrator (${user.fullName || user.email})`);
        }
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
    setAuthFullName('');
    setEmpFullName('');
    setEmpEmail('');
    setEmpPassword('');
    setEmpConfirmPassword('');
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
    setAuthEmail('');
    setAuthPassword('');
    setAuthConfirmPassword('');
    setAuthFullName('');
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
    const isUserAdmin = currentUser?.role === 'admin' && currentUser?.isAdmin === true && !currentUser?.department && !currentUser?.assignedBranch;
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
    return [];
  });

  const [empFullName, setEmpFullName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [empConfirmPassword, setEmpConfirmPassword] = useState('');
  const [empRole, setEmpRole] = useState('Staff / Data Encoder');
  const [empDepartment, setEmpDepartment] = useState('Knoah Mari');
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
        role: empRole,          // employee role title (e.g. 'Cashier & Billing')
        isAdmin: false,         // ALWAYS false for employee accounts
        department: empDepartment,
        assignedBranch: empDepartment,
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
  const isAdmin = currentUser?.role === 'admin' && currentUser?.isAdmin === true && !currentUser?.department && !currentUser?.assignedBranch;
  const isEmployee = !isAdmin && !!currentUser;
  const userDept = (currentUser?.department || currentUser?.assignedBranch || '').toLowerCase();

  const isKnoahEmployee = isEmployee && (userDept.includes('knoah') || userDept === 'knoah mari');
  const isRedGooseEmployee = isEmployee && (userDept.includes('red-goose') || userDept.includes('red goose') || (userDept.includes('red') && !userDept.includes('all')));
  const isPetcEmployee = isEmployee && (userDept === 'petc' || (userDept.includes('petc') && !userDept.includes('all') && !userDept.includes('sales') && !userDept.includes('income')));
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
    exportRecordsToExcel({ folderLabel, folderItems, showNotice });
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

  // Delete Item (Strictly restricted to Admin accounts only)
  const handleDeleteItem = async (id, name) => {
    if (!isAdmin) {
      showNotice('Access Denied: Only administrators have permission to delete receipts.', 'error');
      return;
    }
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
    return (
      <AuthPortalView
        authPortal={authPortal}
        switchAuthPortal={switchAuthPortal}
        authMode={authMode}
        setAuthMode={setAuthMode}
        authEmail={authEmail}
        setAuthEmail={setAuthEmail}
        authPassword={authPassword}
        setAuthPassword={setAuthPassword}
        authConfirmPassword={authConfirmPassword}
        setAuthConfirmPassword={setAuthConfirmPassword}
        authFullName={authFullName}
        setAuthFullName={setAuthFullName}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        authLoading={authLoading}
        authError={authError}
        setAuthError={setAuthError}
        handleAuthSubmit={handleAuthSubmit}
        toggleTheme={toggleTheme}
        isLight={isLight}
        notification={notification}
        styles={styles}
        isMobile={isMobile}
      />
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

      <TopHeader
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        openAddModal={openAddModal}
        exportFolderToExcel={exportFolderToExcel}
        activeNav={activeNav}
        toggleTheme={toggleTheme}
        fetchData={fetchData}
        isSyncing={isSyncing}
        currentUser={currentUser}
        isAdmin={isAdmin}
        isEmployee={isEmployee}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        setShowEmployeeModal={setShowEmployeeModal}
        width={width}
        isDesktop={isDesktop}
        isMobile={isMobile}
        isSmallMobile={isSmallMobile}
        isLight={isLight}
        styles={styles}
      />

      {/* MAIN WORKSPACE: LEFT SIDEBAR IS THE SOLE NAVIGATION */}
      <View style={[styles.mainContent, isLight && styles.mainContentLight]}>
        <SidebarDirectory
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isDrawerMode={isDrawerMode}
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          items={items}
          filteredItems={filteredItems}
          showAllFiles={showAllFiles}
          handleToggleShowAll={handleToggleShowAll}
          openAddModal={openAddModal}
          exportFolderToExcel={exportFolderToExcel}
          expandedNodes={expandedNodes}
          toggleNode={toggleNode}
          currentUser={currentUser}
          isAdmin={isAdmin}
          isEmployee={isEmployee}
          isKnoahEmployee={isKnoahEmployee}
          isRedGooseEmployee={isRedGooseEmployee}
          isPetcEmployee={isPetcEmployee}
          isConsumablesEmployee={isConsumablesEmployee}
          isSalesIncomeEmployee={isSalesIncomeEmployee}
          isLight={isLight}
          styles={styles}
        />

        {/* MAIN VIEWING AREA */}
        {currentPage === 'admin' && isAdmin ? (
          <AdminPortalPage
            currentUser={currentUser}
            onLogout={handleLogout}
            onBackToInventory={() => setCurrentPage('inventory')}
            employees={employees}
            handleCreateEmployee={handleCreateEmployee}
            handleDeleteEmployee={handleDeleteEmployee}
            empFullName={empFullName}
            setEmpFullName={setEmpFullName}
            empEmail={empEmail}
            setEmpEmail={setEmpEmail}
            empPassword={empPassword}
            setEmpPassword={setEmpPassword}
            empConfirmPassword={empConfirmPassword}
            setEmpConfirmPassword={setEmpConfirmPassword}
            empRole={empRole}
            setEmpRole={setEmpRole}
            empDepartment={empDepartment}
            setEmpDepartment={setEmpDepartment}
            showEmpPassword={showEmpPassword}
            setShowEmpPassword={setShowEmpPassword}
            empLoading={empLoading}
            empError={empError}
            EMPLOYEE_ROLES={EMPLOYEE_ROLES}
            EMPLOYEE_DEPARTMENTS={EMPLOYEE_DEPARTMENTS}
            isLight={isLight}
            isMobile={isMobile}
            styles={styles}
          />
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
                      autoComplete="off"
                      autoCorrect={false}
                      spellCheck={false}
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
              <DocumentCardsView
                filteredItems={filteredItems}
                onViewItem={(item) => setViewItem(item)}
                onRenameItem={(item) => {
                  setRenameItem(item);
                  setRenameNewName(item?.fileName || '');
                }}
                onDeleteItem={handleDeleteItem}
                isAdmin={isAdmin}
                isLight={isLight}
                styles={styles}
              />
            ) : (
              <DocumentTableView
                filteredItems={filteredItems}
                onViewItem={(item) => setViewItem(item)}
                onRenameItem={(item) => {
                  setRenameItem(item);
                  setRenameNewName(item?.fileName || '');
                }}
                onDeleteItem={handleDeleteItem}
                isAdmin={isAdmin}
                isLight={isLight}
                styles={styles}
              />
            )}
          </View>
        )}
      </View>

      {/* EMPLOYEE STAFF PROFILE & LOGOUT MODAL */}
      <EmployeeSessionModal
        visible={showEmployeeModal}
        onClose={() => setShowEmployeeModal(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
        isLight={isLight}
        styles={styles}
        isMobile={isMobile}
      />

      {/* ======================================================== */}
      {/* 1. DOCUMENT VIEWER MODAL                                 */}
      {/* ======================================================== */}
      <DocumentViewerModal
        viewItem={viewItem}
        onClose={() => setViewItem(null)}
        onRename={(item) => {
          setRenameItem(item);
          setRenameNewName(item?.fileName || '');
        }}
        isLight={isLight}
        isMobile={isMobile}
        styles={styles}
      />

      {/* ======================================================== */}
      {/* 2. ADD DOCUMENT MODAL: TWO OPTIONS ONLY                  */}
      {/* (Insert Document OR Scan Document)                       */}
      {/* ======================================================== */}
      <AddDocumentModal
        showAddModal={showAddModal}
        addMode={addMode}
        setAddMode={setAddMode}
        closeAddModal={closeAddModal}
        stopCamera={stopCamera}
        startCamera={startCamera}
        flipCamera={flipCamera}
        cameraActive={cameraActive}
        videoRef={videoRef}
        insertedFile={insertedFile}
        setInsertedFile={setInsertedFile}
        isUploading={isUploading}
        handleDeviceFileSelect={handleDeviceFileSelect}
        handleSaveInsertedFile={handleSaveInsertedFile}
        selectedReceiptType={selectedReceiptType}
        setSelectedReceiptType={setSelectedReceiptType}
        capturedReceiptPhoto={capturedReceiptPhoto}
        setCapturedReceiptPhoto={setCapturedReceiptPhoto}
        isSavingScan={isSavingScan}
        isOcrProcessing={isOcrProcessing}
        ocrStatusText={ocrStatusText}
        ocrProgress={ocrProgress}
        ocrEstablishment={ocrEstablishment}
        setOcrEstablishment={setOcrEstablishment}
        ocrReceiptDate={ocrReceiptDate}
        setOcrReceiptDate={setOcrReceiptDate}
        ocrDescription={ocrDescription}
        setOcrDescription={setOcrDescription}
        ocrAmount={ocrAmount}
        setOcrAmount={setOcrAmount}
        ocrOrNumber={ocrOrNumber}
        setOcrOrNumber={setOcrOrNumber}
        isOcrVerifiedView={isOcrVerifiedView}
        setIsOcrVerifiedView={setIsOcrVerifiedView}
        ocrValidationError={ocrValidationError}
        setOcrValidationError={setOcrValidationError}
        ocrReceiptName={ocrReceiptName}
        setOcrReceiptName={setOcrReceiptName}
        saveVerifiedReceiptToDatabase={saveVerifiedReceiptToDatabase}
        captureCameraSnapshotAndAutoSave={captureCameraSnapshotAndAutoSave}
        handleReceiptPhotoSelect={handleReceiptPhotoSelect}
        isAdmin={isAdmin}
        isKnoahEmployee={isKnoahEmployee}
        isRedGooseEmployee={isRedGooseEmployee}
        isPetcEmployee={isPetcEmployee}
        isConsumablesEmployee={isConsumablesEmployee}
        isSalesIncomeEmployee={isSalesIncomeEmployee}
        currentUser={currentUser}
        isLight={isLight}
        isMobile={isMobile}
        styles={styles}
      />

      {/* ======================================================== */}
      {/* 3. RENAME DOCUMENT MODAL                                  */}
      {/* ======================================================== */}
      <RenameDocumentModal
        renameItem={renameItem}
        renameNewName={renameNewName}
        setRenameNewName={setRenameNewName}
        isRenaming={isRenaming}
        onSave={handleRenameItem}
        onClose={() => {
          setRenameItem(null);
          setRenameNewName('');
        }}
        isLight={isLight}
        isMobile={isMobile}
        styles={styles}
      />



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
