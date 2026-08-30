import React from 'react';
import {
  Activity,
  TrendingUp,
  Users,
  ShieldCheck,
  AlertTriangle,
  Building2,
  Clock,
  CheckCircle2,
  BarChart3,
  MapPin
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Facility } from '../types';
import { FACILITIES } from '../data/initialData';
import { useLanguage } from '../services/languageService';

interface PublicHealthAnalyticsViewProps {
  currentFacility: Facility;
}

export const PublicHealthAnalyticsView: React.FC<PublicHealthAnalyticsViewProps> = ({
  currentFacility
}) => {
  const { t } = useLanguage();

  const teleconsultTrend = [
    { month: 'Oct', teleconsults: 240, physicalVisitsSaved: 220 },
    { month: 'Nov', teleconsults: 380, physicalVisitsSaved: 350 },
    { month: 'Dec', teleconsults: 510, physicalVisitsSaved: 490 },
    { month: 'Jan', teleconsults: 690, physicalVisitsSaved: 640 },
    { month: 'Feb', teleconsults: 920, physicalVisitsSaved: 880 }
  ];

  const diseaseDistribution = [
    { name: 'Maternal ANC & Anemia', value: 34, color: '#e11d48' },
    { name: 'NCDs (HTN/Diabetes)', value: 28, color: '#0284c7' },
    { name: 'Pediatric SAM & Fever', value: 20, color: '#d97706' },
    { name: 'Acute Cardiac / Trauma', value: 12, color: '#9333ea' },
    { name: 'Infectious / Others', value: 6, color: '#10b981' }
  ];

  const bedOccupancyData = FACILITIES.map((f) => ({
    name: f.shortName,
    occupied: f.occupiedBeds,
    available: f.totalBeds - f.occupiedBeds,
    tier: f.tier
  }));

  const diseaseOutbreakClusters = [
    { block: 'Khed Block', disease: 'Acute Febrile Illness / Dengue Cluster', cases: 28, risk: 'High', status: 'Under Surveillance' },
    { block: 'Ambegaon Block', disease: 'Maternal Severe Anemia (Hb < 7)', cases: 14, risk: 'Medium', status: 'Iron Sucrose Camps Active' },
    { block: 'Shirur Block', disease: 'Pediatric Viral Diarrheal Cluster', cases: 19, risk: 'Medium', status: 'ORS/Zinc Distributed' },
    { block: 'Junnar Block', disease: 'Hypertensive Urgency Screenings', cases: 31, risk: 'Low', status: 'Routine NCD Tele-OPD' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-extrabold text-slate-900">
              {t('navAnalytics')}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-semibold border border-teal-200">
              District Nodal Command
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time public health metrics, disease outbreak early warning alerts, and inter-facility capacity telemetry.
          </p>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Avg Travel Time Saved</span>
            <div className="p-1.5 bg-teal-50 text-teal-700 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">3.5 Hours</div>
          <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            From 4 hrs travel to 8 min Tele-OPD
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Referral Completion Rate</span>
            <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">91.4%</div>
          <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +49% vs paper-based baseline
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Maternal High-Risk Coverage</span>
            <div className="p-1.5 bg-rose-50 text-rose-700 rounded-lg">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">96.8%</div>
          <p className="text-[11px] text-emerald-700 font-semibold">
            100% Institutional Delivery Follow-up
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Essential Drug Availability</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">99.2%</div>
          <p className="text-[11px] text-emerald-700 font-semibold">
            Zero ASVS & Oxytocin stockouts
          </p>
        </div>
      </div>

      {/* Visual Charts Grid: Teleconsult Trend (8 Cols) + Disease Breakdown (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Teleconsultation Growth */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Monthly Rural Teleconsultations & Travel Saved
              </h3>
              <p className="text-xs text-slate-500">Continuous adoption across 5 nodes</p>
            </div>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
              +280% Growth
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={teleconsultTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                <Area
                  type="monotone"
                  dataKey="teleconsults"
                  stroke="#0d9488"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTc)"
                  name="Teleconsultations"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Disease Morbidity Distribution */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Syndromic Morbidity Caseload
              </h3>
              <p className="text-xs text-slate-500">Distribution of presenting conditions</p>
            </div>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={diseaseDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {diseaseDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            {diseaseDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 truncate">{item.name}</span>
                <span className="font-bold text-slate-900 ml-auto">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Multi-Tier Facility Bed Matrix & Disease Outbreak Surveillance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Bed Capacity across the 5 Facilities */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-600" />
            Multi-Tier Bed Capacity Telemetry (5 Facilities)
          </h3>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bedOccupancyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="occupied" name="Occupied Beds" fill="#e11d48" stackId="a" />
                <Bar dataKey="available" name="Available Beds" fill="#10b981" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Disease Outbreak Surveillance Heatmap */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Epidemic & Disease Outbreak Surveillance
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md">
              IDSP Connected
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {diseaseOutbreakClusters.map((cluster, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{cluster.disease}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                        cluster.risk === 'High'
                          ? 'bg-rose-100 text-rose-800'
                          : cluster.risk === 'Medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {cluster.risk} Risk
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {cluster.block} • {cluster.cases} Verified Active Cases
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {cluster.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
