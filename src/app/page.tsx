"use client";

import { useState, useEffect } from "react";
import { Loader2, ArrowRight, BookOpen, Layers, Printer, CheckSquare, Search as SearchIcon, FileText, CheckCircle, SplitSquareVertical, ChevronDown, ChevronUp, Volume2, History, X, Trash2, LibraryBig, FileEdit, Menu } from "lucide-react";

export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedSentenceIndex, setSelectedSentenceIndex] = useState<number | null>(null);
  const [isInputCollapsed, setIsInputCollapsed] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [globalVocab, setGlobalVocab] = useState<any[]>([]);
  const [wordbookOpen, setWordbookOpen] = useState(false);
  const [wordQuizMode, setWordQuizMode] = useState(false);
  const [wordQuizList, setWordQuizList] = useState<any[]>([]);
  const [isAddingWord, setIsAddingWord] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [options, setOptions] = useState({
    targetLevel: '중2',
    syntax: true,
    vocab: true,
    grammarQuiz: true,
    cloze: true,
    translation: true,
    quizCount: 3,
  });

  useEffect(() => {
    const saved = localStorage.getItem('tprep_history');
    if (saved) setHistory(JSON.parse(saved));
    const savedVocab = localStorage.getItem('tprep_global_vocab');
    if (savedVocab) setGlobalVocab(JSON.parse(savedVocab));
  }, []);

  const toggleOption = (key: keyof typeof options) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    setSelectedSentenceIndex(null);
    setIsInputCollapsed(false);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, options }),
      });
      const data = await res.json();
      setResult(data);
      setIsInputCollapsed(true);

      const newRecord = {
        id: Date.now(),
        date: new Date().toISOString(),
        summary: data.summary,
        text: text,
        result: data,
      };
      const updatedHistory = [newRecord, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('tprep_history', JSON.stringify(updatedHistory));

      if (data.vocabulary && data.vocabulary.length > 0) {
        const savedVocab = JSON.parse(localStorage.getItem('tprep_global_vocab') || '[]');
        const merged = [...savedVocab];
        data.vocabulary.forEach((v: any) => {
          if (!merged.find((m: any) => m.word.toLowerCase() === v.word.toLowerCase())) {
            merged.push(v);
          }
        });
        setGlobalVocab(merged);
        localStorage.setItem('tprep_global_vocab', JSON.stringify(merged));
      }

    } catch (error) {
      console.error(error);
      alert("분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSpeak = (textToSpeak: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    } else {
      alert("이 브라우저에서는 음성 듣기 기능을 지원하지 않습니다.");
    }
  };

  const loadHistory = (record: any) => {
    setText(record.text);
    setResult(record.result);
    setSelectedSentenceIndex(null);
    setIsInputCollapsed(true);
    setHistoryOpen(false);
  };

  const handleTextSelection = async () => {
    if (isAddingWord) return;
    const selection = window.getSelection();
    if (!selection) return;
    const word = selection.toString().trim();
    
    // 단순 알파벳 단어인지 검증 (너무 긴 문장 선택 등 방지)
    if (!word || !/^[a-zA-Z\-']+$/.test(word) || word.length > 30) return;

    // 이미 주요 어휘에 있는지 확인
    const alreadyIn = result?.vocabulary?.find((v:any) => v.word.toLowerCase() === word.toLowerCase());
    if (alreadyIn) {
      selection.removeAllRanges();
      return;
    }

    if (confirm(`'${word}' 단어를 주요 어휘와 단어장에 추가하시겠습니까?`)) {
      setIsAddingWord(true);
      try {
        const res = await fetch('/api/dictionary', {
          method: 'POST',
          body: JSON.stringify({ word }),
        });
        const data = await res.json();
        
        // 결과 업데이트
        const newVocabList = result?.vocabulary ? [...result.vocabulary, data] : [data];
        setResult((prev: any) => ({...prev, vocabulary: newVocabList}));
        
        // 단어장 업데이트
        const updatedGlobal = [...globalVocab.filter(v => v.word.toLowerCase() !== data.word.toLowerCase()), data];
        setGlobalVocab(updatedGlobal);
        localStorage.setItem('tprep_global_vocab', JSON.stringify(updatedGlobal));
        
      } catch (e) {
        alert("단어 추가에 실패했습니다.");
      } finally {
        setIsAddingWord(false);
        selection.removeAllRanges();
      }
    } else {
      selection.removeAllRanges();
    }
  };

  const generateWordQuiz = () => {
    if (globalVocab.length === 0) {
      alert("단어장에 저장된 단어가 없습니다.");
      return;
    }
    const shuffled = [...globalVocab].sort(() => 0.5 - Math.random()).slice(0, Math.min(20, globalVocab.length));
    setWordQuizList(shuffled);
    setWordQuizMode(true);
    setWordbookOpen(false);
  };

  const renderHighlightedSentence = (sentence: string, highlights?: string[]) => {
    if (!highlights || highlights.length === 0) return <span>{sentence}</span>;
    let parts: { text: string; highlight: boolean }[] = [{ text: sentence, highlight: false }];
    
    highlights.forEach((h) => {
      const newParts: { text: string; highlight: boolean }[] = [];
      parts.forEach((p) => {
        if (p.highlight) {
          newParts.push(p);
        } else {
          const regexStr = h.replace(/[.*+?^$\\{\\}()|[\\]\\\\]/g, '\\\\$&');
          const splitArr = p.text.split(new RegExp(`(${regexStr})`, 'gi'));
          splitArr.forEach((s) => {
            if (s.toLowerCase() === h.toLowerCase()) {
              newParts.push({ text: s, highlight: true });
            } else if (s) {
              newParts.push({ text: s, highlight: false });
            }
          });
        }
      });
      parts = newParts;
    });

    return (
      <>
        {parts.map((p, i) => (
          p.highlight ? <span key={i} className="bg-yellow-200 text-yellow-900 font-bold px-1 rounded mx-[1px]">{p.text}</span> : <span key={i}>{p.text}</span>
        ))}
      </>
    );
  };

  if (wordQuizMode) {
    return (
      <div className="bg-white min-h-screen text-black">
        <div className="max-w-4xl mx-auto p-12">
          <div className="flex justify-between items-center print:hidden mb-12 border-b border-slate-200 pb-4">
             <h2 className="text-2xl font-bold flex items-center gap-2"><FileEdit className="w-6 h-6"/> 단어 시험지 미리보기</h2>
             <div className="flex gap-4">
               <button onClick={() => setWordQuizMode(false)} className="px-6 py-2 bg-slate-200 hover:bg-slate-300 font-bold rounded-lg transition-colors">돌아가기</button>
               <button onClick={handlePrint} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-2 transition-colors"><Printer className="w-4 h-4"/> 인쇄하기</button>
             </div>
          </div>
          
          <div className="text-center mb-12 border-b-2 border-black pb-6">
             <h1 className="text-4xl font-bold font-serif mb-4 tracking-wide">Vocabulary Quiz</h1>
             <div className="flex justify-between mt-8 text-base font-medium px-4">
               <span>Class: ________________________</span>
               <span>Date: ________________________</span>
               <span>Name: ________________________</span>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-x-16 gap-y-10 text-xl font-serif">
             {wordQuizList.map((v, i) => (
               <div key={i} className="flex items-end justify-between border-b border-slate-300 pb-2">
                 <span className="font-bold mr-4 text-slate-800">{i+1}.</span>
                 <span className="w-5/12 text-left">{i % 2 === 0 ? v.word : v.meaning}</span>
                 <span className="flex-1 inline-block"></span>
               </div>
             ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-[100dvh] bg-slate-50 text-slate-800 font-sans">
      {/* Sidebar Overlay for Mobile */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 w-64 bg-white border-r border-slate-200 p-6 flex-col shrink-0 print:hidden shadow-sm z-50 overflow-y-auto transform transition-transform duration-300 md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0 flex' : '-translate-x-full hidden md:flex'}`}>
        <div className="flex justify-between items-center mb-10 text-blue-600">
          <div className="flex items-center gap-2">
            <BookOpen className="w-8 h-8" />
            <h1 className="text-2xl font-bold tracking-tight">T-Prep</h1>
          </div>
          <button className="md:hidden text-slate-400 hover:text-slate-600" onClick={() => setMobileMenuOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">생성 옵션</h2>
        <div className="space-y-2 flex-grow">
          {[
            { id: 'syntax', label: '구문 분석', icon: <SearchIcon className="w-4 h-4" /> },
            { id: 'vocab', label: '주요 어휘 리스트', icon: <BookOpen className="w-4 h-4" /> },
            { id: 'grammarQuiz', label: '객관식 문법 문항', icon: <CheckCircle className="w-4 h-4" /> },
            { id: 'cloze', label: '빈칸 추론 문항', icon: <SplitSquareVertical className="w-4 h-4" /> },
            { id: 'translation', label: '직독직해 / 해석', icon: <FileText className="w-4 h-4" /> },
          ].map((opt) => (
            <label key={opt.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-200">
              <div className={`flex items-center justify-center w-5 h-5 rounded border ${options[opt.id as keyof typeof options] ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 text-transparent'}`}>
                <CheckSquare className="w-3.5 h-3.5" />
              </div>
              <span className={`text-sm font-medium flex items-center gap-2 ${options[opt.id as keyof typeof options] ? 'text-slate-900' : 'text-slate-500'}`}>
                {opt.icon} {opt.label}
              </span>
              {/* @ts-ignore */}
              <input type="checkbox" className="hidden" checked={options[opt.id]} onChange={() => toggleOption(opt.id as any)} />
            </label>
          ))}
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 flex items-center justify-between shrink-0 print:hidden shadow-sm z-10 sticky top-0 md:static">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg md:text-xl font-semibold truncate">새 학습자료 만들기</h2>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button onClick={() => setWordbookOpen(true)} className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 text-xs md:text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors shadow-sm">
              <LibraryBig className="w-4 h-4" /> <span className="hidden sm:inline">단어장</span>
            </button>
            <button onClick={() => setHistoryOpen(true)} className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 text-xs md:text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
              <History className="w-4 h-4" /> <span className="hidden sm:inline">기록</span>
            </button>
            {result && (
              <button onClick={handlePrint} className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors shadow-sm">
                <Printer className="w-4 h-4" /> 인쇄 (PDF)
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-8 print:p-0">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Input Form */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 print:hidden overflow-hidden transition-all duration-300">
              <div 
                className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => setIsInputCollapsed(!isInputCollapsed)}
              >
                <h3 className="font-semibold flex items-center gap-2 text-slate-700">
                  <FileText className="w-5 h-5 text-blue-600" />
                  원본 지문 입력
                </h3>
                <button className="text-slate-400 hover:text-slate-600">
                  {isInputCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                </button>
              </div>
              
              {!isInputCollapsed && (
                <div className="p-6">
                  <textarea
                    className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all resize-none text-base"
                    placeholder="여기에 수업할 영어 지문을 붙여넣으세요..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-end mt-4 gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Target Level */}
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">대상 학년 / 수준</label>
                        <select 
                          value={options.targetLevel}
                          onChange={(e) => setOptions(prev => ({...prev, targetLevel: e.target.value}))}
                          className="w-32 p-2 border border-slate-300 rounded-lg focus:outline-blue-500 focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 font-bold text-slate-700 cursor-pointer"
                        >
                          <option value="중1">중1</option>
                          <option value="중2">중2</option>
                          <option value="중3">중3</option>
                          <option value="고1">고1</option>
                          <option value="고2">고2</option>
                          <option value="고3(수능)">고3(수능)</option>
                        </select>
                      </div>

                      {/* Quiz Count */}
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">문제 수 (객관식/빈칸)</label>
                        <input 
                          type="number" 
                          min="1" 
                          max="10" 
                          value={options.quizCount}
                          onChange={(e) => setOptions(prev => ({...prev, quizCount: parseInt(e.target.value) || 3}))}
                          className="w-20 p-2 border border-slate-300 rounded-lg text-center focus:outline-blue-500 focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 font-bold"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleAnalyze}
                      disabled={loading || !text.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-sm h-[42px]"
                    >
                      {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> 정밀 분석 중...</> : <><Layers className="w-5 h-5" /> AI 분석 시작</>}
                    </button>
                  </div>
                </div>
              )}
            </section>

            {loading && (
              <div className="flex flex-col items-center justify-center py-20 text-blue-600 print:hidden">
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <p className="font-medium animate-pulse text-lg">AI가 문장별로 세밀하게 분석하고 있습니다...</p>
              </div>
            )}

            {/* Print Header */}
            <div className="hidden print:block mb-8 text-center border-b-2 border-slate-800 pb-4">
              <h1 className="text-3xl font-bold font-serif mb-2">T-Prep Worksheet</h1>
              <div className="flex justify-between mt-4 text-sm font-medium">
                <span>Class: __________________</span>
                <span>Date: __________________</span>
                <span>Name: __________________</span>
              </div>
            </div>

            {/* Results */}
            {result && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                
                {/* Level & Summary */}
                <div className="flex items-center gap-4 bg-slate-100 p-4 rounded-xl print:bg-transparent print:border-b print:rounded-none print:px-0">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-bold print:border print:border-slate-800 print:text-slate-800 print:bg-transparent">{result.level}</span>
                  <p className="text-slate-700 font-medium">{result.summary}</p>
                </div>

                {/* Interactive Syntax Viewer / Original Text Display */}
                <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-0">
                  <div className="flex items-center justify-between mb-4 print:hidden border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">본문 {options.syntax ? '(모르는 단어를 더블 클릭하면 단어장에 자동 추가됩니다)' : ''}</h3>
                    <div className="flex items-center gap-2">
                      {isAddingWord && <span className="text-xs text-indigo-600 animate-pulse font-bold flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> 단어 뜻 검색 중...</span>}
                      <button onClick={() => handleSpeak(text)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors border border-blue-200 shadow-sm">
                        <Volume2 className="w-4 h-4" /> 발음 듣기
                      </button>
                    </div>
                  </div>
                  <div 
                    className="text-lg leading-[2.2] text-slate-800 font-serif text-justify selection:bg-indigo-100 selection:text-indigo-900"
                    onMouseUp={handleTextSelection}
                  >
                    {options.syntax && result.sentences ? (
                      result.sentences.map((s: any, idx: number) => (
                        <span 
                          key={idx} 
                          onClick={() => setSelectedSentenceIndex(idx)}
                          className={`cursor-pointer rounded px-1 transition-all duration-200 ${selectedSentenceIndex === idx ? 'bg-blue-50 text-blue-900 ring-2 ring-blue-300 print:bg-transparent print:ring-0' : 'hover:bg-slate-100 print:hover:bg-transparent'}`}
                        >
                          {selectedSentenceIndex === idx ? renderHighlightedSentence(s.original, s.highlights) : s.original}{" "}
                        </span>
                      ))
                    ) : (
                      <span className="whitespace-pre-wrap">{text}</span>
                    )}
                  </div>
                </section>

                {/* Selected Sentence Detail */}
                {options.syntax && selectedSentenceIndex !== null && result.sentences[selectedSentenceIndex] && (
                  <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl shadow-inner animate-in fade-in slide-in-from-top-4 print:hidden">
                    <h4 className="text-blue-800 font-bold mb-4 flex items-center gap-2"><SearchIcon className="w-5 h-5"/> 문장 상세 구문 분석</h4>
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">직독직해</p>
                        <p className="text-slate-800 font-medium leading-relaxed">{result.sentences[selectedSentenceIndex].direct_translation}</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">상세 구문 및 문법 구조 설명</p>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{result.sentences[selectedSentenceIndex].grammar_explanation}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Translation & Teaching Tips */}
                {options.translation && result.translation && (
                  <section className="flex flex-col gap-6 print:hidden">
                    <div className="bg-green-50 border border-green-100 p-6 rounded-2xl shadow-sm">
                      <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2"><FileText className="w-5 h-5"/> 전문 해석</h3>
                      <p className="text-green-900 leading-relaxed text-base whitespace-pre-wrap">{result.translation}</p>
                    </div>
                    {result.teaching_tips && result.teaching_tips.length > 0 && (
                      <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl shadow-sm">
                        <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2"><BookOpen className="w-5 h-5"/> 핵심 강의 팁</h3>
                        <ul className="list-disc list-inside text-amber-900 text-sm space-y-2">
                          {result.teaching_tips.map((tip: string, idx: number) => <li key={idx}>{tip}</li>)}
                        </ul>
                      </div>
                    )}
                  </section>
                )}

                {/* Vocabulary List */}
                {options.vocab && result.vocabulary && result.vocabulary.length > 0 && (
                  <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-0 print:mt-8">
                    <h3 className="text-lg font-bold text-slate-800 border-b pb-3 mb-4">주요 어휘</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {result.vocabulary.map((v: any, idx: number) => (
                        <div key={idx} className="flex flex-col p-4 rounded-xl bg-slate-50 border border-slate-100 print:bg-transparent print:border-b print:border-slate-300 print:rounded-none">
                          <p className="font-bold text-slate-900 text-lg">{v.word} <span className="text-base font-normal text-slate-600 ml-2">{v.meaning}</span></p>
                          <p className="text-sm text-slate-500 italic mt-1 leading-relaxed">"{v.example}"</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Grammar Questions */}
                {options.grammarQuiz && result.grammar_questions && result.grammar_questions.length > 0 && (
                  <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-0 print:mt-8">
                    <h3 className="text-lg font-bold text-slate-800 border-b pb-3 mb-4">객관식 문법 문항</h3>
                    <div className="space-y-8">
                      {result.grammar_questions.map((q: any, idx: number) => (
                        <div key={idx} className="print:break-inside-avoid">
                          <p className="font-medium text-slate-800 mb-3 leading-relaxed"><span className="text-blue-600 font-bold mr-2 print:text-slate-800">Q{idx + 1}.</span>{q.question}</p>
                          <div className="grid grid-cols-1 gap-2 mb-3 pl-6">
                            {q.options?.map((opt: string, i: number) => (
                              <label key={i} className="flex items-start gap-3 text-slate-700">
                                <span className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-xs shrink-0 print:border-slate-800 mt-0.5">
                                  {i + 1}
                                </span>
                                <span className="leading-relaxed">{opt}</span>
                              </label>
                            ))}
                          </div>
                          <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-sm print:hidden mt-4">
                            <span className="font-bold text-blue-700 mr-2 block mb-1">정답: {q.answer}</span>
                            <span className="text-slate-600 leading-relaxed block">{q.explanation}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Cloze Test */}
                {options.cloze && result.cloze_questions && result.cloze_questions.length > 0 && (
                  <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-0 print:mt-8">
                    <h3 className="text-lg font-bold text-slate-800 border-b pb-3 mb-4">빈칸 추론 문항</h3>
                    <div className="space-y-8">
                      {result.cloze_questions.map((q: any, idx: number) => (
                        <div key={idx} className="print:break-inside-avoid">
                          <p className="font-medium text-slate-800 mb-3 leading-relaxed"><span className="text-blue-600 font-bold mr-2 print:text-slate-800">Q{idx + 1}.</span>{q.question}</p>
                          <div className="flex flex-wrap gap-2 pl-6 mb-3">
                            {q.distractors && [q.answer, ...q.distractors].sort().map((opt: string, i: number) => (
                              <span key={i} className="px-4 py-1.5 rounded-full border border-slate-200 text-slate-700 text-sm bg-slate-50 print:bg-transparent print:border-slate-400">
                                {opt}
                              </span>
                            ))}
                          </div>
                          <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-sm print:hidden mt-4">
                            <span className="font-bold text-blue-700 mr-2 block mb-1">정답: {q.answer}</span>
                            <span className="text-slate-600 leading-relaxed block">{q.explanation}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

              </div>
            )}
            
          </div>
        </div>
      </main>

      {/* Wordbook Modal */}
      {wordbookOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-indigo-50 rounded-t-2xl">
              <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2"><LibraryBig className="w-6 h-6 text-indigo-600"/> 내 단어장</h2>
              <div className="flex items-center gap-4">
                <button 
                  onClick={generateWordQuiz}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                >
                  <FileEdit className="w-4 h-4"/> 시험지 만들기
                </button>
                <button onClick={() => setWordbookOpen(false)} className="text-indigo-400 hover:text-indigo-600 bg-white rounded-full p-1 shadow-sm border border-indigo-200"><X className="w-5 h-5"/></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              {globalVocab.length > 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-4 font-bold text-slate-600 w-1/4">영단어</th>
                        <th className="p-4 font-bold text-slate-600 w-1/4">뜻</th>
                        <th className="p-4 font-bold text-slate-600">예문</th>
                        <th className="p-4 w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {globalVocab.map((v, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-bold text-indigo-700">{v.word}</td>
                          <td className="p-4 text-slate-700">{v.meaning}</td>
                          <td className="p-4 text-sm text-slate-500 italic">"{v.example}"</td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => {
                                const newVocab = globalVocab.filter((_, i) => i !== idx);
                                setGlobalVocab(newVocab);
                                localStorage.setItem('tprep_global_vocab', JSON.stringify(newVocab));
                              }}
                              className="text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-20">
                  <LibraryBig className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium text-lg">단어장에 저장된 단어가 없습니다.</p>
                  <p className="text-slate-400 text-sm mt-2">지문을 분석하거나 본문에서 모르는 단어를 클릭하여 추가해 보세요.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><History className="w-5 h-5 text-blue-600"/> 지난 분석 기록</h2>
              <button onClick={() => setHistoryOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 shadow-sm border border-slate-200"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="relative">
                <SearchIcon className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="본문 내용이나 키워드로 이전 기록을 검색해 보세요..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
              {history.filter(h => h.text.toLowerCase().includes(searchTerm.toLowerCase()) || (h.summary && h.summary.toLowerCase().includes(searchTerm.toLowerCase()))).map((record) => (
                <div key={record.id} className="p-5 border border-slate-200 bg-white rounded-xl hover:border-blue-400 hover:shadow-md cursor-pointer transition-all group" onClick={() => loadHistory(record)}>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">{new Date(record.date).toLocaleString()}</span>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const newHist = history.filter(h => h.id !== record.id);
                        setHistory(newHist); 
                        localStorage.setItem('tprep_history', JSON.stringify(newHist)); 
                      }} 
                      className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                  <p className="font-bold text-slate-800 mb-2 text-base">{record.summary}</p>
                  <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{record.text}</p>
                </div>
              ))}
              {history.length === 0 && (
                <div className="text-center py-16">
                  <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">저장된 분석 기록이 없습니다.</p>
                  <p className="text-slate-400 text-sm mt-1">지문을 분석하면 자동으로 이곳에 저장됩니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
