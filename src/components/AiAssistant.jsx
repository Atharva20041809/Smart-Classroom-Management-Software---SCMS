import React, { useState, useEffect, useRef } from 'react';

const INITIAL_MESSAGES = [
  {
    role: 'assistant',
    content:
      'Hello! I am your AI Learning Assistant. You can ask me to explain any difficult concept, break down complex topics, provide real-world examples, or identify topics you should revise before your exams. What would you like to learn today?'
  }
];

const SUGGESTED_PROMPTS = [
  'Explain Newton’s Third Law with everyday examples',
  'How does photosynthesis work in simple terms?',
  'Why do we need fractions and how do I add them?',
  'What are common learning gaps in introductory algebra?'
];

export default function AiAssistant() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [apiKeyStatus, setApiKeyStatus] = useState({ configured: false, model: 'openai/gpt-oss-20b' });
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState('');
  const [keyUpdateNotice, setKeyUpdateNotice] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    checkKeyStatus();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  function scrollToBottom() {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }

  async function checkKeyStatus() {
    if (window.electronAPI && window.electronAPI.checkApiKeyStatus) {
      try {
        const status = await window.electronAPI.checkApiKeyStatus();
        setApiKeyStatus(status);
      } catch (err) {
        console.error('Failed to query API key status:', err);
      }
    }
  }

  async function handleSendMessage() {
    const trimmed = inputMessage.trim();
    if (!trimmed || isLoading) return;

    setErrorMessage(null);

    const userMsg = { role: 'user', content: trimmed };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputMessage('');

    setIsLoading(true);

    try {
      if (!window.electronAPI || !window.electronAPI.sendChatMessage) {
        throw new Error(
          'Electron IPC bridge is not available. Ensure the application is running inside the SCMS Electron desktop window.'
        );
      }

      // Send chat history through secure main process bridge
      const response = await window.electronAPI.sendChatMessage(newHistory);

      if (response && response.success) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: response.content }
        ]);
      } else {
        const errText = response?.error || 'Failed to receive a valid response from Groq AI.';
        setErrorMessage(errText);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
      // Re-check status in case key validity changed
      checkKeyStatus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  function handleClearChat() {
    if (window.confirm('Clear conversation history?')) {
      setMessages(INITIAL_MESSAGES);
      setErrorMessage(null);
    }
  }

  function handlePromptChipClick(promptText) {
    setInputMessage(promptText);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }

  async function handleSaveCustomKey() {
    if (!customKeyInput.trim()) return;
    try {
      if (window.electronAPI && window.electronAPI.updateApiKey) {
        const res = await window.electronAPI.updateApiKey(customKeyInput.trim());
        setApiKeyStatus(res);
        setKeyUpdateNotice('Groq API Key updated successfully for this session!');
        setShowKeyConfig(false);
        setCustomKeyInput('');
        setErrorMessage(null);
      }
    } catch (err) {
      alert('Failed to update key: ' + err.message);
    }
  }

  return (
    <div className="assistant-module">
      {/* Key Status Alert / Configuration */}
      {!apiKeyStatus.configured && (
        <div className="alert-banner alert-warning" style={{ justifyContent: 'space-between' }}>
          <div>
            <strong>Notice: Groq API Key Not Detected.</strong>
            <div style={{ marginTop: '2px', fontSize: '12.5px' }}>
              To enable AI responses, add <code>GROQ_API_KEY=gsk_...</code> to a <code>.env</code> file in the project root, or configure it temporarily below.
            </div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowKeyConfig(!showKeyConfig)}
          >
            {showKeyConfig ? 'Hide Settings' : 'Configure Key'}
          </button>
        </div>
      )}

      {keyUpdateNotice && (
        <div className="alert-banner alert-success">
          <span>✓</span>
          <span>{keyUpdateNotice}</span>
        </div>
      )}

      {/* Collapsible Key Entry */}
      {showKeyConfig && (
        <div className="card" style={{ marginBottom: '16px', backgroundColor: '#fafbfc' }}>
          <div className="card-title" style={{ fontSize: '13.5px', marginBottom: '8px' }}>
            Configure Groq API Key
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '10px' }}>
            Enter your Groq API key starting with <code>gsk_</code>. It is processed exclusively in Electron's trusted main process and never exposed to renderer scripts.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="password"
              placeholder="gsk_..."
              className="form-input"
              style={{ flex: 1 }}
              value={customKeyInput}
              onChange={(e) => setCustomKeyInput(e.target.value)}
            />
            <button className="btn btn-primary btn-sm" onClick={handleSaveCustomKey}>
              Apply Key
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowKeyConfig(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Chat Container */}
      <div className="chat-container">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <span
              className={`chat-status-dot ${apiKeyStatus.configured ? '' : 'warning'}`}
            ></span>
            <span style={{ fontWeight: '600', fontSize: '13.5px' }}>
              Groq Educational Assistant
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              ({apiKeyStatus.model || 'openai/gpt-oss-20b'})
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              title="API Key Settings"
            >
              ⚙ API Settings
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleClearChat}
              disabled={isLoading || messages.length <= 1}
            >
              Clear Chat
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="chat-messages-area">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={idx}
                className={`chat-message-row ${isUser ? 'user' : 'assistant'}`}
              >
                <div className={`chat-avatar ${isUser ? 'user-av' : 'bot-av'}`}>
                  {isUser ? 'You' : 'AI'}
                </div>
                <div className="chat-bubble">{msg.content}</div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="chat-message-row assistant">
              <div className="chat-avatar bot-av">AI</div>
              <div className="typing-indicator">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          )}

          {/* Inline Error Notice */}
          {errorMessage && (
            <div className="alert-banner alert-danger" style={{ alignSelf: 'center', width: '100%' }}>
              <span>⚠️</span>
              <div>
                <strong>Error:</strong> {errorMessage}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="chat-input-bar">
          {/* Quick Prompts Chips */}
          <div className="chat-prompt-chips">
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', alignSelf: 'center' }}>
              Suggested:
            </span>
            {SUGGESTED_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                type="button"
                className="chip-btn"
                onClick={() => handlePromptChipClick(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Text Input Row */}
          <div className="chat-input-row">
            <textarea
              ref={textareaRef}
              rows={2}
              className="chat-textarea"
              placeholder="Ask a question about any concept... (Press Enter to send, Shift+Enter for new line)"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button
              className="btn btn-primary"
              style={{ height: '42px', padding: '0 18px' }}
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
            >
              {isLoading ? 'Thinking...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
