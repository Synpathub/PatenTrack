export enum TransactionType {
  ASSIGNMENT = 'assignment',
  SECURITY_AGREEMENT = 'security_agreement',
  RELEASE = 'release',
  MERGER = 'merger',
  NAME_CHANGE = 'name_change',
  LICENSE = 'license',
  CORRECTIVE = 'corrective',
  COURT_ORDER = 'court_order',
  GOVERNMENT_INTEREST = 'government_interest',
  NUNC_PRO_TUNC = 'nunc_pro_tunc',
  OTHER = 'other',
}

export enum PatentStatus {
  APPLICATION = 'application',
  GRANTED = 'granted',
  EXPIRED = 'expired',
  LAPSED = 'lapsed',
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  CUSTOMER_ADMIN = 'customer_admin',
  CUSTOMER_VIEWER = 'customer_viewer',
}

export enum TitleChainStatus {
  COMPLETE = 'complete',
  BROKEN = 'broken',
  PARTIAL = 'partial',
}

export enum IngestionSource {
  USPTO_DAILY_ASSIGNMENT = 'uspto_daily_assignment',
  USPTO_WEEKLY_GRANT = 'uspto_weekly_grant',
  USPTO_WEEKLY_APPLICATION = 'uspto_weekly_application',
  USPTO_MONTHLY_CPC = 'uspto_monthly_cpc',
  USPTO_MAINTENANCE = 'uspto_maintenance',
  EPO_FAMILY = 'epo_family',
  EPO_LEGAL_STATUS = 'epo_legal_status',
}

export enum IngestionJobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PARTIAL = 'partial',
}

export enum EntityType {
  COMPANY = 'company',
  INDIVIDUAL = 'individual',
  GOVERNMENT = 'government',
}
