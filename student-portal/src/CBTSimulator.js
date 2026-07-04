import React, { useState, useEffect, useCallback } from 'react';

const EXAM_DATA = {
  title: "National Eligibility Simulator 2026",
  durationMinutes: 45,
  candidateName: "John Doe",
  candidateId: "CAND-102938",
  sections: [
    { id: "gk", name: "General Knowledge", start: 0, end: 4 },
    { id: "math", name: "Mathematics", start: 5, end: 9 },
    { id: "reasoning", name: "Logical Reasoning", start: 10, end: 14 }
  ],
  questions: [
    { text: "Who was the first President of India?", options: ["Zakir Husain", "Rajendra Prasad", "V. V. Giri", "S. Radhakrishnan"], correct: 1 },
    { text: "What is the capital of Australia?", options: ["Sydney", "Melbourne", "Canberra", "Perth"], correct: 2 },
    { text: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correct: 1 },
    { text: "What is the SI unit of electric current?", options: ["Volt", "Ampere", "Ohm", "Watt"], correct: 1 },
    { text: "Which gas is most abundant in Earth's atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Argon"], correct: 1 },
    { text: "Evaluate the definite integral: $\\int_{0}^{1} 3x^2 dx$", options: ["1/3", "1", "3", "0"], correct: 1 },
    { text: "If $x^2 + 5x + 6 = 0$, what are the roots of the equation?", options: ["-2, -3", "2, 3", "1, 6", "-1, -6"], correct: 0 },
    { text: "What is the value of $\\sin^2\\theta + \\cos^2\\theta$?", options: ["0", "1", "-1", "$\\tan\\theta$"], correct: 1 },
    { text: "Evaluate the limit: $\\lim_{x \\to 0} \\frac{\\sin x}{x}$", options: ["0", "1", "$\\infty$", "Undefined"], correct: 1 },
    { text: "According to Euler's identity, what is the value of $e^{i\\pi} + 1$?", options: ["0", "1", "$e$", "$\\pi$"], correct: 0 },
    { text: "Find the odd one out: Apple, Banana, Carrot, Mango", options: ["Apple", "Carrot", "Banana", "Mango"], correct: 1 },
    { text: "If 'CAT' is coded as 'DBU', how is 'DOG' coded?", options: ["EPH", "EPI", "EPJ", "FPH"], correct: 0 },
    { text: "Which is the longest river in the world?", options: ["Nile", "Amazon", "Yangtze", "Mississippi"], correct: 0 },
    { text: "What is 12 squared?", options: ["144", "121", "169", "124"], correct: 0 },
    { text: "How many bones are in the adult human body?", options: ["206", "208", "210", "196"], correct: 0 }
  ]
};

const TOTAL_Q = EXAM_DATA.questions.length;

const getInitialState = () => ({
  appState: 'instructions',
  currentIdx: 0,
  activeSectionId: EXAM_DATA.sections[0].id,
  timeLeft: EXAM_DATA.durationMinutes * 60,
  qStates: Array(TOTAL_Q).fill().map(() => ({ selected: null, status: 'nv' })),
  isSidebarOpen: false,
  submissionReason: null
});

