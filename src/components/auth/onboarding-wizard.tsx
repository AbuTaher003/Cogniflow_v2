"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  GraduationCap, Target, Award, CheckCircle2, ArrowRight, ArrowLeft,
  Sparkles, Code2, BookOpen, Loader2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

const onboardingSchema = z.object({
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

type OnboardingValues = z.infer<typeof onboardingSchema>;

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

interface OnboardingWizardProps {
  profile: any;
  email: string;
}

export function OnboardingWizard({ profile, email }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: profile?.full_name ?? "",
      avatarUrl: profile?.avatar_url ?? "preset-1",
      university: profile?.university ?? "",
      department: profile?.department ?? "",
      semester: profile?.current_semester ? String(profile.current_semester) : "1",
      targetCgpa: profile?.target_cgpa ?? 3.5,
      studyHours: profile?.study_hours_per_day ?? 4,
      careerGoal: profile?.career_goal ?? "",
      skills: profile?.skills ?? [],
    },
  });

  const selectedAvatar = form.watch("avatarUrl");
  const selectedSkills = form.watch("skills") || [];

  const handleNext = async () => {
    let fieldsToValidate: Array<keyof OnboardingValues> = [];
    if (step === 1) {
      fieldsToValidate = ["fullName", "university", "department", "semester"];
    } else if (step === 2) {
      fieldsToValidate = ["targetCgpa", "studyHours", "careerGoal"];
    } else if (step === 3) {
      fieldsToValidate = ["skills"];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setStep((prev) => prev - 1);
  };

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

  const handleSubmit = async (values: OnboardingValues) => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("No active session found. Please sign in again.");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email ?? email,
        full_name: values.fullName,
        avatar_url: values.avatarUrl,
        university: values.university,
        department: values.department,
        current_semester: parseInt(values.semester),
        target_cgpa: values.targetCgpa,
        study_hours_per_day: values.studyHours,
        career_goal: values.careerGoal,
        skills: values.skills,
        onboarding_completed: true,
      });

    if (error) {
      alert("Error saving profile: " + error.message);
      setLoading(false);
      return;
    }

    // Add a welcome notification
    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "achievement",
      title: "Welcome to CogniFlow! 🚀",
      message: "Your academic operating system is configured and ready. Let's make this semester epic!",
    });

    window.location.href = "/dashboard";
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-400">Step {step} of 4</span>
          <span className="font-semibold text-cyan-300">
            {step === 1 && "Personal Information"}
            {step === 2 && "Academic Goals"}
            {step === 3 && "Areas of Expertise"}
            {step === 4 && "Setup Complete"}
          </span>
        </div>
        <Progress value={(step / 4) * 100} className="h-1 bg-white/5" />
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
                <CardHeader className="space-y-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <CardTitle className="font-display text-2xl">Personal Information</CardTitle>
                  <CardDescription>
                    Let&apos;s customize your workspace profile and student card details.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Name field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Full Name</label>
                    <Input placeholder="Enter your full name" {...form.register("fullName")} />
                    {form.formState.errors.fullName && (
                      <p className="text-sm text-rose-300">{form.formState.errors.fullName.message}</p>
                    )}
                  </div>

                  {/* Avatar Picker */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-300">Choose Profile Identity</label>
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
                                : "opacity-70"
                            }`}
                          >
                            <span className="text-xl font-bold text-white uppercase">
                              {avatar.name[0]}
                            </span>
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

                  {/* University & Department & Semester */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">University</label>
                      <Input placeholder="E.g., MIT, Stanford" {...form.register("university")} />
                      {form.formState.errors.university && (
                        <p className="text-sm text-rose-300">{form.formState.errors.university.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Department</label>
                      <Input placeholder="E.g., Computer Science" {...form.register("department")} />
                      {form.formState.errors.department && (
                        <p className="text-sm text-rose-300">{form.formState.errors.department.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Current Semester</label>
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
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
                <CardHeader className="space-y-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-fuchsia-500/10 text-fuchsia-300">
                    <Target className="h-5 w-5" />
                  </div>
                  <CardTitle className="font-display text-2xl">Academic Goals</CardTitle>
                  <CardDescription>
                    Define your targets. We will customize your weekly plans and study trackers.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Target CGPA */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Target CGPA (out of 4.00 or 10.0)</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="E.g., 3.85"
                        {...form.register("targetCgpa", { valueAsNumber: true })}
                      />
                      {form.formState.errors.targetCgpa && (
                        <p className="text-sm text-rose-300">{form.formState.errors.targetCgpa.message}</p>
                      )}
                    </div>

                    {/* Study hours per day */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Target Study Hours / Day</label>
                      <Input
                        type="number"
                        placeholder="E.g., 4"
                        {...form.register("studyHours", { valueAsNumber: true })}
                      />
                      {form.formState.errors.studyHours && (
                        <p className="text-sm text-rose-300">{form.formState.errors.studyHours.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Career Goal */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Career Goal</label>
                    <Input
                      placeholder="E.g., Machine Learning Engineer, Research Scientist"
                      {...form.register("careerGoal")}
                    />
                    {form.formState.errors.careerGoal && (
                      <p className="text-sm text-rose-300">{form.formState.errors.careerGoal.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
                <CardHeader className="space-y-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
                    <Code2 className="h-5 w-5" />
                  </div>
                  <CardTitle className="font-display text-2xl">Choose Your Fields</CardTitle>
                  <CardDescription>
                    Select the subjects or skill areas you are focusing on this semester.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {SKILL_OPTIONS.map((skill) => {
                      const isSelected = selectedSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => handleSkillToggle(skill)}
                          className={`flex items-center justify-between rounded-2xl border px-5 py-4 text-left transition-all duration-200 ${
                            isSelected
                              ? "border-cyan-400 bg-cyan-400/10 text-cyan-100 shadow-md shadow-cyan-950/20 scale-[1.02]"
                              : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                          }`}
                        >
                          <span className="font-medium">{skill}</span>
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full border transition ${
                              isSelected ? "border-cyan-400 bg-cyan-400 text-slate-950" : "border-white/20 bg-slate-900"
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="h-4 w-4" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {form.formState.errors.skills && (
                    <p className="text-sm text-rose-300">{form.formState.errors.skills.message}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
                <CardHeader className="space-y-2 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                    <Sparkles className="h-6 w-6 animate-pulse" />
                  </div>
                  <CardTitle className="font-display text-3xl">Ready for Launch!</CardTitle>
                  <CardDescription className="text-base">
                    Review your student workspace settings before generating your system dashboard.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Summary Profile Preview */}
                  <div className="grid gap-6 rounded-2xl border border-white/10 bg-slate-950/50 p-6 md:grid-cols-[1fr_2px_1.5fr]">
                    {/* Left Identity Card */}
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className={`flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${
                        PRESET_AVATARS.find((a) => a.id === selectedAvatar)?.bg ?? "from-cyan-400 to-blue-500"
                      } text-3xl font-bold text-white shadow-lg shadow-cyan-950/40 uppercase`}>
                        {form.watch("fullName")?.[0] ?? "S"}
                      </div>
                      <h3 className="mt-4 text-xl font-bold text-white">{form.watch("fullName")}</h3>
                      <p className="text-xs tracking-wider uppercase text-cyan-300 mt-1">{email}</p>
                      <p className="mt-3 text-sm text-slate-400">
                        {form.watch("department")} • Semester {form.watch("semester")}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{form.watch("university")}</p>
                    </div>

                    {/* Divider */}
                    <div className="hidden bg-white/10 md:block" />

                    {/* Right Parameters Panel */}
                    <div className="flex flex-col justify-center space-y-4">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Academic Goals
                        </span>
                        <div className="mt-2 grid grid-cols-2 gap-4">
                          <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                            <span className="text-[10px] uppercase text-slate-400">Target CGPA</span>
                            <p className="text-xl font-bold text-white mt-1">{form.watch("targetCgpa")}</p>
                          </div>
                          <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                            <span className="text-[10px] uppercase text-slate-400">Study hours/day</span>
                            <p className="text-xl font-bold text-white mt-1">{form.watch("studyHours")} hrs</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Career Target
                        </span>
                        <p className="mt-1 text-sm text-white font-medium">{form.watch("careerGoal")}</p>
                      </div>

                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Specializations
                        </span>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {selectedSkills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full bg-cyan-400/10 border border-cyan-400/20 px-2.5 py-0.5 text-xs text-cyan-200"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wizard Controls */}
        <div className="mt-6 flex justify-between">
          {step > 1 ? (
            <Button variant="secondary" size="lg" type="button" onClick={handlePrev}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <Button variant="primary" size="lg" type="button" onClick={handleNext}>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button variant="primary" size="lg" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting up...
                </>
              ) : (
                <>
                  Enter Workspace <CheckCircle2 className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
