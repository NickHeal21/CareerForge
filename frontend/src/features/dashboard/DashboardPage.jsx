import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { progressApi } from '../../api/index';

const quickActions = [
  { label: 'Analyze New Resume', href: '/resume', icon: 'upload_file', primary: true },
  { label: 'Start Mock Interview', href: '/interview', icon: 'mic', primary: false },
  { label: 'Ask AI Mentor', href: '/mentor', icon: 'smart_toy', primary: false },
];

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    progressApi.getDashboard()
      .then(res => setStats(res.data.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Resumes Uploaded', value: stats?.resume_count || '0', icon: 'description' },
    { label: 'Skills Analyzed', value: stats?.skills_count || stats?.resume_count || '0', icon: 'psychology' },
    { label: 'Interviews Done', value: stats?.interview_count || '0', icon: 'forum' },
    {
      label: 'Roadmap Progress',
      value: `${stats?.roadmap_progress || 0}%`,
      icon: 'trending_up',
      progress: stats?.roadmap_progress || 0,
    },
  ];

  return (
    <div>
      {/* Greeting */}
      <section className="mb-8 md:mb-16">
        <h1 className="text-2xl md:text-[30px] md:leading-9 md:tracking-tight font-bold text-on-surface mb-2">
          Hello, {user?.full_name?.split(' ')[0] || 'there'}
        </h1>
        <p className="text-base leading-6 text-on-surface-variant max-w-2xl">
          Here is a summary of your career progression and recent activities.
        </p>
      </section>

      {/* Stats Bento Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-16">
        {statCards.map(({ label, value, icon, progress }) => (
          <div
            key={label}
            className="bg-surface border border-outline-variant rounded-lg p-6 hover:bg-surface-container-low transition-colors duration-200 flex flex-col"
          >
            <div className="flex items-center justify-between mb-4 text-on-surface-variant">
              <span className="material-symbols-outlined filled text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                {icon}
              </span>
            </div>
            <div className="text-2xl font-bold text-on-surface mb-1">
              {loading ? '...' : value}
            </div>
            <div className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
              {label}
            </div>
            {progress !== undefined && (
              <div className="mt-auto pt-4 w-full h-1 bg-surface-variant rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Quick Actions */}
      <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6">
        <h2 className="text-xl font-semibold text-on-surface mb-6 tracking-tight">
          Quick Actions
        </h2>
        <div className="flex flex-col md:flex-row gap-4">
          {quickActions.map(({ label, href, icon, primary }) => (
            <Link
              key={label}
              to={href}
              className={`flex items-center justify-center gap-2 font-semibold text-sm py-3 px-6 rounded-lg transition-colors duration-200 w-full md:w-auto ${
                primary
                  ? 'bg-primary text-on-primary hover:bg-surface-tint'
                  : 'bg-transparent border border-outline text-on-surface hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{icon}</span>
              {label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
