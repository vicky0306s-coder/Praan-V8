import React, { useState, useEffect } from 'react';
import {
  Video,
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  Share2,
  Sparkles,
  Printer,
  QrCode,
  AlertTriangle,
  Send,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  User,
  Heart,
  Activity,
  FileText,
  Ambulance,
  PhoneCall,
  Languages
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Facility,
  Teleconsultation,
  Patient,
  Vitals,
  Medication,
  Prescription,
  TriagePriority
} from '../types';
import { FACILITIES } from '../data/initialData';
import { storageService } from '../services/storageService';
import { useLanguage } from '../services/languageService';
import { aiService } from '../services/aiService';

interface TeleconsultationViewProps {
  currentFacility: Facility;
  isOffline: boolean;
  onOpenReferralModal: (patient: Patient, vitals: Vitals) => void;
  onTriggerSos: () => void;
}

export const TeleconsultationView: React.FC<TeleconsultationViewProps> = ({
  currentFacility,
  isOffline,
  onOpenReferralModal,
  onTriggerSos
}) => {
  const { t, speak } = useLanguage();
  const [teleconsultations, setTeleconsultations] = useState<Teleconsultation[]>([]);
  const [selectedTc, setSelectedTc] = useState<Teleconsultation | null>(null);
  const [micMuted, setMicMuted] = useState<boolean>(false);
  const [cameraOff, setCameraOff] = useState<boolean>(false);
  const [doctorStreamActive, setDoctorStreamActive] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'rx' | 'ai' | 'vitals' | 'notes'>('rx');

  // Vitals form
  const [vitals, setVitals] = useState<Vitals>({
    bloodPressureSys: 130,
    bloodPressureDia: 85,
    pulseRate: 82,
    spO2: 98,
    temperatureF: 98.6,
    respiratoryRate: 18,
    bloodSugarMgDl: 135
  });

  // Clinical Scribe & Prescription state
  const [diagnosisInput, setDiagnosisInput] = useState<string>('');
  const [clinicalNotesInput, setClinicalNotesInput] = useState<string>('');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [dietaryAdvice, setDietaryAdvice] = useState<string>('');
  const [precautions, setPrecautions] = useState<string>('');
  const [followUpDays, setFollowUpDays] = useState<number>(7);
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [prescriptionSaved, setPrescriptionSaved] = useState<boolean>(false);
  const [generatedPrescription, setGeneratedPrescription] = useState<Prescription | null>(null);

  // New consultation modal
  const [showNewTcModal, setShowNewTcModal] = useState<boolean>(false);
  const [newPatientName, setNewPatientName] = useState<string>('');
  const [newPatientAge, setNewPatientAge] = useState<number>(30);
  const [newPatientGender, setNewPatientGender] = useState<string>('Female');
  const [newChiefComplaints, setNewChiefComplaints] = useState<string>('');
  const [newConsultingFacilityId, setNewConsultingFacilityId] = useState<string>('CHC-03');

  const loadData = () => {
    const db = storageService.getFacilityDb(currentFacility.id);
    setTeleconsultations(db.teleconsultations || []);

    if (db.teleconsultations && db.teleconsultations.length > 0 && !selectedTc) {
      const active = db.teleconsultations.find((tc) => tc.status === 'In Progress') || db.teleconsultations[0];
      selectConsultation(active);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = storageService.subscribe(loadData);
    return () => unsub();
  }, [currentFacility.id]);

  const selectConsultation = (tc: Teleconsultation) => {
    setSelectedTc(tc);
    setVitals(tc.vitals);
    setDiagnosisInput(tc.prescription?.diagnosis || tc.aiDifferentialDiagnosis?.[0] || 'Gestational Hypertension & Moderate Anemia');
    setClinicalNotesInput(tc.prescription?.clinicalNotes || tc.chiefComplaints || '');
    setMedications(
      tc.prescription?.medications || [
        {
          id: 'MED-1',
          name: 'Tab Amlodipine 5mg',
          genericName: 'Amlodipine Besylate',
          dosage: '5mg',
          frequency: '0-0-1 (Night after food)',
          durationDays: 30,
          instructions: 'Take daily with water. Monitor BP weekly.',
          isAvailableInLocalPharmacy: true
        },
        {
          id: 'MED-2',
          name: 'Tab Iron & Folic Acid (IFA Red)',
          genericName: 'Ferrous Sulfate + Folic Acid',
          dosage: '100mg Iron + 0.5mg FA',
          frequency: '0-1-0 (After Lunch)',
          durationDays: 60,
          instructions: 'Take with citrus fruit juice, avoid milk/tea with tablet.',
          isAvailableInLocalPharmacy: true
        }
      ]
    );
    setDietaryAdvice(tc.prescription?.dietaryAdvice || 'Consume green leafy vegetables (Palak/Methi), jaggery, beetroot, and boiled eggs. Low-sodium diet.');
    setPrecautions(tc.prescription?.precautions || 'Seek emergency care immediately if severe headache, blurred vision, or epigastric pain develops.');
    setGeneratedPrescription(tc.prescription || null);
    setPrescriptionSaved(!!tc.prescription);
  };

  const handleTriggerAiScribe = async () => {
    setIsAiGenerating(true);
    try {
      const result = await aiService.generatePrescriptionScribe(
        clinicalNotesInput || selectedTc?.chiefComplaints || '',
        diagnosisInput || selectedTc?.aiDifferentialDiagnosis?.[0] || '',
        vitals
      );

      if (result) {
        setDiagnosisInput(result.diagnosis);
        setMedications(result.medications);
        setDietaryAdvice(result.dietaryAdvice);
        setPrecautions(result.precautions);
        setFollowUpDays(result.followUpDays);
      }
    } catch (err) {
      console.error('AI Scribe Error:', err);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleAddMedication = () => {
    const newMed: Medication = {
      id: `MED-${Date.now()}`,
      name: 'Tab Paracetamol 500mg',
      genericName: 'Paracetamol IP',
      dosage: '500mg',
      frequency: '1-0-1 (After Meals)',
      durationDays: 5,
      instructions: 'For pain or fever SOS',
      isAvailableInLocalPharmacy: true
    };
    setMedications([...medications, newMed]);
  };

  const handleRemoveMedication = (id: string) => {
    setMedications(medications.filter((m) => m.id !== id));
  };

  const handleSavePrescription = () => {
    if (!selectedTc) return;

    const newRx: Prescription = {
      id: `RX-ABDM-${Date.now()}`,
      consultationId: selectedTc.id,
      patientId: selectedTc.patientId,
      doctorName: selectedTc.consultingDoctorName || currentFacility.staffName,
      doctorRegistration: 'MCI-2018-09941',
      facilityName: currentFacility.name,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      diagnosis: diagnosisInput,
      clinicalNotes: clinicalNotesInput,
      medications,
      dietaryAdvice,
      precautions,
      followUpDate: new Date(Date.now() + followUpDays * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      signedAbdmId: `ABDM-V3-SIGN-${selectedTc.patientAbhaId}`
    };

    const updatedTc: Teleconsultation = {
      ...selectedTc,
      status: 'Completed',
      completedAt: new Date().toISOString(),
      vitals,
      prescription: newRx
    };

    storageService.updateTeleconsultation(updatedTc);
    setGeneratedPrescription(newRx);
    setPrescriptionSaved(true);
    setSelectedTc(updatedTc);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });
  };

  const handleSpeakPrescriptionAdvice = () => {
    const text = `Prescription instructions for ${selectedTc?.patientName || 'patient'}. Diagnosis: ${diagnosisInput}. Advice: ${dietaryAdvice}. Precautions: ${precautions}. Follow up in ${followUpDays} days.`;
    speak(text);
  };

  const handleCreateNewConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) return;

    const targetFac = FACILITIES.find((f) => f.id === newConsultingFacilityId) || FACILITIES[2];
    const dummyAbha = `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPatient: Patient = {
      id: `PAT-${Date.now()}`,
      abhaId: dummyAbha,
      name: newPatientName,
      age: Number(newPatientAge),
      gender: newPatientGender as 'Male' | 'Female' | 'Other',
      phone: '+91 98220 ' + Math.floor(10000 + Math.random() * 90000),
      village: currentFacility.block + ' Rural',
      block: currentFacility.block,
      district: currentFacility.district,
      registeredFacilityId: currentFacility.id,
      registeredDate: new Date().toISOString().split('T')[0],
      bloodGroup: 'B Positive',
      emergencyContactName: 'Relative',
      emergencyContactPhone: '+91 98220 00000',
      allergies: [],
      chronicConditions: [],
      currentVitals: vitals,
      riskCategory: 'Medium',
      ashaWorkerName: currentFacility.staffName,
      ashaWorkerPhone: currentFacility.contactNumber,
      lastVisitDate: new Date().toISOString().split('T')[0],
      pastHistorySummary: newChiefComplaints
    };

    storageService.addPatient(currentFacility.id, newPatient);

    // AI Triage assessment
    const triageAnalysis = await aiService.analyzeTriage(newChiefComplaints, vitals, newPatient);

    const newTc: Teleconsultation = {
      id: `TC-${Date.now()}`,
      tokenNumber: teleconsultations.length + 1,
      patientId: newPatient.id,
      patientName: newPatient.name,
      patientAge: newPatient.age,
      patientGender: newPatient.gender,
      patientAbhaId: newPatient.abhaId,
      patientVillage: newPatient.village,
      requestingFacilityId: currentFacility.id,
      requestingFacilityName: currentFacility.name,
      consultingFacilityId: targetFac.id,
      consultingFacilityName: targetFac.name,
      consultingDoctorName: targetFac.staffName,
      specialityRequired: targetFac.activeSpecialities[0] || 'General Medicine',
      assistedByAshaName: `${currentFacility.staffName} (${currentFacility.tier})`,
      chiefComplaints: newChiefComplaints,
      symptomsDuration: '2 days',
      vitals,
      triagePriority: triageAnalysis.priority,
      triageScore: triageAnalysis.score,
      triageReason: triageAnalysis.reason,
      status: 'In Progress',
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      meetingRoomId: `room_${currentFacility.id.toLowerCase()}_${Date.now()}`,
      aiDifferentialDiagnosis: triageAnalysis.differentialDiagnosis,
      aiRedFlags: triageAnalysis.redFlags,
      aiRecommendedAction: triageAnalysis.recommendedAction
    };

    storageService.createTeleconsultation(currentFacility.id, newTc);
    setShowNewTcModal(false);
    selectConsultation(newTc);
  };

  const getPriorityBadgeClass = (priority: TriagePriority) => {
    switch (priority) {
      case 'RED':
        return 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse font-bold';
      case 'YELLOW':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
      case 'GREEN':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Queue Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#fffdf8] p-4 rounded-2xl border border-[#e4ded0] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#173b3b]">
              {t('navConsultation')}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#166458]/15 text-[#166458] font-bold border border-[#166458]/30">
              {teleconsultations.length} in Active OPD Queue
            </span>
          </div>
          <p className="text-xs text-[#55706d] mt-0.5">
            Frontline ANM/ASHA assisted video room with live telemetry, CDSS intelligence & verifiable ABDM e-Prescriptions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="start-new-teleconsult-button"
            onClick={() => setShowNewTcModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#166458] hover:bg-[#0e534d] text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('newConsultation')}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left OPD Queue (4 Cols) + Right Active Video & Rx Room (8 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Queue List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-[#173b3b] px-1">
            <span>{t('navQueue')}</span>
            <span className="text-[#8a9992] font-normal">Sorted by Triage Priority</span>
          </div>

          <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
            {teleconsultations.length === 0 ? (
              <div className="p-8 text-center bg-[#fffdf8] rounded-2xl border border-[#e4ded0] text-[#8a9992] text-xs">
                No patients waiting in queue. Click "Start Assisted Consultation" above.
              </div>
            ) : (
              teleconsultations.map((tc) => {
                const isSelected = selectedTc?.id === tc.id;
                return (
                  <div
                    key={tc.id}
                    id={`queue-card-${tc.id}`}
                    onClick={() => selectConsultation(tc)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer bg-[#fffdf8] ${
                      isSelected
                        ? 'border-[#166458] ring-2 ring-[#166458]/20 shadow-sm'
                        : 'border-[#e4ded0] hover:border-[#166458]/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#173b3b] text-sm">
                            {tc.patientName}
                          </span>
                          <span className="text-xs text-[#6e817c]">
                            {tc.patientAge}y • {tc.patientGender}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#55706d] line-clamp-1 mt-0.5">
                          {tc.chiefComplaints}
                        </p>
                      </div>

                      <span className={`text-[10px] uppercase px-2 py-0.5 rounded-md border ${getPriorityBadgeClass(tc.triagePriority)}`}>
                        {tc.triagePriority} ({tc.triageScore})
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-[#e4ded0] flex items-center justify-between text-[10px] text-[#6e817c]">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span className="w-2 h-2 rounded-full bg-[#166458]"></span>
                        <span>Doc: {tc.consultingDoctorName.split(' ')[0]} {tc.consultingDoctorName.split(' ')[1]}</span>
                      </div>
                      <span className={`font-semibold ${tc.status === 'Completed' ? 'text-[#166458]' : 'text-[#ba704f]'}`}>
                        {tc.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Consultation Suite (Video Room + CDSS + Rx) */}
        {selectedTc ? (
          <div className="lg:col-span-8 space-y-5">
            {/* 1. Video Teleconsultation Screen */}
            <div className="bg-[#0e534d] rounded-2xl overflow-hidden shadow-soft border border-[#166458]/40 text-white relative">
              <div className="p-3 bg-[#0a3f3a] border-b border-[#166458]/50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c4684e] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#c4684e]"></span>
                  </span>
                  <span className="font-bold text-white">Live Tele-OPD Room: {selectedTc.meetingRoomId}</span>
                  <span className="text-white/70 hidden sm:inline">| {selectedTc.consultingFacilityName}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getPriorityBadgeClass(selectedTc.triagePriority)}`}>
                    {selectedTc.triagePriority} PRIORITY
                  </span>
                </div>
              </div>

              {/* Video Stream Stage */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 min-h-[260px] bg-[#093531]">
                {/* Doctor Stream View */}
                <div className="relative rounded-xl overflow-hidden bg-[#166458]/40 border border-white/10 flex flex-col items-center justify-center p-4">
                  <div className="w-20 h-20 rounded-full bg-[#166458] border-2 border-[#f4bd64] flex items-center justify-center text-[#f4bd64] text-2xl font-bold mb-3 shadow-lg">
                    👨‍⚕️
                  </div>
                  <h4 className="font-bold text-white text-sm">
                    {selectedTc.consultingDoctorName}
                  </h4>
                  <p className="text-[11px] text-[#f4bd64] font-medium">
                    {selectedTc.specialityRequired} • {selectedTc.consultingFacilityName}
                  </p>
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono text-[#f4bd64] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f4bd64] animate-pulse"></span>
                    Remote Doctor Active
                  </div>
                </div>

                {/* Patient + ASHA Stream View */}
                <div className="relative rounded-xl overflow-hidden bg-[#166458]/40 border border-white/10 flex flex-col items-center justify-center p-4">
                  <div className="w-20 h-20 rounded-full bg-[#c4684e] border-2 border-[#f4bd64] flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-lg">
                    👩‍🌾
                  </div>
                  <h4 className="font-bold text-white text-sm">
                    {selectedTc.patientName} ({selectedTc.patientAge}y / {selectedTc.patientGender})
                  </h4>
                  <p className="text-[11px] text-[#f4bd64] font-medium">
                    Assisted by: {selectedTc.assistedByAshaName}
                  </p>
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono text-[#f4bd64] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f4bd64]"></span>
                    Frontline Tele-Station: {currentFacility.shortName}
                  </div>
                </div>
              </div>

              {/* In-Call Controls Bar */}
              <div className="p-3 bg-[#0a3f3a] border-t border-[#166458]/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMicMuted(!micMuted)}
                    className={`p-2 rounded-lg text-xs font-semibold cursor-pointer transition ${
                      micMuted ? 'bg-[#c4684e] text-white' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                    title="Toggle Microphone"
                  >
                    {micMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setCameraOff(!cameraOff)}
                    className={`p-2 rounded-lg text-xs font-semibold cursor-pointer transition ${
                      cameraOff ? 'bg-[#c4684e] text-white' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                    title="Toggle Camera"
                  >
                    <Video className="w-4 h-4" />
                  </button>

                  {/* Audio Translator Speak */}
                  <button
                    id="listen-doctor-advice-btn"
                    onClick={handleSpeakPrescriptionAdvice}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#166458] hover:bg-[#0e534d] text-white text-xs font-bold cursor-pointer transition shadow-xs border border-white/20"
                    title="Translate doctor's instructions into patient local language with voice"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{t('speakOutLoud')}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Referral Trigger */}
                  <button
                    id="teleconsult-refer-button"
                    onClick={() => {
                      const patientObj = storageService.getPatientAcrossAllDatabases(selectedTc.patientId);
                      if (patientObj) {
                        onOpenReferralModal(patientObj, vitals);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f4bd64] hover:bg-[#e0aa54] text-[#173b3b] text-xs font-bold cursor-pointer shadow-xs"
                  >
                    <Ambulance className="w-3.5 h-3.5" />
                    <span>{t('referPatient')}</span>
                  </button>

                  <button
                    onClick={() => {
                      const updated = { ...selectedTc, status: 'Completed' as const };
                      storageService.updateTeleconsultation(updated);
                      setSelectedTc(updated);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#c4684e] hover:bg-[#aa523e] text-white text-xs font-bold cursor-pointer"
                  >
                    <PhoneOff className="w-3.5 h-3.5" />
                    <span>End Consult</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Interactive Vitals & Diagnostic Telemetry Bar */}
            <div className="bg-[#fffdf8] rounded-2xl p-4 border border-[#e4ded0] shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#166458]" />
                  <h3 className="font-bold text-[#173b3b] text-xs uppercase tracking-wider">
                    {t('vitalsHud')}
                  </h3>
                </div>
                <span className="text-[11px] text-[#55706d]">
                  ABHA: <strong className="font-mono text-[#173b3b]">{selectedTc.patientAbhaId}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs">
                {/* BP */}
                <div className="p-2.5 bg-[#f7f4ed] rounded-xl border border-[#e4ded0]">
                  <span className="text-[10px] text-[#55706d] font-semibold block">{t('bloodPressure')}</span>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="number"
                      value={vitals.bloodPressureSys}
                      onChange={(e) => setVitals({ ...vitals, bloodPressureSys: Number(e.target.value) })}
                      className="w-11 font-bold text-[#173b3b] text-center bg-white border border-[#e4ded0] rounded py-0.5"
                    />
                    <span className="text-[#8a9992]">/</span>
                    <input
                      type="number"
                      value={vitals.bloodPressureDia}
                      onChange={(e) => setVitals({ ...vitals, bloodPressureDia: Number(e.target.value) })}
                      className="w-11 font-bold text-[#173b3b] text-center bg-white border border-[#e4ded0] rounded py-0.5"
                    />
                    <span className="text-[10px] text-[#8a9992]">mmHg</span>
                  </div>
                  {vitals.bloodPressureSys >= 140 && (
                    <span className="text-[9px] font-bold text-[#c4684e] block mt-0.5">High BP Alert</span>
                  )}
                </div>

                {/* SpO2 */}
                <div className="p-2.5 bg-[#f7f4ed] rounded-xl border border-[#e4ded0]">
                  <span className="text-[10px] text-[#55706d] font-semibold block">{t('spO2')}</span>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="number"
                      value={vitals.spO2}
                      onChange={(e) => setVitals({ ...vitals, spO2: Number(e.target.value) })}
                      className="w-14 font-bold text-[#173b3b] text-center bg-white border border-[#e4ded0] rounded py-0.5"
                    />
                    <span className="text-[10px] text-[#8a9992]">%</span>
                  </div>
                  {vitals.spO2 < 95 && (
                    <span className="text-[9px] font-bold text-[#c4684e] block mt-0.5">Hypoxia Risk</span>
                  )}
                </div>

                {/* Heart Rate */}
                <div className="p-2.5 bg-[#f7f4ed] rounded-xl border border-[#e4ded0]">
                  <span className="text-[10px] text-[#55706d] font-semibold block">{t('pulseRate')}</span>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="number"
                      value={vitals.pulseRate}
                      onChange={(e) => setVitals({ ...vitals, pulseRate: Number(e.target.value) })}
                      className="w-14 font-bold text-[#173b3b] text-center bg-white border border-[#e4ded0] rounded py-0.5"
                    />
                    <span className="text-[10px] text-[#8a9992]">BPM</span>
                  </div>
                </div>

                {/* Temperature */}
                <div className="p-2.5 bg-[#f7f4ed] rounded-xl border border-[#e4ded0]">
                  <span className="text-[10px] text-[#55706d] font-semibold block">{t('tempF')}</span>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="number"
                      step="0.1"
                      value={vitals.temperatureF}
                      onChange={(e) => setVitals({ ...vitals, temperatureF: Number(e.target.value) })}
                      className="w-14 font-bold text-[#173b3b] text-center bg-white border border-[#e4ded0] rounded py-0.5"
                    />
                    <span className="text-[10px] text-[#8a9992]">°F</span>
                  </div>
                </div>

                {/* Blood Sugar */}
                <div className="p-2.5 bg-[#f7f4ed] rounded-xl border border-[#e4ded0]">
                  <span className="text-[10px] text-[#55706d] font-semibold block">{t('bloodSugar')}</span>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="number"
                      value={vitals.bloodSugarMgDl || 120}
                      onChange={(e) => setVitals({ ...vitals, bloodSugarMgDl: Number(e.target.value) })}
                      className="w-14 font-bold text-[#173b3b] text-center bg-white border border-[#e4ded0] rounded py-0.5"
                    />
                    <span className="text-[10px] text-[#8a9992]">mg/dL</span>
                  </div>
                </div>

                {/* Hemoglobin */}
                <div className="p-2.5 bg-[#f7f4ed] rounded-xl border border-[#e4ded0]">
                  <span className="text-[10px] text-[#55706d] font-semibold block">Hemoglobin (Hb)</span>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="number"
                      step="0.1"
                      value={vitals.hemoglobin || 11.0}
                      onChange={(e) => setVitals({ ...vitals, hemoglobin: Number(e.target.value) })}
                      className="w-14 font-bold text-[#173b3b] text-center bg-white border border-[#e4ded0] rounded py-0.5"
                    />
                    <span className="text-[10px] text-[#8a9992]">g/dL</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Clinical Decision Support (CDSS) & ABDM E-Prescription Studio */}
            <div className="bg-[#fffdf8] rounded-2xl p-5 border border-[#e4ded0] shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#e4ded0] pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#166458]" />
                  <div>
                    <h3 className="font-bold text-[#173b3b] text-sm">
                      {t('generatePrescription')}
                    </h3>
                    <p className="text-xs text-[#55706d]">
                      Standardized Indian Public Health EHR (FHIR R4 / ABDM Compliant)
                    </p>
                  </div>
                </div>

                {/* AI Scribe Trigger Button */}
                <button
                  id="ai-scribe-generate-button"
                  onClick={handleTriggerAiScribe}
                  disabled={isAiGenerating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#166458] hover:bg-[#0e534d] text-white text-xs font-bold shadow-2xs cursor-pointer disabled:opacity-50 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#f4bd64]" />
                  <span>{isAiGenerating ? 'AI Analyzing CDSS...' : 'AI Clinical Scribe'}</span>
                </button>
              </div>

              {/* AI CDSS Triage Alerts & Red Flags Banner */}
              {selectedTc.aiDifferentialDiagnosis && selectedTc.aiDifferentialDiagnosis.length > 0 && (
                <div className="p-3.5 bg-[#f4bd64]/15 border border-[#f4bd64]/40 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-[#ba704f] font-bold">
                    <AlertTriangle className="w-4 h-4 text-[#ba704f]" />
                    <span>{t('aiClinicalAssistant')}: {selectedTc.triageReason}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#173b3b]">
                    <div>
                      <strong className="text-[#173b3b] block font-semibold mb-0.5">{t('differentialDiagnosis')}:</strong>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#55706d]">
                        {selectedTc.aiDifferentialDiagnosis.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <strong className="text-[#173b3b] block font-semibold mb-0.5">{t('recommendedProtocol')}:</strong>
                      <p className="text-[11px] text-[#55706d] leading-snug">
                        {selectedTc.aiRecommendedAction || 'Proceed with standard medication protocol and arrange follow-up.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Prescription Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#173b3b] mb-1">
                    Confirmed Clinical Diagnosis
                  </label>
                  <input
                    type="text"
                    value={diagnosisInput}
                    onChange={(e) => setDiagnosisInput(e.target.value)}
                    placeholder="e.g. Gestational Hypertension with Severe Anemia"
                    className="w-full px-3 py-2 border border-[#e4ded0] rounded-lg text-[#173b3b] font-medium focus:ring-2 focus:ring-[#166458] bg-[#f7f4ed] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#173b3b] mb-1">
                    Clinical Examination & Symptoms Summary
                  </label>
                  <input
                    type="text"
                    value={clinicalNotesInput}
                    onChange={(e) => setClinicalNotesInput(e.target.value)}
                    placeholder="e.g. Headache, blurred vision, bilateral pedal edema."
                    className="w-full px-3 py-2 border border-[#e4ded0] rounded-lg text-[#173b3b] font-medium focus:ring-2 focus:ring-[#166458] bg-[#f7f4ed] outline-none"
                  />
                </div>
              </div>

              {/* Medicines List */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Essential Medicines (NLEM Standard)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddMedication}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-800 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('prescribeMedication')}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {medications.map((med, idx) => (
                    <div
                      key={med.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs items-center"
                    >
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          value={med.name}
                          onChange={(e) => {
                            const updated = [...medications];
                            updated[idx].name = e.target.value;
                            setMedications(updated);
                          }}
                          placeholder="Medicine name"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md font-semibold text-slate-900"
                        />
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Generic: {med.genericName}
                        </span>
                      </div>

                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          value={med.frequency}
                          onChange={(e) => {
                            const updated = [...medications];
                            updated[idx].frequency = e.target.value;
                            setMedications(updated);
                          }}
                          placeholder="e.g. 1-0-1 (After Food)"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          value={med.instructions}
                          onChange={(e) => {
                            const updated = [...medications];
                            updated[idx].instructions = e.target.value;
                            setMedications(updated);
                          }}
                          placeholder="Specific patient advice"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700"
                        />
                      </div>

                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveMedication(med.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Diet & Precautions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Dietary & Lifestyle Advice
                  </label>
                  <textarea
                    rows={2}
                    value={dietaryAdvice}
                    onChange={(e) => setDietaryAdvice(e.target.value)}
                    placeholder="Dietary precautions for patient..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Patient Precautions & Warning Signs
                  </label>
                  <textarea
                    rows={2}
                    value={precautions}
                    onChange={(e) => setPrecautions(e.target.value)}
                    placeholder="When to seek emergency help..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Actions: Sign & Save Prescription + Print */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-medium">Follow-up in:</span>
                  <input
                    type="number"
                    value={followUpDays}
                    onChange={(e) => setFollowUpDays(Number(e.target.value))}
                    className="w-14 px-2 py-1 border border-slate-200 rounded-md text-xs font-bold text-center text-slate-900"
                  />
                  <span className="text-xs text-slate-500">days</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Rx</span>
                  </button>

                  <button
                    type="button"
                    id="sign-save-prescription-btn"
                    onClick={handleSavePrescription}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs cursor-pointer transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Sign & Issue ABDM Prescription</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Printable Prescription Card Container */}
            {generatedPrescription && (
              <div
                id="printable-prescription"
                className="bg-white p-6 rounded-2xl border-2 border-teal-600/30 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between border-b-2 border-teal-700 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-teal-900">
                      GOVERNMENT OF MAHARASHTRA • PUBLIC HEALTH DEPARTMENT
                    </h3>
                    <p className="text-xs text-slate-600">
                      {currentFacility.name} ({currentFacility.tierLabel})
                    </p>
                    <p className="text-[11px] text-slate-500">
                      National Telehealth Grid • Rx ID: {generatedPrescription.id}
                    </p>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <div className="w-14 h-14 bg-slate-100 border border-slate-300 rounded flex items-center justify-center text-slate-700">
                      <QrCode className="w-10 h-10 text-slate-800" />
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 mt-1">
                      ABDM Verified
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs py-1 border-b border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Patient Name</span>
                    <strong className="text-slate-900">{selectedTc.patientName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Age / Gender</span>
                    <strong className="text-slate-900">{selectedTc.patientAge} Y / {selectedTc.patientGender}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">ABHA ID</span>
                    <strong className="text-slate-900 font-mono">{selectedTc.patientAbhaId}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Date</span>
                    <strong className="text-slate-900">{generatedPrescription.date}</strong>
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <span className="font-bold text-slate-800">Diagnosis: </span>
                  <span className="text-slate-700">{generatedPrescription.diagnosis}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800 block">Rx (Medications):</span>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px]">
                        <th className="py-1 px-2">#</th>
                        <th className="py-1 px-2">Medicine (Generic Name)</th>
                        <th className="py-1 px-2">Dosage & Frequency</th>
                        <th className="py-1 px-2">Duration</th>
                        <th className="py-1 px-2">Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generatedPrescription.medications.map((m, i) => (
                        <tr key={i} className="border-b border-slate-100 text-slate-800">
                          <td className="py-1.5 px-2">{i + 1}</td>
                          <td className="py-1.5 px-2 font-semibold">
                            {m.name} <span className="text-[10px] font-normal text-slate-500 block">{m.genericName}</span>
                          </td>
                          <td className="py-1.5 px-2">{m.frequency}</td>
                          <td className="py-1.5 px-2">{m.durationDays} Days</td>
                          <td className="py-1.5 px-2">{m.instructions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
                  <div>
                    <strong className="block text-slate-700">Diet & Lifestyle:</strong>
                    <p className="text-slate-600 text-[11px]">{generatedPrescription.dietaryAdvice}</p>
                  </div>
                  <div>
                    <strong className="block text-slate-700">Next Follow-Up Date:</strong>
                    <p className="text-teal-800 font-bold text-[11px]">{generatedPrescription.followUpDate}</p>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                  <span>Digitally authenticated via Sanjeevani TeleMed Public Grid</span>
                  <span className="font-semibold text-slate-800">
                    Dr. {selectedTc.consultingDoctorName} (Consulting Specialist)
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-8 p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-500">
            Select a patient consultation from the left queue to begin.
          </div>
        )}
      </div>

      {/* New Consultation Modal */}
      {showNewTcModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {t('newConsultation')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Frontline intake at {currentFacility.shortName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewTcModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewConsultation} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  placeholder="e.g. Parvati Devi / Ramesh Jadhav"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Age (Years) *
                  </label>
                  <input
                    type="number"
                    value={newPatientAge}
                    onChange={(e) => setNewPatientAge(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Gender *
                  </label>
                  <select
                    value={newPatientGender}
                    onChange={(e) => setNewPatientGender(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chief Complaints & Symptoms *
                </label>
                <textarea
                  rows={3}
                  value={newChiefComplaints}
                  onChange={(e) => setNewChiefComplaints(e.target.value)}
                  placeholder="e.g. High grade fever with chills for 3 days, body ache, productive cough, vomiting..."
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Consulting Higher Specialist Facility *
                </label>
                <select
                  value={newConsultingFacilityId}
                  onChange={(e) => setNewConsultingFacilityId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500"
                >
                  {FACILITIES.filter((f) => f.id !== currentFacility.id).map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.tierLabel})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewTcModal(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold cursor-pointer shadow-xs"
                >
                  Create & Run Digital Triage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
