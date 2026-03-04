"use client";

import { RichContentRenderer } from "@/components/shared/rich-content-renderer";
import { Badge } from "@/components/ui/badge";
import { Check, X, Zap, Target, AlertTriangle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuestionFormData } from "./types";

const difficultyConfig = {
    easy: { label: "Easy", icon: Zap, className: "text-green-600 bg-green-500/10" },
    medium: { label: "Medium", icon: Target, className: "text-yellow-600 bg-yellow-500/10" },
    hard: { label: "Hard", icon: AlertTriangle, className: "text-red-600 bg-red-500/10" },
};

interface QuestionPreviewProps {
    form: QuestionFormData;
    subjectName?: string;
    chapterName?: string;
}

export function QuestionPreview({ form, subjectName, chapterName }: QuestionPreviewProps) {
    const diff = difficultyConfig[form.difficulty];
    const DiffIcon = diff.icon;
    const hasContent = form.content.trim().length > 0;

    return (
        <div className="flex flex-col h-full">
            <div className="px-6 py-3 border-b bg-muted/10">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Live Preview
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {!hasContent ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <FileText className="size-12 mb-3 opacity-30" />
                        <p className="text-sm font-medium">Start typing to see preview</p>
                        <p className="text-xs mt-1">LaTeX math will render here</p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {/* Meta badges */}
                        <div className="flex flex-wrap gap-2">
                            {subjectName && chapterName && (
                                <Badge variant="outline" className="text-xs">
                                    {subjectName} › {chapterName}
                                </Badge>
                            )}
                            <Badge variant="secondary" className={cn("text-xs gap-1", diff.className)}>
                                <DiffIcon className="size-3" />
                                {diff.label}
                            </Badge>
                            {form.isPyq && (
                                <Badge className="text-xs">PYQ</Badge>
                            )}
                        </div>

                        {/* Question content */}
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Question</p>
                            <div className="rounded-lg border bg-card p-4">
                                <RichContentRenderer
                                    content={form.content}
                                    className="text-sm leading-relaxed"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        {form.description.trim() && (
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</p>
                                <div className="rounded-lg border border-muted bg-muted/10 p-4">
                                    <RichContentRenderer
                                        content={form.description}
                                        className="text-sm leading-relaxed text-muted-foreground"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Options */}
                        {form.options.some(o => o.optionText.trim()) && (
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Options</p>
                                <div className="space-y-2">
                                    {form.options.map((opt, idx) => {
                                        if (!opt.optionText.trim()) return null;
                                        return (
                                            <div
                                                key={idx}
                                                className={cn(
                                                    "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                                                    opt.isCorrect
                                                        ? "border-green-500/40 bg-green-500/5"
                                                        : "border-border bg-card"
                                                )}
                                            >
                                                <div className={cn(
                                                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5",
                                                    opt.isCorrect
                                                        ? "bg-green-500 text-white"
                                                        : "bg-muted text-muted-foreground"
                                                )}>
                                                    {opt.isCorrect ? <Check className="size-3" /> : String.fromCharCode(65 + idx)}
                                                </div>
                                                <RichContentRenderer
                                                    content={opt.optionText}
                                                    className="text-sm flex-1"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Explanation */}
                        {form.explanation.trim() && (
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Explanation</p>
                                <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
                                    <RichContentRenderer
                                        content={form.explanation}
                                        className="text-sm leading-relaxed"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
