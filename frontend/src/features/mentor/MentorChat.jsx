import { useState, useEffect, useRef } from 'react';
import { chatApi } from '../../api/index';
import toast from 'react-hot-toast';

export default function MentorChat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    chatApi.getHistory()
      .then(res => {
        if (res.data.data && Array.isArray(res.data.data)) {
          setMessages(res.data.data);
        }
      })
      .catch(() => {
        setMessages([
          { role: 'assistant', content: "Hello! I'm your AI Career Mentor. I see you're aiming for a Senior Frontend Developer role. How can I help you progress today?" }
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
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-5rem)]">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface-container-high bg-surface/80 backdrop-blur-sm sticky top-0 z-10 md:mt-4 md:mx-0 md:rounded-t-xl md:border md:border-outline-variant md:border-b-outline-variant">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-primary">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
          </div>
          <div>
            <h2 className="text-base font-semibold text-on-surface">AI Career Mentor</h2>
            <p className="text-xs text-on-surface-variant tracking-wider">Always available</p>
          </div>
        </div>
        <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors">
          <span className="material-symbols-outlined">more_vert</span>
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 flex flex-col md:border-x md:border-outline-variant bg-surface-container-lowest">
        {/* Timestamp */}
        <div className="flex justify-center">
          <span className="px-3 py-1 bg-surface-container-high rounded-full text-xs font-medium text-on-surface-variant">
            Today, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-start gap-2 max-w-[85%] ${
              msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 shrink-0 rounded-full bg-primary-container flex items-center justify-center text-primary mt-1">
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
              </div>
            )}
            <div
              className={`px-4 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-on-primary rounded-2xl rounded-tr-sm'
                  : 'bg-surface-container text-on-surface rounded-2xl rounded-tl-sm border border-outline-variant'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-start gap-2 max-w-[85%] self-start">
            <div className="w-8 h-8 shrink-0 rounded-full bg-primary-container flex items-center justify-center text-primary mt-1">
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
            </div>
            <div className="bg-surface-container border border-outline-variant rounded-2xl rounded-tl-sm px-4 py-2 flex items-center gap-1 h-11">
              <div className="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-5 py-4 bg-surface border-t border-outline-variant md:rounded-b-xl md:border md:border-t-0 md:mb-4">
        <div className="flex items-end gap-2 max-w-4xl mx-auto w-full">
          <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors shrink-0 mb-1">
            <span className="material-symbols-outlined">attach_file</span>
          </button>
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Type your response..."
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 pr-12 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none overflow-hidden min-h-[48px] max-h-[120px]"
              onInput={(e) => { e.target.style.height = ''; e.target.style.height = e.target.scrollHeight + 'px'; }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={loading || !message.trim()}
            className="w-12 h-12 bg-primary text-on-primary rounded-xl flex items-center justify-center shrink-0 hover:bg-surface-tint transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
