"use client";

import { GripVertical, Pencil, Trash2 } from "lucide-react";
import type { Chapter } from "./types";

interface ChapterCardProps {
    chapter: Chapter;
    index: number;
    onEdit: (chapter: Chapter) => void;
    onDelete: (id: string) => void;
}

export function ChapterCard({ chapter, index, onEdit, onDelete }: ChapterCardProps) {
    return (
        <div className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm relative">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <GripVertical className="size-4 shrink-0 text-muted-foreground/30 cursor-grab hover:text-foreground" />
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
                        {index + 1}
                    </span>
                </div>
                <div className="flex gap-1 opacity-100 sm:opacity-0 transition-opacity sm:group-hover:opacity-100">
                    <button
                        onClick={() => onEdit(chapter)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        title="Edit Chapter"
                    >
                        <Pencil className="size-3.5" />
                    </button>
                    <button
                        onClick={() => onDelete(chapter.id)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Delete Chapter"
                    >
                        <Trash2 className="size-3.5" />
                    </button>
                </div>
            </div>

            <div className="min-w-0 flex-1 pl-1">
                <p className="font-semibold text-sm line-clamp-1" title={chapter.name}>
                    {chapter.name}
                </p>
                <p
                    className="text-xs text-muted-foreground font-mono mt-1 line-clamp-1"
                    title={`/${chapter.slug}`}
                >
                    /{chapter.slug}
                </p>
            </div>
        </div>
    );
}
