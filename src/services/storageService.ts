import {
  Facility,
  Patient,
  Teleconsultation,
  Referral,
  MedicineStockItem,
  LabOrder,
  HighRiskRecord,
  Doctor,
  DoctorAvailabilityStatus
} from '../types';
import {
  FACILITIES,
  INITIAL_PATIENTS,
  INITIAL_TELECONSULTATIONS,
  INITIAL_REFERRALS,
  INITIAL_DOCTORS
} from '../data/initialData';
import { awsCloudService } from './awsCloudService';
import { db, doc, setDoc, onSnapshot, handleFirestoreError, OperationType } from './firebase';

export interface FacilityDatabase {
  facilityId: string;
  patients: Patient[];
  teleconsultations: Teleconsultation[];
  referrals: Referral[];
  labOrders: LabOrder[];
  highRiskRecords: HighRiskRecord[];
  doctors: Doctor[];
  lastUpdated: string;
}

const STORAGE_PREFIX = 'sanjeevani_facility_db_';
const ACTIVE_FACILITY_KEY = 'sanjeevani_active_facility_id';
const FEDERATED_MEDICINE_KEY = 'sanjeevani_federated_medicines';
const OFFLINE_QUEUE_KEY = 'sanjeevani_offline_sync_queue';

const DEFAULT_MEDICINE_GRID: MedicineStockItem[] = [
  {
    id: 'MED-01',
    medicineName: 'Anti-Snake Venom (ASVS Lyophilized Polyvalent)',
    genericName: 'Polyvalent Snake Antivenom 10mL',
    category: 'Emergency Antidotes & Toxins',
    unit: 'Vials',
    stockByFacility: {
      'HWC-01': 4,
      'PHC-02': 14,
      'CHC-03': 38,
      'DH-04': 250,
      'APEX-05': 600
    }
  },
  {
    id: 'MED-02',
    medicineName: 'Inj Oxytocin 10 IU/mL',
    genericName: 'Oxytocin Injection USP',
    category: 'Maternal Life-Saving (PPH)',
    unit: 'Ampoules',
    stockByFacility: {
      'HWC-01': 8,
      'PHC-02': 45,
      'CHC-03': 180,
      'DH-04': 500,
      'APEX-05': 1200
    }
  },
  {
    id: 'MED-03',
    medicineName: 'Inj Magnesium Sulfate 50% 2mL',
    genericName: 'Magnesium Sulfate USP (Eclampsia Kit)',
    category: 'Maternal Life-Saving (Eclampsia)',
    unit: 'Ampoules',
    stockByFacility: {
      'HWC-01': 10,
      'PHC-02': 30,
      'CHC-03': 85,
      'DH-04': 300,
      'APEX-05': 800
    }
  },
  {
    id: 'MED-04',
    medicineName: 'Tab Iron & Folic Acid (IFA Red)',
    genericName: 'Ferrous Sulfate 100mg + FA 0.5mg',
    category: 'Anemia Mukt Bharat',
    unit: 'Tablets',
    stockByFacility: {
      'HWC-01': 1400,
      'PHC-02': 4500,
      'CHC-03': 8000,
      'DH-04': 25000,
      'APEX-05': 50000
    }
  },
  {
    id: 'MED-05',
    medicineName: 'Inj Regular Human Soluble Insulin 40 IU/mL',
    genericName: 'Human Soluble Insulin',
    category: 'NCD & Endocrine',
    unit: 'Vials',
    stockByFacility: {
      'HWC-01': 2,
      'PHC-02': 18,
      'CHC-03': 60,
      'DH-04': 340,
      'APEX-05': 1100
    }
  },
  {
    id: 'MED-06',
    medicineName: 'Tab Amlodipine 5mg',
    genericName: 'Amlodipine Besylate',
    category: 'Cardiovascular / NCD',
    unit: 'Tablets',
    stockByFacility: {
      'HWC-01': 800,
      'PHC-02': 2400,
      'CHC-03': 5000,
      'DH-04': 18000,
      'APEX-05': 40000
    }
  },
  {
    id: 'MED-07',
    medicineName: 'Inj Streptokinase 1.5 Million IU',
    genericName: 'Lyophilized Streptokinase',
    category: 'Acute STEMI Thrombolytic',
    unit: 'Vials',
    stockByFacility: {
      'HWC-01': 0,
      'PHC-02': 2,
      'CHC-03': 12,
      'DH-04': 45,
      'APEX-05': 150
    }
  },
  {
    id: 'MED-08',
    medicineName: 'ORS Sachets (WHO Formula 20.5g)',
    genericName: 'Oral Rehydration Salts',
    category: 'Diarrhea / Pediatric',
    unit: 'Sachets',
    stockByFacility: {
      'HWC-01': 450,
      'PHC-02': 1200,
      'CHC-03': 2800,
      'DH-04': 8000,
      'APEX-05': 15000
    }
  }
];