export default function CBTSimulator({ onClose }) {
  const [state, setState] = useState(getInitialState);
  const [modalConfig, setModalConfig] = useState(null);
  const [antiCheatActive, setAntiCheatActive] = useState(false);

  const triggerMathJax = useCallback(() => {
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise().catch(err => console.error(err));
    }
  }, []);

  // Sync state to MathJax on render
  useEffect(() => { triggerMathJax(); }, [state.appState, state.currentIdx, triggerMathJax]);

  // Timer
  useEffect(() => {
    let interval;
    if (state.appState === 'exam' && state.timeLeft > 0) {
      interval = setInterval(() => {
        setState(prev => {
          if (prev.timeLeft <= 1) {
            clearInterval(interval);
            return { ...prev, appState: 'results', submissionReason: "Time expired. Your exam was submitted automatically.", timeLeft: 0 };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state.appState, state.timeLeft]);

  // Anti-Cheat Handlers
  useEffect(() => {
    if (!antiCheatActive) return;
    
    const handleVisibility = () => {
      if (document.hidden && state.appState === 'exam') forceSubmit("Exam forcefully submitted: You navigated away from the active test window.");
    };
    const handleFullscreen = () => {
      if (!document.fullscreenElement && state.appState === 'exam') forceSubmit("Exam forcefully submitted: Exiting full screen is not permitted.");
    };

    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('fullscreenchange', handleFullscreen);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('fullscreenchange', handleFullscreen);
    };
  }, [antiCheatActive, state.appState]);

  const forceSubmit = (reason) => {
    setAntiCheatActive(false);
    setState(prev => {
      const newQStates = [...prev.qStates];
      if (newQStates[prev.currentIdx].status === 'nv') newQStates[prev.currentIdx].status = 'na';
      return { ...prev, appState: 'results', submissionReason: reason, qStates: newQStates };
    });
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const beginExam = () => {
    const el = document.documentElement;
    const requestFS = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (requestFS) requestFS.call(el).catch(() => console.warn("Fullscreen API blocked"));
    setAntiCheatActive(true);
    setState(prev => ({ ...prev, appState: 'exam' }));
  };

  const jumpToQuestion = (idx) => {
    setState(prev => {
      const newQStates = [...prev.qStates];
      if (newQStates[prev.currentIdx].status === 'nv') newQStates[prev.currentIdx].status = 'na';
      const sec = EXAM_DATA.sections.find(s => idx >= s.start && idx <= s.end);
      return { ...prev, currentIdx: idx, activeSectionId: sec.id, qStates: newQStates };
    });
  };

  const handleOption = (optIdx) => {
    setState(prev => {
      const newQStates = [...prev.qStates];
      newQStates[prev.currentIdx].selected = optIdx;
      return { ...prev, qStates: newQStates };
    });
  };

  const moveToNext = (statusIfSelected, statusIfNot) => {
    setState(prev => {
      const newQStates = [...prev.qStates];
      const q = newQStates[prev.currentIdx];
      q.status = q.selected !== null ? statusIfSelected : statusIfNot;
      
      const nextIdx = prev.currentIdx < TOTAL_Q - 1 ? prev.currentIdx + 1 : prev.currentIdx;
      const sec = EXAM_DATA.sections.find(s => nextIdx >= s.start && nextIdx <= s.end);
      return { ...prev, currentIdx: nextIdx, activeSectionId: sec.id, qStates: newQStates };
    });
  };

  const clearResponse = () => {
    setState(prev => {
      const newQStates = [...prev.qStates];
      newQStates[prev.currentIdx].selected = null;
      newQStates[prev.currentIdx].status = 'na';
      return { ...prev, qStates: newQStates };
    });
  };

  const submitExam = () => {
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(()=>{});
    forceSubmit(null);
  };

  // --- RENDERS ---
  const renderInstructions = () => (
    <div className="h-dvh overflow-y-auto bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden mb-4">
        <div className="bg-blue-800 p-6 text-white text-center">
          <h1 className="text-2xl font-bold">{EXAM_DATA.title}</h1>
        </div>
        <div className="p-6">
          <h3 className="font-bold text-lg mb-2">Instructions:</h3>
          <ul className="list-decimal pl-5 mb-6">
            <li>Duration: <strong>{EXAM_DATA.durationMinutes} minutes</strong>.</li>
            <li>Timer will auto-submit when it reaches zero.</li>
            <li>Navigating away from the app will force an auto-submission.</li>
          </ul>
          <button onClick={beginExam} className="bg-blue-600 text-white font-bold py-3 px-8 rounded w-full">I am ready to begin</button>
          <button onClick={onClose} className="mt-4 bg-gray-200 text-gray-800 font-bold py-3 px-8 rounded w-full">Cancel and return to Portal</button>
        </div>
      </div>
    </div>
  );

  const renderExam = () => {
    const q = EXAM_DATA.questions[state.currentIdx];
    const qState = state.qStates[state.currentIdx];
    const activeSection = EXAM_DATA.sections.find(s => s.id === state.activeSectionId);

    return (
      <div className="flex flex-col h-dvh bg-gray-50 text-left">
        <header className="bg-slate-900 text-white shadow-md flex justify-between items-center px-4 py-3 shrink-0">
          <div className="font-bold">CBT Simulator</div>
          <div className="flex gap-2 bg-slate-800 px-4 py-2 rounded-full text-red-400 font-mono tracking-wider font-bold">
            {formatTime(state.timeLeft)}
          </div>
          <button onClick={() => setState(p => ({...p, isSidebarOpen: !p.isSidebarOpen}))} className="md:hidden bg-blue-600 p-2 rounded">Menu</button>
        </header>

        <div className="flex flex-1 overflow-hidden relative">
          <div className="flex-1 flex flex-col bg-white">
            <div className="flex overflow-x-auto hide-scrollbar border-b shrink-0">
              {EXAM_DATA.sections.map(s => (
                <button key={s.id} onClick={() => jumpToQuestion(s.start)} className={`px-6 py-3 font-semibold border-b-4 ${state.activeSectionId === s.id ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-transparent text-gray-600'}`}>
                  {s.name}
                </button>
              ))}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
              <h2 className="text-xl font-bold border-b pb-2 mb-4">Question {state.currentIdx + 1}</h2>
              <div className="text-lg mb-6">{q.text}</div>
              <div className="space-y-3">
                {q.options.map((opt, i) => (
                  <div key={i} onClick={() => handleOption(i)} className={`flex items-center p-4 rounded-lg border-2 cursor-pointer ${qState.selected === i ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>
                    <div className={`w-6 h-6 rounded-full border-2 mr-4 flex justify-center items-center ${qState.selected === i ? 'border-blue-600 bg-blue-600' : 'border-gray-400'}`}>
                      {qState.selected === i && <div className="w-2 h-2 rounded-full bg-white"></div>}
                    </div>
                    <span>{opt}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-100 border-t p-4 safe-pb flex flex-wrap gap-2 justify-between">
              <div className="flex gap-2">
                <button onClick={() => moveToNext('amr', 'mr')} className="bg-white border border-blue-400 text-blue-700 font-semibold py-2 px-4 rounded text-sm">Mark & Next</button>
                <button onClick={clearResponse} className="bg-white border border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded text-sm">Clear</button>
              </div>
              <button onClick={() => moveToNext('ans', 'na')} className="bg-green-600 text-white font-bold py-2 px-8 rounded">Save & Next</button>
            </div>
          </div>

          {/* Sidebar */}
          <div className={`fixed md:static inset-y-0 right-0 z-40 w-80 bg-blue-50 border-l flex flex-col transform transition-transform ${state.isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
            <div className="p-4 bg-white border-b flex justify-between items-center shrink-0">
              <div><div className="font-bold">{EXAM_DATA.candidateName}</div><div className="text-xs text-gray-500">{EXAM_DATA.candidateId}</div></div>
              <button onClick={() => setState(p => ({...p, isSidebarOpen: false}))} className="md:hidden text-gray-500">Close</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="font-bold text-sm mb-3 text-blue-900 border-b pb-2">{activeSection.name}</div>
              <div className="grid grid-cols-5 gap-3">
                {Array.from({length: activeSection.end - activeSection.start + 1}).map((_, i) => {
                  const qId = activeSection.start + i;
                  return <div key={qId} onClick={() => jumpToQuestion(qId)} className={`q-btn status-${state.qStates[qId].status}`}>{qId + 1}</div>
                })}
              </div>
            </div>

            <div className="p-4 bg-white border-t shrink-0 safe-pb">
              <button onClick={() => setModalConfig({ msg: 'Submit the final exam?', onConfirm: submitExam })} className="w-full bg-blue-700 text-white font-bold py-3 rounded">Submit Exam</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const correct = state.qStates.filter((q, i) => (q.status === 'ans' || q.status === 'amr') && q.selected === EXAM_DATA.questions[i].correct).length;
    return (
      <div className="h-dvh overflow-y-auto bg-gray-50 flex items-center justify-center p-4 text-center">
        <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-blue-900 text-white p-8"><h2 className="text-3xl font-bold">Exam Submitted</h2></div>
          <div className="p-8">
            {state.submissionReason && <div className="bg-red-50 p-4 mb-4 text-red-800 text-sm">{state.submissionReason}</div>}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50 p-4 rounded border"><div className="text-3xl font-bold">{correct}</div><div className="text-xs text-gray-500">Correct</div></div>
              <div className="bg-gray-50 p-4 rounded border"><div className="text-3xl font-bold">{TOTAL_Q - correct}</div><div className="text-xs text-gray-500">Incorrect</div></div>
            </div>
            <button onClick={() => setState(p => ({...p, appState: 'review'}))} className="bg-slate-800 text-white font-bold py-3 px-8 rounded w-full mb-3">Review Answers</button>
            <button onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-3 px-8 rounded w-full">Exit to Portal</button>
          </div>
        </div>
      </div>
    );
  };

  const renderReview = () => (
    <div className="h-dvh overflow-y-auto bg-gray-100 pb-12 text-left">
      <header className="bg-white shadow-sm sticky top-0 p-4 flex justify-between items-center"><h1 className="font-bold">Exam Review</h1><button onClick={() => setState(p => ({...p, appState: 'results'}))} className="bg-gray-800 text-white px-4 py-2 rounded">Back</button></header>
      <div className="max-w-4xl mx-auto p-4">
        {EXAM_DATA.questions.map((q, idx) => {
          const qState = state.qStates[idx];
          return (
            <div key={idx} className="bg-white p-6 rounded-xl border mb-6">
              <h3 className="font-bold mb-4">Q{idx + 1}. {q.text}</h3>
              {q.options.map((opt, oIdx) => (
                <div key={oIdx} className={`p-3 border rounded mb-2 ${oIdx === q.correct ? 'bg-green-50 border-green-500' : qState.selected === oIdx ? 'bg-red-50 border-red-400' : 'border-gray-200'}`}>
                  {String.fromCharCode(65 + oIdx)}. {opt}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {state.appState === 'instructions' && renderInstructions()}
      {state.appState === 'exam' && renderExam()}
      {state.appState === 'results' && renderResults()}
      {state.appState === 'review' && renderReview()}

      {modalConfig && (
        <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded text-center w-full max-w-sm">
            <h3 className="font-bold mb-6">{modalConfig.msg}</h3>
            <div className="flex gap-2">
              <button onClick={() => setModalConfig(null)} className="flex-1 bg-gray-200 py-2 rounded font-bold">Cancel</button>
              <button onClick={() => { modalConfig.onConfirm(); setModalConfig(null); }} className="flex-1 bg-blue-600 text-white py-2 rounded font-bold">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}