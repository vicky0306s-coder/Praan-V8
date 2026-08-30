import React, { useState } from 'react';
import {
  Activity,
  Globe,
  Wifi,
  WifiOff,
  LogOut,
  Bell,
  Layers,
  RefreshCw,
  PhoneCall,
  Stethoscope,
  Sparkles,
  Users
} from 'lucide-react';
import { Facility, SupportedLanguage } from '../types';
import { useLanguage, SUPPORTED_LANGUAGES } from '../services/languageService';
import { storageService } from '../services/storageService';
import { awsCloudService } from '../services/awsCloudService';
import { PraanLogo } from './PraanLogo';
import { Cloud } from 'lucide-react';

interface NavbarProps {
  currentFacility: Facility;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  onTriggerSos: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentFacility,
  onLogout,
  activeTab,
  setActiveTab,
  isOffline,
  setIsOffline,
  onTriggerSos
}) => {
  const { language: currentLang, setLanguage, t } = useLanguage();
  const [offlinePendingCount, setOfflinePendingCount] = useState<number>(
    storageService.getOfflineQueue().length
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const handleLanguageChange = (code: SupportedLanguage) => {
    setLanguage(code);
    setShowLangMenu(false);
  };

  const handleSyncOffline = () => {
    setIsSyncing(true);
    setTimeout(() => {
      storageService.clearOfflineQueue();
      setOfflinePendingCount(0);
      setIsSyncing(false);
    }, 900);
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'HWC':
        return 'bg-[#166458]/15 text-[#166458] border-[#166458]/30';
      case 'PHC':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'CHC':
        return 'bg-[#f4bd64]/30 text-[#ba704f] border-[#f4bd64]/60';
      case 'DH':
        return 'bg-[#166458]/20 text-[#166458] border-[#166458]/40';
      case 'APEX':
        return 'bg-[#c4684e]/15 text-[#c4684e] border-[#c4684e]/40';
      default:
        return 'bg-[#f7f4ed] text-[#55706d] border-[#e4ded0]';
    }
  };

  const navItems = [
    { id: 'consultation', label: t('navConsultation', 'Teleconsultation'), icon: Activity },
    { id: 'doctors', label: t('navDoctors', 'Doctor Management'), icon: Stethoscope },
    { id: 'triage', label: t('navTriage', 'Triage CDSS'), icon: Layers },
    { id: 'records', label: t('navRecords', 'Patient Records'), icon: Users },
    { id: 'referrals', label: t('navReferrals', 'Referrals'), icon: PhoneCall },
    { id: 'pharmacy', label: t('navPharmacy', 'Pharmacy & Labs'), icon: Layers },
    { id: 'highrisk', label: t('navHighRisk', 'High Risk Follow-up'), icon: Activity },
    { id: 'analytics', label: t('navAnalytics', 'Public Health'), icon: Layers }
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#f7f4ed]/95 backdrop-blur-xl border-b border-[#e4ded0] shadow-2xs">
      {/* Top tier network status bar */}
      <div className="bg-[#166458] text-[#fffaf0] text-xs px-4 sm:px-8 py-2 flex flex-wrap items-center justify-between border-b border-[#166458]/80">
        <div className="flex items-center space-x-3">
          <span className="flex items-center gap-2 font-semibold text-[#f4bd64]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f4bd64] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f4bd64]"></span>
            </span>
            {t('appName', 'ABDM Unified Health Network')}
          </span>
          <span className="text-white/30">|</span>
          <span className="text-[#f4bd64] hidden sm:inline-flex items-center gap-1 text-[11px] font-medium">
            <Cloud className="w-3 h-3 text-[#f4bd64]" />
            Firebase Firestore & AWS Grid
          </span>
          <span className="text-white/30 hidden md:inline">|</span>
          <span className="text-white/90 hidden md:inline text-[11px]">
            {t('node', 'Node')}: <span className="font-mono font-bold text-[#f4bd64]">{currentFacility.id}</span> · {currentFacility.block} {t('block', 'Block')}
          </span>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Offline simulation toggle */}
          <button
            id="toggle-offline-mode"
            onClick={() => setIsOffline(!isOffline)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition cursor-pointer ${
              isOffline
                ? 'bg-[#c4684e] text-white font-bold animate-pulse shadow-sm'
                : 'bg-white/15 text-white/90 hover:bg-white/25 border border-white/20'
            }`}
            title="Simulate low-connectivity rural offline mode"
          >
            {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5 text-[#f4bd64]" />}
            <span>{isOffline ? t('offlineMode', 'Offline') : `${t('onlineMode', 'Online')} (94ms)`}</span>
          </button>

          {offlinePendingCount > 0 && (
            <button
              onClick={handleSyncOffline}
              disabled={isSyncing || isOffline}
              className="inline-flex items-center gap-1 bg-[#c4684e] hover:bg-[#aa523e] text-white px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer disabled:opacity-50 transition shadow-2xs"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? t('syncing', 'Syncing...') : `${t('syncOffline', 'Sync')} (${offlinePendingCount})`}
            </button>
          )}

          {/* Emergency SOS Trigger */}
          <button
            id="sos-emergency-trigger"
            onClick={onTriggerSos}
            className="inline-flex items-center gap-1 bg-[#c4684e] hover:bg-[#aa523e] text-white px-3.5 py-1 rounded-full font-bold text-[11px] cursor-pointer shadow-xs transition"
          >
            108 SOS
          </button>
        </div>
      </div>

      {/* Main Facility & Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Facility Details */}
          <div className="flex items-center gap-3">
            <PraanLogo className="w-10 h-10 hover:scale-105 transition-transform" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-[#173b3b] text-base leading-tight tracking-tight">
                  {currentFacility.name}
                </h1>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getTierBadge(currentFacility.tier)}`}>
                  {currentFacility.tier}
                </span>
              </div>
              <p className="text-xs text-[#55706d] font-medium mt-0.5">
                {currentFacility.staffName} · <span className="text-[#166458] font-bold">{currentFacility.staffRole}</span>
              </p>
            </div>
          </div>

          {/* Right controls: Language + Switch Hospital */}
          <div className="flex items-center space-x-2.5">
            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                id="language-dropdown-toggle"
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#e4ded0] bg-white text-xs font-semibold text-[#173b3b] hover:bg-[#fffdf8] transition cursor-pointer shadow-2xs"
              >
                <Globe className="w-3.5 h-3.5 text-[#ba704f]" />
                <span>{SUPPORTED_LANGUAGES.find((l) => l.code === currentLang)?.nativeLabel || 'English'}</span>
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-[#fffdf8] rounded-2xl shadow-xl border border-[#e4ded0] py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1 text-[10px] font-bold text-[#ba704f] uppercase tracking-wider">
                    {t('languageSelect', 'Language / भाषा')}
                  </div>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#166458]/10 cursor-pointer ${
                        currentLang === lang.code ? 'font-bold text-[#166458] bg-[#166458]/10' : 'text-[#173b3b]'
                      }`}
                    >
                      <span>{lang.nativeLabel}</span>
                      <span className="text-[10px] text-[#6e817c]">{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Logout / Switch Facility */}
            <button
              id="switch-facility-button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#fffdf8] text-xs font-bold text-[#c4684e] hover:text-white hover:bg-[#c4684e] transition cursor-pointer border border-[#c4684e]/30 shadow-2xs"
              title="Switch to another of the 5 hospital databases"
            >
              <LogOut className="w-3.5 h-3.5 text-[#c4684e]" />
              <span className="hidden sm:inline">{t('switchHospital', 'Switch Hospital')}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1.5 overflow-x-auto pb-2 scrollbar-none border-t border-[#e4ded0] pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-[#166458] text-white shadow-xs'
                    : 'text-[#42645e] hover:text-[#166458] hover:bg-[#166458]/10'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#f4bd64]' : 'text-[#6f827d]'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
