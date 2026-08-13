import { useState, useEffect } from 'react';
import { HiOutlineCloudUpload, HiOutlineDocumentText } from 'react-icons/hi';
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
      // Refresh list
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-surface-100">Resume</h1>
        <p className="mt-1 text-sm text-surface-200/60">Upload, parse, and get ATS analysis</p>
      </div>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={`glass-light rounded-2xl border-2 border-dashed p-10 text-center transition-all ${dragOver ? 'border-brand-500 bg-brand-500/5' : 'border-surface-700/50'}`}
      >
        <HiOutlineCloudUpload className="mx-auto h-12 w-12 text-surface-200/40" />
        <p className="mt-4 text-sm text-surface-200/60">
          {uploading ? 'Analyzing your resume with AI...' : 'Drag & drop your resume here, or click to browse'}
        </p>
        <p className="mt-1 text-xs text-surface-200/30">Supports PDF, DOCX, TXT (max 10MB)</p>
        {!uploading && (
          <label className="mt-4 inline-block cursor-pointer rounded-xl bg-brand-500/20 px-6 py-2.5 text-sm font-medium text-brand-400 transition-colors hover:bg-brand-500/30">
            Choose File
            <input type="file" accept=".pdf,.docx,.doc,.txt" onChange={handleFileInput} className="hidden" />
          </label>
        )}
        {uploading && (
          <div className="mt-4">
            <div className="mx-auto h-2 w-48 overflow-hidden rounded-full bg-surface-700">
              <div className="h-full animate-pulse rounded-full bg-brand-500" style={{width: '60%'}} />
            </div>
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          <div className="glass-light rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-surface-100 mb-4">ATS Analysis</h2>
            <div className="flex items-center gap-6 mb-4">
              <div className="text-center">
                <p className="text-4xl font-bold text-brand-400">{analysis.ats_score}</p>
                <p className="text-xs text-surface-200/50 mt-1">ATS Score</p>
              </div>
              <div className="flex-1">
                <div className="h-3 rounded-full bg-surface-700 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all" style={{width: `${analysis.ats_score}%`}} />
                </div>
              </div>
            </div>
            {analysis.ats_feedback && (
              <ul className="space-y-2">
                {analysis.ats_feedback.map((fb, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-surface-200/70">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-400 flex-shrink-0" />
                    {fb}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {analysis.skills?.length > 0 && (
            <div className="glass-light rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-surface-100 mb-4">Extracted Skills</h2>
              <div className="flex flex-wrap gap-2">
                {analysis.skills.map((s, i) => (
                  <span key={i} className="rounded-lg bg-brand-500/10 px-3 py-1.5 text-xs font-medium text-brand-400">
                    {s.name || s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {analysis.summary && (
            <div className="glass-light rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-surface-100 mb-2">Summary</h2>
              <p className="text-sm text-surface-200/70">{analysis.summary}</p>
            </div>
          )}
        </div>
      )}

      {/* Previous Resumes */}
      {resumes.length > 0 && !analysis && (
        <div className="glass-light rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
            <HiOutlineDocumentText className="h-5 w-5 text-brand-400" />
            Previous Uploads
          </h2>
          <div className="space-y-3">
            {resumes.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl bg-surface-800/30 p-4">
                <div>
                  <p className="text-sm font-medium text-surface-100">{r.file_name}</p>
                  <p className="text-xs text-surface-200/40">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-brand-400">{r.ats_score || '—'}</p>
                  <p className="text-xs text-surface-200/40">ATS Score</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
