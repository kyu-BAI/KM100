import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import {
  ShieldCheck,
  UserCheck,
  Building2,
  LogIn,
  UserPlus,
  Mail,
  Lock,
  Key,
  Eye,
  EyeOff,
  Sun,
  Moon,
  AlertTriangle,
  CheckCircle2,
  User
} from 'lucide-react';

export default function AuthPortalView({
  authPortal,
  switchAuthPortal,
  authMode,
  setAuthMode,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authConfirmPassword,
  setAuthConfirmPassword,
  authFullName,
  setAuthFullName,
  showPassword,
  setShowPassword,
  authLoading,
  authError,
  setAuthError,
  handleAuthSubmit,
  toggleTheme,
  isLight,
  notification,
  styles,
  isMobile
}) {
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
                  if (setAuthError) setAuthError('');
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
                if (setAuthError) setAuthError('');
              }}
            >
              <LogIn size={15} color={authMode === 'login' ? '#38bdf8' : '#94a3b8'} />
              <Text style={[styles.authTabText, authMode === 'login' && styles.authTabTextActive]}>Admin Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.authTab, authMode === 'register' && styles.authTabActive]}
              onPress={() => {
                setAuthMode('register');
                if (setAuthError) setAuthError('');
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
  );
}
