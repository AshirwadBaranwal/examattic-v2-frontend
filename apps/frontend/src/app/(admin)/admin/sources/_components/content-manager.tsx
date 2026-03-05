"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { queryKeys } from "@/lib/query-keys";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Loader2, BookOpen } from "lucide-react";

import { SortableSectionCard, type Section } from "./section-card";
import { SectionDialog } from "./section-dialog";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Source {
    id: string;
    type: "pyq" | "mock";
    title: string;
    examId: string | null;
    examName?: string | null;
    status: "draft" | "published";
}

interface ContentManagerProps {
    sourceId: string;
    type: "pyq" | "mock";
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ContentManager({ sourceId, type }: ContentManagerProps) {
    const router = useRouter();
    const queryClient = useQueryClient();

    // Dialog state — null = create, object = edit
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingSection, setEditingSection] = useState<{
        id: string;
        name: string;
        timeLimit: number | null;
    } | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // ─── Queries ─────────────────────────────────────────────────────────────

    // Source details
    const { data: sourceData, isLoading: isLoadingSource } = useQuery({
        queryKey: queryKeys.sources.detail(sourceId),
        queryFn: async () => {
            const res = await (api.api.admin.sources as any)[":id"].$get({
                param: { id: sourceId },
            });
            if (!res.ok) throw new Error("Failed to fetch source");
            return res.json();
        },
    });
    const source = (sourceData as any)?.data as Source | undefined;

    // Sections
    const { data: sectionsData, isLoading: isLoadingSections } = useQuery({
        queryKey: queryKeys.sources.sections(sourceId),
        queryFn: async () => {
            const res = await (api.api.admin.sources as any)[":sourceId"][
                "sections"
            ].$get({ param: { sourceId } });
            if (!res.ok) throw new Error("Failed to fetch sections");
            return res.json();
        },
    });
    const sections = ((sectionsData as any)?.data as Section[]) ?? [];

    // All subjects (for name/icon lookup)
    const { data: subjectsData } = useQuery({
        queryKey: queryKeys.subjects.list,
        queryFn: async () => {
            const res = await api.api.admin.subjects.$get();
            if (!res.ok) throw new Error("Failed to fetch subjects");
            return res.json();
        },
    });
    const allSubjects = ((subjectsData as any)?.data ?? []) as {
        id: string;
        name: string;
        icon: string | null;
        color: string | null;
    }[];

    // Exam content — linked subjects for this source's exam
    const { data: examContentData } = useQuery({
        queryKey: queryKeys.exams.content(source?.examId ?? ""),
        queryFn: async () => {
            const res = await (api.api.admin.exams as any)[":examId"][
                "content"
            ].$get({ param: { examId: source!.examId } });
            if (!res.ok) throw new Error("Failed to fetch exam content");
            return res.json();
        },
        enabled: !!source?.examId,
    });

    // Filter subjects to only those linked to this exam
    const examSubjects = useMemo(() => {
        const linkedSubjectIds = (
            (examContentData as any)?.data?.linkedSubjects ?? []
        ).map((ls: any) => ls.subjectId);

        return allSubjects.filter((s) => linkedSubjectIds.includes(s.id));
    }, [examContentData, allSubjects]);

    // Collect all subject IDs already used across all sections
    const usedSubjectIds = useMemo(
        () => sections.flatMap((s) => s.subjects.map((sub) => sub.subjectId)),
        [sections]
    );

    // ─── Mutations (all with optimistic updates) ──────────────────────────────

    const sectionQueryKey = queryKeys.sources.sections(sourceId);

