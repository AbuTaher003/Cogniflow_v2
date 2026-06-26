"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Plus, Edit2, Trash2, Search, Star, Archive, Save, Loader2,
  Folder, Tag, BookOpen, Clock, FileUp, Sparkles, AlertCircle, Eye, EyeOff
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NotesPage() {
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  // Selection
  const [selectedNote, setSelectedNote] = useState<any>(null);

  // Sidebar states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "favorites" | "archived">("all");

  // Editor values
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteSubjectId, setNoteSubjectId] = useState("none");
  const [noteTags, setNoteTags] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isArchived, setIsArchived] = useState(false);

  // Editor configuration
  const [previewMode, setPreviewMode] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);

  // Debounce ref
  const saveTimeoutRef = useRef<any>(null);
  const isInitialMount = useRef(true);

  const supabase = createClient();

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: notesData } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    const { data: subjectsData } = await supabase
      .from("subjects")
      .select("*")
      .eq("user_id", user.id);

    const processedNotes = (notesData || []).map(n => ({
      ...n,
      archived: n.tags ? n.tags.includes("_archived_") : false,
      tags: n.tags ? n.tags.filter((t: string) => t !== "_archived_") : []
    }));

    setNotes(processedNotes || []);
    setSubjects(subjectsData || []);

    if (processedNotes && processedNotes.length > 0) {
      handleSelectNote(processedNotes[0]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleRefresh = () => {
      loadData();
    };
    window.addEventListener("dashboard-refresh", handleRefresh);
    return () => window.removeEventListener("dashboard-refresh", handleRefresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle selected note change
  const handleSelectNote = (note: any) => {
    setSelectedNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content || "");
    setNoteSubjectId(note.subject_id || "none");
    setNoteTags(note.tags ? note.tags.filter((t: string) => t !== "_archived_").join(", ") : "");
    setIsPinned(note.pinned || false);
    setIsArchived(note.archived || false);
    // Reset initial mount flag to skip auto-save on select load
    isInitialMount.current = true;
  };

  // Debounced auto-save triggers on title or content change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!selectedNote) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      handleAutoSave();
    }, 1200); // 1.2 second debounce

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [noteTitle, noteContent, noteSubjectId, noteTags, isPinned, isArchived]);

  // Save implementation
  const handleAutoSave = async () => {
    if (!selectedNote) return;
    setAutoSaving(true);

    const tagsArr = noteTags.split(",").map(t => t.trim()).filter(Boolean);
    const subId = noteSubjectId === "none" ? null : noteSubjectId;

    let finalTags = [...tagsArr];
    if (isArchived) {
      finalTags = [...finalTags.filter(t => t !== "_archived_"), "_archived_"];
    } else {
      finalTags = finalTags.filter(t => t !== "_archived_");
    }

    const payload = {
      title: noteTitle || "Untitled Note",
      content: noteContent,
      subject_id: subId,
      tags: finalTags,
      pinned: isPinned,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from("notes")
      .update(payload)
      .eq("id", selectedNote.id);

    if (!error) {
      setNotes(prev => prev.map(n => n.id === selectedNote.id ? {
        ...n,
        ...payload,
        archived: isArchived,
        tags: tagsArr
      } : n));
    }
    setAutoSaving(false);
  };

  // Manual save trigger
  const handleForceSave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    handleAutoSave();
  };

  // CREATE Note
  const handleCreateNote = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      title: "Untitled Note",
      content: "",
      pinned: false,
      tags: [],
      format: "markdown"
    };

    const { data, error } = await supabase
      .from("notes")
      .insert(payload)
      .select()
      .single();

    if (!error && data) {
      const processed = {
        ...data,
        archived: false,
        tags: []
      };
      setNotes(prev => [processed, ...prev]);
      handleSelectNote(processed);
    }
  };

  // DELETE Note
  const handleDeleteNote = async (noteId: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      const { error } = await supabase.from("notes").delete().eq("id", noteId);
      if (!error) {
        const remaining = notes.filter(n => n.id !== noteId);
        setNotes(remaining);
        if (selectedNote?.id === noteId) {
          if (remaining.length > 0) {
            handleSelectNote(remaining[0]);
          } else {
            setSelectedNote(null);
          }
        }
      }
    }
  };

  // Filter lists
  const getFilteredNotes = () => {
    let list = [...notes];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(n => n.title.toLowerCase().includes(q) || (n.content && n.content.toLowerCase().includes(q)));
    }

    // Tab Filter
    if (filterMode === "favorites") {
      list = list.filter(n => n.pinned);
    } else if (filterMode === "archived") {
      list = list.filter(n => n.archived);
    } else {
      list = list.filter(n => !n.archived);
    }

    return list;
  };

  const filteredNotes = getFilteredNotes();

  // Statistics
  const getNoteStats = () => {
    const words = noteContent.trim() ? noteContent.trim().split(/\s+/).length : 0;
    const readTime = Math.ceil(words / 200); // 200 words per minute average
    return { words, readTime };
  };
  const { words, readTime } = getNoteStats();

  // Simple Markdown compiler regex helper
  const renderMarkdown = (text: string) => {
    if (!text) return '<p class="text-slate-500 italic">No content. Start writing in Markdown...</p>';

    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-white mt-4 mb-2">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-white mt-5 mb-2.5">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-white mt-6 mb-3">$1</h1>');

    // Code Blocks
    html = html.replace(/```([\s\S]*?)```/gm, '<pre class="bg-slate-900 border border-white/5 rounded-2xl p-4 my-4 font-mono text-xs text-cyan-200 overflow-x-auto"><code>$1</code></pre>');

    // Bold / Italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Unordered Lists
    html = html.replace(/^\s*-\s+(.*$)/gim, '<li class="ml-4 list-disc text-slate-300 mt-1">$1</li>');

    // Blockquotes
    html = html.replace(/^\s*>\s+(.*$)/gim, '<blockquote class="border-l-4 border-cyan-400 pl-4 py-1 my-3 bg-white/5 rounded-r-lg text-slate-300 italic">$1</blockquote>');

    // Images: ![alt text](url)
    html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="max-w-full max-h-[400px] object-contain rounded-2xl my-4 border border-white/10" />');

    // Links & PDFs: [text](url)
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:text-cyan-300 underline font-medium inline-flex items-center gap-1">$1</a>');

    // Tables (Simple markdown tables parser)
    html = html.replace(/\|(.+)\|/g, (match, p1) => {
      const cols = p1.split("|").map((c: string) => `<td class="border border-white/10 px-3 py-2 text-xs text-slate-300">${c.trim()}</td>`).join("");
      return `<tr class="border-b border-white/5">${cols}</tr>`;
    });
    // Wrap consecutive table rows into a single table structure
    html = html.replace(/(?:<tr class="border-b border-white\/5">[\s\S]+?<\/tr>\s*)+/g, (match) => {
      return `<table class="w-full text-left my-4 border border-white/10 border-collapse">${match}</table>`;
    });

    // Paragraph breaks
    html = html.replace(/\n\n/g, '</p><p class="text-slate-300 leading-relaxed mt-2">');
    html = `<p class="text-slate-300 leading-relaxed">${html}</p>`;

    return html;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid gap-6 md:grid-cols-[1fr_2.5fr] h-[500px]">
          <Skeleton className="rounded-3xl" />
          <Skeleton className="rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">Lecture Notes</h1>
          <p className="text-slate-400">Capture course contents, catalog tags, and compile Markdown sheets.</p>
        </div>
      </div>

      {/* Main Notion Split layout */}
      <div className="grid gap-6 md:grid-cols-[1.1fr_2.9fr] min-h-[600px] border border-white/10 rounded-3xl overflow-hidden bg-white/5 backdrop-blur-xl">
        {/* Left Sub-sidebar */}
        <div className="border-r border-white/10 bg-slate-950/20 flex flex-col p-4">
          <Button onClick={handleCreateNote} variant="secondary" className="w-full justify-start gap-2 h-10 rounded-xl mb-4">
            <Plus className="h-4 w-4" /> New Page
          </Button>

          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Search pages..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Quick tabs */}
          <div className="grid grid-cols-3 gap-1 bg-slate-950/50 p-1 rounded-xl mb-4">
            {["all", "favorites", "archived"].map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterMode(mode as any)}
                className={`text-[10px] font-semibold py-1.5 rounded-lg capitalize transition ${filterMode === mode ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"
                  }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Notes Preview List */}
          <div className="flex-1 overflow-y-auto space-y-2 max-h-[450px] pr-1">
            {filteredNotes.length === 0 ? (
              <p className="text-center text-xs text-slate-600 py-10">No notes found.</p>
            ) : (
              filteredNotes.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleSelectNote(n)}
                  className={`cursor-pointer rounded-xl border p-3 text-left transition ${selectedNote?.id === n.id
                    ? "border-cyan-400 bg-cyan-400/5 text-white shadow-sm"
                    : "border-transparent text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-xs truncate max-w-[150px] block">
                      {n.title || "Untitled Note"}
                    </span>
                    {n.pinned && <Star className="h-3 w-3 fill-cyan-300 text-cyan-300 shrink-0" />}
                  </div>
                  <p className="text-[10px] text-slate-500 truncate mt-1">
                    {n.content ? n.content.slice(0, 40) : "Empty content..."}
                  </p>
                  <div className="flex items-center justify-between mt-3 text-[9px] text-slate-600">
                    <span>{new Date(n.updated_at).toLocaleDateString()}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(n.id);
                      }}
                      className="p-1 hover:text-rose-400 rounded transition"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Editor Screen */}
        <div className="flex flex-col p-6">
          {!selectedNote ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <FileText className="h-12 w-12 text-slate-500 mb-3" />
              <h3 className="font-semibold text-lg">No Page Selected</h3>
              <p className="text-sm text-slate-400 mt-1">Select a page from the list or add a new page to write notes.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col space-y-4">
              {/* Toolbar metadata header */}
              <div className="flex flex-wrap items-center justify-between border-b border-white/5 pb-4 gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Subject selector */}
                  <div className="w-40">
                    <Select value={noteSubjectId} onValueChange={setNoteSubjectId}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">General / No Subject</SelectItem>
                        {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tags input */}
                  <div className="relative">
                    <Tag className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
                    <input
                      placeholder="Tags (separated by comma)"
                      value={noteTags}
                      onChange={e => setNoteTags(e.target.value)}
                      className="h-8 w-48 rounded-lg border border-white/10 bg-white/5 pl-8 pr-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/40"
                    />
                  </div>
                </div>

                {/* Toolbar actions */}
                <div className="flex items-center gap-2">
                  {/* Favorite toggle */}
                  <button
                    onClick={() => setIsPinned(!isPinned)}
                    className={`p-2 rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10 ${isPinned ? "text-cyan-300" : "text-slate-400"
                      }`}
                    title={isPinned ? "Remove Favorite" : "Bookmark / Favorite"}
                  >
                    <Star className={`h-4 w-4 ${isPinned ? "fill-cyan-300" : ""}`} />
                  </button>

                  {/* Archive toggle */}
                  <button
                    onClick={() => setIsArchived(!isArchived)}
                    className={`p-2 rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10 ${isArchived ? "text-fuchsia-300" : "text-slate-400"
                      }`}
                    title={isArchived ? "Unarchive" : "Archive Page"}
                  >
                    <Archive className="h-4 w-4" />
                  </button>

                  {/* Toggle Preview / Edit */}
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-400 hover:text-white transition"
                  >
                    {previewMode ? (
                      <>
                        <Edit2 className="h-3.5 w-3.5" /> Edit
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5" /> Preview
                      </>
                    )}
                  </button>

                  {/* Auto-Save status Indicator */}
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 min-w-[70px]">
                    {autoSaving ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin text-cyan-300" /> Saving...
                      </>
                    ) : (
                      <>
                        <Save onClick={handleForceSave} className="h-3 w-3 text-slate-600 cursor-pointer hover:text-white transition" /> Auto-saved
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Statistics details */}
              <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono pl-1">
                <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {words} words</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {readTime} min read</span>
              </div>

              {/* Editor Workspace */}
              <div className="flex-1 flex flex-col gap-4">
                {/* Title */}
                <input
                  type="text"
                  placeholder="Untitled Page"
                  value={noteTitle}
                  onChange={e => setNoteTitle(e.target.value)}
                  className="w-full bg-transparent font-display text-2xl font-bold text-white placeholder:text-slate-700 focus:outline-none"
                />

                {/* Body editor workspace */}
                <div className="flex-1 min-h-[350px] flex flex-col">
                  {previewMode ? (
                    // Live Compiled Markdown Preview
                    <div
                      className="flex-1 rounded-2xl border border-white/5 bg-slate-950/20 p-5 overflow-y-auto text-sm text-slate-300 prose prose-invert max-w-none prose-sm"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(noteContent) }}
                    />
                  ) : (
                    // Raw Markdown Textarea
                    <textarea
                      placeholder="Write your note in Markdown. Use # for headers, - for lists, ** for bold, > for quotes, and | for tables..."
                      value={noteContent}
                      onChange={e => setNoteContent(e.target.value)}
                      className="flex-1 w-full rounded-2xl border border-white/10 bg-slate-950/20 p-5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/20 focus:outline-none font-mono resize-none"
                    />
                  )}
                </div>
              </div>

              {/* Attachment simulator */}
              <div className="border border-white/5 rounded-2xl p-4 bg-slate-950/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileUp className="h-5 w-5 text-slate-500" />
                  <div>
                    <h6 className="text-xs font-semibold text-white">Attachment Simulator</h6>
                    <p className="text-[10px] text-slate-500 mt-0.5">Simulate embedding images, slides or lecture PDFs.</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => alert("Upload simulated! File linked successfully.")}>
                  Link PDF / Image
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
