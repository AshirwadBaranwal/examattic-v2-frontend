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
import type { Chapter, ChapterFormData } from "./types";
import { toSlug } from "./types";

interface ChapterModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingChapter: Chapter | null;
    form: ChapterFormData;
    onFormChange: (updater: (prev: ChapterFormData) => ChapterFormData) => void;
    onSubmit: () => void;
    onClose: () => void;
    isSaving: boolean;
    subjectName?: string;
}

export function ChapterModal({
    open,
    onOpenChange,
    editingChapter,
    form,
    onFormChange,
    onSubmit,
    onClose,
    isSaving,
    subjectName,
}: ChapterModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {editingChapter ? "Edit Chapter" : "Add New Chapter"}
                    </DialogTitle>
                    <DialogDescription>
                        {editingChapter
                            ? "Update chapter details."
                            : `Add a new chapter to ${subjectName ?? "this subject"}.`}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="chapter-name">Name</Label>
                        <Input
                            id="chapter-name"
                            placeholder="e.g. Kinematics"
                            value={form.name}
                            onChange={(e) => {
                                const name = e.target.value;
                                onFormChange((f) => ({
                                    ...f,
                                    name,
                                    slug: editingChapter ? f.slug : toSlug(name),
                                }));
                            }}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="chapter-slug">Slug</Label>
                        <Input
                            id="chapter-slug"
                            placeholder="kinematics"
                            value={form.slug}
                            onChange={(e) =>
                                onFormChange((f) => ({ ...f, slug: e.target.value }))
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="chapter-order">Order</Label>
                        <Input
                            id="chapter-order"
                            type="number"
                            value={form.order}
                            onChange={(e) =>
                                onFormChange((f) => ({
                                    ...f,
                                    order: Number(e.target.value),
                                }))
                            }
                        />
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
                        {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
                        {editingChapter ? "Save Changes" : "Add Chapter"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
