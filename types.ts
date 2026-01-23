export type Role = 'SAAS_ADMIN' | 'ADMIN' | 'THERAPIST' | 'PARENT' | 'SPECIALIST';

// ABA Prompt Hierarchy (Hierarquia de Dicas)
export enum TrialResult {
  INDEPENDENT = 'INDEPENDENT',
  GESTURAL_PROMPT = 'GESTURAL',
  VERBAL_PROMPT = 'VERBAL',
  MODELING = 'MODELING',
  PHYSICAL_PARTIAL = 'PHYSICAL_PARTIAL',
  PHYSICAL_FULL = 'PHYSICAL_FULL',
  INCORRECT = 'INCORRECT',
  NO_RESPONSE = 'NO_RESPONSE'
}

export type BehaviorType =
  | 'JOY' | 'FOCUS' | 'TIRED' | 'FRUSTRATED' | 'ANXIOUS' | 'AGGRESSIVE' | 'REGULATED'
  | 'COMPLIANCE' | 'TOILETING' | 'EATING_DRINKING' | 'MAND' | 'ABC_RECORD' | 'DURATION_LOG';

export interface SessionEvent {
  id: string;
  timestamp: number;
  type: BehaviorType;
  activityId?: string;
  intensity?: 1 | 2 | 3;
  durationSeconds?: number;
  abcSpecifics?: { antecedent: string; consequence: string; };
}

// --- SHARED APPOINTMENT TYPE ---
export interface Appointment {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number; // minutes
  patientId: string;
  therapistId: string;
  serviceName: string;
  serviceId?: string; // Link to specific contracted service
  status: 'SCHEDULED' | 'CONFIRMED' | 'ARRIVED' | 'IN_SESSION' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW';
  room: string;
  notes?: string;
}

export type ContractType = 'CLT' | 'PJ' | 'ESTAGIO';

export interface UserFinancialConfig {
  contractType: ContractType;
  salaryType: 'HOURLY' | 'MONTHLY';
  baseRate: number;
  allowOvertime: boolean;
  workSchedule: {
    start: string;
    end: string;
    lunchDurationMinutes: number;
    activeWeekDays: number[];
  };
  benefits: { mealValue: number; transportValue: number; };
  taxes: { deductINSS: boolean; deductIRRF: boolean; };
}

export interface User {
  id: string;
  clinicId?: string;
  name: string;
  email?: string;
  password?: string;
  role: Role;
  avatarUrl?: string;
  performanceScore?: number;
  financial?: UserFinancialConfig;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  domain: string;
  target: string;
  instruction?: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'MASTERED';
  isTaskAnalysis?: boolean;
  steps?: string[];
  materialsNeeded?: string[];
}

export interface Goal {
  id: string;
  activityId: string;
  customTarget: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'ACHIEVED' | 'FAILED';
  deadline?: string;
}

export interface Plan {
  id: string;
  patientId: string;
  title: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'DRAFT';
  goals: Goal[];
  methodology: string;
}

export interface Trial {
  id: string;
  activityId: string;
  result: TrialResult;
  timestamp: number;
  note?: string;
  stepIndex?: number;
}

export interface Session {
  id: string;
  patientId: string;
  therapistId: string;
  startTime: number;
  endTime?: number;
  trials: Trial[];
  events: SessionEvent[];
  notes: string;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'DIFFICULT';
  reinforcer?: string;
  antecedentStrategies?: string[];
  billed?: boolean;
  billValue?: number;
}

export type RecordType = 'EVOLUTION' | 'MEDICATION' | 'FAMILY_MEETING' | 'SCHOOL_REPORT' | 'INCIDENT' | 'ABC_DATA';

export interface MedicalRecordEntry {
  id: string;
  date: string;
  type: RecordType;
  authorId: string;
  title: string;
  content: string;
  tags: string[];
  attachments?: string[];
  abcData?: { antecedent: string; behavior: string; consequence: string; functionHypothesis?: string; };
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'REINFORCER' | 'MATERIAL' | 'SENSORY';
  quantity: number;
  location: string;
  status: 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  assignedToPatientId?: string;
}

export interface SafetyPlanStep {
  level: 'BASELINE' | 'TRIGGER' | 'ESCALATION' | 'CRISIS' | 'RECOVERY';
  indicators: string[];
  staffResponse: string[];
  color: string;
}

