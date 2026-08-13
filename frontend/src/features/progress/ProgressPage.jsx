import { useState, useEffect } from 'react';
import { HiOutlineChartBar, HiOutlineTrendingUp } from 'react-icons/hi';
import { progressApi } from '../../api/index';

export default function ProgressPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    progressApi.getDashboard()
      .then(res => setStats(res.data.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const items = stats ? [
    { label: 'Resume Score', value: stats.resume_score || 0, max: 100, color: 'bg-brand-500' },
    { label: 'Resumes Uploaded', value: stats.resume_count, max: null, color: 'bg-accent-500' },
    { label: 'Interviews Done', value: stats.interview_count, max: null, color: 'bg-amber-500' },
    { label: 'Roadmaps Created', value: stats.roadmap_count, max: null, color: 'bg-emerald-500' },
    { label: 'Milestones Completed', value: stats.completed_milestones, max: stats.total_milestones || 1, color: 'bg-brand-500' },
  ] : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-surface-100">Progress Tracker</h1>
        <p className="mt-1 text-sm text-surface-200/60">Track your career preparation journey</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-surface-200/40">Loading...</div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="glass-light rounded-2xl p-6 text-center">
              <HiOutlineChartBar className="mx-auto h-8 w-8 text-brand-400" />
              <p className="mt-3 text-3xl font-bold text-surface-100">{stats?.resume_score || 0}</p>
              <p className="text-xs text-surface-200/50 mt-1">ATS Score</p>
            </div>
            <div className="glass-light rounded-2xl p-6 text-center">
              <HiOutlineTrendingUp className="mx-auto h-8 w-8 text-emerald-400" />
              <p className="mt-3 text-3xl font-bold text-surface-100">{stats?.roadmap_progress || 0}%</p>
              <p className="text-xs text-surface-200/50 mt-1">Roadmap Progress</p>
            </div>
            <div className="glass-light rounded-2xl p-6 text-center">
              <HiOutlineChartBar className="mx-auto h-8 w-8 text-accent-400" />
              <p className="mt-3 text-3xl font-bold text-surface-100">{stats?.interview_count || 0}</p>
              <p className="text-xs text-surface-200/50 mt-1">Mock Interviews</p>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="glass-light rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-semibold text-surface-100">Activity Summary</h2>
            {items.map(({ label, value, max, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-surface-200/70">{label}</span>
                  <span className="text-sm font-medium text-surface-100">
                    {max ? `${value}/${max}` : value}
                  </span>
                </div>
                {max && (
                  <div className="h-2.5 rounded-full bg-surface-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${color} transition-all`}
                      style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
