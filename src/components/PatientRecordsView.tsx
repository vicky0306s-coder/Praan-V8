import React, { useState, useEffect, useMemo } from 'react';
import {
  User,
  Search,
  Plus,
  QrCode,
  FileCode2,
  Calendar,
  Phone,
  MapPin,
  Heart,
  Activity,
  AlertCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Filter,
  Eye,
  Building2,
  Video,
  ExternalLink,
  ChevronRight,
  Database,
  Layers,
  Sparkles,
  Stethoscope
} from 'lucide-react';
import { Facility, Patient, Vitals } from '../types';
import { FACILITIES } from '../data/initialData';
import { storageService } from '../services/storageService';
import { useLanguage } from '../services/languageService';

interface PatientRecordsViewProps {
  currentFacility: Facility;
  onSelectPatientForConsult: (patient: Patient) => void;
}

export const PatientRecordsView: React.FC<PatientRecordsViewProps> = ({
  currentFacility,
  onSelectPatientForConsult
}) => {
  const { t } = useLanguage();
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(currentFacility.id);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [showFhirModal, setShowFhirModal] = useState<boolean>(false);
  const [filterRisk, setFilterRisk] = useState<string>('ALL');

  // New patient registration form state
  const [targetFacilityId, setTargetFacilityId] = useState<string>(currentFacility.id);
  const [newName, setNewName] = useState<string>('');
  const [newAge, setNewAge] = useState<number>(35);
  const [newGender, setNewGender] = useState<'Male' | 'Female' | 'Other'>('Female');
  const [newPhone, setNewPhone] = useState<string>('+91 98220 12345');
  const [newVillage, setNewVillage] = useState<string>('Nimbodi');
  const [newBloodGroup, setNewBloodGroup] = useState<string>('B Positive');
  const [newHighRiskType, setNewHighRiskType] = useState<string>('ANC_HIGH_RISK');
  const [newPastHistory, setNewPastHistory] = useState<string>('');

  // Get current active hospital details for the selected tab
  const activeSelectedHospital = useMemo(() => {
    if (selectedHospitalId === 'ALL') return null;
    return FACILITIES.find((f) => f.id === selectedHospitalId) || currentFacility;
  }, [selectedHospitalId, currentFacility]);

  // Load patient records according to selected hospital section or search
  const loadPatients = () => {
    let list: Patient[] = [];

    if (searchQuery.trim().length > 0) {
      // Search across all or specific hospital
      const allMatches = storageService.searchPatientsFederated(searchQuery);
      if (selectedHospitalId === 'ALL') {
        list = allMatches;
      } else {
        list = allMatches.filter((p) => p.registeredFacilityId === selectedHospitalId);
      }
    } else {
      if (selectedHospitalId === 'ALL') {
        // Collect patients from all 5 hospital databases
        FACILITIES.forEach((fac) => {
          const db = storageService.getFacilityDb(fac.id);
          if (db?.patients) {
            list.push(...db.patients);
          }
        });
      } else {
        const db = storageService.getFacilityDb(selectedHospitalId);
        list = db?.patients || [];
      }
    }

    if (filterRisk !== 'ALL') {
      list = list.filter((p) => p.riskCategory.toUpperCase() === filterRisk);
    }

    setPatientsList(list);
  };

  useEffect(() => {
    loadPatients();
    const unsub = storageService.subscribe(loadPatients);
    return () => unsub();
  }, [selectedHospitalId, currentFacility.id, searchQuery, filterRisk]);

  useEffect(() => {
    if (patientsList.length > 0) {
      // Keep existing selection if present in new list, else pick first
      if (!selectedPatient || !patientsList.some((p) => p.id === selectedPatient.id)) {
        setSelectedPatient(patientsList[0]);
      }
    } else {
      setSelectedPatient(null);
    }
  }, [patientsList]);

  // Hospital-wise counts calculation for tabs
  const hospitalPatientCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: 0 };
    FACILITIES.forEach((fac) => {
      const db = storageService.getFacilityDb(fac.id);
      const count = db?.patients?.length || 0;
      counts[fac.id] = count;
      counts['ALL'] += count;
    });
    return counts;
  }, [patientsList]);

  const handleRegisterPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const chosenFac = FACILITIES.find((f) => f.id === targetFacilityId) || currentFacility;
    const abha = `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPat: Patient = {
      id: `PAT-${chosenFac.id}-${Date.now().toString().slice(-4)}`,
      abhaId: abha,
      name: newName,
      age: Number(newAge),
      gender: newGender,
      phone: newPhone,
      village: newVillage,
      block: chosenFac.block,
      district: chosenFac.district,
      registeredFacilityId: chosenFac.id,
      registeredDate: new Date().toISOString().split('T')[0],
      bloodGroup: newBloodGroup,
      emergencyContactName: 'Family Guardian',
      emergencyContactPhone: newPhone,
      allergies: [],
      chronicConditions: [newHighRiskType],
      highRiskType: newHighRiskType as any,
      riskCategory: newHighRiskType === 'NONE' ? 'Low' : 'High',
      ashaWorkerName: chosenFac.staffName,
      ashaWorkerPhone: chosenFac.contactNumber,
      lastVisitDate: new Date().toISOString().split('T')[0],
      pastHistorySummary: newPastHistory || `Newly registered patient in ${chosenFac.name} database.`
    };

    storageService.addPatient(chosenFac.id, newPat);
    setShowRegisterModal(false);
    setSelectedHospitalId(chosenFac.id);
    setSelectedPatient(newPat);
    // Reset form
    setNewName('');
    setNewPastHistory('');
  };

  const getRiskBadge = (risk: string) => {
    switch (risk.toUpperCase()) {
      case 'HIGH':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
    }
  };

  const getTierTag = (tier: string) => {
    switch (tier) {
      case 'HWC':
        return { label: 'Tier 1 · Sub-Centre', badgeClass: 'bg-[#166458]/15 text-[#166458] border-[#166458]/30' };
      case 'PHC':
        return { label: 'Tier 2 · Primary Care', badgeClass: 'bg-sky-100 text-sky-800 border-sky-200' };
      case 'CHC':
        return { label: 'Tier 3 · Community Hospital', badgeClass: 'bg-[#f4bd64]/30 text-[#ba704f] border-[#f4bd64]/60' };
      case 'DH':
        return { label: 'Tier 4 · District Hospital', badgeClass: 'bg-[#166458]/20 text-[#166458] border-[#166458]/40' };
      case 'APEX':
        return { label: 'Tier 5 · Apex Medical College', badgeClass: 'bg-[#c4684e]/15 text-[#c4684e] border-[#c4684e]/40' };
      default:
        return { label: 'Public Health Node', badgeClass: 'bg-[#f7f4ed] text-[#55706d] border-[#e4ded0]' };
    }
  };

  // FHIR R4 Bundle generator
  const generateFhirBundle = (patient: Patient) => {
    return {
      resourceType: 'Bundle',
      type: 'collection',
      id: `bundle-${patient.id}`,
      meta: { lastUpdated: new Date().toISOString() },
      entry: [
        {
          fullUrl: `urn:uuid:${patient.id}`,
          resource: {
            resourceType: 'Patient',
            id: patient.id,
            identifier: [
              {
                system: 'https://healthid.ndhm.gov.in',
                value: patient.abhaId
              }
            ],
            name: [{ text: patient.name }],
            telecom: [{ system: 'phone', value: patient.phone }],
            gender: patient.gender.toLowerCase(),
            address: [
              {
                line: [patient.village],
                district: patient.district,
                state: 'Maharashtra'
              }
            ],
            managingOrganization: {
              reference: `Organization/${patient.registeredFacilityId}`,
              display: FACILITIES.find((f) => f.id === patient.registeredFacilityId)?.name || patient.registeredFacilityId
            }
          }
        },
        {
          resource: {
            resourceType: 'Observation',
            status: 'final',
            code: {
              coding: [{ system: 'http://loinc.org', code: '85354-9', display: 'Blood pressure panel' }]
            },
            subject: { reference: `Patient/${patient.id}` },
            effectiveDateTime: patient.lastVisitDate
          }
        }
      ]
    };
  };

  return (
    <div className="space-y-6">
      {/* 1. Main Hospital Database Navigation Header */}
      <div className="bg-[#fffdf8] p-5 rounded-3xl border border-[#e4ded0] shadow-soft space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#166458] text-white flex items-center justify-center font-bold">
                <Database className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-[#173b3b] tracking-tight">
                Hospital Patient Database System
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#166458]/15 text-[#166458] font-bold border border-[#166458]/30">
                ABDM Federated EHR
              </span>
            </div>
            <p className="text-xs text-[#55706d] mt-1 font-medium">
              Explore and manage patient health records segregated by individual hospital databases across all 5 tiers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 text-[11px] font-bold border border-blue-200 shadow-2xs">
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>Cloud SQL PostgreSQL (Synced)</span>
            </span>
            <button
              id="register-patient-modal-btn"
              onClick={() => {
                setTargetFacilityId(selectedHospitalId === 'ALL' ? currentFacility.id : selectedHospitalId);
                setShowRegisterModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#c4684e] hover:bg-[#aa523e] text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Register New Patient</span>
            </button>
          </div>
        </div>

        {/* 2. Hospital Database Switcher Tabs (5 Separate Hospital Sections + All Grid) */}
        <div className="pt-2 border-t border-[#e4ded0]">
          <span className="text-[11px] font-bold text-[#ba704f] uppercase tracking-wider block mb-2">
            Select Hospital Database Section:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {/* Tab: All Federated Databases */}
            <button
              id="hospital-db-tab-ALL"
              onClick={() => setSelectedHospitalId('ALL')}
              className={`p-2.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                selectedHospitalId === 'ALL'
                  ? 'bg-[#166458] text-white border-[#166458] shadow-xs'
                  : 'bg-white hover:bg-[#f7f4ed] text-[#173b3b] border-[#e4ded0]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                  Federated
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  selectedHospitalId === 'ALL' ? 'bg-white/20 text-white' : 'bg-[#166458]/10 text-[#166458]'
                }`}>
                  {hospitalPatientCounts['ALL'] || 0}
                </span>
              </div>
              <p className="text-xs font-bold mt-1 truncate">All 5 Hospitals</p>
              <span className="text-[10px] opacity-75 mt-0.5">Unified Grid</span>
            </button>

            {/* Tabs for each of the 5 facilities */}
            {FACILITIES.map((fac) => {
              const isSelected = selectedHospitalId === fac.id;
              const count = hospitalPatientCounts[fac.id] || 0;
              const tierInfo = getTierTag(fac.tier);

              return (
                <button
                  key={fac.id}
                  id={`hospital-db-tab-${fac.id}`}
                  onClick={() => setSelectedHospitalId(fac.id)}
                  className={`p-2.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#166458] text-white border-[#166458] shadow-xs'
                      : 'bg-white hover:bg-[#f7f4ed] text-[#173b3b] border-[#e4ded0]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                      isSelected ? 'bg-white/20 text-white' : tierInfo.badgeClass
                    }`}>
                      {fac.tier}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#166458]/10 text-[#166458]'
                    }`}>
                      {count}
                    </span>
                  </div>
                  <p className="text-xs font-bold mt-1 truncate" title={fac.name}>
                    {fac.shortName}
                  </p>
                  <span className="text-[10px] opacity-75 mt-0.5 truncate">
                    {fac.block} Block
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Selected Hospital Database Detail Card Banner */}
        {activeSelectedHospital ? (
          <div className="p-4 rounded-2xl bg-[#f7f4ed] border border-[#e4ded0] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#166458]/10 text-[#166458] flex items-center justify-center font-bold shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#173b3b]">
                    {activeSelectedHospital.name} Database
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTierTag(activeSelectedHospital.tier).badgeClass}`}>
                    {getTierTag(activeSelectedHospital.tier).label}
                  </span>
                </div>
                <p className="text-xs text-[#55706d] mt-0.5">
                  District: <strong>{activeSelectedHospital.district}</strong> · Block: <strong>{activeSelectedHospital.block}</strong> · Capacity: <strong>{activeSelectedHospital.totalBeds} Beds</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-[#166458] bg-white px-3 py-1.5 rounded-xl border border-[#e4ded0] shadow-2xs">
                👥 {hospitalPatientCounts[activeSelectedHospital.id] || 0} Registered Patients
              </span>
              <button
                onClick={() => {
                  setTargetFacilityId(activeSelectedHospital.id);
                  setShowRegisterModal(true);
                }}
                className="px-3 py-1.5 bg-[#166458] hover:bg-[#0f4d43] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs"
              >
                + Add Patient to {activeSelectedHospital.shortName}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[#166458]/5 border border-[#166458]/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#173b3b]">
              <ShieldCheck className="w-4 h-4 text-[#166458]" />
              <span>Viewing Unified Multi-Tier Patient Database (5 Connected Hospitals · {hospitalPatientCounts['ALL']} Total ABDM Records)</span>
            </div>
          </div>
        )}

        {/* 4. Search and Risk Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#ba704f] absolute left-3 top-2.5" />
            <input
              id="patient-database-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ABHA ID, Patient Name, Phone, Village or Medical Condition..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-[#e4ded0] rounded-xl focus:ring-2 focus:ring-[#166458] text-[#173b3b] bg-white outline-none font-medium placeholder:text-[#8a9992]"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#f7f4ed] p-1 rounded-xl border border-[#e4ded0] shrink-0">
            <button
              onClick={() => setFilterRisk('ALL')}
              className={`px-3 py-1 text-xs rounded-lg font-bold transition cursor-pointer ${
                filterRisk === 'ALL' ? 'bg-[#166458] text-white shadow-xs' : 'text-[#55706d] hover:text-[#173b3b]'
              }`}
            >
              All Records
            </button>
            <button
              onClick={() => setFilterRisk('HIGH')}
              className={`px-3 py-1 text-xs rounded-lg font-bold transition cursor-pointer ${
                filterRisk === 'HIGH' ? 'bg-rose-700 text-white shadow-xs' : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              High Risk Only
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Patient Roster (4 Cols) + Right Detailed Patient Profile & Timeline (8 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Patient List for the Selected Hospital Database */}
        <div className="lg:col-span-4 space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
          <div className="flex items-center justify-between px-1 text-xs font-bold text-[#55706d]">
            <span>
              {activeSelectedHospital ? `${activeSelectedHospital.shortName} Records` : 'Federated Records'} ({patientsList.length})
            </span>
            <span className="text-[11px] text-[#ba704f]">Click to View Dossier</span>
          </div>

          {patientsList.length === 0 ? (
            <div className="p-8 text-center bg-[#fffdf8] rounded-2xl border border-[#e4ded0] text-[#55706d] text-xs space-y-2">
              <User className="w-8 h-8 mx-auto text-[#ba704f]/60" />
              <p className="font-semibold">No patients found in this database.</p>
              <button
                onClick={() => {
                  setTargetFacilityId(selectedHospitalId === 'ALL' ? currentFacility.id : selectedHospitalId);
                  setShowRegisterModal(true);
                }}
                className="mt-2 px-3 py-1.5 bg-[#166458] text-white font-bold text-xs rounded-xl"
              >
                + Register First Patient
              </button>
            </div>
          ) : (
            patientsList.map((patient) => {
              const isSelected = selectedPatient?.id === patient.id;
              const originFac = FACILITIES.find((f) => f.id === patient.registeredFacilityId);

              return (
                <div
                  key={patient.id}
                  id={`patient-card-${patient.id}`}
                  onClick={() => setSelectedPatient(patient)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#fffdf8] border-[#166458] ring-2 ring-[#166458]/30 shadow-md'
                      : 'bg-[#fffdf8] border-[#e4ded0] hover:border-[#166458]/50 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#173b3b] text-sm">
                          {patient.name}
                        </span>
                        <span className="text-xs text-[#55706d]">
                          ({patient.age}y / {patient.gender.charAt(0)})
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-[#166458] font-bold mt-0.5">
                        {patient.abhaId}
                      </p>
                    </div>

                    <span className={`text-[9px] uppercase px-2 py-0.5 rounded-md border ${getRiskBadge(patient.riskCategory)}`}>
                      {patient.riskCategory}
                    </span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-[#e4ded0] flex items-center justify-between text-[11px] text-[#55706d]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#ba704f]" />
                      {patient.village}
                    </span>
                    <span className="font-semibold text-[#166458] bg-[#166458]/10 px-2 py-0.2 rounded">
                      {originFac?.shortName || patient.registeredFacilityId}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Detailed Patient EHR Dossier & Longitudinal Journey */}
        {selectedPatient ? (
          <div className="lg:col-span-8 space-y-4">
            {/* 1. Digital ABHA Health Card */}
            <div className="bg-[#166458] text-[#fffaf0] p-6 rounded-3xl shadow-soft relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-[#f4bd64] text-[#173b3b] px-2.5 py-0.5 rounded-full font-bold uppercase">
                      Ayushman Bharat Digital Mission (ABDM)
                    </span>
                    <span className="text-xs text-[#fffaf0]/80 font-mono">
                      Hospital Node: {selectedPatient.registeredFacilityId}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold tracking-tight text-white">
                      {selectedPatient.name}
                    </h3>
                    <p className="text-xs text-[#f4bd64] font-medium mt-0.5">
                      Registered in {FACILITIES.find((f) => f.id === selectedPatient.registeredFacilityId)?.name}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[#fffaf0]/90 pt-1">
                    <div>
                      <span className="text-[#f4bd64] block text-[10px] font-bold">ABHA Address</span>
                      <strong className="font-mono text-white text-xs">{selectedPatient.abhaId}</strong>
                    </div>
                    <div>
                      <span className="text-[#f4bd64] block text-[10px] font-bold">Age / Gender</span>
                      <strong className="text-white">{selectedPatient.age} Yrs · {selectedPatient.gender}</strong>
                    </div>
                    <div>
                      <span className="text-[#f4bd64] block text-[10px] font-bold">Blood Group</span>
                      <strong className="text-white">{selectedPatient.bloodGroup}</strong>
                    </div>
                    <div>
                      <span className="text-[#f4bd64] block text-[10px] font-bold">Village / Block</span>
                      <strong className="text-white">{selectedPatient.village}, {selectedPatient.block}</strong>
                    </div>
                  </div>
                </div>

                {/* QR Code & Actions */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                  <div className="bg-white p-2.5 rounded-2xl text-[#173b3b] shadow-sm flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-[#166458]" />
                  </div>
                  <button
                    onClick={() => setShowFhirModal(true)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white hover:text-[#f4bd64] bg-white/15 hover:bg-white/20 px-3 py-1.5 rounded-xl border border-white/20 cursor-pointer transition"
                  >
                    <FileCode2 className="w-3.5 h-3.5" />
                    <span>View FHIR JSON</span>
                  </button>
                </div>
              </div>

              {/* Action Bar inside dossier */}
              <div className="mt-4 pt-4 border-t border-white/20 flex flex-wrap items-center justify-between gap-2 relative z-10">
                <div className="text-xs text-white/80">
                  <span>Last recorded visit: <strong>{selectedPatient.lastVisitDate}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectPatientForConsult(selectedPatient)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#c4684e] hover:bg-[#aa523e] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Start Teleconsultation</span>
                  </button>
                </div>
              </div>

              {/* Decorative circle glow */}
              <div className="absolute -right-16 -top-16 w-60 h-60 rounded-full bg-white/5 pointer-events-none" />
            </div>

            {/* 2. Clinical Vitals & Diagnostics HUD */}
            {selectedPatient.currentVitals && (
              <div className="bg-[#fffdf8] rounded-3xl p-5 border border-[#e4ded0] shadow-soft space-y-3">
                <div className="flex items-center justify-between border-b border-[#e4ded0] pb-2.5">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#166458]" />
                    <h3 className="font-bold text-[#173b3b] text-sm">
                      Latest Clinical Diagnostic Telemetry
                    </h3>
                  </div>
                  <span className="text-xs text-[#55706d] font-semibold">Point-of-Care Vitals</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {selectedPatient.currentVitals.bloodPressureSys && (
                    <div className="p-3 bg-white rounded-xl border border-[#e4ded0]">
                      <span className="text-[10px] text-[#55706d] font-bold block">Blood Pressure</span>
                      <p className="text-base font-bold text-[#173b3b] font-mono mt-0.5">
                        {selectedPatient.currentVitals.bloodPressureSys}/{selectedPatient.currentVitals.bloodPressureDia} <span className="text-[10px] text-[#55706d] font-normal">mmHg</span>
                      </p>
                    </div>
                  )}

                  {selectedPatient.currentVitals.pulseRate && (
                    <div className="p-3 bg-white rounded-xl border border-[#e4ded0]">
                      <span className="text-[10px] text-[#55706d] font-bold block">Pulse Rate</span>
                      <p className="text-base font-bold text-[#173b3b] font-mono mt-0.5">
                        {selectedPatient.currentVitals.pulseRate} <span className="text-[10px] text-[#55706d] font-normal">bpm</span>
                      </p>
                    </div>
                  )}

                  {selectedPatient.currentVitals.spO2 && (
                    <div className="p-3 bg-white rounded-xl border border-[#e4ded0]">
                      <span className="text-[10px] text-[#55706d] font-bold block">SpO2 Oxygen</span>
                      <p className="text-base font-bold text-[#166458] font-mono mt-0.5">
                        {selectedPatient.currentVitals.spO2}%
                      </p>
                    </div>
                  )}

                  {selectedPatient.currentVitals.bloodSugarMgDl && (
                    <div className="p-3 bg-white rounded-xl border border-[#e4ded0]">
                      <span className="text-[10px] text-[#55706d] font-bold block">Random Blood Sugar</span>
                      <p className="text-base font-bold text-[#c4684e] font-mono mt-0.5">
                        {selectedPatient.currentVitals.bloodSugarMgDl} <span className="text-[10px] text-[#55706d] font-normal">mg/dL</span>
                      </p>
                    </div>
                  )}

                  {selectedPatient.currentVitals.hemoglobin && (
                    <div className="p-3 bg-white rounded-xl border border-[#e4ded0]">
                      <span className="text-[10px] text-[#55706d] font-bold block">Hemoglobin (Hb)</span>
                      <p className="text-base font-bold text-rose-700 font-mono mt-0.5">
                        {selectedPatient.currentVitals.hemoglobin} <span className="text-[10px] text-[#55706d] font-normal">g/dL</span>
                      </p>
                    </div>
                  )}

                  {selectedPatient.currentVitals.temperatureF && (
                    <div className="p-3 bg-white rounded-xl border border-[#e4ded0]">
                      <span className="text-[10px] text-[#55706d] font-bold block">Body Temperature</span>
                      <p className="text-base font-bold text-[#173b3b] font-mono mt-0.5">
                        {selectedPatient.currentVitals.temperatureF}°F
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. Clinical Profile & High-Risk Surveillance */}
            <div className="bg-[#fffdf8] rounded-3xl p-5 border border-[#e4ded0] shadow-soft space-y-4">
              <div className="flex items-center justify-between border-b border-[#e4ded0] pb-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#166458]" />
                  <h3 className="font-bold text-[#173b3b] text-sm">
                    Clinical Background & Frontline Surveillance
                  </h3>
                </div>

                <span className={`text-[10px] uppercase px-2.5 py-0.5 rounded-md border ${getRiskBadge(selectedPatient.riskCategory)}`}>
                  {selectedPatient.riskCategory} Risk Profile
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-white border border-[#e4ded0] rounded-2xl space-y-1">
                  <span className="text-[#55706d] font-semibold block">Assigned ASHA Frontline Worker</span>
                  <p className="font-bold text-[#173b3b]">{selectedPatient.ashaWorkerName}</p>
                  <p className="text-[#55706d] text-[11px]">Phone: {selectedPatient.ashaWorkerPhone}</p>
                </div>

                <div className="p-3.5 bg-white border border-[#e4ded0] rounded-2xl space-y-1">
                  <span className="text-[#55706d] font-semibold block">High-Risk Cohort Type</span>
                  <p className="font-bold text-[#166458]">{selectedPatient.highRiskType || 'General Public OPD'}</p>
                  <p className="text-[#55706d] text-[11px]">Emergency Contact: {selectedPatient.emergencyContactPhone}</p>
                </div>
              </div>

              <div className="p-4 bg-[#f4bd64]/15 border border-[#f4bd64]/40 rounded-2xl text-xs space-y-1">
                <span className="font-bold text-[#173b3b] block">Longitudinal Clinical History Summary:</span>
                <p className="text-[#55706d] leading-relaxed font-medium">
                  {selectedPatient.pastHistorySummary}
                </p>
              </div>
            </div>

            {/* 4. Longitudinal Care Timeline (Inter-Hospital Journey across 5 Tiers) */}
            <div className="bg-[#fffdf8] rounded-3xl p-5 border border-[#e4ded0] shadow-soft space-y-3">
              <div className="flex items-center justify-between border-b border-[#e4ded0] pb-2">
                <h3 className="font-bold text-[#173b3b] text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#166458]" />
                  Longitudinal Continuum of Care (5-Hospital Journey)
                </h3>
                <span className="text-xs text-[#55706d] font-medium">Federated ABDM Logs</span>
              </div>

              <div className="space-y-3 relative pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#e4ded0] text-xs">
                {/* Step 1: Sub-Centre */}
                <div className="relative">
                  <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full bg-[#166458] ring-4 ring-white"></div>
                  <div className="p-3 bg-white rounded-2xl border border-[#e4ded0] space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between text-[#55706d] text-[11px]">
                      <span className="font-bold text-[#166458]">Tier 1 · Shirur Sub-Centre & HWC</span>
                      <span>Initial Registration</span>
                    </div>
                    <p className="font-bold text-[#173b3b]">Frontline Screening & Point-of-Care Diagnostic Encounter</p>
                    <p className="text-[#55706d] text-[11px]">
                      Assigned ABHA ID {selectedPatient.abhaId}. Initial vitals recorded and synced with state grid.
                    </p>
                  </div>
                </div>

                {/* Step 2: Primary Health Centre */}
                <div className="relative">
                  <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full bg-sky-600 ring-4 ring-white"></div>
                  <div className="p-3 bg-white rounded-2xl border border-[#e4ded0] space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between text-[#55706d] text-[11px]">
                      <span className="font-bold text-sky-800">Tier 2 · Khed Primary Health Centre</span>
                      <span>Tele-OPD Session</span>
                    </div>
                    <p className="font-bold text-[#173b3b]">Medical Officer Consultation & e-Prescription</p>
                    <p className="text-[#55706d] text-[11px]">
                      Primary stabilization, essential drug dispensing, and baseline risk stratification.
                    </p>
                  </div>
                </div>

                {/* Step 3: Community & District Hospital */}
                <div className="relative">
                  <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full bg-[#ba704f] ring-4 ring-white"></div>
                  <div className="p-3 bg-white rounded-2xl border border-[#e4ded0] space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between text-[#55706d] text-[11px]">
                      <span className="font-bold text-[#ba704f]">Tier 3 / 4 · Manchar CHC / Pune DH Hub</span>
                      <span>Active Telehealth Grid Record</span>
                    </div>
                    <p className="font-bold text-[#173b3b]">Specialist Review & Longitudinal Care Plan</p>
                    <p className="text-[#55706d] text-[11px]">
                      Continuous tele-monitoring and follow-up scheduled with local ASHA worker.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Register Patient Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-[#173b3b]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-[#fffdf8] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#e4ded0] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e4ded0]">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#166458]/10 text-[#166458] rounded-xl font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#173b3b] text-base">
                    Register New Patient into Hospital Database
                  </h3>
                  <p className="text-xs text-[#55706d]">
                    Generates instant 14-digit ABDM ABHA ID & persists to chosen facility
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-[#55706d] hover:text-[#173b3b] cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterPatient} className="space-y-3.5 text-xs">
              {/* Destination Hospital Database Selection */}
              <div>
                <label className="block font-bold text-[#173b3b] mb-1">
                  Target Hospital Database *
                </label>
                <select
                  value={targetFacilityId}
                  onChange={(e) => setTargetFacilityId(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e4ded0] rounded-xl text-[#173b3b] bg-white font-semibold focus:ring-2 focus:ring-[#166458] outline-none"
                >
                  {FACILITIES.map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.tier} - {fac.name} ({fac.block} Block)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#173b3b] mb-1">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Laxmi Suresh Shinde"
                  required
                  className="w-full px-3 py-2 border border-[#e4ded0] rounded-xl text-[#173b3b] bg-white focus:ring-2 focus:ring-[#166458] outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#173b3b] mb-1">Age *</label>
                  <input
                    type="number"
                    value={newAge}
                    onChange={(e) => setNewAge(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 border border-[#e4ded0] rounded-xl text-[#173b3b] bg-white focus:ring-2 focus:ring-[#166458] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#173b3b] mb-1">Gender *</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as any)}
                    className="w-full px-3 py-2 border border-[#e4ded0] rounded-xl text-[#173b3b] bg-white focus:ring-2 focus:ring-[#166458] outline-none"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#173b3b] mb-1">Blood Group</label>
                  <select
                    value={newBloodGroup}
                    onChange={(e) => setNewBloodGroup(e.target.value)}
                    className="w-full px-3 py-2 border border-[#e4ded0] rounded-xl text-[#173b3b] bg-white focus:ring-2 focus:ring-[#166458] outline-none"
                  >
                    <option value="A Positive">A+</option>
                    <option value="B Positive">B+</option>
                    <option value="O Positive">O+</option>
                    <option value="AB Positive">AB+</option>
                    <option value="A Negative">A-</option>
                    <option value="B Negative">B-</option>
                    <option value="O Negative">O-</option>
                    <option value="AB Negative">AB-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#173b3b] mb-1">Phone Number *</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-[#e4ded0] rounded-xl text-[#173b3b] bg-white focus:ring-2 focus:ring-[#166458] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#173b3b] mb-1">Village / Hamlet</label>
                  <input
                    type="text"
                    value={newVillage}
                    onChange={(e) => setNewVillage(e.target.value)}
                    className="w-full px-3 py-2 border border-[#e4ded0] rounded-xl text-[#173b3b] bg-white focus:ring-2 focus:ring-[#166458] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#173b3b] mb-1">High-Risk Surveillance Category</label>
                <select
                  value={newHighRiskType}
                  onChange={(e) => setNewHighRiskType(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e4ded0] rounded-xl text-[#173b3b] font-bold bg-white focus:ring-2 focus:ring-[#166458] outline-none"
                >
                  <option value="ANC_HIGH_RISK">High-Risk Pregnancy (ANC / Preeclampsia / Anemia)</option>
                  <option value="SAM_INFANT">Severe Acute Malnutrition (SAM Pediatric)</option>
                  <option value="NCD_DIABETES_HTN">Severe NCD (Diabetes / Hypertension / Renal)</option>
                  <option value="CARDIAC">Cardiovascular / Ischemic Heart Disease</option>
                  <option value="INFECTIOUS_FEVER">Infectious / Dengue / Malaria Surveillance</option>
                  <option value="TB_DOTS">Tuberculosis (TB DOTS Program)</option>
                  <option value="NONE">General Routine OPD</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#173b3b] mb-1">Clinical History Notes</label>
                <textarea
                  rows={2}
                  value={newPastHistory}
                  onChange={(e) => setNewPastHistory(e.target.value)}
                  placeholder="Known allergies, symptoms, prior hospital admissions..."
                  className="w-full px-3 py-2 border border-[#e4ded0] rounded-xl text-[#173b3b] bg-white focus:ring-2 focus:ring-[#166458] outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#e4ded0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-xl text-[#55706d] hover:bg-[#e4ded0]/50 cursor-pointer font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#166458] hover:bg-[#0f4d43] text-white font-bold cursor-pointer shadow-xs"
                >
                  Register into Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FHIR JSON Interoperability Modal */}
      {showFhirModal && selectedPatient && (
        <div className="fixed inset-0 bg-[#173b3b]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-[#173b3b] text-[#fffaf0] rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-white/20 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-[#f4bd64]" />
                <div>
                  <h3 className="font-bold text-white text-base">
                    FHIR R4 JSON Interoperability Resource
                  </h3>
                  <p className="text-xs text-[#fffaf0]/70">
                    Standardized ABDM Health Information Exchange (HIE-CM) Record for {selectedPatient.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFhirModal(false)}
                className="text-[#fffaf0]/60 hover:text-white cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#0e2727] p-4 rounded-2xl font-mono text-[11px] text-[#f4bd64] max-h-96 overflow-y-auto border border-white/10">
              <pre>{JSON.stringify(generateFhirBundle(selectedPatient), null, 2)}</pre>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowFhirModal(false)}
                className="px-4 py-2 bg-[#166458] hover:bg-[#124f46] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close FHIR Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
