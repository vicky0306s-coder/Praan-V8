import React, { useState, useEffect } from 'react';
import { Facility, Patient, Vitals } from './types';
import { FACILITIES } from './data/initialData';
import { storageService } from './services/storageService';
import { Navbar } from './components/Navbar';
import { LoginPortal } from './components/LoginPortal';
import { TeleconsultationView } from './components/TeleconsultationView';
import { TriageCDSSView } from './components/TriageCDSSView';
import { PatientRecordsView } from './components/PatientRecordsView';
import { ReferralTrackerView } from './components/ReferralTrackerView';
import { PharmacyLabGridView } from './components/PharmacyLabGridView';
import { HighRiskFollowUpView } from './components/HighRiskFollowUpView';
import { PublicHealthAnalyticsView } from './components/PublicHealthAnalyticsView';
import { DoctorManagementView } from './components/DoctorManagementView';
import { EmergencySosModal } from './components/EmergencySosModal';
import { CreateReferralModal } from './components/CreateReferralModal';

export const App: React.FC = () => {
  const [currentFacility, setCurrentFacility] = useState<Facility | null>(() => {
    return storageService.getActiveFacility();
  });
  const [activeTab, setActiveTab] = useState<string>('consultation');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [showSosModal, setShowSosModal] = useState<boolean>(false);
  const [showReferralModal, setShowReferralModal] = useState<boolean>(false);
  const [referralPrefillPatient, setReferralPrefillPatient] = useState<Patient | null>(null);
  const [referralPrefillVitals, setReferralPrefillVitals] = useState<Vitals | null>(null);

  const handleLoginSuccess = (facility: Facility) => {
    storageService.setActiveFacility(facility);
    setCurrentFacility(facility);
    setActiveTab('consultation');
  };

  const handleLogout = () => {
    storageService.setActiveFacility(null);
    setCurrentFacility(null);
  };

  const handleOpenReferralModal = (patient?: Patient, vitals?: Vitals) => {
    if (patient) {
      setReferralPrefillPatient(patient);
    }
    if (vitals) {
      setReferralPrefillVitals(vitals);
    }
    setShowReferralModal(true);
  };

  const handleCloseReferralModal = () => {
    setShowReferralModal(false);
    setReferralPrefillPatient(null);
    setReferralPrefillVitals(null);
  };

  // If not logged into one of the 5 hospital databases, show the Login Portal
  if (!currentFacility) {
    return <LoginPortal onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-[#173b3b] bg-[#f7f4ed] antialiased selection:bg-[#c4684e] selection:text-white relative">
      {/* Aesthetic Warm Ambient Background Glows */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-[#166458]/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/3 -right-40 w-[30rem] h-[30rem] bg-[#f4bd64]/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed -bottom-40 left-1/3 w-96 h-96 bg-[#c4684e]/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Navbar with Multi-Tier Status, Switch Facility & Multilingual Controls */}
      <Navbar
        currentFacility={currentFacility}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOffline={isOffline}
        setIsOffline={setIsOffline}
        onTriggerSos={() => setShowSosModal(true)}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'consultation' && (
          <TeleconsultationView
            currentFacility={currentFacility}
            isOffline={isOffline}
            onOpenReferralModal={handleOpenReferralModal}
            onTriggerSos={() => setShowSosModal(true)}
          />
        )}

        {activeTab === 'doctors' && (
          <DoctorManagementView
            currentFacility={currentFacility}
            onInitiateTeleconsult={(doctor) => {
              setActiveTab('consultation');
            }}
          />
        )}

        {activeTab === 'triage' && (
          <TriageCDSSView
            currentFacility={currentFacility}
            onNavigateToConsult={() => setActiveTab('consultation')}
            onOpenReferralModal={handleOpenReferralModal}
          />
        )}

        {activeTab === 'records' && (
          <PatientRecordsView
            currentFacility={currentFacility}
            onSelectPatientForConsult={(p) => {
              setActiveTab('consultation');
            }}
          />
        )}

        {activeTab === 'referrals' && (
          <ReferralTrackerView
            currentFacility={currentFacility}
            onOpenNewReferralModal={() => handleOpenReferralModal()}
          />
        )}

        {activeTab === 'pharmacy' && (
          <PharmacyLabGridView currentFacility={currentFacility} />
        )}

        {activeTab === 'highrisk' && (
          <HighRiskFollowUpView currentFacility={currentFacility} />
        )}

        {activeTab === 'analytics' && (
          <PublicHealthAnalyticsView currentFacility={currentFacility} />
        )}
      </main>

      {/* Emergency 108 SOS Dispatch Modal */}
      <EmergencySosModal
        currentFacility={currentFacility}
        isOpen={showSosModal}
        onClose={() => setShowSosModal(false)}
      />

      {/* Inter-Hospital Referral Modal */}
      <CreateReferralModal
        currentFacility={currentFacility}
        isOpen={showReferralModal}
        onClose={handleCloseReferralModal}
        prefillPatient={referralPrefillPatient}
        prefillVitals={referralPrefillVitals}
      />
    </div>
  );
};

export default App;
