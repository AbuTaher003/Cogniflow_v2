"use client";

import { useEffect, useState, useRef, useCallback, memo } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Briefcase, Plus, Trash2, Edit2, Eye, Download, GripVertical,
  GraduationCap, Code2, Award, FolderOpen, User, Mail, Phone,
  MapPin, Globe, Linkedin, Github, FileText, Sparkles, ChevronDown, Printer
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/* ─── Types ─── */
interface ResumeSection {
  id: string;
  resume_id: string;
  section_type: string;
  title: string;
  data: any;
  sort_order: number;
}

interface Resume {
  id: string;
  title: string;
  template: string;
  full_name: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  summary: string;
  sections?: ResumeSection[];
}

const TEMPLATES = [
  { id: "modern", label: "Modern", desc: "Bold gradient headers, clean typography", color: "from-cyan-500 to-blue-600" },
  { id: "professional", label: "Professional", desc: "Classic corporate layout", color: "from-slate-700 to-slate-900" },
  { id: "minimal", label: "Minimal", desc: "Clean whitespace, elegant simplicity", color: "from-gray-200 to-white" },
  { id: "ats", label: "ATS Friendly", desc: "Optimized for applicant tracking systems", color: "from-emerald-500 to-teal-600" },
];

const SECTION_TYPES = [
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "skills", label: "Skills", icon: Code2 },
  { id: "projects", label: "Projects", icon: FolderOpen },
  { id: "certifications", label: "Certifications", icon: Award },
];

