import { useState, useRef, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

// Simple response logic for the voice assistant
function getResponse(input: string): string {
  const lower = input.toLowerCase();

  // Time-related
  if (lower.includes('time') || lower.includes('समय')) {
    return `The current time is ${new Date().toLocaleTimeString()}. Take your time, there's no rush.`;
  }
  if (lower.includes('date') || lower.includes('day') || lower.includes('today') || lower.includes('तारीख')) {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return `Today is ${new Date().toLocaleDateString('en-IN', options)}. A wonderful day!`;
  }

  // Weather
  if (lower.includes('weather') || lower.includes('मौसम')) {
    return "I'm not able to check the weather right now, but I hope it's pleasant where you are. Would you like me to remind you to check outside?";
  }

  // Medication
  if (lower.includes('medicine') || lower.includes('pill') || lower.includes('दवाई')) {
    return "It's important to take your medications on time. Your caregiver has been notified about your medication schedule. Is it time for your next dose?";
  }

  // Food/Meals
  if (lower.includes('food') || lower.includes('eat') || lower.includes('meal') || lower.includes('खाना')) {
    const hour = new Date().getHours();
    if (hour < 11) return "Breakfast is a great way to start the day! Would you like some tea or something light?";
    if (hour < 15) return "Lunchtime is approaching. A warm, nutritious meal will give you energy for the afternoon.";
    if (hour < 19) return "Evening snack time! How about some fruit or light refreshments?";
    return "Dinner time! A light, warm meal will help you rest well tonight.";
  }

  // Family
  if (lower.includes('family') || lower.includes('son') || lower.includes('daughter') || lower.includes('परिवार')) {
    return "Your family loves you very much. They've asked me to remind you that you can reach them anytime using the SOS button if needed.";
  }

  // Help/Emergency
  if (lower.includes('help') || lower.includes('emergency') || lower.includes('sos') || lower.includes('मदद')) {
    return "I'm here for you. If you need immediate help, please press the red SOS button on the home screen. Your caregiver will be notified right away.";
  }

  // Greetings
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('namaste') || lower.includes('नमस्ते')) {
    return "Namaste! 🙏 I'm Smriti, your companion. How can I help you today? You can ask me about the time, meals, medicines, or anything else.";
  }

  // Feelings
  if (lower.includes('sad') || lower.includes('lonely') || lower.includes('upset') || lower.includes('udaa')) {
    return "I understand you're feeling down. Remember, you're not alone. Would you like to play a brain game to lift your spirits, or shall I connect you with your caregiver?";
  }

  // Games
  if (lower.includes('game') || lower.includes('play') || lower.includes('खेल')) {
    return "Brain games are a wonderful way to keep your mind sharp! You can find them in the Games section. I recommend trying the Memory Match game today.";
  }

  // Default
  return "I heard you. I'm Smriti, and I'm here to help with daily routines. You can ask me about the time, today's date, meals, medicines, or if you need help with anything.";
}

// Text-to-speech
function speak(text: string) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;
    // Try to find a Hindi or English voice
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(v => v.lang.includes('hi'));
    const englishVoice = voices.find(v => v.lang.includes('en-IN'));
    if (hindiVoice) utterance.voice = hindiVoice;
    else if (englishVoice) utterance.voice = englishVoice;
    window.speechSynthesis.speak(utterance);
  }
}

export default function VoiceAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Namaste! 🙏 I am Smriti, your companion. You can speak to me or type your question. Ask me about time, meals, medicines, or anything you need help with.', timestamp: Date.now() }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState('');
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleResponse = useCallback((text: string) => {
    const response = getResponse(text);
    setMessages(prev => [...prev, { role: 'user', text, timestamp: Date.now() }]);
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', text: response, timestamp: Date.now() }]);
      speak(response);
      scrollToBottom();
    }, 500);
  }, []);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleResponse(transcript);
    };

    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      handleResponse(inputText.trim());
      setInputText('');
    }
  };

  const quickActions = [
    { label: '🕐 What time is it?', query: 'What time is it?' },
    { label: '💊 Medicine reminder', query: 'Is it time for my medicine?' },
    { label: '🍽️ When is my meal?', query: 'When should I eat?' },
    { label: '📅 What day is today?', query: 'What day is today?' },
  ];

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-180px)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-xl">🧘</span>
          </div>
          <div>
            <h3 className="font-bold">Ask Smriti</h3>
            <p className="text-xs text-purple-200">Your voice companion • पूछो स्मृति से</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
              msg.role === 'user'
                ? 'bg-purple-600 text-white rounded-br-sm'
                : 'bg-white border shadow-sm rounded-bl-sm'
            }`}>
              <p className="text-sm">{msg.text}</p>
              <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-purple-200' : 'text-gray-400'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isListening && (
          <div className="flex justify-center">
            <div className="bg-red-100 px-4 py-2 rounded-full animate-pulse">
              <span className="text-red-600 text-sm">🎤 Listening...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 bg-white border-t flex gap-2 overflow-x-auto">
        {quickActions.map((action, i) => (
          <button
            key={i}
            onClick={() => handleResponse(action.query)}
            className="whitespace-nowrap bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-xs hover:bg-purple-100 transition"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t rounded-b-xl">
        <form onSubmit={handleTextSubmit} className="flex gap-2">
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isListening
                ? 'bg-red-500 text-white animate-pulse scale-110'
                : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
            }`}
          >
            <i className={`fas ${isListening ? 'fa-stop' : 'fa-microphone'}`}></i>
          </button>
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:border-purple-400"
          />
          <button
            type="submit"
            className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center hover:bg-purple-700"
          >
            <i className="fas fa-paper-plane text-sm"></i>
          </button>
        </form>
      </div>
    </div>
  );
}
