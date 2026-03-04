"use client";

import Image from "next/image";
import {
    MoreHorizontal,
    Pencil,
    Trash2,
    Clock,
    Award,
    Eye,
    EyeOff,
    HelpCircle,
    Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Exam } from "./types";

interface ExamCardProps {
    exam: Exam;
    onEdit: (exam: Exam) => void;
    onDelete: (id: string) => void;
    onToggleStatus: (exam: Exam) => void;
    onManageContent: (exam: Exam) => void;
}

export function ExamCard({ exam, onEdit, onDelete, onToggleStatus, onManageContent }: ExamCardProps) {
    return (
        <Card className="group relative overflow-hidden transition-all hover:shadow-md">
            <CardHeader >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        {exam.logo ? (
                            <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                                <Image
                                    src={exam.logo}
                                    alt={exam.name}
                                    fill
                                    sizes="48px"
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-lg">
                                {exam.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <CardTitle className="truncate text-base">
                                {exam.name}
                            </CardTitle>
                            <CardDescription className="truncate text-xs">
                                /{exam.slug}
                            </CardDescription>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[200px]">
                            <DropdownMenuItem onClick={() => onEdit(exam)}>
                                <Pencil className="mr-2 size-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onManageContent(exam)}>
                                <Layers className="mr-2 size-4" />
                                Manage Content
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onToggleStatus(exam)}>
                                {exam.isActive ? (
                                    <>
                                        <EyeOff className="mr-2 size-4" />
                                        Deactivate
                                    </>
                                ) : (
                                    <>
                                        <Eye className="mr-2 size-4" />
                                        Activate
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onDelete(exam.id)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 size-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {exam.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {exam.description}
                    </p>
                )}
                <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="gap-1 text-xs">
                        <Clock className="size-3" />
                        {exam.duration} mins
                    </Badge>
                    <Badge variant="secondary" className="gap-1 text-xs">
                        <Award className="size-3" />
                        {exam.totalMarks} marks
                    </Badge>
                    <Badge variant="secondary" className="gap-1 text-xs">
                        <HelpCircle className="size-3" />
                        {exam.totalQuestions} Questions
                    </Badge>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                    <Badge variant={exam.isActive ? "default" : "outline"}>
                        {exam.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                        Created {new Date(exam.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
