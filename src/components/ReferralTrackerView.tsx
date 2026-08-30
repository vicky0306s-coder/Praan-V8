import React, { useState, useEffect } from 'react';
import {
  Ambulance,
  PhoneCall,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Send,
  Plus,
  RefreshCw,
  Eye,
  Activity,
  BedDouble
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Facility, Referral, Patient, Vitals, ReferralStatus, TriagePriority } from '../types';
import { FACILITIES } from '../data/initialData';
import { storageService } from '../services/storageService';
import { useLanguage } from '../services/languageService';

interface ReferralTrackerViewProps {
  currentFacility: Facility;
  onOpenNewReferralModal: () => void;
}

export const ReferralTrackerView: React.FC<ReferralTrackerViewProps> = ({
  currentFacility,
  onOpenNewReferralModal
}) => {
  const { t } = useLanguage();
  const [outgoingReferrals, setOutgoingReferrals] = useState<Referral[]>([]);
  const [incomingReferrals, setIncomingReferrals] = useState<Referral[]>([]);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'outgoing' | 'incoming'>('all');

  const loadReferrals = () => {
    const { outgoing, incoming } = storageService.getReferralsForFacility(currentFacility.id);
    setOutgoingReferrals(outgoing);
    setIncomingReferrals(incoming);

    const all = [...incoming, ...outgoing];
    if (all.length > 0 && !selectedReferral) {
      setSelectedReferral(all[0]);
    }
  };

  useEffect(() => {
    loadReferrals();
    const unsub = storageService.subscribe(loadReferrals);
    return () => unsub();
  }, [currentFacility.id]);

  const handleUpdateStatus = (referralId: string, newStatus: ReferralStatus) => {
    storageService.updateReferralStatus(referralId, newStatus, currentFacility.staffName);
    if (newStatus === 'Admitted' || newStatus === 'Completed') {
      confetti({ particleCount: 40, spread: 50 });
    }
  };

  const getPriorityBadgeClass = (priority: TriagePriority) => {
    switch (priority) {
      case 'RED':
        return 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse font-bold';
      case 'YELLOW':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
    }
  };

  const getStatusBadge = (status: ReferralStatus) => {
    switch (status) {
      case 'Initiated':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'Accepted':
        return 'bg-blue-50 text-blue-800 border-blue-300';
      case 'In Transit':
        return 'bg-purple-50 text-purple-800 border-purple-300 animate-pulse';
      case 'Admitted':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
      case 'Counter-Referred':
        return 'bg-teal-50 text-teal-800 border-teal-300';
      default:
        return 'bg-slate-50 text-slate-800 border-slate-300';
    }
  };

  const displayedList =
    activeTab === 'outgoing'
      ? outgoingReferrals
      : activeTab === 'incoming'
      ? incomingReferrals
      : [...incomingReferrals, ...outgoingReferrals];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Ambulance className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-extrabold text-slate-900">
              {t('navReferrals')}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-semibold border border-teal-200">
              Federated Referral Hub
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time closed-loop referral command with 108 ambulance telemetry, pre-arrival ICU bed reservation & counter-referral back to Sub-Centres.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="create-new-referral-btn"
            onClick={onOpenNewReferralModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('createReferral')}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 text-xs rounded-xl font-bold transition cursor-pointer ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Inter-Facility Referrals ({displayedList.length})
        </button>

        <button
          onClick={() => setActiveTab('incoming')}
          className={`px-3.5 py-1.5 text-xs rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'incoming'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>Incoming to {currentFacility.shortName}</span>
          <span className="bg-teal-800/40 text-teal-100 px-1.5 py-0.2 rounded-full text-[10px]">
            {incomingReferrals.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('outgoing')}
          className={`px-3.5 py-1.5 text-xs rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'outgoing'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>Outgoing from {currentFacility.shortName}</span>
          <span className="bg-teal-800/40 text-teal-100 px-1.5 py-0.2 rounded-full text-[10px]">
            {outgoingReferrals.length}
          </span>
        </button>
      </div>

      {/* Main Grid: Referrals List (4 Cols) + Active Referral Command & Ambulance HUD (8 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Referral Cards */}
        <div className="lg:col-span-4 space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
          {displayedList.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              No active referrals found in this view.
            </div>
          ) : (
            displayedList.map((ref) => {
              const isSelected = selectedReferral?.id === ref.id;
              const isIncoming = ref.targetFacilityId === currentFacility.id;
              return (
                <div
                  key={ref.id}
                  id={`referral-card-${ref.id}`}
                  onClick={() => setSelectedReferral(ref)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer bg-white ${
                    isSelected
                      ? 'border-teal-600 ring-2 ring-teal-500/20 shadow-md'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-sm">
                          {ref.patientName}
                        </span>
                        <span className="text-xs text-slate-500">
                          ({ref.patientAge}y / {ref.patientGender})
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-700 line-clamp-1 mt-0.5">
                        {ref.provisionalDiagnosis}
                      </p>
                    </div>

                    <span className={`text-[9px] uppercase px-2 py-0.5 rounded-md border ${getPriorityBadgeClass(ref.priority)}`}>
                      {ref.priority}
                    </span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                    <span className={`font-semibold ${isIncoming ? 'text-blue-700' : 'text-slate-600'}`}>
                      {isIncoming ? `⬇ From ${ref.originFacilityName.split(' ')[0]}` : `⬆ To ${ref.targetFacilityName.split(' ')[0]}`}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md border font-semibold ${getStatusBadge(ref.status)}`}>
                      {ref.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Detailed Referral Command View */}
        {selectedReferral ? (
          <div className="lg:col-span-8 space-y-4">
            {/* 1. Live 108 Ambulance Telemetry Banner */}
            {selectedReferral.ambulanceDetails && (
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-lg border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-rose-600/30 border border-rose-500/50 flex items-center justify-center text-rose-400">
                      <Ambulance className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-white">
                          Emergency 108 Ambulance Unit: {selectedReferral.ambulanceDetails.vehicleNumber}
                        </h4>
                        <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.2 rounded-full font-bold animate-pulse">
                          LIVE TELEMETRY
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Paramedic: {selectedReferral.ambulanceDetails.paramedicName} • Driver: {selectedReferral.ambulanceDetails.driverName}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-teal-400 uppercase tracking-wider block font-semibold">
                      Estimated Arrival (ETA)
                    </span>
                    <span className="text-lg font-black text-white font-mono">
                      {selectedReferral.ambulanceDetails.estimatedArrivalMinutes} Minutes
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300 pt-1">
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Current Route GPS</span>
                    <strong className="text-white">{selectedReferral.ambulanceDetails.currentLocation}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Driver Phone Hotline</span>
                    <strong className="text-teal-300 font-mono">{selectedReferral.ambulanceDetails.driverPhone}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Receiving Pre-Alert Status</span>
                    <strong className="text-emerald-400">ICU Team Notified</strong>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Referral Summary & Bed Allocation */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 text-base">
                      {selectedReferral.patientName} ({selectedReferral.patientAge}y / {selectedReferral.patientGender})
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getPriorityBadgeClass(selectedReferral.priority)}`}>
                      {selectedReferral.priority} Priority
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    ABHA: {selectedReferral.patientAbhaId} • Ref ID: {selectedReferral.id}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${getStatusBadge(selectedReferral.status)}`}>
                    Status: {selectedReferral.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-500 font-semibold block">Origin Health Facility</span>
                  <strong className="text-slate-900 block">{selectedReferral.originFacilityName}</strong>
                  <span className="text-slate-500 text-[11px]">Referred by: {selectedReferral.referredByStaff}</span>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-500 font-semibold block">Receiving Specialist Facility</span>
                  <strong className="text-teal-900 block">{selectedReferral.targetFacilityName}</strong>
                  <span className="text-slate-500 text-[11px]">Target Speciality: {selectedReferral.targetSpeciality}</span>
                </div>
              </div>

              {/* Clinical Justification */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-amber-900 block">Provisional Diagnosis & Clinical Reason:</span>
                <p className="font-bold text-slate-900">{selectedReferral.provisionalDiagnosis}</p>
                <p className="text-slate-700 leading-relaxed text-[11px]">{selectedReferral.clinicalJustification}</p>
              </div>

              {/* Vitals Telemetry at time of referral */}
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-bold text-slate-800 block">Vitals at Dispatch:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">BP</span>
                    <strong>{selectedReferral.vitalsAtReferral.bloodPressureSys}/{selectedReferral.vitalsAtReferral.bloodPressureDia} mmHg</strong>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">SpO2</span>
                    <strong>{selectedReferral.vitalsAtReferral.spO2}%</strong>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Pulse</span>
                    <strong>{selectedReferral.vitalsAtReferral.pulseRate} BPM</strong>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Blood Sugar</span>
                    <strong>{selectedReferral.vitalsAtReferral.bloodSugarMgDl || 120} mg/dL</strong>
                  </div>
                </div>
              </div>

              {/* Interactive Status Transition Bar */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">
                  Update Inter-Hospital Workflow State:
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedReferral.id, 'Accepted')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
                  >
                    Accept by Specialist
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(selectedReferral.id, 'In Transit')}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
                  >
                    Ambulance In Transit
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(selectedReferral.id, 'Admitted')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
                  >
                    Admit to ICU / Ward
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(selectedReferral.id, 'Counter-Referred')}
                    className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
                  >
                    Counter-Refer to Sub-Centre
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
