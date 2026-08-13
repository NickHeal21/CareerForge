import { useState } from 'react';
import { HiOutlineLightningBolt } from 'react-icons/hi';
import { skillsApi } from '../../api/index';
import toast from 'react-hot-toast';

export default function SkillGapPage() {
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleAnalyze = async () => {
    if (!jd.trim()) {
      toast.error('Please paste a job description');
      return;
    }
    setLoading(true);
    try {
      const res = await skillsApi.analyzeGap({ job_description: jd });
      if (res.data.success) {
        setResult(res.data.data);
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed. Make sure you have uploaded a resume first.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-surface-100">Skill Gap Analysis</h1>
        <p className="mt-1 text-sm text-surface-200/60">Compare your skills against job requirements</p>
      </div>

      {/* JD Input */}
      <div className="glass-light rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-surface-100 mb-4">Paste Job Description</h2>
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          rows={8}
          placeholder="Paste the job description here..."
          className="w-full rounded-xl border border-surface-700/50 bg-surface-800/50 p-4 text-sm text-surface-100 placeholder-surface-200/30 outline-none transition-all focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 resize-none"
        />
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="mt-4 w-full rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <HiOutlineLightningBolt className="h-4 w-4" />
          {loading ? 'Analyzing...' : 'Analyze Skill Gap'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Match Score */}
          <div className="glass-light rounded-2xl p-6">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-brand-400">{result.match_percentage || 0}%</p>
                <p className="text-xs text-surface-200/50 mt-1">Skill Match</p>
              </div>
              <div className="flex-1">
                <div className="h-3 rounded-full bg-surface-700 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500" style={{width: `${result.match_percentage || 0}%`}} />
                </div>
              </div>
            </div>
          </div>

          {/* Matching Skills */}
          {result.matching_skills?.length > 0 && (
            <div className="glass-light rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-emerald-400 mb-3">✓ Matching Skills</h3>
              <div className="flex flex-wrap gap-2">
                {result.matching_skills.map((s, i) => (
                  <span key={i} className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
                    {s.skill || s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing Skills */}
          {result.missing_skills?.length > 0 && (
            <div className="glass-light rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-red-400 mb-3">✗ Missing Skills</h3>
              <div className="space-y-2">
                {result.missing_skills.map((s, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-red-500/5 px-4 py-2.5">
                    <span className="text-sm text-surface-100">{s.skill || s}</span>
                    <span className="text-xs text-surface-200/40">{s.learning_time || ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations?.length > 0 && (
            <div className="glass-light rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-surface-100 mb-3">Recommendations</h3>
              <ul className="space-y-2">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-surface-200/70">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-400 flex-shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
