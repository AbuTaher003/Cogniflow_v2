"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Sparkles, BookOpen, FileText, Settings2,
  CalendarDays, Zap, HelpCircle, RefreshCw, Send, CheckCircle2, XCircle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  generateStudyPlan,
  summarizeNote,
  generateQuiz,
  getAISettings,
  saveAISettings,
  QuizQuestion,
  AIProvider
} from "@/lib/ai/provider";

export default function AIAssistantPage() {
  const [activeTab, setActiveTab] = useState("planner");
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);

  // Study Planner States
  const [plannerSubject, setPlannerSubject] = useState("");
  const [plannerGoals, setPlannerGoals] = useState("");
  const [studyPlanResult, setStudyPlanResult] = useState("");

  // Summarizer States
  const [selectedNoteId, setSelectedNoteId] = useState("");
  const [customText, setCustomText] = useState("");
  const [summaryResult, setSummaryResult] = useState("");

  // Quiz States
  const [quizSubject, setQuizSubject] = useState("");
  const [quizTopic, setQuizTopic] = useState("");
  const [quizCount, setQuizCount] = useState(3);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Settings States
  const [provider, setProvider] = useState<AIProvider>("mock");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [modelName, setModelName] = useState("");

  const supabase = createClient();

  useEffect(() => {
    loadNotes();
    loadAISettings();
  }, []);

  async function loadNotes() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("notes").select("id, title, content");
    setNotes(data || []);
  }

  function loadAISettings() {
    const settings = getAISettings();
    setProvider(settings.provider);
    setApiKey(settings.apiKey || "");
    setBaseUrl(settings.baseUrl || "");
    setModelName(settings.modelName || "");
  }

  function handleSaveSettings() {
    saveAISettings({ provider, apiKey, baseUrl, modelName });
    alert("AI settings saved successfully!");
  }

  async function handleGenerateStudyPlan() {
    if (!plannerSubject.trim()) return;
    setLoading(true);
    setStudyPlanResult("");
    try {
      const plan = await generateStudyPlan(plannerSubject, plannerGoals);
      setStudyPlanResult(plan);
    } catch (e) {
      setStudyPlanResult("Failed to generate plan. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSummarizeNote() {
    let content = customText;
    let title = "Custom Text";

    if (selectedNoteId) {
      const selected = notes.find(n => n.id === selectedNoteId);
      if (selected) {
        content = selected.content;
        title = selected.title;
      }
    }

    if (!content.trim()) return;
    setLoading(true);
    setSummaryResult("");
    try {
      const summary = await summarizeNote(title, content);
      setSummaryResult(summary);
    } catch (e) {
      setSummaryResult("Failed to generate note summary.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateQuiz() {
    if (!quizSubject.trim()) return;
    setLoading(true);
    setQuizQuestions([]);
    setCurrentQuestionIdx(0);
    setSelectedOptionIdx(null);
    setQuizAnswered(false);
    setQuizScore(0);
    try {
      const questions = await generateQuiz(quizSubject, quizTopic, quizCount);
      setQuizQuestions(questions);
    } catch (e) {
      alert("Failed to generate quiz. Please check settings.");
    } finally {
      setLoading(false);
    }
  }

  function handleAnswerSelect(idx: number) {
    if (quizAnswered) return;
    setSelectedOptionIdx(idx);
  }

  function handleSubmitAnswer() {
    if (selectedOptionIdx === null || quizAnswered) return;
    const currentQ = quizQuestions[currentQuestionIdx];
    if (selectedOptionIdx === currentQ.answerIndex) {
      setQuizScore(prev => prev + 1);
    }
    setQuizAnswered(true);
  }

  function handleNextQuestion() {
    setSelectedOptionIdx(null);
    setQuizAnswered(false);
    setCurrentQuestionIdx(prev => prev + 1);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Brain className="h-8 w-8 text-cyan-400" />
            AI Study Assistant
          </h1>
          <p className="text-slate-400">Generate study plans, summarize notes, and take dynamic quizzes powered by AI.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 bg-slate-950/80 p-1 rounded-2xl border border-white/10 w-full max-w-xl">
          <TabsTrigger value="planner" className="rounded-xl flex items-center gap-2 text-xs py-2">
            <CalendarDays className="h-4 w-4" /> Study Planner
          </TabsTrigger>
          <TabsTrigger value="summarizer" className="rounded-xl flex items-center gap-2 text-xs py-2">
            <FileText className="h-4 w-4" /> Summarizer
          </TabsTrigger>
          <TabsTrigger value="quiz" className="rounded-xl flex items-center gap-2 text-xs py-2">
            <HelpCircle className="h-4 w-4" /> Quiz Generator
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-xl flex items-center gap-2 text-xs py-2">
            <Settings2 className="h-4 w-4" /> AI Setup
          </TabsTrigger>
        </TabsList>

        {/* STUDY PLANNER TAB */}
        <TabsContent value="planner" className="space-y-6 outline-none">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Input Config */}
            <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-base text-cyan-300">Generate Study Plan</CardTitle>
                <CardDescription>Plan your weekly schedule for any exam or subject.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-semibold">Subject / Topic</label>
                  <Input
                    placeholder="e.g. Data Structures & Algorithms"
                    value={plannerSubject}
                    onChange={e => setPlannerSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-semibold">Duration & Goals</label>
                  <textarea
                    className="w-full min-h-[100px] rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none"
                    placeholder="e.g. Prepare for midterms in 3 weeks, focusing on Graphs and Trees."
                    value={plannerGoals}
                    onChange={e => setPlannerGoals(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleGenerateStudyPlan}
                  variant="primary"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Analyzing & Planning...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" /> Create Study Plan
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results output */}
            <div className="lg:col-span-2 space-y-4">
              {studyPlanResult ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
                    <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between pb-3">
                      <CardTitle className="text-sm font-semibold text-white">Generated Study Plan</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(studyPlanResult)}>
                        Copy
                      </Button>
                    </CardHeader>
                    <CardContent className="pt-4 text-slate-300 text-sm whitespace-pre-wrap leading-relaxed font-sans prose prose-invert max-w-none">
                      {studyPlanResult}
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 border border-dashed border-white/10 rounded-2xl">
                  <CalendarDays className="h-10 w-10 mb-2 opacity-40" />
                  <p className="text-sm">Enter a subject and details to construct a personalized study agenda.</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* SUMMARIZER TAB */}
        <TabsContent value="summarizer" className="space-y-6 outline-none">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-base text-fuchsia-300">Summarize Content</CardTitle>
                <CardDescription>Select notes to compress or paste raw text.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-semibold">Select Existing Note</label>
                  <Select value={selectedNoteId} onValueChange={setSelectedNoteId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Or select one of your notes..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_custom">-- Use Custom Text Below --</SelectItem>
                      {notes.map(n => (
                        <SelectItem key={n.id} value={n.id}>{n.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(!selectedNoteId || selectedNoteId === "_custom") && (
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-semibold">Paste Text</label>
                    <textarea
                      className="w-full min-h-[140px] rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none"
                      placeholder="Paste textbook sections, notes or definitions here..."
                      value={customText}
                      onChange={e => setCustomText(e.target.value)}
                    />
                  </div>
                )}
                <Button
                  onClick={handleSummarizeNote}
                  variant="primary"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Compressing...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" /> Summarize Note
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-4">
              {summaryResult ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
                    <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between pb-3">
                      <CardTitle className="text-sm font-semibold text-white">Summary Summary</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(summaryResult)}>
                        Copy
                      </Button>
                    </CardHeader>
                    <CardContent className="pt-4 text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                      {summaryResult}
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 border border-dashed border-white/10 rounded-2xl">
                  <FileText className="h-10 w-10 mb-2 opacity-40" />
                  <p className="text-sm">Select a note or paste your study material to compile a summary guide.</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* QUIZ GENERATOR TAB */}
        <TabsContent value="quiz" className="space-y-6 outline-none">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-base text-amber-300">Generate Quiz</CardTitle>
                <CardDescription>Test your skills with multiple choice quizzes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-semibold">Subject</label>
                  <Input
                    placeholder="e.g. Physics"
                    value={quizSubject}
                    onChange={e => setQuizSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-semibold">Topic / Scope</label>
                  <Input
                    placeholder="e.g. Newton's Laws"
                    value={quizTopic}
                    onChange={e => setQuizTopic(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-semibold">Number of Questions</label>
                  <Select value={quizCount.toString()} onValueChange={v => setQuizCount(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Questions</SelectItem>
                      <SelectItem value="5">5 Questions</SelectItem>
                      <SelectItem value="10">10 Questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleGenerateQuiz}
                  variant="primary"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Synthesizing Quiz...
                    </>
                  ) : (
                    <>
                      <HelpCircle className="mr-2 h-4 w-4" /> Generate Quiz
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-4">
              {quizQuestions.length > 0 ? (
                <div className="space-y-4">
                  {currentQuestionIdx < quizQuestions.length ? (
                    <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
                      <CardHeader className="border-b border-white/5 pb-3 flex flex-row items-center justify-between">
                        <span className="text-xs font-semibold text-cyan-400">
                          QUESTION {currentQuestionIdx + 1} OF {quizQuestions.length}
                        </span>
                        <span className="text-xs text-slate-500">
                          Score: {quizScore} / {quizQuestions.length}
                        </span>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        <h3 className="text-sm font-semibold text-white leading-relaxed">
                          {quizQuestions[currentQuestionIdx].question}
                        </h3>

                        {/* Options */}
                        <div className="space-y-2 pt-2">
                          {quizQuestions[currentQuestionIdx].options.map((opt, oIdx) => {
                            const isSelected = selectedOptionIdx === oIdx;
                            const isCorrect = quizQuestions[currentQuestionIdx].answerIndex === oIdx;
                            
                            let optClass = "border-white/10 bg-slate-950/30 text-slate-300 hover:border-white/20";
                            if (isSelected) {
                              optClass = "border-cyan-400/50 bg-cyan-500/10 text-white shadow-glow";
                            }
                            if (quizAnswered) {
                              if (isCorrect) {
                                optClass = "border-emerald-500/50 bg-emerald-500/15 text-emerald-300";
                              } else if (isSelected && !isCorrect) {
                                optClass = "border-rose-500/50 bg-rose-500/15 text-rose-300";
                              } else {
                                optClass = "border-white/5 bg-slate-950/10 text-slate-500 opacity-60";
                              }
                            }

                            return (
                              <button
                                key={oIdx}
                                disabled={quizAnswered}
                                onClick={() => handleAnswerSelect(oIdx)}
                                className={`w-full text-left rounded-xl border p-3 text-xs font-medium transition flex items-center justify-between ${optClass}`}
                              >
                                <span>{opt}</span>
                                {quizAnswered && isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                                {quizAnswered && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-rose-400" />}
                              </button>
                            );
                          })}
                        </div>

                        {/* Submit / Explanatory State */}
                        <AnimatePresence>
                          {selectedOptionIdx !== null && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                              {!quizAnswered ? (
                                <Button onClick={handleSubmitAnswer} className="w-full mt-4" variant="primary">
                                  Submit Answer
                                </Button>
                              ) : (
                                <div className="mt-4 p-3 rounded-xl border border-white/5 bg-slate-950/40 space-y-2">
                                  <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                                    {selectedOptionIdx === quizQuestions[currentQuestionIdx].answerIndex ? (
                                      <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Correct!</span>
                                    ) : (
                                      <span className="text-rose-400 flex items-center gap-1"><XCircle className="h-3.5 w-3.5" /> Incorrect</span>
                                    )}
                                  </h4>
                                  <p className="text-xs text-slate-400 leading-relaxed">
                                    {quizQuestions[currentQuestionIdx].explanation}
                                  </p>
                                  <Button onClick={handleNextQuestion} className="w-full mt-2" variant="primary">
                                    {currentQuestionIdx + 1 === quizQuestions.length ? "Finish Quiz" : "Next Question"}
                                  </Button>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md text-center py-10">
                      <CardContent className="space-y-4">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                          <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">Quiz Completed!</h3>
                        <p className="text-sm text-slate-400">
                          You scored <span className="font-bold text-emerald-400">{quizScore}</span> out of <span className="font-semibold text-white">{quizQuestions.length}</span> questions.
                        </p>
                        <Button onClick={handleGenerateQuiz} variant="primary">
                          Retake Quiz
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 border border-dashed border-white/10 rounded-2xl">
                  <HelpCircle className="h-10 w-10 mb-2 opacity-40" />
                  <p className="text-sm">Select a subject and generate questions to launch your interactive quiz.</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* SETTINGS TAB */}
        <TabsContent value="settings" className="space-y-6 outline-none">
          <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md max-w-xl">
            <CardHeader>
              <CardTitle className="text-base text-white">AI Configuration Setup</CardTitle>
              <CardDescription>Select your LLM service provider and configure API keys.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold">API Provider</label>
                <Select value={provider} onValueChange={(v: any) => setProvider(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mock">Mock Mode (Offline Sandbox - Sandbox Fallback)</SelectItem>
                    <SelectItem value="gemini">Google Gemini API</SelectItem>
                    <SelectItem value="openai">OpenAI API</SelectItem>
                    <SelectItem value="claude">Anthropic Claude API</SelectItem>
                    <SelectItem value="ollama">Ollama (Local Host)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {provider !== "mock" && (
                <div className="space-y-4">
                  {provider !== "ollama" && (
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-semibold">API Key</label>
                      <Input
                        type="password"
                        placeholder="sk-..."
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                      />
                    </div>
                  )}
                  {provider === "ollama" && (
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-semibold">Ollama Base URL</label>
                      <Input
                        placeholder="http://localhost:11434"
                        value={baseUrl}
                        onChange={e => setBaseUrl(e.target.value)}
                      />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-semibold">Model Name (Optional)</label>
                    <Input
                      placeholder="e.g. gemini-1.5-pro, gpt-4o, llama3"
                      value={modelName}
                      onChange={e => setModelName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <Button onClick={handleSaveSettings} variant="primary" className="w-full mt-2">
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
