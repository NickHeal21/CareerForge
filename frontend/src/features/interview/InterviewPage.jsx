import { useState } from 'react';
import { HiOutlineAcademicCap } from 'react-icons/hi';
import { interviewApi } from '../../api/index';
import toast from 'react-hot-toast';

const interviewTypes = [
  { type: 'technical', label: 'Technical Interview', description: 'DSA, System Design, CS Fundamentals', color: 'from-brand-500 to-brand-600' },
  { type: 'hr', label: 'HR Interview', description: 'Behavioral, situational, and HR questions', color: 'from-accent-500 to-accent-600' },
  { type: 'behavioral', label: 'Behavioral Interview', description: 'STAR method, leadership, teamwork', color: 'from-emerald-500 to-emerald-600' },
];

export default function InterviewPage() {
  const [topic, setTopic] = useState('');
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [evaluating, setEvaluating] = useState(false);

  const startInterview = async (type) => {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }
    setSelectedType(type);
    setLoading(true);
    setSession(null);
    setCurrentQ(0);
    setEvaluation(null);
    try {
      const res = await interviewApi.start({ interview_type: type, topic, num_questions: 5 });
      if (res.data.success) {
        setSession(res.data.data);
        toast.success('Interview started!');
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start interview');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) {
      toast.error('Please write your answer');
      return;
    }
    setEvaluating(true);
    setEvaluation(null);
    try {
      const q = session.questions[currentQ];
      const res = await interviewApi.submitAnswer(session.session_id, {
        question_index: currentQ,
        question: q.question,
        answer: answer,
      });
      setEvaluation(res.data.data);
    } catch (err) {
      toast.error('Evaluation failed');
    } finally {
      setEvaluating(false);
    }
  };

  const nextQuestion = () => {
    setCurrentQ(prev => prev + 1);
    setAnswer('');
    setEvaluation(null);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-surface-100">Mock Interview</h1>
        <p className="mt-1 text-sm text-surface-200/60">Practice with AI-powered interviews</p>
      </div>

      {!session && (
        <>
          <div className="glass-light rounded-2xl p-6">
            <label className="mb-1.5 block text-sm font-medium text-surface-200/80">Interview Topic</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Python, React, System Design, Data Structures"
              className="w-full rounded-xl border border-surface-700/50 bg-surface-800/50 py-3 px-4 text-sm text-surface-100 placeholder-surface-200/30 outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {interviewTypes.map(({ type, label, description, color }) => (
              <button
                key={type}
                onClick={() => startInterview(type)}
                disabled={loading}
                className="glass-light group rounded-2xl p-6 text-left transition-all hover:border-brand-500/30 hover:shadow-lg disabled:opacity-50"
              >
                <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
                  <HiOutlineAcademicCap className="h-5 w-5 text-white" />
                </div>
                <p className="text-sm font-semibold text-surface-100">{label}</p>
                <p className="mt-1 text-xs text-surface-200/50">{description}</p>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Active Interview */}
      {session && session.questions?.length > 0 && currentQ < session.questions.length && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-surface-200/50">
              Question {currentQ + 1} of {session.questions.length}
            </p>
            <div className="flex gap-1">
              {session.questions.map((_, i) => (
                <div key={i} className={`h-2 w-8 rounded-full ${i <= currentQ ? 'bg-brand-500' : 'bg-surface-700'}`} />
              ))}
            </div>
          </div>

          <div className="glass-light rounded-2xl p-6">
            <p className="text-base font-medium text-surface-100">{session.questions[currentQ].question}</p>
            {session.questions[currentQ].hints?.[0] && (
              <p className="mt-2 text-xs text-surface-200/40">Hint: {session.questions[currentQ].hints[0]}</p>
            )}
          </div>

          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={6}
            placeholder="Type your answer here..."
            className="w-full rounded-xl border border-surface-700/50 bg-surface-800/50 p-4 text-sm text-surface-100 placeholder-surface-200/30 outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 resize-none"
          />

          {!evaluation && (
            <button
              onClick={submitAnswer}
              disabled={evaluating}
              className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-50"
            >
              {evaluating ? 'Evaluating...' : 'Submit Answer'}
            </button>
          )}

          {evaluation && (
            <div className="glass-light rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-brand-400">{evaluation.score}/{evaluation.max_score}</p>
                  <p className="text-xs text-surface-200/40">Score</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-surface-200/70">{evaluation.feedback}</p>
                </div>
              </div>

              {evaluation.ideal_answer && (
                <div className="rounded-xl bg-emerald-500/5 p-4">
                  <p className="text-xs font-medium text-emerald-400 mb-1">Ideal Answer:</p>
                  <p className="text-sm text-surface-200/70">{evaluation.ideal_answer}</p>
                </div>
              )}

              {currentQ < session.questions.length - 1 ? (
                <button
                  onClick={nextQuestion}
                  className="w-full rounded-xl bg-brand-500/20 py-3 text-sm font-semibold text-brand-400 hover:bg-brand-500/30 transition-colors"
                >
                  Next Question →
                </button>
              ) : (
                <button
                  onClick={() => { setSession(null); setCurrentQ(0); setAnswer(''); setEvaluation(null); }}
                  className="w-full rounded-xl bg-emerald-500/20 py-3 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                >
                  ✓ Interview Complete — Start New
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
