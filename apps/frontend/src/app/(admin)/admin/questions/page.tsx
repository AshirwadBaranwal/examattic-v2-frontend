"use client";

import { useState, useMemo, useCallback } from "react";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { queryKeys } from "@/lib/query-keys";
import { api } from "@/lib/api-client";
import { HelpCircle, Plus, Loader2, Search, X, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

const LIMIT = 20;

export default function AdminQuestionsPage() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Source filter from URL
    const sourceIdParam = searchParams.get("sourceId");
    const sourceTitleParam = searchParams.get("sourceTitle");

    // Filters
    const [search, setSearch] = useState("");
    const [questionIdSearch, setQuestionIdSearch] = useState("");
    const [filterSubjectId, setFilterSubjectId] = useState<string>("all");
    const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
    const [filterIsPyq, setFilterIsPyq] = useState<string>("all");

    // Build query params (without page — handled by useInfiniteQuery)
    const filterParams = useMemo(() => {
        const params: Record<string, string | number | undefined> = {};
        if (questionIdSearch.trim()) {
            params.questionId = questionIdSearch.trim();
            return params; // questionId search ignores other filters
        }
        if (search) params.search = search;
        if (sourceIdParam) params.sourceId = sourceIdParam;
        if (filterSubjectId !== "all") params.subjectId = filterSubjectId;
        if (filterDifficulty !== "all") params.difficulty = filterDifficulty;
        if (filterIsPyq !== "all") params.isPyq = filterIsPyq;
        return params;
    }, [search, questionIdSearch, sourceIdParam, filterSubjectId, filterDifficulty, filterIsPyq]);

    // ─── Infinite query ─────────────────────────────────────────────────────
    const {
        data,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useInfiniteQuery({
        queryKey: queryKeys.questions.list(filterParams),
        queryFn: async ({ pageParam = 1 }) => {
            const searchP = new URLSearchParams();
            Object.entries(filterParams).forEach(([k, v]) => {
                if (v !== undefined) searchP.set(k, String(v));
            });
            searchP.set("page", String(pageParam));
            searchP.set("limit", String(LIMIT));

            const res = await fetch(
                `http://localhost:8787/api/admin/questions?${searchP.toString()}`,
                { credentials: "include" }
            );
            if (!res.ok) throw new Error("Failed to fetch questions");
            return res.json();
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage: any) => {
            const { page, totalPages } = lastPage.pagination;
            return page < totalPages ? page + 1 : undefined;
        },
    });

    // Flatten all pages into one list
    const questions = useMemo(
        () => data?.pages.flatMap((p: any) => p.data as Question[]) ?? [],
        [data]
    );
    const total = data?.pages[0]?.pagination?.total ?? 0;

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

    // Edit navigates to /questions/[id]/edit
    const openEdit = (q: Question) => {
        router.push(`/admin/questions/${q.id}/edit`);
    };

    // Clear source filter
    const clearSourceFilter = useCallback(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("sourceId");
        params.delete("sourceTitle");
        router.replace(`/admin/questions?${params.toString()}`);
    }, [searchParams, router]);

    // Reset all filters
    const resetFilters = useCallback(() => {
        setSearch("");
        setQuestionIdSearch("");
        setFilterSubjectId("all");
        setFilterDifficulty("all");
        setFilterIsPyq("all");
    }, []);

    const hasActiveFilters = search || questionIdSearch || filterSubjectId !== "all" || filterDifficulty !== "all" || filterIsPyq !== "all";

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
                        {total > 0 && (
                            <span className="ml-1 font-medium">
                                Showing {questions.length} of {total}
                            </span>
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

            {/* Source filter chip */}
            {sourceIdParam && (
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1.5 py-1 px-3 text-sm">
                        Source: {sourceTitleParam || sourceIdParam}
                        <button
                            onClick={clearSourceFilter}
                            className="ml-1 rounded-full hover:bg-muted p-0.5"
                        >
                            <X className="size-3" />
                        </button>
                    </Badge>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search questions..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="relative min-w-[180px] max-w-[220px]">
                    <Hash className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by ID..."
                        value={questionIdSearch}
                        onChange={(e) => setQuestionIdSearch(e.target.value)}
                        className="pl-9 font-mono text-xs"
                    />
                </div>
                <Select value={filterSubjectId} onValueChange={(v) => setFilterSubjectId(v)}>
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
                <Select value={filterDifficulty} onValueChange={(v) => setFilterDifficulty(v)}>
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
                <Select value={filterIsPyq} onValueChange={(v) => setFilterIsPyq(v)}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="true">PYQ Only</SelectItem>
                        <SelectItem value="false">Non-PYQ</SelectItem>
                    </SelectContent>
                </Select>
                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={resetFilters}>
                        <X className="size-3" /> Clear
                    </Button>
                )}
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
            )}

            {/* Empty State */}
            {!isLoading && questions.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-20">
                    <div className="rounded-full bg-muted p-4">
                        <HelpCircle className="size-8 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">
                        {questionIdSearch ? "No question found with that ID" : "No questions yet"}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {questionIdSearch
                            ? "Double-check the ID and try again."
                            : "Get started by adding your first question."}
                    </p>
                    {!questionIdSearch && (
                        <Button asChild className="mt-4 gap-2">
                            <Link href="/admin/questions/new">
                                <Plus className="size-4" />
                                Add Question
                            </Link>
                        </Button>
                    )}
                </div>
            )}

            {/* Question list */}
            {questions.length > 0 && (
                <div className="space-y-3">
                    {questions.map((q, idx) => (
                        <QuestionCard
                            key={q.id}
                            question={q}
                            index={idx + 1}
                            onEdit={openEdit}
                            onDelete={setDeleteId}
                        />
                    ))}
                </div>
            )}

            {/* Load More */}
            {hasNextPage && (
                <div className="flex justify-center pt-2 pb-4">
                    <Button
                        variant="outline"
                        size="lg"
                        className="gap-2 min-w-[200px]"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                    >
                        {isFetchingNextPage ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            "Load More Questions"
                        )}
                    </Button>
                </div>
            )}

            {/* End of list indicator */}
            {!isLoading && !hasNextPage && questions.length > 0 && questions.length >= LIMIT && (
                <p className="text-center text-xs text-muted-foreground py-4">
                    All {total} questions loaded
                </p>
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
