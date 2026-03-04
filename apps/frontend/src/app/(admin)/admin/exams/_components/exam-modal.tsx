"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import type { Exam, ExamFormData } from "./types";
import { toSlug } from "./types";

interface ExamModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingExam: Exam | null;
    form: ExamFormData;
    onFormChange: (updater: (prev: ExamFormData) => ExamFormData) => void;
    onSubmit: () => void;
    onClose: () => void;
    isSaving: boolean;
}

export function ExamModal({
    open,
    onOpenChange,
    editingExam,
    form,
    onFormChange,
    onSubmit,
    onClose,
    isSaving,
}: ExamModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {editingExam ? "Edit Exam" : "Add New Exam"}
                    </DialogTitle>
                    <DialogDescription>
                        {editingExam
                            ? "Update the details of this exam."
                            : "Fill in the details to create a new exam."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="exam-name">Name</Label>
                        <Input
                            id="exam-name"
                            placeholder="e.g. JEE Mains"
                            value={form.name}
                            onChange={(e) => {
                                const name = e.target.value;
                                onFormChange((f) => ({
                                    ...f,
                                    name,
                                    slug: editingExam ? f.slug : toSlug(name),
                                }));
                            }}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="exam-slug">Slug</Label>
                        <Input
                            id="exam-slug"
                            placeholder="jee-mains"
                            value={form.slug}
                            onChange={(e) =>
                                onFormChange((f) => ({
                                    ...f,
                                    slug: e.target.value,
                                }))
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="exam-desc">
                            Description{" "}
                            <span className="text-muted-foreground">(optional)</span>
                        </Label>
                        <Input
                            id="exam-desc"
                            placeholder="A brief description..."
                            value={form.description}
                            onChange={(e) =>
                                onFormChange((f) => ({
                                    ...f,
                                    description: e.target.value,
                                }))
                            }
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="exam-duration">Duration (min)</Label>
                            <Input
                                id="exam-duration"
                                type="number"
                                value={form.duration}
                                onChange={(e) =>
                                    onFormChange((f) => ({
                                        ...f,
                                        duration: Number(e.target.value),
                                    }))
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="exam-marks">Total Marks</Label>
                            <Input
                                id="exam-marks"
                                type="number"
                                value={form.totalMarks}
                                onChange={(e) =>
                                    onFormChange((f) => ({
                                        ...f,
                                        totalMarks: Number(e.target.value),
                                    }))
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="exam-questions">Questions</Label>
                            <Input
                                id="exam-questions"
                                type="number"
                                value={form.totalQuestions}
                                onChange={(e) =>
                                    onFormChange((f) => ({
                                        ...f,
                                        totalQuestions: Number(e.target.value),
                                    }))
                                }
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button
                        onClick={onSubmit}
                        disabled={!form.name || !form.slug || isSaving}
                    >
                        {isSaving && (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                        )}
                        {editingExam ? "Save Changes" : "Create Exam"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
