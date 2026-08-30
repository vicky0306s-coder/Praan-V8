import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Heart,
  Sparkles,
  Layers,
  ArrowRight,
  Volume2,
  CheckCircle2,
  Ambulance,
  PhoneCall,
  ShieldCheck,
  Stethoscope,
  Info
} from 'lucide-react';
import { Facility, Vitals, TriagePriority, Patient } from '../types';
import { aiService, AiTriageResult } from '../services/aiService';
import { useLanguage } from '../services/languageService';
import { storageService } from '../services/storageService';

interface TriageCDSSViewProps {
  currentFacility: Facility;
  onNavigateToConsult: () => void;
  onOpenReferralModal: (patient: Patient, vitals: Vitals) => void;
}

export const TriageCDSSView: React.FC<TriageCDSSViewProps> = ({
  currentFacility,
  onNavigateToConsult,
  onOpenReferralModal
}) => {
  const { t, speak } = useLanguage();
  const [patientName, setPatientName] = useState<string>('Parvati Devi');
  const [patientAge, setPatientAge] = useState<number>(32);
  const [patientGender, setPatientGender] = useState<string>('Female');
  const [chiefComplaints, setChiefComplaints] = useState<string>(
    'Pregnant 32 weeks, severe persistent headache, blurred vision, swelling in both feet for 3 days.'
  );

  const [vitals, setVitals] = useState<Vitals>({
    bloodPressureSys: 148,
    bloodPressureDia: 96,
    pulseRate: 98,
    spO2: 97,
    temperatureF: 98.4,
    respiratoryRate: 20,
    bloodSugarMgDl: 110,
    hemoglobin: 7.8
  });

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [triageResult, setTriageResult] = useState<AiTriageResult | null>(null);

  const PRESETS = [
    {
      label: 'High-Risk Pregnancy (Pre-eclampsia)',
      name: 'Laxmi Shinde',
      age: 28,
      gender: 'Female',
      complaints: '32 weeks pregnant, high BP, severe headache, blurred vision, pedal edema, Hb 7.8 g/dL.',
      vitals: { bloodPressureSys: 148, bloodPressureDia: 96, pulseRate: 98, spO2: 97, temperatureF: 98.4, respiratoryRate: 20, hemoglobin: 7.8, bloodSugarMgDl: 95 }
    },
    {
      label: 'Acute Chest Pain (STEMI Suspect)',
      name: 'Prakash Gholap',
      age: 49,
      gender: 'Male',
      complaints: 'Sudden crushing retrosternal chest pain radiating to left arm & jaw, heavy diaphoresis, shortness of breath for 45 mins.',
      vitals: { bloodPressureSys: 162, bloodPressureDia: 104, pulseRate: 106, spO2: 93, temperatureF: 98.6, respiratoryRate: 24, bloodSugarMgDl: 290 }
    },
    {
      label: 'Infant Malnutrition & Pneumonia',
      name: 'Baby Aarav',
      age: 2,
      gender: 'Male',
      complaints: 'Severe acute malnutrition MUAC 11.2cm, high fever, fast chest indrawing, poor oral intake since 2 days.',
      vitals: { bloodPressureSys: 90, bloodPressureDia: 58, pulseRate: 122, spO2: 92, temperatureF: 101.4, respiratoryRate: 44, bloodSugarMgDl: 80 }
    },
    {
      label: 'Diabetic Foot Gangrene & Sepsis',
      name: 'Rameshwar Jadhav',
      age: 58,
      gender: 'Male',
      complaints: 'Wagner Grade 3 diabetic foot ulcer, foul smelling blackened toe, ascending red streaks on leg, fever, sugar 340 mg/dL.',
      vitals: { bloodPressureSys: 154, bloodPressureDia: 92, pulseRate: 88, spO2: 98, temperatureF: 99.2, respiratoryRate: 18, bloodSugarMgDl: 340 }
    }
  ];

  const handleApplyPreset = (p: typeof PRESETS[0]) => {
    setPatientName(p.name);
    setPatientAge(p.age);
    setPatientGender(p.gender);
    setChiefComplaints(p.complaints);
    setVitals(p.vitals);
    setTriageResult(null);
  };

  const handleRunTriage = async () => {
    setIsAnalyzing(true);
    try {
      const result = await aiService.analyzeTriage(chiefComplaints, vitals, {
        name: patientName,
        age: patientAge,
        gender: patientGender as 'Male' | 'Female' | 'Other'
      });
      setTriageResult(result);
    } catch (err) {
      console.error('Triage failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSpeakTriageProtocol = () => {
    if (!triageResult) return;
    const text = `Triage Priority is ${triageResult.priority}. ${triageResult.categoryTitle}. Action required: ${triageResult.recommendedAction}. Reason: ${triageResult.reason}`;
    speak(text);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-teal-50 text-teal-700 rounded-xl">
                <Layers className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  {t('navTriage')}
                </h2>
                <p className="text-xs text-slate-500">
                  Indian Public Health Standards (IPHS & IMNCI) grounded frontline emergency triage engine.
                </p>
              </div>
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Emergency Presets:</span>
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleApplyPreset(p)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition cursor-pointer"
              >
                {p.label.split(' ')[0]} {p.label.split(' ')[1]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Form (6 Cols) + Triage Outcome (6 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: Symptoms & Vitals Input */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <Stethoscope className="w-4 h-4 text-teal-600" />
            Patient Clinical Presentation & Vitals
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Patient Name</label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Age</label>
              <input
                type="number"
                value={patientAge}
                onChange={(e) => setPatientAge(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={patientGender}
                onChange={(e) => setPatientGender(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-semibold text-slate-700 mb-1">
              Chief Complaints & Symptoms
            </label>
            <textarea
              rows={3}
              value={chiefComplaints}
              onChange={(e) => setChiefComplaints(e.target.value)}
              placeholder="Describe symptoms, duration, severe pain or danger signs..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          {/* Vitals Grid */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-800">
              {t('vitalsHud')} (Telemetry Input)
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 font-semibold block">{t('bloodPressure')}</span>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    value={vitals.bloodPressureSys}
                    onChange={(e) => setVitals({ ...vitals, bloodPressureSys: Number(e.target.value) })}
                    className="w-10 font-bold text-center bg-white border border-slate-200 rounded py-0.5"
                  />
                  <span className="text-slate-400">/</span>
                  <input
                    type="number"
                    value={vitals.bloodPressureDia}
                    onChange={(e) => setVitals({ ...vitals, bloodPressureDia: Number(e.target.value) })}
                    className="w-10 font-bold text-center bg-white border border-slate-200 rounded py-0.5"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 font-semibold block">{t('spO2')} (%)</span>
                <input
                  type="number"
                  value={vitals.spO2}
                  onChange={(e) => setVitals({ ...vitals, spO2: Number(e.target.value) })}
                  className="w-full mt-1 font-bold text-center bg-white border border-slate-200 rounded py-0.5"
                />
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 font-semibold block">{t('pulseRate')} (BPM)</span>
                <input
                  type="number"
                  value={vitals.pulseRate}
                  onChange={(e) => setVitals({ ...vitals, pulseRate: Number(e.target.value) })}
                  className="w-full mt-1 font-bold text-center bg-white border border-slate-200 rounded py-0.5"
                />
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 font-semibold block">{t('bloodSugar')} (mg/dL)</span>
                <input
                  type="number"
                  value={vitals.bloodSugarMgDl || 120}
                  onChange={(e) => setVitals({ ...vitals, bloodSugarMgDl: Number(e.target.value) })}
                  className="w-full mt-1 font-bold text-center bg-white border border-slate-200 rounded py-0.5"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            id="run-triage-assessment-button"
            onClick={handleRunTriage}
            disabled={isAnalyzing}
            className="w-full py-3 px-4 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isAnalyzing ? 'Evaluating CDSS Engine...' : 'Run Digital Triage Assessment'}</span>
          </button>
        </div>

        {/* Right: Triage Decision & CDSS Protocols */}
        <div className="lg:col-span-6 space-y-4">
          {triageResult ? (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in duration-150">
              {/* Severity Score Banner */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  triageResult.priority === 'RED'
                    ? 'bg-rose-50 border-rose-300 text-rose-900'
                    : triageResult.priority === 'YELLOW'
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border">
                      {triageResult.priority} Zone
                    </span>
                    <span className="text-xs font-mono font-bold">
                      Severity Score: {triageResult.score}/100
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base sm:text-lg mt-1">
                    {triageResult.categoryTitle}
                  </h3>
                  <p className="text-xs mt-0.5 opacity-90">
                    {triageResult.reason}
                  </p>
                </div>

                <button
                  onClick={handleSpeakTriageProtocol}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white rounded-xl shadow-xs text-xs font-bold text-slate-800 hover:bg-slate-50 cursor-pointer shrink-0 border"
                >
                  <Volume2 className="w-4 h-4 text-teal-600" />
                  <span>Listen</span>
                </button>
              </div>

              {/* Red Flags & Differential Diagnosis */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    {t('redFlagAlerts')}
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                    {triageResult.redFlags.map((flag, i) => (
                      <li key={i}>{flag}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                    {t('differentialDiagnosis')}
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                    {triageResult.differentialDiagnosis.map((diag, i) => (
                      <li key={i}>{diag}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Actionable Clinical Protocol for Frontline Health Worker */}
              <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-teal-900 font-bold">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  <span>Mandated Frontline Protocol Action (ASHA / ANM):</span>
                </div>
                <p className="text-slate-700 text-xs leading-relaxed">
                  {triageResult.recommendedAction}
                </p>
              </div>

              {/* Recommended Emergency / Referral Escalation */}
              {triageResult.referralRecommended && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div>
                    <strong className="text-rose-900 block font-bold">
                      Escalation Tier: Transfer to {triageResult.suggestedFacilityTier} Hospital
                    </strong>
                    <span className="text-rose-700 text-[11px]">
                      Patient requires specialist evaluation beyond Sub-Centre capabilities.
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      const dummyPatient: Patient = {
                        id: `PAT-TRIAGE-${Date.now()}`,
                        abhaId: '91-4421-9988-1122',
                        name: patientName,
                        age: patientAge,
                        gender: patientGender as 'Male' | 'Female' | 'Other',
                        phone: '+91 98221 11223',
                        village: currentFacility.block + ' Rural',
                        block: currentFacility.block,
                        district: currentFacility.district,
                        registeredFacilityId: currentFacility.id,
                        registeredDate: new Date().toISOString().split('T')[0],
                        bloodGroup: 'B Positive',
                        emergencyContactName: 'Family',
                        emergencyContactPhone: '+91 98221 00000',
                        allergies: [],
                        chronicConditions: [],
                        riskCategory: 'High',
                        ashaWorkerName: currentFacility.staffName,
                        ashaWorkerPhone: currentFacility.contactNumber,
                        lastVisitDate: new Date().toISOString().split('T')[0],
                        pastHistorySummary: chiefComplaints
                      };
                      onOpenReferralModal(dummyPatient, vitals);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer shrink-0"
                  >
                    <Ambulance className="w-3.5 h-3.5" />
                    <span>Dispatch Referral</span>
                  </button>
                </div>
              )}

              {/* Connect to Tele-OPD button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onNavigateToConsult}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Queue in Live Teleconsultation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs space-y-2">
              <Info className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-600">No active triage evaluation.</p>
              <p>Fill in patient symptoms and vitals on the left, or select an Emergency Preset above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
