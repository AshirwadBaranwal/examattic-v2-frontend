"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SectionFormData {
    name: string;
    timeLimit: string; // kept as string for the input, parsed on submit
}

interface SectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingSection: { id: string; name: string; timeLimit: number | null } | null;
    onSubmit: (data: { name: string; timeLimit: number | null }) => void;
    isPending: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SectionDialog({
    open,
    onOpenChange,
    editingSection,
    onSubmit,
    isPending,
}: SectionDialogProps) {
    const isEditing = !!editingSection;

    const [form, setForm] = useState<SectionFormData>({
        name: editingSection?.name ?? "",
        timeLimit: editingSection?.timeLimit?.toString() ?? "",
    });

    // Sync form when dialog opens with different data
    const [prevEditing, setPrevEditing] = useState(editingSection);
    if (editingSection !== prevEditing) {
        setPrevEditing(editingSection);
        setForm({
            name: editingSection?.name ?? "",
            timeLimit: editingSection?.timeLimit?.toString() ?? "",
        });
    }

    const handleSubmit = () => {
        if (!form.name.trim()) return;
        onSubmit({
            name: form.name.trim(),
            timeLimit: form.timeLimit ? parseInt(form.timeLimit) : null,
        });
    };

    const handleClose = () => {
        onOpenChange(false);
        setForm({ name: "", timeLimit: "" });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Edit Section" : "Add Section"}
                    </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="sectionName">Section Name</Label>
                        <Input
                            id="sectionName"
                            value={form.name}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, name: e.target.value }))
                            }
                            placeholder="e.g., Section A - MCQs"
                            disabled={isPending}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && form.name.trim())
                                    handleSubmit();
                            }}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="sectionTimeLimit">
                            Time Limit (minutes)
                        </Label>
                        <Input
                            id="sectionTimeLimit"
                            type="number"
                            value={form.timeLimit}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    timeLimit: e.target.value,
                                }))
                            }
                            placeholder="Leave empty for no limit"
                            disabled={isPending}
                        />
                        <p className="text-xs text-muted-foreground">
                            Optional. Set a time limit for this section if the
                            test uses sectional timing.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isPending || !form.name.trim()}
                    >
                        {isPending && (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                        )}
                        {isEditing ? "Save Changes" : "Add Section"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
