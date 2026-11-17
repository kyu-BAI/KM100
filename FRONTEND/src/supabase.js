import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || 'https://vgiqeackhpxhmyozlcux.supabase.co';
const SUPABASE_KEY = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_KEY) || 'sb_publishable_kDWsZKe-UHiM_uaDTygtCg_72YO3_cP';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Database mappers matching public.inventory_items and dedicated receipt tables
export function mapFromDb(row) {
  if (!row) return null;
  const rawCat = row.category || 'Expenses';
  const rawCatId = row.category_id || rawCat.toLowerCase().replace(/\s+/g, '-');
  const scanDate = row.scanned_at 
    ? new Date(row.scanned_at).toISOString().split('T')[0]
    : (row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '');
  const recDate = row.receipt_date || row.preview_data?.receipt_date || '';

  return {
    id: row.id,
    fileName: row.file_name,
    title: row.title || row.file_name,
    establishment: row.establishment || row.preview_data?.establishment || '',
    receiptDate: recDate,
    scannedDate: scanDate,
    description: row.description || row.preview_data?.description || '',
    category: rawCat,
    categoryId: rawCatId,
    subCategory: row.sub_category || (row.entity ? `${row.entity} ${rawCat}` : rawCat),
    subCategoryId: row.sub_category_id || '',
    entity: row.entity || '',
    year: row.year ? String(row.year) : '',
    month: row.month ? String(row.month).toUpperCase() : '',
    amount: Number(row.amount) || 0,
    currency: row.currency || 'PHP',
    quantity: Number(row.quantity) || 1,
    unit: row.unit || 'receipt',
    status: row.status || 'Active',
    fileFormat: row.file_format || 'JPG',
    fileSize: row.file_size || '0 KB',
    filePath: row.file_path || '',
    notes: row.notes || '',
    tags: Array.isArray(row.tags) ? row.tags : [],
    previewData: row.preview_data || null,
    createdAt: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '',
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString().split('T')[0] : ''
  };
}

export function mapToDb(item) {
  return {
    id: item.id,
    file_name: item.fileName,
    title: item.title || item.fileName,
    establishment: item.establishment || '',
    receipt_date: item.receiptDate || '',
    description: item.description || '',
    category: item.category || '',
    category_id: item.categoryId || '',
    sub_category: item.subCategory || '',
    sub_category_id: item.subCategoryId || '',
    entity: item.entity || '',
    year: item.year || '',
    month: item.month || '',
    amount: Number(item.amount) || 0,
    currency: item.currency || 'PHP',
    quantity: Number(item.quantity) || 0,
    unit: item.unit || '',
    status: item.status || 'Active',
    file_format: item.fileFormat || 'PDF',
    file_size: item.fileSize || '0 KB',
    file_path: item.filePath || '',
    notes: item.notes || '',
    tags: Array.isArray(item.tags) ? item.tags : [],
    preview_data: item.previewData || null,
    updated_at: new Date().toISOString()
  };
}
