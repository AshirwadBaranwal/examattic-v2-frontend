"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    GripVertical,
    Trash2,
    Clock,
    BookOpen,
    CirclePlus,
    Loader2,
    Save,
    Pencil,
    Undo2,
} from "lucide-react";

import { SubjectCard, type SectionSubject } from "./subject-card";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Section {
    id: string;
    sourceId: string;
    name: string;
    order: number;
    timeLimit: number | null;
    createdAt: string;
    updatedAt: string;
    subjects: SectionSubject[];
}

interface AvailableSubject {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
}

interface SectionCardProps {
    section: Section;
    onEditSection: (section: Section) => void;
    onDeleteSection: (id: string) => void;
    onUpdateSubjects: (sectionId: string, subjects: any[]) => void;
    availableSubjects: AvailableSubject[];
    usedSubjectIds: string[];
    isSavingSubjects: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SortableSectionCard({
    section,
    onEditSection,
    onDeleteSection,
    onUpdateSubjects,
    availableSubjects,
    usedSubjectIds,
    isSavingSubjects,
}: SectionCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : ("auto" as any),
    };

    const [showDelete, setShowDelete] = useState(false);
    const [subjectPickerOpen, setSubjectPickerOpen] = useState(false);
    const [localSubjects, setLocalSubjects] = useState<SectionSubject[]>(
        section.subjects
    );
    const [hasSubjectChanges, setHasSubjectChanges] = useState(false);

    // Sync localSubjects when section.subjects changes from server
    const [prevSubjects, setPrevSubjects] = useState(section.subjects);
    if (section.subjects !== prevSubjects) {
        setPrevSubjects(section.subjects);
        setLocalSubjects(section.subjects);
        setHasSubjectChanges(false);
    }

    const handleAddSubject = (subjectId: string) => {
        const subj = availableSubjects.find((s) => s.id === subjectId);
        if (!subj || localSubjects.some((s) => s.subjectId === subjectId))
            return;

        const newSubject: SectionSubject = {
            id: `temp-${Date.now()}`,
            testSectionId: section.id,
            subjectId: subj.id,
            subjectName: subj.name,
            subjectIcon: subj.icon,
            subjectColor: subj.color,
            marks: "4.00",
            negativeMarks: "1.00",
            questionCount: 0,
            questionLimit: null,
        };

        setLocalSubjects((prev) => [...prev, newSubject]);
        setHasSubjectChanges(true);
        setSubjectPickerOpen(false);
    };

    const handleRemoveSubject = (subjectId: string) => {
        setLocalSubjects((prev) =>
            prev.filter((s) => s.subjectId !== subjectId)
        );
        setHasSubjectChanges(true);
    };

    const handleSubjectFieldChange = (
        subjectId: string,
        field: string,
        value: string | number | null
    ) => {
        setLocalSubjects((prev) =>
            prev.map((s) =>
                s.subjectId === subjectId ? { ...s, [field]: value } : s
            )
        );
        setHasSubjectChanges(true);
    };

    const handleSaveSubjects = () => {
        const payload = localSubjects.map((s) => ({
            subjectId: s.subjectId,
            marks: s.marks ?? "4.00",
            negativeMarks: s.negativeMarks ?? "1.00",
            questionCount: s.questionCount ?? 0,
            questionLimit: s.questionLimit,
        }));
        onUpdateSubjects(section.id, payload);
        setHasSubjectChanges(false);
    };

    const handleCancelSubjectChanges = () => {
        setLocalSubjects(section.subjects);
        setHasSubjectChanges(false);
    };

    // Exclude subjects already in THIS section AND subjects used in OTHER sections
    const thisSubjectIds = new Set(localSubjects.map((s) => s.subjectId));
    const unassignedSubjects = availableSubjects.filter(
        (s) => !thisSubjectIds.has(s.id) && !usedSubjectIds.includes(s.id)
    );

