import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  ActivityIndicator,
  Image
} from 'react-native';
import {
  FileText,
  FileSpreadsheet,
  Calendar,
  X,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  Camera,
  ArrowLeft,
  Check,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { RECEIPT_TYPES } from '../../constants/receiptTypes';

export default function AddDocumentModal({
  showAddModal,
  addMode,
  setAddMode,
  closeAddModal,
  stopCamera,
  startCamera,
  flipCamera,
  cameraActive,
  videoRef,
  insertedFile,
  setInsertedFile,
  isUploading,
  handleDeviceFileSelect,
  handleSaveInsertedFile,
  selectedReceiptType,
  setSelectedReceiptType,
  capturedReceiptPhoto,
  setCapturedReceiptPhoto,
  isSavingScan,
  isOcrProcessing,
  ocrStatusText,
  ocrProgress,
  ocrEstablishment,
  setOcrEstablishment,
  ocrReceiptDate,
  setOcrReceiptDate,
  ocrDescription,
  setOcrDescription,
  ocrAmount,
  setOcrAmount,
  ocrOrNumber,
  setOcrOrNumber,
  isOcrVerifiedView,
  setIsOcrVerifiedView,
  ocrValidationError,
  setOcrValidationError,
  ocrReceiptName,
  setOcrReceiptName,
  saveVerifiedReceiptToDatabase,
  captureCameraSnapshotAndAutoSave,
  handleReceiptPhotoSelect,
  isLight,
  isMobile,
  styles
}) {
  return (
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
                            autoComplete="off"
                            autoCorrect={false}
                            spellCheck={false}
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
                            autoComplete="off"
                            autoCorrect={false}
                            spellCheck={false}
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
                            autoComplete="off"
                            autoCorrect={false}
                            spellCheck={false}
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
                            autoComplete="off"
                            autoCorrect={false}
                            spellCheck={false}
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
                            autoComplete="off"
                            autoCorrect={false}
                            spellCheck={false}
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
                            autoComplete="off"
                            autoCorrect={false}
                            spellCheck={false}
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
  );
}
