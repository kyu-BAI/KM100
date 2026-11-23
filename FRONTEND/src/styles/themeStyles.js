import { StyleSheet } from 'react-native';

export function createStyles(isLight) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isLight ? '#f1f5f9' : '#090d16',
      flexDirection: 'column',
      height: '100%',
      width: '100%'
    },
    // HEADER USER NAME & ROLE
    headerUserName: {
      fontSize: 12,
      fontWeight: '700',
      color: isLight ? '#0f172a' : '#f8fafc'
    },
    headerUserNameLight: {
      color: '#0f172a'
    },
    headerUserRole: {
      fontSize: 9,
      fontWeight: '800',
      color: isLight ? '#0284c7' : '#38bdf8',
      letterSpacing: 0.5
    },
    headerUserRoleLight: {
      color: '#0284c7'
    },

    // ADMIN PORTAL STYLES
    adminPortalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 12,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: isLight ? '#e2e8f0' : '#1e293b'
    },
    adminPortalHeaderLight: {
      borderBottomColor: '#e2e8f0'
    },
    adminPortalTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: isLight ? '#0f172a' : '#f8fafc',
      letterSpacing: -0.4
    },
    adminPortalTitleLight: {
      color: '#0f172a'
    },
    adminPortalSub: {
      fontSize: 13,
      color: isLight ? '#64748b' : '#94a3b8'
    },
    adminPortalSubLight: {
      color: '#64748b'
    },
    adminBackBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 8,
      backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
      borderWidth: 1,
      borderColor: isLight ? '#cbd5e1' : '#334155',
      cursor: 'pointer',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    },
    adminBackBtnLight: {
      backgroundColor: '#f1f5f9',
      borderColor: '#cbd5e1'
    },
    adminBackBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: isLight ? '#0284c7' : '#38bdf8'
    },
    adminBackBtnTextLight: {
      color: '#0284c7'
    },
    adminGrid: {
      flexDirection: 'row',
      gap: 20
    },
    adminProfileCard: {
      flex: 1,
      minWidth: 320,
      backgroundColor: isLight ? '#ffffff' : '#0f172a',
      borderRadius: 12,
      padding: 22,
      borderWidth: 1,
      borderColor: isLight ? '#e2e8f0' : '#1e293b',
      gap: 16,
      boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.04)' : undefined
    },
    adminProfileCardLight: {
      backgroundColor: '#ffffff',
      borderColor: '#e2e8f0'
    },
    adminLargeAvatarCircle: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: '#0284c7',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#f97316',
      boxShadow: '0 3px 10px rgba(249, 115, 22, 0.3)'
    },
    adminLargeAvatarInitials: {
      color: '#ffffff',
      fontSize: 22,
      fontWeight: '800'
    },
    adminProfileName: {
      fontSize: 16,
      fontWeight: '800',
      color: isLight ? '#0f172a' : '#f8fafc'
    },
    adminProfileNameLight: {
      color: '#0f172a'
    },
    adminProfileEmail: {
      fontSize: 12,
      color: isLight ? '#64748b' : '#94a3b8'
    },
    adminProfileEmailLight: {
      color: '#64748b'
    },
    adminPrivilegesBox: {
      backgroundColor: isLight ? '#f8fafc' : '#0c1322',
      borderRadius: 8,
      padding: 14,
      borderWidth: 1,
      borderColor: isLight ? '#e2e8f0' : '#1e293b'
    },
    adminPrivilegesBoxLight: {
      backgroundColor: '#f8fafc',
      borderColor: '#e2e8f0'
    },
    adminPrivilegesHeading: {
      fontSize: 10,
      fontWeight: '800',
      color: isLight ? '#475569' : '#94a3b8',
      letterSpacing: 0.8
    },
    adminPrivilegesHeadingLight: {
      color: '#475569'
    },
    privilegeItemText: {
      fontSize: 12,
      color: isLight ? '#334155' : '#cbd5e1',
      fontWeight: '500'
    },
    privilegeItemTextLight: {
      color: '#334155'
    },
    adminLogoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.12)',
      borderWidth: 1,
      borderColor: isLight ? '#fca5a5' : 'rgba(239, 68, 68, 0.3)',
      paddingVertical: 12,
      borderRadius: 8,
      cursor: 'pointer'
    },
    adminLogoutBtnLight: {
      backgroundColor: '#fee2e2',
      borderColor: '#fca5a5'
    },
    adminLogoutBtnText: {
      color: isLight ? '#dc2626' : '#f87171',
      fontSize: 13,
      fontWeight: '700'
    },
    employeeFormCard: {
      flex: 1.6,
      minWidth: 320,
      backgroundColor: isLight ? '#ffffff' : '#0f172a',
      borderRadius: 12,
      padding: 22,
      borderWidth: 1,
      borderColor: isLight ? '#e2e8f0' : '#1e293b',
      gap: 14,
      boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.04)' : undefined
    },
    employeeFormCardLight: {
      backgroundColor: '#ffffff',
      borderColor: '#e2e8f0'
    },
    empIconBadge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center'
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: isLight ? '#0f172a' : '#f8fafc'
    },
    cardTitleLight: {
      color: '#0f172a'
    },
    cardSubtitle: {
      fontSize: 12,
      color: isLight ? '#64748b' : '#94a3b8'
    },
    cardSubtitleLight: {
      color: '#64748b'
    },
    formFieldLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: isLight ? '#475569' : '#94a3b8',
      letterSpacing: 0.5
    },
    formFieldLabelLight: {
      color: '#475569'
    },
    formInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isLight ? '#f8fafc' : '#0c1322',
      borderWidth: 1,
      borderColor: isLight ? '#cbd5e1' : '#334155',
      borderRadius: 8,
      paddingHorizontal: 12,
      gap: 8,
      position: 'relative'
    },
    formInputWrapperLight: {
      backgroundColor: '#f8fafc',
      borderColor: '#cbd5e1'
    },
    formFieldInput: {
      flex: 1,
      paddingVertical: 10,
      fontSize: 13,
      color: isLight ? '#0f172a' : '#f8fafc',
      outlineStyle: 'none'
    },
    formFieldInputLight: {
      color: '#0f172a'
    },
    passwordGridRow: {
      flexDirection: 'row',
      gap: 12
    },
    empRoleChip: {
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 7,
      backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
      borderWidth: 1,
      borderColor: isLight ? '#cbd5e1' : '#334155',
      cursor: 'pointer'
    },
    empRoleChipLight: {
      backgroundColor: '#f1f5f9',
      borderColor: '#cbd5e1'
    },
    empRoleChipActive: {
      backgroundColor: '#0284c7',
      borderColor: '#0284c7'
    },
    empRoleChipText: {
      fontSize: 11,
      fontWeight: '600',
      color: isLight ? '#475569' : '#94a3b8'
    },
    empRoleChipTextLight: {
      color: '#475569'
    },
    empRoleChipTextActive: {
      color: '#ffffff',
      fontWeight: '700'
    },
    btnCreateEmployee: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: '#059669',
      paddingVertical: 12,
      borderRadius: 8,
      cursor: 'pointer',
      marginTop: 4,
      boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)'
    },
    btnCreateEmployeeText: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '700'
    },
    accountsListCard: {
      width: '100%',
      backgroundColor: isLight ? '#ffffff' : '#0f172a',
      borderRadius: 12,
      padding: 22,
      borderWidth: 1,
      borderColor: isLight ? '#e2e8f0' : '#1e293b',
      gap: 14,
      boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.04)' : undefined
    },
    accountsListCardLight: {
      backgroundColor: '#ffffff',
      borderColor: '#e2e8f0'
    },
    employeeRowCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: isLight ? '#f8fafc' : '#0c1322',
      borderWidth: 1,
      borderColor: isLight ? '#e2e8f0' : '#1e293b',
      gap: 12,
      flexWrap: 'wrap'
    },
    employeeRowCardLight: {
      backgroundColor: '#f8fafc',
      borderColor: '#e2e8f0'
    },
    empAvatarCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: '#0284c7',
      alignItems: 'center',
      justifyContent: 'center'
    },
    empAvatarInitials: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '700'
    },
    empNameText: {
      fontSize: 13,
      fontWeight: '700',
      color: isLight ? '#0f172a' : '#f8fafc'
    },
    empNameTextLight: {
      color: '#0f172a'
    },
    empEmailText: {
      fontSize: 11,
      color: isLight ? '#64748b' : '#94a3b8'
    },
    empEmailTextLight: {
      color: '#64748b'
    },
    empRoleBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: isLight ? '#e0f2fe' : 'rgba(2, 132, 199, 0.15)',
      borderWidth: 1,
      borderColor: isLight ? '#bae6fd' : 'rgba(2, 132, 199, 0.3)'
    },
    empRoleBadgeLight: {
      backgroundColor: '#e0f2fe',
      borderColor: '#bae6fd'
    },
    empRoleBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: isLight ? '#0284c7' : '#38bdf8'
    },
    empRoleBadgeTextLight: {
      color: '#0284c7'
    },
    empDeleteBtn: {
      padding: 7,
      borderRadius: 6,
      backgroundColor: isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.1)',
      borderWidth: 1,
      borderColor: isLight ? '#fca5a5' : 'rgba(239, 68, 68, 0.25)',
      cursor: 'pointer'
    },

    // TOP PROFESSIONAL HEADER BAR
    topHeader: {
      height: 64,
      backgroundColor: isLight ? '#ffffff' : '#0c1322',
      borderBottomWidth: 1,
      borderBottomColor: isLight ? '#e2e8f0' : '#1e293b',
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
      backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isLight ? '#cbd5e1' : '#334155'
    },
    sidebarToggleBtnLight: {
      backgroundColor: '#f1f5f9',
      borderColor: '#cbd5e1'
    },
    sidebarToggleBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: isLight ? '#0284c7' : '#38bdf8'
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
      color: isLight ? '#0f172a' : '#ffffff',
      letterSpacing: 0.5
    },
    brandTitleLight: {
      color: '#0f172a'
    },
    brandSub: {
      fontSize: 10,
      color: isLight ? '#64748b' : '#94a3b8',
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
      backgroundColor: isLight ? '#f8fafc' : '#090d16',
      borderWidth: 1,
      borderColor: isLight ? '#cbd5e1' : '#1e293b',
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
      color: isLight ? '#0f172a' : '#f8fafc',
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
      boxShadow: '0 2px 10px rgba(5, 150, 105, 0.35)',
      transition: 'transform 0.18s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.18s ease, filter 0.15s ease'
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
      backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isLight ? '#cbd5e1' : '#334155'
    },
    heroExportBtnLight: {
      backgroundColor: '#f1f5f9',
      borderColor: '#cbd5e1'
    },
    heroExportBtnText: {
      color: isLight ? '#059669' : '#10b981',
      fontSize: 12,
      fontWeight: '600'
    },
    heroExportBtnTextLight: {
      color: '#059669'
    },
    headerIconBtn: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
      borderWidth: 1,
      borderColor: isLight ? '#cbd5e1' : '#334155'
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
      backgroundColor: isLight ? '#ecfdf5' : 'rgba(52, 211, 153, 0.12)',
      borderWidth: 1,
      borderColor: isLight ? '#a7f3d0' : 'rgba(52, 211, 153, 0.25)'
    },
    headerSyncPillLight: {
      backgroundColor: '#ecfdf5',
      borderColor: '#a7f3d0'
    },
    headerSyncText: {
      fontSize: 11,
      fontWeight: '600',
      color: isLight ? '#059669' : '#34d399'
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
      backgroundColor: isLight ? '#0284c7' : '#0284c7',
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
      backgroundColor: isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.1)',
      borderWidth: 1,
      borderColor: isLight ? '#fca5a5' : 'rgba(239, 68, 68, 0.25)'
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
      backgroundColor: isLight ? '#ffffff' : '#0c1322',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isLight ? '#e2e8f0' : '#1e293b',
      padding: 14,
      gap: 4,
      boxShadow: isLight ? '0 2px 8px rgba(0, 0, 0, 0.04)' : '0 2px 8px rgba(0, 0, 0, 0.2)',
      transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease, border-color 0.2s ease'
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
      borderColor: isLight ? '#38bdf8' : '#0284c7',
      backgroundColor: isLight ? '#f0f9ff' : 'rgba(2, 132, 199, 0.15)'
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
      color: isLight ? '#64748b' : '#94a3b8',
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
      color: isLight ? '#94a3b8' : '#64748b'
    },
    statCardSubLight: {
      color: '#64748b'
    },
    // 2. HORIZONTAL CATEGORY NAVIGATION TABS
    categoryNavBar: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: isLight ? '#e2e8f0' : '#1e293b',
      backgroundColor: isLight ? '#f8fafc' : '#0c1322'
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
      backgroundColor: isLight ? '#ffffff' : '#0f172a',
      borderWidth: 1,
      borderColor: isLight ? '#e2e8f0' : '#1e293b',
      transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    categoryTabLight: {
      backgroundColor: '#ffffff',
      borderColor: '#cbd5e1'
    },
    categoryTabActive: {
      backgroundColor: isLight ? '#e0f2fe' : '#1e293b',
      borderColor: isLight ? '#0284c7' : '#38bdf8'
    },
    categoryTabActiveLight: {
      backgroundColor: '#e0f2fe',
      borderColor: '#0284c7'
    },
    categoryTabText: {
      fontSize: 12,
      fontWeight: '600',
      color: isLight ? '#64748b' : '#94a3b8'
    },
    categoryTabTextLight: {
      color: '#475569'
    },
    categoryTabTextActive: {
      color: isLight ? '#0284c7' : '#38bdf8',
      fontWeight: isLight ? '700' : '700'
    },
    categoryTabTextActiveLight: {
      color: '#0284c7',
      fontWeight: '700'
    },
    categoryTabBadge: {
      backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
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
      color: isLight ? '#64748b' : '#94a3b8'
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
      backgroundColor: isLight ? '#f8fafc' : '#0c1322',
      borderBottomWidth: 1,
      borderBottomColor: isLight ? '#e2e8f0' : '#1e293b',
      flexWrap: 'wrap'
    },
    subFilterRowLight: {
      backgroundColor: '#f8fafc',
      borderBottomColor: '#e2e8f0'
    },
    subFilterHeading: {
      fontSize: 11,
      fontWeight: '700',
      color: isLight ? '#64748b' : '#94a3b8',
      marginRight: 4
    },
    subFilterHeadingLight: {
      color: '#64748b'
    },
    subFilterChip: {
      paddingHorizontal: 11,
      paddingVertical: 5,
      borderRadius: 20,
      backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
      borderWidth: 1,
      borderColor: isLight ? '#cbd5e1' : '#334155',
      transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    subFilterChipLight: {
      backgroundColor: '#ffffff',
      borderColor: '#cbd5e1'
    },
    subFilterChipActive: {
      backgroundColor: isLight ? '#0284c7' : '#0284c7',
      borderColor: isLight ? '#0284c7' : '#38bdf8'
    },
    subFilterChipActiveLight: {
      backgroundColor: '#0284c7',
      borderColor: '#0284c7'
    },
    subFilterChipText: {
      fontSize: 11,
      fontWeight: '600',
      color: isLight ? '#475569' : '#cbd5e1'
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
      backgroundColor: isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.12)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: isLight ? '#fecaca' : 'rgba(239, 68, 68, 0.25)',
      marginLeft: 6
    },
    clearFilterBtnLight: {
      backgroundColor: '#fef2f2',
      borderColor: '#fecaca'
    },
    clearFilterBtnText: {
      fontSize: 11,
      fontWeight: '600',
      color: isLight ? '#dc2626' : '#f87171'
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
      borderColor: '#34d399',
      animation: 'pulseGlow 2.8s infinite',
      transition: 'transform 0.18s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.18s ease'
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
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
      animation: 'toastSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
      transition: 'all 0.2s ease'
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
      position: 'relative',
      backgroundColor: isLight ? '#f1f5f9' : undefined
    },
    // Sidebar Tree
    sidebar: {
      width: 290,
      backgroundColor: isLight ? '#ffffff' : '#0f172a',
      borderRightWidth: 1,
      borderRightColor: isLight ? '#e2e8f0' : '#1e293b',
      flexDirection: 'column'
    },
    sidebarCompanyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: isLight ? '#e2e8f0' : '#1e293b',
      backgroundColor: isLight ? '#f8fafc' : '#0c1322'
    },
    sidebarCompanyHeaderLight: {
      backgroundColor: '#f8fafc',
      borderBottomColor: '#e2e8f0'
    },
    sidebarLogoBox: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: '#ffffff',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: '#f97316',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(249, 115, 22, 0.25)'
    },
    sidebarCompanyName: {
      fontSize: 12,
      fontWeight: '800',
      color: isLight ? '#0f172a' : '#f8fafc',
      letterSpacing: 0.3
    },
    sidebarCompanyNameLight: {
      color: '#0f172a'
    },
    sidebarCompanySub: {
      fontSize: 10,
      fontWeight: '500',
      color: isLight ? '#64748b' : '#94a3b8'
    },
    sidebarCompanySubLight: {
      color: '#94a3b8'
    },
    sidebarTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: isLight ? '#e2e8f0' : '#1e293b'
    },
    sidebarCollapseBtn: {
      padding: 6,
      borderRadius: 6,
      backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
      cursor: 'pointer',
      alignItems: 'center',
      justifyContent: 'center'
    },
    sidebarSectionTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: isLight ? '#64748b' : '#94a3b8',
      letterSpacing: 0.8
    },
    treeScroll: {
      flex: 1,
      paddingHorizontal: 10,
      paddingVertical: 10
    },
    separator: {
      height: 1,
      backgroundColor: isLight ? '#e2e8f0' : '#1e293b',
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
      backgroundColor: isLight ? '#e0f2fe' : 'rgba(2, 132, 199, 0.15)',
      borderColor: isLight ? '#bae6fd' : 'rgba(2, 132, 199, 0.4)'
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
      color: isLight ? '#334155' : '#cbd5e1',
      fontWeight: '500'
    },
    treeTextActive: {
      color: isLight ? '#0284c7' : '#38bdf8',
      fontWeight: '700'
    },
    treeChildren: {
      paddingLeft: 22,
      marginTop: 2,
      animation: 'accordionDown 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
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
      backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
      borderWidth: 1,
      borderColor: isLight ? '#e2e8f0' : '#334155'
    },
    monthMiniPillActive: {
      backgroundColor: isLight ? '#0284c7' : '#0284c7',
      borderColor: isLight ? '#0284c7' : '#38bdf8'
    },
    monthMiniPillText: {
      fontSize: 10,
      fontWeight: '600',
      color: isLight ? '#475569' : '#94a3b8'
    },
    monthMiniPillTextActive: {
      color: '#ffffff',
      fontWeight: '700'
    },
    // Main Content Area
    contentArea: {
      flex: 1,
      flexDirection: 'column',
      backgroundColor: isLight ? '#f8fafc' : '#090d16'
    },
    controlBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isLight ? '#e2e8f0' : '#1e293b',
      backgroundColor: isLight ? '#ffffff' : '#0f172a'
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
      color: isLight ? '#64748b' : '#94a3b8'
    },
    breadcrumbActive: {
      fontSize: 14,
      color: isLight ? '#0f172a' : '#f8fafc',
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
      backgroundColor: isLight ? '#f8fafc' : '#0b1120',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      minHeight: 40,
      width: 260,
      borderWidth: 1,
      borderColor: isLight ? '#cbd5e1' : '#334155',
      gap: 10
    },
    searchInput: {
      flex: 1,
      color: isLight ? '#0f172a' : '#f8fafc',
      fontSize: 13,
      paddingVertical: 0,
      outlineStyle: 'none'
    },
    countBadge: {
      backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isLight ? '#cbd5e1' : '#334155'
    },
    countBadgeText: {
      fontSize: 12,
      color: isLight ? '#475569' : '#cbd5e1',
      fontWeight: '600'
    },
    cachePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: isLight ? '#ecfdf5' : 'rgba(52, 211, 153, 0.12)',
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isLight ? '#a7f3d0' : 'rgba(52, 211, 153, 0.25)'
    },
    cachePillText: {
      fontSize: 11,
      color: isLight ? '#059669' : '#34d399',
      fontWeight: '600'
    },
    allFilesToggleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
      borderWidth: 1,
      borderColor: isLight ? '#cbd5e1' : '#334155',
      paddingVertical: 4,
      paddingHorizontal: 9,
      borderRadius: 8,
      cursor: 'pointer'
    },
    allFilesToggleBtnActive: {
      backgroundColor: isLight ? '#e0f2fe' : 'rgba(2, 132, 199, 0.15)',
      borderColor: isLight ? '#38bdf8' : '#0284c7'
    },
    allFilesToggleBtnText: {
      fontSize: 11,
      fontWeight: '600',
      color: isLight ? '#475569' : '#94a3b8'
    },
    allFilesToggleBtnTextActive: {
      color: isLight ? '#0284c7' : '#38bdf8'
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
      cursor: 'pointer',
      transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)'
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
      backgroundColor: isLight ? '#e2e8f0' : '#1e293b',
      borderWidth: 1,
      borderColor: isLight ? '#cbd5e1' : '#334155',
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
      backgroundColor: isLight ? '#94a3b8' : '#64748b'
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
      width: '100%',
      minWidth: 980,
      paddingHorizontal: 20,
      paddingVertical: 14
    },
    tableRowHeader: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isLight ? '#e2e8f0' : '#0c1322',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 6,
      marginBottom: 4,
      borderBottomColor: isLight ? '#cbd5e1' : '#1e293b'
    },
    th: {
      fontSize: 11,
      fontWeight: '700',
      color: isLight ? '#475569' : '#94a3b8',
      letterSpacing: 0.5
    },
    tableRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: isLight ? '#e2e8f0' : '#1e293b',
      backgroundColor: isLight ? '#ffffff' : '#0f172a',
      transition: 'background-color 0.15s ease, transform 0.15s ease'
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
      borderColor: isLight ? '#cbd5e1' : '#334155'
    },
    statusTag: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      alignSelf: 'flex-start',
      borderColor: isLight ? 'transparent' : undefined,
      backgroundColor: isLight ? '#f1f5f9' : '#1e293b'
    },
    statusTagSuccess: {
      backgroundColor: isLight ? '#ecfdf5' : 'rgba(52, 211, 153, 0.15)',
      borderWidth: 1,
      borderColor: isLight ? '#a7f3d0' : 'rgba(52, 211, 153, 0.3)'
    },
    statusTagDanger: {
      backgroundColor: isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.15)',
      borderWidth: 1,
      borderColor: isLight ? '#fecaca' : 'rgba(239, 68, 68, 0.3)'
    },
    statusTagInfo: {
      backgroundColor: isLight ? '#f0f9ff' : 'rgba(56, 189, 248, 0.15)',
      borderWidth: 1,
      borderColor: isLight ? '#bae6fd' : 'rgba(56, 189, 248, 0.3)'
    },
    statusTagText: {
      fontSize: 10,
      fontWeight: '700',
      color: isLight ? '#0f172a' : '#e2e8f0'
    },
    // Loading & Empty states
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12
    },
    loadingText: {
      color: isLight ? '#64748b' : '#94a3b8',
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
      color: isLight ? '#0f172a' : '#f8fafc'
    },
    emptySubtitle: {
      fontSize: 13,
      color: isLight ? '#64748b' : '#94a3b8',
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
      backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
      borderWidth: 1,
      borderColor: isLight ? '#cbd5e1' : '#334155'
    },
    btnSecondaryText: {
      color: isLight ? '#475569' : '#94a3b8',
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
    modalCard: {
      backgroundColor: isLight ? '#ffffff' : '#0f172a',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isLight ? '#e2e8f0' : '#1e293b',
      boxShadow: isLight ? '0 25px 60px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(0, 0, 0, 0.08)' : '0 25px 60px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.1)',
      overflow: 'hidden'
    },
    modalCardLight: {
      backgroundColor: '#ffffff',
      borderColor: '#e2e8f0',
      boxShadow: '0 25px 60px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(0, 0, 0, 0.08)'
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: isLight ? 'rgba(15, 23, 42, 0.55)' : 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      animation: 'fadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
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
      borderColor: isLight ? '#cbd5e1' : '#1e293b',
      flexDirection: 'column',
      overflow: 'hidden',
      animation: 'modalSlideUp 0.26s cubic-bezier(0.16, 1, 0.3, 1)'
    },
    viewerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: isLight ? '#f8fafc' : '#0c1322',
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
      flex: 1,
      flexGrow: 1,
      flexShrink: 1,
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
      color: isLight ? '#64748b' : '#94a3b8',
      marginBottom: 4
    },
    viewerStatValue: {
      fontSize: 14,
      fontWeight: '700',
      color: isLight ? '#0f172a' : '#f8fafc'
    },
    viewerSection: {
      marginBottom: 20,
      backgroundColor: isLight ? '#ffffff' : '#0f172a',
      borderColor: isLight ? '#e2e8f0' : '#1e293b'
    },
    viewerSectionTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: isLight ? '#0284c7' : '#38bdf8',
      letterSpacing: 0.5,
      marginBottom: 10
    },
    notesBox: {
      backgroundColor: isLight ? '#f8fafc' : '#0c1322',
      borderRadius: 8,
      padding: 14,
      borderWidth: 1,
      borderColor: isLight ? '#e2e8f0' : '#1e293b'
    },
    notesText: {
      fontSize: 13,
      color: isLight ? '#1e293b' : '#94a3b8',
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
      borderColor: isLight ? '#cbd5e1' : '#1e293b',
      flexDirection: 'column',
      overflow: 'hidden',
      animation: 'modalSlideUp 0.26s cubic-bezier(0.16, 1, 0.3, 1)'
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: isLight ? '#f8fafc' : '#0c1322',
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
      flex: 1,
      flexGrow: 1,
      flexShrink: 1,
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
      backgroundColor: isLight ? '#f8fafc' : '#0c1322',
      borderTopWidth: 1,
      borderTopColor: isLight ? '#e2e8f0' : '#1e293b'
    },
    // Options Screen (The Two Cards)
    optionsBody: {
      flex: 1,
      flexGrow: 1,
      flexShrink: 1,
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
      backgroundColor: isLight ? '#ffffff' : '#0c1322',
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
      color: isLight ? '#64748b' : '#94a3b8'
    },
    optionDescription: {
      fontSize: 12,
      color: isLight ? '#475569' : '#cbd5e1',
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
      borderColor: isLight ? '#cbd5e1' : '#334155',
      borderStyle: 'dashed',
      borderRadius: 12,
      backgroundColor: isLight ? '#f8fafc' : '#0c1322',
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
      color: isLight ? '#0f172a' : '#f8fafc'
    },
    dropzoneSub: {
      fontSize: 13,
      color: isLight ? '#64748b' : '#94a3b8',
      textAlign: 'center'
    },
    supportedFormatsPill: {
      backgroundColor: isLight ? '#e2e8f0' : '#1e293b',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#334155',
      marginTop: 4
    },
    supportedFormatsText: {
      color: isLight ? '#475569' : '#94a3b8',
      fontSize: 11,
      fontWeight: '600'
    },
    selectedFileContainer: {
      backgroundColor: isLight ? '#f8fafc' : '#0c1322',
      borderRadius: 10,
      padding: 16,
      borderWidth: 1,
      borderColor: isLight ? '#cbd5e1' : '#1e293b'
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
      color: isLight ? '#0f172a' : '#f8fafc',
      fontFamily: 'JetBrains Mono, monospace'
    },
    selectedFileSize: {
      fontSize: 12,
      color: isLight ? '#64748b' : '#94a3b8',
      marginTop: 2
    },
    removeFileBtn: {
      padding: 6,
      borderRadius: 6,
      backgroundColor: 'rgba(239, 68, 68, 0.1)'
    },
    insertMetaBox: {
      backgroundColor: isLight ? '#f8fafc' : '#0c1322',
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isLight ? '#e2e8f0' : '#1e293b'
    },
    insertMetaLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: isLight ? '#64748b' : '#94a3b8',
      marginBottom: 2
    },
    insertMetaValue: {
      fontSize: 13,
      fontWeight: '600',
      color: isLight ? '#0f172a' : '#f8fafc'
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
      backgroundColor: isLight ? '#ffffff' : '#0c1322',
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: isLight ? '#e2e8f0' : '#1e293b'
    },
    receiptTypeCardActive: {
      borderColor: isLight ? '#0284c7' : '#38bdf8',
      backgroundColor: isLight ? '#f0f9ff' : 'rgba(2, 132, 199, 0.15)'
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
      color: isLight ? '#0f172a' : '#cbd5e1'
    },
    receiptTypeNameActive: {
      color: '#38bdf8'
    },
    receiptTypeDesc: {
      fontSize: 11,
      color: isLight ? '#64748b' : '#64748b',
      lineHeight: 15,
      marginBottom: 8
    },
    receiptEntityBadge: {
      backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      alignSelf: 'flex-start'
    },
    receiptEntityBadgeText: {
      fontSize: 10,
      color: isLight ? '#0284c7' : '#38bdf8',
      fontWeight: '600'
    },
    scanMetaInputsCard: {
      backgroundColor: isLight ? '#f8fafc' : '#0c1322',
      borderRadius: 10,
      padding: 14,
      borderWidth: 1,
      borderColor: isLight ? '#e2e8f0' : '#1e293b',
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
      backgroundColor: isLight ? '#ffffff' : '#0c1322',
      borderRadius: 10,
      padding: 20,
      borderWidth: 1,
      borderColor: isLight ? '#cbd5e1' : '#1e293b',
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
      color: isLight ? '#0f172a' : '#f8fafc'
    },
    scanOptionSub: {
      fontSize: 11,
      color: isLight ? '#64748b' : '#94a3b8',
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
    scannerLaserLine: {
      position: 'absolute',
      left: 8,
      right: 8,
      height: 2,
      backgroundColor: '#38bdf8',
      boxShadow: '0 0 12px 3px rgba(56, 189, 248, 0.9)',
      animation: 'scannerLaser 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate',
      zIndex: 10
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
      left: 0,
      right: 0,
      justifyContent: 'center',
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
      backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isLight ? '#cbd5e1' : '#334155'
    },
    btnFlipCameraText: {
      color: isLight ? '#334155' : '#cbd5e1',
      fontSize: 12,
      fontWeight: '600'
    },
    btnCancelCamera: {
      backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isLight ? '#cbd5e1' : '#334155'
    },
    btnCancelCameraText: {
      color: isLight ? '#334155' : '#cbd5e1',
      fontSize: 12
    },
    scanSavingCard: {
      backgroundColor: isLight ? '#ffffff' : '#131d31',
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
      color: isLight ? '#64748b' : '#94a3b8',
      fontSize: 12,
      textAlign: 'center'
    },
    // OCR Scanning & Data Verification Styles
    ocrScanningCard: {
      backgroundColor: isLight ? '#ffffff' : '#131d31',
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
      color: isLight ? '#64748b' : '#94a3b8',
      fontSize: 13,
      textAlign: 'center'
    },
    ocrProgressBarBg: {
      width: '100%',
      maxWidth: 320,
      height: 6,
      backgroundColor: isLight ? '#e2e8f0' : '#1e293b',
      borderRadius: 3,
      overflow: 'hidden',
      marginTop: 6
    },
    ocrProgressBarFill: {
      height: '100%',
      backgroundColor: '#38bdf8',
      borderRadius: 3,
      transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    ocrErrorCard: {
      backgroundColor: isLight ? '#ffffff' : '#0f172a',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1.5,
      borderColor: isLight ? '#fca5a5' : '#7f1d1d',
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
      backgroundColor: isLight ? '#f8fafc' : '#0c1322',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: isLight ? '#cbd5e1' : '#1e293b',
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
      color: isLight ? '#0f172a' : '#f8fafc'
    },
    ocrPreviewRow: {
      flexDirection: 'row',
      gap: 14,
      alignItems: 'center',
      backgroundColor: isLight ? '#ffffff' : '#0f172a',
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isLight ? '#e2e8f0' : '#1e293b'
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
      color: isLight ? '#475569' : '#cbd5e1'
    },
    ocrFieldInput: {
      backgroundColor: isLight ? '#ffffff' : '#0c1322',
      borderWidth: 1,
      borderColor: isLight ? '#cbd5e1' : '#334155',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 9,
      color: isLight ? '#0f172a' : '#f8fafc',
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
      backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
      borderWidth: 1,
      borderColor: isLight ? '#cbd5e1' : '#334155',
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 8
    },
    btnRetakeOcrText: {
      color: isLight ? '#475569' : '#94a3b8',
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
      backgroundColor: isLight ? '#f8fafc' : '#0c1322',
      borderRadius: 8,
      padding: 14,
      borderWidth: 1,
      borderColor: isLight ? '#e2e8f0' : '#1e293b',
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
      color: isLight ? '#475569' : '#cbd5e1'
    },
    scannedInput: {
      flex: 1,
      backgroundColor: isLight ? '#ffffff' : '#1e293b',
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      color: isLight ? '#0f172a' : '#f8fafc',
      fontSize: 12,
      borderWidth: 1,
      borderColor: isLight ? '#cbd5e1' : '#334155',
      outlineStyle: 'none'
    },
    retakeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 8,
      borderRadius: 6,
      backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
      marginTop: 4
    },
    retakeBtnText: {
      color: isLight ? '#475569' : '#94a3b8',
      fontSize: 12,
      fontWeight: '600'
    },
    // Auth Styles
    authContainer: {
      flex: 1,
      minHeight: '100vh',
      backgroundColor: isLight ? '#f1f5f9' : '#0b1120',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    },
    authCard: {
      width: 440,
      maxWidth: '100%',
      backgroundColor: isLight ? '#ffffff' : '#0f172a',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isLight ? '#e2e8f0' : '#1e293b',
      padding: 30,
      boxShadow: isLight ? '0 20px 40px rgba(0, 0, 0, 0.08)' : '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
    },
    authHeader: {
      alignItems: 'center',
      marginBottom: 20
    },
    authShieldIconBox: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: isLight ? 'rgba(52, 211, 153, 0.15)' : 'rgba(52, 211, 153, 0.1)',
      borderWidth: 1,
      borderColor: isLight ? 'rgba(52, 211, 153, 0.35)' : 'rgba(52, 211, 153, 0.3)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12
    },
    authBadgePill: {
      backgroundColor: isLight ? 'rgba(2, 132, 199, 0.1)' : 'rgba(56, 189, 248, 0.12)',
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 20,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: isLight ? 'rgba(2, 132, 199, 0.25)' : 'rgba(56, 189, 248, 0.3)'
    },
    authBadgePillText: {
      color: isLight ? '#0284c7' : '#38bdf8',
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8
    },
    authTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: isLight ? '#0f172a' : '#f8fafc',
      marginBottom: 6,
      textAlign: 'center'
    },
    authSubtitle: {
      fontSize: 13,
      color: isLight ? '#64748b' : '#94a3b8',
      textAlign: 'center',
      lineHeight: 18
    },
    authTabs: {
      flexDirection: 'row',
      backgroundColor: isLight ? '#f1f5f9' : '#0b1120',
      borderRadius: 8,
      padding: 4,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isLight ? '#e2e8f0' : '#1e293b'
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
      backgroundColor: isLight ? '#ffffff' : '#1e293b'
    },
    authTabText: {
      fontSize: 12,
      fontWeight: '600',
      color: isLight ? '#64748b' : '#94a3b8'
    },
    authTabTextActive: {
      color: isLight ? '#0284c7' : '#38bdf8',
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
      color: isLight ? '#334155' : '#94a3b8',
      letterSpacing: 0.5
    },
    authInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isLight ? '#ffffff' : '#0b1120',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isLight ? '#cbd5e1' : '#334155',
      paddingHorizontal: 12,
      gap: 8,
      position: 'relative'
    },
    authInputIcon: {
      marginRight: 8
    },
    authInput: {
      flex: 1,
      paddingVertical: 10,
      color: isLight ? '#0f172a' : '#f8fafc',
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
      backgroundColor: isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(52, 211, 153, 0.08)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isLight ? 'rgba(16, 185, 129, 0.25)' : 'rgba(52, 211, 153, 0.2)'
    },
    adminSecurityNoticeText: {
      color: isLight ? '#047857' : '#34d399',
      fontSize: 11,
      fontWeight: '600'
    },
    // Sidebar Admin User Styles
    sidebarAdminBox: {
      borderTopWidth: 1,
      borderTopColor: isLight ? '#e2e8f0' : '#1e293b',
      padding: 12,
      backgroundColor: isLight ? '#f8fafc' : '#0c1322',
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
      color: isLight ? '#64748b' : '#94a3b8',
      fontSize: 10
    },
    adminBadgePill: {
      backgroundColor: isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.12)',
      borderWidth: 1,
      borderColor: isLight ? '#bae6fd' : 'rgba(56, 189, 248, 0.25)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4
    },
    adminBadgePillText: {
      color: isLight ? '#0284c7' : '#38bdf8',
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
      backgroundColor: isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.1)',
      borderWidth: 1,
      borderColor: isLight ? '#fca5a5' : 'rgba(239, 68, 68, 0.25)',
      cursor: 'pointer'
    },
    sidebarLogoutBtnText: {
      color: isLight ? '#dc2626' : '#f87171',
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
      backgroundColor: isLight ? '#ffffff' : '#0c1322',
      borderBottomWidth: 1,
      borderBottomColor: isLight ? '#e2e8f0' : '#1e293b',
      zIndex: 100
    },
    mobileMenuBtn: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isLight ? '#f1f5f9' : '#1e293b'
    },
    mobileTitleBlock: {
      alignItems: 'center',
      flex: 1,
      paddingHorizontal: 8
    },
    mobileAppTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: isLight ? '#0f172a' : '#f8fafc',
      letterSpacing: 0.5
    },
    mobileAppSub: {
      fontSize: 11,
      color: isLight ? '#64748b' : '#94a3b8',
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
      backdropFilter: 'blur(3px)',
      zIndex: 998,
      animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
    },
    mobileSidebarDrawer: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      width: '85%',
      maxWidth: 320,
      height: '100%',
      backgroundColor: isLight ? '#ffffff' : '#0f172a',
      borderRightWidth: 1,
      borderRightColor: isLight ? '#e2e8f0' : '#1e293b',
      zIndex: 999,
      boxShadow: '10px 0 30px rgba(0, 0, 0, 0.8)',
      animation: 'slideInLeft 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
    },
    mobileCloseDrawerBtn: {
      padding: 6,
      borderRadius: 6,
      backgroundColor: isLight ? '#f1f5f9' : '#1e293b'
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
      backgroundColor: isLight ? '#ffffff' : '#0f172a',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isLight ? '#e2e8f0' : '#1e293b',
      padding: 14,
      marginBottom: 10,
      gap: 10,
      transition: 'transform 0.18s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.18s ease, border-color 0.18s ease'
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
      backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
      alignItems: 'center',
      justifyContent: 'center'
    },
    mobileCardTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: isLight ? '#0f172a' : '#f8fafc'
    },
    mobileCardCategory: {
      fontSize: 11,
      color: isLight ? '#64748b' : '#94a3b8'
    },
    mobileCardMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: isLight ? '#f8fafc' : '#0b1120',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: isLight ? '#e2e8f0' : '#1e293b'
    },
    mobileMetaItem: {
      alignItems: 'center'
    },
    mobileMetaLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: isLight ? '#64748b' : '#64748b',
      letterSpacing: 0.5,
      marginBottom: 2
    },
    mobileMetaVal: {
      fontSize: 12,
      fontWeight: '600',
      color: isLight ? '#0f172a' : '#e2e8f0'
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
      backgroundColor: isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.1)',
      paddingVertical: 8,
      borderRadius: 6,
      borderColor: isLight ? '#bae6fd' : 'rgba(56, 189, 248, 0.25)'
    },
    mobileBtnViewText: {
      fontSize: 12,
      fontWeight: '700',
      color: isLight ? '#0284c7' : '#38bdf8'
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
      backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
      borderWidth: 1,
      borderColor: isLight ? '#cbd5e1' : '#334155',
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
      color: isLight ? '#475569' : '#cbd5e1'
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
      backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
      borderWidth: 1,
      borderColor: isLight ? '#cbd5e1' : '#334155',
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
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
      animation: 'modalSlideUp 0.26s cubic-bezier(0.16, 1, 0.3, 1)'
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

