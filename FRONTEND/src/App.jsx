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
  Shield
} from 'lucide-react';
import { supabase, mapFromDb, mapToDb } from './supabase';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';



export default function App() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

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
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');

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

  // Add Document Modal State: strictly 'options' | 'insert' | 'scan'
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState('options'); // 'options' | 'insert' | 'scan'

  // Insert Document State
  const [insertedFile, setInsertedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Scan Document State
  const [selectedReceiptType, setSelectedReceiptType] = useState(RECEIPT_TYPES[0]);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedReceiptPhoto, setCapturedReceiptPhoto] = useState(null);
  const [scannedRefNo, setScannedRefNo] = useState('');
  const [scannedAmount, setScannedAmount] = useState('');
  const videoRef = useRef(null);

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
    setCurrentUser(null);
    setAuthEmail('');
    setAuthPassword('');
    setAuthConfirmPassword('');
    showNotice('You have been signed out.');
  };

  // Fetch data directly from Supabase (with fallback to local backend)
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        setItems(data.map(mapFromDb));
      } else {
        // Fallback to local server API
        const res = await fetch(`${API_BASE}/items`);
        const localData = await res.json();
        if (localData.success) {
          setItems(localData.items);
        }
      }
    } catch (err) {
      console.warn('Direct fetch fallback:', err);
      try {
        const res = await fetch(`${API_BASE}/items`);
        const localData = await res.json();
        if (localData.success) {
          setItems(localData.items);
        }
      } catch {
        showNotice('Failed to load inventory records', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
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
    return items.filter(item => {
      if (activeNav.type !== 'all' && item.categoryId !== activeNav.type) {
        return false;
      }
      if (activeNav.year && item.year !== activeNav.year) {
        return false;
      }
      if (activeNav.month && item.month !== activeNav.month) {
        return false;
      }
      if (activeNav.subCategory) {
        if (item.subCategoryId && item.subCategoryId !== activeNav.subCategory) return false;
        if (item.subCategory && item.subCategory.toLowerCase() !== activeNav.subCategory.toLowerCase()) return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const inName = item.fileName?.toLowerCase().includes(q);
        const inTitle = item.title?.toLowerCase().includes(q);
        const inNotes = item.notes?.toLowerCase().includes(q);
        const inEntity = item.entity?.toLowerCase().includes(q);
        const inSub = item.subCategory?.toLowerCase().includes(q);
        if (!inName && !inTitle && !inNotes && !inEntity && !inSub) {
          return false;
        }
      }
      return true;
    });
  }, [items, activeNav, searchQuery]);

  // Open & Close Add Document Modal
  const openAddModal = () => {
    setAddMode('options');
    setInsertedFile(null);
    setCapturedReceiptPhoto(null);
    setScannedRefNo(`OR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setScannedAmount('');
    stopCamera();
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
      fetchData();
    } catch (err) {
      console.error(err);
      showNotice('Failed to upload and save document', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // --- Option 2: Scan Receipt Handlers ---
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraStream(stream);
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera error:', err);
      showNotice('Camera not accessible. You can upload a receipt photo instead.', 'error');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  const captureCameraSnapshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedReceiptPhoto(dataUrl);
      stopCamera();
    }
  };

  const handleReceiptPhotoSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setCapturedReceiptPhoto(uploadEvent.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveScannedReceipt = async () => {
    if (!capturedReceiptPhoto) {
      showNotice('Please capture or select a receipt photo first', 'error');
      return;
    }

    try {
      const refCode = scannedRefNo.trim() || `OR-${Date.now()}`;
      const amt = Number(scannedAmount) || 0;
      const receiptFileName = `Scanned_${selectedReceiptType.prefix}_${refCode}.jpg`;

      const scannedItemPayload = {
        id: `SCN-${Date.now()}`,
        fileName: receiptFileName,
        title: `${selectedReceiptType.name} (${refCode})`,
        category: selectedReceiptType.category,
        categoryId: selectedReceiptType.categoryId,
        subCategory: selectedReceiptType.subCategory || 'Receipt Scan',
        entity: selectedReceiptType.entity,
        year: activeNav.year || '2026',
        month: activeNav.month || 'FEB',
        amount: amt,
        currency: 'PHP',
        quantity: 1,
        unit: 'receipt',
        status: 'Scanned & Verified',
        fileFormat: 'JPG',
        fileSize: '128.0 KB',
        notes: `Scanned receipt: ${selectedReceiptType.name}. Reference No: ${refCode}. Captured via scanner on ${new Date().toLocaleDateString()}.`,
        tags: ['Scanned Receipt', selectedReceiptType.name, selectedReceiptType.entity],
        previewData: {
          columns: ['Receipt Property', 'Scanned Detail'],
          rows: [
            ['Receipt Classification', selectedReceiptType.name],
            ['Reference / OR No.', refCode],
            ['Category Destination', selectedReceiptType.category],
            ['Assigned Entity', selectedReceiptType.entity],
            ['Total Amount', amt > 0 ? `PHP ${amt.toLocaleString()}` : 'Unspecified'],
            ['Scan Timestamp', new Date().toLocaleString()]
          ],
          summary: {
            'Official Ref': refCode,
            'Total Amount': amt > 0 ? `PHP ${amt.toLocaleString()}` : 'N/A',
            'Verification': 'Physical Receipt Image Attached'
          }
        }
      };

      // Save directly to Supabase PostgreSQL database
      const dbRow = mapToDb(scannedItemPayload);
      await supabase.from('inventory_items').upsert(dbRow);

      // Also notify local backend if available
      try {
        await fetch(`${API_BASE}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scannedItemPayload)
        });
      } catch (e) {
        // optional local sync
      }

      showNotice(`Scanned receipt "${receiptFileName}" saved to inventory!`);
      closeAddModal();
      fetchData();
    } catch (err) {
      console.error(err);
      showNotice('Failed to save scanned receipt', 'error');
    }
  };

  // Delete Item
  const handleDeleteItem = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await supabase.from('inventory_items').delete().eq('id', id);
      try {
        await fetch(`${API_BASE}/items/${id}`, { method: 'DELETE' });
      } catch (e) {
        // optional local sync
      }
      showNotice(`Deleted "${name}"`);
      if (viewItem?.id === id) setViewItem(null);
      fetchData();
    } catch (err) {
      console.error(err);
      showNotice('Failed to delete item', 'error');
    }
  };

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  // ----------------------------------------------------
  // LOGIN / CREATE ADMIN ACCOUNT VIEW (If not logged in)
  // ----------------------------------------------------
  if (!currentUser) {
    return (
      <View style={[styles.authContainer, isMobile && { padding: 12 }]}>
        {notification && (
          <View style={[styles.toast, notification.type === 'error' ? styles.toastError : styles.toastSuccess]}>
            {notification.type === 'error' ? <AlertTriangle size={18} color="#fff" /> : <CheckCircle2 size={18} color="#fff" />}
            <Text style={styles.toastText}>{notification.text}</Text>
          </View>
        )}

        <View style={[styles.authCard, isMobile && { padding: 18, borderRadius: 12 }]}>
          {/* Top Brand & Security Tag */}
          <View style={styles.authHeader}>
            <View style={styles.authShieldIconBox}>
              <ShieldCheck size={28} color="#34d399" />
            </View>
            <View style={styles.authBadgePill}>
              <Text style={styles.authBadgePillText}>SUPABASE CLOUD AUTH</Text>
            </View>
            <Text style={styles.authTitle}>PETC Inventory System</Text>
            <Text style={styles.authSubtitle}>
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
                  <User size={16} color="#64748b" style={styles.authInputIcon} />
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
                <Mail size={16} color="#64748b" style={styles.authInputIcon} />
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
                <Lock size={16} color="#64748b" style={styles.authInputIcon} />
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
                  <Lock size={16} color="#64748b" style={styles.authInputIcon} />
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
    <View style={styles.container}>
      {/* Notification Toast */}
      {notification && (
        <View style={[styles.toast, notification.type === 'error' ? styles.toastError : styles.toastSuccess]}>
          {notification.type === 'error' ? <AlertTriangle size={18} color="#fff" /> : <CheckCircle2 size={18} color="#fff" />}
          <Text style={styles.toastText}>{notification.text}</Text>
        </View>
      )}

      {/* Mobile Top Bar */}
      {isMobile && (
        <View style={styles.mobileTopBar}>
          <TouchableOpacity
            style={styles.mobileMenuBtn}
            onPress={() => setSidebarOpen(prev => !prev)}
          >
            <Menu size={22} color="#38bdf8" />
          </TouchableOpacity>
          <View style={styles.mobileTitleBlock}>
            <Text style={styles.mobileAppTitle} numberOfLines={1}>PETC INVENTORY</Text>
            <Text style={styles.mobileAppSub} numberOfLines={1}>{activeNav.label}</Text>
          </View>
          <TouchableOpacity
            style={styles.mobileAddBtn}
            onPress={openAddModal}
          >
            <PlusCircle size={22} color="#34d399" />
          </TouchableOpacity>
        </View>
      )}

      {/* MAIN WORKSPACE: LEFT SIDEBAR IS THE SOLE NAVIGATION */}
      <View style={styles.mainContent}>
        {/* Backdrop for Mobile Drawer */}
        {isMobile && sidebarOpen && (
          <TouchableOpacity
            style={styles.mobileDrawerBackdrop}
            activeOpacity={1}
            onPress={() => setSidebarOpen(false)}
          />
        )}

        {/* LEFT SIDEBAR (Desktop toggleable / Mobile drawer) */}
        {sidebarOpen && (
          <View style={[styles.sidebar, isMobile && styles.mobileSidebarDrawer]}>
            <View style={styles.sidebarTitleRow}>
              <Text style={styles.sidebarSectionTitle}>DOCUMENT DIRECTORY</Text>
              <TouchableOpacity
                onPress={() => setSidebarOpen(false)}
                style={styles.sidebarCollapseBtn}
                title="Hide sidebar"
              >
                {isMobile ? <X size={18} color="#94a3b8" /> : <ChevronLeft size={16} color="#94a3b8" />}
              </TouchableOpacity>
            </View>

          <ScrollView style={styles.treeScroll} showsVerticalScrollIndicator={false}>
            {/* 1. All Files Node */}
            <TouchableOpacity
              style={[
                styles.treeItem,
                activeNav.type === 'all' && styles.treeItemActive
              ]}
              onPress={() => setActiveNav({
                type: 'all',
                year: null,
                month: null,
                subCategory: null,
                label: 'All Inventory Files'
              })}
            >
              <Layers size={17} color={activeNav.type === 'all' ? '#38bdf8' : '#94a3b8'} />
              <Text style={[styles.treeText, activeNav.type === 'all' && styles.treeTextActive]}>
                All Inventory Files ({items.length})
              </Text>
            </TouchableOpacity>

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
              <TouchableOpacity
                style={[styles.treeItem, activeNav.type === 'petc-sales' && !activeNav.year && styles.treeItemActive]}
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
                <Text style={[styles.treeCategoryTitle, activeNav.type === 'petc-sales' && styles.treeTextActive]}>
                  PETC SALES
                </Text>
              </TouchableOpacity>

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
                    <Text style={[styles.treeSubText, activeNav.type === 'petc-sales' && activeNav.year === '2026' && styles.treeTextActive]}>
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
                    <Text style={[styles.treeSubText, activeNav.type === 'petc-sales' && activeNav.year === '2027' && styles.treeTextActive]}>
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
              <TouchableOpacity
                style={[styles.treeItem, activeNav.type === 'petc-income' && !activeNav.year && styles.treeItemActive]}
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
                <Text style={[styles.treeCategoryTitle, activeNav.type === 'petc-income' && styles.treeTextActive]}>
                  PETC INCOME
                </Text>
              </TouchableOpacity>

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
                    <Text style={[styles.treeSubText, activeNav.type === 'petc-income' && activeNav.year === '2026' && styles.treeTextActive]}>
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
                    <Text style={[styles.treeSubText, activeNav.type === 'petc-income' && activeNav.year === '2027' && styles.treeTextActive]}>
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
              <TouchableOpacity
                style={[styles.treeItem, activeNav.type === 'expenses' && !activeNav.subCategory && styles.treeItemActive]}
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
                <Text style={[styles.treeCategoryTitle, activeNav.type === 'expenses' && styles.treeTextActive]}>
                  EXPENSES
                </Text>
              </TouchableOpacity>

              {expandedNodes['expenses'] && (
                <View style={styles.treeChildren}>
                  {[
                    { id: 'expenses-2026-petc', label: 'Expenses 2026 (PETC)' },
                    { id: 'expenses-2027-petc', label: 'Expenses 2027 (PETC)' },
                    { id: 'red-goose-2026', label: 'Red Goose Expenses 2026' },
                    { id: 'red-goose-2027', label: 'Red Goose Expenses 2027' },
                    { id: 'knoah-mari-2026', label: 'Knoah Mari Expenses 2026' },
                    { id: 'knoah-mari-2027', label: 'Knoah Mari Expenses 2027' }
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
                      <Text style={[styles.treeSubText, activeNav.subCategory === branch.id && styles.treeTextActive]}>
                        {branch.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* 5. CONSUMABLES */}
            <View style={styles.categoryBlock}>
              <TouchableOpacity
                style={[styles.treeItem, activeNav.type === 'consumables' && !activeNav.subCategory && styles.treeItemActive]}
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
                <Text style={[styles.treeCategoryTitle, activeNav.type === 'consumables' && styles.treeTextActive]}>
                  CONSUMABLES
                </Text>
              </TouchableOpacity>

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
                      <Text style={[styles.treeSubText, activeNav.subCategory === branch.id && styles.treeTextActive]}>
                        {branch.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* 6. VOUCHERS */}
            <View style={styles.categoryBlock}>
              <TouchableOpacity
                style={[styles.treeItem, activeNav.type === 'vouchers' && !activeNav.subCategory && styles.treeItemActive]}
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
                <Text style={[styles.treeCategoryTitle, activeNav.type === 'vouchers' && styles.treeTextActive]}>
                  VOUCHERS
                </Text>
              </TouchableOpacity>

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
                      <Text style={[styles.treeSubText, activeNav.subCategory === branch.id && styles.treeTextActive]}>
                        {branch.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* 7. PETC INSURANCE */}
            <View style={styles.categoryBlock}>
              <TouchableOpacity
                style={[styles.treeItem, activeNav.type === 'petc-insurance' && !activeNav.year && styles.treeItemActive]}
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
                <Text style={[styles.treeCategoryTitle, activeNav.type === 'petc-insurance' && styles.treeTextActive]}>
                  PETC INSURANCE
                </Text>
              </TouchableOpacity>

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
                    <Text style={[styles.treeSubText, activeNav.type === 'petc-insurance' && activeNav.year === '2026' && styles.treeTextActive]}>
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
                    <Text style={[styles.treeSubText, activeNav.type === 'petc-insurance' && activeNav.year === '2027' && styles.treeTextActive]}>
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
            <View style={styles.sidebarAdminBox}>
              <View style={styles.sidebarAdminRow}>
                <View style={styles.adminAvatarCircle}>
                  <Text style={styles.adminAvatarInitials}>
                    {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'A'}
                  </Text>
                </View>
                <View style={{ flex: 1, minWidth: 0, paddingRight: 4 }}>
                  <Text style={styles.adminNameText} numberOfLines={1}>
                    {currentUser.fullName || 'Admin User'}
                  </Text>
                  <Text style={styles.adminEmailText} numberOfLines={1}>
                    {currentUser.email}
                  </Text>
                </View>
                <View style={styles.adminBadgePill}>
                  <Text style={styles.adminBadgePillText}>ADMIN</Text>
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
        <View style={styles.contentArea}>
          {/* CONTROL BAR: Burger Menu Toggle, Breadcrumbs, Search & Record Count */}
          <View style={[styles.controlBar, isMobile && styles.controlBarMobile]}>
            <View style={styles.controlBarLeft}>
              <TouchableOpacity
                style={[styles.burgerToggleBtn, isMobile && { display: 'none' }]}
                onPress={() => setSidebarOpen(prev => !prev)}
                title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
              >
                <Menu size={18} color="#38bdf8" />
              </TouchableOpacity>

              <View style={[styles.breadcrumbs, isMobile && { display: 'none' }]}>
                <Text style={styles.breadcrumbItem}>Inventory</Text>
                <ChevronRight size={14} color="#64748b" />
                <Text style={styles.breadcrumbActive}>{activeNav.label}</Text>
              </View>
            </View>

            <View style={[styles.controlBarRight, isMobile && { width: '100%', justifyContent: 'space-between' }]}>
              <View style={[styles.searchBox, isMobile && { flex: 1 }]}>
                <Search size={15} color="#94a3b8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search file name, notes..."
                  placeholderTextColor="#64748b"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={14} color="#94a3b8" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{filteredItems.length} records</Text>
              </View>
            </View>
          </View>

          {/* ITEM DISPLAY */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#38bdf8" />
              <Text style={styles.loadingText}>Loading inventory records...</Text>
            </View>
          ) : filteredItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Layers size={48} color="#334155" />
              <Text style={styles.emptyTitle}>
                {items.length === 0 ? 'No files or documents currently in system' : 'No records found in this category'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {items.length === 0
                  ? 'Your inventory database is currently empty. Tap "Add Document" to add records.'
                  : 'Select another category or year/month to view documents.'}
              </Text>
            </View>
          ) : isMobile ? (
            /* MOBILE TOUCH-FRIENDLY DOCUMENT CARDS */
            <ScrollView style={styles.mobileCardList} showsVerticalScrollIndicator={false}>
              {filteredItems.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.mobileCard}
                  onPress={() => setViewItem(item)}
                >
                  <View style={styles.mobileCardHeader}>
                    <View style={styles.mobileCardIcon}>
                      {item.fileFormat === 'XLSX' ? (
                        <FileSpreadsheet size={20} color="#34d399" />
                      ) : item.fileFormat === 'JPG' || item.fileFormat === 'PNG' ? (
                        <ImageIcon size={20} color="#38bdf8" />
                      ) : (
                        <FileText size={20} color="#38bdf8" />
                      )}
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.mobileCardTitle} numberOfLines={1}>{item.fileName}</Text>
                      <Text style={styles.mobileCardCategory} numberOfLines={1}>
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

                  <View style={styles.mobileCardMeta}>
                    <View style={styles.mobileMetaItem}>
                      <Text style={styles.mobileMetaLabel}>PERIOD</Text>
                      <Text style={styles.mobileMetaVal}>{item.year} {item.month !== 'CURRENT' ? item.month : ''}</Text>
                    </View>
                    <View style={styles.mobileMetaItem}>
                      <Text style={styles.mobileMetaLabel}>AMOUNT</Text>
                      <Text style={[styles.mobileMetaVal, { color: '#38bdf8', fontWeight: '700' }]}>
                        {item.amount > 0 ? `₱${Number(item.amount).toLocaleString()}` : 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.mobileMetaItem}>
                      <Text style={styles.mobileMetaLabel}>FORMAT</Text>
                      <Text style={styles.mobileMetaVal}>{item.fileFormat || 'PDF'}</Text>
                    </View>
                  </View>

                  <View style={styles.mobileCardActions}>
                    <TouchableOpacity
                      style={styles.mobileBtnView}
                      onPress={() => setViewItem(item)}
                    >
                      <Eye size={14} color="#38bdf8" />
                      <Text style={styles.mobileBtnViewText}>View Details</Text>
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
                  <View style={styles.tableRowHeader}>
                    <Text style={[styles.th, { width: 45 }]}>#</Text>
                    <Text style={[styles.th, { width: 280 }]}>FILE NAME</Text>
                    <Text style={[styles.th, { width: 150 }]}>CATEGORY</Text>
                    <Text style={[styles.th, { width: 120 }]}>ENTITY</Text>
                    <Text style={[styles.th, { width: 100 }]}>PERIOD</Text>
                    <Text style={[styles.th, { width: 130, textAlign: 'right' }]}>AMOUNT (PHP)</Text>
                    <Text style={[styles.th, { width: 110 }]}>VOLUME</Text>
                    <Text style={[styles.th, { width: 130 }]}>STATUS</Text>
                    <Text style={[styles.th, { width: 90, textAlign: 'center' }]}>ACTIONS</Text>
                  </View>

                  {filteredItems.map((item, idx) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}
                      onPress={() => setViewItem(item)}
                    >
                      <Text style={[styles.td, { width: 45, color: '#64748b' }]}>{idx + 1}</Text>
                      <View style={{ width: 280, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {item.fileFormat === 'XLSX' ? <FileSpreadsheet size={16} color="#34d399" /> : <FileText size={16} color="#38bdf8" />}
                        <Text style={[styles.td, { fontWeight: '600', color: '#f8fafc' }]} numberOfLines={1}>
                          {item.fileName}
                        </Text>
                      </View>
                      <Text style={[styles.td, { width: 150 }]} numberOfLines={1}>{item.category}</Text>
                      <Text style={[styles.td, { width: 120 }]} numberOfLines={1}>{item.entity}</Text>
                      <Text style={[styles.td, { width: 100 }]}>{item.year} {item.month !== 'CURRENT' ? item.month : ''}</Text>
                      <Text style={[styles.td, { width: 130, textAlign: 'right', fontWeight: '600', color: '#38bdf8' }]}>
                        {item.amount > 0 ? `₱${Number(item.amount).toLocaleString()}` : '-'}
                      </Text>
                      <Text style={[styles.td, { width: 110 }]}>
                        {item.quantity ? `${item.quantity} ${item.unit || ''}` : '-'}
                      </Text>
                      <View style={{ width: 130 }}>
                        <View style={[
                          styles.statusTag,
                          item.status === 'Low Stock' ? styles.statusTagDanger :
                          item.status === 'Completed' || item.status === 'Audited' || item.status === 'Paid & Reconciled' ? styles.statusTagSuccess :
                          styles.statusTagInfo
                        ]}>
                          <Text style={styles.statusTagText}>{item.status}</Text>
                        </View>
                      </View>
                      <View style={{ width: 90, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                        <TouchableOpacity
                          style={styles.btnTableAction}
                          onPress={() => setViewItem(item)}
                        >
                          <Eye size={15} color="#38bdf8" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.btnTableAction}
                          onPress={() => handleDeleteItem(item.id, item.fileName)}
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
          <View style={[styles.viewerModalContainer, isMobile && styles.modalContainerMobile]}>
            <View style={[styles.viewerHeader, isMobile && styles.modalHeaderMobile]}>
              <View style={[styles.viewerHeaderLeft, isMobile && { gap: 10, flex: 1, minWidth: 0 }]}>
                <View style={[styles.viewerBadge, isMobile && { width: 38, height: 38 }]}>
                  {viewItem?.fileFormat === 'XLSX' ? (
                    <FileSpreadsheet size={isMobile ? 20 : 26} color="#34d399" />
                  ) : (
                    <FileText size={isMobile ? 20 : 26} color="#38bdf8" />
                  )}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.viewerTitle, isMobile && { fontSize: 14 }]} numberOfLines={1}>{viewItem?.fileName}</Text>
                  <Text style={[styles.viewerSubtitle, isMobile && { fontSize: 10 }]} numberOfLines={1}>
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
                  <Printer size={16} color="#cbd5e1" />
                  {!isMobile && <Text style={styles.btnOutlineText}>Print</Text>}
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
                  <Download size={16} color="#cbd5e1" />
                  {!isMobile && <Text style={styles.btnOutlineText}>Export</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setViewItem(null)}
                >
                  <X size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.viewerBody}>
              <View style={styles.viewerStatsGrid}>
                <View style={styles.viewerStatBox}>
                  <Text style={styles.viewerStatLabel}>RECORD ID</Text>
                  <Text style={styles.viewerStatValue}>{viewItem?.id}</Text>
                </View>
                <View style={styles.viewerStatBox}>
                  <Text style={styles.viewerStatLabel}>TOTAL AMOUNT</Text>
                  <Text style={[styles.viewerStatValue, { color: '#38bdf8' }]}>
                    {viewItem?.amount ? `₱${Number(viewItem.amount).toLocaleString()}` : 'N/A'}
                  </Text>
                </View>
                <View style={styles.viewerStatBox}>
                  <Text style={styles.viewerStatLabel}>VOLUME / QUANTITY</Text>
                  <Text style={styles.viewerStatValue}>
                    {viewItem?.quantity ? `${viewItem.quantity} ${viewItem.unit || ''}` : 'N/A'}
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
                <View style={styles.viewerStatBox}>
                  <Text style={styles.viewerStatLabel}>FILING DATE</Text>
                  <Text style={styles.viewerStatValue}>{viewItem?.createdAt}</Text>
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
          <View style={[styles.formModalContainer, isMobile && styles.modalContainerMobile]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, isMobile && styles.modalHeaderMobile]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                {addMode !== 'options' && (
                  <TouchableOpacity
                    onPress={() => {
                      stopCamera();
                      setAddMode('options');
                    }}
                    style={styles.backModalBtn}
                  >
                    <ArrowLeft size={18} color="#38bdf8" />
                  </TouchableOpacity>
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.modalTitle, isMobile && { fontSize: 15 }]} numberOfLines={1}>
                    {addMode === 'options' && 'Add Document'}
                    {addMode === 'insert' && 'Insert Document from Device'}
                    {addMode === 'scan' && 'Scan Receipt Document'}
                  </Text>
                  <Text style={[styles.modalHeaderSub, isMobile && { fontSize: 11 }]} numberOfLines={1}>
                    {addMode === 'options' && 'Choose one of the two options below to add records'}
                    {addMode === 'insert' && `Target Category: ${activeNav.label}`}
                    {addMode === 'scan' && 'Choose receipt type and capture with camera'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity onPress={closeAddModal} style={styles.modalCloseBtn}>
                <X size={18} color="#94a3b8" />
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
                  style={[styles.optionCard, isMobile && styles.optionCardMobile]}
                  onPress={() => setAddMode('insert')}
                >
                  {isMobile ? (
                    <>
                      <View style={styles.optionCardHeaderMobile}>
                        <View style={styles.optionIconBox}>
                          <UploadCloud size={24} color="#38bdf8" />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.optionTitle}>Insert Document</Text>
                          <Text style={styles.optionSubtitle}>Existing file from device</Text>
                        </View>
                      </View>
                      <Text style={styles.optionDescription}>
                        Browse or upload PDF reports, Excel spreadsheets (.xlsx), text files, or pre-scanned digital images.
                      </Text>
                      <View style={[styles.optionActionBadge, { width: '100%', alignItems: 'center' }]}>
                        <Text style={styles.optionActionText}>Select File →</Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.optionIconBox}>
                        <UploadCloud size={32} color="#38bdf8" />
                      </View>
                      <View style={styles.optionContent}>
                        <Text style={styles.optionTitle}>Insert Document</Text>
                        <Text style={styles.optionSubtitle}>
                          Insert an existing file from your device
                        </Text>
                        <Text style={styles.optionDescription}>
                          Browse or upload PDF reports, Excel spreadsheets (.xlsx), text files, or pre-scanned digital images stored on your computer.
                        </Text>
                      </View>
                      <View style={styles.optionActionBadge}>
                        <Text style={styles.optionActionText}>Select File →</Text>
                      </View>
                    </>
                  )}
                </TouchableOpacity>

                {/* Option 2: Scan Document */}
                <TouchableOpacity
                  style={[styles.optionCard, styles.optionCardScan, isMobile && styles.optionCardMobile]}
                  onPress={() => setAddMode('scan')}
                >
                  {isMobile ? (
                    <>
                      <View style={styles.optionCardHeaderMobile}>
                        <View style={[styles.optionIconBox, styles.optionIconBoxScan]}>
                          <Camera size={24} color="#34d399" />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.optionTitle}>Scan Document</Text>
                          <Text style={[styles.optionSubtitle, { color: '#34d399' }]}>Camera receipt scanner</Text>
                        </View>
                      </View>
                      <Text style={styles.optionDescription}>
                        Capture physical receipts or vouchers (Emission, CTPL, Expenses, Consumables) via camera.
                      </Text>
                      <View style={[styles.optionActionBadge, styles.optionActionBadgeScan, { width: '100%', alignItems: 'center' }]}>
                        <Text style={[styles.optionActionText, { color: '#34d399' }]}>Scan Receipt →</Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={[styles.optionIconBox, styles.optionIconBoxScan]}>
                        <Camera size={32} color="#34d399" />
                      </View>
                      <View style={styles.optionContent}>
                        <Text style={styles.optionTitle}>Scan Document</Text>
                        <Text style={styles.optionSubtitle}>
                          Scan a physical receipt or voucher
                        </Text>
                        <Text style={styles.optionDescription}>
                          Choose which receipt type you want to scan (Emission Sales, CTPL Insurance, Expenses, Consumables, or Vouchers) and capture it via camera.
                        </Text>
                      </View>
                      <View style={[styles.optionActionBadge, styles.optionActionBadgeScan]}>
                        <Text style={[styles.optionActionText, { color: '#34d399' }]}>Scan Receipt →</Text>
                      </View>
                    </>
                  )}
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
                <ScrollView style={styles.modalBody}>
                  {/* Step A: Choose what receipt you are about to scan */}
                  <Text style={styles.scanSectionHeading}>
                    1. CHOOSE WHAT RECEIPT YOU ARE ABOUT TO SCAN:
                  </Text>
                  <View style={styles.receiptTypeGrid}>
                    {RECEIPT_TYPES.map(rt => {
                      const isSelected = selectedReceiptType.id === rt.id;
                      return (
                        <TouchableOpacity
                          key={rt.id}
                          style={[styles.receiptTypeCard, isSelected && styles.receiptTypeCardActive, isMobile && { width: '100%' }]}
                          onPress={() => setSelectedReceiptType(rt)}
                        >
                          <View style={styles.receiptTypeHeader}>
                            <Text style={[styles.receiptTypeName, isSelected && styles.receiptTypeNameActive]}>
                              {rt.name}
                            </Text>
                            {isSelected && <CheckCircle2 size={16} color="#34d399" />}
                          </View>
                          <Text style={styles.receiptTypeDesc} numberOfLines={2}>{rt.description}</Text>
                          <View style={styles.receiptEntityBadge}>
                            <Text style={styles.receiptEntityBadgeText}>{rt.category} • {rt.entity}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Step B: Capture Receipt */}
                  <Text style={[styles.scanSectionHeading, { marginTop: 18 }]}>
                    2. CAPTURE RECEIPT:
                  </Text>

                  {/* Hidden file input for uploading receipt photo if user prefers */}
                  <input
                    type="file"
                    id="receiptPhotoInput"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={handleReceiptPhotoSelect}
                  />

                  {capturedReceiptPhoto ? (
                    /* Captured Photo Preview */
                    <View style={styles.capturedContainer}>
                      <View style={styles.capturedImageWrapper}>
                        <img
                          src={capturedReceiptPhoto}
                          alt="Scanned receipt preview"
                          style={{ width: '100%', maxHeight: 260, objectFit: 'contain', borderRadius: 8 }}
                        />
                      </View>

                      <View style={styles.scannedFormBox}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <CheckCircle2 size={16} color="#34d399" />
                          <Text style={styles.scannedSuccessText}>Receipt Image Captured Successfully</Text>
                        </View>
                        <Text style={styles.scannedReceiptCategoryText}>
                          Selected Type: <Text style={{ color: '#38bdf8', fontWeight: '700' }}>{selectedReceiptType.name}</Text>
                        </Text>

                        <View style={[styles.scannedFieldRow, isMobile && { flexDirection: 'column', alignItems: 'flex-start', gap: 4 }]}>
                          <Text style={[styles.scannedFieldLabel, isMobile && { width: '100%' }]}>OR / Ref Number:</Text>
                          <TextInput
                            style={[styles.scannedInput, isMobile && { width: '100%' }]}
                            value={scannedRefNo}
                            onChangeText={setScannedRefNo}
                            placeholder="e.g. OR-2026-9481"
                            placeholderTextColor="#64748b"
                          />
                        </View>

                        <View style={[styles.scannedFieldRow, isMobile && { flexDirection: 'column', alignItems: 'flex-start', gap: 4 }]}>
                          <Text style={[styles.scannedFieldLabel, isMobile && { width: '100%' }]}>Amount (PHP):</Text>
                          <TextInput
                            style={[styles.scannedInput, isMobile && { width: '100%' }]}
                            value={scannedAmount}
                            onChangeText={setScannedAmount}
                            placeholder="e.g. 650.00"
                            placeholderTextColor="#64748b"
                            keyboardType="numeric"
                          />
                        </View>

                        <TouchableOpacity
                          style={styles.retakeBtn}
                          onPress={() => setCapturedReceiptPhoto(null)}
                        >
                          <RefreshCw size={14} color="#94a3b8" />
                          <Text style={styles.retakeBtnText}>Retake / Choose Another Photo</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : cameraActive ? (
                    /* Live Camera Viewfinder */
                    <View style={styles.cameraContainer}>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        style={{ width: '100%', height: 260, objectFit: 'cover', borderRadius: 8, backgroundColor: '#000' }}
                      />
                      <View style={styles.cameraOverlayFrame} />
                      <View style={styles.cameraActionRow}>
                        <TouchableOpacity style={styles.btnCaptureShutter} onPress={captureCameraSnapshot}>
                          <Camera size={18} color="#fff" />
                          <Text style={styles.btnCaptureShutterText}>Capture Receipt</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.btnCancelCamera} onPress={stopCamera}>
                          <Text style={styles.btnCancelCameraText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    /* Initial Scan Options: Use Camera or Upload Photo */
                    <View style={[styles.scanTriggerRow, isMobile && { flexDirection: 'column', gap: 10 }]}>
                      <TouchableOpacity style={styles.scanOptionBtn} onPress={startCamera}>
                        <View style={styles.scanOptionIconBox}>
                          <Camera size={26} color="#34d399" />
                        </View>
                        <Text style={styles.scanOptionTitle}>Use Device Camera</Text>
                        <Text style={styles.scanOptionSub}>Open camera to photograph physical receipt</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.scanOptionBtn}
                        onPress={() => document.getElementById('receiptPhotoInput')?.click()}
                      >
                        <View style={[styles.scanOptionIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.1)', borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
                          <UploadCloud size={26} color="#38bdf8" />
                        </View>
                        <Text style={styles.scanOptionTitle}>Upload Receipt Photo</Text>
                        <Text style={styles.scanOptionSub}>Select an existing photo of the receipt</Text>
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

                  <TouchableOpacity
                    style={[styles.btnPrimary, !capturedReceiptPhoto && { opacity: 0.5 }]}
                    onPress={handleSaveScannedReceipt}
                    disabled={!capturedReceiptPhoto}
                  >
                    <Check size={16} color="#fff" />
                    <Text style={styles.btnPrimaryText}>Save Scanned Document</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
    flexDirection: 'column',
    height: '100%',
    width: '100%'
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
    backgroundColor: '#1e293b'
  },
  iconToggle: {
    padding: 2
  },
  treeCategoryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#cbd5e1'
  },
  treeText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500'
  },
  treeTextActive: {
    color: '#38bdf8',
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
    color: '#94a3b8',
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
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    width: 240,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 12,
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

  // Table View
  tableHorizontal: {
    flex: 1
  },
  tableVertical: {
    flex: 1
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
    borderBottomColor: '#1e293b',
    backgroundColor: '#0f172a'
  },
  tableRowAlt: {
    backgroundColor: '#131d31'
  },
  td: {
    fontSize: 12,
    color: '#cbd5e1'
  },
  btnTableAction: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: '#1e293b'
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
    borderColor: '#334155',
    backgroundColor: '#1e293b'
  },
  btnOutlineText: {
    color: '#cbd5e1',
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
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  viewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#131d31',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
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
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)'
  },
  viewerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    fontFamily: 'JetBrains Mono, monospace'
  },
  viewerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
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
    backgroundColor: '#1e293b'
  },
  viewerBody: {
    padding: 24
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
    backgroundColor: '#131d31',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  viewerStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 4
  },
  viewerStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc'
  },
  viewerSection: {
    marginBottom: 20
  },
  viewerSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 10
  },
  notesBox: {
    backgroundColor: '#131d31',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  notesText: {
    fontSize: 13,
    color: '#cbd5e1',
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
    color: '#34d399',
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)'
  },
  previewTableContainer: {
    backgroundColor: '#131d31',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden'
  },
  previewTableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    paddingHorizontal: 14
  },
  previewTh: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8'
  },
  previewTableRow: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: '#1e293b'
  },
  previewTableRowAlt: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)'
  },
  previewTd: {
    fontSize: 12,
    color: '#cbd5e1'
  },
  previewSummaryBox: {
    backgroundColor: '#0c1322',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1e293b',
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
    color: '#94a3b8'
  },
  summaryItemVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38bdf8'
  },

  // ADD DOCUMENT MODAL STYLES (TWO OPTIONS)
  formModalContainer: {
    width: '90%',
    maxWidth: 680,
    maxHeight: '90%',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#131d31',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
  },
  backModalBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#1e293b',
    marginRight: 6
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc'
  },
  modalHeaderSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2
  },
  modalBody: {
    padding: 20
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#131d31',
    borderTopWidth: 1,
    borderTopColor: '#1e293b'
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131d31',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 18
  },
  optionCardMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: 14,
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
    width: 60,
    height: 60,
    borderRadius: 12,
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
    color: '#f8fafc',
    marginBottom: 2
  },
  optionSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#38bdf8',
    marginBottom: 4
  },
  optionDescription: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 17
  },
  optionActionBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    left: '15%',
    right: '15%',
    bottom: 50,
    borderWidth: 2,
    borderColor: '#34d399',
    borderStyle: 'dashed',
    borderRadius: 8,
    pointerEvents: 'none'
  },
  cameraActionRow: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    gap: 12
  },
  btnCaptureShutter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20
  },
  btnCaptureShutterText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700'
  },
  btnCancelCamera: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20
  },
  btnCancelCameraText: {
    color: '#cbd5e1',
    fontSize: 12
  },
  capturedContainer: {
    backgroundColor: '#131d31',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  capturedImageWrapper: {
    backgroundColor: '#0c1322',
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
    borderTopColor: '#1e293b',
    padding: 12,
    backgroundColor: '#0b1120',
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
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#38bdf8',
    alignItems: 'center',
    justifyContent: 'center'
  },
  adminAvatarInitials: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '800'
  },
  adminNameText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700'
  },
  adminEmailText: {
    color: '#64748b',
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
  }
});
