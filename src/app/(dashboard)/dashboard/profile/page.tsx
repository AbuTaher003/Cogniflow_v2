"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  User, GraduationCap, Target, Code2, Save, Loader2,
  CheckCircle2, Sparkles, AlertCircle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  avatarUrl: z.string(),
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
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const supabase = createClient();

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      avatarUrl: "preset-1",
      university: "",
      department: "",
      semester: "1",
      targetCgpa: 3.5,
      studyHours: 4,
      careerGoal: "",
      skills: [],
    },
  });

  const selectedAvatar = form.watch("avatarUrl");
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

  const onSubmit = async (values: ProfileValues) => {
    if (!profileId) return;
    setSaving(true);
    setSuccess(false);
    setError(null);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: values.fullName,
        avatar_url: values.avatarUrl,
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

            {/* Avatar Picker */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300">Profile Gradient Avatar</label>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {PRESET_AVATARS.map((avatar) => {
                  const isSelected = selectedAvatar === avatar.id;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => form.setValue("avatarUrl", avatar.id)}
                      className={`relative flex aspect-square cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-br ${avatar.bg} transition-all duration-200 hover:scale-105 ${
                        isSelected
                          ? "ring-4 ring-cyan-400 ring-offset-4 ring-offset-slate-950 scale-105"
                          : "opacity-60"
                      }`}
                    >
                      <span className="text-xl font-bold text-white uppercase">{avatar.name[0]}</span>
                      {isSelected && (
                        <div className="absolute -right-1.5 -top-1.5 rounded-full bg-cyan-400 p-0.5 text-slate-950">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      )}
                    </button>
                  );
                })}
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
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                        isSelected
                          ? "border-cyan-400 bg-cyan-400/15 text-cyan-100"
                          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      <span className="text-xs font-semibold">{skill}</span>
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] transition ${
                          isSelected ? "border-cyan-400 bg-cyan-400 text-slate-950" : "border-white/20 bg-slate-900"
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
