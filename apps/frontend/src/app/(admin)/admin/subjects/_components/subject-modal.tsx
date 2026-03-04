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
import type { Subject, SubjectFormData } from "./types";
import { SUBJECT_COLORS, toSlug } from "./types";

interface SubjectModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingSubject: Subject | null;
    form: SubjectFormData;
    onFormChange: (updater: (prev: SubjectFormData) => SubjectFormData) => void;
    onSubmit: () => void;
    onClose: () => void;
    isSaving: boolean;
}

export function SubjectModal({
    open,
    onOpenChange,
    editingSubject,
    form,
    onFormChange,
    onSubmit,
    onClose,
    isSaving,
}: SubjectModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {editingSubject ? "Edit Subject" : "Add New Subject"}
                    </DialogTitle>
                    <DialogDescription>
                        {editingSubject
                            ? "Update the subject details."
                            : "Create a new subject to organize chapters."}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="subject-name">Name</Label>
                        <Input
                            id="subject-name"
                            placeholder="e.g. Physics"
                            value={form.name}
                            onChange={(e) => {
                                const name = e.target.value;
                                onFormChange((f) => ({
                                    ...f,
                                    name,
                                    slug: editingSubject ? f.slug : toSlug(name),
                                }));
                            }}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="subject-slug">Slug</Label>
                        <Input
                            id="subject-slug"
                            placeholder="physics"
                            value={form.slug}
                            onChange={(e) =>
                                onFormChange((f) => ({ ...f, slug: e.target.value }))
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="subject-icon">Icon URL (optional)</Label>
                        <Input
                            id="subject-icon"
                            placeholder="https://example.com/icon.png"
                            value={form.icon}
                            onChange={(e) =>
                                onFormChange((f) => ({ ...f, icon: e.target.value }))
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Color</Label>
                        <div className="flex flex-wrap gap-2">
                            {SUBJECT_COLORS.map((sc) => (
                                <button
                                    key={sc.hex}
                                    type="button"
                                    title={sc.name}
                                    onClick={() =>
                                        onFormChange((f) => ({ ...f, color: sc.hex }))
                                    }
                                    className={`size-8 rounded-full transition-all border border-border/50 ${form.color === sc.hex
                                            ? "ring-2 ring-offset-2 ring-primary scale-110"
                                            : "hover:scale-110"
                                        }`}
                                    style={{ backgroundColor: sc.hex }}
                                />
                            ))}
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
                        {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
                        {editingSubject ? "Save Changes" : "Create Subject"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
