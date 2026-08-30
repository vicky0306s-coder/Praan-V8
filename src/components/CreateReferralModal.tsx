import React, { useState } from 'react';
import {
  Ambulance,
  Building2,
  Send,
  AlertTriangle,
  User,
  Activity,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Facility, Patient, Vitals, Referral, TriagePriority } from '../types';
import { FACILITIES } from '../data/initialData';
import { storageService } from '../services/storageService';

interface CreateReferralModalProps {
  currentFacility: Facility;
  isOpen: boolean;
  onClose: () => void;
  prefillPatient?: Patient | null;
  prefillVitals?: Vitals | null;
}

export const CreateReferralModal: React.FC<CreateReferralModalProps> = ({
  currentFacility,
  isOpen,
  onClose,
  prefillPatient,
  prefillVitals
}) => {
  const [patientName, setPatientName] = useState<string>(prefillPatient?.name || 'Parvati Devi');
  const [patientAge, setPatientAge] = useState<number>(prefillPatient?.age || 28);
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>(prefillPatient?.gender || 'Female');
  const [patientAbha, setPatientAbha] = useState<string>(prefillPatient?.abhaId || '91-4421-9988-1122');
  const [targetFacilityId, setTargetFacilityId] = useState<string>('CHC-03');
  const [targetSpeciality, setTargetSpeciality] = useState<string>('Obstetrics & Gynecology');
  const [priority, setPriority] = useState<TriagePriority>('RED');
  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState<string>(
    'Severe Pre-eclampsia with Impending Eclampsia & Severe Nutritional Anemia'
  );
  const [clinicalJustification, setClinicalJustification] = useState<string>(
    'BP 150/100 mmHg, severe headache, blurred vision, Hb 7.6 g/dL. Requires urgent specialist OBGYN review & IV Labetalol/Magnesium Sulfate protocol.'
  );
  const [requireAmbulance, setRequireAmbulance] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const targetFac = FACILITIES.find((f) => f.id === targetFacilityId) || FACILITIES[2];

    const currentV: Vitals = prefillVitals || {
      bloodPressureSys: 148,
      bloodPressureDia: 96,
      pulseRate: 98,
      spO2: 97,
      temperatureF: 98.4,
      respiratoryRate: 20,
      bloodSugarMgDl: 115,
      hemoglobin: 7.6
    };

    const newRef: Referral = {
      id: `REF-INTER-${Date.now()}`,
      patientId: prefillPatient?.id || `PAT-${Date.now()}`,
      patientName,
      patientAge,
      patientGender,
      patientAbhaId: patientAbha,
      originFacilityId: currentFacility.id,
      originFacilityName: currentFacility.name,
      referredByStaff: `${currentFacility.staffName} (${currentFacility.tier})`,
      targetFacilityId: targetFac.id,
      targetFacilityName: targetFac.name,
      targetSpeciality,
      provisionalDiagnosis,
      clinicalJustification,
      priority,
      status: 'Initiated',
      createdAt: new Date().toISOString(),
      vitalsAtReferral: currentV,
      ambulanceDetails: requireAmbulance
        ? {
            vehicleNumber: 'MH-14-EM-108' + Math.floor(10 + Math.random() * 90),
            driverName: 'Sanjay Shinde',
            driverPhone: '+91 98221 55443',
            paramedicName: 'Ramesh Gawli (EMT)',
            currentLocation: `${currentFacility.block} Bypass Hwy`,
            estimatedArrivalMinutes: 18,
            oxygenEquipped: true
          }
        : undefined
    };

    storageService.createReferral(newRef);
    confetti({ particleCount: 50, spread: 60 });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <Ambulance className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Initiate Inter-Hospital Referral
              </h3>
              <p className="text-xs text-slate-500">
                Dispatch from {currentFacility.name} across the federated grid
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold text-lg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-3 gap-2.5">
            <div className="col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Patient Name *</label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500 font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Age *</label>
              <input
                type="number"
                value={patientAge}
                onChange={(e) => setPatientAge(Number(e.target.value))}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Destination Facility *</label>
              <select
                value={targetFacilityId}
                onChange={(e) => setTargetFacilityId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500"
              >
                {FACILITIES.filter((f) => f.id !== currentFacility.id).map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.tierLabel})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Referral Priority *</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TriagePriority)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-teal-500"
              >
                <option value="RED">RED - Emergency Resuscitation</option>
                <option value="YELLOW">YELLOW - Urgent Care</option>
                <option value="GREEN">GREEN - Routine Elective</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Provisional Diagnosis *</label>
            <input
              type="text"
              value={provisionalDiagnosis}
              onChange={(e) => setProvisionalDiagnosis(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Clinical Justification *</label>
            <textarea
              rows={2}
              value={clinicalJustification}
              onChange={(e) => setClinicalJustification(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="req-amb"
              checked={requireAmbulance}
              onChange={(e) => setRequireAmbulance(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded"
            />
            <label htmlFor="req-amb" className="text-xs font-semibold text-slate-800 cursor-pointer">
              Dispatch 108 Emergency Ambulance with Paramedic & Oxygen
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold cursor-pointer shadow-xs"
            >
              Issue Closed-Loop Referral
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
