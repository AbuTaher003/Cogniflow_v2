export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export function getWelcomeEmail(name: string): EmailTemplate {
  const subject = "Welcome to CogniFlow - Your AI Student Operating System!";
  const text = `Hi ${name || "there"},\n\nWelcome to CogniFlow! We're thrilled to have you here. Your workspace is fully set up and ready to optimize your academic flow.`;
  const html = `
    <div style="font-family: sans-serif; background-color: #0b0f19; color: #f8fafc; padding: 40px; border-radius: 16px; max-width: 600px; margin: auto;">
      <h2 style="color: #22d3ee; border-bottom: 2px solid #1e293b; padding-bottom: 15px;">Welcome to CogniFlow, ${name || "Student"}!</h2>
      <p style="line-height: 1.6; font-size: 14px;">We're excited to help you conquer your semesters. CogniFlow provides all the core tools you need:</p>
      <ul style="line-height: 1.8; font-size: 13px;">
        <li>📅 <strong>Study Planner</strong>: Track subjects, chapters, and study timelines.</li>
        <li>📋 <strong>Kanban Boards</strong>: Plan coursework, homework, and coding tasks.</li>
        <li>⚡ <strong>Focus Sessions</strong>: Study with Pomodoro counts.</li>
        <li>🏆 <strong>Achievements System</strong>: Gain XP and level up as you accomplish goals.</li>
      </ul>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">Let's get started! Go to your <a href="http://localhost:3000/dashboard" style="color: #f472b6; text-decoration: none; font-weight: bold;">CogniFlow Dashboard</a>.</p>
    </div>
  `;
  return { subject, html, text };
}

export function getPasswordResetEmail(resetLink: string): EmailTemplate {
  const subject = "Reset Your CogniFlow Password";
  const text = `Please use the following link to reset your password: ${resetLink}`;
  const html = `
    <div style="font-family: sans-serif; background-color: #0b0f19; color: #f8fafc; padding: 40px; border-radius: 16px; max-width: 600px; margin: auto;">
      <h2 style="color: #f472b6; border-bottom: 2px solid #1e293b; padding-bottom: 15px;">Password Reset Request</h2>
      <p style="line-height: 1.6; font-size: 14px;">We received a request to reset your CogniFlow workspace password. Click the button below to secure your credentials:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background: linear-gradient(to right, #22d3ee, #f472b6); color: #0f172a; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">Reset Password</a>
      </div>
      <p style="font-size: 11px; color: #94a3b8;">If you did not make this request, you can safely ignore this email.</p>
    </div>
  `;
  return { subject, html, text };
}

export function getWeeklySummaryEmail(name: string, stats: { subjectsCount: number; completedTasks: number; studyHours: number }): EmailTemplate {
  const subject = "Your Weekly CogniFlow Progress Report";
  const text = `Hi ${name},\n\nHere is your study summary for this week:\n- Subjects Tracked: ${stats.subjectsCount}\n- Tasks Completed: ${stats.completedTasks}\n- Study Minutes: ${stats.studyHours} mins`;
  const html = `
    <div style="font-family: sans-serif; background-color: #0b0f19; color: #f8fafc; padding: 40px; border-radius: 16px; max-width: 600px; margin: auto;">
      <h2 style="color: #c084fc; border-bottom: 2px solid #1e293b; padding-bottom: 15px;">Your Weekly Performance</h2>
      <p style="line-height: 1.6; font-size: 14px;">Here's a snapshot of your achievements over the last 7 days:</p>
      <div style="display: grid; gap: 10px; margin: 20px 0;">
        <div style="background-color: #1e293b; padding: 15px; border-radius: 12px; font-size: 14px;">📚 <strong>Subjects Active:</strong> ${stats.subjectsCount}</div>
        <div style="background-color: #1e293b; padding: 15px; border-radius: 12px; font-size: 14px;">✅ <strong>Tasks Completed:</strong> ${stats.completedTasks}</div>
        <div style="background-color: #1e293b; padding: 15px; border-radius: 12px; font-size: 14px;">⏳ <strong>Study Time:</strong> ${stats.studyHours} hours</div>
      </div>
      <p style="line-height: 1.6; font-size: 14px;">Keep pushing your streaks to maintain levels! You're doing great.</p>
    </div>
  `;
  return { subject, html, text };
}

export function getAchievementUnlockEmail(name: string, badgeTitle: string, xp: number): EmailTemplate {
  const subject = `🏆 Achievement Unlocked: ${badgeTitle}!`;
  const text = `Congratulations ${name}! You unlocked the achievement: ${badgeTitle} and earned +${xp} XP.`;
  const html = `
    <div style="font-family: sans-serif; background-color: #0b0f19; color: #f8fafc; padding: 40px; border-radius: 16px; max-width: 600px; margin: auto; text-align: center;">
      <span style="font-size: 40px;">🏆</span>
      <h2 style="color: #fbbf24; margin: 15px 0;">Achievement Unlocked!</h2>
      <p style="font-size: 16px; font-weight: bold; color: #ffffff;">Congratulations, ${name || "Student"}!</p>
      <p style="line-height: 1.6; font-size: 14px; color: #94a3b8;">You have earned the badge:</p>
      <div style="background-color: #1e293b; padding: 20px; border-radius: 16px; display: inline-block; border: 1px solid rgba(251,191,36,0.2); margin: 15px 0;">
        <span style="font-size: 16px; font-weight: bold; color: #fbbf24; display: block;">${badgeTitle}</span>
        <span style="font-size: 12px; color: #34d399; font-weight: bold; display: block; margin-top: 5px;">+${xp} XP Awarded</span>
      </div>
      <p style="font-size: 12px; color: #64748b; margin-top: 20px;">Check your status at <a href="http://localhost:3000/dashboard/achievements" style="color: #22d3ee; text-decoration: none;">CogniFlow Achievements Gallery</a></p>
    </div>
  `;
  return { subject, html, text };
}

// Log email trigger simulation in local development logs
export async function sendMockEmail(templateName: string, recipient: string, template: EmailTemplate) {
  console.log(`[CogniFlow Email Simulator] Sending "${templateName}" email to: ${recipient}`);
  console.log(`Subject: ${template.subject}`);
  console.log(`Text preview: ${template.text}`);
  
  if (typeof window !== "undefined") {
    // Record into an active notification mock queue or local storage logs if needed
    const logs = JSON.parse(localStorage.getItem("cogniflow_email_logs") || "[]");
    logs.push({
      recipient,
      templateName,
      subject: template.subject,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem("cogniflow_email_logs", JSON.stringify(logs.slice(-50)));
  }
  return { success: true };
}
