"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckSquare, Plus, Edit2, Trash2, Search, Filter, ArrowUpDown,
  Calendar, AlertTriangle, Tag, Sparkles, BookOpen, Layers, CheckCircle2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLUMNS = [
  { id: "backlog", title: "Backlog", color: "border-t-slate-500 bg-slate-500/5" },
  { id: "todo", title: "To Do", color: "border-t-cyan-500 bg-cyan-500/5" },
  { id: "in_progress", title: "In Progress", color: "border-t-amber-500 bg-amber-500/5" },
  { id: "review", title: "Review", color: "border-t-purple-500 bg-purple-500/5" },
  { id: "done", title: "Completed", color: "border-t-emerald-500 bg-emerald-500/5" },
];

export default function TasksPage() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  
  // Controls
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("due"); // due, priority, created

  // Modals state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  // Form fields
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskSubjectId, setTaskSubjectId] = useState("none");
  const [taskStatus, setTaskStatus] = useState("todo");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskDueAt, setTaskDueAt] = useState("");
  const [taskTags, setTaskTags] = useState("");

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id);

      const { data: subjectsData } = await supabase
        .from("subjects")
        .select("*")
        .eq("user_id", user.id);

      setTasks(tasksData || []);
      setSubjects(subjectsData || []);
      setLoading(false);
    }
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e: any, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId) return;

    // Optimistic Update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));

    const completedAt = status === "done" ? new Date().toISOString() : null;

    const { error } = await supabase
      .from("tasks")
      .update({ status, completed_at: completedAt })
      .eq("id", taskId);

    if (error) {
      // Revert if error
      const { data: refreshed } = await supabase.from("tasks").select("*").eq("id", taskId).single();
      if (refreshed) {
        setTasks(prev => prev.map(t => t.id === taskId ? refreshed : t));
      }
    }
  };

  // CRUD handlers
  const handleOpenTaskModal = (task: any = null) => {
    if (task) {
      setEditingTask(task);
      setTaskTitle(task.title);
      setTaskDesc(task.description || "");
      setTaskSubjectId(task.subject_id || "none");
      setTaskStatus(task.status);
      setTaskPriority(task.priority);
      setTaskDueAt(task.due_at ? task.due_at.split("T")[0] : "");
      setTaskTags(task.tags ? task.tags.join(", ") : "");
    } else {
      setEditingTask(null);
      setTaskTitle("");
      setTaskDesc("");
      setTaskSubjectId("none");
      setTaskStatus("todo");
      setTaskPriority("medium");
      setTaskDueAt("");
      setTaskTags("");
    }
    setTaskModalOpen(true);
  };

  const handleSaveTask = async () => {
    if (!taskTitle.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const tagsArr = taskTags.split(",").map(t => t.trim()).filter(Boolean);
    const subId = taskSubjectId === "none" ? null : taskSubjectId;

    const payload = {
      user_id: user.id,
      title: taskTitle,
      description: taskDesc || null,
      subject_id: subId,
      status: taskStatus,
      priority: taskPriority,
      due_at: taskDueAt ? new Date(taskDueAt).toISOString() : null,
      tags: tagsArr,
      completed_at: taskStatus === "done" ? new Date().toISOString() : null
    };

    if (editingTask) {
      const { error } = await supabase
        .from("tasks")
        .update(payload)
        .eq("id", editingTask.id);
      
      if (!error) {
        setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...payload, subjects: subjects.find(s => s.id === subId) } : t));
      }
    } else {
      const { data, error } = await supabase
        .from("tasks")
        .insert(payload)
        .select()
        .single();
      
      if (!error && data) {
        setTasks(prev => [...prev, { ...data, subjects: subjects.find(s => s.id === subId) }]);
      }
    }
    setTaskModalOpen(false);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (!error) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
      }
    }
  };

  // Helper selectors
  const getFilteredTasks = () => {
    let list = [...tasks];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)));
    }

    // Subject Filter
    if (subjectFilter !== "all") {
      list = list.filter(t => t.subject_id === subjectFilter);
    }

    // Priority Filter
    if (priorityFilter !== "all") {
      list = list.filter(t => t.priority === priorityFilter);
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "due") {
        if (!a.due_at) return 1;
        if (!b.due_at) return -1;
        return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
      } else if (sortBy === "priority") {
        const priorities: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
        return (priorities[b.priority] || 0) - (priorities[a.priority] || 0);
      } else {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return list;
  };

  const filteredTasks = getFilteredTasks();

  // Task metrics
  const doneCount = tasks.filter(t => t.status === "done").length;
  const totalCount = tasks.length;
  const completionRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // Weekly counts
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weeklyCompleted = tasks.filter(t => t.status === "done" && t.completed_at && new Date(t.completed_at) > weekAgo).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid gap-6 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-96 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">Task Kanban Board</h1>
          <p className="text-slate-400">Manage assignments, prioritize study cards, and log completion logs.</p>
        </div>
        <Button onClick={() => handleOpenTaskModal()} variant="primary" size="lg">
          <Plus className="mr-2 h-4 w-4" /> Add Task
        </Button>
      </div>

      {/* Analytics Widgets */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Completion rate */}
        <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-400">Completion Rate</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{completionRate}%</span>
              <span className="text-xs text-slate-500">of all tasks finished</span>
            </div>
            <Progress value={completionRate} className="h-2 mt-3 bg-white/5" />
          </CardContent>
        </Card>

        {/* Weekly Completed */}
        <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-400">Weekly Task Summary</CardTitle>
              <CheckSquare className="h-4 w-4 text-cyan-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">+{weeklyCompleted}</span>
              <span className="text-xs text-slate-500">completed in past 7 days</span>
            </div>
            <p className="mt-4 text-xs text-slate-400">Keep scaling the board to stay ahead of examinations.</p>
          </CardContent>
        </Card>

        {/* Task Analytics summary */}
        <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-400">Total Backlog Items</CardTitle>
              <Layers className="h-4 w-4 text-fuchsia-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{tasks.filter(t => t.status === "backlog" || t.status === "todo").length}</span>
              <span className="text-xs text-slate-500">unstarted items pending</span>
            </div>
            <p className="mt-4 text-xs text-slate-400">Drag items to **In Progress** when starting focus study sessions.</p>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Filters & Search Controls */}
      <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input 
            placeholder="Search tasks..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter subject */}
        <div className="w-full sm:w-44">
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map(sub => (
                <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter Priority */}
        <div className="w-full sm:w-40">
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="urgent">Urgent Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort */}
        <div className="w-full sm:w-40">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="due">Due Date</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="created">Created Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid gap-6 md:grid-cols-5">
        {COLUMNS.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col.id);
          return (
            <div 
              key={col.id} 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`flex flex-col rounded-3xl border border-white/5 p-4 min-h-[500px] border-t-4 ${col.color}`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                <span className="font-display text-sm font-bold text-white uppercase tracking-wider">{col.title}</span>
                <Badge variant="outline" className="text-xs">{colTasks.length}</Badge>
              </div>

              {/* Task Cards Container */}
              <div className="flex-1 space-y-3 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-600 border border-dashed border-white/5 rounded-2xl bg-slate-950/20">
                    Drop items here
                  </div>
                ) : (
                  colTasks.map(task => {
                    const taskSub = subjects.find(s => s.id === task.subject_id);
                    return (
                      <motion.div
                        key={task.id}
                        layoutId={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => handleOpenTaskModal(task)}
                        className="cursor-grab active:cursor-grabbing rounded-2xl border border-white/10 bg-slate-950/65 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-950/90 shadow-glow relative group"
                      >
                        {/* Task Title */}
                        <h4 className="font-semibold text-xs text-white leading-relaxed truncate">{task.title}</h4>
                        
                        {/* Task description */}
                        {task.description && (
                          <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-normal">{task.description}</p>
                        )}

                        {/* Subject Tag */}
                        {taskSub && (
                          <span 
                            className="mt-3 inline-block rounded-full px-2 py-0.5 text-[8px] font-bold"
                            style={{ backgroundColor: `${taskSub.color}15`, color: taskSub.color }}
                          >
                            {taskSub.code || taskSub.name.slice(0, 10)}
                          </span>
                        )}

                        {/* Footer details */}
                        <div className="flex items-center justify-between mt-4 border-t border-white/5 pt-3">
                          {/* Priority badge */}
                          <Badge 
                            variant={
                              (task.priority === "urgent" || task.priority === "high") ? "neon" :
                              task.priority === "medium" ? "default" : "outline"
                            }
                            className="text-[8px] uppercase font-bold"
                          >
                            {task.priority}
                          </Badge>

                          {/* Due date */}
                          {task.due_at ? (
                            <span className="flex items-center gap-1 text-[9px] text-slate-500 font-medium">
                              <Calendar className="h-3 w-3" />
                              {new Date(task.due_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                          ) : null}
                        </div>

                        {/* Quick Delete float */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task.id);
                          }}
                          className="absolute right-2 top-2 p-1.5 rounded-lg text-rose-400 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition duration-150"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* TASK CREATE / EDIT MODAL */}
      <Dialog open={taskModalOpen} onOpenChange={setTaskModalOpen}>
        <DialogContent className="border-white/10 bg-slate-950 text-white max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task Card" : "Add Task Card"}</DialogTitle>
            <DialogDescription>Setup your study deliverables, prioritize weights, and set due alerts.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold">Task Title</label>
              <Input placeholder="E.g., Algorithms Homework 2" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold">Description</label>
              <textarea 
                placeholder="Details of the deliverable..." 
                value={taskDesc} 
                onChange={e => setTaskDesc(e.target.value)}
                className="w-full min-h-[80px] rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Subject</label>
                <Select value={taskSubjectId} onValueChange={setTaskSubjectId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Priority</label>
                <Select value={taskPriority} onValueChange={setTaskPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Due Date</label>
                <Input type="date" value={taskDueAt} onChange={e => setTaskDueAt(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Kanban Column</label>
                <Select value={taskStatus} onValueChange={setTaskStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="backlog">Backlog</SelectItem>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="done">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold">Labels / Tags (comma separated)</label>
              <Input placeholder="E.g. exam, theory, assignment" value={taskTags} onChange={e => setTaskTags(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setTaskModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveTask}>Save Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