/* ─── Section Editor ─── */
const SectionEditor = memo(function SectionEditor({ section, onUpdate, onDelete }: { section: ResumeSection; onUpdate: (s: ResumeSection) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [localData, setLocalData] = useState(section.data);

  useEffect(() => {
    setLocalData(section.data);
  }, [section.data]);

  const handleSave = () => {
    onUpdate({ ...section, data: localData });
    setEditing(false);
  };

  const renderEditFields = () => {
    switch (section.section_type) {
      case "experience":
        return (
          <div className="space-y-3">
            {(localData.items || [{ company: "", position: "", duration: "", description: "" }]).map((item: any, i: number) => (
              <div key={i} className="space-y-2 rounded-xl border border-white/5 p-3 bg-slate-950/30">
                <Input placeholder="Company" value={item.company || ""} onChange={e => {
                  const items = [...(localData.items || [])]; items[i] = { ...items[i], company: e.target.value }; setLocalData({ ...localData, items });
                }} />
                <Input placeholder="Position" value={item.position || ""} onChange={e => {
                  const items = [...(localData.items || [])]; items[i] = { ...items[i], position: e.target.value }; setLocalData({ ...localData, items });
                }} />
                <Input placeholder="Duration (e.g. Jan 2024 - Present)" value={item.duration || ""} onChange={e => {
                  const items = [...(localData.items || [])]; items[i] = { ...items[i], duration: e.target.value }; setLocalData({ ...localData, items });
                }} />
                <textarea className="w-full min-h-[60px] rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none" placeholder="Description & achievements" value={item.description || ""} onChange={e => {
                  const items = [...(localData.items || [])]; items[i] = { ...items[i], description: e.target.value }; setLocalData({ ...localData, items });
                }} />
                <Button variant="ghost" size="sm" className="text-rose-400 text-xs" onClick={() => {
                  const items = (localData.items || []).filter((_: any, idx: number) => idx !== i); setLocalData({ ...localData, items });
                }}><Trash2 className="h-3 w-3 mr-1" /> Remove</Button>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="text-cyan-400 text-xs" onClick={() => {
              setLocalData({ ...localData, items: [...(localData.items || []), { company: "", position: "", duration: "", description: "" }] });
            }}><Plus className="h-3 w-3 mr-1" /> Add Experience</Button>
          </div>
        );
      case "education":
        return (
          <div className="space-y-3">
            {(localData.items || [{ school: "", degree: "", duration: "", gpa: "" }]).map((item: any, i: number) => (
              <div key={i} className="space-y-2 rounded-xl border border-white/5 p-3 bg-slate-950/30">
                <Input placeholder="School / University" value={item.school || ""} onChange={e => {
                  const items = [...(localData.items || [])]; items[i] = { ...items[i], school: e.target.value }; setLocalData({ ...localData, items });
                }} />
                <Input placeholder="Degree & Major" value={item.degree || ""} onChange={e => {
                  const items = [...(localData.items || [])]; items[i] = { ...items[i], degree: e.target.value }; setLocalData({ ...localData, items });
                }} />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Duration" value={item.duration || ""} onChange={e => {
                    const items = [...(localData.items || [])]; items[i] = { ...items[i], duration: e.target.value }; setLocalData({ ...localData, items });
                  }} />
                  <Input placeholder="GPA" value={item.gpa || ""} onChange={e => {
                    const items = [...(localData.items || [])]; items[i] = { ...items[i], gpa: e.target.value }; setLocalData({ ...localData, items });
                  }} />
                </div>
                <Button variant="ghost" size="sm" className="text-rose-400 text-xs" onClick={() => {
                  const items = (localData.items || []).filter((_: any, idx: number) => idx !== i); setLocalData({ ...localData, items });
                }}><Trash2 className="h-3 w-3 mr-1" /> Remove</Button>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="text-cyan-400 text-xs" onClick={() => {
              setLocalData({ ...localData, items: [...(localData.items || []), { school: "", degree: "", duration: "", gpa: "" }] });
            }}><Plus className="h-3 w-3 mr-1" /> Add Education</Button>
          </div>
        );
      case "skills":
        return (
          <div className="space-y-2">
            <Input placeholder="Comma-separated skills (e.g. React, TypeScript, Python)" value={localData.skills || ""} onChange={e => setLocalData({ ...localData, skills: e.target.value })} />
          </div>
        );
      case "projects":
        return (
          <div className="space-y-3">
            {(localData.items || [{ name: "", tech: "", description: "", url: "" }]).map((item: any, i: number) => (
              <div key={i} className="space-y-2 rounded-xl border border-white/5 p-3 bg-slate-950/30">
                <Input placeholder="Project Name" value={item.name || ""} onChange={e => {
                  const items = [...(localData.items || [])]; items[i] = { ...items[i], name: e.target.value }; setLocalData({ ...localData, items });
                }} />
                <Input placeholder="Technologies Used" value={item.tech || ""} onChange={e => {
                  const items = [...(localData.items || [])]; items[i] = { ...items[i], tech: e.target.value }; setLocalData({ ...localData, items });
                }} />
                <textarea className="w-full min-h-[60px] rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none" placeholder="Description" value={item.description || ""} onChange={e => {
                  const items = [...(localData.items || [])]; items[i] = { ...items[i], description: e.target.value }; setLocalData({ ...localData, items });
                }} />
                <Button variant="ghost" size="sm" className="text-rose-400 text-xs" onClick={() => {
                  const items = (localData.items || []).filter((_: any, idx: number) => idx !== i); setLocalData({ ...localData, items });
                }}><Trash2 className="h-3 w-3 mr-1" /> Remove</Button>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="text-cyan-400 text-xs" onClick={() => {
              setLocalData({ ...localData, items: [...(localData.items || []), { name: "", tech: "", description: "", url: "" }] });
            }}><Plus className="h-3 w-3 mr-1" /> Add Project</Button>
          </div>
        );
      case "certifications":
        return (
          <div className="space-y-3">
            {(localData.items || [{ name: "", issuer: "", date: "", url: "" }]).map((item: any, i: number) => (
              <div key={i} className="space-y-2 rounded-xl border border-white/5 p-3 bg-slate-950/30">
                <Input placeholder="Certification Name" value={item.name || ""} onChange={e => {
                  const items = [...(localData.items || [])]; items[i] = { ...items[i], name: e.target.value }; setLocalData({ ...localData, items });
                }} />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Issuer" value={item.issuer || ""} onChange={e => {
                    const items = [...(localData.items || [])]; items[i] = { ...items[i], issuer: e.target.value }; setLocalData({ ...localData, items });
                  }} />
                  <Input placeholder="Date" value={item.date || ""} onChange={e => {
                    const items = [...(localData.items || [])]; items[i] = { ...items[i], date: e.target.value }; setLocalData({ ...localData, items });
                  }} />
                </div>
                <Button variant="ghost" size="sm" className="text-rose-400 text-xs" onClick={() => {
                  const items = (localData.items || []).filter((_: any, idx: number) => idx !== i); setLocalData({ ...localData, items });
                }}><Trash2 className="h-3 w-3 mr-1" /> Remove</Button>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="text-cyan-400 text-xs" onClick={() => {
              setLocalData({ ...localData, items: [...(localData.items || []), { name: "", issuer: "", date: "", url: "" }] });
            }}><Plus className="h-3 w-3 mr-1" /> Add Certification</Button>
          </div>
        );
      default:
        return null;
    }
  };

  const sectionType = SECTION_TYPES.find(s => s.id === section.section_type);
  const Icon = sectionType?.icon || FileText;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-slate-500 cursor-grab" />
          <Icon className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-semibold text-white">{sectionType?.label || section.section_type}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setEditing(!editing)}>
            <Edit2 className="h-3 w-3 mr-1" /> {editing ? "Collapse" : "Edit"}
          </Button>
          <Button variant="ghost" size="sm" className="text-rose-400 text-xs" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <AnimatePresence>
        {editing && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            {renderEditFields()}
            <div className="flex justify-end mt-3">
              <Button variant="primary" size="sm" onClick={handleSave}>Save Section</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

/* ─── Resume Preview ─── */
const ResumePreview = memo(function ResumePreview({ resume, sections }: { resume: Resume; sections: ResumeSection[] }) {
  const sorted = [...sections].sort((a, b) => a.sort_order - b.sort_order);
  const template = resume.template || "modern";

  const headerStyles: Record<string, string> = {
    modern: "bg-gradient-to-r from-cyan-600 to-blue-700 text-white p-8",
    professional: "bg-slate-800 text-white p-8",
    minimal: "border-b-2 border-gray-300 pb-6 mb-6",
    ats: "border-b border-gray-400 pb-4 mb-4",
  };

  const sectionHeaderStyles: Record<string, string> = {
    modern: "text-cyan-600 text-lg font-bold border-b-2 border-cyan-200 pb-1 mb-3",
    professional: "text-slate-800 text-lg font-bold border-b border-slate-300 pb-1 mb-3 uppercase tracking-wider text-sm",
    minimal: "text-gray-900 text-base font-semibold mb-2",
    ats: "text-black text-sm font-bold uppercase border-b border-black pb-1 mb-2",
  };

  return (
    <div className="bg-white text-gray-900 shadow-2xl rounded-lg overflow-hidden print:shadow-none" id="resume-preview">
      {/* Header */}
      <div className={headerStyles[template]}>
        <h1 className={`font-bold ${template === "ats" ? "text-xl" : "text-2xl"} ${template === "minimal" ? "text-gray-900" : ""}`}>
          {resume.full_name || "Your Name"}
        </h1>
        <div className={`flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs ${template === "modern" || template === "professional" ? "text-white/80" : "text-gray-600"}`}>
          {resume.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {resume.email}</span>}
          {resume.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {resume.phone}</span>}
          {resume.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {resume.location}</span>}
          {resume.website && <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {resume.website}</span>}
          {resume.linkedin && <span className="flex items-center gap-1"><Linkedin className="h-3 w-3" /> {resume.linkedin}</span>}
          {resume.github && <span className="flex items-center gap-1"><Github className="h-3 w-3" /> {resume.github}</span>}
        </div>
      </div>

      <div className={`p-6 ${template === "ats" ? "p-4 text-sm" : ""}`}>
        {/* Summary */}
        {resume.summary && (
          <div className="mb-4">
            <h2 className={sectionHeaderStyles[template]}>Summary</h2>
            <p className="text-gray-700 text-sm leading-relaxed">{resume.summary}</p>
          </div>
        )}

        {/* Dynamic sections */}
        {sorted.map(section => (
          <div key={section.id} className="mb-4">
            <h2 className={sectionHeaderStyles[template]}>
              {SECTION_TYPES.find(s => s.id === section.section_type)?.label || section.section_type}
            </h2>
            {section.section_type === "experience" && (section.data.items || []).map((item: any, i: number) => (
              <div key={i} className="mb-3">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-sm">{item.position}</span>
                  <span className="text-xs text-gray-500">{item.duration}</span>
                </div>
                <p className="text-xs text-gray-600 italic">{item.company}</p>
                {item.description && <p className="text-xs text-gray-700 mt-1 leading-relaxed">{item.description}</p>}
              </div>
            ))}
            {section.section_type === "education" && (section.data.items || []).map((item: any, i: number) => (
              <div key={i} className="mb-3">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-sm">{item.degree}</span>
                  <span className="text-xs text-gray-500">{item.duration}</span>
                </div>
                <p className="text-xs text-gray-600">{item.school}{item.gpa ? ` — GPA: ${item.gpa}` : ""}</p>
              </div>
            ))}
            {section.section_type === "skills" && section.data.skills && (
              <div className="flex flex-wrap gap-1">
                {section.data.skills.split(",").map((s: string, i: number) => (
                  <span key={i} className={`inline-block px-2 py-0.5 text-xs rounded ${template === "modern" ? "bg-cyan-50 text-cyan-700" : template === "professional" ? "bg-slate-100 text-slate-700" : "bg-gray-100 text-gray-700"}`}>
                    {s.trim()}
                  </span>
                ))}
              </div>
            )}
            {section.section_type === "projects" && (section.data.items || []).map((item: any, i: number) => (
              <div key={i} className="mb-3">
                <span className="font-semibold text-sm">{item.name}</span>
                {item.tech && <span className="text-xs text-gray-500 ml-2">({item.tech})</span>}
                {item.description && <p className="text-xs text-gray-700 mt-1">{item.description}</p>}
              </div>
            ))}
            {section.section_type === "certifications" && (section.data.items || []).map((item: any, i: number) => (
              <div key={i} className="mb-2 flex justify-between items-baseline">
                <div>
                  <span className="font-semibold text-sm">{item.name}</span>
                  {item.issuer && <span className="text-xs text-gray-500 ml-2">— {item.issuer}</span>}
                </div>
                {item.date && <span className="text-xs text-gray-500">{item.date}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
});

/* ─── Main Page ─── */
export default function ResumePage() {
  const [loading, setLoading] = useState(true);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [activeResume, setActiveResume] = useState<Resume | null>(null);
  const [sections, setSections] = useState<ResumeSection[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newTitle, setNewTitle] = useState("My Resume");
  const [newTemplate, setNewTemplate] = useState("modern");

  const supabase = createClient();
  const printRef = useRef<HTMLDivElement>(null);

  const pendingUpdatesRef = useRef<Partial<Resume>>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeResumeIdRef = useRef<string | null>(null);
  const activeResumeRef = useRef<Resume | null>(null);

  // Sync ref values with activeResume state
  useEffect(() => {
    activeResumeRef.current = activeResume;
    if (activeResume) {
      activeResumeIdRef.current = activeResume.id;
    } else {
      activeResumeIdRef.current = null;
    }
  }, [activeResume]);

  const loadSections = useCallback(async (resumeId: string) => {
    const { data } = await supabase.from("resume_sections").select("*").eq("resume_id", resumeId).order("sort_order");
    setSections(data || []);
  }, [supabase]);

  const saveResumeToDb = useCallback(async (resumeId: string, updates: Partial<Resume>) => {
    if (Object.keys(updates).length === 0) return;
    try {
      await supabase.from("resumes").update(updates).eq("id", resumeId);
    } catch (err) {
      console.error("Failed to save resume: ", err);
    }
  }, [supabase]);

  const flushPendingUpdates = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    if (activeResumeIdRef.current && Object.keys(pendingUpdatesRef.current).length > 0) {
      const updates = { ...pendingUpdatesRef.current };
      pendingUpdatesRef.current = {};
      await saveResumeToDb(activeResumeIdRef.current, updates);
    }
  }, [saveResumeToDb]);

  // Flush any pending updates when the component unmounts
  useEffect(() => {
    return () => {
      if (activeResumeIdRef.current && Object.keys(pendingUpdatesRef.current).length > 0) {
        const updates = { ...pendingUpdatesRef.current };
        supabase.from("resumes").update(updates).eq("id", activeResumeIdRef.current);
      }
    };
  }, [supabase]);

  const handleUpdateResume = useCallback((updates: Partial<Resume>) => {
    const currentResume = activeResumeRef.current;
    if (!currentResume) return;

    // 1. Sync React state instantly
    const updated = { ...currentResume, ...updates };
    setActiveResume(updated);
    setResumes(prev => prev.map(r => r.id === currentResume.id ? updated : r));

    // 2. Accumulate updates in ref
    pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };

    // 3. Debounce the DB call
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const currentId = currentResume.id;
    saveTimeoutRef.current = setTimeout(async () => {
      if (Object.keys(pendingUpdatesRef.current).length > 0) {
        const updatesToSave = { ...pendingUpdatesRef.current };
        pendingUpdatesRef.current = {};
        await saveResumeToDb(currentId, updatesToSave);
      }
    }, 1000);
  }, [saveResumeToDb]);

  const handleSwitchResume = useCallback(async (r: Resume) => {
    if (activeResumeIdRef.current === r.id) return;
    await flushPendingUpdates();
    setActiveResume(r);
    await loadSections(r.id);
  }, [flushPendingUpdates, loadSections]);

  useEffect(() => {
    loadResumes();
  }, []);

  async function loadResumes() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase.from("resumes").select("*").eq("user_id", user.id).order("updated_at", { ascending: false });
    setResumes(data || []);
    if (data && data.length > 0) {
      setActiveResume(data[0]);
      await loadSections(data[0].id);
    }
    setLoading(false);
  }

  async function handleCreateResume() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase.from("resumes").insert({
      user_id: user.id, title: newTitle, template: newTemplate,
      full_name: "", email: user.email || "", phone: "", location: "",
      website: "", linkedin: "", github: "", summary: "",
    }).select().single();

    if (!error && data) {
      setResumes(prev => [data, ...prev]);
      setActiveResume(data);
      setSections([]);
      setShowCreateModal(false);
      setNewTitle("My Resume");
    }
  }

  async function handleDeleteResume(id: string) {
    if (!confirm("Delete this resume?")) return;
    if (activeResumeIdRef.current === id) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      pendingUpdatesRef.current = {};
    }
    await supabase.from("resumes").delete().eq("id", id);
    setResumes(prev => prev.filter(r => r.id !== id));
    if (activeResume?.id === id) {
      const remaining = resumes.filter(r => r.id !== id);
      setActiveResume(remaining[0] || null);
      if (remaining[0]) loadSections(remaining[0].id);
      else setSections([]);
    }
  }

  async function handleAddSection(type: string) {
    if (!activeResume) return;
    const defaultData: Record<string, any> = {
      experience: { items: [{ company: "", position: "", duration: "", description: "" }] },
      education: { items: [{ school: "", degree: "", duration: "", gpa: "" }] },
      skills: { skills: "" },
      projects: { items: [{ name: "", tech: "", description: "" }] },
      certifications: { items: [{ name: "", issuer: "", date: "" }] },
    };
    const { data, error } = await supabase.from("resume_sections").insert({
      resume_id: activeResume.id, section_type: type,
      title: SECTION_TYPES.find(s => s.id === type)?.label || type,
      data: defaultData[type] || {}, sort_order: sections.length,
    }).select().single();

    if (!error && data) {
      setSections(prev => [...prev, data]);
      setShowAddSection(false);
    }
  }

  const handleUpdateSection = useCallback(async (updated: ResumeSection) => {
    await supabase.from("resume_sections").update({ data: updated.data }).eq("id", updated.id);
    setSections(prev => prev.map(s => s.id === updated.id ? updated : s));
  }, [supabase]);

  const handleDeleteSection = useCallback(async (id: string) => {
    await supabase.from("resume_sections").delete().eq("id", id);
    setSections(prev => prev.filter(s => s.id !== id));
  }, [supabase]);

  const handleReorder = useCallback(async (newSections: ResumeSection[]) => {
    setSections(newSections);
    try {
      const promises = newSections.map((section, idx) => 
        supabase
          .from("resume_sections")
          .update({ sort_order: idx })
          .eq("id", section.id)
      );
      await Promise.all(promises);
    } catch (err) {
      console.error("Failed to update section orders: ", err);
    }
  }, [supabase]);

  function handlePrint() {
    const content = document.getElementById("resume-preview");
    if (!content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>${activeResume?.full_name || "Resume"}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; }
        ${content.innerHTML ? "" : ""}
      </style>
      </head><body>${content.outerHTML}</body></html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-96 rounded-2xl" /><Skeleton className="h-96 rounded-2xl" /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">Resume Builder</h1>
          <p className="text-slate-400">Create professional resumes with multiple templates and live preview.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} variant="primary" size="lg">
          <Plus className="mr-2 h-4 w-4" /> New Resume
        </Button>
      </div>

      {/* Resume Selector */}
      {resumes.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {resumes.map(r => (
            <motion.button key={r.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => handleSwitchResume(r)}
              className={`relative rounded-2xl border px-4 py-3 text-left transition-all ${activeResume?.id === r.id ? "border-cyan-400/50 bg-cyan-500/10 text-white shadow-glow" : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20"}`}
            >
              <span className="text-sm font-semibold block">{r.title}</span>
              <span className="text-[10px] text-slate-500">{TEMPLATES.find(t => t.id === r.template)?.label}</span>
              <button onClick={(e) => { e.stopPropagation(); handleDeleteResume(r.id); }} className="absolute -right-1 -top-1 rounded-full bg-rose-500/20 p-1 text-rose-400 opacity-0 group-hover:opacity-100 hover:bg-rose-500/30 transition">
                <Trash2 className="h-3 w-3" />
              </button>
            </motion.button>
          ))}
        </div>
      )}

      {activeResume ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Editor Panel */}
          <div className="space-y-4">
            {/* Contact Info */}
            <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-cyan-300 flex items-center gap-2">
                  <User className="h-4 w-4" /> Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Full Name" value={activeResume.full_name || ""} onChange={e => handleUpdateResume({ full_name: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Email" value={activeResume.email || ""} onChange={e => handleUpdateResume({ email: e.target.value })} />
                  <Input placeholder="Phone" value={activeResume.phone || ""} onChange={e => handleUpdateResume({ phone: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Location" value={activeResume.location || ""} onChange={e => handleUpdateResume({ location: e.target.value })} />
                  <Input placeholder="Website" value={activeResume.website || ""} onChange={e => handleUpdateResume({ website: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="LinkedIn" value={activeResume.linkedin || ""} onChange={e => handleUpdateResume({ linkedin: e.target.value })} />
                  <Input placeholder="GitHub" value={activeResume.github || ""} onChange={e => handleUpdateResume({ github: e.target.value })} />
                </div>
                <textarea className="w-full min-h-[80px] rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none" placeholder="Professional Summary" value={activeResume.summary || ""} onChange={e => handleUpdateResume({ summary: e.target.value })} />
              </CardContent>
            </Card>

            {/* Template Selector */}
            <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-fuchsia-300 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Template
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => handleUpdateResume({ template: t.id })}
                      className={`rounded-xl border p-3 text-left transition-all ${activeResume.template === t.id ? "border-cyan-400/50 bg-cyan-500/10 scale-[1.02]" : "border-white/10 bg-slate-950/30 hover:border-white/20"}`}
                    >
                      <div className={`h-2 rounded-full bg-gradient-to-r ${t.color} mb-2`} />
                      <span className="text-xs font-semibold text-white">{t.label}</span>
                      <p className="text-[10px] text-slate-500">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sections */}
            <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-emerald-300 flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Sections
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-cyan-400 text-xs" onClick={() => setShowAddSection(true)}>
                    <Plus className="h-3 w-3 mr-1" /> Add Section
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {sections.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-white/10 rounded-2xl">
                    No sections yet. Add Experience, Education, Skills, etc.
                  </div>
                ) : (
                  <Reorder.Group axis="y" values={sections} onReorder={handleReorder} className="space-y-3">
                    {sections.map(section => (
                      <Reorder.Item key={section.id} value={section} className="focus:outline-none">
                        <SectionEditor section={section} onUpdate={handleUpdateSection} onDelete={() => handleDeleteSection(section.id)} />
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Eye className="h-4 w-4" /> Live Preview
              </h2>
              <Button variant="primary" size="sm" onClick={handlePrint}>
                <Printer className="h-3 w-3 mr-1" /> Export PDF
              </Button>
            </div>
            <div className="max-h-[800px] overflow-y-auto rounded-2xl border border-white/10" ref={printRef}>
              <ResumePreview resume={activeResume} sections={sections} />
            </div>
          </div>
        </div>
      ) : (
        <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Briefcase className="h-12 w-12 text-slate-500 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Resumes Yet</h3>
            <p className="text-sm text-slate-400 mb-6">Create your first professional resume with our builder.</p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}><Plus className="mr-2 h-4 w-4" /> Create Resume</Button>
          </CardContent>
        </Card>
      )}

      {/* Create Resume Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="border-white/10 bg-slate-950 text-white max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Create New Resume</DialogTitle>
            <DialogDescription>Choose a name and template for your resume.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold">Resume Title</label>
              <Input placeholder="My Resume" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold">Template</label>
              <Select value={newTemplate} onValueChange={setNewTemplate}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateResume}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Section Modal */}
      <Dialog open={showAddSection} onOpenChange={setShowAddSection}>
        <DialogContent className="border-white/10 bg-slate-950 text-white max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>Add Section</DialogTitle>
            <DialogDescription>Choose a section type to add to your resume.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {SECTION_TYPES.map(type => {
              const exists = sections.some(s => s.section_type === type.id);
              return (
                <button key={type.id} disabled={exists} onClick={() => handleAddSection(type.id)}
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${exists ? "opacity-40 cursor-not-allowed" : "hover:bg-white/5 cursor-pointer"}`}
                >
                  <type.icon className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-semibold text-white">{type.label}</span>
                  {exists && <Badge variant="outline" className="ml-auto text-[10px]">Added</Badge>}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
