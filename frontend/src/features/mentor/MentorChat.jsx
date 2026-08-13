import { useState, useEffect, useRef } from 'react';
import { HiOutlinePaperAirplane } from 'react-icons/hi';
import { chatApi } from '../../api/index';
import toast from 'react-hot-toast';

export default function MentorChat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Load chat history
    chatApi.getHistory()
      .then(res => {
        if (res.data.data && Array.isArray(res.data.data)) {
          setMessages(res.data.data);
        }
      })
      .catch(() => {
        // Start with welcome message if no history
        setMessages([
          { role: 'assistant', content: "Hi! I'm your CareerForge AI Mentor. I can help you with career planning, technical concepts, interview prep, resume tips, and more. What would you like to work on today?" }
        ]);
      });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim() || loading) return;

    const userMsg = { role: 'user', content: message };
    setMessages(prev => [...prev, userMsg]);
    setMessage('');
    setLoading(true);

    try {
      const res = await chatApi.sendMessage({ message: message });
      const aiResponse = res.data.data?.response || 'Sorry, I could not generate a response.';
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (err) {
      toast.error('Failed to get response');
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please check that your GEMINI_API_KEY is configured.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-surface-100">AI Mentor</h1>
        <p className="mt-1 text-sm text-surface-200/60">Your personal career advisor powered by RAG + Gemini</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === 'user'
                ? 'bg-brand-500/20 text-surface-100'
                : 'glass-light text-surface-200/80'
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="glass-light rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="h-2 w-2 rounded-full bg-brand-400 animate-bounce" style={{animationDelay: '0ms'}} />
                <div className="h-2 w-2 rounded-full bg-brand-400 animate-bounce" style={{animationDelay: '150ms'}} />
                <div className="h-2 w-2 rounded-full bg-brand-400 animate-bounce" style={{animationDelay: '300ms'}} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Ask me anything about your career, interview prep, tech concepts..."
          className="flex-1 rounded-xl border border-surface-700/50 bg-surface-800/50 py-3 px-4 text-sm text-surface-100 placeholder-surface-200/30 outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 resize-none"
        />
        <button
          onClick={sendMessage}
          disabled={loading || !message.trim()}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
        >
          <HiOutlinePaperAirplane className="h-5 w-5 rotate-90" />
        </button>
      </div>
    </div>
  );
}
