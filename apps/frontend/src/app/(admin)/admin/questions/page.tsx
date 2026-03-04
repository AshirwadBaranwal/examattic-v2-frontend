"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { queryKeys } from "@/lib/query-keys";
import { api } from "@/lib/api-client";
import { HelpCircle, Plus, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import type { Question } from "./_components/types";
import { QuestionCard } from "./_components/question-card";
import { DeleteDialog } from "./_components/delete-dialog";

export default function AdminQuestionsPage() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Filters
    const [search, setSearch] = useState("");
    const [filterSubjectId, setFilterSubjectId] = useState<string>("all");
    const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
    const [filterIsPyq, setFilterIsPyq] = useState<string>("all");
    const [page, setPage] = useState(1);

    const queryParams = useMemo(() => {
        const params: Record<string, string | number | undefined> = { page, limit: 20 };
        if (search) params.search = search;
        if (filterSubjectId !== "all") params.subjectId = filterSubjectId;
        if (filterDifficulty !== "all") params.difficulty = filterDifficulty;
        if (filterIsPyq !== "all") params.isPyq = filterIsPyq;
        return params;
    }, [search, filterSubjectId, filterDifficulty, filterIsPyq, page]);

    // ─── Fetch questions ─────────────────────────────────────────────────────
    const { data, isLoading } = useQuery({
        queryKey: queryKeys.questions.list(queryParams),
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            Object.entries(queryParams).forEach(([k, v]) => {
                if (v !== undefined) searchParams.set(k, String(v));
            });
            const res = await fetch(
                `http://localhost:8787/api/admin/questions?${searchParams.toString()}`,
                { credentials: "include" }
            );
            if (!res.ok) throw new Error("Failed to fetch questions");
            return res.json();
        },
    });

    const questions = data?.data as Question[] | undefined;
    const pagination = data?.pagination as { page: number; total: number; totalPages: number } | undefined;

    // ─── Fetch subjects for filter ───────────────────────────────────────────
    const { data: subjectsData } = useQuery({
        queryKey: queryKeys.subjects.list,
        queryFn: async () => {
            const res = await api.api.admin.subjects.$get();
            if (!res.ok) throw new Error("Failed to fetch subjects");
            return res.json();
        },
    });

    const subjects = (subjectsData as any)?.data as { id: string; name: string }[] | undefined;

    // ─── Delete mutation ─────────────────────────────────────────────────────
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`http://localhost:8787/api/admin/questions/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to delete question");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.questions.all });
            setDeleteId(null);
        },
    });

    // Edit navigates to /questions/[id]/edit (or we can use /new?editId=X for now)
    const openEdit = (q: Question) => {
        router.push(`/admin/questions/${q.id}/edit`);
    };

    return (
        <div className="space-y-6 p-4 md:p-6 md:pb-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Question Bank
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Manage all questions across subjects and chapters.
                        {pagination && (
                            <span className="ml-1 font-medium">{pagination.total} total</span>
                        )}
                    </p>
                </div>
                <Button asChild className="gap-2">
                    <Link href="/admin/questions/new">
                        <Plus className="size-4" />
                        Add Question
                    </Link>
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search questions..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="pl-9"
                    />
                </div>
                <Select value={filterSubjectId} onValueChange={(v) => { setFilterSubjectId(v); setPage(1); }}>
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Subject" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        {subjects?.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={filterDifficulty} onValueChange={(v) => { setFilterDifficulty(v); setPage(1); }}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filterIsPyq} onValueChange={(v) => { setFilterIsPyq(v); setPage(1); }}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="true">PYQ Only</SelectItem>
                        <SelectItem value="false">Non-PYQ</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
            )}

            {/* Empty State */}
            {!isLoading && (!questions || questions.length === 0) && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-20">
                    <div className="rounded-full bg-muted p-4">
                        <HelpCircle className="size-8 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">No questions yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Get started by adding your first question.
                    </p>
                    <Button asChild className="mt-4 gap-2">
                        <Link href="/admin/questions/new">
                            <Plus className="size-4" />
                            Add Question
                        </Link>
                    </Button>
                </div>
            )}

            {/* Question list */}
            {questions && questions.length > 0 && (
                <div className="space-y-3">
                    {questions.map((q, idx) => (
                        <QuestionCard
                            key={q.id}
                            question={q}
                            index={(page - 1) * 20 + idx + 1}
                            onEdit={openEdit}
                            onDelete={setDeleteId}
                        />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {page} of {pagination.totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= pagination.totalPages}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Next
                    </Button>
                </div>
            )}

            {/* Delete Dialog */}
            <DeleteDialog
                open={!!deleteId}
                onOpenChange={() => setDeleteId(null)}
                title="Delete Question"
                description="This will permanently delete the question and all its options. This action cannot be undone."
                onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
                isPending={deleteMutation.isPending}
            />
        </div>
    );
}
