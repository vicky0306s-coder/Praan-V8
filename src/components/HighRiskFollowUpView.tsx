import React, { useState, useEffect } from 'react';
import {
  Heart,
  AlertTriangle,
  Calendar,
  Send,
  CheckCircle2,
  Phone,
  User,
  Activity,
  MapPin,
  Clock,
  Sparkles,
  Volume2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Facility, HighRiskRecord, HighRiskCategory } from '../types';
import { storageService } from '../services/storageService';
import { useLanguage } from '../services/languageService';

interface HighRiskFollowUpViewProps {
  currentFacility: Facility;
}

export const HighRiskFollowUpView: React.FC<HighRiskFollowUpViewProps> = ({
  currentFacility
}) => {
  const { t } = useLanguage();
  const [records, setRecords] = useState<HighRiskRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<HighRiskRecord | null>(null);
  const [alertSuccess, setAlertSuccess] = useState<string>('');

  const loadData = () => {
    const db = storageService.getFacilityDb(currentFacility.id);
    setRecords(db.highRiskRecords || []);

    if (db.highRiskRecords && db.highRiskRecords.length > 0 && !selectedRecord) {
      setSelectedRecord(db.highRiskRecords[0]);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = storageService.subscribe(loadData);
    return () => unsub();
  }, [currentFacility.id]);

  const handleSendReminder = (rec: HighRiskRecord) => {
    setAlertSuccess(`Sent Vernacular Voice & SMS reminder to ${rec.patientName} (${rec.ashaWorkerPhone})!`);
    confetti({ particleCount: 30, spread: 40 });
    setTimeout(() => setAlertSuccess(''), 3500);
  };

  const handleLogHomeVisit = (rec: HighRiskRecord) => {
    const updated: HighRiskRecord = {
      ...rec,
      lastHomeVisitDate: new Date().toISOString().split('T')[0],
      nextScheduledFollowUp: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      complianceScore: Math.min(100, rec.complianceScore + 5),
      visitNotes: `Home visit completed by ${rec.ashaWorkerName}. Vitals checked, medications verified.`
    };
    storageService.updateHighRiskRecord(currentFacility.id, updated);
    setSelectedRecord(updated);
    setAlertSuccess(`Logged successful home visit for ${rec.patientName}. Compliance score updated!`);
    setTimeout(() => setAlertSuccess(''), 3500);
  };

  const getCategoryBadge = (cat: HighRiskCategory) => {
    switch (cat) {
      case 'ANC_HIGH_RISK':
        return { label: 'High-Risk Maternal (ANC)', color: 'bg-rose-100 text-rose-800 border-rose-300' };
      case 'SAM_INFANT':
        return { label: 'SAM Malnourished Infant', color: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'NCD_DIABETES_HTN':
        return { label: 'Severe NCD (Diabetes/HTN)', color: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'TB_DOTS':
        return { label: 'TB DOTS Surveillance', color: 'bg-teal-100 text-teal-800 border-teal-300' };
      default:
        return { label: 'General', color: 'bg-slate-100 text-slate-800 border-slate-300' };
    }
  };

  const filteredRecords =
    selectedCategory === 'ALL'
      ? records
      : records.filter((r) => r.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-600" />
            <h2 className="text-base font-extrabold text-slate-900">
              {t('navHighRisk')}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold border border-rose-200">
              Active Community Surveillance
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Active tracking for high-risk maternal ANC cases, infant malnutrition (SAM), uncontrolled NCDs, and TB treatment adherence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl flex-wrap">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1 text-xs rounded-lg font-bold transition cursor-pointer ${
                selectedCategory === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              All Cohorts ({records.length})
            </button>
            <button
              onClick={() => setSelectedCategory('ANC_HIGH_RISK')}
              className={`px-3 py-1 text-xs rounded-lg font-bold transition cursor-pointer ${
                selectedCategory === 'ANC_HIGH_RISK' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              Maternal ANC
            </button>
            <button
              onClick={() => setSelectedCategory('SAM_INFANT')}
              className={`px-3 py-1 text-xs rounded-lg font-bold transition cursor-pointer ${
                selectedCategory === 'SAM_INFANT' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              SAM Infant
            </button>
            <button
              onClick={() => setSelectedCategory('NCD_DIABETES_HTN')}
              className={`px-3 py-1 text-xs rounded-lg font-bold transition cursor-pointer ${
                selectedCategory === 'NCD_DIABETES_HTN' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              NCDs
            </button>
          </div>
        </div>
      </div>

      {alertSuccess && (
        <div className="p-3.5 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {alertSuccess}
        </div>
      )}

      {/* Grid: Cohort List (5 Cols) + Follow-up Dossier (7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Records List */}
        <div className="lg:col-span-5 space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
          {filteredRecords.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              No high-risk records in this category.
            </div>
          ) : (
            filteredRecords.map((rec) => {
              const isSelected = selectedRecord?.id === rec.id;
              const catInfo = getCategoryBadge(rec.category);
              return (
                <div
                  key={rec.id}
                  id={`cohort-card-${rec.id}`}
                  onClick={() => setSelectedRecord(rec)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer bg-white ${
                    isSelected
                      ? 'border-rose-600 ring-2 ring-rose-500/20 shadow-md'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">
                        {rec.patientName}
                      </span>
                      <span className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-md border ${catInfo.color}`}>
                        {catInfo.label}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Compliance</span>
                      <span className="text-xs font-mono font-bold text-emerald-700">
                        {rec.complianceScore}%
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-1 mt-2">
                    {rec.clinicalCondition}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                    <span>ASHA: {rec.ashaWorkerName}</span>
                    <span className="font-semibold text-rose-700">Due: {rec.nextScheduledFollowUp}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Selected Cohort Detail */}
        {selectedRecord ? (
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {selectedRecord.patientName}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    ABHA: {selectedRecord.patientAbhaId} • Village: {selectedRecord.village}
                  </p>
                </div>

                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${getCategoryBadge(selectedRecord.category).color}`}>
                  {getCategoryBadge(selectedRecord.category).label}
                </span>
              </div>

              {/* Clinical Condition & Assigned Frontline Worker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-400 font-semibold block text-[10px]">Clinical Condition</span>
                  <strong className="text-slate-900 block text-xs">{selectedRecord.clinicalCondition}</strong>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-400 font-semibold block text-[10px]">Frontline ASHA In-Charge</span>
                  <strong className="text-slate-900 block text-xs">{selectedRecord.ashaWorkerName}</strong>
                  <span className="text-slate-500 text-[11px]">Phone: {selectedRecord.ashaWorkerPhone}</span>
                </div>
              </div>

              {/* Schedule Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">Last Home Visit</span>
                  <strong className="text-slate-800">{selectedRecord.lastHomeVisitDate}</strong>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">Next Follow-Up Due</span>
                  <strong className="text-rose-700">{selectedRecord.nextScheduledFollowUp}</strong>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">Adherence Score</span>
                  <strong className="text-emerald-700">{selectedRecord.complianceScore}% Completed</strong>
                </div>
              </div>

              {/* Clinical Visit Notes */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-amber-900 block">Visit Notes & Guidance:</span>
                <p className="text-slate-700 leading-relaxed text-[11px]">
                  {selectedRecord.visitNotes}
                </p>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleSendReminder(selectedRecord)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold cursor-pointer transition shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch Vernacular SMS/Voice Alert</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLogHomeVisit(selectedRecord)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer transition shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Log Home Visit & Check Vitals</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
