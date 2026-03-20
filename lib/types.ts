export type SiteType = 'office' | 'underground' | 'open_pit' | 'processing'
export type RfqStatus = 'draft' | 'sent' | 'partial' | 'complete' | 'awarded' | 'closed'
export type VendorStatus = 'pending' | 'approved' | 'suspended'
export type PoStage = 'ordered' | 'delivered' | 'invoiced' | 'paid'
export type DocType = 'license' | 'tax' | 'nssa' | 'iso' | 'registration' | 'profile' | 'ema' | 'other'

export interface Site {
  id: string
  name: string
  code: string
  location: string
  type: SiteType
  admin_name: string | null
  admin_email: string | null
  admin_phone: string | null
  employee_count: number
  created_at: string
  updated_at: string
}

export interface Vendor {
  id: string
  name: string
  category: string | null
  status: VendorStatus
  contact_name: string | null
  contact_role: string | null
  contact_email: string | null
  contact_phone: string | null
  address: string | null
  rating: number
  total_spend: number
  po_count: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface VendorDocument {
  id: string
  vendor_id: string
  name: string
  doc_type: DocType
  file_path: string | null
  file_size: number | null
  uploaded_at: string
  expiry_date: string | null
}

export interface Rfq {
  id: string
  ref_number: string
  title: string
  site_id: string | null
  status: RfqStatus
  created_by: string | null
  expires_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined
  site?: Site
  rfq_items?: RfqItem[]
  rfq_suppliers?: RfqSupplier[]
}

export interface RfqItem {
  id: string
  rfq_id: string
  sort_order: number
  description: string
  quantity: number
  unit: string
  specs: string | null
  created_at: string
}

export interface RfqSupplier {
  id: string
  rfq_id: string
  vendor_id: string
  token: string
  email_sent_at: string | null
  viewed_at: string | null
  submitted_at: string | null
  expires_at: string | null
  created_at: string
  // Joined
  vendor?: Vendor
  rfq_responses?: RfqResponse[]
  rfq_attachments?: RfqAttachment[]
}

export interface RfqResponse {
  id: string
  rfq_supplier_id: string
  rfq_item_id: string
  unit_price: number | null
  lead_time_days: number | null
  currency: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface RfqAttachment {
  id: string
  rfq_supplier_id: string
  name: string
  file_path: string
  file_size: number | null
  uploaded_at: string
}

export interface PurchaseOrder {
  id: string
  po_number: string
  rfq_id: string | null
  vendor_id: string
  site_id: string | null
  stage: PoStage
  total: number
  currency: string
  notes: string | null
  ordered_at: string
  delivered_at: string | null
  invoiced_at: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
  // Joined
  vendor?: Vendor
  site?: Site
  rfq?: Rfq
}
