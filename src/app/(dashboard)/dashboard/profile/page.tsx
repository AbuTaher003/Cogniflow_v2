"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  User, GraduationCap, Target, Code2, Save, Loader2,
  CheckCircle2, Sparkles, AlertCircle, Upload, Image as ImageIcon, Trash2, Palette
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  avatarUrl: z.string(),
  avatarType: z.string(),
  avatarValue: z.string(),
  avatarUploadUrl: z.string().nullable(),
  avatarCartoonUrl: z.string().nullable(),
  avatarColorCode: z.string(),
  university: z.string().min(2, "University must be at least 2 characters"),
  department: z.string().min(2, "Department must be at least 2 characters"),
  semester: z.string().min(1, "Please select a semester"),
  targetCgpa: z.number().min(0, "CGPA cannot be negative").max(10, "CGPA cannot exceed 10.00"),
  studyHours: z.number().min(1, "Study hours must be at least 1").max(24, "Maximum 24 hours per day"),
  careerGoal: z.string().min(2, "Please enter a career goal"),
  skills: z.array(z.string()).min(1, "Select at least one skill"),
});

type ProfileValues = z.infer<typeof profileSchema>;

const PRESET_AVATARS = [
  { id: "preset-1", name: "Cyan Spark", bg: "from-cyan-400 to-blue-500" },
  { id: "preset-2", name: "Fuchsia Dream", bg: "from-fuchsia-500 to-purple-600" },
  { id: "preset-3", name: "Sunset Horizon", bg: "from-orange-400 to-rose-500" },
  { id: "preset-4", name: "Emerald Forest", bg: "from-emerald-400 to-teal-500" },
  { id: "preset-5", name: "Neon Glow", bg: "from-indigo-500 to-cyan-500" },
  { id: "preset-6", name: "Royal Purple", bg: "from-violet-500 to-fuchsia-500" },
];

const CARTOON_AVATARS = [
  { id: "cartoon-1", name: "Tech Boy", url: "/avatars/cartoon-1.png" },
  { id: "cartoon-2", name: "Music Girl", url: "/avatars/cartoon-2.png" },
  { id: "cartoon-3", name: "Developer", url: "/avatars/cartoon-3.png" },
  { id: "cartoon-4", name: "Scientist", url: "/avatars/cartoon-4.png" },
  { id: "cartoon-5", name: "Astronaut", url: "/avatars/cartoon-5.png" },
  { id: "cartoon-6", name: "Robo Student", url: "/avatars/cartoon-6.png" },
];

