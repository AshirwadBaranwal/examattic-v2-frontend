"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { Source, PyqFormData, MockFormData } from "./types";

interface SourceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: "pyq" | "mock";
    editingSource: Source | null;
    form: PyqFormData | MockFormData;
    onFormChange: (form: any) => void;
    onSubmit: () => void;
    onClose: () => void;
    isSaving: boolean;
}

export function SourceModal({
    open,
    onOpenChange,
    type,
    editingSource,
    form,
    onFormChange,
    onSubmit,
    onClose,
    isSaving,
}: SourceModalProps) {
    const isEditing = !!editingSource;

    // Fetch exams for the dropdown
    const { data: examsData, isLoading: isLoadingExams } = useQuery({
        queryKey: queryKeys.exams.list,
        queryFn: async () => {
            const res = await api.api.admin.exams.$get();
            if (!res.ok) throw new Error("Failed to fetch exams");
            return res.json();
        },
    });
    const exams = examsData?.data || [];

    const handleFormChange = (key: string, value: any) => {
        onFormChange({ ...form, [key]: value });
    };

    const isPyq = type === "pyq";
    const pyqForm = form as PyqFormData;
    const mockForm = form as MockFormData;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing
                            ? `Edit ${isPyq ? "PYQ" : "Mock"}`
                            : `Add ${isPyq ? "PYQ" : "Mock"}`}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Common Fields */}
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={form.title}
                            onChange={(e) => handleFormChange("title", e.target.value)}
                            placeholder={isPyq ? "e.g., JEE Main 2023 - 24 Jan Shift 1" : "e.g., JEE Main Full Mock Test 1"}
                            disabled={isSaving}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Exam Category</Label>
                        <Select
                            value={form.examId}
                            onValueChange={(val) => handleFormChange("examId", val)}
                            disabled={isSaving || isLoadingExams}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Exam" />
                            </SelectTrigger>
                            <SelectContent>
                                {exams.map((exam: any) => (
                                    <SelectItem key={exam.id} value={exam.id}>
                                        {exam.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* PYQ Specific Fields */}
                    {isPyq && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="sessionDate">Session Date</Label>
                                <Input
                                    id="sessionDate"
                                    type="date"
                                    value={pyqForm.sessionDate}
                                    onChange={(e) => handleFormChange("sessionDate", e.target.value)}
                                    disabled={isSaving}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="shift">Shift</Label>
                                <Input
                                    id="shift"
                                    type="number"
                                    value={pyqForm.shift}
                                    onChange={(e) => handleFormChange("shift", e.target.value ? Number(e.target.value) : "")}
                                    placeholder="e.g. 1"
                                    disabled={isSaving}
                                />
                            </div>
                        </div>
                    )}

                    {/* Mock Specific Fields */}
                    {!isPyq && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="duration">Duration (mins)</Label>
                                    <Input
                                        id="duration"
                                        type="number"
                                        value={mockForm.duration}
                                        onChange={(e) => handleFormChange("duration", e.target.value ? Number(e.target.value) : "")}
                                        disabled={isSaving}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="totalQuestions">Total Questions</Label>
                                    <Input
                                        id="totalQuestions"
                                        type="number"
                                        value={mockForm.totalQuestions}
                                        onChange={(e) => handleFormChange("totalQuestions", e.target.value ? Number(e.target.value) : "")}
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="totalMarks">Total Marks</Label>
                                <Input
                                    id="totalMarks"
                                    type="number"
                                    value={mockForm.totalMarks}
                                    onChange={(e) => handleFormChange("totalMarks", e.target.value)}
                                    disabled={isSaving}
                                />
                            </div>
                        </>
                    )}

                    {/* Shared Setting */}
                    <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm mt-2">
                        <div className="space-y-0.5">
                            <Label>Sectional Timing</Label>
                            <p className="text-xs text-muted-foreground">
                                Enable strict timings per section
                            </p>
                        </div>
                        <Switch
                            checked={form.hasSectionalTiming}
                            onCheckedChange={(checked) => handleFormChange("hasSectionalTiming", checked)}
                            disabled={isSaving}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button onClick={onSubmit} disabled={isSaving || !form.title || !form.examId}>
                        {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
                        {isEditing ? "Save Changes" : "Create"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
