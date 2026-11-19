import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import {
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Edit3,
  Trash2
} from 'lucide-react';

export default function DocumentCardsView({
  filteredItems,
  onViewItem,
  onRenameItem,
  onDeleteItem,
  isLight,
  styles
}) {
  return (
    <ScrollView style={styles.mobileCardList} showsVerticalScrollIndicator={false}>
      {filteredItems.map((item, idx) => (
        <TouchableOpacity
          key={item.id}
          style={[styles.mobileCard, isLight && styles.mobileCardLight]}
          onPress={() => onViewItem(item)}
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
              <Text style={[styles.mobileCardTitle, isLight && styles.mobileCardTitleLight]} numberOfLines={1}>
                {item.fileName}
              </Text>
              <Text style={[styles.mobileCardCategory, isLight && styles.mobileCardCategoryLight]} numberOfLines={1}>
                {item.category} • {item.entity}
              </Text>
            </View>
            <View style={[styles.mobileCardBadge, isLight && styles.mobileCardBadgeLight]}>
              <Text style={[styles.mobileCardBadgeText, isLight && styles.mobileCardBadgeTextLight]}>
                {item.fileFormat || 'JPG'}
              </Text>
            </View>
          </View>

          <View style={styles.mobileCardMeta}>
            <Text style={[styles.mobileCardMetaText, isLight && styles.mobileCardMetaTextLight]}>
              {item.scannedDate || item.createdAt || (item.year ? `${item.year} ${item.month !== 'CURRENT' ? item.month : ''}`.trim() : item.receiptDate || '-')}
            </Text>
            {item.amount > 0 && (
              <Text style={[styles.mobileCardAmount, isLight && styles.mobileCardAmountLight]}>
                ₱{parseFloat(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>
            )}
          </View>

          <View style={styles.mobileCardFooter}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={[styles.statusDot, { backgroundColor: item.status === 'Verified' ? '#10b981' : '#f59e0b' }]} />
              <Text style={[styles.mobileCardStatusText, isLight && styles.mobileCardStatusTextLight]}>
                {item.status || 'Verified'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TouchableOpacity
                style={[styles.btnActionIcon, isLight && styles.btnActionIconLight]}
                onPress={(e) => {
                  e.stopPropagation?.();
                  onRenameItem(item);
                }}
                title="Rename Document"
              >
                <Edit3 size={14} color={isLight ? '#0284c7' : '#38bdf8'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.mobileBtnDelete}
                onPress={(e) => {
                  e.stopPropagation?.();
                  onDeleteItem(item.id, item.fileName);
                }}
              >
                <Trash2 size={14} color="#f87171" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
