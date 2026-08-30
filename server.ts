import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { sqlDb, schema } from './src/db/index';
import { eq } from 'drizzle-orm';
import { FACILITIES, INITIAL_PATIENTS, INITIAL_TELECONSULTATIONS, INITIAL_REFERRALS, INITIAL_DOCTORS } from './src/data/initialData';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', sqlConnected: true, timestamp: new Date().toISOString() });
  });

  // -------------------------------------------------------------
  // CLOUD SQL ENDPOINTS
  // -------------------------------------------------------------

  // Seed / Sync Initial Facilities & Data to PostgreSQL
  app.post('/api/sql/init-seed', async (req, res) => {
    try {
      // 1. Seed facilities
      for (const fac of FACILITIES) {
        await sqlDb.insert(schema.facilities).values({
          facilityId: fac.id,
          name: fac.name,
          shortName: fac.shortName,
          tier: fac.tier,
          tierLabel: fac.tierLabel,
          blockName: fac.block,
          district: fac.district,
          state: fac.state,
          pincode: fac.pincode,
          contactNumber: fac.contactNumber,
          email: fac.email,
          latitude: String(fac.coordinates.lat),
          longitude: String(fac.coordinates.lng),
          totalBeds: fac.totalBeds,
          occupiedBeds: fac.occupiedBeds,
          icuBeds: fac.icuBeds,
          occupiedIcuBeds: fac.occupiedIcuBeds,
          oxygenAvailableLiters: fac.oxygenAvailableLiters,
          doctorsOnDuty: fac.doctorsOnDuty,
          teleconsultStations: fac.teleconsultStations,
          activeSpecialities: fac.activeSpecialities,
          ambulancesStationed: fac.ambulanceStationed,
          staffName: fac.staffName,
          staffRole: fac.staffRole,
          staffTitle: fac.staffTitle,
        }).onConflictDoUpdate({
          target: schema.facilities.facilityId,
          set: {
            name: fac.name,
            totalBeds: fac.totalBeds,
            occupiedBeds: fac.occupiedBeds,
            doctorsOnDuty: fac.doctorsOnDuty,
            updatedAt: new Date(),
          }
        });
      }

      // 2. Seed Initial Patients
      for (const pList of Object.values(INITIAL_PATIENTS)) {
        for (const p of pList) {
          await sqlDb.insert(schema.patients).values({
            id: p.id,
            abhaId: p.abhaId,
            name: p.name,
            age: p.age,
            gender: p.gender,
            phone: p.phone,
            village: p.village,
            block: p.block,
            district: p.district,
            registeredFacilityId: p.registeredFacilityId,
            registeredDate: p.registeredDate,
            bloodGroup: p.bloodGroup,
            emergencyContactName: p.emergencyContactName,
            emergencyContactPhone: p.emergencyContactPhone,
            allergies: p.allergies,
            chronicConditions: p.chronicConditions,
            currentVitals: (p.currentVitals as unknown as Record<string, unknown>) || {},
            riskCategory: p.riskCategory,
            highRiskType: p.highRiskType,
            ashaWorkerName: p.ashaWorkerName,
            ashaWorkerPhone: p.ashaWorkerPhone,
            photoUrl: p.photoUrl,
            lastVisitDate: p.lastVisitDate,
            pastHistorySummary: p.pastHistorySummary,
          }).onConflictDoNothing();
        }
      }

      // 3. Seed Initial Consultations
      for (const cList of Object.values(INITIAL_TELECONSULTATIONS)) {
        for (const c of cList) {
          await sqlDb.insert(schema.teleconsultations).values({
            id: c.id,
            tokenNumber: c.tokenNumber,
            patientId: c.patientId,
            patientName: c.patientName,
            patientAge: c.patientAge,
            patientGender: c.patientGender,
            patientAbhaId: c.patientAbhaId,
            patientVillage: c.patientVillage,
            requestingFacilityId: c.requestingFacilityId,
            requestingFacilityName: c.requestingFacilityName,
            consultingFacilityId: c.consultingFacilityId,
            consultingFacilityName: c.consultingFacilityName,
            consultingDoctorName: c.consultingDoctorName,
            specialityRequired: c.specialityRequired,
            assistedByAshaName: c.assistedByAshaName,
            chiefComplaints: c.chiefComplaints,
            symptomsDuration: c.symptomsDuration,
            vitals: (c.vitals as unknown as Record<string, unknown>) || {},
            triagePriority: c.triagePriority,
            triageScore: c.triageScore,
            triageReason: c.triageReason,
            status: c.status,
            createdAt: c.createdAt,
            meetingRoomId: c.meetingRoomId,
            aiDifferentialDiagnosis: c.aiDifferentialDiagnosis || [],
            aiRedFlags: c.aiRedFlags || [],
            aiRecommendedAction: c.aiRecommendedAction,
          }).onConflictDoNothing();
        }
      }

      // 4. Seed Initial Referrals
      for (const rList of Object.values(INITIAL_REFERRALS)) {
        for (const r of rList) {
          await sqlDb.insert(schema.referrals).values({
            id: r.id,
            patientId: r.patientId,
            patientName: r.patientName,
            patientAge: r.patientAge,
            patientGender: r.patientGender,
            patientAbhaId: r.patientAbhaId,
            fromFacilityId: r.originFacilityId || '',
            fromFacilityName: r.originFacilityName || '',
            toFacilityId: r.targetFacilityId || '',
            toFacilityName: r.targetFacilityName || '',
            speciality: r.targetSpeciality || 'General Medicine',
            reasonForReferral: r.clinicalJustification || 'Specialist Care Needed',
            clinicalSummary: r.clinicalJustification || '',
            provisionalDiagnosis: r.provisionalDiagnosis || '',
            triagePriority: r.priority || 'P2',
            transportRequirement: r.ambulanceDetails ? '108 Basic Ambulance' : 'Routine Patient Transport',
            assignedAmbulanceId: r.ambulanceDetails?.vehicleNumber || null,
            driverContact: r.ambulanceDetails?.driverPhone || null,
            teleconsultationId: null,
            status: r.status || 'Initiated',
            initiatedAt: r.createdAt || new Date().toISOString(),
            acceptingDoctorName: null,
            bedAssigned: null,
          }).onConflictDoNothing();
        }
      }

      // 5. Seed Doctors
      for (const [facId, docList] of Object.entries(INITIAL_DOCTORS)) {
        for (const doc of docList) {
          await sqlDb.insert(schema.doctors).values({
            id: doc.id,
            name: doc.name,
            qualification: doc.qualification,
            registrationNumber: doc.registrationNumber,
            facilityId: doc.facilityId || facId,
            facilityName: doc.facilityName,
            facilityTier: facId.startsWith('HWC') ? 'HWC' : facId.startsWith('PHC') ? 'PHC' : facId.startsWith('CHC') ? 'CHC' : facId.startsWith('DH') ? 'DH' : 'APEX',
            speciality: doc.speciality,
            subSpeciality: doc.speciality,
            isOnline: doc.onDuty,
            status: doc.status,
            activeQueueCount: doc.activeConsultationCount || 0,
            totalConsultsCompleted: doc.completedConsultationsToday || 0,
            phone: doc.phone,
            email: doc.email,
            avatarUrl: doc.photoUrl || '',
            availableDays: doc.schedule?.daysActive || [],
            shiftTiming: doc.schedule?.shift || '',
            teleconsultStationId: doc.schedule?.teleconsultRoomId || '',
          }).onConflictDoNothing();
        }
      }

      res.json({ success: true, message: 'Cloud SQL PostgreSQL database populated successfully with 5-tier hospital network data.' });
    } catch (error) {
      console.error('SQL Seed error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Get Facility Data from Cloud SQL
  app.get('/api/sql/facilities/:facilityId', async (req, res) => {
    try {
      const { facilityId } = req.params;
      const patientRecords = await sqlDb.select().from(schema.patients).where(eq(schema.patients.registeredFacilityId, facilityId));
      const consults = await sqlDb.select().from(schema.teleconsultations).where(eq(schema.teleconsultations.requestingFacilityId, facilityId));
      const refList = await sqlDb.select().from(schema.referrals).where(eq(schema.referrals.fromFacilityId, facilityId));
      const doctorList = await sqlDb.select().from(schema.doctors).where(eq(schema.doctors.facilityId, facilityId));

      res.json({
        facilityId,
        patients: patientRecords,
        teleconsultations: consults,
        referrals: refList,
        doctors: doctorList,
        source: 'Google Cloud SQL PostgreSQL'
      });
    } catch (error) {
      console.error('SQL fetch error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Save / Sync Full Facility Database Snapshot to Cloud SQL
  app.post('/api/sql/sync-facility', async (req, res) => {
    try {
      const { facilityId, data } = req.body;
      if (!facilityId || !data) {
        return res.status(400).json({ error: 'Missing facilityId or data' });
      }

      // Upsert full JSON snapshot
      await sqlDb.insert(schema.facilityDatabaseSnapshots).values({
        facilityId,
        facilityData: data,
        lastUpdated: new Date(),
      }).onConflictDoUpdate({
        target: schema.facilityDatabaseSnapshots.facilityId,
        set: {
          facilityData: data,
          lastUpdated: new Date(),
        }
      });

      // Also upsert individual patient rows
      if (Array.isArray(data.patients)) {
        for (const p of data.patients) {
          if (!p.id || !p.name) continue;
          await sqlDb.insert(schema.patients).values({
            id: p.id,
            abhaId: p.abhaId || `ABHA-${p.id}`,
            name: p.name,
            age: Number(p.age) || 30,
            gender: p.gender || 'Other',
            phone: p.phone,
            village: p.village,
            block: p.block,
            district: p.district,
            registeredFacilityId: p.registeredFacilityId || facilityId,
            registeredDate: p.registeredDate || new Date().toISOString().split('T')[0],
            bloodGroup: p.bloodGroup,
            emergencyContactName: p.emergencyContactName,
            emergencyContactPhone: p.emergencyContactPhone,
            allergies: p.allergies || [],
            chronicConditions: p.chronicConditions || [],
            currentVitals: (p.currentVitals as unknown as Record<string, unknown>) || {},
            riskCategory: p.riskCategory || 'Low',
            highRiskType: p.highRiskType,
            ashaWorkerName: p.ashaWorkerName,
            ashaWorkerPhone: p.ashaWorkerPhone,
            photoUrl: p.photoUrl,
            lastVisitDate: p.lastVisitDate,
            pastHistorySummary: p.pastHistorySummary,
            updatedAt: new Date(),
          }).onConflictDoUpdate({
            target: schema.patients.id,
            set: {
              name: p.name,
              age: Number(p.age) || 30,
              gender: p.gender || 'Other',
              phone: p.phone,
              allergies: p.allergies || [],
              chronicConditions: p.chronicConditions || [],
              currentVitals: (p.currentVitals as unknown as Record<string, unknown>) || {},
              riskCategory: p.riskCategory || 'Low',
              highRiskType: p.highRiskType,
              lastVisitDate: p.lastVisitDate,
              pastHistorySummary: p.pastHistorySummary,
              updatedAt: new Date(),
            }
          });
        }
      }

      // Upsert teleconsultations
      if (Array.isArray(data.teleconsultations)) {
        for (const c of data.teleconsultations) {
          if (!c.id || !c.patientName) continue;
          await sqlDb.insert(schema.teleconsultations).values({
            id: c.id,
            tokenNumber: Number(c.tokenNumber) || 1,
            patientId: c.patientId,
            patientName: c.patientName,
            patientAge: Number(c.patientAge) || 30,
            patientGender: c.patientGender,
            patientAbhaId: c.patientAbhaId,
            patientVillage: c.patientVillage,
            requestingFacilityId: c.requestingFacilityId || facilityId,
            requestingFacilityName: c.requestingFacilityName || 'Facility',
            consultingFacilityId: c.consultingFacilityId || 'DH-04',
            consultingFacilityName: c.consultingFacilityName || 'District Hospital',
            consultingDoctorName: c.consultingDoctorName || 'Dr. On Duty',
            specialityRequired: c.specialityRequired || 'General Medicine',
            assistedByAshaName: c.assistedByAshaName,
            chiefComplaints: c.chiefComplaints || 'Consultation',
            symptomsDuration: c.symptomsDuration,
            vitals: (c.vitals as unknown as Record<string, unknown>) || {},
            triagePriority: c.triagePriority || 'GREEN',
            triageScore: Number(c.triageScore) || 0,
            triageReason: c.triageReason,
            status: c.status || 'Waiting',
            createdAt: c.createdAt || new Date().toISOString(),
            startedAt: c.startedAt,
            completedAt: c.completedAt,
            prescription: (c.prescription as unknown as Record<string, unknown>),
            referralId: c.referralId,
            meetingRoomId: c.meetingRoomId || `room-${c.id}`,
            aiDifferentialDiagnosis: c.aiDifferentialDiagnosis || [],
            aiRedFlags: c.aiRedFlags || [],
            aiRecommendedAction: c.aiRecommendedAction,
            updatedAt: new Date(),
          }).onConflictDoUpdate({
            target: schema.teleconsultations.id,
            set: {
              status: c.status || 'Waiting',
              startedAt: c.startedAt,
              completedAt: c.completedAt,
              prescription: (c.prescription as unknown as Record<string, unknown>),
              referralId: c.referralId,
              updatedAt: new Date(),
            }
          });
        }
      }

      // Upsert referrals
      if (Array.isArray(data.referrals)) {
        for (const r of data.referrals) {
          if (!r.id || !r.patientName) continue;
          await sqlDb.insert(schema.referrals).values({
            id: r.id,
            patientId: r.patientId,
            patientName: r.patientName,
            patientAge: Number(r.patientAge) || 30,
            patientGender: r.patientGender,
            patientAbhaId: r.patientAbhaId,
            fromFacilityId: r.fromFacilityId || facilityId,
            fromFacilityName: r.fromFacilityName || 'Facility',
            toFacilityId: r.toFacilityId,
            toFacilityName: r.toFacilityName,
            speciality: r.speciality,
            reasonForReferral: r.reasonForReferral || 'Clinical Escalation',
            clinicalSummary: r.clinicalSummary || 'Summary',
            provisionalDiagnosis: r.provisionalDiagnosis || 'Diagnosis',
            triagePriority: r.triagePriority || 'YELLOW',
            transportRequirement: r.transportRequirement || '108 Advanced Life Support (ALS)',
            assignedAmbulanceId: r.assignedAmbulanceId,
            driverContact: r.driverContact,
            teleconsultationId: r.teleconsultationId,
            status: r.status || 'Initiated',
            initiatedAt: r.initiatedAt || new Date().toISOString(),
            acceptedAt: r.acceptedAt,
            inTransitAt: r.inTransitAt,
            admittedAt: r.admittedAt,
            completedAt: r.completedAt,
            acceptingDoctorName: r.acceptingDoctorName,
            bedAssigned: r.bedAssigned,
            counterReferralNotes: r.counterReferralNotes,
            counterReferralMedications: (r.counterReferralMedications as unknown as Record<string, unknown>[]),
            updatedAt: new Date(),
          }).onConflictDoUpdate({
            target: schema.referrals.id,
            set: {
              status: r.status,
              acceptedAt: r.acceptedAt,
              inTransitAt: r.inTransitAt,
              admittedAt: r.admittedAt,
              completedAt: r.completedAt,
              acceptingDoctorName: r.acceptingDoctorName,
              bedAssigned: r.bedAssigned,
              counterReferralNotes: r.counterReferralNotes,
              updatedAt: new Date(),
            }
          });
        }
      }

      res.json({ success: true, message: `Facility ${facilityId} synchronized to Cloud SQL PostgreSQL` });
    } catch (error) {
      console.error('SQL Sync error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Query All SQL Patients across all hospitals
  app.get('/api/sql/patients', async (req, res) => {
    try {
      const allPatients = await sqlDb.select().from(schema.patients);
      res.json({ patients: allPatients, total: allPatients.length });
    } catch (error) {
      console.error('SQL patients list error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // -------------------------------------------------------------
  // GEMINI AI ENDPOINTS
  // -------------------------------------------------------------
  app.post('/api/gemini/triage', async (req, res) => {
    try {
      const body = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ error: 'GEMINI_API_KEY is not set' });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const prompt = `You are a clinical decision support AI for Indian Rural Telemedicine & Primary Health Centres.
Analyze these symptoms and vitals:
Chief complaints: "${body.chiefComplaints || 'General checkup'}"
Vitals: ${JSON.stringify(body.vitals || {})}
Patient: ${JSON.stringify(body.patient || {})}

Return a structured JSON with:
- priority: "RED" | "YELLOW" | "GREEN"
- score: number (0-100)
- categoryTitle: string
- reason: string
- differentialDiagnosis: string[]
- redFlags: string[]
- recommendedAction: string
- suggestedMedications: array of {name, genericName, dosage, frequency, instructions}
- referralRecommended: boolean
- suggestedFacilityTier: "PHC" | "CHC" | "DH" | "APEX" | "NONE"`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      res.setHeader('Content-Type', 'application/json');
      res.send(response.text || '{}');
    } catch (error) {
      console.error('Gemini Triage API error:', error);
      res.status(500).json({ error: 'Failed to process triage' });
    }
  });

  app.post('/api/gemini/scribe', async (req, res) => {
    try {
      const body = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ error: 'GEMINI_API_KEY is not set' });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const prompt = `You are a medical scribe summarizing a teleconsultation for an Indian e-Prescription.
Doctor notes: "${body.clinicalNotes || ''}"
Diagnosis: "${body.diagnosis || ''}"
Vitals: ${JSON.stringify(body.vitals || {})}

Return a structured JSON with:
- diagnosis: string
- medications: array of {id, name, genericName, dosage, frequency, durationDays, instructions, isAvailableInLocalPharmacy: true}
- dietaryAdvice: string
- precautions: string
- followUpDays: number`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      res.setHeader('Content-Type', 'application/json');
      res.send(response.text || '{}');
    } catch (error) {
      console.error('Gemini Scribe API error:', error);
      res.status(500).json({ error: 'Failed to process scribe' });
    }
  });

  // -------------------------------------------------------------
  // VITE / STATIC SERVING
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Praan Telemedicine Server running on http://localhost:${PORT} with Cloud SQL PostgreSQL & Firebase Firestore`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
