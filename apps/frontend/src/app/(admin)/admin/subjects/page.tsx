"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { queryKeys } from "@/lib/query-keys";
import { api } from "@/lib/api-client";
import {
    BookOpen,
    Plus,
    Pencil,
    Trash2,
    Loader2,
    Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import type { Subject, Chapter, SubjectFormData, ChapterFormData } from "./_components/types";
import { SUBJECT_COLORS } from "./_components/types";
import { SubjectTabsContainer } from "./_components/subject-tabs";
import { ChapterCard } from "./_components/chapter-card";
import { SubjectModal } from "./_components/subject-modal";
import { ChapterModal } from "./_components/chapter-modal";
import { DeleteDialog } from "./_components/delete-dialog";

export default function AdminSubjectsPage() {
    const queryClient = useQueryClient();

    // ─── State ───────────────────────────────────────────────────────────────
    const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
    const [subjectModal, setSubjectModal] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const [subjectForm, setSubjectForm] = useState<SubjectFormData>({
        name: "", slug: "", color: "", icon: "",
    });
    const [deleteSubjectId, setDeleteSubjectId] = useState<string | null>(null);

    const [chapterModal, setChapterModal] = useState(false);
    const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
    const [chapterForm, setChapterForm] = useState<ChapterFormData>({
        name: "", slug: "", order: 0,
    });
    const [deleteChapterId, setDeleteChapterId] = useState<string | null>(null);

    // ─── Fetch subjects ──────────────────────────────────────────────────────
    const { data: subjectsData, isLoading: subjectsLoading } = useQuery({
        queryKey: queryKeys.subjects.list,
        queryFn: async () => {
            const res = await api.api.admin.subjects.$get();
            if (!res.ok) throw new Error("Failed to fetch subjects");
            return res.json();
        },
    });

    const subjects = (subjectsData as any)?.data as Subject[] | undefined;

    // Auto-select first subject
    useEffect(() => {
        if (subjects && subjects.length > 0 && !activeSubjectId) {
            setActiveSubjectId(subjects[0].id);
        }
    }, [subjects, activeSubjectId]);

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
        enabled: !!activeSubjectId,
    });

    const chapters = (chaptersData as any)?.data as Chapter[] | undefined;

    // ─── Subject mutations ───────────────────────────────────────────────────
    const createSubjectMutation = useMutation({
        mutationFn: async (body: { name: string; slug: string; color?: string; icon?: string }) => {
            const res = await api.api.admin.subjects.$post({ json: body as any });
            if (!res.ok) throw new Error("Failed to create subject");
            return res.json();
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all });
            setActiveSubjectId(data?.data?.id ?? activeSubjectId);
            closeSubjectModal();
        },
    });

    const updateSubjectMutation = useMutation({
        mutationFn: async ({ id, body }: { id: string; body: any }) => {
            const res = await (api.api.admin.subjects as any)[":id"].$put({
                param: { id },
                json: body,
            });
            if (!res.ok) throw new Error("Failed to update subject");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all });
            closeSubjectModal();
        },
    });

    const deleteSubjectMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await (api.api.admin.subjects as any)[":id"].$delete({
                param: { id },
            });
            if (!res.ok) throw new Error("Failed to delete subject");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all });
            setDeleteSubjectId(null);
            if (activeSubjectId === deleteSubjectId) {
                setActiveSubjectId(subjects?.[0]?.id ?? null);
            }
        },
    });

    // ─── Chapter mutations ───────────────────────────────────────────────────
    const createChapterMutation = useMutation({
        mutationFn: async (body: { name: string; slug: string; order?: number }) => {
            const res = await (api.api.admin.subjects as any)[":subjectId"].chapters.$post({
                param: { subjectId: activeSubjectId },
                json: body,
            });
            if (!res.ok) throw new Error("Failed to create chapter");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.chapters.bySubject(activeSubjectId!),
            });
            closeChapterModal();
        },
    });

    const updateChapterMutation = useMutation({
        mutationFn: async ({ id, body }: { id: string; body: any }) => {
            const res = await (api.api.admin.chapters as any)[":id"].$put({
                param: { id },
                json: body,
            });
            if (!res.ok) throw new Error("Failed to update chapter");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.chapters.bySubject(activeSubjectId!),
            });
            closeChapterModal();
        },
    });

    const deleteChapterMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await (api.api.admin.chapters as any)[":id"].$delete({
                param: { id },
            });
            if (!res.ok) throw new Error("Failed to delete chapter");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.chapters.bySubject(activeSubjectId!),
            });
            setDeleteChapterId(null);
        },
    });

    // ─── Modal helpers ───────────────────────────────────────────────────────
    const openCreateSubject = () => {
        setEditingSubject(null);
        setSubjectForm({ name: "", slug: "", color: SUBJECT_COLORS[0].hex, icon: "" });
        setSubjectModal(true);
    };

    const openEditSubject = (s: Subject) => {
        setEditingSubject(s);
        setSubjectForm({
            name: s.name,
            slug: s.slug,
            color: s.color ?? SUBJECT_COLORS[0].hex,
            icon: s.icon ?? "",
        });
        setSubjectModal(true);
    };

    const closeSubjectModal = () => {
        setSubjectModal(false);
        setEditingSubject(null);
    };

    const handleSubjectSubmit = () => {
        if (editingSubject) {
            updateSubjectMutation.mutate({ id: editingSubject.id, body: subjectForm });
        } else {
            createSubjectMutation.mutate(subjectForm);
        }
    };

    const openCreateChapter = () => {
        setEditingChapter(null);
        setChapterForm({ name: "", slug: "", order: (chapters?.length ?? 0) + 1 });
        setChapterModal(true);
    };

    const openEditChapter = (ch: Chapter) => {
        setEditingChapter(ch);
        setChapterForm({ name: ch.name, slug: ch.slug, order: ch.order ?? 0 });
        setChapterModal(true);
    };

    const closeChapterModal = () => {
        setChapterModal(false);
        setEditingChapter(null);
    };

    const handleChapterSubmit = () => {
        if (editingChapter) {
            updateChapterMutation.mutate({ id: editingChapter.id, body: chapterForm });
        } else {
            createChapterMutation.mutate(chapterForm);
        }
    };

    const isSavingSubject = createSubjectMutation.isPending || updateSubjectMutation.isPending;
    const isSavingChapter = createChapterMutation.isPending || updateChapterMutation.isPending;
    const activeSubject = subjects?.find((s) => s.id === activeSubjectId);

    return (
        <div className="space-y-6 p-4 md:p-6 md:pb-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Subjects &amp; Chapters
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Manage subjects and organize chapters within them.
                    </p>
                </div>
                <Button onClick={openCreateSubject} className="gap-2">
                    <Plus className="size-4" />
                    Add Subject
                </Button>
            </div>

            {/* Loading */}
            {subjectsLoading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
            )}

            {/* Empty State */}
            {!subjectsLoading && (!subjects || subjects.length === 0) && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-20">
                    <div className="rounded-full bg-muted p-4">
                        <BookOpen className="size-8 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">No subjects yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Create your first subject to start adding chapters.
                    </p>
                    <Button onClick={openCreateSubject} className="mt-4 gap-2">
                        <Plus className="size-4" />
                        Add Subject
                    </Button>
                </div>
            )}

            {/* ─── Subject Tabs + Active Subject Card ─────────────────────────── */}
            {subjects && subjects.length > 0 && (
                <div className="flex flex-col flex-1 gap-6">
                    <SubjectTabsContainer
                        subjects={subjects}
                        activeSubjectId={activeSubjectId}
                        onSubjectChange={setActiveSubjectId}
                    />

                    {activeSubject && (
                        <div className="flex flex-col flex-1 rounded-xl border border-border bg-background/40 overflow-auto min-h-[460px] shadow-sm">
                            {/* Card Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border bg-muted/10 p-4 gap-4">
                                <div className="flex items-center gap-3">
                                    {activeSubject.icon ? (
                                        <div className="w-10 h-10 flex-shrink-0 relative">
                                            <Image
                                                src={activeSubject.icon}
                                                alt={activeSubject.name}
                                                fill
                                                className="object-contain"
                                                sizes="40px"
                                            />
                                        </div>
                                    ) : (
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                                            style={{ backgroundColor: activeSubject.color || "#3b82f6" }}
                                        >
                                            {activeSubject.name.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <h2 className="font-semibold text-lg">{activeSubject.name}</h2>
                                        <p className="text-xs text-muted-foreground font-mono">
                                            /{activeSubject.slug}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => openEditSubject(activeSubject)}>
                                        <Pencil className="mr-1 size-3.5" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setDeleteSubjectId(activeSubject.id)}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="mr-1 size-3.5" />
                                        Delete
                                    </Button>
                                    <Button size="sm" onClick={openCreateChapter} className="gap-1">
                                        <Plus className="size-3.5" />
                                        Add Chapter
                                    </Button>
                                </div>
                            </div>

                            {/* Card Body - Chapters Grid */}
                            <div className="p-4 sm:p-6 flex-1 bg-muted/5 overflow-y-auto">
                                {chaptersLoading && (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="size-6 animate-spin text-muted-foreground" />
                                    </div>
                                )}

                                {!chaptersLoading && (!chapters || chapters.length === 0) && activeSubjectId && (
                                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background py-16">
                                        <Hash className="size-8 text-muted-foreground" />
                                        <h3 className="mt-3 text-base font-semibold">No chapters</h3>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Add chapters to organize questions in this subject.
                                        </p>
                                        <Button onClick={openCreateChapter} size="sm" className="mt-4 gap-1">
                                            <Plus className="size-3.5" />
                                            Add Chapter
                                        </Button>
                                    </div>
                                )}

                                {chapters && chapters.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {chapters.map((ch, idx) => (
                                            <ChapterCard
                                                key={ch.id}
                                                chapter={ch}
                                                index={idx}
                                                onEdit={openEditChapter}
                                                onDelete={setDeleteChapterId}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ─── Modals ─────────────────────────────────────────────────────── */}
            <SubjectModal
                open={subjectModal}
                onOpenChange={setSubjectModal}
                editingSubject={editingSubject}
                form={subjectForm}
                onFormChange={setSubjectForm}
                onSubmit={handleSubjectSubmit}
                onClose={closeSubjectModal}
                isSaving={isSavingSubject}
            />

            <ChapterModal
                open={chapterModal}
                onOpenChange={setChapterModal}
                editingChapter={editingChapter}
                form={chapterForm}
                onFormChange={setChapterForm}
                onSubmit={handleChapterSubmit}
                onClose={closeChapterModal}
                isSaving={isSavingChapter}
                subjectName={activeSubject?.name}
            />

            <DeleteDialog
                open={!!deleteSubjectId}
                onOpenChange={() => setDeleteSubjectId(null)}
                title="Delete Subject"
                description="This will permanently delete the subject and all its chapters. This action cannot be undone."
                onConfirm={() => deleteSubjectId && deleteSubjectMutation.mutate(deleteSubjectId)}
                isPending={deleteSubjectMutation.isPending}
            />

            <DeleteDialog
                open={!!deleteChapterId}
                onOpenChange={() => setDeleteChapterId(null)}
                title="Delete Chapter"
                description="This will permanently delete the chapter and all its questions. This action cannot be undone."
                onConfirm={() => deleteChapterId && deleteChapterMutation.mutate(deleteChapterId)}
                isPending={deleteChapterMutation.isPending}
            />
        </div>
    );
}
