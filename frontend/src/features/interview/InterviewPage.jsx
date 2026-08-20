import { useState } from 'react';
import { interviewApi } from '../../api/index';
import toast from 'react-hot-toast';

export default function InterviewPage() {
  const [topic, setTopic] = useState('behavioral');
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [evaluating, setEvaluating] = useState(false);

  const startInterview = async () => {
    setLoading(true);
    setSession(null);
    setCurrentQ(0);
    setEvaluation(null);
    try {
      const res = await interviewApi.start({ interview_type: topic, topic: topic, num_questions: 5 });
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
    <div>
      {/* Header */}
      <header className="mb-8">
        <h2 className="text-2xl md:text-[30px] md:leading-9 md:tracking-tight font-bold text-on-surface mb-2">Mock Interview Session</h2>
        <p className="text-base leading-6 text-on-surface-variant">Configure your session and practice with our AI interviewer.</p>
      </header>

      {/* Configuration Section */}
      {!session && (
        <section className="mb-8 p-6 rounded-xl border border-outline-variant bg-surface-container-lowest">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-on-surface tracking-wider uppercase" htmlFor="topic-select">
                Interview Topic
              </label>
              <div className="relative">
                <select
                  id="topic-select"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full appearance-none bg-surface border border-outline-variant rounded-lg px-4 py-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                >
                  <option value="behavioral">Behavioral</option>
                  <option value="dsa">Data Structures & Algorithms</option>
                  <option value="system-design">System Design</option>
                  <option value="technical">Technical</option>
                  <option value="hr">HR</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-3 text-on-surface-variant pointer-events-none">expand_more</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-on-surface tracking-wider uppercase" htmlFor="difficulty-select">
                Difficulty Level
              </label>
              <div className="relative">
                <select
                  id="difficulty-select"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full appearance-none bg-surface border border-outline-variant rounded-lg px-4 py-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                >
                  <option value="medium">Medium</option>
                  <option value="easy">Easy</option>
                  <option value="hard">Hard</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-3 text-on-surface-variant pointer-events-none">expand_more</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Start Button (when no session) */}
      {!session && !loading && (
        <div className="mb-8">
          <button
            onClick={startInterview}
            className="bg-primary text-on-primary font-semibold text-sm py-3 px-8 rounded-lg hover:bg-surface-tint transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">play_arrow</span>
            Start Session
          </button>
        </div>
      )}

      {loading && (
        <div className="mb-8 text-center py-8 text-on-surface-variant">Starting interview session...</div>
      )}

      {/* Active Interview Chat Interface */}
      {session && session.questions?.length > 0 && currentQ < session.questions.length && (
        <section className="flex flex-col gap-6 mb-8">
          {/* AI Question Bubble */}
          <div className="flex items-start max-w-[85%]">
            <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center flex-shrink-0 mr-2">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
            </div>
            <div className="bg-surface-container border border-outline-variant rounded-xl rounded-tl-sm p-4 text-on-surface text-sm">
              <p className="mb-2 font-medium">
                {topic.charAt(0).toUpperCase() + topic.slice(1)} Question {currentQ + 1}/{session.questions.length}
              </p>
              <p>{session.questions[currentQ].question}</p>
              {session.questions[currentQ].hints?.[0] && (
                <p className="mt-2 text-xs text-on-surface-variant">
                  Hint: {session.questions[currentQ].hints[0]}
                </p>
              )}
            </div>
          </div>

          {/* User Answer Input Area */}
          <div className="flex flex-col max-w-[85%] self-end w-full">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl rounded-tr-sm p-4 w-full">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={5}
                placeholder="Type your answer here... Consider using the STAR method (Situation, Task, Action, Result)."
                className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm text-on-surface resize-none outline-none placeholder:text-on-surface-variant/50"
              />
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-outline-variant">
                <div className="flex gap-2">
                  <button className="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container-low" title="Record Audio">
                    <span className="material-symbols-outlined">mic</span>
                  </button>
                  <button className="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container-low" title="Attach file">
                    <span className="material-symbols-outlined">attach_file</span>
                  </button>
                </div>
                {!evaluation && (
                  <button
                    onClick={submitAnswer}
                    disabled={evaluating}
                    className="bg-primary text-on-primary px-6 py-2 rounded-lg text-xs font-medium uppercase hover:bg-surface-tint transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <span>{evaluating ? 'Evaluating...' : 'Submit Answer'}</span>
                    <span className="material-symbols-outlined text-lg">send</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* AI Feedback Card */}
          {evaluation && (
            <div className="border border-outline-variant rounded-xl bg-surface-container p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary filled" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
                  AI Feedback
                </h3>
                <span className="text-xs font-medium bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full">
                  Score: {evaluation.score} / {evaluation.max_score}
                </span>
              </div>

              {/* Strengths */}
              {evaluation.strengths && evaluation.strengths.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-sm text-on-surface mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">check_circle</span>
                    Strengths
                  </h4>
                  <ul className="ml-7 space-y-1.5">
                    {evaluation.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-on-surface-variant list-disc">{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {evaluation.feedback && !evaluation.strengths && (
                <div className="mb-4">
                  <h4 className="font-semibold text-sm text-on-surface mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">check_circle</span>
                    Feedback
                  </h4>
                  <p className="text-sm text-on-surface-variant ml-7">{evaluation.feedback}</p>
                </div>
              )}

              <div className="border-t border-outline-variant my-4" />

              {/* Areas for Improvement */}
              {evaluation.improvements && evaluation.improvements.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-sm text-on-surface mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary">trending_up</span>
                    Areas for Improvement
                  </h4>
                  <ul className="ml-7 space-y-1.5">
                    {evaluation.improvements.map((imp, i) => (
                      <li key={i} className="text-sm text-on-surface-variant list-disc">{imp}</li>
                    ))}
                  </ul>
                </div>
              )}

              {evaluation.ideal_answer && (
                <div className="mb-4 pt-4 border-t border-outline-variant">
                  <h4 className="font-semibold text-sm text-on-surface mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary">trending_up</span>
                    Ideal Answer
                  </h4>
                  <p className="text-sm text-on-surface-variant ml-7">{evaluation.ideal_answer}</p>
                </div>
              )}

              {/* Navigation */}
              <div className="mt-6 flex justify-center">
                {currentQ < session.questions.length - 1 ? (
                  <button
                    onClick={nextQuestion}
                    className="border border-outline text-on-surface hover:bg-surface-container-low px-6 py-2 rounded-lg text-xs font-medium uppercase transition-colors"
                  >
                    Next Question
                  </button>
                ) : (
                  <button
                    onClick={() => { setSession(null); setCurrentQ(0); setAnswer(''); setEvaluation(null); }}
                    className="bg-primary text-on-primary hover:bg-surface-tint px-6 py-2 rounded-lg text-xs font-medium uppercase transition-colors"
                  >
                    Complete — Start New
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