const INITIAL_HIGH_RISK_MAP: Record<string, HighRiskRecord[]> = {
  'HWC-01': [
    {
      id: 'HR-HWC-01',
      patientId: 'PAT-HWC-01',
      patientName: 'Laxmi Shinde',
      patientAbhaId: '91-4521-8932-1029',
      category: 'ANC_HIGH_RISK',
      clinicalCondition: '32 weeks pregnant, Gestational HTN (BP 148/96), Severe Anemia (Hb 7.8 g/dL)',
      village: 'Nimgaon Bhogi, Shirur',
      ashaWorkerName: 'Kamal Gaikwad (ASHA)',
      ashaWorkerPhone: '+91 94220 11984',
      lastHomeVisitDate: '2026-08-28',
      nextScheduledFollowUp: '2026-08-31',
      complianceScore: 92,
      visitNotes: 'ANM checked BP and administered IFA syrup. Instructed family on eclampsia warning danger signs.'
    },
    {
      id: 'HR-HWC-02',
      patientId: 'PAT-HWC-02',
      patientName: 'Baby Aarav Kale',
      patientAbhaId: '91-6281-9014-4421',
      category: 'SAM_INFANT',
      clinicalCondition: 'Severe Acute Malnutrition (MUAC 11.2cm Red Zone), recurrent diarrhea, lethargy',
      village: 'Tandali, Shirur',
      ashaWorkerName: 'Kamal Gaikwad (ASHA)',
      ashaWorkerPhone: '+91 94220 11984',
      lastHomeVisitDate: '2026-08-27',
      nextScheduledFollowUp: '2026-08-30',
      complianceScore: 84,
      visitNotes: 'Provided Therapeutic Nutrition Paste (RUTF). Advised admission to Nutrition Rehabilitation Centre (NRC).'
    }
  ],
  'PHC-02': [
    {
      id: 'HR-PHC-01',
      patientId: 'PAT-PHC-01',
      patientName: 'Rameshwar Jadhav',
      patientAbhaId: '91-3829-1102-9941',
      category: 'NCD_DIABETES_HTN',
      clinicalCondition: 'Uncontrolled Diabetes (FBS 340 mg/dL), Wagner Grade 3 Foot Ulcer with Gangrene',
      village: 'Chas, Khed',
      ashaWorkerName: 'Mangal Thite (ASHA)',
      ashaWorkerPhone: '+91 93700 44512',
      lastHomeVisitDate: '2026-08-26',
      nextScheduledFollowUp: '2026-08-30',
      complianceScore: 78,
      visitNotes: 'Wound dressing checked. Family agreed to attend District Hospital surgery OPD for debridement.'
    }
  ],
  'CHC-03': [],
  'DH-04': [],
  'APEX-05': []
};