    const createSectionMutation = useMutation({
        mutationFn: async (data: {
            name: string;
            timeLimit: number | null;
        }) => {
            const res = await (api.api.admin.sources as any)[":sourceId"][
                "sections"
            ].$post({ param: { sourceId }, json: data });
            if (!res.ok) throw new Error("Failed to create section");
            return res.json();
        },
        onMutate: async (newData) => {
            await queryClient.cancelQueries({ queryKey: sectionQueryKey });
            const previous = queryClient.getQueryData(sectionQueryKey);

            queryClient.setQueryData(sectionQueryKey, (old: any) => ({
                ...old,
                data: [
                    ...(old?.data ?? []),
                    {
                        id: `temp-${Date.now()}`,
                        sourceId,
                        name: newData.name,
                        order: (old?.data?.length ?? 0),
                        timeLimit: newData.timeLimit,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        subjects: [],
                    },
                ],
            }));

            setDialogOpen(false);
            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous)
                queryClient.setQueryData(sectionQueryKey, context.previous);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: sectionQueryKey });
        },
    });

    const updateSectionMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await (api.api.admin.sources as any)[":sourceId"][
                "sections"
            ][":id"].$put({ param: { sourceId, id }, json: data });
            if (!res.ok) throw new Error("Failed to update section");
            return res.json();
        },
        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: sectionQueryKey });
            const previous = queryClient.getQueryData(sectionQueryKey);

            queryClient.setQueryData(sectionQueryKey, (old: any) => ({
                ...old,
                data: (old?.data ?? []).map((s: any) =>
                    s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s
                ),
            }));

            setDialogOpen(false);
            setEditingSection(null);
            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous)
                queryClient.setQueryData(sectionQueryKey, context.previous);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: sectionQueryKey });
        },
    });

    const deleteSectionMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await (api.api.admin.sources as any)[":sourceId"][
                "sections"
            ][":id"].$delete({ param: { sourceId, id } });
            if (!res.ok) throw new Error("Failed to delete section");
            return res.json();
        },
        onMutate: async (deletedId) => {
            await queryClient.cancelQueries({ queryKey: sectionQueryKey });
            const previous = queryClient.getQueryData(sectionQueryKey);

            queryClient.setQueryData(sectionQueryKey, (old: any) => ({
                ...old,
                data: (old?.data ?? []).filter((s: any) => s.id !== deletedId),
            }));

            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous)
                queryClient.setQueryData(sectionQueryKey, context.previous);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: sectionQueryKey });
        },
    });

    const reorderMutation = useMutation({
        mutationFn: async (items: { id: string; order: number }[]) => {
            const res = await (api.api.admin.sources as any)[":sourceId"][
                "sections"
            ]["reorder"].$patch({ param: { sourceId }, json: { items } });
            if (!res.ok) throw new Error("Failed to reorder");
            return res.json();
        },
        // Optimistic update handled inline in handleDragEnd
        onError: () => {
            queryClient.invalidateQueries({ queryKey: sectionQueryKey });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: sectionQueryKey });
        },
    });

    const upsertSubjectsMutation = useMutation({
        mutationFn: async ({
            sectionId,
            subjects,
        }: {
            sectionId: string;
            subjects: any[];
        }) => {
            const res = await (api.api.admin.sources as any)[":sourceId"][
                "sections"
            ][":id"]["subjects"].$put({
                param: { sourceId, id: sectionId },
                json: { subjects },
            });
            if (!res.ok) throw new Error("Failed to update subjects");
            return res.json();
        },
        onMutate: async ({ sectionId, subjects }) => {
            await queryClient.cancelQueries({ queryKey: sectionQueryKey });
            const previous = queryClient.getQueryData(sectionQueryKey);

            // Build optimistic subjects with full info from examSubjects
            const optimisticSubjects = subjects.map((s: any) => {
                const info = examSubjects.find((es) => es.id === s.subjectId);
                return {
                    id: `temp-${s.subjectId}`,
                    testSectionId: sectionId,
                    subjectId: s.subjectId,
                    subjectName: info?.name ?? "",
                    subjectIcon: info?.icon ?? null,
                    subjectColor: info?.color ?? null,
                    marks: s.marks,
                    negativeMarks: s.negativeMarks,
                    questionCount: s.questionCount,
                    questionLimit: s.questionLimit,
                };
            });

            queryClient.setQueryData(sectionQueryKey, (old: any) => ({
                ...old,
                data: (old?.data ?? []).map((sec: any) =>
                    sec.id === sectionId
                        ? { ...sec, subjects: optimisticSubjects }
                        : sec
                ),
            }));

            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous)
                queryClient.setQueryData(sectionQueryKey, context.previous);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: sectionQueryKey });
        },
    });

    // ─── Handlers ────────────────────────────────────────────────────────────

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;

            const oldIndex = sections.findIndex((s) => s.id === active.id);
            const newIndex = sections.findIndex((s) => s.id === over.id);
            if (oldIndex === -1 || newIndex === -1) return;

            const newOrder = arrayMove(sections, oldIndex, newIndex);
            const items = newOrder.map((s, i) => ({ id: s.id, order: i }));

            // Optimistic update
            queryClient.setQueryData(
                queryKeys.sources.sections(sourceId),
                (old: any) => ({
                    ...old,
                    data: newOrder.map((s, i) => ({ ...s, order: i })),
                })
            );
            reorderMutation.mutate(items);
        },
        [sections, queryClient, sourceId, reorderMutation]
    );

    const openCreateDialog = () => {
        setEditingSection(null);
        setDialogOpen(true);
    };

    const openEditDialog = (section: Section) => {
        setEditingSection({
            id: section.id,
            name: section.name,
            timeLimit: section.timeLimit,
        });
        setDialogOpen(true);
    };

    const handleDialogSubmit = (data: {
        name: string;
        timeLimit: number | null;
    }) => {
        if (editingSection) {
            updateSectionMutation.mutate({ id: editingSection.id, data });
        } else {
            createSectionMutation.mutate(data);
        }
    };

    const goBack = () => router.push(`/admin/${type}`);

    // ─── Loading ─────────────────────────────────────────────────────────────

    if (isLoadingSource || isLoadingSections) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6 p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={goBack}
                        className="shrink-0 rounded-xl"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">
                                {source?.title ?? "Loading..."}
                            </h1>
                            {source?.status && (
                                <Badge
                                    variant={
                                        source.status === "published"
                                            ? "default"
                                            : "secondary"
                                    }
                                    className="rounded-full"
                                >
                                    {source.status}
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                            {source?.examName && (
                                <Badge
                                    variant="outline"
                                    className="text-xs rounded-full"
                                >
                                    {source.examName}
                                </Badge>
                            )}
                            <span className="uppercase tracking-wider text-xs font-semibold">
                                {type}
                            </span>
                            <span className="text-muted-foreground/40">•</span>
                            <span>{sections.length} sections</span>
                        </div>
                    </div>
                </div>

                <Button
                    onClick={openCreateDialog}
                    className="gap-2 rounded-xl"
                >
                    <Plus className="size-4" />
                    Add Section
                </Button>
            </div>

            {/* Sections */}
            {sections.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/50 bg-card/50 py-20">
                    <div className="rounded-2xl bg-muted p-5">
                        <BookOpen className="size-8 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">
                        No sections yet
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground max-w-sm text-center">
                        Add sections to organize questions by subject and
                        configure scoring rules for each.
                    </p>
                    <Button
                        onClick={openCreateDialog}
                        className="mt-5 gap-2 rounded-xl"
                    >
                        <Plus className="size-4" />
                        Add First Section
                    </Button>
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={sections.map((s) => s.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-4">
                            {sections.map((section) => (
                                <SortableSectionCard
                                    key={section.id}
                                    section={section}
                                    onEditSection={openEditDialog}
                                    onDeleteSection={(id) =>
                                        deleteSectionMutation.mutate(id)
                                    }
                                    onUpdateSubjects={(sectionId, subjects) =>
                                        upsertSubjectsMutation.mutate({
                                            sectionId,
                                            subjects,
                                        })
                                    }
                                    availableSubjects={examSubjects}
                                    usedSubjectIds={usedSubjectIds}
                                    isSavingSubjects={
                                        upsertSubjectsMutation.isPending
                                    }
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            {/* Section Create / Edit Dialog */}
            <SectionDialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) setEditingSection(null);
                }}
                editingSection={editingSection}
                onSubmit={handleDialogSubmit}
                isPending={
                    createSectionMutation.isPending ||
                    updateSectionMutation.isPending
                }
            />
        </div>
    );
}
