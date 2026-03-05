"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { ArrowLeft, Loader2, Copy, Check, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

import type { Question, QuestionFormData } from "../../_components/types";
import { defaultQuestionForm } from "../../_components/types";
import { QuestionForm } from "../../_components/question-form";
import { QuestionPreview } from "../../_components/question-preview";

export default function EditQuestionPage() {
    const router = useRouter();
    const params = useParams();
    const queryClient = useQueryClient();
    const questionId = params.id as string;

    const [form, setForm] = useState<QuestionFormData>(defaultQuestionForm);
    const [copied, setCopied] = useState(false);

    const copyId = () => {
        navigator.clipboard.writeText(questionId);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    // Fetch existing question
    const { data, isLoading } = useQuery({
        queryKey: queryKeys.questions.detail(questionId),
        queryFn: async () => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"}/api/admin/questions/${questionId}`, {
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed");
            return res.json();
        },
        enabled: !!questionId,
    });

    // Initialize form from fetched data
    useEffect(() => {
        const q = data?.data as Question | undefined;
        if (q) {
            setForm({
                chapterId: q.chapterId,
                content: q.content,
                description: q.description ?? "",
                image: q.image ?? "",
                explanation: q.explanation ?? "",
                explanationImage: q.explanationImage ?? "",
                difficulty: q.difficulty,
                marks: q.marks,
                negativeMarks: q.negativeMarks ?? "0.25",
                isPyq: q.isPyq,
                options: q.options.map((o) => ({
                    optionText: o.optionText ?? "",
                    optionImage: o.optionImage ?? "",
                    isCorrect: o.isCorrect,
                })),
            });
        }
    }, [data]);

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async (body: Partial<QuestionFormData>) => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"}/api/admin/questions/${questionId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error("Failed to update question");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.questions.all });
            router.push("/admin/questions");
        },
    });

    const handleSubmit = () => {
        updateMutation.mutate(form);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            {/* Top bar */}
            <div className="flex items-center justify-between border-b px-6 py-3 bg-background shrink-0">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild className="shrink-0">
                        <Link href="/admin/questions">
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-semibold">Edit Question</h1>
                            <Badge
                                variant="outline"
                                className="font-mono text-xs cursor-pointer hover:bg-muted gap-1 py-0"
                                onClick={copyId}
                            >
                                {copied ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
                                {questionId}
                            </Badge>
                        </div>
                        {data?.data?.appearances && data.data.appearances.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                                <LinkIcon className="size-3" />
                                <span>Linked to:</span>
                                <div className="flex flex-wrap gap-1">
                                    {data.data.appearances.map((app: any) => (
                                        <Badge key={app.sourceId} variant="secondary" className="px-1.5 py-0 text-[10px]">
                                            {app.sourceTitle}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Two-panel layout */}
            <div className="flex-1 flex min-h-0">
                <div className="w-1/2 border-r flex flex-col overflow-hidden">
                    <QuestionForm
                        form={form}
                        onFormChange={setForm}
                        onSubmit={handleSubmit}
                        onSubmitAndNext={() => { }}
                        onCancel={() => router.push("/admin/questions")}
                        isSaving={updateMutation.isPending}
                        isEditing={true}
                    />
                </div>
                <div className="w-1/2 flex flex-col overflow-hidden bg-muted/5">
                    <QuestionPreview form={form} />
                </div>
            </div>
        </div>
    );
}