const INITIAL_LAB_ORDERS_MAP: Record<string, LabOrder[]> = {
  'HWC-01': [
    {
      id: 'LAB-HWC-01',
      patientId: 'PAT-HWC-01',
      patientName: 'Laxmi Shinde',
      facilityId: 'HWC-01',
      testName: 'Point-of-Care Hemoglobin & Urine Albumin',
      category: 'Point of Care',
      orderedByDoctor: 'Sister Sunita Patil (ANM)',
      orderDate: '2026-08-28',
      urgency: 'Urgent',
      status: 'Completed',
      resultValue: 'Hb: 7.8 g/dL (Severe Anemia), Urine Albumin: 2+ (Positive)',
      referenceRange: 'Hb: 12.0-15.0 g/dL, Albumin: Nil',
      isAbnormal: true,
      notes: 'Indicates preeclampsia and severe microcytic hypochromic anemia in pregnancy.'
    },
    {
      id: 'LAB-HWC-02',
      patientId: 'PAT-HWC-03',
      patientName: 'Prakash Gholap',
      facilityId: 'HWC-01',
      testName: '12-Lead Tele-ECG & Random Blood Glucose',
      category: 'Point of Care',
      orderedByDoctor: 'Sister Sunita Patil (ANM)',
      orderDate: '2026-08-29',
      urgency: 'Emergency',
      status: 'Processing',
      resultValue: 'RBS: 290 mg/dL; Tele-ECG strip uploaded for Sassoon Apex Review',
      referenceRange: 'RBS: 70-140 mg/dL',
      isAbnormal: true,
      notes: 'ST elevations in Leads V2-V4 on portable ECG device.'
    }
  ],
  'PHC-02': [
    {
      id: 'LAB-PHC-01',
      patientId: 'PAT-PHC-01',
      patientName: 'Rameshwar Jadhav',
      facilityId: 'PHC-02',
      testName: 'Fasting Blood Sugar & Wound Swab Culture',
      category: 'Biochemistry',
      orderedByDoctor: 'Dr. Rajesh Deshmukh (MO)',
      orderDate: '2026-08-29',
      urgency: 'Urgent',
      status: 'Processing',
      resultValue: 'FBS: 340 mg/dL, HbA1c: 11.4%',
      referenceRange: 'FBS < 100 mg/dL, HbA1c < 6.5%',
      isAbnormal: true,
      notes: 'Wound swab sent to District Hospital Lab for culture & sensitivity.'
    }
  ],
  'CHC-03': [],
  'DH-04': [],
  'APEX-05': []
};

class StorageService {
  private memoryCache: Record<string, FacilityDatabase> = {};
  private subscribers: Array<() => void> = [];

  constructor() {
    this.initializeDatabases();
    this.listenToFirestoreSync();
  }

