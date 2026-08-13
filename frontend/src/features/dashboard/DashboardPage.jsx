import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineDocumentText,
  HiOutlineLightningBolt,
  HiOutlineMap,
  HiOutlineAcademicCap,
  HiOutlineChartBar,
  HiOutlineTrendingUp,
} from 'react-icons/hi';
import { progressApi } from '../../api/index';

const quickActions = [
  { label: 'Upload Resume', description: 'Parse and analyze your resume', href: '/resume', icon: HiOutlineDocumentText },
  { label: 'Skill Gap Analysis', description: 'Compare skills with job requirements', href: '/skills', icon: HiOutlineLightningBolt },
  { label: 'Generate Roadmap', description: 'Get a personalized learning path', href: '/roadmap', icon: HiOutlineMap },
  { label: 'Mock Interview', description: 'Practice with AI interviewer', href: '/interview', icon: HiOutlineAcademicCap },
];

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    progressApi.getDashboard()
      .then(res => setStats(res.data.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Resume Score', value: stats?.resume_score || '—', icon: HiOutlineDocumentText, color: 'from-brand-500 to-brand-600' },
    { label: 'Skills Tracked', value: stats?.resume_count || '0', icon: HiOutlineLightningBolt, color: 'from-accent-500 to-accent-600' },
    { label: 'Roadmap Progress', value: `${stats?.roadmap_progress || 0}%`, icon: HiOutlineMap, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Interviews Done', value: stats?.interview_count || '0', icon: HiOutlineAcademicCap, color: 'from-amber-500 to-amber-600' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-surface-100">Dashboard</h1>
        <p className="mt-1 text-sm text-surface-200/60">Your career readiness at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-light rounded-2xl p-5 transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-surface-200/50 uppercase tracking-wider">{label}</p>
                <p className="mt-2 text-3xl font-bold text-surface-100">{loading ? '...' : value}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-surface-100 flex items-center gap-2">
          <HiOutlineTrendingUp className="h-5 w-5 text-brand-400" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {quickActions.map(({ label, description, href, icon: Icon }) => (
            <Link
              key={label}
              to={href}
              className="glass-light group flex items-center gap-4 rounded-2xl p-5 transition-all hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-500/5"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 transition-colors group-hover:bg-brand-500/20">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-surface-100">{label}</p>
                <p className="text-xs text-surface-200/50">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Readiness */}
      <div className="glass-light rounded-2xl p-6">
        <h2 className="mb-4 text-lg font-semibold text-surface-100 flex items-center gap-2">
          <HiOutlineChartBar className="h-5 w-5 text-accent-400" />
          Career Readiness
        </h2>
        <div className="flex items-center justify-center py-8 text-surface-200/40">
          {stats && stats.resume_count > 0 ? (
            <div className="text-center">
              <p className="text-4xl font-bold text-brand-400">{stats.resume_score || 0}/100</p>
              <p className="mt-2 text-sm text-surface-200/60">ATS Resume Score</p>
              <p className="mt-1 text-xs text-surface-200/40">{stats.completed_milestones}/{stats.total_milestones} milestones completed</p>
            </div>
          ) : (
            <p className="text-sm">Upload your resume and set a target job to see your readiness score</p>
          )}
        </div>
      </div>
    </div>
  );
}
