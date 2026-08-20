import { useState, useEffect } from 'react';
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
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight mb-2">
          Learning Roadmap
        </h1>
        <p className="text-sm text-on-surface-variant">
          Define your target role and track your upskilling progress.
        </p>
      </div>

      {/* Configuration Section */}
      <section className="bg-surface rounded-lg border border-outline-variant p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider" htmlFor="target-role">
              Target Role
            </label>
            <input
              id="target-role"
              type="text"
              value={form.target_role}
              onChange={(e) => setForm(f => ({ ...f, target_role: e.target.value }))}
              placeholder="e.g. Senior Frontend Engineer"
              className="w-full bg-surface-container-low border border-outline-variant rounded-md px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider" htmlFor="current-skills">
              Current Skills
            </label>
            <input
              id="current-skills"
              type="text"
              value={form.current_skills}
              onChange={(e) => setForm(f => ({ ...f, current_skills: e.target.value }))}
              placeholder="e.g. HTML, CSS, basic JS"
              className="w-full bg-surface-container-low border border-outline-variant rounded-md px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-primary text-on-primary font-semibold text-sm py-2.5 px-6 rounded-md hover:bg-surface-tint transition-colors disabled:opacity-50"
          >
            {loading ? 'Generating with AI...' : 'Generate Roadmap'}
          </button>
        </div>
      </section>

      {/* Timeline Section */}
      {displayRoadmap && (
        <section>
          <h3 className="text-xl font-semibold text-on-surface mb-6">
            {displayRoadmap.title || 'Your Path'}
          </h3>
          {displayRoadmap.description && (
            <p className="text-sm text-on-surface-variant mb-6">{displayRoadmap.description}</p>
          )}

          <div className="relative pl-6 md:pl-8 border-l border-outline-variant space-y-8 ml-4">
            {(displayRoadmap.milestones || []).map((m, i) => (
              <div key={m.id || i} className="relative group">
                {/* Timeline Marker */}
                <div className={`absolute -left-[35px] md:-left-[41px] top-1 w-6 h-6 rounded-full border-2 border-surface flex items-center justify-center ${
                  m.is_completed
                    ? 'bg-primary'
                    : i === 0 ? 'bg-primary-container' : 'bg-surface-container-high'
                }`}>
                  {m.is_completed ? (
                    <span className="material-symbols-outlined text-on-primary text-sm">check</span>
                  ) : (
                    <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-primary' : 'bg-outline-variant'}`} />
                  )}
                </div>

                {/* Card */}
                <div className={`bg-surface rounded-lg border border-outline-variant p-4 hover:bg-surface-container-low transition-colors duration-200 ${m.is_completed ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-4">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${
                        i === 0 && !m.is_completed
                          ? 'bg-surface-container-high text-primary'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}>
                        Week {m.week || i + 1}
                      </span>
                      <h4 className={`text-xl font-semibold mb-1 ${m.is_completed ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}>
                        {m.title}
                      </h4>
                      <p className="text-sm text-on-surface-variant">{m.description}</p>
                      {m.tasks && (
                        <ul className="mt-3 space-y-1">
                          {m.tasks.map((t, ti) => (
                            <li key={ti} className="flex items-center gap-2 text-xs text-on-surface-variant">
                              <span className="h-1 w-1 rounded-full bg-primary" />{t}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {m.id && (
                      <div className="pt-2">
                        <input
                          type="checkbox"
                          checked={m.is_completed || false}
                          onChange={() => toggleMilestone(displayRoadmap.id, m.id, m.is_completed)}
                          className="w-5 h-5 border-outline-variant rounded text-primary focus:ring-primary bg-surface-container-lowest cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Future placeholder */}
            <div className="relative">
              <div className="absolute -left-[35px] md:-left-[41px] top-1 w-6 h-6 rounded-full bg-surface-container-high border-2 border-surface flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-outline-variant" />
              </div>
              <div className="bg-transparent p-4 border border-dashed border-outline-variant rounded-lg flex items-center justify-center h-20">
                <span className="text-sm text-outline">More milestones will appear here...</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Empty state */}
      {!displayRoadmap && !loading && (
        <div className="border border-outline-variant rounded-lg p-10 text-center bg-surface">
          <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">map</span>
          <p className="text-sm text-on-surface-variant">No roadmaps yet. Generate your first learning roadmap above!</p>
        </div>
      )}
    </div>
  );
}
