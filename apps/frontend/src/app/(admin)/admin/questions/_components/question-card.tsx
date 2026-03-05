"use client";

import { Check, X, Zap, Target, AlertTriangle, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { Question } from "./types";

const difficultyConfig = {
    easy: { label: "Easy", icon: Zap, variant: "secondary" as const, className: "text-green-600 bg-green-500/10" },
    medium: { label: "Medium", icon: Target, variant: "secondary" as const, className: "text-yellow-600 bg-yellow-500/10" },
    hard: { label: "Hard", icon: AlertTriangle, variant: "secondary" as const, className: "text-red-600 bg-red-500/10" },
};

interface QuestionCardProps {
    question: Question;
    index: number;
    onEdit: (question: Question) => void;
    onDelete: (id: string) => void;
}

export function QuestionCard({ question, index, onEdit, onDelete }: QuestionCardProps) {
    const diff = difficultyConfig[question.difficulty];
    const DiffIcon = diff.icon;
    const [copied, setCopied] = useState(false);

    const copyId = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(question.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div
            className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/30 cursor-pointer"
            onClick={() => onEdit(question)}
        >
            {/* Header */}
            <div className="flex items-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
                    {index}
                </span>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-relaxed line-clamp-2">
                        {question.content}
                    </p>
                </div>
            </div>

            {/* Options preview */}
            <div className="mt-3 ml-10 grid grid-cols-2 gap-1.5">
                {question.options.slice(0, 4).map((opt, idx) => (
                    <div
                        key={opt.id}
                        className={cn(
                            "flex items-center gap-1.5 rounded px-2 py-1 text-xs",
                            opt.isCorrect
                                ? "bg-green-500/10 text-green-700 dark:text-green-400"
                                : "bg-muted/50 text-muted-foreground"
                        )}
                    >
                        {opt.isCorrect ? (
                            <Check className="size-3 shrink-0" />
                        ) : (
                            <X className="size-3 shrink-0 opacity-40" />
                        )}
                        <span className="truncate">
                            {String.fromCharCode(65 + idx)}. {opt.optionText || "(image)"}
                        </span>
                    </div>
                ))}
            </div>

            {/* Footer badges */}
            <div className="mt-3 ml-10 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {question.subjectName} › {question.chapterName}
                </Badge>
                <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0 gap-0.5", diff.className)}>
                    <DiffIcon className="size-2.5" />
                    {diff.label}
                </Badge>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {question.marks} marks
                </Badge>
                {question.isPyq && (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0">
                        PYQ
                    </Badge>
                )}
                <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 font-mono cursor-pointer gap-1 hover:bg-muted transition-colors"
                    onClick={copyId}
                >
                    {copied ? (
                        <><Check className="size-2.5 text-green-500" /> Copied</>
                    ) : (
                        <><Copy className="size-2.5" /> {question.id.slice(0, 8)}…</>
                    )}
                </Badge>
            </div>
        </div>
    );
}
