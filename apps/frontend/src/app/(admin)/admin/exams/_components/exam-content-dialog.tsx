"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { queryKeys } from "@/lib/query-keys";
import { api } from "@/lib/api-client";
import {
    Loader2,
    BookOpen,
    Hash,
    Check,
    ChevronRight,
    GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Exam } from "./types";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SubjectItem {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    color: string | null;
}

interface ChapterItem {
    id: string;
    name: string;
    slug: string;
    order: number | null;
    subjectId: string;
}

interface ExamContentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    exam: Exam | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ExamContentDialog({
    open,
    onOpenChange,
    exam,
}: ExamContentDialogProps) {
    const queryClient = useQueryClient();

    // Selected subject in left panel
    const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);

    // Local editing state
    const [linkedSubjectIds, setLinkedSubjectIds] = useState<Set<string>>(new Set());
    const [subjectOrder, setSubjectOrder] = useState<string[]>([]);
    const [linkedChapterIds, setLinkedChapterIds] = useState<Set<string>>(new Set());
    const [hasChanges, setHasChanges] = useState(false);

    // ─── Fetch all subjects ──────────────────────────────────────────────────
    const { data: subjectsData, isLoading: subjectsLoading } = useQuery({
        queryKey: queryKeys.subjects.list,
        queryFn: async () => {
            const res = await api.api.admin.subjects.$get();
            if (!res.ok) throw new Error("Failed to fetch subjects");
            return res.json();
        },
        enabled: open,
    });

    const subjects = (subjectsData as any)?.data as SubjectItem[] | undefined;

    // ─── Fetch chapters for active subject ───────────────────────────────────
    const { data: chaptersData, isLoading: chaptersLoading } = useQuery({
        queryKey: queryKeys.chapters.bySubject(activeSubjectId ?? ""),
        queryFn: async () => {
            const res = await (api.api.admin.subjects as any)[":subjectId"].chapters.$get({
                param: { subjectId: activeSubjectId },
            });
            if (!res.ok) throw new Error("Failed to fetch chapters");
            return res.json();
        },
        enabled: open && !!activeSubjectId,
    });

    const chapters = (chaptersData as any)?.data as ChapterItem[] | undefined;

    // ─── Fetch existing linked content ───────────────────────────────────────
    const { data: contentData, isLoading: contentLoading } = useQuery({
        queryKey: queryKeys.exams.content(exam?.id ?? ""),
        queryFn: async () => {
            const res = await (api.api.admin.exams as any)[":examId"].content.$get({
                param: { examId: exam?.id },
            });
            if (!res.ok) throw new Error("Failed to fetch exam content");
            return res.json();
        },
        enabled: open && !!exam?.id,
    });

    // Initialize local state from fetched data
    useEffect(() => {
        if (contentData && subjects) {
            const data = (contentData as any)?.data;
            const sIds = new Set<string>(
                (data?.linkedSubjects ?? []).map((ls: any) => ls.subjectId)
            );
            const cIds = new Set<string>(
                (data?.linkedChapters ?? []).map((lc: any) => lc.chapterId)
            );

            // Build ordered subject list
            const orderedLinked = (data?.linkedSubjects ?? [])
                .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
                .map((ls: any) => ls.subjectId);

            setLinkedSubjectIds(sIds);
            setLinkedChapterIds(cIds);
            setSubjectOrder(orderedLinked);
            setHasChanges(false);

            // Auto-select first linked subject, or first subject
            if (orderedLinked.length > 0) {
                setActiveSubjectId(orderedLinked[0]);
            } else if (subjects.length > 0) {
                setActiveSubjectId(subjects[0].id);
            }
        }
    }, [contentData, subjects]);

    // ─── Save mutation ───────────────────────────────────────────────────────
    const saveMutation = useMutation({
        mutationFn: async () => {
            const seen = new Set<string>();
            const subjectsPayload: { subjectId: string; order: number }[] = [];

            // Add from ordered list first
            for (const id of subjectOrder) {
                if (linkedSubjectIds.has(id) && !seen.has(id)) {
                    seen.add(id);
                    subjectsPayload.push({ subjectId: id, order: subjectsPayload.length + 1 });
                }
            }

            // Then any linked subjects not yet in the order
            linkedSubjectIds.forEach((id) => {
                if (!seen.has(id)) {
                    seen.add(id);
                    subjectsPayload.push({ subjectId: id, order: subjectsPayload.length + 1 });
                }
            });

            const res = await (api.api.admin.exams as any)[":examId"].content.$put({
                param: { examId: exam?.id },
                json: {
                    subjects: subjectsPayload,
                    chapterIds: Array.from(linkedChapterIds),
                },
            });
            if (!res.ok) throw new Error("Failed to save exam content");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.exams.content(exam?.id ?? ""),
            });
            setHasChanges(false);
        },
    });

    // ─── Handlers ────────────────────────────────────────────────────────────
    const toggleSubject = useCallback(
        (subjectId: string) => {
            setLinkedSubjectIds((prev) => {
                const next = new Set(prev);
                if (next.has(subjectId)) {
                    next.delete(subjectId);
                    // Also remove all chapters of this subject
                    if (chapters && activeSubjectId === subjectId) {
                        setLinkedChapterIds((cPrev) => {
                            const cNext = new Set(cPrev);
                            chapters.forEach((ch) => cNext.delete(ch.id));
                            return cNext;
                        });
                    }
                    setSubjectOrder((o) => o.filter((id) => id !== subjectId));
                } else {
                    next.add(subjectId);
                    setSubjectOrder((o) => [...o, subjectId]);
                }
                return next;
            });
            setHasChanges(true);
        },
        [chapters, activeSubjectId]
    );

    const toggleChapter = useCallback((chapterId: string) => {
        setLinkedChapterIds((prev) => {
            const next = new Set(prev);
            if (next.has(chapterId)) {
                next.delete(chapterId);
            } else {
                next.add(chapterId);
            }
            return next;
        });
        setHasChanges(true);
    }, []);

    const selectAllChapters = useCallback(() => {
        if (!chapters) return;
        setLinkedChapterIds((prev) => {
            const next = new Set(prev);
            chapters.forEach((ch) => next.add(ch.id));
            return next;
        });
        setHasChanges(true);
    }, [chapters]);

    const deselectAllChapters = useCallback(() => {
        if (!chapters) return;
        setLinkedChapterIds((prev) => {
            const next = new Set(prev);
            chapters.forEach((ch) => next.delete(ch.id));
            return next;
        });
        setHasChanges(true);
    }, [chapters]);

    // ─── Computed ────────────────────────────────────────────────────────────
    const linkedSubjectCount = linkedSubjectIds.size;
    const totalSubjects = subjects?.length ?? 0;

    const linkedChapterCount = useMemo(() => {
        if (!chapters) return 0;
        return chapters.filter((ch) => linkedChapterIds.has(ch.id)).length;
    }, [chapters, linkedChapterIds]);

    const totalChapters = chapters?.length ?? 0;
    const activeSubject = subjects?.find((s) => s.id === activeSubjectId);
    const isSubjectLinked = activeSubjectId ? linkedSubjectIds.has(activeSubjectId) : false;
    const isLoading = subjectsLoading || contentLoading;

    if (!exam) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] w-[900px] h-[600px] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <BookOpen className="size-5" />
                        Manage Content: {exam.name}
                    </DialogTitle>
                    <DialogDescription>
                        Select which subjects and chapters are part of this exam&apos;s syllabus.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="size-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="flex-1 flex min-h-0 overflow-hidden h-[440px]">
                        {/* ── Left Panel: Subjects ──────────────────────── */}
                        <div className="w-[40%] border-r flex flex-col bg-muted/5">
                            <div className="px-4 py-3 border-b bg-muted/10">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Subjects
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Linked: {linkedSubjectCount}/{totalSubjects}
                                </p>
                            </div>
                            <ScrollArea className="flex-1 h-0">
                                <div className="p-2 space-y-1">
                                    {subjects?.map((subj) => {
                                        const isLinked = linkedSubjectIds.has(subj.id);
                                        const isActive = activeSubjectId === subj.id;
                                        const subjectColor = subj.color || "#3b82f6";

                                        return (
                                            <div
                                                key={subj.id}
                                                className={cn(
                                                    "flex items-center gap-2 rounded-lg p-2 transition-colors cursor-pointer group",
                                                    isActive
                                                        ? "bg-accent"
                                                        : "hover:bg-accent/50"
                                                )}
                                                onClick={() => setActiveSubjectId(subj.id)}
                                            >
                                                <Checkbox
                                                    checked={isLinked}
                                                    onCheckedChange={() => toggleSubject(subj.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="shrink-0"
                                                />

                                                {subj.icon ? (
                                                    <div className="w-7 h-7 flex-shrink-0 relative">
                                                        <Image
                                                            src={subj.icon}
                                                            alt={subj.name}
                                                            fill
                                                            className="object-contain"
                                                            sizes="28px"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div
                                                        className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                                                        style={{ backgroundColor: subjectColor }}
                                                    >
                                                        {subj.name.charAt(0)}
                                                    </div>
                                                )}

                                                <span className={cn(
                                                    "text-sm font-medium flex-1 truncate",
                                                    isLinked ? "text-foreground" : "text-muted-foreground"
                                                )}>
                                                    {subj.name}
                                                </span>

                                                {isLinked && (
                                                    <Check className="size-3.5 text-primary shrink-0" />
                                                )}

                                                <ChevronRight className={cn(
                                                    "size-3.5 shrink-0 transition-colors",
                                                    isActive ? "text-foreground" : "text-muted-foreground/40"
                                                )} />
                                            </div>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* ── Right Panel: Chapters ─────────────────────── */}
                        <div className="w-[60%] flex flex-col">
                            <div className="px-4 py-3 border-b bg-muted/10 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        {activeSubject
                                            ? `Chapters in "${activeSubject.name}"`
                                            : "Select a subject"}
                                    </p>
                                    {activeSubject && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Linked: {linkedChapterCount}/{totalChapters}
                                        </p>
                                    )}
                                </div>
                                {activeSubject && isSubjectLinked && chapters && chapters.length > 0 && (
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs h-7"
                                            onClick={selectAllChapters}
                                        >
                                            Select All
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs h-7"
                                            onClick={deselectAllChapters}
                                        >
                                            Deselect All
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <ScrollArea className="flex-1 h-0">
                                {!activeSubject && (
                                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                        <BookOpen className="size-8 mb-2" />
                                        <p className="text-sm">Click a subject to manage its chapters</p>
                                    </div>
                                )}

                                {activeSubject && !isSubjectLinked && (
                                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                        <Hash className="size-8 mb-2" />
                                        <p className="text-sm font-medium">Subject not linked</p>
                                        <p className="text-xs mt-1">
                                            Link &quot;{activeSubject.name}&quot; to this exam first to manage chapters.
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-3"
                                            onClick={() => toggleSubject(activeSubject.id)}
                                        >
                                            Link Subject
                                        </Button>
                                    </div>
                                )}

                                {activeSubject && isSubjectLinked && chaptersLoading && (
                                    <div className="flex items-center justify-center py-20">
                                        <Loader2 className="size-6 animate-spin text-muted-foreground" />
                                    </div>
                                )}

                                {activeSubject && isSubjectLinked && !chaptersLoading && (!chapters || chapters.length === 0) && (
                                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                        <Hash className="size-8 mb-2" />
                                        <p className="text-sm">No chapters in this subject yet</p>
                                    </div>
                                )}

                                {activeSubject && isSubjectLinked && chapters && chapters.length > 0 && (
                                    <div className="p-3 space-y-1">
                                        {chapters.map((ch, idx) => {
                                            const isLinked = linkedChapterIds.has(ch.id);
                                            return (
                                                <div
                                                    key={ch.id}
                                                    onClick={() => toggleChapter(ch.id)}
                                                    className={cn(
                                                        "flex items-center gap-3 rounded-lg p-2.5 transition-colors cursor-pointer",
                                                        isLinked
                                                            ? "bg-primary/5 hover:bg-primary/10"
                                                            : "hover:bg-accent/50"
                                                    )}
                                                >
                                                    <Checkbox
                                                        checked={isLinked}
                                                        onCheckedChange={() => toggleChapter(ch.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="shrink-0"
                                                    />
                                                    <span className="flex size-6 shrink-0 items-center justify-center rounded text-[10px] font-bold text-muted-foreground bg-muted">
                                                        {idx + 1}
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={cn(
                                                            "text-sm font-medium truncate",
                                                            isLinked ? "text-foreground" : "text-muted-foreground"
                                                        )}>
                                                            {ch.name}
                                                        </p>
                                                        <p className="text-[11px] text-muted-foreground font-mono truncate">
                                                            /{ch.slug}
                                                        </p>
                                                    </div>
                                                    {isLinked && (
                                                        <Check className="size-3.5 text-primary shrink-0" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    </div>
                )}

                <DialogFooter className="px-6 py-4 border-t">
                    <div className="flex items-center gap-2 w-full justify-between">
                        <p className="text-xs text-muted-foreground">
                            {linkedSubjectCount} subjects, {" "}
                            {linkedChapterIds.size} chapters linked
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => saveMutation.mutate()}
                                disabled={!hasChanges || saveMutation.isPending}
                            >
                                {saveMutation.isPending && (
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                )}
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
