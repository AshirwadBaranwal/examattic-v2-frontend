import { Input } from "@/components/ui/input";
import { X, Award, TrendingDown, Hash, Target } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SectionSubject {
    id: string;
    testSectionId: string;
    subjectId: string;
    subjectName: string;
    subjectIcon: string | null;
    subjectColor: string | null;
    marks: string | null;
    negativeMarks: string | null;
    questionCount: number | null;
    questionLimit: number | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface SubjectCardProps {
    subject: SectionSubject;
    onFieldChange: (field: string, value: string | number | null) => void;
    onRemove: () => void;
}

export function SubjectCard({ subject, onFieldChange, onRemove }: SubjectCardProps) {
    return (
        <div className="group relative rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm">
            {/* Remove button */}
            <button
                onClick={onRemove}
                className="absolute -top-2 -right-2 hidden group-hover:flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md transition-transform hover:scale-110"
            >
                <X className="h-3.5 w-3.5" />
            </button>

            {/* Subject header */}
            <div className="mb-3 flex items-center gap-2">
                {subject.subjectIcon && (
                    <span className="text-lg">{subject.subjectIcon}</span>
                )}
                <h4 className="text-sm font-semibold text-foreground">
                    {subject.subjectName}
                </h4>
            </div>

            {/* Scoring fields grid */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        <Award className="h-3 w-3" />
                        Marks
                    </label>
                    <Input
                        type="number"
                        step="0.01"
                        value={subject.marks ?? ""}
                        onChange={(e) => onFieldChange("marks", e.target.value)}
                        className="h-8 text-sm font-medium"
                        placeholder="4.00"
                    />
                </div>

                <div className="space-y-1">
                    <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        <TrendingDown className="h-3 w-3" />
                        Negative
                    </label>
                    <Input
                        type="number"
                        step="0.01"
                        value={subject.negativeMarks ?? ""}
                        onChange={(e) => onFieldChange("negativeMarks", e.target.value)}
                        className="h-8 text-sm font-medium"
                        placeholder="1.00"
                    />
                </div>

                <div className="space-y-1">
                    <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        <Hash className="h-3 w-3" />
                        Total Qs
                    </label>
                    <Input
                        type="number"
                        value={subject.questionCount ?? ""}
                        onChange={(e) =>
                            onFieldChange("questionCount", e.target.value ? parseInt(e.target.value) : 0)
                        }
                        className="h-8 text-sm font-medium"
                        placeholder="0"
                    />
                </div>

                <div className="space-y-1">
                    <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        <Target className="h-3 w-3" />
                        Must Attempt
                    </label>
                    <Input
                        type="number"
                        value={subject.questionLimit ?? ""}
                        onChange={(e) =>
                            onFieldChange("questionLimit", e.target.value ? parseInt(e.target.value) : null)
                        }
                        className="h-8 text-sm font-medium"
                        placeholder="All"
                    />
                </div>
            </div>
        </div>
    );
}
