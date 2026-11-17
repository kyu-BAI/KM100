import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://vgiqeackhpxhmyozlcux.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_kDWsZKe-UHiM_uaDTygtCg_72YO3_cP';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Database mappers matching public.inventory_items table
export function mapFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    fileName: row.file_name,
    title: row.title || row.file_name,
    category: row.category,
    categoryId: row.category_id,
    subCategory: row.sub_category,
    subCategoryId: row.sub_category_id,
    entity: row.entity,
    year: row.year,
    month: row.month,
    amount: Number(row.amount) || 0,
    currency: row.currency || 'PHP',
    quantity: Number(row.quantity) || 0,
    unit: row.unit || '',
    status: row.status || 'Active',
    fileFormat: row.file_format || 'PDF',
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
