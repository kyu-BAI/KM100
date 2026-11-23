import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Image } from 'react-native';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  Download,
  Edit3,
  X,
  CreditCard,
  Building2,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function DocumentViewerModal({
  viewItem,
  onClose,
  onPrint,
  onDownload,
  onRename,
  isLight,
  isMobile,
  styles
}) {
  return (
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
                    if (onRename && viewItem) {
                      onRename(viewItem);
                    }
                  }}
                  title="Rename Document"
                >
                  <Edit3 size={16} color={isLight ? '#0284c7' : '#38bdf8'} />
                  {!isMobile && <Text style={[styles.btnOutlineText, isLight && { color: '#0284c7' }]}>Rename</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnOutline, isMobile && { paddingHorizontal: 8, paddingVertical: 6 }]}
                  onPress={() => {
                    if (!viewItem) return;
                    const blob = new Blob([JSON.stringify(viewItem, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = viewItem?.fileName || 'document.json';
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                  }}
                  title="Export Data"
                >
                  <Download size={16} color={isLight ? '#475569' : '#cbd5e1'} />
                  {!isMobile && <Text style={[styles.btnOutlineText, isLight && { color: '#475569' }]}>Export</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalCloseBtn, isLight && styles.modalCloseBtnLight]}
                  onPress={onClose}
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

                    {viewItem.previewData.rows
                      ?.filter(row => {
                        const label = String(row?.[0] || '').toLowerCase();
                        return !label.includes('target database') && !label.includes('database table');
                      })
                      ?.map((row, rIdx) => (
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
                        {Object.entries(viewItem.previewData.summary)
                          .filter(([key]) => !key.toLowerCase().includes('database') && !key.toLowerCase().includes('table'))
                          .map(([key, val]) => (
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
  );
}
