import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle2,
  Package,
  Plus,
  RefreshCw,
  Sparkles,
  Building2,
  Activity
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Facility, MedicineStockItem, LabOrder } from '../types';
import { FACILITIES } from '../data/initialData';
import { storageService } from '../services/storageService';
import { useLanguage } from '../services/languageService';

interface PharmacyLabGridViewProps {
  currentFacility: Facility;
}

export const PharmacyLabGridView: React.FC<PharmacyLabGridViewProps> = ({
  currentFacility
}) => {
  const { t } = useLanguage();
  const [medicineGrid, setMedicineGrid] = useState<MedicineStockItem[]>([]);
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'pharmacy' | 'labs'>('pharmacy');

  // Requisition Modal
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [selectedMed, setSelectedMed] = useState<MedicineStockItem | null>(null);
  const [sourceFacId, setSourceFacId] = useState<string>('DH-04');
  const [targetFacId, setTargetFacId] = useState<string>(currentFacility.id);
  const [transferQty, setTransferQty] = useState<number>(20);
  const [transferSuccessMsg, setTransferSuccessMsg] = useState<string>('');

  const loadData = () => {
    const grid = storageService.getFederatedMedicineGrid();
    setMedicineGrid(grid);

    const db = storageService.getFacilityDb(currentFacility.id);
    setLabOrders(db.labOrders || []);
  };

  useEffect(() => {
    loadData();
    const unsub = storageService.subscribe(loadData);
    return () => unsub();
  }, [currentFacility.id]);

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMed || transferQty <= 0) return;

    const success = storageService.transferMedicineStock(
      sourceFacId,
      targetFacId,
      selectedMed.medicineName,
      transferQty
    );

    if (success) {
      confetti({ particleCount: 50, spread: 60 });
      setTransferSuccessMsg(
        `Successfully requisitioned & transferred ${transferQty} units of ${selectedMed.medicineName} from ${sourceFacId} to ${targetFacId}!`
      );
      setShowTransferModal(false);
      setTimeout(() => setTransferSuccessMsg(''), 4000);
    }
  };

  const filteredMeds = medicineGrid.filter(
    (m) =>
      m.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-extrabold text-slate-900">
              {t('navPharmacy')}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-semibold border border-teal-200">
              5-Hospital Shared Supply Chain
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time multi-tier stock visibility across Sub-Centres, PHCs, CHCs, DH, and Apex Medical College with instant inter-facility stock transfers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('pharmacy')}
              className={`px-3 py-1.5 text-xs rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'pharmacy' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Essential Medicines Grid
            </button>
            <button
              onClick={() => setActiveTab('labs')}
              className={`px-3 py-1.5 text-xs rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'labs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Diagnostic Lab Orders ({labOrders.length})
            </button>
          </div>
        </div>
      </div>

      {transferSuccessMsg && (
        <div className="p-3.5 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {transferSuccessMsg}
        </div>
      )}

      {activeTab === 'pharmacy' ? (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across all 5 hospitals by Medicine Name, Generic Salt, or Category..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-900 bg-slate-50/50"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Showing {filteredMeds.length} Essential Drug Items
            </span>
          </div>

          {/* 5-Hospital Federated Stock Matrix Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-slate-200 text-[11px] font-bold">
                    <th className="py-3 px-4">Medicine & Generic Details</th>
                    <th className="py-3 px-3 text-center bg-emerald-950/60 text-emerald-200">
                      Tier 1: Shirur HWC
                    </th>
                    <th className="py-3 px-3 text-center bg-blue-950/60 text-blue-200">
                      Tier 2: Khed PHC
                    </th>
                    <th className="py-3 px-3 text-center bg-amber-950/60 text-amber-200">
                      Tier 3: Manchar CHC
                    </th>
                    <th className="py-3 px-3 text-center bg-purple-950/60 text-purple-200">
                      Tier 4: Pune DH
                    </th>
                    <th className="py-3 px-3 text-center bg-rose-950/60 text-rose-200">
                      Tier 5: Sassoon APEX
                    </th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMeds.map((med) => (
                    <tr key={med.id} className="hover:bg-slate-50/80 transition">
                      {/* Name + Generic */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {med.medicineName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {med.genericName}
                        </div>
                        <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                          {med.category}
                        </span>
                      </td>

                      {/* Stock in HWC-01 */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg font-mono font-bold text-xs ${
                            (med.stockByFacility['HWC-01'] || 0) < 15
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {med.stockByFacility['HWC-01'] || 0} {med.unit}
                        </span>
                      </td>

                      {/* Stock in PHC-02 */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg font-mono font-bold text-xs ${
                            (med.stockByFacility['PHC-02'] || 0) < 25
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-50 text-blue-800'
                          }`}
                        >
                          {med.stockByFacility['PHC-02'] || 0} {med.unit}
                        </span>
                      </td>

                      {/* Stock in CHC-03 */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg font-mono font-bold text-xs ${
                            (med.stockByFacility['CHC-03'] || 0) < 40
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {med.stockByFacility['CHC-03'] || 0} {med.unit}
                        </span>
                      </td>

                      {/* Stock in DH-04 */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-lg font-mono font-bold text-xs bg-purple-50 text-purple-800">
                          {med.stockByFacility['DH-04'] || 0} {med.unit}
                        </span>
                      </td>

                      {/* Stock in APEX-05 */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-lg font-mono font-bold text-xs bg-rose-50 text-rose-800">
                          {med.stockByFacility['APEX-05'] || 0} {med.unit}
                        </span>
                      </td>

                      {/* Requisition Button */}
                      <td className="py-3 px-4 text-center">
                        <button
                          id={`requisition-btn-${med.id}`}
                          onClick={() => {
                            setSelectedMed(med);
                            setShowTransferModal(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-[11px] font-bold transition shadow-xs cursor-pointer"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          <span>Requisition</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Lab Orders View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Point-of-Care & Tele-Diagnostic Orders
              </h3>
              <p className="text-xs text-slate-500">
                Rapid tests, Biochemistry, Tele-ECG & Sputum CBNAAT at {currentFacility.name}
              </p>
            </div>
            <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
              {labOrders.length} Active Tests
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {labOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <strong className="font-bold text-slate-900 text-sm block">
                      {order.testName}
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Patient: {order.patientName}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                      order.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700">
                  <span className="text-[10px] text-slate-400 block font-semibold">Test Result / Interpretation</span>
                  <strong className="text-slate-900">{order.resultValue}</strong>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <span>Ordered by: {order.orderedByDoctor}</span>
                  <span>{order.orderDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inter-Hospital Stock Transfer Modal */}
      {showTransferModal && selectedMed && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Inter-Hospital Drug Requisition
                  </h3>
                  <p className="text-xs text-slate-500">
                    Federated cross-database stock reallocation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-500 text-[10px] block">Selected Medicine</span>
                <strong className="text-slate-900 text-sm">{selectedMed.medicineName}</strong>
                <span className="text-slate-500 block text-[11px]">{selectedMed.genericName}</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Source Depot / Hospital (Providing Stock) *
                </label>
                <select
                  value={sourceFacId}
                  onChange={(e) => setSourceFacId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500"
                >
                  {FACILITIES.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} (Available: {selectedMed.stockByFacility[f.id] || 0} {selectedMed.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Destination Health Facility (Receiving Stock) *
                </label>
                <select
                  value={targetFacId}
                  onChange={(e) => setTargetFacId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500"
                >
                  {FACILITIES.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.tierLabel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Transfer Quantity ({selectedMed.unit}) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedMed.stockByFacility[sourceFacId] || 100}
                  value={transferQty}
                  onChange={(e) => setTransferQty(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold cursor-pointer shadow-xs"
                >
                  Confirm & Transfer Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
