import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  Globe,
  RotateCcw,
  CheckCircle2,
  MapPin,
  Search,
  Cloud,
  Check,
  Bed,
  Heart,
  ShieldCheck,
  Building2,
  Activity,
  Layers
} from 'lucide-react';
import { Facility, SupportedLanguage } from '../types';
import { FACILITIES } from '../data/initialData';
import { useLanguage, SUPPORTED_LANGUAGES } from '../services/languageService';
import { storageService } from '../services/storageService';
import { awsCloudService } from '../services/awsCloudService';
import { PraanLogo } from './PraanLogo';

interface LoginPortalProps {
  onLoginSuccess: (facility: Facility) => void;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({ onLoginSuccess }) => {
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('HWC-01');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isEntering, setIsEntering] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);
  const { language: currentLang, setLanguage, t } = useLanguage();

  const awsConfig = awsCloudService.getConfig();

  const selectedFacility = useMemo(() => {
    return FACILITIES.find((f) => f.id === selectedFacilityId) || FACILITIES[0];
  }, [selectedFacilityId]);

  const filteredFacilities = useMemo(() => {
    return FACILITIES.filter((fac) => {
      const matchesTier = tierFilter === 'ALL' || fac.tier === tierFilter;
      const cleanSearch = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !cleanSearch ||
        fac.name.toLowerCase().includes(cleanSearch) ||
        fac.shortName.toLowerCase().includes(cleanSearch) ||
        fac.block.toLowerCase().includes(cleanSearch) ||
        fac.district.toLowerCase().includes(cleanSearch);
      return matchesTier && matchesSearch;
    });
  }, [tierFilter, searchQuery]);

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setLanguage(lang);
  };

  const handleSelectAndProceed = (facility: Facility) => {
    setSelectedFacilityId(facility.id);
    setIsEntering(true);
    setTimeout(() => {
      onLoginSuccess(facility);
    }, 150);
  };

  const handleResetDatabases = () => {
    storageService.resetToDefaultSeeds();
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 2500);
  };

  const getTierDetails = (tier: string) => {
    switch (tier) {
      case 'HWC':
        return {
          tierLabel: t('tier1SubCentre', 'Tier 1 · Sub-Centre'),
          tagClass: 'bg-[#166458]/15 text-[#166458] border-[#166458]/30'
        };
      case 'PHC':
        return {
          tierLabel: t('tier2PrimaryCare', 'Tier 2 · Primary Care'),
          tagClass: 'bg-sky-100 text-sky-800 border-sky-200'
        };
      case 'CHC':
        return {
          tierLabel: t('tier3Community', 'Tier 3 · Community'),
          tagClass: 'bg-[#f4bd64]/30 text-[#ba704f] border-[#f4bd64]/60'
        };
      case 'DH':
        return {
          tierLabel: t('tier4DistrictHospital', 'Tier 4 · District Hospital'),
          tagClass: 'bg-[#166458]/20 text-[#166458] border-[#166458]/40'
        };
      case 'APEX':
        return {
          tierLabel: t('tier5ApexMedicalCollege', 'Tier 5 · Apex Medical College'),
          tagClass: 'bg-[#c4684e]/15 text-[#c4684e] border-[#c4684e]/40'
        };
      default:
        return {
          tierLabel: t('activeHospital', 'Health Facility'),
          tagClass: 'bg-[#f7f4ed] text-[#55706d] border-[#e4ded0]'
        };
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between font-sans text-[#173b3b] bg-[#f7f4ed] relative overflow-hidden">
      {/* Aesthetic Warm Ambient Background Glows */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-[#166458]/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/3 -right-40 w-[30rem] h-[30rem] bg-[#f4bd64]/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed -bottom-40 left-1/3 w-96 h-96 bg-[#c4684e]/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header with Logo */}
      <header className="py-4 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 bg-[#f7f4ed]/90 backdrop-blur-xl border-b border-[#e4ded0]">
        <div className="flex items-center gap-3">
          <PraanLogo className="w-10 h-10 hover:scale-105 transition-transform" />
          
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#173b3b] tracking-tight">{t('appName', 'Praan')}</h1>
              <span className="text-[11px] bg-[#166458]/15 text-[#166458] px-2.5 py-0.5 rounded-full font-bold border border-[#166458]/30">
                {t('gridTag', 'Public Telemedicine Grid')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#55706d] font-medium mt-0.5">
              <Cloud className="w-3 h-3 text-[#166458]" />
              <span>{t('awsFirebaseStatus', 'AWS Cloud & Firebase Firestore')} ({awsConfig.region})</span>
            </div>
          </div>
        </div>

        {/* Right Tools: Language & Reset */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-white rounded-full px-3 py-1.5 border border-[#e4ded0] shadow-2xs hover:border-[#166458] transition">
            <Globe className="w-3.5 h-3.5 text-[#ba704f] mr-1.5 shrink-0" />
            <select
              id="login-language-select"
              value={currentLang}
              onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
              aria-label={t('languageSelect', 'Language / भाषा')}
              className="bg-transparent text-xs text-[#173b3b] font-bold focus:outline-none cursor-pointer pr-1"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-white text-[#173b3b] font-medium">
                  {lang.nativeLabel} ({lang.label})
                </option>
              ))}
            </select>
          </div>

          <button
            id="reset-demo-db-btn"
            onClick={handleResetDatabases}
            className="text-xs text-[#55706d] hover:text-[#173b3b] bg-white hover:bg-[#fffdf8] px-3.5 py-1.5 rounded-full border border-[#e4ded0] transition cursor-pointer font-semibold inline-flex items-center gap-1.5 shadow-2xs"
            title="Reset demo records"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#166458]" />
            <span className="hidden sm:inline">{t('resetDemoBtn', 'Reset')}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full flex-1 flex flex-col justify-center">
        {resetSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {t('recordsResetSuccess', 'Hospital records reset successfully on Cloud storage.')}
          </div>
        )}

        {/* Hero Visual Banner matching theme */}
        <div className="rounded-3xl bg-[#166458] text-[#fffaf0] p-6 sm:p-8 mb-8 shadow-soft relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="z-10 max-w-xl">
            <div className="inline-flex items-center gap-2 text-[#f4bd64] text-xs font-bold uppercase tracking-widest mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>{t('heroBannerTag', 'Public Healthcare Telemedicine Grid')}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              {t('careThatReaches', 'Care that reaches')} <br />
              <em className="font-serif italic font-semibold text-[#f4bd64]">
                {t('everyDoorstep', 'every doorstep.')}
              </em>
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-[#fffaf0]/80 leading-relaxed max-w-md">
              {t(
                'heroDescription',
                'Federated digital health grid connecting frontline Sub-Centres with Specialist CHCs, District Hospitals, and Apex Medical Colleges.'
              )}
            </p>
          </div>

          <div className="z-10 flex flex-col items-center sm:items-end gap-3 text-right">
            <span className="text-xs text-[#f4bd64] font-bold">
              {t('fiveTierNetwork', '5-Tier Public Network')}
            </span>
            <div className="flex gap-2">
              {['HWC', 'PHC', 'CHC', 'DH', 'APEX'].map((tier) => (
                <span key={tier} className="px-2.5 py-1 rounded-lg bg-white/15 text-[10px] font-bold text-white border border-white/20">
                  {tier}
                </span>
              ))}
            </div>
          </div>

          {/* Decorative circular orbits */}
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full border border-white/10 pointer-events-none" />
          <div className="absolute -right-32 -bottom-32 w-96 h-96 rounded-full border border-white/10 pointer-events-none" />
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-[#fffdf8] border border-[#e4ded0] rounded-2xl p-3 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
          {/* Quick Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
            {[
              { id: 'ALL', label: t('allFacilities', 'All Facilities') },
              { id: 'HWC', label: t('tierHwcShort', 'Sub-Centre (HWC)') },
              { id: 'PHC', label: t('tierPhcShort', 'Primary (PHC)') },
              { id: 'CHC', label: t('tierChcShort', 'Community (CHC)') },
              { id: 'DH', label: t('tierDhShort', 'District (DH)') },
              { id: 'APEX', label: t('tierApexShort', 'Apex College') }
            ].map((tab) => {
              const isActive = tierFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`filter-tier-${tab.id}`}
                  onClick={() => setTierFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#166458] text-white shadow-xs'
                      : 'text-[#42645e] hover:bg-[#166458]/10 hover:text-[#166458]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#ba704f] absolute left-3 top-2.5" />
            <input
              id="hospital-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchFacilityPlaceholder', 'Search facility name or block...')}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#e4ded0] rounded-xl focus:ring-2 focus:ring-[#166458] bg-[#f7f4ed] text-[#173b3b] placeholder:text-[#8a9992] font-medium outline-none"
            />
          </div>
        </div>

        {/* 5-Hospital Interactive Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {filteredFacilities.map((fac) => {
            const isSelected = fac.id === selectedFacilityId;
            const details = getTierDetails(fac.tier);
            const freeBeds = fac.totalBeds - fac.occupiedBeds;

            return (
              <div
                key={fac.id}
                id={`hospital-card-${fac.id}`}
                onClick={() => setSelectedFacilityId(fac.id)}
                className={`rounded-2xl p-5 border transition cursor-pointer flex flex-col justify-between relative ${
                  isSelected
                    ? 'bg-[#fffdf8] border-[#166458] ring-2 ring-[#166458]/30 shadow-md'
                    : 'bg-[#fffdf8] border-[#e4ded0] hover:border-[#166458]/60 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${details.tagClass}`}>
                      {details.tierLabel}
                    </span>
                    <span className="text-xs text-[#166458] font-bold flex items-center gap-1">
                      <Bed className="w-3.5 h-3.5 text-[#ba704f]" />
                      {freeBeds} {t('bedsFree', 'beds free')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#173b3b] leading-snug">
                    {fac.name}
                  </h3>
                  <p className="text-xs text-[#55706d] flex items-center gap-1 mt-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#ba704f] shrink-0" />
                    <span>
                      {fac.block} {t('block', 'Block')}, {fac.district}
                    </span>
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#e4ded0] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-[#166458] bg-[#166458]/10 px-2 py-0.5 rounded-md">
                      {t('node', 'Node')}: {fac.id}
                    </span>
                    <span className="text-[11px] text-[#55706d] font-medium hidden sm:inline">
                      {fac.teleconsultStations} {t('teleStations', 'Tele-Stations')}
                    </span>
                  </div>

                  <button
                    type="button"
                    id={`enter-hospital-btn-${fac.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectAndProceed(fac);
                    }}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#c4684e] hover:bg-[#aa523e] text-white shadow-xs'
                        : 'bg-[#166458] hover:bg-[#0e534d] text-white'
                    }`}
                  >
                    <span>{t('enterHospital', 'Enter Hospital')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Facility Bar */}
        <div className="rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-soft border border-[#166458]/30 bg-[#fffdf8]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#ba704f] block">
              {t('selectedHospitalWorkspace', 'Selected Hospital Workspace')}
            </span>
            <h4 className="text-base font-bold text-[#173b3b]">
              {selectedFacility.name}
            </h4>
          </div>

          <button
            type="button"
            id="main-proceed-hospital-btn"
            disabled={isEntering}
            onClick={() => handleSelectAndProceed(selectedFacility)}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#c4684e] hover:bg-[#aa523e] text-white font-bold text-xs rounded-xl shadow-xs transition transform active:scale-98 cursor-pointer disabled:opacity-75"
          >
            <span>
              {isEntering
                ? t('enteringPortal', 'Entering Portal...')
                : `${t('enterHospital', 'Enter')} ${selectedFacility.shortName}`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      {/* Clean Footer with Cloud Storage Note */}
      <footer className="py-4 px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center text-xs text-[#6e817c] font-medium max-w-6xl mx-auto w-full border-t border-[#e4ded0]">
        <span>{t('appName', 'Praan Health Grid')} · {t('appSubtitle', 'Rural Telemedicine')}</span>
        <span className="inline-flex items-center gap-1.5 text-[#166458] font-bold">
          <Cloud className="w-3.5 h-3.5 text-[#166458]" />
          AWS DynamoDB & Firebase Firestore Synchronized
        </span>
      </footer>
    </div>
  );
};

