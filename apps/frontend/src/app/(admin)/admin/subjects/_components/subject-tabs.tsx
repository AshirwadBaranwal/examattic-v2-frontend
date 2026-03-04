"use client";

import { memo } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Subject } from "./types";

// ─── SubjectTab ──────────────────────────────────────────────────────────────

interface SubjectTabProps {
    subject: Subject;
    isActive: boolean;
    onClick: () => void;
    chapterCount?: number;
}

const SubjectTab = memo(function SubjectTab({
    subject,
    isActive,
    onClick,
    chapterCount = 0,
}: SubjectTabProps) {
    const subjectColor = subject.color || "hsl(var(--primary))";

    return (
        <button
            onClick={onClick}
            className={cn(
                "group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border-2",
                "whitespace-nowrap min-w-[180px]",
                isActive
                    ? "border-primary bg-primary/5 text-foreground shadow-sm"
                    : "border-transparent bg-muted/40 hover:bg-muted hover:border-muted text-muted-foreground hover:text-foreground"
            )}
            style={{
                borderColor: isActive ? subjectColor : undefined,
                backgroundColor: isActive ? `${subjectColor}10` : undefined,
            }}
        >
            {subject.icon ? (
                <div className="w-8 h-8 flex-shrink-0 relative">
                    <Image
                        src={subject.icon}
                        alt={subject.name}
                        fill
                        className="object-contain"
                        sizes="32px"
                    />
                </div>
            ) : (
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                    style={{ backgroundColor: subjectColor }}
                >
                    {subject.name.charAt(0)}
                </div>
            )}

            <div className="flex flex-col items-start text-left">
                <span className="font-semibold text-sm leading-tight">{subject.name}</span>
                <span className="text-xs text-muted-foreground">
                    {chapterCount} Chapters
                </span>
            </div>
        </button>
    );
});

// ─── SubjectTabsContainer ────────────────────────────────────────────────────

interface SubjectTabsContainerProps {
    subjects: Subject[];
    activeSubjectId: string | null;
    onSubjectChange: (subjectId: string) => void;
}

export const SubjectTabsContainer = memo(function SubjectTabsContainer({
    subjects,
    activeSubjectId,
    onSubjectChange,
}: SubjectTabsContainerProps) {
    if (subjects.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Select Subject
            </p>
            <div
                className="flex gap-3 overflow-x-auto pb-2 scrollbar-none"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
                {subjects.map((subject) => (
                    <SubjectTab
                        key={subject.id}
                        subject={subject}
                        isActive={activeSubjectId === subject.id}
                        onClick={() => onSubjectChange(subject.id)}
                        chapterCount={subject.chapterCount}
                    />
                ))}
            </div>
        </div>
    );
});
