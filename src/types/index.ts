export type FacilityTier = 'HWC' | 'PHC' | 'CHC' | 'DH' | 'APEX';

export interface Facility {
  id: string;
  name: string;
  shortName: string;
  tier: FacilityTier;
  tierLabel: string;
  block: string;
  district: string;
  state: string;
  pincode: string;
  contactNumber: string;
  email: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  totalBeds: number;
  occupiedBeds: number;
  icuBeds: number;
  occupiedIcuBeds: number;
  oxygenAvailableLiters: number;
  doctorsOnDuty: number;
  teleconsultStations: number;
  activeSpecialities: string[];
  ambulanceStationed: number;
  loginEmail: string;
  loginPass: string;
  staffName: string;
  staffRole: string;
  staffTitle: string;
}

export type TriagePriority = 'RED' | 'YELLOW' | 'GREEN';

export interface Vitals {
  bloodPressureSys: number;
  bloodPressureDia: number;
  pulseRate: number;
  spO2: number;
  temperatureF: number;
  respiratoryRate: number;
  bloodSugarMgDl?: number;
  hemoglobin?: number;
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
}

export interface Medication {
  id: string;
  name: string;
  genericName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions: string;
  isAvailableInLocalPharmacy: boolean;
}

export interface Prescription {
  id: string;
  consultationId: string;
  patientId: string;
  doctorName: string;
  doctorRegistration: string;
  facilityName: string;
  date: string;
  diagnosis: string;
  clinicalNotes: string;
  medications: Medication[];
  dietaryAdvice: string;
  precautions: string;
  followUpDate: string;
  qrCodeDataUrl?: string;
  signedAbdmId: string;
}

export interface LabOrder {
  id: string;
  patientId: string;
  patientName: string;
  facilityId: string;
  testName: string;
  category: 'Hematology' | 'Biochemistry' | 'Radiology' | 'Microbiology' | 'Point of Care';
  orderedByDoctor: string;
  orderDate: string;
  urgency: 'Routine' | 'Urgent' | 'Emergency';
  status: 'Pending' | 'Sample Collected' | 'Processing' | 'Completed';
  resultValue?: string;
  referenceRange?: string;
  isAbnormal?: boolean;
  notes?: string;
}

export interface Patient {
  id: string;
  abhaId: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  village: string;
  block: string;
  district: string;
  registeredFacilityId: string;
  registeredDate: string;
  bloodGroup: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  allergies: string[];
  chronicConditions: string[];
  currentVitals?: Vitals;
  riskCategory: 'High' | 'Medium' | 'Low';
  highRiskType?: 'ANC_HIGH_RISK' | 'SAM_INFANT' | 'NCD_DIABETES_HTN' | 'CARDIAC' | 'TB_DOTS' | 'INFECTIOUS_FEVER' | 'NONE';
  ashaWorkerName: string;
  ashaWorkerPhone: string;
  photoUrl?: string;
  lastVisitDate: string;
  pastHistorySummary: string;
}

export interface Teleconsultation {
  id: string;
  tokenNumber: number;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientAbhaId: string;
  patientVillage: string;
  requestingFacilityId: string;
  requestingFacilityName: string;
  consultingFacilityId: string;
  consultingFacilityName: string;
  consultingDoctorName: string;
  specialityRequired: string;
  assistedByAshaName: string;
  chiefComplaints: string;
  symptomsDuration: string;
  vitals: Vitals;
  triagePriority: TriagePriority;
  triageScore: number;
  triageReason: string;
  status: 'Waiting' | 'In Progress' | 'Completed' | 'Referred' | 'Cancelled';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  prescription?: Prescription;
  referralId?: string;
  meetingRoomId: string;
  aiDifferentialDiagnosis?: string[];
  aiRedFlags?: string[];
  aiRecommendedAction?: string;
}

export type ReferralStatus =
  | 'Initiated'
  | 'Accepted'
  | 'In Transit'
  | 'Admitted'
  | 'Discharged'
  | 'Counter-Referred'
  | 'Completed';

export interface Referral {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientAbhaId: string;
  originFacilityId: string;
  originFacilityName: string;
  referredByStaff: string;
  targetFacilityId: string;
  targetFacilityName: string;
  targetSpeciality: string;
  provisionalDiagnosis: string;
  clinicalJustification: string;
  priority: TriagePriority;
  status: ReferralStatus;
  createdAt: string;
  vitalsAtReferral: Vitals;
  ambulanceDetails?: {
    vehicleNumber: string;
    driverName: string;
    driverPhone: string;
    paramedicName: string;
    currentLocation: string;
    estimatedArrivalMinutes: number;
    oxygenEquipped: boolean;
  };
}

export interface MedicineStockItem {
  id: string;
  medicineName: string;
  genericName: string;
  category: string;
  unit: string;
  stockByFacility: Record<string, number>;
}

export type HighRiskCategory =
  | 'ANC_HIGH_RISK'
  | 'SAM_INFANT'
  | 'NCD_DIABETES_HTN'
  | 'TB_DOTS'
  | 'GENERAL';

export interface HighRiskRecord {
  id: string;
  patientId: string;
  patientName: string;
  patientAbhaId: string;
  category: HighRiskCategory;
  clinicalCondition: string;
  village: string;
  ashaWorkerName: string;
  ashaWorkerPhone: string;
  lastHomeVisitDate: string;
  nextScheduledFollowUp: string;
  complianceScore: number;
  visitNotes: string;
}

export type SupportedLanguage = 'en' | 'hi' | 'mr' | 'ta' | 'te' | 'bn';

export type DoctorAvailabilityStatus =
  | 'Available'        // Online, Available for Tele-OPD & Consultations
  | 'In Consultation'  // Active in a video teleconsult
  | 'In Emergency OT'  // In Emergency room / Operation Theatre
  | 'On Rounds'        // In ward / Tele-ICU rounds
  | 'On Call'          // Available on emergency dispatch
  | 'Off Duty'         // Completed shift
  | 'On Leave';        // On official leave

export interface DoctorSchedule {
  shift: 'Morning OPD (08:00 - 14:00)' | 'Evening OPD (14:00 - 20:00)' | 'Night Emergency (20:00 - 08:00)' | '24x7 Tele-ICU On-Call';
  daysActive: string[];
  currentDutyWard?: string;
  teleconsultRoomId?: string;
}

export interface Doctor {
  id: string;
  name: string;
  facilityId: string;
  facilityName: string;
  qualification: string;
  speciality: string;
  registrationNumber: string;
  experienceYears: number;
  languages: string[];
  phone: string;
  email: string;
  photoUrl?: string;
  status: DoctorAvailabilityStatus;
  schedule: DoctorSchedule;
  teleconsultStationsAssigned?: number;
  activeConsultationCount: number;
  completedConsultationsToday: number;
  rating?: number;
  bio?: string;
  onDuty: boolean;
}

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
  greeting: string;
}
