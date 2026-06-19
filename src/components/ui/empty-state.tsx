import React from "react";
import { Card, CardContent } from "./card";
import { Button } from "./button";
import { LucideIcon, HelpCircle } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon = HelpCircle,
  actionText,
  onAction,
  className = ""
}: EmptyStateProps) {
  return (
    <Card className={`border-white/5 bg-white/[0.01] shadow-none border-dashed rounded-3xl ${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-12 w-12 rounded-2xl bg-white/5 text-slate-400 flex items-center justify-center mb-4">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="text-xs text-slate-400 max-w-[280px] mt-1.5 leading-relaxed">{description}</p>
        {actionText && onAction && (
          <Button onClick={onAction} variant="secondary" size="sm" className="mt-5 border border-white/5">
            {actionText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
