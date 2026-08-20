import { useState, useEffect } from 'react';
import { resumeApi } from '../../api/index';
import toast from 'react-hot-toast';

export default function ResumePage() {
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    resumeApi.list()
      .then(res => setResumes(res.data.data || []))
      .catch(() => {});
  }, []);

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await resumeApi.upload(formData);
      setAnalysis(res.data.data);
      toast.success('Resume analyzed successfully!');
      const listRes = await resumeApi.list();
      setResumes(listRes.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleUpload(file);
  };

  const handleFileInput = (e) => {
    handleUpload(e.target.files[0]);
  };

  return (
    <div>
      {/* Page Header */}
      <header className="mb-8">
        <h1 className="text-2xl md:text-[30px] md:leading-9 md:tracking-tight font-bold text-on-surface">Resume Analysis</h1>
      </header>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors duration-200 cursor-pointer min-h-[200px] mb-8 ${
          dragOver
            ? 'border-primary bg-surface-container-low'
            : 'border-outline-variant bg-surface hover:bg-surface-container-low'
        }`}
      >
        <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-4">
          <span className="material-symbols-outlined filled text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>upload_file</span>
        </div>
        <h2 className="text-xl font-semibold text-on-surface mb-2">Upload your Resume (PDF/DOCX)</h2>
        <p className="text-sm text-on-surface-variant text-center max-w-sm">
          {uploading ? 'Analyzing your resume with AI...' : 'Drag and drop your file here, or click to browse. Max file size 5MB.'}
        </p>
        {!uploading && (
          <label className="mt-4 inline-block cursor-pointer rounded-lg bg-primary text-on-primary px-6 py-2.5 text-sm font-semibold hover:bg-surface-tint transition-colors">
            Choose File
            <input type="file" accept=".pdf,.docx,.doc,.txt" onChange={handleFileInput} className="hidden" />
          </label>
        )}
        {uploading && (
          <div className="mt-4 w-48 h-1 bg-surface-variant rounded-full overflow-hidden">
            <div className="h-full bg-primary animate-pulse rounded-full" style={{ width: '60%' }} />
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="border border-outline-variant rounded-lg bg-surface p-6 mb-8">
          {/* Header */}
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-on-surface mb-1">Analysis Complete</h3>
            <p className="text-sm text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-base">description</span>
              {analysis.file_name || 'Resume analyzed'}
            </p>
          </div>

          {/* ATS Score */}
          <div className="mb-2">
            <p className="text-sm text-on-surface-variant">Overall ATS Score</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-primary">{analysis.ats_score}</span>
              <span className="text-base text-on-surface-variant">/100</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 bg-surface-variant rounded-full overflow-hidden mb-8">
            <div className="h-full bg-primary" style={{ width: `${analysis.ats_score}%` }} />
          </div>

          {/* Suggestions */}
          {analysis.ats_feedback && (
            <div className="mb-8">
              <h4 className="font-semibold text-on-surface flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-tertiary">lightbulb</span>
                Suggestions
              </h4>
              <ul className="space-y-4">
                {analysis.ats_feedback.map((fb, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary text-xl mt-0.5">add_circle</span>
                    <span className="text-sm text-on-surface">{fb}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Keyword Match */}
          {analysis.skills?.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-on-surface flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-secondary">bookmark</span>
                Keyword Match
              </h4>
              <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-2">Matched Keywords</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {analysis.skills.map((s, i) => (
                  <span key={i} className="inline-flex items-center px-3 py-1 rounded-lg bg-surface-container-high text-on-surface border border-outline-variant text-xs font-medium">
                    {s.name || s}
                    <span className="material-symbols-outlined text-sm ml-1 text-primary">check_circle</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <button className="border border-outline text-on-surface hover:bg-surface-container-low font-semibold text-sm py-2.5 px-6 rounded-lg transition-colors">
              View Details
            </button>
            <button className="bg-primary text-on-primary hover:bg-surface-tint font-semibold text-sm py-2.5 px-6 rounded-lg transition-colors">
              Export Report
            </button>
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="border border-outline-variant rounded-lg p-6 bg-surface mb-8">
        <h3 className="text-lg font-semibold text-on-surface mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined">info</span>
          How it works
        </h3>
        <p className="text-sm text-on-surface-variant mb-4">
          Our system parses your resume format and compares its content against industry-standard ATS (Applicant Tracking System) criteria to ensure maximum compatibility.
        </p>
        <a href="#" className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1">
          Learn more about ATS <span className="material-symbols-outlined text-base">arrow_forward</span>
        </a>
      </div>

      {/* Previous Uploads */}
      {resumes.length > 0 && !analysis && (
        <div className="border border-outline-variant rounded-lg p-6 bg-surface">
          <h3 className="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined">history</span>
            Previous Uploads
          </h3>
          <div className="space-y-3">
            {resumes.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-outline-variant p-3 hover:bg-surface-container-low transition-colors">
                <div>
                  <p className="text-sm font-medium text-on-surface">{r.file_name}</p>
                  <p className="text-xs text-on-surface-variant">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{r.ats_score || '—'}</p>
                  <p className="text-xs text-on-surface-variant">ATS</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
