"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { api } from "@/lib/api-client";
import { Plus, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Question, QuestionFormData, OptionFormData } from "./types";
import { defaultOptionForm } from "./types";

interface QuestionFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingQuestion: Question | null;
    form: QuestionFormData;
    onFormChange: (form: QuestionFormData) => void;
    onSubmit: () => void;
    onClose: () => void;
    isSaving: boolean;
}

interface SubjectItem {
    id: string;
    name: string;
}

interface ChapterItem {
    id: string;
    name: string;
    subjectId: string;
}

export function QuestionFormDialog({
    open,
    onOpenChange,
    editingQuestion,
    form,
    onFormChange,
    onSubmit,
    onClose,
    isSaving,
}: QuestionFormDialogProps) {
    // Local state for subject selection (cascade)
    const [selectedSubjectState, setSelectedSubjectState] = React.useState<string>("");

    // Auto-set subject when editing
    React.useEffect(() => {
        if (editingQuestion?.subjectId) {
            setSelectedSubjectState(editingQuestion.subjectId);
        } else {
            setSelectedSubjectState("");
        }
    }, [editingQuestion]);

    // Fetch subjects for the cascade select
    const { data: subjectsData } = useQuery({
        queryKey: queryKeys.subjects.list,
        queryFn: async () => {
            const res = await api.api.admin.subjects.$get();
            if (!res.ok) throw new Error("Failed to fetch subjects");
            return res.json();
        },
        enabled: open,
    });

    const subjects = (subjectsData as any)?.data as SubjectItem[] | undefined;

    // Fetch chapters for the selected subject
    const { data: chaptersData } = useQuery({
        queryKey: queryKeys.chapters.bySubject(selectedSubjectState),
        queryFn: async () => {
            const res = await (api.api.admin.subjects as any)[":subjectId"].chapters.$get({
                param: { subjectId: selectedSubjectState },
            });
            if (!res.ok) throw new Error("Failed to fetch chapters");
            return res.json();
        },
        enabled: open && !!selectedSubjectState,
    });

    const chapters = (chaptersData as any)?.data as ChapterItem[] | undefined;

    const updateField = <K extends keyof QuestionFormData>(key: K, value: QuestionFormData[K]) => {
        onFormChange({ ...form, [key]: value });
    };

    const updateOption = (index: number, field: keyof OptionFormData, value: string | boolean) => {
        const newOptions = [...form.options];
        newOptions[index] = { ...newOptions[index], [field]: value };

        // If setting isCorrect, unset others
        if (field === "isCorrect" && value === true) {
            newOptions.forEach((opt, i) => {
                if (i !== index) opt.isCorrect = false;
            });
        }

        onFormChange({ ...form, options: newOptions });
    };

    const addOption = () => {
        onFormChange({
            ...form,
            options: [...form.options, { ...defaultOptionForm }],
        });
    };

    const removeOption = (index: number) => {
        if (form.options.length <= 2) return;
        const newOptions = form.options.filter((_, i) => i !== index);
        onFormChange({ ...form, options: newOptions });
    };

    const handleSubjectChange = (subjectId: string) => {
        setSelectedSubjectState(subjectId);
        // Reset chapter when subject changes
        updateField("chapterId", "");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] w-[700px] h-[600px] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <DialogTitle>
                        {editingQuestion ? "Edit Question" : "Add Question"}
                    </DialogTitle>
                    <DialogDescription>
                        {editingQuestion
                            ? "Update the question and its options."
                            : "Create a new question with options. Mark the correct answer."}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 h-0">
                    <div className="px-6 py-4 space-y-5">
                        {/* Subject → Chapter cascade */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Subject</Label>
                                <Select
                                    value={selectedSubjectState}
                                    onValueChange={handleSubjectChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {subjects?.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Chapter *</Label>
                                <Select
                                    value={form.chapterId}
                                    onValueChange={(v) => updateField("chapterId", v)}
                                    disabled={!selectedSubjectState}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select chapter" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {chapters?.map((ch) => (
                                            <SelectItem key={ch.id} value={ch.id}>
                                                {ch.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Question content */}
                        <div className="space-y-2">
                            <Label>Question Content *</Label>
                            <Textarea
                                value={form.content}
                                onChange={(e) => updateField("content", e.target.value)}
                                placeholder="Enter the question text..."
                                rows={3}
                            />
                        </div>

                        {/* Config row */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Difficulty *</Label>
                                <Select
                                    value={form.difficulty}
                                    onValueChange={(v) => updateField("difficulty", v as any)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="easy">Easy</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="hard">Hard</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Marks</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={form.marks}
                                    onChange={(e) => updateField("marks", e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Negative Marks</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={form.negativeMarks}
                                    onChange={(e) => updateField("negativeMarks", e.target.value)}
                                />
                            </div>
                        </div>

                        {/* PYQ toggle */}
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="isPyq"
                                checked={form.isPyq}
                                onCheckedChange={(v) => updateField("isPyq", v === true)}
                            />
                            <Label htmlFor="isPyq" className="text-sm cursor-pointer">
                                This is a Previous Year Question (PYQ)
                            </Label>
                        </div>

                        {/* Options */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Options (mark correct answer)</Label>
                                {form.options.length < 6 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs h-7"
                                        onClick={addOption}
                                    >
                                        <Plus className="size-3 mr-1" />
                                        Add Option
                                    </Button>
                                )}
                            </div>
                            <div className="space-y-2">
                                {form.options.map((opt, idx) => (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "flex items-center gap-2 rounded-lg border p-2.5 transition-colors",
                                            opt.isCorrect
                                                ? "border-green-500/50 bg-green-500/5"
                                                : "border-border"
                                        )}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => updateOption(idx, "isCorrect", true)}
                                            className={cn(
                                                "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                                                opt.isCorrect
                                                    ? "border-green-500 bg-green-500 text-white"
                                                    : "border-muted-foreground/30 hover:border-muted-foreground"
                                            )}
                                        >
                                            {opt.isCorrect && <Check className="size-3" />}
                                        </button>
                                        <span className="text-xs font-bold text-muted-foreground w-4">
                                            {String.fromCharCode(65 + idx)}
                                        </span>
                                        <Input
                                            value={opt.optionText}
                                            onChange={(e) => updateOption(idx, "optionText", e.target.value)}
                                            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                            className="flex-1 h-8 text-sm"
                                        />
                                        {form.options.length > 2 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-7 text-muted-foreground hover:text-destructive"
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
                        <div className="space-y-2">
                            <Label>Explanation (optional)</Label>
                            <Textarea
                                value={form.explanation}
                                onChange={(e) => updateField("explanation", e.target.value)}
                                placeholder="Explanation for the correct answer..."
                                rows={2}
                            />
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="px-6 py-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={onSubmit}
                        disabled={isSaving || !form.chapterId || !form.content || !form.options.some(o => o.isCorrect)}
                    >
                        {editingQuestion ? "Update" : "Create"} Question
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
