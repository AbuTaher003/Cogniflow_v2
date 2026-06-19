export type AIProvider = "gemini" | "openai" | "claude" | "ollama" | "mock";

export interface AISettings {
  provider: AIProvider;
  apiKey?: string;
  baseUrl?: string;
  modelName?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

// Default settings saved/retrieved from LocalStorage
const DEFAULT_SETTINGS: AISettings = {
  provider: "mock",
  apiKey: "",
  baseUrl: "",
  modelName: ""
};

export function getAISettings(): AISettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  const stored = localStorage.getItem("cogniflow_ai_settings");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  }
  return DEFAULT_SETTINGS;
}

export function saveAISettings(settings: AISettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem("cogniflow_ai_settings", JSON.stringify(settings));
}

// Generate study plans
export async function generateStudyPlan(subject: string, goals: string): Promise<string> {
  const settings = getAISettings();
  if (settings.provider === "mock") {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate thinking
    return `### 📚 Study Plan for ${subject || "your subject"}
**Goal**: ${goals || "General Mastery"}

#### 📅 Week 1: Core Concepts & Foundational Theories
- **Topics**: Introduction to fundamentals, primary vocabulary, and simple schemas.
- **Study Guide**: Allocate 45 minutes daily. Read the initial notes and construct a basic conceptual map.
- **Milestone**: Write a 500-word summary of core principles.

#### 📅 Week 2: Intermediate Techniques & Application
- **Topics**: Case study reviews, structural implementations, and problem-solving patterns.
- **Study Guide**: Focus on active recall and flashcards. Solve at least 5 intermediate practice exercises.
- **Milestone**: Complete a mock quiz with >80% score.

#### 📅 Week 3: Advanced Architectures & Integration
- **Topics**: Performance tuning, deep optimization, and final synthesis.
- **Study Guide**: Dedicate time to a hands-on project or solving past papers. Compare your solutions with exemplars.
- **Milestone**: Full practice exam under timed conditions.

#### 💡 Recommendations for Success
- **Pomodoro Technique**: Use a 25-minute study / 5-minute break flow (try our **Focus Mode**).
- **Active Review**: Revise your integration cheat-sheets every 3 days.`;
  }

  // Real API implementation placeholder with Gemini/OpenAI/etc.
  try {
    const response = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "study-plan", subject, goals, settings })
    });
    const res = await response.json();
    return res.text || "Failed to generate study plan from provider.";
  } catch (err) {
    console.error("AI Provider error", err);
    return "Error contacting AI service. Please verify your settings or fallback to Mock mode.";
  }
}

// Summarize notes
export async function summarizeNote(noteTitle: string, noteContent: string): Promise<string> {
  const settings = getAISettings();
  if (settings.provider === "mock") {
    await new Promise(resolve => setTimeout(resolve, 1200));
    return `### 📝 Executive Summary: ${noteTitle || "Note Review"}
Here is a condensed overview of the note:

- **Key Concept**: The note details the central architectures and core equations of the topic.
- **Key Takeaways**:
  1. Primary focus is on maximizing efficiency while keeping complexity minimal.
  2. Implement proper logging, caching, and clean layer abstraction.
  3. Continuous testing and verification is essential.
- **Action Items**:
  - Review the boundary cases next.
  - Build active diagrams to represent the conceptual workflow.`;
  }

  try {
    const response = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "summarize", noteTitle, noteContent, settings })
    });
    const res = await response.json();
    return res.text || "Failed to generate summary.";
  } catch (err) {
    console.error("AI Provider error", err);
    return "Error summarizing note. Verify provider API keys.";
  }
}

// Generate quizzes
export async function generateQuiz(subject: string, topic: string, count: number = 3): Promise<QuizQuestion[]> {
  const settings = getAISettings();
  if (settings.provider === "mock") {
    await new Promise(resolve => setTimeout(resolve, 1800));
    return [
      {
        question: `In ${subject || "general study"}, which of the following best describes the primary optimization principle?`,
        options: [
          "Increasing raw execution speed at all costs",
          "Balancing algorithmic complexity, resource utilization, and maintainability",
          "Relying solely on external library upgrades",
          "Leaving components completely unoptimized to avoid complexity"
        ],
        answerIndex: 1,
        explanation: "Premium engineering always seeks to strike a balance between performance, resource utilization, and code readability rather than optimizing a single parameter blindly."
      },
      {
        question: `Which study technique is proven to yield the highest long-term retention according to cognitive research?`,
        options: [
          "Passive re-reading of textbooks",
          "Highlighting paragraphs with bright colors",
          "Active recall and spaced repetition practice",
          "Cramming all materials the night before an exam"
        ],
        answerIndex: 2,
        explanation: "Active recall (testing yourself) and spaced repetition (spacing out review sessions) force the brain to actively retrieve information, strengthening neural connections."
      },
      {
        question: `What is the key benefit of breaking a large topic down into chapters or modules?`,
        options: [
          "It makes the study plan look longer",
          "It facilitates cognitive chunking, reducing mental load and streamlining progression tracking",
          "It is required by all academic boards",
          "It allows skipping core foundational steps entirely"
        ],
        answerIndex: 1,
        explanation: "Cognitive chunking helps the brain digest complex architectures by focusing on bite-sized components, preventing overwhelm and helping track milestone completions."
      }
    ].slice(0, count);
  }

  try {
    const response = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "quiz", subject, topic, count, settings })
    });
    const res = await response.json();
    return res.questions || [];
  } catch (err) {
    console.error("AI Provider error", err);
    return [];
  }
}
