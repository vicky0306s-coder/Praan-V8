import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  Video,
  Phone,
  Mail,
  Award,
  ShieldCheck,
  Building2,
  Calendar,
  Sparkles,
  AlertCircle,
  Edit3,
  Trash2,
  UserCheck,
  Activity,
  Globe,
  Radio
} from 'lucide-react';
import { Doctor, DoctorAvailabilityStatus, Facility, FacilityTier } from '../types';
import { storageService } from '../services/storageService';
import { FACILITIES } from '../data/initialData';

interface DoctorManagementViewProps {
  currentFacility: Facility;
  onInitiateTeleconsult?: (doctor: Doctor) => void;
}

export const DoctorManagementView: React.FC<DoctorManagementViewProps> = ({
  currentFacility,
  onInitiateTeleconsult
}) => {
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [specialityFilter, setSpecialityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [selectedDoctorForDetails, setSelectedDoctorForDetails] = useState<Doctor | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  // Form State for Adding/Editing Doctor
  const [formData, setFormData] = useState<{
    name: string;
    facilityId: string;
    qualification: string;
    speciality: string;
    registrationNumber: string;
    experienceYears: number;
    languages: string;
    phone: string;
    email: string;
    status: DoctorAvailabilityStatus;
    onDuty: boolean;
    shift: string;
    currentDutyWard: string;
    teleconsultRoomId: string;
    bio: string;
  }>({
    name: '',
    facilityId: currentFacility.id,
    qualification: 'MBBS, MD',
    speciality: 'General Medicine',
    registrationNumber: 'MMC-2024-001',
    experienceYears: 5,
    languages: 'Marathi, Hindi, English',
    phone: '+91 ',
    email: '@telemed.gov.in',
    status: 'Available',
    onDuty: true,
    shift: 'Morning OPD (08:00 - 14:00)',
    currentDutyWard: 'OPD Chamber 1',
    teleconsultRoomId: 'room_telemed_general',
    bio: ''
  });

  const loadDoctors = () => {
    const all = storageService.getAllFederatedDoctors();
    setDoctorsList(all);
  };

  useEffect(() => {
    loadDoctors();
    const unsub = storageService.subscribe(() => {
      loadDoctors();
    });
    return () => unsub();
  }, []);

  const handleStatusChange = (doctor: Doctor, newStatus: DoctorAvailabilityStatus) => {
    const onDuty = newStatus !== 'Off Duty' && newStatus !== 'On Leave';
    storageService.updateDoctorStatus(doctor.id, newStatus, onDuty);
    loadDoctors();
  };

  const handleSaveDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    const targetFacility = FACILITIES.find((f) => f.id === formData.facilityId) || currentFacility;

    const docObj: Doctor = {
      id: editingDoctor ? editingDoctor.id : `DOC-${formData.facilityId}-${Date.now().toString().slice(-4)}`,
      name: formData.name,
      facilityId: formData.facilityId,
      facilityName: targetFacility.name,
      qualification: formData.qualification,
      speciality: formData.speciality,
      registrationNumber: formData.registrationNumber,
      experienceYears: Number(formData.experienceYears),
      languages: formData.languages.split(',').map((l) => l.trim()).filter(Boolean),
      phone: formData.phone,
      email: formData.email,
      photoUrl: editingDoctor?.photoUrl || `https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=256`,
      status: formData.status,
      onDuty: formData.onDuty,
      schedule: {
        shift: formData.shift,
        daysActive: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        currentDutyWard: formData.currentDutyWard,
        teleconsultRoomId: formData.teleconsultRoomId
      },
      teleconsultStationsAssigned: 2,
      activeConsultationCount: 0,
      completedConsultationsToday: editingDoctor ? editingDoctor.completedConsultationsToday : 0,
      rating: editingDoctor ? editingDoctor.rating : 4.9,
      bio: formData.bio
    };

    if (editingDoctor) {
      storageService.updateDoctor(docObj);
    } else {
      storageService.addDoctor(docObj.facilityId, docObj);
    }

    setShowAddModal(false);
    setEditingDoctor(null);
    loadDoctors();
  };

  const handleOpenEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      name: doctor.name,
      facilityId: doctor.facilityId,
      qualification: doctor.qualification,
      speciality: doctor.speciality,
      registrationNumber: doctor.registrationNumber,
      experienceYears: doctor.experienceYears,
      languages: doctor.languages.join(', '),
      phone: doctor.phone,
      email: doctor.email,
      status: doctor.status,
      onDuty: doctor.onDuty,
      shift: doctor.schedule?.shift || 'Morning OPD (08:00 - 14:00)',
      currentDutyWard: doctor.schedule?.currentDutyWard || 'OPD Chamber 1',
      teleconsultRoomId: doctor.schedule?.teleconsultRoomId || '',
      bio: doctor.bio || ''
    });
    setShowAddModal(true);
  };

  const handleDeleteDoctor = (doctor: Doctor) => {
    if (confirm(`Are you sure you want to remove ${doctor.name} from the roster?`)) {
      storageService.deleteDoctor(doctor.facilityId, doctor.id);
      loadDoctors();
      if (selectedDoctorForDetails?.id === doctor.id) {
        setSelectedDoctorForDetails(null);
      }
    }
  };

  // Filter Logic
  const filteredDoctors = doctorsList.filter((doc) => {
    if (selectedFacilityId !== 'ALL' && doc.facilityId !== selectedFacilityId) {
      return false;
    }
    if (statusFilter !== 'ALL' && doc.status !== statusFilter) {
      return false;
    }
    if (specialityFilter !== 'ALL' && !doc.speciality.toLowerCase().includes(specialityFilter.toLowerCase())) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = doc.name.toLowerCase().includes(q);
      const matchSpec = doc.speciality.toLowerCase().includes(q);
      const matchReg = doc.registrationNumber.toLowerCase().includes(q);
      const matchQual = doc.qualification.toLowerCase().includes(q);
      const matchLang = doc.languages.some((l) => l.toLowerCase().includes(q));
      if (!matchName && !matchSpec && !matchReg && !matchQual && !matchLang) {
        return false;
      }
    }
    return true;
  });

  // Calculate Metrics
  const totalDoctors = doctorsList.length;
  const availableCount = doctorsList.filter((d) => d.status === 'Available').length;
  const activeConsultCount = doctorsList.filter((d) => d.status === 'In Consultation' || d.status === 'In Emergency OT').length;
  const onDutyCount = doctorsList.filter((d) => d.onDuty).length;

  const getStatusColor = (status: DoctorAvailabilityStatus) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'In Consultation':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'In Emergency OT':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'On Rounds':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'On Call':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'Off Duty':
      case 'On Leave':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getTierBadge = (tier?: FacilityTier) => {
    switch (tier) {
      case 'HWC':
        return { label: 'HWC / Ayushman Mandir', color: 'bg-teal-50 text-teal-800 border-teal-200' };
      case 'PHC':
        return { label: 'PHC Primary', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'CHC':
        return { label: 'CHC Specialist', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'DH':
        return { label: 'DH District Lead', color: 'bg-orange-50 text-orange-800 border-orange-200' };
      case 'APEX':
        return { label: 'Apex Super-Speciality', color: 'bg-rose-50 text-rose-800 border-rose-200' };
      default:
        return { label: 'Health Facility', color: 'bg-stone-50 text-stone-800 border-stone-200' };
    }
  };

  return (
    <div id="doctor-management-view" className="space-y-6">
      {/* Top Banner & Control HUD */}
      <div className="bg-[#FAF7F2] border border-[#E6DEC8] rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-[#2D5A43] text-white rounded-lg shadow-xs">
                <Stethoscope className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-[#1F2937] font-serif tracking-tight">
                  Hospital Doctor Roster & Teleconsult Availability Grid
                </h1>
                <p className="text-xs text-[#5C584E] mt-0.5">
                  Interoperable live clinician availability directory across 5 tiered public healthcare facilities
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-register-new-doctor"
              onClick={() => {
                setEditingDoctor(null);
                setFormData({
                  name: '',
                  facilityId: currentFacility.id,
                  qualification: 'MBBS, MD',
                  speciality: 'General Medicine',
                  registrationNumber: 'MMC-2024-001',
                  experienceYears: 5,
                  languages: 'Marathi, Hindi, English',
                  phone: '+91 ',
                  email: '@telemed.gov.in',
                  status: 'Available',
                  onDuty: true,
                  shift: 'Morning OPD (08:00 - 14:00)',
                  currentDutyWard: 'OPD Chamber 1',
                  teleconsultRoomId: 'room_telemed_general',
                  bio: ''
                });
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#2D5A43] hover:bg-[#234734] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Register Medical Staff</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <div className="bg-white border border-[#E6DEC8] rounded-lg p-3 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-[#5C584E]">
              <span>Total Medical Staff</span>
              <Building2 className="w-4 h-4 text-[#2D5A43]" />
            </div>
            <div className="text-2xl font-bold text-[#1F2937] mt-1 font-mono">
              {totalDoctors}
            </div>
            <div className="text-[11px] text-[#5C584E] mt-0.5">Across 5 Tiered Centers</div>
          </div>

          <div className="bg-white border border-emerald-200 rounded-lg p-3 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-emerald-800">
              <span className="font-semibold">Ready for Tele-OPD</span>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div className="text-2xl font-bold text-emerald-800 mt-1 font-mono">
              {availableCount}
            </div>
            <div className="text-[11px] text-emerald-700 mt-0.5">Immediate Video Connect</div>
          </div>

          <div className="bg-white border border-amber-200 rounded-lg p-3 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-amber-900">
              <span>In Consult / OT</span>
              <Activity className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-900 mt-1 font-mono">
              {activeConsultCount}
            </div>
            <div className="text-[11px] text-amber-700 mt-0.5">Active Patient Triage</div>
          </div>

          <div className="bg-white border border-stone-200 rounded-lg p-3 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-[#5C584E]">
              <span>Total On Duty</span>
              <UserCheck className="w-4 h-4 text-[#2D5A43]" />
            </div>
            <div className="text-2xl font-bold text-[#1F2937] mt-1 font-mono">
              {onDutyCount} / {totalDoctors}
            </div>
            <div className="text-[11px] text-[#5C584E] mt-0.5">Active Shift Roster</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-[#E6DEC8] rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C867A]" />
            <input
              id="input-search-doctors"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search doctor by name, speciality, council registration #, or qualification..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-[#D5CEBC] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#2D5A43] focus:border-[#2D5A43] bg-[#FCFBF9]"
            />
          </div>

          {/* Hospital Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#5C584E] font-medium whitespace-nowrap">Hospital:</span>
            <select
              id="select-filter-hospital"
              value={selectedFacilityId}
              onChange={(e) => setSelectedFacilityId(e.target.value)}
              className="px-3 py-2 text-xs border border-[#D5CEBC] rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-[#2D5A43] font-medium"
            >
              <option value="ALL">All 5 Hospitals (Network View)</option>
              {FACILITIES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.tier}: {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#5C584E] font-medium whitespace-nowrap">Status:</span>
            <select
              id="select-filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-[#D5CEBC] rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-[#2D5A43] font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="Available">Available (Online)</option>
              <option value="In Consultation">In Consultation</option>
              <option value="In Emergency OT">In Emergency OT</option>
              <option value="On Rounds">On Rounds / Wards</option>
              <option value="On Call">On Call (Tele-ICU)</option>
              <option value="Off Duty">Off Duty</option>
            </select>
          </div>
        </div>

        {/* Quick Facility Chips */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#F0EBE1]">
          <button
            onClick={() => setSelectedFacilityId('ALL')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              selectedFacilityId === 'ALL'
                ? 'bg-[#2D5A43] text-white font-medium shadow-2xs'
                : 'bg-[#F2ECE1] text-[#5C584E] hover:bg-[#E6DEC8]'
            }`}
          >
            All Hospitals ({doctorsList.length})
          </button>
          {FACILITIES.map((fac) => {
            const count = doctorsList.filter((d) => d.facilityId === fac.id).length;
            const avail = doctorsList.filter((d) => d.facilityId === fac.id && d.status === 'Available').length;
            return (
              <button
                key={fac.id}
                onClick={() => setSelectedFacilityId(fac.id)}
                className={`px-3 py-1 text-xs rounded-md flex items-center gap-1.5 transition-colors ${
                  selectedFacilityId === fac.id
                    ? 'bg-[#2D5A43] text-white font-medium shadow-2xs'
                    : 'bg-[#F2ECE1] text-[#5C584E] hover:bg-[#E6DEC8]'
                }`}
              >
                <span>{fac.name.split(' ')[0]}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedFacilityId === fac.id
                      ? 'bg-white/20 text-white'
                      : avail > 0
                      ? 'bg-emerald-200 text-emerald-800'
                      : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {avail} avail / {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Doctors Grid */}
      {filteredDoctors.length === 0 ? (
        <div className="bg-white border border-[#E6DEC8] rounded-xl p-12 text-center">
          <Stethoscope className="w-10 h-10 text-[#8C867A] mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-semibold text-[#1F2937]">No medical staff found</h3>
          <p className="text-xs text-[#5C584E] mt-1 max-w-md mx-auto">
            No doctors match your selected filters. Try changing your hospital selection, status filter, or search query.
          </p>
          <button
            onClick={() => {
              setSelectedFacilityId('ALL');
              setStatusFilter('ALL');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-1.5 bg-[#F2ECE1] text-[#2D5A43] hover:bg-[#E6DEC8] text-xs font-semibold rounded-lg"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDoctors.map((doc) => {
            const fac = FACILITIES.find((f) => f.id === doc.facilityId);
            const tierBadge = getTierBadge(fac?.tier);

            return (
              <div
                key={doc.id}
                id={`doctor-card-${doc.id}`}
                className="bg-white border border-[#E6DEC8] rounded-xl p-4 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Photo + Status + Info */}
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <img
                        src={doc.photoUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=256'}
                        alt={doc.name}
                        className="w-14 h-14 rounded-lg object-cover border border-[#D5CEBC]"
                      />
                      <span
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          doc.status === 'Available'
                            ? 'bg-emerald-500 ring-2 ring-emerald-200'
                            : doc.status === 'In Consultation' || doc.status === 'In Emergency OT'
                            ? 'bg-blue-500'
                            : doc.status === 'On Rounds' || doc.status === 'On Call'
                            ? 'bg-amber-500'
                            : 'bg-slate-400'
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="text-sm font-bold text-[#1F2937] truncate font-serif">
                          {doc.name}
                        </h3>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium border shrink-0 ${getStatusColor(
                            doc.status
                          )}`}
                        >
                          {doc.status}
                        </span>
                      </div>

                      <p className="text-[11px] font-medium text-[#2D5A43] truncate mt-0.5">
                        {doc.speciality}
                      </p>
                      <p className="text-[10px] text-[#78716C] truncate">{doc.qualification}</p>
                    </div>
                  </div>

                  {/* Hospital & Credentials Tag */}
                  <div className="mt-3 pt-2.5 border-t border-[#F2ECE1] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#5C584E] flex items-center gap-1 truncate">
                        <Building2 className="w-3.5 h-3.5 text-[#8C867A] shrink-0" />
                        <span className="truncate">{doc.facilityName}</span>
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-sm border shrink-0 font-medium ${tierBadge.color}`}
                      >
                        {fac?.tier || 'FACILITY'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#5C584E]">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-mono text-[10px] text-[#44403C]">
                          Reg: {doc.registrationNumber}
                        </span>
                      </span>
                      <span className="text-[10px] font-medium text-[#2D5A43]">
                        {doc.experienceYears} Yrs Exp
                      </span>
                    </div>

                    {doc.schedule && (
                      <div className="bg-[#FAF7F2] rounded-md p-2 text-[10px] text-[#5C584E] space-y-1 border border-[#EFE9DC]">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 font-medium text-[#1F2937]">
                            <Clock className="w-3 h-3 text-[#8C867A]" />
                            <span>{doc.schedule.shift}</span>
                          </span>
                          <span className="text-[#2D5A43] font-mono font-medium">
                            ⭐ {doc.rating || 4.9}
                          </span>
                        </div>
                        {doc.schedule.currentDutyWard && (
                          <div className="text-[10px] text-[#78716C] flex items-center gap-1">
                            <Radio className="w-3 h-3 text-[#2D5A43]" />
                            <span className="truncate">Station: {doc.schedule.currentDutyWard}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Language Chips */}
                    <div className="flex items-center gap-1 text-[10px] text-[#5C584E] pt-1">
                      <Globe className="w-3 h-3 text-[#8C867A] shrink-0" />
                      <div className="flex flex-wrap gap-1">
                        {doc.languages.map((lang) => (
                          <span
                            key={lang}
                            className="bg-[#F2ECE1] text-[#44403C] px-1.5 py-0.2 rounded-xs text-[9px]"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Controls & Quick Status Switch */}
                <div className="mt-4 pt-3 border-t border-[#F2ECE1] space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] text-[#78716C] font-medium">Live Status:</span>
                    <select
                      id={`select-status-${doc.id}`}
                      value={doc.status}
                      onChange={(e) =>
                        handleStatusChange(doc, e.target.value as DoctorAvailabilityStatus)
                      }
                      className="text-[10px] font-medium py-1 px-2 border border-[#D5CEBC] rounded-md bg-[#FAF7F2] text-[#1F2937] focus:outline-hidden focus:ring-1 focus:ring-[#2D5A43]"
                    >
                      <option value="Available">Available (Tele-OPD)</option>
                      <option value="In Consultation">In Consultation</option>
                      <option value="In Emergency OT">In Emergency OT</option>
                      <option value="On Rounds">On Rounds</option>
                      <option value="On Call">On Call</option>
                      <option value="Off Duty">Off Duty</option>
                      <option value="On Leave">On Leave</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      id={`btn-teleconsult-${doc.id}`}
                      onClick={() => {
                        if (onInitiateTeleconsult) {
                          onInitiateTeleconsult(doc);
                        } else {
                          setSelectedDoctorForDetails(doc);
                        }
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#2D5A43] hover:bg-[#234734] text-white text-[11px] font-semibold rounded-lg shadow-2xs transition-colors"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>{doc.status === 'Available' ? 'Connect Tele-OPD' : 'Request Tele-Triage'}</span>
                    </button>

                    <button
                      onClick={() => setSelectedDoctorForDetails(doc)}
                      title="View Details"
                      className="p-1.5 border border-[#D5CEBC] hover:bg-[#F2ECE1] text-[#5C584E] rounded-lg transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleOpenEdit(doc)}
                      title="Edit Doctor"
                      className="p-1.5 border border-[#D5CEBC] hover:bg-[#F2ECE1] text-[#5C584E] rounded-lg transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteDoctor(doc)}
                      title="Delete Doctor"
                      className="p-1.5 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Doctor Full Detail Modal */}
      {selectedDoctorForDetails && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E6DEC8] rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={selectedDoctorForDetails.photoUrl}
                  alt={selectedDoctorForDetails.name}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-[#2D5A43]"
                />
                <div>
                  <h3 className="text-base font-bold text-[#1F2937] font-serif">
                    {selectedDoctorForDetails.name}
                  </h3>
                  <p className="text-xs font-semibold text-[#2D5A43]">
                    {selectedDoctorForDetails.speciality}
                  </p>
                  <p className="text-[11px] text-[#78716C]">
                    {selectedDoctorForDetails.qualification}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoctorForDetails(null)}
                className="text-[#8C867A] hover:text-[#1F2937] text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#FAF7F2] border border-[#E6DEC8] rounded-lg p-3 space-y-2 text-xs text-[#5C584E]">
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#1F2937]">Facility Assignment:</span>
                <span className="font-semibold text-[#2D5A43]">
                  {selectedDoctorForDetails.facilityName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#1F2937]">Medical Council Reg #:</span>
                <span className="font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-sm">
                  {selectedDoctorForDetails.registrationNumber}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#1F2937]">Clinical Experience:</span>
                <span>{selectedDoctorForDetails.experienceYears} Years Active Practice</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#1F2937]">Consultations Handled Today:</span>
                <span className="font-mono font-bold text-[#1F2937]">
                  {selectedDoctorForDetails.completedConsultationsToday || 12} Completed
                </span>
              </div>
            </div>

            {selectedDoctorForDetails.bio && (
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[#1F2937] uppercase tracking-wider">
                  Clinical Bio & Expertise
                </h4>
                <p className="text-xs text-[#5C584E] leading-relaxed bg-[#FCFBF9] p-3 rounded-lg border border-[#EFE9DC]">
                  {selectedDoctorForDetails.bio}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2 bg-[#FAF7F2] rounded-lg border border-[#EFE9DC]">
                <Phone className="w-4 h-4 text-[#2D5A43]" />
                <span className="truncate font-mono text-[11px]">{selectedDoctorForDetails.phone}</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-[#FAF7F2] rounded-lg border border-[#EFE9DC]">
                <Mail className="w-4 h-4 text-[#2D5A43]" />
                <span className="truncate text-[11px]">{selectedDoctorForDetails.email}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0EBE1]">
              <button
                onClick={() => setSelectedDoctorForDetails(null)}
                className="px-4 py-2 border border-[#D5CEBC] text-xs font-semibold text-[#5C584E] hover:bg-[#F2ECE1] rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const doc = selectedDoctorForDetails;
                  setSelectedDoctorForDetails(null);
                  if (onInitiateTeleconsult) {
                    onInitiateTeleconsult(doc);
                  }
                }}
                className="px-4 py-2 bg-[#2D5A43] hover:bg-[#234734] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <Video className="w-4 h-4" />
                <span>Launch Teleconsultation Session</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Doctor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E6DEC8] rounded-xl max-w-xl w-full p-6 shadow-xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#2D5A43] text-white rounded-md">
                  <Stethoscope className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-[#1F2937] font-serif">
                  {editingDoctor ? 'Edit Doctor Profile' : 'Register New Medical Staff / Doctor'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingDoctor(null);
                }}
                className="text-[#8C867A] hover:text-[#1F2937] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDoctor} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1F2937] mb-1">
                    Doctor / Clinician Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dr. Ramesh Gupta"
                    className="w-full px-3 py-2 border border-[#D5CEBC] rounded-lg focus:ring-1 focus:ring-[#2D5A43] bg-[#FCFBF9]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1F2937] mb-1">
                    Assigned Public Healthcare Facility *
                  </label>
                  <select
                    value={formData.facilityId}
                    onChange={(e) => setFormData({ ...formData, facilityId: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D5CEBC] rounded-lg focus:ring-1 focus:ring-[#2D5A43] bg-[#FCFBF9]"
                  >
                    {FACILITIES.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.tier}: {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1F2937] mb-1">
                    Medical Qualifications *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    placeholder="e.g. MBBS, MD (General Medicine)"
                    className="w-full px-3 py-2 border border-[#D5CEBC] rounded-lg focus:ring-1 focus:ring-[#2D5A43] bg-[#FCFBF9]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1F2937] mb-1">
                    Clinical Speciality *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.speciality}
                    onChange={(e) => setFormData({ ...formData, speciality: e.target.value })}
                    placeholder="e.g. Obstetrics & High Risk Pregnancy"
                    className="w-full px-3 py-2 border border-[#D5CEBC] rounded-lg focus:ring-1 focus:ring-[#2D5A43] bg-[#FCFBF9]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#1F2937] mb-1">
                    State Council Reg. No. *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    placeholder="MMC-2015-08-3342"
                    className="w-full px-3 py-2 border border-[#D5CEBC] rounded-lg focus:ring-1 focus:ring-[#2D5A43] bg-[#FCFBF9] font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1F2937] mb-1">
                    Years Experience
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#D5CEBC] rounded-lg focus:ring-1 focus:ring-[#2D5A43] bg-[#FCFBF9]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1F2937] mb-1">
                    Initial Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as DoctorAvailabilityStatus,
                        onDuty: e.target.value !== 'Off Duty' && e.target.value !== 'On Leave'
                      })
                    }
                    className="w-full px-3 py-2 border border-[#D5CEBC] rounded-lg focus:ring-1 focus:ring-[#2D5A43] bg-[#FCFBF9]"
                  >
                    <option value="Available">Available</option>
                    <option value="In Consultation">In Consultation</option>
                    <option value="In Emergency OT">In Emergency OT</option>
                    <option value="On Rounds">On Rounds</option>
                    <option value="On Call">On Call</option>
                    <option value="Off Duty">Off Duty</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1F2937] mb-1">
                    Shift Timetable
                  </label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D5CEBC] rounded-lg focus:ring-1 focus:ring-[#2D5A43] bg-[#FCFBF9]"
                  >
                    <option value="Morning OPD (08:00 - 14:00)">Morning OPD (08:00 - 14:00)</option>
                    <option value="Evening OPD (14:00 - 20:00)">Evening OPD (14:00 - 20:00)</option>
                    <option value="Night Emergency (20:00 - 08:00)">Night Emergency (20:00 - 08:00)</option>
                    <option value="24x7 Tele-ICU On-Call">24x7 Tele-ICU On-Call</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#1F2937] mb-1">
                    Current Ward / Tele Station
                  </label>
                  <input
                    type="text"
                    value={formData.currentDutyWard}
                    onChange={(e) => setFormData({ ...formData, currentDutyWard: e.target.value })}
                    placeholder="e.g. Tele-OPD Station 2"
                    className="w-full px-3 py-2 border border-[#D5CEBC] rounded-lg focus:ring-1 focus:ring-[#2D5A43] bg-[#FCFBF9]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1F2937] mb-1">
                    Languages (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.languages}
                    onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                    placeholder="Marathi, Hindi, English"
                    className="w-full px-3 py-2 border border-[#D5CEBC] rounded-lg focus:ring-1 focus:ring-[#2D5A43] bg-[#FCFBF9]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1F2937] mb-1">
                    Official Telemed Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="doctor.name@telemed.gov.in"
                    className="w-full px-3 py-2 border border-[#D5CEBC] rounded-lg focus:ring-1 focus:ring-[#2D5A43] bg-[#FCFBF9]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1F2937] mb-1">
                  Clinical Bio & Summary
                </label>
                <textarea
                  rows={2}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Summary of clinician expertise, key hospital roles, and tele-triage guidance areas..."
                  className="w-full px-3 py-2 border border-[#D5CEBC] rounded-lg focus:ring-1 focus:ring-[#2D5A43] bg-[#FCFBF9]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0EBE1]">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingDoctor(null);
                  }}
                  className="px-4 py-2 border border-[#D5CEBC] text-xs font-semibold text-[#5C584E] hover:bg-[#F2ECE1] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2D5A43] hover:bg-[#234734] text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  {editingDoctor ? 'Update Doctor Profile' : 'Save & Add to Roster'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
