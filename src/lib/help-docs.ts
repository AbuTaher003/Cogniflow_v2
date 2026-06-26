export interface HelpDoc {
  id: string;
  title: string;
  description: string;
  iconName: string;
  whatItIs: string;
  howToUse: string;
  steps: string[];
  tips: string[];
}

export const HELP_DOCS: HelpDoc[] = [
  {
    id: "dashboard",
    title: "Dashboard Overview",
    description: "Your main command center featuring welcome stats, productivity score, and daily targets.",
    iconName: "LayoutDashboard",
    whatItIs: "The Dashboard serves as the central hub of CogniFlow, providing a single high-level view of your academic performance, active focus sessions, upcoming exams, habits, and tasks.",
    howToUse: "Review your aggregated Productivity Score gauge at the start of your day, check items off your 'Daily Targets' feed, and quickly jump to active focus sessions or lecture note logs.",
    steps: [
      "Review the welcome card for daily motivational quotes.",
      "Check the Productivity Score gauge which aggregates tasks done, habits checked, and study target compliance.",
      "Interact with 'Today's Tasks' or 'Habit Progress' cards to log quick changes.",
      "Hover over charts to see detailed time trends."
    ],
    tips: [
      "The Productivity Score increases as you maintain habit streaks and complete high-priority tasks.",
      "Use the 'Daily Targets' list as a quick reminder of what is due before midnight."
    ]
  },
  {
    id: "notes",
    title: "Lecture Notes",
    description: "Write, structure, and pin lecture notes with markdown format and tag categorization.",
    iconName: "Notebook",
    whatItIs: "A sleek, distraction-free lecture notes editor supporting standard markdown shortcuts, active pin states, subject association, and custom search tags.",
    howToUse: "Navigate to Notes, click 'Create Note', assign a subject, and start writing. You can search notes by title/content, toggle tags, or pin essential summaries to the top.",
    steps: [
      "Click 'New Note' to open the creation card.",
      "Assign a subject from your syllabus to automatically link color tags.",
      "Write using Markdown (e.g. # for header, - for bullet points, ** for bold text).",
      "Click the Pin icon to lock important notes at the top of the repository."
    ],
    tips: [
      "Use descriptive tags like '#midterm' or '#formula-sheet' to quickly group notes across multiple subjects.",
      "Archived notes can be hidden by adding the '_archived_' tag, keeping your main workspace clean."
    ]
  },
  {
    id: "exams",
    title: "Exams Prep Tracker",
    description: "Map target scores, log countdowns, and track exam results.",
    iconName: "CalendarRange",
    whatItIs: "An exam scheduling coordinator designed to help you organize midterms, finals, and quizzes. It monitors your countdown timeline, importance level, and target vs. achieved scores.",
    howToUse: "Add your exam dates and target grades. The system calculates prep counts and alerts you of impending deadlines. Log achieved scores once exams are graded to monitor your course statistics.",
    steps: [
      "Click 'Add Exam' and enter the exam title and type (quiz, midterm, final, etc.).",
      "Set the target score (e.g. 90.0) and choose a subject.",
      "Specify the exam date and importance tier.",
      "Mark as completed and input your achieved score once results are released."
    ],
    tips: [
      "Review the timeline regularly to identify clusters of high-importance exams and plan your study focus weeks accordingly.",
      "Compare target and achieved scores to visually identify subject areas requiring extra study hours."
    ]
  },
  {
    id: "tasks",
    title: "Task Kanban Board",
    description: "Organize coursework tasks by subject, priority, and backlog status.",
    iconName: "CheckSquare",
    whatItIs: "A visual task tracker modeled on Kanban systems, categorizing assignments, homework, and study sessions into Backlog, Todo, In Progress, Review, and Done columns.",
    howToUse: "Create tasks, specify subject and due date, and drag or transition status buttons. Tasks can be filtered by priority (low, medium, high, urgent) to prevent bottlenecking.",
    steps: [
      "Click 'Add Task' and input title, description, and subject.",
      "Select priority level and estimated completion duration.",
      "Change status (e.g. from 'Todo' to 'In Progress') as you work.",
      "Mark a task as 'Done' to record the completion timestamp."
    ],
    tips: [
      "Be realistic with estimated completion times. Tasks with duration estimates automatically sync to productivity charts.",
      "Filter by 'Urgent' or 'High' priority first to knock out pressing deadlines."
    ]
  },
  {
    id: "habits",
    title: "Habit Streaks",
    description: "Build consistency and log streaks with daily routine check-ins.",
    iconName: "Flame",
    whatItIs: "A goal tracking mechanism to form healthy study habits, exercise routines, or focus periods. Tracks current streaks, best streaks, and logs completions on a calendar grid.",
    howToUse: "Define habits and frequency, then click check-off buttons on the dashboard or habits panel to log daily completions. The flame icon highlights your streak length.",
    steps: [
      "Create a habit specifying category (e.g. productivity, wellness, study).",
      "Set frequency (daily or weekly) and target daily repeat counts.",
      "Log completions daily by clicking the check-off circle or '+' button.",
      "Review the calendar history grid to analyze consistency gaps."
    ],
    tips: [
      "Start small! Build consistency with basic habits like 'Study 1 hour' or 'Read 10 pages' before ramping up targets.",
      "A habit check-in triggers once per day per habit. Keep streaks going to claim special achievement badges!"
    ]
  },
  {
    id: "focus",
    title: "Focus Mode Timer",
    description: "Launch deep work Pomodoro timers with ambient sounds.",
    iconName: "Timer",
    whatItIs: "A deep-work interface designed to block out distractions, utilizing standard Pomodoro or custom countdown intervals. Features immersive dark modes, ambient sounds (white noise, rain, lo-fi), and logging capabilities.",
    howToUse: "Select a subject and task. Choose your focus duration and ambient background sound. Click 'Start Focus' to lock in. The timer logs completed minutes directly to your study statistics.",
    steps: [
      "Link your session to a specific subject/task to log details.",
      "Configure timer length (standard Pomodoro is 25 minutes).",
      "Select an ambient background sound to mask environmental noise.",
      "Keep the tab active and complete your work block. Save notes at the end of the session."
    ],
    tips: [
      "Turn on full-screen browser mode during focus blocks to hide distracting bookmarks or system notifications.",
      "Take structured breaks: complete a 25-minute Pomodoro, rest for 5 minutes, and repeat. A longer break (15 mins) is recommended after 4 sessions."
    ]
  },
  {
    id: "study-planner",
    title: "Study Planner & Target",
    description: "Customize weekly target hours, map subjects, and checklist chapters.",
    iconName: "Clock",
    whatItIs: "A syllabus tracker that maps semester courses, divides subjects into chapters, tracks milestone completion percentages, and monitors your weekly study hour progress against a customizable target.",
    howToUse: "Enter your custom Weekly Study Target. Create subjects, add chapters for each subject, estimate target completion times, and update chapter progress slider bars to log progress.",
    steps: [
      "Click the edit icon on the 'Weekly Study Target' card to set your weekly hour target (1-100 hrs).",
      "Click 'Add Subject' to map out your semester courses.",
      "Within a subject row, expand and click 'Add Chapter' to list modules.",
      "Adjust the progress slider on each chapter as you study (0% to 100%)."
    ],
    tips: [
      "Your Weekly Study Target card updates immediately when changes are saved. Progress values automatically adjust to your custom target.",
      "Check off completed chapters: setting progress to 100% automatically updates status to 'Completed' and marks the date."
    ]
  },
  {
    id: "analytics",
    title: "Performance Analytics",
    description: "Track study minutes, completed assignments, and productivity charts.",
    iconName: "Activity",
    whatItIs: "A data visualization panel showing daily focus minutes, task completion counts, habit consistency index, and mood-to-productivity correlation overlays.",
    howToUse: "Consult these charts weekly to review study trends. Analyze daily breakdowns to see when you are most productive, helping you optimize your study calendar.",
    steps: [
      "Select chart timeframes to filter by week or month.",
      "Review the Study Hours area chart to see daily deep-work logs.",
      "Examine the Weekly Summary grid containing totals of completed tasks, upcoming exams, and notes created."
    ],
    tips: [
      "Study time data is populated automatically from Focus Mode sessions.",
      "Try to identify patterns: did a high habit consistency score lead to more tasks completed? Adjust your schedule to balance workload."
    ]
  },
  {
    id: "admin",
    title: "Admin Panel",
    description: "Manage system notices, publish updates, and review user feedback.",
    iconName: "ShieldCheck",
    whatItIs: "The system console for platform creators. Enables posting system-wide announcements (updates, releases, maintenance alerts) and managing database feedback logs.",
    howToUse: "If you have admin permissions, toggle to the Admin Panel. Write announcement alerts (pin options available) and review suggestions, feature requests, or bugs logged by students.",
    steps: [
      "Navigate to the Admin Panel tab in the sidebar.",
      "Review feedback rows, set priority tags, and type admin responses.",
      "Click 'New Announcement' to draft site-wide maintenance or feature notices."
    ],
    tips: [
      "Keep announcements brief and formatted using clear headers.",
      "Categorize feedback (bug vs. feature) to help prioritize development sprints."
    ]
  }
];