  private listenToFirestoreSync(): void {
    try {
      FACILITIES.forEach((fac) => {
        const path = `facility_databases/${fac.id}`;
        const facilityRef = doc(db, 'facility_databases', fac.id);
        onSnapshot(
          facilityRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data() as FacilityDatabase;
              if (data && data.facilityId) {
                this.memoryCache[fac.id] = data;
                localStorage.setItem(`${STORAGE_PREFIX}${fac.id}`, JSON.stringify(data));
                this.notifySubscribers();
              }
            }
          },
          (error) => {
            handleFirestoreError(error, OperationType.GET, path);
          }
        );
      });
    } catch (e) {
      console.debug('Firestore live sync init:', e);
    }
  }

  public initializeDatabases(forceReset = false): void {
    const existingMeds = localStorage.getItem(FEDERATED_MEDICINE_KEY);
    if (!existingMeds || forceReset) {
      localStorage.setItem(FEDERATED_MEDICINE_KEY, JSON.stringify(DEFAULT_MEDICINE_GRID));
    }

    FACILITIES.forEach((facility) => {
      const storageKey = `${STORAGE_PREFIX}${facility.id}`;
      const existing = localStorage.getItem(storageKey);

      if (!existing || forceReset) {
        const initialDb: FacilityDatabase = {
          facilityId: facility.id,
          patients: INITIAL_PATIENTS[facility.id] || [],
          teleconsultations: INITIAL_TELECONSULTATIONS[facility.id] || [],
          referrals: INITIAL_REFERRALS[facility.id] || [],
          labOrders: INITIAL_LAB_ORDERS_MAP[facility.id] || [],
          highRiskRecords: INITIAL_HIGH_RISK_MAP[facility.id] || [],
          doctors: INITIAL_DOCTORS[facility.id] || [],
          lastUpdated: new Date().toISOString()
        };

        localStorage.setItem(storageKey, JSON.stringify(initialDb));
        this.memoryCache[facility.id] = initialDb;
      } else {
        try {
          const parsed = JSON.parse(existing) as FacilityDatabase;
          if (!parsed.doctors || parsed.doctors.length === 0) {
            parsed.doctors = INITIAL_DOCTORS[facility.id] || [];
            localStorage.setItem(storageKey, JSON.stringify(parsed));
          }
          this.memoryCache[facility.id] = parsed;
        } catch {
          const fallbackDb: FacilityDatabase = {
            facilityId: facility.id,
            patients: INITIAL_PATIENTS[facility.id] || [],
            teleconsultations: INITIAL_TELECONSULTATIONS[facility.id] || [],
            referrals: [],
            labOrders: INITIAL_LAB_ORDERS_MAP[facility.id] || [],
            highRiskRecords: INITIAL_HIGH_RISK_MAP[facility.id] || [],
            doctors: INITIAL_DOCTORS[facility.id] || [],
            lastUpdated: new Date().toISOString()
          };
          localStorage.setItem(storageKey, JSON.stringify(fallbackDb));
          this.memoryCache[facility.id] = fallbackDb;
        }
      }
    });
  }

  // --- Active Facility Session ---
  public getActiveFacility(): Facility | null {
    const id = localStorage.getItem(ACTIVE_FACILITY_KEY);
    if (!id) return null;
    return FACILITIES.find((f) => f.id === id) || null;
  }

  public setActiveFacility(facility: Facility | null): void {
    if (facility) {
      localStorage.setItem(ACTIVE_FACILITY_KEY, facility.id);
    } else {
      localStorage.removeItem(ACTIVE_FACILITY_KEY);
    }
    this.notifySubscribers();
  }

  // --- Facility DB Access ---
  public getFacilityDb(facilityId: string): FacilityDatabase {
    const storageKey = `${STORAGE_PREFIX}${facilityId}`;
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (!parsed.doctors) {
          parsed.doctors = INITIAL_DOCTORS[facilityId] || [];
        }
        this.memoryCache[facilityId] = parsed;
        return parsed;
      } catch (e) {
        console.error('Failed to parse facility DB:', e);
      }
    }
    return (
      this.memoryCache[facilityId] || {
        facilityId,
        patients: [],
        teleconsultations: [],
        referrals: [],
        labOrders: [],
        highRiskRecords: [],
        doctors: INITIAL_DOCTORS[facilityId] || [],
        lastUpdated: new Date().toISOString()
      }
    );
  }

  public saveFacilityDb(dbData: FacilityDatabase): void {
    dbData.lastUpdated = new Date().toISOString();
    this.memoryCache[dbData.facilityId] = dbData;
    localStorage.setItem(`${STORAGE_PREFIX}${dbData.facilityId}`, JSON.stringify(dbData));
    this.notifySubscribers();

    // Push real-time snapshot to Google Firebase Firestore
    const path = `facility_databases/${dbData.facilityId}`;
    try {
      const facilityRef = doc(db, 'facility_databases', dbData.facilityId);
      setDoc(facilityRef, dbData, { merge: true }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, path);
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }

    // Asynchronously push change stream to Google Cloud SQL PostgreSQL backend
    try {
      fetch('/api/sql/sync-facility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facilityId: dbData.facilityId, data: dbData })
      }).catch((err) => {
        console.debug('Cloud SQL sync background info:', err);
      });
    } catch {
      // Non-blocking fallback
    }

    // Asynchronously push change stream to AWS DynamoDB / AWS Aurora
    awsCloudService.syncToAWS(dbData.facilityId, dbData).catch((err) => {
      console.warn('AWS Cloud sync warning:', err);
    });
  }

  // --- Patient Management ---
  public addPatient(facilityId: string, patient: Patient): Patient {
    const db = this.getFacilityDb(facilityId);
    db.patients = [patient, ...db.patients.filter((p) => p.id !== patient.id)];
    this.saveFacilityDb(db);
    return patient;
  }

  public updatePatient(facilityId: string, patient: Patient): Patient {
    const db = this.getFacilityDb(facilityId);
    db.patients = db.patients.map((p) => (p.id === patient.id ? patient : p));
    this.saveFacilityDb(db);
    return patient;
  }

  public getPatientAcrossAllDatabases(patientId: string): Patient | null {
    for (const fac of FACILITIES) {
      const db = this.getFacilityDb(fac.id);
      const found = db.patients.find((p) => p.id === patientId || p.abhaId === patientId);
      if (found) return found;
    }
    return null;
  }

  public searchPatientsFederated(query: string): Patient[] {
    const clean = query.toLowerCase().trim();
    if (!clean) {
      const active = this.getActiveFacility();
      return active ? this.getFacilityDb(active.id).patients : [];
    }

    const map = new Map<string, Patient>();
    FACILITIES.forEach((fac) => {
      const db = this.getFacilityDb(fac.id);
      db.patients.forEach((p) => {
        if (
          p.name.toLowerCase().includes(clean) ||
          p.abhaId.toLowerCase().includes(clean) ||
          p.phone.includes(clean) ||
          p.village.toLowerCase().includes(clean)
        ) {
          if (!map.has(p.id)) {
            map.set(p.id, p);
          }
        }
      });
    });

    return Array.from(map.values());
  }

  // --- Teleconsultation Management ---
  public createTeleconsultation(facilityId: string, tc: Teleconsultation): Teleconsultation {
    const db = this.getFacilityDb(facilityId);
    db.teleconsultations = [tc, ...db.teleconsultations.filter((t) => t.id !== tc.id)];
    this.saveFacilityDb(db);

    if (tc.consultingFacilityId && tc.consultingFacilityId !== facilityId) {
      const targetDb = this.getFacilityDb(tc.consultingFacilityId);
      if (!targetDb.teleconsultations.some((t) => t.id === tc.id)) {
        targetDb.teleconsultations = [tc, ...targetDb.teleconsultations];
        this.saveFacilityDb(targetDb);
      }
    }
    return tc;
  }

  public updateTeleconsultation(tc: Teleconsultation): Teleconsultation {
    const reqDb = this.getFacilityDb(tc.requestingFacilityId);
    reqDb.teleconsultations = reqDb.teleconsultations.map((t) => (t.id === tc.id ? tc : t));
    this.saveFacilityDb(reqDb);

    if (tc.consultingFacilityId && tc.consultingFacilityId !== tc.requestingFacilityId) {
      const consDb = this.getFacilityDb(tc.consultingFacilityId);
      consDb.teleconsultations = consDb.teleconsultations.map((t) => (t.id === tc.id ? tc : t));
      this.saveFacilityDb(consDb);
    }
    return tc;
  }

  // --- Federated Referral Engine ---
  public createReferral(referral: Referral): Referral {
    const originDb = this.getFacilityDb(referral.originFacilityId);
    originDb.referrals = [referral, ...originDb.referrals.filter((r) => r.id !== referral.id)];
    this.saveFacilityDb(originDb);

    const targetDb = this.getFacilityDb(referral.targetFacilityId);
    targetDb.referrals = [referral, ...targetDb.referrals.filter((r) => r.id !== referral.id)];

    const pat = this.getPatientAcrossAllDatabases(referral.patientId);
    if (pat && !targetDb.patients.some((p) => p.id === pat.id)) {
      targetDb.patients = [pat, ...targetDb.patients];
    }
    this.saveFacilityDb(targetDb);

    return referral;
  }

  public updateReferral(referral: Referral): Referral {
    FACILITIES.forEach((fac) => {
      const db = this.getFacilityDb(fac.id);
      if (db.referrals.some((r) => r.id === referral.id)) {
        db.referrals = db.referrals.map((r) => (r.id === referral.id ? referral : r));
        this.saveFacilityDb(db);
      }
    });
    return referral;
  }

  public updateReferralStatus(
    referralId: string,
    status: Referral['status'],
    note?: string
  ): Referral | null {
    let updated: Referral | null = null;
    FACILITIES.forEach((fac) => {
      const db = this.getFacilityDb(fac.id);
      const ref = db.referrals.find((r) => r.id === referralId);
      if (ref) {
        ref.status = status;
        this.saveFacilityDb(db);
        updated = ref;
      }
    });
    return updated;
  }

  public getReferralsForFacility(facilityId: string): {
    outgoing: Referral[];
    incoming: Referral[];
  } {
    const outgoing: Referral[] = [];
    const incoming: Referral[] = [];

    FACILITIES.forEach((fac) => {
      const db = this.getFacilityDb(fac.id);
      db.referrals.forEach((r) => {
        if (r.originFacilityId === facilityId && !outgoing.some((o) => o.id === r.id)) {
          outgoing.push(r);
        }
        if (r.targetFacilityId === facilityId && !incoming.some((i) => i.id === r.id)) {
          incoming.push(r);
        }
      });
    });

    return { outgoing, incoming };
  }

  // --- Medicine Stock Grid & Federated Inter-Hospital Requisitions ---
  public getFederatedMedicineGrid(): MedicineStockItem[] {
    try {
      const raw = localStorage.getItem(FEDERATED_MEDICINE_KEY);
      return raw ? JSON.parse(raw) : DEFAULT_MEDICINE_GRID;
    } catch {
      return DEFAULT_MEDICINE_GRID;
    }
  }

  public transferMedicineStock(
    sourceFacId: string,
    targetFacId: string,
    medicineName: string,
    qty: number
  ): boolean {
    const grid = this.getFederatedMedicineGrid();
    const med = grid.find((m) => m.medicineName.toLowerCase() === medicineName.toLowerCase());
    if (!med) return false;

    const sourceStock = med.stockByFacility[sourceFacId] || 0;
    if (sourceStock < qty) return false;

    med.stockByFacility[sourceFacId] = sourceStock - qty;
    med.stockByFacility[targetFacId] = (med.stockByFacility[targetFacId] || 0) + qty;

    localStorage.setItem(FEDERATED_MEDICINE_KEY, JSON.stringify(grid));
    this.notifySubscribers();
    return true;
  }

  // --- High Risk Cohort Management ---
  public updateHighRiskRecord(facilityId: string, rec: HighRiskRecord): void {
    const db = this.getFacilityDb(facilityId);
    db.highRiskRecords = db.highRiskRecords.map((r) => (r.id === rec.id ? rec : r));
    this.saveFacilityDb(db);
  }

  // --- Diagnostics Lab Orders ---
  public addLabOrder(facilityId: string, order: LabOrder): LabOrder {
    const db = this.getFacilityDb(facilityId);
    db.labOrders = [order, ...db.labOrders];
    this.saveFacilityDb(db);
    return order;
  }

  // --- Doctor Roster & Availability Management ---
  public getDoctorsForFacility(facilityId: string): Doctor[] {
    const db = this.getFacilityDb(facilityId);
    return db.doctors || [];
  }

  public getAllFederatedDoctors(): Doctor[] {
    const all: Doctor[] = [];
    FACILITIES.forEach((fac) => {
      const db = this.getFacilityDb(fac.id);
      if (db.doctors) {
        all.push(...db.doctors);
      }
    });
    return all;
  }

  public getDoctorById(doctorId: string): Doctor | null {
    for (const fac of FACILITIES) {
      const db = this.getFacilityDb(fac.id);
      const doc = db.doctors?.find((d) => d.id === doctorId);
      if (doc) return doc;
    }
    return null;
  }

  public updateDoctorStatus(
    doctorId: string,
    status: DoctorAvailabilityStatus,
    onDuty?: boolean
  ): Doctor | null {
    let updated: Doctor | null = null;
    FACILITIES.forEach((fac) => {
      const db = this.getFacilityDb(fac.id);
      if (db.doctors && db.doctors.some((d) => d.id === doctorId)) {
        db.doctors = db.doctors.map((d) => {
          if (d.id === doctorId) {
            const nextOnDuty = onDuty !== undefined ? onDuty : (status !== 'Off Duty' && status !== 'On Leave');
            const docObj: Doctor = {
              ...d,
              status,
              onDuty: nextOnDuty
            };
            updated = docObj;
            return docObj;
          }
          return d;
        });
        this.saveFacilityDb(db);
      }
    });
    return updated;
  }

  public addDoctor(facilityId: string, doctor: Doctor): Doctor {
    const db = this.getFacilityDb(facilityId);
    db.doctors = [doctor, ...(db.doctors || []).filter((d) => d.id !== doctor.id)];
    this.saveFacilityDb(db);
    return doctor;
  }

  public updateDoctor(doctor: Doctor): Doctor {
    const db = this.getFacilityDb(doctor.facilityId);
    db.doctors = (db.doctors || []).map((d) => (d.id === doctor.id ? doctor : d));
    this.saveFacilityDb(db);
    return doctor;
  }

  public deleteDoctor(facilityId: string, doctorId: string): void {
    const db = this.getFacilityDb(facilityId);
    db.doctors = (db.doctors || []).filter((d) => d.id !== doctorId);
    this.saveFacilityDb(db);
  }

  // --- Offline Queue Simulator ---
  public queueOfflineAction(action: { type: string; payload: unknown; timestamp: string }): void {
    const queue = this.getOfflineQueue();
    queue.push(action);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    this.notifySubscribers();
  }

  public getOfflineQueue(): Array<{ type: string; payload: unknown; timestamp: string }> {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public clearOfflineQueue(): void {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    this.notifySubscribers();
  }

  // --- Reset Entire Demo State ---
  public resetToDefaultSeeds(): void {
    this.initializeDatabases(true);
    this.clearOfflineQueue();
    this.notifySubscribers();
  }

  // --- Reactive Subscriptions ---
  public subscribe(callback: () => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.error('Subscriber error:', e);
      }
    });
  }
}

export const storageService = new StorageService();
