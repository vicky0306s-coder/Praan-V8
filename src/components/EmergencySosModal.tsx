import React, { useState } from 'react';
import {
  AlertTriangle,
  Ambulance,
  PhoneCall,
  MapPin,
  Heart,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Facility } from '../types';
import { FACILITIES } from '../data/initialData';

interface EmergencySosModalProps {
  currentFacility: Facility;
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencySosModal: React.FC<EmergencySosModalProps> = ({
  currentFacility,
  isOpen,
  onClose
}) => {
  const [emergencyType, setEmergencyType] = useState<string>('Maternal Hemorrhage / Eclampsia');
  const [patientSummary, setPatientSummary] = useState<string>('Female 28y, 34 weeks gestation, unconscious, severe convulsions.');
  const [destinationId, setDestinationId] = useState<string>('CHC-03');
  const [dispatched, setDispatched] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleTriggerDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    setDispatched(true);
    confetti({ particleCount: 60, spread: 70 });
    setTimeout(() => {
      setDispatched(false);
      onClose();
    }, 2800);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border-2 border-rose-500 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-rose-100">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-md animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-rose-950 text-base">
                National 108 Emergency SOS Dispatch
              </h3>
              <p className="text-xs text-rose-700 font-semibold">
                Priority Tier-1 Red Resuscitation Escalation
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

        {dispatched ? (
          <div className="p-6 text-center space-y-3 bg-emerald-50 rounded-xl border border-emerald-300 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-emerald-950 text-base">
              108 ALS Ambulance Dispatched!
            </h4>
            <p className="text-xs text-emerald-800 font-medium">
              Vehicle <strong>MH-14-EM-1088</strong> is en route to {currentFacility.name} with Advanced Life Support (ALS) & portable ventilator. Destination ICU alerted.
            </p>
          </div>
        ) : (
          <form onSubmit={handleTriggerDispatch} className="space-y-3.5 text-xs">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-rose-800 tracking-wider">
                Emergency Location Coordinates
              </span>
              <strong className="text-slate-900 block text-xs">
                {currentFacility.name} ({currentFacility.block} Block, Pune)
              </strong>
              <span className="text-[11px] text-slate-600">
                Staff In-Charge: {currentFacility.staffName} ({currentFacility.contactNumber})
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Emergency Condition Type *
              </label>
              <select
                value={emergencyType}
                onChange={(e) => setEmergencyType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-rose-500"
              >
                <option value="Maternal Hemorrhage / Eclampsia">Maternal Hemorrhage / Eclampsia (PPH/Shock)</option>
                <option value="Acute STEMI / Cardiogenic Shock">Acute STEMI / Cardiogenic Shock</option>
                <option value="Severe Polytrauma / Road Accident">Severe Polytrauma / Road Accident</option>
                <option value="Poisoning / Snake Bite Respiratory Failure">Poisoning / Snake Bite Respiratory Failure</option>
                <option value="Pediatric SAM Convulsions">Pediatric SAM Convulsions</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Patient Status & Danger Signs *
              </label>
              <textarea
                rows={2}
                value={patientSummary}
                onChange={(e) => setPatientSummary(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-rose-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Destination Receiving Hospital *
              </label>
              <select
                value={destinationId}
                onChange={(e) => setDestinationId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-rose-500"
              >
                {FACILITIES.filter((f) => f.id !== currentFacility.id).map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.tierLabel} • Beds Free: {f.totalBeds - f.occupiedBeds})
                  </option>
                ))}
              </select>
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
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black cursor-pointer shadow-md flex items-center gap-1.5 animate-pulse"
              >
                <Ambulance className="w-4 h-4" />
                <span>CONFIRM 108 SOS DISPATCH</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
