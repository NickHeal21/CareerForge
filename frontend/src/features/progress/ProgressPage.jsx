import { useState, useEffect } from 'react';
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

  const metricCards = stats ? [
    {
      label: 'Resume Score',
      value: `${stats.resume_score || 0}%`,
      subtitle: stats.resume_score >= 80 ? 'Top 15%' : 'Keep improving',
      progress: stats.resume_score || 0,
      icon: 'description',
    },
    {
      label: 'Skills Acquired',
      value: `${stats.completed_milestones || 0}/${stats.total_milestones || 20}`,
      subtitle: 'Target',
      progress: stats.total_milestones ? Math.round((stats.completed_milestones / stats.total_milestones) * 100) : 0,
      icon: 'psychology',
    },
    {
      label: 'Roadmap Completion',
      value: `${stats.roadmap_progress || 0}%`,
      subtitle: 'On Track',
      progress: stats.roadmap_progress || 0,
      icon: 'map',
    },
  ] : [];

  // Build activity rows from stats
  const activityRows = [];
  if (stats) {
    if (stats.resume_count > 0) {
      activityRows.push({
        date: 'Recent',
        type: 'Resume',
        typeIcon: 'description',
        typeBg: 'bg-surface-container-high text-on-surface-variant',
        activity: `Updated resume section`,
        score: stats.resume_score ? `${stats.resume_score}%` : '—',
      });
    }
    if (stats.interview_count > 0) {
      activityRows.push({
        date: 'Recent',
        type: 'Interview',
        typeIcon: 'forum',
        typeBg: 'bg-primary-container text-on-primary-container',
        activity: `Mock interview completed`,
        score: 'Pass',
      });
    }
    if (stats.roadmap_count > 0) {
      activityRows.push({
        date: 'Recent',
        type: 'Roadmap',
        typeIcon: 'map',
        typeBg: 'bg-secondary-container text-on-secondary-container',
        activity: `Milestone completed`,
        score: `${stats.roadmap_progress || 0}%`,
      });
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-[30px] md:leading-9 md:tracking-tight font-bold text-on-surface mb-1">
          Progress Tracker
        </h1>
        <p className="text-base leading-6 text-on-surface-variant">
          Monitor your career advancement metrics.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-on-surface-variant">Loading...</div>
      ) : (
        <>
          {/* Metric Cards — Stacked vertically on mobile, 3-col on desktop */}
          <section className="space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-4 mb-8">
            {metricCards.map(({ label, value, subtitle, progress, icon }) => (
              <div
                key={label}
                className="border border-outline-variant rounded-lg p-6 bg-surface hover:bg-surface-container-low transition-colors duration-200"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-on-surface">{label}</h2>
                  <span className="material-symbols-outlined text-outline">{icon}</span>
                </div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-4xl font-bold text-primary">{value}</span>
                  <span className="text-xs font-medium text-on-surface-variant">{subtitle}</span>
                </div>
                <div className="w-full bg-surface-variant h-1 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ))}
          </section>

          {/* Recent Activity */}
          <section className="border border-outline-variant rounded-lg bg-surface overflow-hidden">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <h2 className="text-xl font-semibold text-on-surface">Recent Activity</h2>
              <button className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                Filter <span className="material-symbols-outlined text-sm">filter_list</span>
              </button>
            </div>

            {activityRows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface-container-low">
                      <th className="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Activity</th>
                      <th className="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {activityRows.map((row, i) => (
                      <tr key={i} className="hover:bg-surface-container-low transition-colors duration-150">
                        <td className="px-6 py-4 text-sm text-on-surface whitespace-nowrap">{row.date}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${row.typeBg}`}>
                            <span className="material-symbols-outlined text-sm mr-1">{row.typeIcon}</span>
                            {row.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-on-surface">{row.activity}</td>
                        <td className="px-6 py-4 text-sm text-primary font-bold text-right">{row.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-3xl text-outline-variant mb-2 block">history</span>
                No activity yet. Start using CareerForge features to track your progress!
              </div>
            )}

            {activityRows.length > 0 && (
              <div className="p-4 text-center border-t border-outline-variant">
                <button className="text-sm font-semibold text-primary hover:underline">View All History</button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
