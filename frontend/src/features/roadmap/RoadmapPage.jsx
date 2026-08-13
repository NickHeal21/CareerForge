import { useState, useEffect } from 'react';
import { HiOutlineMap, HiOutlineCheck } from 'react-icons/hi';
import { roadmapApi } from '../../api/index';
import toast from 'react-hot-toast';

export default function RoadmapPage() {
  const [form, setForm] = useState({ target_role: '', current_skills: '', skill_gaps: '', weeks: 8 });
  const [loading, setLoading] = useState(false);
  const [roadmaps, setRoadmaps] = useState([]);
  const [generated, setGenerated] = useState(null);

  useEffect(() => {
    roadmapApi.list()
      .then(res => setRoadmaps(res.data.data || []))
      .catch(() => {});
  }, []);

  const handleGenerate = async () => {
    if (!form.target_role.trim()) {
      toast.error('Please enter a target role');
      return;
    }
    setLoading(true);
    try {
      const res = await roadmapApi.generate(form);
      if (res.data.success) {
        setGenerated(res.data.data);
        toast.success('Roadmap generated!');
        const listRes = await roadmapApi.list();
        setRoadmaps(listRes.data.data || []);
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleMilestone = async (roadmapId, milestoneId, current) => {
    try {
      await roadmapApi.updateMilestone(roadmapId, milestoneId, { is_completed: !current });
      const listRes = await roadmapApi.list();
      setRoadmaps(listRes.data.data || []);
    } catch (err) {
      toast.error('Failed to update milestone');
    }
  };

  const displayRoadmap = generated || (roadmaps.length > 0 ? roadmaps[0] : null);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Learning Roadmap</h1>
          <p className="mt-1 text-sm text-surface-200/60">AI-generated personalized learning path</p>
        </div>
      </div>

      {/* Generate Form */}
      <div className="glass-light rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-surface-100 mb-4">Generate New Roadmap</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-200/80">Target Role *</label>
            <input
              value={form.target_role}
              onChange={(e) => setForm(f => ({...f, target_role: e.target.value}))}
              placeholder="e.g., Full Stack Developer"
              className="w-full rounded-xl border border-surface-700/50 bg-surface-800/50 py-3 px-4 text-sm text-surface-100 placeholder-surface-200/30 outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-200/80">Weeks</label>
            <input
              type="number"
              value={form.weeks}
              onChange={(e) => setForm(f => ({...f, weeks: parseInt(e.target.value) || 8}))}
              min={2} max={24}
              className="w-full rounded-xl border border-surface-700/50 bg-surface-800/50 py-3 px-4 text-sm text-surface-100 outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-surface-200/80">Current Skills</label>
            <input
              value={form.current_skills}
              onChange={(e) => setForm(f => ({...f, current_skills: e.target.value}))}
              placeholder="e.g., Python, HTML, CSS, basic JavaScript"
              className="w-full rounded-xl border border-surface-700/50 bg-surface-800/50 py-3 px-4 text-sm text-surface-100 placeholder-surface-200/30 outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-surface-200/80">Skill Gaps</label>
            <input
              value={form.skill_gaps}
              onChange={(e) => setForm(f => ({...f, skill_gaps: e.target.value}))}
              placeholder="e.g., React, Node.js, System Design"
              className="w-full rounded-xl border border-surface-700/50 bg-surface-800/50 py-3 px-4 text-sm text-surface-100 placeholder-surface-200/30 outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="mt-4 w-full rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <HiOutlineMap className="h-4 w-4" />
          {loading ? 'Generating with AI...' : 'Generate Roadmap'}
        </button>
      </div>

      {/* Roadmap Display */}
      {displayRoadmap && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-surface-100">{displayRoadmap.title}</h2>
          {displayRoadmap.description && (
            <p className="text-sm text-surface-200/60">{displayRoadmap.description}</p>
          )}

          {/* Milestones */}
          {(displayRoadmap.milestones || []).map((m, i) => (
            <div key={m.id || i} className="glass-light rounded-2xl p-5">
              <div className="flex items-start gap-3">
                {m.id ? (
                  <button
                    onClick={() => toggleMilestone(displayRoadmap.id, m.id, m.is_completed)}
                    className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-all flex-shrink-0 ${m.is_completed ? 'border-emerald-500 bg-emerald-500' : 'border-surface-600 hover:border-brand-500'}`}
                  >
                    {m.is_completed && <HiOutlineCheck className="h-4 w-4 text-white" />}
                  </button>
                ) : (
                  <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-lg bg-brand-500/20 text-brand-400 text-xs font-bold flex-shrink-0">
                    {m.week || i + 1}
                  </div>
                )}
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${m.is_completed ? 'text-surface-200/40 line-through' : 'text-surface-100'}`}>
                    {m.title}
                  </p>
                  <p className="mt-1 text-xs text-surface-200/50">{m.description}</p>
                  {m.tasks && (
                    <ul className="mt-2 space-y-1">
                      {m.tasks.map((t, ti) => (
                        <li key={ti} className="flex items-center gap-2 text-xs text-surface-200/60">
                          <span className="h-1 w-1 rounded-full bg-brand-400" />{t}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!displayRoadmap && !loading && (
        <div className="glass-light rounded-2xl p-10 text-center">
          <HiOutlineMap className="mx-auto h-12 w-12 text-surface-200/30" />
          <p className="mt-4 text-sm text-surface-200/40">No roadmaps yet. Generate your first learning roadmap above!</p>
        </div>
      )}
    </div>
  );
}