export interface HomeTask {
  id: string;
  title: string;
  description: string;
  assignedDate: string;
  status: 'PENDING' | 'COMPLETED';
  parentFeedback?: string;
}

export interface DocumentFile {
  id: string;
  name: string;
  type: 'PDF' | 'VIDEO' | 'IMAGE';
  uploadDate: string;
  category: 'LAUDO' | 'PEI' | 'VIDEO_MODELING';
}

export type PaymentMethod = 'PRIVATE' | 'INSURANCE' | 'MIXED';

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
}

export interface ContractConfig {
  paymentMethod: PaymentMethod;
  insuranceName?: string;
  insuranceNumber?: string;
  monthlyCap?: number;
  services: ServiceItem[];
}

export interface ScheduleItem {
  id: string;
  dayOfWeek: number;
  time: string;
  serviceId: string;
  therapistId: string;
}

export interface Guardian {
  name: string;
  phone: string;
  relationship: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  diagnosis: string;
  startDate: string;
  guardians: string[];
  anamnesisSummary: string;
  plans: Plan[];
  medicalRecords: MedicalRecordEntry[];
  photoUrl?: string;
  guardianIds?: string[]; // IDs for Users with role 'PARENT'
  guardianNames?: string[]; // Fallback for display or non-registered parents
  guardianDetails?: Guardian[]; // Structured guardian info
  safetyPlan?: SafetyPlanStep[];
  homeTasks?: HomeTask[];
  documents?: DocumentFile[];
  financialConfig?: ContractConfig;
  schedule?: ScheduleItem[];
}

export interface Message {
  id: string;
  authorId: string;
  content: string;
  timestamp: number;
  type: 'UPDATE' | 'ALERT' | 'GENERAL';
  readBy: string[];
}

export interface TimeLog {
  id: string;
  userId: string;
  date: string;
  clockIn: number;
  clockOut?: number;
  type: 'REGULAR' | 'MANUAL';
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  justification?: string;
  rejectionReason?: string;
  photoUrl?: string;
  relatedSessionStart?: number;
}

// --- UPDATED CLINIC INTERFACE FOR COMPLETE REGISTRATION ---
export interface Clinic {
  id: string;
  name: string; // Nome Fantasia
  corporateName: string; // Razão Social
  cnpj: string;
  plan: 'BASIC' | 'PRO' | 'ENTERPRISE';
  active: boolean;
  status: 'ACTIVE' | 'BLOCKED' | 'TRIAL' | 'OVERDUE';
  maxUsers: number;

  // Contact & Address
  email: string;
  phone: string;
  website?: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    district: string; // Bairro
    city: string;
    state: string;
    zip: string; // CEP
  };

  // Subscription & Billing
  subscription: {
    startDate: string;
    nextDueDate: string;
    dueDay: number; // Dia do vencimento (5, 10, 15, etc)
    value: number;
    paymentMethod: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
    isAutoRenew: boolean;
  };

  adminUserId: string;
  adminTempPassword?: string; // Optional: used only during creation/edit for convenience
}

export interface FinancialService {
  id: string;
  name: string;
  defaultPrice: number;
  category: TransactionCategory;
  description?: string;
}

export type TransactionType = 'INCOME' | 'EXPENSE';
export type TransactionStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'SCHEDULED';
export type TransactionCategory = 'REVENUE_SESSION' | 'REVENUE_PRODUCT' | 'EXPENSE_PAYROLL' | 'EXPENSE_RENT' | 'EXPENSE_MATERIAL' | 'EXPENSE_SOFTWARE' | 'EXPENSE_TAX' | 'EXPENSE_MAINTENANCE' | 'EXPENSE_OTHER';

export interface FinancialTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  status: TransactionStatus;
  entityId?: string;
  entityName?: string;
  dueDate?: string;
  paymentMethod?: 'BOLETO' | 'PIX' | 'CREDIT_CARD' | 'TRANSFER' | 'CASH';
  isSystemGenerated?: boolean;
  costCenter?: string;
}

export interface TokenBoardState {
  tokens: number;
  targetTokens: number;
  reward: string;
}

export interface PayrollAdjustment {
  id: string;
  userId: string;
  date: string;
  amount: number;
  description: string;
  type: 'BONUS' | 'DEDUCTION';
}