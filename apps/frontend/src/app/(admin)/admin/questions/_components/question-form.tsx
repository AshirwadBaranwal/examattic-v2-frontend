"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { api } from "@/lib/api-client";
import { Plus, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { LaTeXEditor, OptionEditor } from "@/components/shared/latex-editor";
import { cn } from "@/lib/utils";
import type { QuestionFormData, OptionFormData } from "./types";
import { defaultOptionForm } from "./types";

// ─── Types ───────────────────────────────────────────────────────────────────

interface QuestionFormProps {
    form: QuestionFormData;
    onFormChange: (form: QuestionFormData) => void;
    onSubmit: () => void;
    onSubmitAndNext: () => void;
    onCancel: () => void;
    isSaving: boolean;
    isEditing: boolean;
    sourceContext?: { examId?: string; sourceId?: string; sourceTitle?: string } | null;
}

interface SubjectItem { id: string; name: string; }
interface ChapterItem { id: string; name: string; subjectId: string; }

// ─── Component ───────────────────────────────────────────────────────────────

export function QuestionForm({
    form,
    onFormChange,
    onSubmit,
    onSubmitAndNext,
    onCancel,
    isSaving,
    isEditing,
    sourceContext,
}: QuestionFormProps) {
    const [selectedSubject, setSelectedSubject] = React.useState<string>("");

    // Fetch subjects
    const { data: subjectsData } = useQuery({
        queryKey: queryKeys.subjects.list,
        queryFn: async () => {
            const res = await api.api.admin.subjects.$get();
            if (!res.ok) throw new Error("Failed");
            return res.json();
        },
    });
    const subjects = (subjectsData as any)?.data as SubjectItem[] | undefined;

    // Fetch chapters for selected subject
    const { data: chaptersData } = useQuery({
        queryKey: queryKeys.chapters.bySubject(selectedSubject),
        queryFn: async () => {
            const res = await (api.api.admin.subjects as any)[":subjectId"].chapters.$get({
                param: { subjectId: selectedSubject },
            });
            if (!res.ok) throw new Error("Failed");
            return res.json();
        },
        enabled: !!selectedSubject,
    });
    const chapters = (chaptersData as any)?.data as ChapterItem[] | undefined;

    const updateField = <K extends keyof QuestionFormData>(key: K, value: QuestionFormData[K]) => {
        onFormChange({ ...form, [key]: value });
    };

    const updateOption = (index: number, field: keyof OptionFormData, value: string | boolean) => {
        const newOptions = [...form.options];
        newOptions[index] = { ...newOptions[index], [field]: value };
        if (field === "isCorrect" && value === true) {
            newOptions.forEach((opt, i) => { if (i !== index) opt.isCorrect = false; });
        }
        onFormChange({ ...form, options: newOptions });
    };

    const addOption = () => {
        onFormChange({ ...form, options: [...form.options, { ...defaultOptionForm }] });
    };

    const removeOption = (index: number) => {
        if (form.options.length <= 2) return;
        onFormChange({ ...form, options: form.options.filter((_, i) => i !== index) });
    };

    const handleSubjectChange = (subjectId: string) => {
        setSelectedSubject(subjectId);
        updateField("chapterId", "");
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Source context banner */}
                {sourceContext && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                        <p className="text-xs font-medium text-primary uppercase tracking-wider">Adding to Source</p>
                        <p className="text-sm font-medium mt-1">{sourceContext.sourceTitle}</p>
                    </div>
                )}

                {/* Subject → Chapter */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Subject</Label>
                        <Select value={selectedSubject} onValueChange={handleSubjectChange}>
                            <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                            <SelectContent>
                                {subjects?.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Chapter *</Label>
                        <Select value={form.chapterId} onValueChange={(v) => updateField("chapterId", v)} disabled={!selectedSubject}>
                            <SelectTrigger><SelectValue placeholder="Select chapter" /></SelectTrigger>
                            <SelectContent>
                                {chapters?.map((ch) => (
                                    <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Question content */}
                <LaTeXEditor
                    label="Question Content *"
                    value={form.content}
                    onChange={(v) => updateField("content", v)}
                    placeholder="Type question here... Use \( x^2 \) for inline math"
                    helpText="Use \( ... \) for inline math, \[ ... \] for block math"
                    minHeight="100px"
                />

                {/* Description */}
                <LaTeXEditor
                    label="Description (optional)"
                    value={form.description}
                    onChange={(v) => updateField("description", v)}
                    placeholder="Additional context, diagram description, or setup text..."
                    helpText=""
                    minHeight="60px"
                />

                {/* Config row */}
                <div className="flex items-center gap-4">
                    <div className="space-y-1.5 w-[160px]">
                        <Label className="text-xs font-medium">Difficulty *</Label>
                        <Select value={form.difficulty} onValueChange={(v) => updateField("difficulty", v as any)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="easy">Easy</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2 mt-5">
                        <Checkbox id="isPyq" checked={form.isPyq} onCheckedChange={(v) => updateField("isPyq", v === true)} />
                        <Label htmlFor="isPyq" className="text-sm cursor-pointer">PYQ</Label>
                    </div>
                </div>

                {/* Options */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Options (mark correct answer)</Label>
                        {form.options.length < 6 && (
                            <Button type="button" variant="ghost" size="sm" className="text-xs h-7" onClick={addOption}>
                                <Plus className="size-3 mr-1" /> Add Option
                            </Button>
                        )}
                    </div>
                    <div className="space-y-2">
                        {form.options.map((opt, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "flex items-start gap-2 rounded-lg border p-2.5 transition-colors",
                                    opt.isCorrect ? "border-green-500/50 bg-green-500/5" : "border-border"
                                )}
                            >
                                <button
                                    type="button"
                                    onClick={() => updateOption(idx, "isCorrect", true)}
                                    className={cn(
                                        "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors mt-1.5",
                                        opt.isCorrect
                                            ? "border-green-500 bg-green-500 text-white"
                                            : "border-muted-foreground/30 hover:border-muted-foreground"
                                    )}
                                >
                                    {opt.isCorrect && <Check className="size-3" />}
                                </button>
                                <span className="text-xs font-bold text-muted-foreground w-4 mt-2">
                                    {String.fromCharCode(65 + idx)}
                                </span>
                                <div className="flex-1">
                                    <OptionEditor
                                        value={opt.optionText}
                                        onChange={(v) => updateOption(idx, "optionText", v)}
                                        placeholder={`Option ${String.fromCharCode(65 + idx)} (supports LaTeX)`}
                                    />
                                </div>
                                {form.options.length > 2 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="size-7 text-muted-foreground hover:text-destructive mt-1"
                                        onClick={() => removeOption(idx)}
                                    >
                                        <Trash2 className="size-3" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Explanation */}
                <LaTeXEditor
                    label="Explanation (optional)"
                    value={form.explanation}
                    onChange={(v) => updateField("explanation", v)}
                    placeholder="Explain the correct answer... supports LaTeX"
                    helpText=""
                    minHeight="80px"
                />
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-between border-t px-6 py-4 bg-background">
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                <div className="flex gap-2">
                    {!isEditing && (
                        <Button
                            variant="secondary"
                            onClick={onSubmitAndNext}
                            disabled={isSaving || !form.chapterId || !form.content || !form.options.some(o => o.isCorrect)}
                        >
                            Save & Add Next
                        </Button>
                    )}
                    <Button
                        onClick={onSubmit}
                        disabled={isSaving || !form.chapterId || !form.content || !form.options.some(o => o.isCorrect)}
                    >
                        {isEditing ? "Update Question" : "Save & Exit"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
