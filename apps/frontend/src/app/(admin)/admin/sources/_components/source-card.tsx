import { format } from "date-fns";
import { useRouter } from "next/navigation";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
    MoreVertical,
    Pencil,
    Trash2,
    Clock,
    Calendar,
    FileQuestion,
    LayoutTemplate,
    Eye,
} from "lucide-react";
import type { Source } from "./types";

interface SourceCardProps {
    source: Source;
    onEdit: (source: Source) => void;
    onDelete: (id: string) => void;
    onToggleStatus: (source: Source) => void;
}

export function SourceCard({
    source,
    onEdit,
    onDelete,
    onToggleStatus,
}: SourceCardProps) {
    const router = useRouter();
    const isPyq = source.type === "pyq";

    const handleManageContent = () => {
        router.push(`/admin/${source.type}/${source.id}`);
    };

    return (
        <Card className="flex h-full flex-col hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="line-clamp-2 text-lg font-bold">
                        {source.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="font-semibold">
                            {source.examName || "No Exam Linked"}
                        </Badge>
                        <span>•</span>
                        <span className="uppercase tracking-wider font-semibold">
                            {source.type}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Switch
                        checked={source.isActive}
                        onCheckedChange={() => onToggleStatus(source)}
                        aria-label="Toggle active status"
                    />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(source)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onDelete(source.id)}
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-4 pt-4">
                {/* Meta details depending on type */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/50">
                    {isPyq ? (
                        <>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span>{source.sessionDate ? format(new Date(source.sessionDate), "MMM d, yyyy") : "No Date"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary" />
                                <span>Shift {source.shift || "-"}</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary" />
                                <span>{source.duration || "-"} mins</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FileQuestion className="h-4 w-4 text-primary" />
                                <span>{source.totalQuestions || 0} Qs</span>
                            </div>
                        </>
                    )}
                </div>
            </CardContent>

            <CardFooter className="pt-4 border-t gap-2 flex-wrap">
                <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() =>
                        router.push(
                            `/admin/questions?sourceId=${source.id}&sourceTitle=${encodeURIComponent(source.title)}`
                        )
                    }
                >
                    <Eye className="h-4 w-4" />
                    View Questions
                </Button>
                <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() =>
                        router.push(
                            `/admin/questions/new?sourceId=${source.id}${source.examId ? `&examId=${source.examId}` : ""}${source.title ? `&sourceTitle=${encodeURIComponent(source.title)}` : ""}`
                        )
                    }
                >
                    <FileQuestion className="h-4 w-4" />
                    Add Questions
                </Button>
                <Button
                    variant="secondary"
                    className="flex-1 gap-2"
                    onClick={handleManageContent}
                >
                    <LayoutTemplate className="h-4 w-4" />
                    Manage Content
                </Button>
            </CardFooter>
        </Card>
    );
}
