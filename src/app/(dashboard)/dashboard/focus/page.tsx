"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Timer, Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles,
  CheckCircle2, Clock, BarChart2, Award, Zap, BookOpen, Coffee,
  CloudRain, Waves
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function FocusPage() {
  const [loading, setLoading] = useState(true);
  const [focusSessions, setFocusSessions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  // Timer States
  const [timerType, setTimerType] = useState<"pomodoro" | "short_break" | "long_break">("pomodoro");
  const [workMode, setWorkMode] = useState<"study" | "deep_work" | "reading">("study");
  const [timeRemaining, setTimeRemaining] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState("none");

  // Custom Focus duration settings
  const [customFocusDuration, setCustomFocusDuration] = useState(25);

  // Audio system states
  const [activeSounds, setActiveSounds] = useState({
    rain: false,
    waves: false,
    cafe: false,
  });
  const [soundVolumes, setSoundVolumes] = useState({
    rain: 0.5,
    waves: 0.5,
    cafe: 0.5,
  });

  // Interval and timing Refs
  const intervalRef = useRef<any>(null);
  const totalDurationRef = useRef(25 * 60);
  const endTimeRef = useRef<number | null>(null);

  // Audio elements references
  const audioPlayersRef = useRef<{
    rain: HTMLAudioElement | null;
    waves: HTMLAudioElement | null;
    cafe: HTMLAudioElement | null;
  }>({
    rain: null,
    waves: null,
    cafe: null,
  });

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: sessionsData } = await supabase
        .from("focus_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false });

      const { data: subjectsData } = await supabase
        .from("subjects")
        .select("*")
        .eq("user_id", user.id);

      setFocusSessions(sessionsData || []);
      setSubjects(subjectsData || []);
      setLoading(false);
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle timer type switches
  const handleSetTimerType = (type: typeof timerType, customMins?: number) => {
    setTimerRunning(false);
    setTimerType(type);

    let mins = 25;
    if (type === "short_break") mins = 5;
    else if (type === "long_break") mins = 15;
    else if (type === "pomodoro") mins = customMins ?? customFocusDuration;

    setTimeRemaining(mins * 60);
    totalDurationRef.current = mins * 60;
  };

  // Keep handleTimerComplete fresh to avoid stale closures
  const handleTimerCompleteRef = useRef(handleTimerComplete);
  useEffect(() => {
    handleTimerCompleteRef.current = handleTimerComplete;
  }, [handleTimerComplete]);

  // Audio preloading and lifecycle setup
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioPlayersRef.current.rain = new Audio("https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg");
      audioPlayersRef.current.rain.loop = true;

      audioPlayersRef.current.waves = new Audio("https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg");
      audioPlayersRef.current.waves.loop = true;

      audioPlayersRef.current.cafe = new Audio("https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg");
      audioPlayersRef.current.cafe.loop = true;
    }

    return () => {
      const players = audioPlayersRef.current;
      if (players.rain) { players.rain.pause(); players.rain = null; }
      if (players.waves) { players.waves.pause(); players.waves = null; }
      if (players.cafe) { players.cafe.pause(); players.cafe = null; }
    };
  }, []);

  // Manage audio playback and volume sync dynamically
  useEffect(() => {
    const players = audioPlayersRef.current;
    if (!players) return;

    if (players.rain) players.rain.volume = soundVolumes.rain;
    if (players.waves) players.waves.volume = soundVolumes.waves;
    if (players.cafe) players.cafe.volume = soundVolumes.cafe;

    if (timerRunning) {
      if (activeSounds.rain) {
        players.rain?.play().catch(err => console.log("Autoplay block rain:", err));
      } else {
        players.rain?.pause();
      }

      if (activeSounds.waves) {
        players.waves?.play().catch(err => console.log("Autoplay block waves:", err));
      } else {
        players.waves?.pause();
      }

      if (activeSounds.cafe) {
        players.cafe?.play().catch(err => console.log("Autoplay block cafe:", err));
      } else {
        players.cafe?.pause();
      }
    } else {
      players.rain?.pause();
      players.waves?.pause();
      players.cafe?.pause();
    }
  }, [timerRunning, activeSounds, soundVolumes]);

  // Timer ticking logic using Date.now() timestamp difference to withstand browser background tab throttling
  useEffect(() => {
    if (timerRunning) {
      endTimeRef.current = Date.now() + timeRemaining * 1000;

      intervalRef.current = setInterval(() => {
        if (!endTimeRef.current) return;
        const now = Date.now();
        const diff = Math.ceil((endTimeRef.current - now) / 1000);

        if (diff <= 0) {
          setTimeRemaining(0);
          setTimerRunning(false);
          handleTimerCompleteRef.current();
        } else {
          setTimeRemaining(diff);
        }
      }, 250);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      endTimeRef.current = null;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerRunning]);

  // When timer completes
  async function handleTimerComplete() {
    setTimerRunning(false);

    // Stop all ambient sounds
    const players = audioPlayersRef.current;
    if (players.rain) players.rain.pause();
    if (players.waves) players.waves.pause();
    if (players.cafe) players.cafe.pause();

    // Play mock beep sound
    if (typeof window !== "undefined") {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        oscillator.start();
        setTimeout(() => oscillator.stop(), 500);
      } catch (e) {
        // audio context blocked or unsupported
      }
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const sessionDurationMins = Math.round(totalDurationRef.current / 60);
    const subId = selectedSubjectId === "none" ? null : selectedSubjectId;

    // Save Completed focus session
    const payload = {
      user_id: user.id,
      subject_id: subId,
      session_type: timerType === "pomodoro" ? (workMode === "deep_work" ? "deep_work" : "pomodoro") : "break",
      started_at: new Date(Date.now() - totalDurationRef.current * 1000).toISOString(),
      ended_at: new Date().toISOString(),
      duration_minutes: sessionDurationMins,
      score: 95 // standard high focus compliance score
    };

    const { data: newSession, error } = await supabase
      .from("focus_sessions")
      .insert(payload)
      .select()
      .single();

    if (!error && newSession) {
      setFocusSessions(prev => [newSession, ...prev]);

      // Post an achievement notification if they did deep work
      if (timerType === "pomodoro") {
        await supabase.from("notifications").insert({
          user_id: user.id,
          type: "achievement",
          title: "Focus Block Completed! 🎯",
          message: `Awesome! You focused for ${sessionDurationMins} minutes in ${workMode.replace("_", " ")} mode.`
        });
      }
    }

    alert(`Time's up! Session finished.`);
    // Reset timer
    handleSetTimerType(timerType);
  };

  const handleToggleTimer = () => {
    setTimerRunning(!timerRunning);
  };

  const handleResetTimer = () => {
    handleSetTimerType(timerType);
  };

  // Convert time to standard mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Focus stats calculations
  const totalMinutes = focusSessions
    .filter(s => s.session_type !== "break")
    .reduce((acc, s) => acc + (s.duration_minutes || 0), 0);

  const todayStr = new Date().toISOString().split("T")[0];
  const dailyMinutes = focusSessions
    .filter(s => s.session_type !== "break" && s.started_at.split("T")[0] === todayStr)
    .reduce((acc, s) => acc + (s.duration_minutes || 0), 0);

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  const weeklyMinutes = focusSessions
    .filter(s => s.session_type !== "break" && new Date(s.started_at) > startOfWeek)
    .reduce((acc, s) => acc + (s.duration_minutes || 0), 0);

  const progressPct = ((totalDurationRef.current - timeRemaining) / totalDurationRef.current) * 100;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">Focus Space</h1>
          <p className="text-slate-400">Launch Pomodoro focus timers, set background ambiance hums, and review deep work statistics.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        {/* Left pane: Premium Timer UI */}
        <Card className="border-white/10 bg-white/5 p-8 flex flex-col items-center justify-center backdrop-blur-md shadow-glow relative min-h-[480px]">
          {/* Ambient light glow */}
          <div className={`absolute inset-0 bg-gradient-to-tr transition-all duration-700 -z-10 rounded-3xl ${timerRunning
            ? (timerType === "pomodoro" ? "from-red-500/5 to-transparent" : "from-emerald-500/5 to-transparent")
            : "from-cyan-500/5 to-transparent"
            }`} />

          {/* Mode selectors */}
          <div className="flex border-b border-white/5 bg-slate-950/40 p-1.5 rounded-2xl gap-1 mb-8">
            <button
              onClick={() => handleSetTimerType("pomodoro")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition ${timerType === "pomodoro" ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"
                }`}
            >
              <Zap className="h-3.5 w-3.5" /> Focus Block (25m)
            </button>
            <button
              onClick={() => handleSetTimerType("short_break")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition ${timerType === "short_break" ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"
                }`}
            >
              <Coffee className="h-3.5 w-3.5" /> Short Break (5m)
            </button>
            <button
              onClick={() => handleSetTimerType("long_break")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition ${timerType === "long_break" ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"
                }`}
            >
              <Coffee className="h-3.5 w-3.5" /> Long Break (15m)
            </button>
          </div>

          {/* Custom Focus Duration Input */}
          {timerType === "pomodoro" && !timerRunning && (
            <div className="flex flex-col gap-2 mb-6 bg-slate-950/40 p-4 rounded-2xl border border-white/5 w-full max-w-xs animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider pl-1">Focus Duration</span>
                <span className="text-xs font-bold text-white">{customFocusDuration} min</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="5"
                  max="180"
                  step="5"
                  value={customFocusDuration}
                  onChange={(e) => {
                    const mins = parseInt(e.target.value);
                    setCustomFocusDuration(mins);
                    handleSetTimerType("pomodoro", mins);
                  }}
                  className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={customFocusDuration}
                  onChange={(e) => {
                    let mins = parseInt(e.target.value) || 25;
                    if (mins < 5) mins = 5;
                    if (mins > 180) mins = 180;
                    setCustomFocusDuration(mins);
                    handleSetTimerType("pomodoro", mins);
                  }}
                  className="w-16 h-8 text-center bg-slate-900 border border-white/10 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          )}

          {/* Concentric Ticking circle */}
          <div className="relative h-64 w-64 flex items-center justify-center mb-8 select-none">
            {/* SVG circle track */}
            <svg className="absolute inset-0 h-full w-full -rotate-90">
              <circle
                cx="128"
                cy="128"
                r="118"
                stroke="rgba(255,255,255,0.03)"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="128"
                cy="128"
                r="118"
                stroke={timerType === "pomodoro" ? "#3B82F6" : "#10B981"}
                strokeWidth="6"
                fill="transparent"
                strokeDasharray="741"
                strokeDashoffset={741 - (741 * progressPct) / 100}
                className="transition-all duration-300"
              />
            </svg>

            {/* Time display */}
            <div className="flex flex-col items-center justify-center">
              <span className="font-mono text-5xl font-bold text-white tracking-wider">
                {formatTime(timeRemaining)}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">
                {timerRunning ? "Active" : "Paused"}
              </span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-4">
            {/* Reset */}
            <Button
              variant="outline"
              onClick={handleResetTimer}
              className="h-12 w-12 rounded-2xl p-0 border-white/10 bg-slate-950/30 text-slate-400 hover:text-white hover:border-white/20"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>

            {/* Play/Pause */}
            <Button
              onClick={handleToggleTimer}
              className={`h-16 w-16 rounded-3xl p-0 transition-transform hover:scale-105 ${timerRunning ? "bg-white text-slate-950" : "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                }`}
            >
              {timerRunning ? <Pause className="h-6 w-6 fill-slate-950" /> : <Play className="h-6 w-6 fill-slate-950 ml-1" />}
            </Button>

            {/* Skip */}
            <Button
              variant="outline"
              onClick={handleTimerComplete}
              className="h-12 w-12 rounded-2xl p-0 border-white/10 bg-slate-950/30 text-slate-400 hover:text-white hover:border-white/20"
            >
              <CheckCircle2 className="h-5 w-5" />
            </Button>
          </div>

          {/* Sound & Subject options footer */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md mt-10 pt-6 border-t border-white/5">
            {/* Subject mapping */}
            <div className="flex-1 w-full space-y-1">
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider pl-1">Associate Subject</label>
              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General / No Subject</SelectItem>
                  {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Sound Ambiance Mixer */}
            <div className="flex-1 w-full space-y-2">
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider pl-1">Sound Ambiance Mixer</label>
              <div className="space-y-3 bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                {/* Rainforest */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CloudRain className={`h-4 w-4 ${activeSounds.rain ? "text-cyan-400 animate-pulse" : "text-slate-500"}`} />
                      <span className="text-xs font-semibold text-white">Rainforest</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveSounds(prev => ({ ...prev, rain: !prev.rain }))}
                      className={`h-7 px-2.5 text-[10px] rounded-lg ${activeSounds.rain ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-slate-500 hover:text-white"}`}
                    >
                      {activeSounds.rain ? "Active" : "Muted"}
                    </Button>
                  </div>
                  {activeSounds.rain && (
                    <div className="flex items-center gap-2 pl-6">
                      <Volume2 className="h-3 w-3 text-slate-500" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={soundVolumes.rain}
                        onChange={(e) => setSoundVolumes(prev => ({ ...prev, rain: parseFloat(e.target.value) }))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                    </div>
                  )}
                </div>

                {/* Ocean Waves */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Waves className={`h-4 w-4 ${activeSounds.waves ? "text-emerald-400 animate-pulse" : "text-slate-500"}`} />
                      <span className="text-xs font-semibold text-white">Ocean Waves</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveSounds(prev => ({ ...prev, waves: !prev.waves }))}
                      className={`h-7 px-2.5 text-[10px] rounded-lg ${activeSounds.waves ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-slate-500 hover:text-white"}`}
                    >
                      {activeSounds.waves ? "Active" : "Muted"}
                    </Button>
                  </div>
                  {activeSounds.waves && (
                    <div className="flex items-center gap-2 pl-6">
                      <Volume2 className="h-3 w-3 text-slate-500" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={soundVolumes.waves}
                        onChange={(e) => setSoundVolumes(prev => ({ ...prev, waves: parseFloat(e.target.value) }))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                      />
                    </div>
                  )}
                </div>

                {/* Coffee Shop Hum */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coffee className={`h-4 w-4 ${activeSounds.cafe ? "text-fuchsia-400 animate-pulse" : "text-slate-500"}`} />
                      <span className="text-xs font-semibold text-white">Coffee Shop Hum</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveSounds(prev => ({ ...prev, cafe: !prev.cafe }))}
                      className={`h-7 px-2.5 text-[10px] rounded-lg ${activeSounds.cafe ? "bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20" : "text-slate-500 hover:text-white"}`}
                    >
                      {activeSounds.cafe ? "Active" : "Muted"}
                    </Button>
                  </div>
                  {activeSounds.cafe && (
                    <div className="flex items-center gap-2 pl-6">
                      <Volume2 className="h-3 w-3 text-slate-500" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={soundVolumes.cafe}
                        onChange={(e) => setSoundVolumes(prev => ({ ...prev, cafe: parseFloat(e.target.value) }))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-fuchsia-400"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Right pane: Focus statistics */}
        <div className="space-y-6">
          {/* Stats Card */}
          <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
            <CardHeader>
              <CardTitle>Focus Ledger</CardTitle>
              <CardDescription>Tracked hours of completed blocks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Daily */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-white/5 bg-slate-950/40">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-cyan-400" />
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 font-semibold">Today's Focus</span>
                    <h4 className="text-sm font-bold text-white mt-0.5">{dailyMinutes} mins</h4>
                  </div>
                </div>
              </div>

              {/* Weekly */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-white/5 bg-slate-950/40">
                <div className="flex items-center gap-3">
                  <BarChart2 className="h-5 w-5 text-fuchsia-400" />
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 font-semibold">Weekly Focus</span>
                    <h4 className="text-sm font-bold text-white mt-0.5">{weeklyMinutes} mins</h4>
                  </div>
                </div>
              </div>

              {/* Total cumulative */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-white/5 bg-slate-950/40">
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-yellow-400" />
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 font-semibold">Total focus time</span>
                    <h4 className="text-sm font-bold text-white mt-0.5">{totalMinutes} mins</h4>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Focus mode parameters */}
          <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
            <CardHeader>
              <CardTitle>Focus Mode Parameters</CardTitle>
              <CardDescription>Toggles for session study presets.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {[
                { id: "study", name: "Study Mode", desc: "Default focus targeting regular subjects." },
                { id: "deep_work", name: "Deep Work Mode", desc: "Full concentration flow. Highly isolated." },
                { id: "reading", name: "Reading Mode", desc: "For reviews and content reading." },
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setWorkMode(mode.id as any)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all ${workMode === mode.id
                    ? "border-cyan-400 bg-cyan-400/5 text-white"
                    : "border-white/5 bg-slate-950/30 text-slate-400 hover:bg-slate-950/50"
                    }`}
                >
                  <h5 className="text-xs font-bold">{mode.name}</h5>
                  <p className="text-[10px] mt-0.5 text-slate-500">{mode.desc}</p>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