    return (
        <div ref={setNodeRef} style={style}>
            <div
                className={`rounded-2xl border bg-card transition-all ${isDragging
                    ? "shadow-2xl ring-2 ring-primary/50 border-primary/50"
                    : "border-border/60 hover:border-border"
                    }`}
            >
                {/* ─── Section Header ─────────────────────────────────── */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40">
                    {/* Drag handle */}
                    <button
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground transition-colors p-1 -ml-1 rounded-lg hover:bg-muted"
                        tabIndex={-1}
                    >
                        <GripVertical className="h-5 w-5" />
                    </button>

                    {/* Section name */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-foreground truncate">
                            {section.name}
                        </h3>
                    </div>

                    {/* Meta chips + actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Time limit chip */}
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {section.timeLimit
                                ? `${section.timeLimit} min`
                                : "No limit"}
                        </span>

                        {/* Subject count */}
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
                            <BookOpen className="h-3 w-3" />
                            {localSubjects.length}
                        </span>

                        {/* Edit */}
                        <button
                            onClick={() => onEditSection(section)}
                            className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-primary hover:bg-primary/10 transition-all"
                        >
                            <Pencil className="h-4 w-4" />
                        </button>

                        {/* Delete */}
                        <button
                            onClick={() => setShowDelete(true)}
                            className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* ─── Section Body: Subjects ─────────────────────────── */}
                <div className="p-5">
                    {/* Actions bar */}
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Subjects
                        </h4>
                        <div className="flex items-center gap-2">
                            {hasSubjectChanges && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCancelSubjectChanges}
                                        className="gap-1.5 h-7 text-xs rounded-full px-4"
                                    >
                                        <Undo2 className="h-3 w-3" />
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleSaveSubjects}
                                        disabled={isSavingSubjects}
                                        className="gap-1.5 h-7 text-xs rounded-full px-4"
                                    >
                                        {isSavingSubjects ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <Save className="h-3 w-3" />
                                        )}
                                        Save Changes
                                    </Button>
                                </>
                            )}
                            <Popover
                                open={subjectPickerOpen}
                                onOpenChange={setSubjectPickerOpen}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5 h-7 text-xs rounded-full px-4"
                                        disabled={unassignedSubjects.length === 0}
                                    >
                                        <CirclePlus className="h-3 w-3" />
                                        Add Subject
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-[220px] p-0"
                                    align="end"
                                >
                                    <Command>
                                        <CommandInput placeholder="Search subjects..." />
                                        <CommandList>
                                            <CommandEmpty>
                                                No subjects available
                                            </CommandEmpty>
                                            <CommandGroup>
                                                {unassignedSubjects.map((s) => (
                                                    <CommandItem
                                                        key={s.id}
                                                        value={s.name}
                                                        onSelect={() =>
                                                            handleAddSubject(s.id)
                                                        }
                                                        className="cursor-pointer"
                                                    >
                                                        {s.icon && (
                                                            <span className="mr-2">
                                                                {s.icon}
                                                            </span>
                                                        )}
                                                        {s.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Subject cards grid */}
                    {localSubjects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed border-border/50 text-center">
                            <BookOpen className="h-8 w-8 text-muted-foreground/40 mb-2" />
                            <p className="text-sm text-muted-foreground">
                                No subjects yet
                            </p>
                            <p className="text-xs text-muted-foreground/60 mt-0.5">
                                Click &quot;Add Subject&quot; to assign subjects
                                with scoring
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {localSubjects.map((subj) => (
                                <SubjectCard
                                    key={subj.subjectId}
                                    subject={subj}
                                    onFieldChange={(field, value) =>
                                        handleSubjectFieldChange(
                                            subj.subjectId,
                                            field,
                                            value
                                        )
                                    }
                                    onRemove={() =>
                                        handleRemoveSubject(subj.subjectId)
                                    }
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete confirmation dialog */}
            <Dialog open={showDelete} onOpenChange={setShowDelete}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Delete Section</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Are you sure you want to delete &quot;{section.name}
                        &quot;? This will also remove all subject assignments
                        and question appearances in this section.
                    </p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDelete(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                onDeleteSection(section.id);
                                setShowDelete(false);
                            }}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
