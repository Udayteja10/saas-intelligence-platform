export interface Organization {
  id: number;
  name: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface User {
  id: number;
  organizationId?: number;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ORG_ADMIN' | 'MANAGER' | 'EMPLOYEE';
  status: 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED';
  createdAt: string;
}

export interface Vendor {
  id: number;
  organizationId: number;
  name: string;
  logoUrl?: string;
  category: string;
  riskScore: number;
  website?: string;
  description?: string;
  createdAt: string;
}

export interface Subscription {
  id: number;
  organizationId: number;
  name: string;
  vendor: Vendor;
  category: string;
  plan?: string;
  cost: number;
  currency: string;
  billingCycle: 'MONTHLY' | 'ANNUAL';
  startDate: string;
  renewalDate: string;
  status: 'ACTIVE' | 'CANCELLED' | 'ARCHIVED';
  owner?: User;
  createdAt: string;
}

export interface License {
  id: number;
  organizationId: number;
  subscription: Subscription;
  name: string;
  assignedTo?: User;
  status: 'ASSIGNED' | 'AVAILABLE';
  cost: number;
  utilizationPercentage?: number;
  lastUsedAt?: string;
  createdAt: string;
}

export interface Budget {
  id: number;
  organizationId: number;
  department: 'Engineering' | 'Finance' | 'Marketing' | 'Operations' | 'HR';
  allocatedAmount: number;
  usedAmount: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface PurchaseRequest {
  id: number;
  organizationId: number;
  user: User;
  softwareName: string;
  justification?: string;
  department: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING_MANAGER' | 'PENDING_ADMIN' | 'APPROVED' | 'REJECTED';
  manager?: User;
  admin?: User;
  managerComment?: string;
  adminComment?: string;
  cost?: number;
  createdAt: string;
}

export interface Contract {
  id: number;
  organizationId: number;
  vendor: Vendor;
  name: string;
  fileName: string;
  fileSize?: number;
  version?: string;
  expirationDate: string;
  description?: string;
  createdAt: string;
}

export interface Notification {
  id: number;
  organizationId: number;
  user: User;
  title: string;
  message: string;
  type: 'RENEWAL' | 'APPROVAL' | 'BUDGET' | 'CONTRACT' | 'LICENSE';
  readStatus: 'UNREAD' | 'READ';
  createdAt: string;
}

export interface AuditLog {
  id: number;
  organizationId: number;
  user?: User;
  action: string;
  entityType?: string;
  entityId?: number;
  details?: string;
  ipAddress?: string;
  timestamp: string;
}

export interface Report {
  id: number;
  organizationId: number;
  name: string;
  type: string;
  format: 'PDF' | 'EXCEL';
  createdBy?: User;
  createdAt: string;
}

export interface HealthScore {
  id: number;
  organizationId: number;
  overallScore: number;
  budgetHealth: number;
  licenseHealth: number;
  vendorHealth: number;
  renewalHealth: number;
  calculatedAt: string;
}

export interface Forecast {
  id: number;
  organizationId: number;
  period: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  currentSpend: number;
  projectedSpend: number;
  growthPercentage: number;
  calculatedAt: string;
}

export interface DashboardSummary {
  monthlySpend: number;
  annualSpend: number;
  activeSubscriptions: number;
  upcomingRenewalsCount: number;
  totalLicenses: number;
  assignedLicenses: number;
  licenseUtilizationPercentage: number;
  saasHealthScore: number;
  potentialMonthlySavings: number;
  potentialAnnualSavings: number;
  vendorCount: number;
}
