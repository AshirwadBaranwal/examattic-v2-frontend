"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import type { QuestionFormData } from "../_components/types";
import { defaultQuestionForm } from "../_components/types";
import { QuestionForm } from "../_components/question-form";
import { QuestionPreview } from "../_components/question-preview";

export default function AddQuestionPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();

    const sourceId = searchParams.get("sourceId");
    const examId = searchParams.get("examId");
    const sourceTitle = searchParams.get("sourceTitle");

    const sourceContext = sourceId
        ? { sourceId, examId: examId ?? undefined, sourceTitle: sourceTitle ?? "Source" }
        : null;

    const [form, setForm] = useState<QuestionFormData>(defaultQuestionForm);
    const [successCount, setSuccessCount] = useState(0);

    // Create mutation
    const createMutation = useMutation({
        mutationFn: async (body: QuestionFormData) => {
            const res = await fetch("http://localhost:8787/api/admin/questions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error("Failed to create question");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.questions.all });
            setSuccessCount((c) => c + 1);
        },
    });

    const handleSubmitAndExit = useCallback(() => {
        createMutation.mutate(form, {
            onSuccess: () => router.push("/admin/questions"),
        });
    }, [form, createMutation, router]);

    const handleSubmitAndNext = useCallback(() => {
        createMutation.mutate(form, {
            onSuccess: () => {
                // Keep subject + chapter + config, clear content
                setForm((prev) => ({
                    ...defaultQuestionForm,
                    chapterId: prev.chapterId,
                    difficulty: prev.difficulty,
                    marks: prev.marks,
                    negativeMarks: prev.negativeMarks,
                    isPyq: prev.isPyq,
                }));
            },
        });
    }, [form, createMutation]);

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            {/* Top bar */}
            <div className="flex items-center gap-3 border-b px-6 py-3 bg-background shrink-0">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/questions">
                        <ArrowLeft className="size-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-lg font-semibold">Add Question</h1>
                    {successCount > 0 && (
                        <p className="text-xs text-green-600 font-medium">
                            {successCount} question{successCount > 1 ? "s" : ""} added ✓
                        </p>
                    )}
                </div>
            </div>

            {/* Two-panel layout */}
            <div className="flex-1 flex min-h-0">
                {/* Left: Form */}
                <div className="w-1/2 border-r flex flex-col overflow-hidden">
                    <QuestionForm
                        form={form}
                        onFormChange={setForm}
                        onSubmit={handleSubmitAndExit}
                        onSubmitAndNext={handleSubmitAndNext}
                        onCancel={() => router.push("/admin/questions")}
                        isSaving={createMutation.isPending}
                        isEditing={false}
                        sourceContext={sourceContext}
                    />
                </div>

                {/* Right: Preview */}
                <div className="w-1/2 flex flex-col overflow-hidden bg-muted/5">
                    <QuestionPreview form={form} />
                </div>
            </div>
        </div>
    );
}