const SKILL_OPTIONS = [
  "Programming",
  "Machine Learning",
  "Data Science",
  "Web Development",
  "Competitive Programming",
  "Research",
];

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const supabase = createClient();

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      avatarUrl: "preset-1",
      avatarType: "color",
      avatarValue: "preset-1",
      avatarUploadUrl: null,
      avatarCartoonUrl: null,
      avatarColorCode: "preset-1",
      university: "",
      department: "",
      semester: "1",
      targetCgpa: 3.5,
      studyHours: 4,
      careerGoal: "",
      skills: [],
    },
  });

  const uploadUrl = form.watch("avatarUploadUrl");
  const cartoonUrl = form.watch("avatarCartoonUrl");
  const colorCode = form.watch("avatarColorCode");
  const selectedSkills = form.watch("skills") || [];

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data && !fetchError) {
        setProfileId(data.id);
        form.reset({
          fullName: data.full_name ?? "",
          avatarUrl: data.avatar_url ?? "preset-1",
          avatarType: (data.avatar_type as any) ?? "color",
          avatarValue: data.avatar_value ?? "preset-1",
          avatarUploadUrl: data.avatar_upload_url ?? null,
          avatarCartoonUrl: data.avatar_cartoon_url ?? null,
          avatarColorCode: data.avatar_color_code ?? "preset-1",
          university: data.university ?? "",
          department: data.department ?? "",
          semester: data.current_semester ? String(data.current_semester) : "1",
          targetCgpa: data.target_cgpa ?? 3.5,
          studyHours: data.study_hours_per_day ?? 4,
          careerGoal: data.career_goal ?? "",
          skills: data.skills ?? [],
        });
      }
      setLoading(false);
    }
    loadProfile();
  }, [supabase, form]);

  const handleSkillToggle = (skill: string) => {
    const current = form.getValues("skills") || [];
    if (current.includes(skill)) {
      form.setValue(
        "skills",
        current.filter((s) => s !== skill),
        { shouldValidate: true }
      );
    } else {
      form.setValue("skills", [...current, skill], { shouldValidate: true });
    }
  };

  // Canvas client-side image compression helper
  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          const MAX_SIZE = 400;
          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error("Canvas compression failed"));
              }
            },
            "image/jpeg",
            0.8
          );
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  // Upload photo to Supabase storage bucket "avatars"
  const uploadAvatar = async (file: File) => {
    try {
      setUploading(true);
      setError(null);

      const compressedBlob = await compressImage(file);
      const fileExt = "jpg";
      const fileName = `${profileId || 'user'}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, compressedBlob, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      form.setValue("avatarUploadUrl", publicUrl);
      form.setValue("avatarType", "upload");
      form.setValue("avatarValue", publicUrl);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    form.setValue("avatarUploadUrl", null);

    // Fallback selection based on priority
    const cartoon = form.getValues("avatarCartoonUrl");
    const color = form.getValues("avatarColorCode");
    if (cartoon) {
      form.setValue("avatarType", "cartoon");
      form.setValue("avatarValue", cartoon);
    } else {
      form.setValue("avatarType", "color");
      form.setValue("avatarValue", color || "preset-1");
    }
  };

  const handleSelectCartoon = (url: string) => {
    form.setValue("avatarCartoonUrl", url);
    if (!form.getValues("avatarUploadUrl")) {
      form.setValue("avatarType", "cartoon");
      form.setValue("avatarValue", url);
    }
  };

  const handleSelectColor = (id: string) => {
    form.setValue("avatarColorCode", id);
    if (!form.getValues("avatarUploadUrl") && !form.getValues("avatarCartoonUrl")) {
      form.setValue("avatarType", "color");
      form.setValue("avatarValue", id);
    }
  };

  const onSubmit = async (values: ProfileValues) => {
    if (!profileId) return;
    setSaving(true);
    setSuccess(false);
    setError(null);

    // Resolve active avatar based on priority order: Uploaded > Cartoon > Color preset
    const resolvedUrl = values.avatarUploadUrl || values.avatarCartoonUrl || values.avatarColorCode || "preset-1";
    let activeType = "color";
    let activeValue = values.avatarColorCode || "preset-1";

    if (values.avatarUploadUrl) {
      activeType = "upload";
      activeValue = values.avatarUploadUrl;
    } else if (values.avatarCartoonUrl) {
      activeType = "cartoon";
      activeValue = values.avatarCartoonUrl;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: values.fullName,
        avatar_url: resolvedUrl,
        avatar_type: activeType,
        avatar_value: activeValue,
        avatar_upload_url: values.avatarUploadUrl || null,
        avatar_cartoon_url: values.avatarCartoonUrl || null,
        avatar_color_code: values.avatarColorCode || "preset-1",
        university: values.university,
        department: values.department,
        current_semester: parseInt(values.semester),
        target_cgpa: values.targetCgpa,
        study_hours_per_day: values.studyHours,
        career_goal: values.careerGoal,
        skills: values.skills,
      })
      .eq("id", profileId);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-[500px] w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-white">Student Profile</h1>
          <p className="mt-2 text-slate-400">View and update your academic details and preferences.</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Personal Details */}
        <Card className="border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
              <User className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Personal & University Details</CardTitle>
              <CardDescription>Configure your university metadata and avatar identifier.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Full Name</label>
                <Input placeholder="E.g. Jane Doe" {...form.register("fullName")} />
                {form.formState.errors.fullName && (
                  <p className="text-sm text-rose-300">{form.formState.errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">University</label>
                <Input placeholder="E.g. Stanford University" {...form.register("university")} />
                {form.formState.errors.university && (
                  <p className="text-sm text-rose-300">{form.formState.errors.university.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Department</label>
                <Input placeholder="E.g. Computer Science" {...form.register("department")} />
                {form.formState.errors.department && (
                  <p className="text-sm text-rose-300">{form.formState.errors.department.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Semester</label>
                <Select
                  value={form.watch("semester")}
                  onValueChange={(val) => form.setValue("semester", val, { shouldValidate: true })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        Semester {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.semester && (
                  <p className="text-sm text-rose-300">{form.formState.errors.semester.message}</p>
                )}
              </div>
            </div>

            {/* Upgraded Avatar Section */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <label className="text-sm font-medium text-slate-300">Profile Avatar Selection</label>

              <div className="flex flex-col gap-6 md:flex-row md:items-center">
                {/* Active Preview */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-white/15 bg-slate-900/50 shadow-inner overflow-hidden">
                    {uploadUrl || cartoonUrl ? (
                      <img
                        src={uploadUrl || cartoonUrl || ""}
                        alt="Avatar Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className={cn(
                        "flex h-full w-full items-center justify-center bg-gradient-to-br text-3xl font-bold text-white uppercase",
                        PRESET_AVATARS.find(a => a.id === colorCode)?.bg || "from-cyan-400 to-blue-500"
                      )}>
                        {form.watch("fullName")?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "U"}
                      </div>
                    )}
                    {/* Tiny badge showing priority source */}
                    <div className="absolute bottom-1 right-1 rounded-lg bg-slate-950/80 px-1.5 py-0.5 text-[8px] font-semibold text-cyan-300 backdrop-blur-sm border border-white/5">
                      {uploadUrl ? "Upload" : cartoonUrl ? "Cartoon" : "Color"}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Active Preview</span>
                </div>

                {/* Tabs Selector */}
                <div className="flex-1 min-w-0">
                  <Tabs defaultValue="cartoon" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10 p-1 rounded-2xl">
                      <TabsTrigger value="cartoon" className="text-xs font-semibold py-2 px-3 rounded-xl gap-1.5 cursor-pointer">
                        <ImageIcon className="h-3.5 w-3.5" />
                        Cartoon
                      </TabsTrigger>
                      <TabsTrigger value="upload" className="text-xs font-semibold py-2 px-3 rounded-xl gap-1.5 cursor-pointer">
                        <Upload className="h-3.5 w-3.5" />
                        Upload
                      </TabsTrigger>
                      <TabsTrigger value="color" className="text-xs font-semibold py-2 px-3 rounded-xl gap-1.5 cursor-pointer">
                        <Palette className="h-3.5 w-3.5" />
                        Color
                      </TabsTrigger>
                    </TabsList>

                    {/* Cartoon Tab */}
                    <TabsContent value="cartoon" className="focus-visible:ring-0">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-400">Choose a premium 3D cartoon avatar style:</p>
                          {cartoonUrl && (
                            <button
                              type="button"
                              onClick={() => form.setValue("avatarCartoonUrl", null)}
                              className="text-[10px] font-semibold text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" /> Clear Cartoon
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
                          {CARTOON_AVATARS.map((avatar) => {
                            const isSelected = cartoonUrl === avatar.url;
                            return (
                              <button
                                key={avatar.id}
                                type="button"
                                onClick={() => handleSelectCartoon(avatar.url)}
                                className={cn(
                                  "relative flex aspect-square cursor-pointer items-center justify-center rounded-2xl bg-white/5 border transition-all duration-200 hover:scale-105 hover:bg-white/10 overflow-hidden",
                                  isSelected
                                    ? "border-cyan-400 ring-2 ring-cyan-400/50 scale-105"
                                    : "border-white/10 opacity-70"
                                )}
                              >
                                <img src={avatar.url} alt={avatar.name} className="h-full w-full object-cover animate-in fade-in zoom-in-95 duration-200" />
                                {isSelected && (
                                  <div className="absolute right-1 top-1 rounded-full bg-cyan-400 p-0.5 text-slate-950">
                                    <CheckCircle2 className="h-3 w-3" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </TabsContent>

                    {/* Upload Photo Tab */}
                    <TabsContent value="upload" className="focus-visible:ring-0">
                      <div className="space-y-3">
                        <p className="text-xs text-slate-400">Upload a custom profile photo (takes highest priority):</p>

                        <div className="flex items-center gap-4">
                          {uploadUrl ? (
                            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-2 pr-4 animate-in fade-in slide-in-from-left-4 duration-200">
                              <img src={uploadUrl} alt="Uploaded" className="h-10 w-10 rounded-xl object-cover border border-white/10" />
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold text-white">Custom Photo Active</span>
                                <button
                                  type="button"
                                  onClick={handleRemovePhoto}
                                  className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 mt-0.5 cursor-pointer"
                                >
                                  <Trash2 className="h-3 w-3" /> Remove Photo
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label className={cn(
                              "flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl px-6 py-4 cursor-pointer hover:border-cyan-400/50 hover:bg-white/[0.02] transition-all min-w-[200px]",
                              uploading && "opacity-50 pointer-events-none"
                            )}>
                              <input
                                type="file"
                                accept="image/png, image/jpeg, image/jpg, image/webp"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) uploadAvatar(file);
                                }}
                                disabled={uploading}
                              />
                              {uploading ? (
                                <div className="flex flex-col items-center gap-1.5">
                                  <Loader2 className="h-5 w-5 text-cyan-400 animate-spin" />
                                  <span className="text-[10px] text-slate-400 font-medium">Uploading & compressing...</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-1">
                                  <Upload className="h-5 w-5 text-slate-400" />
                                  <span className="text-xs font-semibold text-slate-300">Choose Image</span>
                                  <span className="text-[9px] text-slate-500">PNG, JPG or WEBP (Max 5MB)</span>
                                </div>
                              )}
                            </label>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    {/* Color Tab */}
                    <TabsContent value="color" className="focus-visible:ring-0">
                      <div className="space-y-3">
                        <p className="text-xs text-slate-400">Choose a default gradient avatar color preset:</p>
                        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
                          {PRESET_AVATARS.map((avatar) => {
                            const isSelected = colorCode === avatar.id;
                            return (
                              <button
                                key={avatar.id}
                                type="button"
                                onClick={() => handleSelectColor(avatar.id)}
                                className={cn(
                                  "relative flex aspect-square cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-br transition-all duration-200 hover:scale-105",
                                  avatar.bg,
                                  isSelected
                                    ? "ring-2 ring-cyan-400 scale-105"
                                    : "opacity-60"
                                )}
                              >
                                <span className="text-base font-bold text-white uppercase">{avatar.name[0]}</span>
                                {isSelected && (
                                  <div className="absolute right-1 top-1 rounded-full bg-cyan-400 p-0.5 text-slate-950">
                                    <CheckCircle2 className="h-3 w-3" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Academic Goals & Skills */}
        <Card className="border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-fuchsia-500/10 text-fuchsia-300">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Academic Goals & Career Targets</CardTitle>
              <CardDescription>Refine your semester study expectations and targets.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Target CGPA</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="E.g. 3.9"
                  {...form.register("targetCgpa", { valueAsNumber: true })}
                />
                {form.formState.errors.targetCgpa && (
                  <p className="text-sm text-rose-300">{form.formState.errors.targetCgpa.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Target Study Hours / Day</label>
                <Input
                  type="number"
                  placeholder="E.g. 4"
                  {...form.register("studyHours", { valueAsNumber: true })}
                />
                {form.formState.errors.studyHours && (
                  <p className="text-sm text-rose-300">{form.formState.errors.studyHours.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Career Goal</label>
              <Input
                placeholder="E.g. Software Developer, Academic Researcher"
                {...form.register("careerGoal")}
              />
              {form.formState.errors.careerGoal && (
                <p className="text-sm text-rose-300">{form.formState.errors.careerGoal.message}</p>
              )}
            </div>

            {/* Skill Selector */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300">Skills & Specializations</label>
              <div className="grid gap-3 sm:grid-cols-3">
                {SKILL_OPTIONS.map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleSkillToggle(skill)}
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${isSelected
                          ? "border-cyan-400 bg-cyan-400/15 text-cyan-100"
                          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                        }`}
                    >
                      <span className="text-xs font-semibold">{skill}</span>
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] transition ${isSelected ? "border-cyan-400 bg-cyan-400 text-slate-950" : "border-white/20 bg-slate-900"
                          }`}
                      >
                        {isSelected && "✓"}
                      </span>
                    </button>
                  );
                })}
              </div>
              {form.formState.errors.skills && (
                <p className="text-sm text-rose-300">{form.formState.errors.skills.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-4 text-rose-200">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-4 text-emerald-200">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <p className="text-sm font-semibold">Profile updated successfully!</p>
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="lg" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving changes...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Save Profile
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
