"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { api } from "@/lib/api-client";
import { GraduationCap, Plus, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { Exam, ExamFormData } from "./_components/types";
import { defaultExamForm } from "./_components/types";
import { ExamCard } from "./_components/exam-card";
import { ExamModal } from "./_components/exam-modal";
import { DeleteDialog } from "./_components/delete-dialog";
import { ExamContentDialog } from "./_components/exam-content-dialog";

export default function AdminExamsPage() {
    const queryClient = useQueryClient();
    const [modalOpen, setModalOpen] = useState(false);
    const [editingExam, setEditingExam] = useState<Exam | null>(null);
    const [form, setForm] = useState<ExamFormData>(defaultExamForm);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [contentExam, setContentExam] = useState<Exam | null>(null);

    // ─── Fetch exams ─────────────────────────────────────────────────────────
    const { data, isLoading } = useQuery({
        queryKey: queryKeys.exams.list,
        queryFn: async () => {
            const res = await api.api.admin.exams.$get();
            if (!res.ok) throw new Error("Failed to fetch exams");
            return res.json();
        },
    });

    const exams = (data as any)?.data as Exam[] | undefined;

    // ─── Mutations ───────────────────────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: async (body: ExamFormData) => {
            const res = await api.api.admin.exams.$post({ json: body as any });
            if (!res.ok) throw new Error("Failed to create exam");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.exams.all });
            closeModal();
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, body }: { id: string; body: Partial<ExamFormData> }) => {
            const res = await (api.api.admin.exams as any)[":id"].$put({
                param: { id },
                json: body,
            });
            if (!res.ok) throw new Error("Failed to update exam");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.exams.all });
            closeModal();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await (api.api.admin.exams as any)[":id"].$delete({
                param: { id },
            });
            if (!res.ok) throw new Error("Failed to delete exam");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.exams.all });
            setDeleteId(null);
        },
    });

    const toggleStatusMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await (api.api.admin.exams as any)[":id"]["toggle"].$patch({
                param: { id },
            });
            if (!res.ok) throw new Error("Failed to toggle exam status");
            return res.json();
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.exams.all });
        },
    });

    // ─── Helpers ─────────────────────────────────────────────────────────────
    const openCreate = () => {
        setEditingExam(null);
        setForm(defaultExamForm);
        setModalOpen(true);
    };

    const openEdit = (exam: Exam) => {
        setEditingExam(exam);
        setForm({
            name: exam.name,
            slug: exam.slug,
            description: exam.description ?? "",
            duration: exam.duration,
            totalMarks: exam.totalMarks,
            totalQuestions: exam.totalQuestions,
        });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingExam(null);
        setForm(defaultExamForm);
    };

    const handleSubmit = () => {
        if (editingExam) {
            updateMutation.mutate({ id: editingExam.id, body: form });
        } else {
            createMutation.mutate(form);
        }
    };

    const handleToggleStatus = (exam: Exam) => {
        toggleStatusMutation.mutate(exam.id);
    };

    const isSaving = createMutation.isPending || updateMutation.isPending;

    const filteredExams = exams?.filter(
        (e) =>
            e.name.toLowerCase().includes(search.toLowerCase()) ||
            e.slug.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 p-4 md:p-6 md:pb-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Manage Exams
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Create and manage competitive exams on the platform.
                    </p>
                </div>
                <Button onClick={openCreate} className="gap-2">
                    <Plus className="size-4" />
                    Add Exam
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search exams..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
            )}

            {/* Empty State */}
            {!isLoading && (!filteredExams || filteredExams.length === 0) && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-20">
                    <div className="rounded-full bg-muted p-4">
                        <GraduationCap className="size-8 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">No exams yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Get started by adding your first exam.
                    </p>
                    <Button onClick={openCreate} className="mt-4 gap-2">
                        <Plus className="size-4" />
                        Add Exam
                    </Button>
                </div>
            )}

            {/* Exam Cards Grid */}
            {filteredExams && filteredExams.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredExams.map((exam) => (
                        <ExamCard
                            key={exam.id}
                            exam={exam}
                            onEdit={openEdit}
                            onDelete={setDeleteId}
                            onToggleStatus={handleToggleStatus}
                            onManageContent={setContentExam}
                        />
                    ))}
                </div>
            )}

            {/* ─── Modals ─────────────────────────────────────────────────────── */}
            <ExamModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                editingExam={editingExam}
                form={form}
                onFormChange={setForm}
                onSubmit={handleSubmit}
                onClose={closeModal}
                isSaving={isSaving}
            />

            <DeleteDialog
                open={!!deleteId}
                onOpenChange={() => setDeleteId(null)}
                title="Delete Exam"
                description="This action cannot be undone. This will permanently delete the exam and all its associated data."
                onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
                isPending={deleteMutation.isPending}
            />

            <ExamContentDialog
                open={!!contentExam}
                onOpenChange={(open) => !open && setContentExam(null)}
                exam={contentExam}
            />
        </div>
    );
}
