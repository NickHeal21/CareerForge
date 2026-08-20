import { useState } from 'react';
import { Link } from 'react-router-dom';
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
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-[30px] md:leading-9 md:tracking-tight font-bold text-on-surface mb-2">Skill Gap Analysis</h1>
        <p className="text-base leading-6 text-on-surface-variant">
          Paste a job description below to identify missing skills and tailor your learning path.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="border border-outline-variant bg-surface rounded-lg p-6">
            <label className="block text-xs font-medium text-on-surface tracking-wider uppercase mb-2" htmlFor="job-description">
              Job Description
            </label>
            <textarea
              id="job-description"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              rows={12}
              placeholder="Paste the full job description here..."
              className="w-full border border-outline-variant bg-surface-container-lowest text-on-surface rounded-lg p-2 text-sm outline-none transition-colors duration-200 resize-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="bg-primary text-on-primary font-semibold text-sm px-6 py-2 rounded-lg hover:bg-surface-tint transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">auto_awesome</span>
                {loading ? 'Analyzing...' : 'Analyze Skills'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-5">
          {result ? (
            <div className="border border-outline-variant bg-surface rounded-lg p-6">
              {/* Score Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-on-surface">Analysis Results</h2>
                <span className="text-xs font-medium bg-secondary-container text-on-secondary-container px-2.5 py-1 rounded-full">
                  Score: {result.match_percentage || 0}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-surface-variant h-1 rounded-full overflow-hidden mb-6">
                <div className="bg-primary h-full" style={{ width: `${result.match_percentage || 0}%` }} />
              </div>

              {/* Your Skills */}
              {result.matching_skills?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm text-on-surface-variant mb-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-base text-primary">check_circle</span>
                    Your Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.matching_skills.map((s, i) => (
                      <span key={i} className="bg-surface-container-low border border-outline-variant text-on-surface text-xs font-medium px-3 py-1 rounded-lg">
                        {s.skill || s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Skills */}
              {result.missing_skills?.length > 0 && (
                <div>
                  <h3 className="text-sm text-on-surface-variant mb-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-base text-error">error</span>
                    Missing Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.missing_skills.map((s, i) => (
                      <span key={i} className="bg-error-container text-on-error-container text-xs font-medium px-3 py-1 rounded-lg">
                        {s.skill || s}
                      </span>
                    ))}
                  </div>

                  {/* Generate Learning Path */}
                  <div className="mt-6 pt-6 border-t border-outline-variant">
                    <Link
                      to="/roadmap"
                      className="w-full border border-outline text-on-surface font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-surface-container-low transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      Generate Learning Path
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations?.length > 0 && (
                <div className="mt-6 pt-6 border-t border-outline-variant">
                  <h3 className="text-xs font-medium text-on-surface-variant mb-3 uppercase tracking-wider">Recommendations</h3>
                  <ul className="space-y-2">
                    {result.recommendations.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-on-surface-variant">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="border border-outline-variant bg-surface rounded-lg p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
              <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">psychology</span>
              <p className="text-sm text-on-surface-variant">
                Paste a job description and click "Analyze Skills" to see your skill gap results here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
