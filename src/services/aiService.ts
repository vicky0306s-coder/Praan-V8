import { Vitals, Patient, TriagePriority } from '../types';

export interface AiTriageResult {
  priority: TriagePriority;
  score: number; // 0 to 100
  categoryTitle: string;
  reason: string;
  differentialDiagnosis: string[];
  redFlags: string[];
  recommendedAction: string;
  suggestedMedications: Array<{
    name: string;
    genericName: string;
    dosage: string;
    frequency: string;
    instructions: string;
  }>;
  referralRecommended: boolean;
  suggestedFacilityTier: 'PHC' | 'CHC' | 'DH' | 'APEX' | 'NONE';
}

export class AiService {
  public async analyzeTriage(
    chiefComplaints: string,
    vitals: Vitals,
    patient?: Partial<Patient>
  ): Promise<AiTriageResult> {
    try {
      const res = await fetch('/api/gemini/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chiefComplaints, vitals, patient })
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.priority) {
          return data as AiTriageResult;
        }
      }
    } catch (err) {
      console.warn('Server-side Gemini Triage unavailable, using built-in CDSS clinical engine:', err);
    }

    // Built-in CDSS Clinical Rule Engine (Guideline-grounded Indian Public Health protocols)
    return this.computeDeterministicCDSS(chiefComplaints, vitals, patient);
  }

  public async generatePrescriptionScribe(
    clinicalNotes: string,
    diagnosis: string,
    vitals: Vitals
  ): Promise<{
    diagnosis: string;
    medications: Array<{
      id: string;
      name: string;
      genericName: string;
      dosage: string;
      frequency: string;
      durationDays: number;
      instructions: string;
      isAvailableInLocalPharmacy: boolean;
    }>;
    dietaryAdvice: string;
    precautions: string;
    followUpDays: number;
  }> {
    try {
      const res = await fetch('/api/gemini/scribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicalNotes, diagnosis, vitals })
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.medications) {
          return data;
        }
      }
    } catch (err) {
      console.warn('Server-side Gemini Scribe fallback:', err);
    }

    // Deterministic fallback clinical scribe
    return this.computeDeterministicScribe(clinicalNotes, diagnosis, vitals);
  }

  private computeDeterministicCDSS(
    chiefComplaints: string,
    vitals: Vitals,
    patient?: Partial<Patient>
  ): AiTriageResult {
    const text = chiefComplaints.toLowerCase();
    let score = 20;
    let priority: TriagePriority = 'GREEN';
    const differentialDiagnosis: string[] = [];
    const redFlags: string[] = [];
    let recommendedAction = 'Routine OPD examination, lifestyle counseling, and symptomatic treatment.';
    let referralRecommended = false;
    let suggestedFacilityTier: 'PHC' | 'CHC' | 'DH' | 'APEX' | 'NONE' = 'NONE';
    const suggestedMedications: AiTriageResult['suggestedMedications'] = [];

    // Check acute cardiac / chest pain
    if (text.includes('chest pain') || text.includes('radiating') || text.includes('diaphoretic') || text.includes('heart') || text.includes('stemi')) {
      score = 96;
      priority = 'RED';
      differentialDiagnosis.push('Acute Coronary Syndrome (STEMI / NSTEMI)', 'Unstable Angina', 'Acute Myocarditis');
      redFlags.push('Substernal radiating chest pain', 'Diaphoresis and elevated heart rate', 'Potential cardiogenic shock');
      recommendedAction = 'Administer loading dose of Dispirin 300mg + Clopidogrel 300mg + Atorvastatin 80mg immediately. Perform 12-lead Tele-ECG and dispatch 108 ALS Ambulance to Apex CathLab.';
      referralRecommended = true;
      suggestedFacilityTier = 'APEX';
      suggestedMedications.push(
        { name: 'Tab Dispirin 300mg', genericName: 'Soluble Aspirin', dosage: '300mg stat chewed', frequency: 'Stat (One-time)', instructions: 'Chew immediately with water' },
        { name: 'Tab Clopidogrel 300mg', genericName: 'Clopidogrel', dosage: '300mg stat', frequency: 'Stat (One-time)', instructions: 'Loading dose' },
        { name: 'Tab Atorvastatin 80mg', genericName: 'Atorvastatin', dosage: '80mg stat', frequency: 'Stat (One-time)', instructions: 'Cardioprotective' }
      );
    }
    // Check maternal pre-eclampsia / high-risk ANC
    else if (text.includes('pregnant') || text.includes('anc') || text.includes('gestation') || text.includes('preeclampsia') || patient?.highRiskType === 'ANC_HIGH_RISK') {
      if (vitals.bloodPressureSys >= 140 || vitals.bloodPressureDia >= 90 || (vitals.hemoglobin && vitals.hemoglobin < 8)) {
        score = 88;
        priority = 'RED';
        differentialDiagnosis.push('Pre-eclampsia with Impending Eclampsia', 'Severe Nutritional Anemia in Pregnancy', 'Gestational Hypertension');
        redFlags.push('Diastolic BP >= 90 mmHg with headache/visual changes', 'Severe Anemia with Hb < 8 g/dL (High risk of heart failure during labor)');
        recommendedAction = 'Initiate Oral Nifedipine 10mg retard for acute BP control. Arrange urgent transfer to CHC/Sub-District Hospital for parenteral iron (IV Ferric Carboxymaltose) & obstetric ultrasound.';
        referralRecommended = true;
        suggestedFacilityTier = 'CHC';
        suggestedMedications.push(
          { name: 'Tab Nifedipine Retard 10mg', genericName: 'Nifedipine', dosage: '10mg', frequency: '1-0-1 (Twice daily)', instructions: 'Swallow whole, monitor BP every 4 hours' },
          { name: 'Tab Iron Folic Acid (IFA Red)', genericName: 'Ferrous Sulfate + Folic Acid', dosage: '100mg elemental iron', frequency: '0-1-0 (After Lunch)', instructions: 'Take with lemon water or amla, avoid tea/coffee' }
        );
      } else {
        score = 55;
        priority = 'YELLOW';
        differentialDiagnosis.push('Routine High-Risk ANC Monitoring', 'Mild Anemia');
        recommendedAction = 'Regular ANC checkup, hemoglobin review in 2 weeks, calcium and iron supplementation.';
        suggestedFacilityTier = 'PHC';
      }
    }
    // Check Diabetic Foot / Sepsis
    else if (text.includes('ulcer') || text.includes('gangrene') || text.includes('diabetic foot') || (vitals.bloodSugarMgDl && vitals.bloodSugarMgDl > 280)) {
      score = 78;
      priority = 'YELLOW';
      differentialDiagnosis.push('Diabetic Foot Ulcer (Wagner Grade 2-3)', 'Peripheral Arterial Disease', 'Cellulitis & Deep Soft Tissue Infection');
      redFlags.push('High blood sugar > 280 mg/dL', 'Active spreading infection with necrosis risk');
      recommendedAction = 'Initiate broad spectrum antibiotics (Ceftriaxone 1g IV + Metronidazole 500mg IV). Refer to District Hospital for surgical debridement and glycemic stabilization with Regular Insulin.';
      referralRecommended = true;
      suggestedFacilityTier = 'DH';
      suggestedMedications.push(
        { name: 'Inj Ceftriaxone 1g', genericName: 'Ceftriaxone Sodium', dosage: '1g IV', frequency: '1-0-1 (Every 12 hrs)', instructions: 'Slow IV injection over 5 mins' },
        { name: 'Inj Regular Human Insulin', genericName: 'Soluble Insulin 40 IU/mL', dosage: 'As per sliding scale', frequency: 'TID Before Meals', instructions: 'Subcutaneous injection 20 mins before food' }
      );
    }
    // Check Pediatric / Malnutrition / High Fever
    else if (text.includes('child') || text.includes('infant') || text.includes('malnutrition') || text.includes('diarrhea') || (patient?.age && patient.age < 5)) {
      if (vitals.temperatureF >= 101 || (vitals.spO2 && vitals.spO2 < 94) || vitals.respiratoryRate > 40) {
        score = 82;
        priority = 'RED';
        differentialDiagnosis.push('Severe Acute Pneumonia / Bronchiolitis', 'Severe Acute Malnutrition (SAM) with Dehydration', 'Febrile Convulsion Risk');
        redFlags.push('Fast breathing (Tachypnea)', 'High fever with lethargy and poor feeding');
        recommendedAction = 'Administer nebulized Salbutamol if wheeze present, start oral Amoxicillin or IV Ceftriaxone. Refer to NRC (Nutrition Rehabilitation Centre) or Pediatric Unit.';
        referralRecommended = true;
        suggestedFacilityTier = 'CHC';
      } else {
        score = 45;
        priority = 'YELLOW';
        differentialDiagnosis.push('Acute Viral Upper Respiratory Tract Infection', 'Mild Dehydration');
        recommendedAction = 'Oral rehydration therapy with WHO ORS + Zinc syrup 20mg daily for 14 days, Paracetamol syrup for fever.';
        suggestedFacilityTier = 'PHC';
      }
    }
    // Check Respiratory Distress / Low SpO2
    else if (vitals.spO2 && vitals.spO2 < 90) {
      score = 92;
      priority = 'RED';
      differentialDiagnosis.push('Severe Hypoxemic Respiratory Failure', 'Acute Exacerbation of COPD / Asthma', 'Acute Pulmonary Embolism');
      redFlags.push('SpO2 < 90% on room air', 'Severe respiratory distress with intercostal retractions');
      recommendedAction = 'Start high-flow oxygen via mask at 4-6 L/min. Nebulize with Duolin (Levosalbutamol + Ipratropium) and Budecort. Urgent transfer to ICU at District Hospital.';
      referralRecommended = true;
      suggestedFacilityTier = 'DH';
    }
    // Check severe hypertension
    else if (vitals.bloodPressureSys >= 180 || vitals.bloodPressureDia >= 110) {
      score = 85;
      priority = 'RED';
      differentialDiagnosis.push('Hypertensive Urgency / Emergency', 'Acute Left Ventricular Failure Suspect');
      redFlags.push('Severe grade 3 hypertension with organ damage risk');
      recommendedAction = 'Oral Amlodipine 10mg stat or Clonidine. Check for neurologic symptoms. Arrange higher center physician consult.';
      referralRecommended = true;
      suggestedFacilityTier = 'DH';
    } else {
      score = 25;
      priority = 'GREEN';
      differentialDiagnosis.push('Common Viral Illness / Non-Specific Febrile State', 'Mild Musculoskeletal Pain / Tension Headache');
      redFlags.push('No acute physiological instability observed');
      recommendedAction = 'Continue symptomatic treatment, adequate oral hydration, and follow up if symptoms persist after 48 hours.';
      referralRecommended = false;
      suggestedFacilityTier = 'NONE';
      suggestedMedications.push(
        { name: 'Tab Paracetamol 500mg', genericName: 'Paracetamol', dosage: '500mg', frequency: '1-0-1 (As needed)', instructions: 'Take after meals for fever or body ache' },
        { name: 'ORS Sachet', genericName: 'Oral Rehydration Salts', dosage: '1 packet in 1L water', frequency: 'Sip throughout day', instructions: 'Maintain adequate fluid intake' }
      );
    }

    return {
      priority,
      score,
      categoryTitle: priority === 'RED' ? 'Critical Emergency (Red Zone)' : priority === 'YELLOW' ? 'Urgent / Priority Care (Yellow Zone)' : 'Standard Routine (Green Zone)',
      reason: redFlags.length > 0 ? redFlags.join('. ') : 'Vitals and complaints within non-critical baseline parameters.',
      differentialDiagnosis,
      redFlags,
      recommendedAction,
      suggestedMedications,
      referralRecommended,
      suggestedFacilityTier
    };
  }

  private computeDeterministicScribe(
    clinicalNotes: string,
    diagnosis: string,
    vitals: Vitals
  ) {
    const diag = diagnosis.toLowerCase();
    const meds: Array<{
      id: string;
      name: string;
      genericName: string;
      dosage: string;
      frequency: string;
      durationDays: number;
      instructions: string;
      isAvailableInLocalPharmacy: boolean;
    }> = [];

    if (diag.includes('hypertension') || vitals.bloodPressureSys >= 140) {
      meds.push({
        id: 'MED-SCRIBE-01',
        name: 'Tab Amlodipine 5mg',
        genericName: 'Amlodipine Besylate',
        dosage: '5mg',
        frequency: '0-0-1 (Night)',
        durationDays: 30,
        instructions: 'Take daily at bedtime. Restrict dietary sodium (<5g/day).',
        isAvailableInLocalPharmacy: true
      });
    }

    if (diag.includes('diabetes') || (vitals.bloodSugarMgDl && vitals.bloodSugarMgDl > 180)) {
      meds.push({
        id: 'MED-SCRIBE-02',
        name: 'Tab Metformin 500mg',
        genericName: 'Metformin Hydrochloride',
        dosage: '500mg',
        frequency: '1-0-1 (After Meals)',
        durationDays: 30,
        instructions: 'Take immediately after food to avoid gastric upset.',
        isAvailableInLocalPharmacy: true
      });
    }

    if (diag.includes('anemia') || (vitals.hemoglobin && vitals.hemoglobin < 10)) {
      meds.push({
        id: 'MED-SCRIBE-03',
        name: 'Tab Iron & Folic Acid (IFA Red)',
        genericName: 'Ferrous Sulfate 100mg + Folic Acid 0.5mg',
        dosage: '1 Tablet',
        frequency: '0-1-0 (After Lunch)',
        durationDays: 60,
        instructions: 'Take with lemon water or citrus fruits. Stools may turn dark, which is normal.',
        isAvailableInLocalPharmacy: true
      });
    }

    if (meds.length === 0) {
      meds.push(
        {
          id: 'MED-SCRIBE-04',
          name: 'Tab Paracetamol 500mg',
          genericName: 'Paracetamol IP',
          dosage: '500mg',
          frequency: '1-0-1 (SOS / When required)',
          durationDays: 5,
          instructions: 'Take after food for fever or pain relief.',
          isAvailableInLocalPharmacy: true
        },
        {
          id: 'MED-SCRIBE-05',
          name: 'Cap Vitamin B-Complex with Zinc',
          genericName: 'B-Complex + Zinc',
          dosage: '1 Capsule',
          frequency: '1-0-0 (Morning)',
          durationDays: 15,
          instructions: 'Nutritional restorative therapy.',
          isAvailableInLocalPharmacy: true
        }
      );
    }

    return {
      diagnosis: diagnosis || 'Clinical assessment based on telemedicine review',
      medications: meds,
      dietaryAdvice: 'Maintain light, nutritious diet. Drink boiled and cooled water. Avoid excess salt and refined sugar.',
      precautions: 'Seek immediate emergency care if breathing difficulty, severe chest pain, or sudden loss of consciousness occurs.',
      followUpDays: 7
    };
  }
}

export const aiService = new AiService();
