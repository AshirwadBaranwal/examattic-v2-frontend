"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { api } from "@/lib/api-client";
import { FileText, Plus, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Filter } from "lucide-react";

import type { Source, PyqFormData } from "../sources/_components/types";
import { defaultPyqForm } from "../sources/_components/types";
import { SourceCard } from "../sources/_components/source-card";
import { SourceModal } from "../sources/_components/source-modal";
import { DeleteDialog } from "../sources/_components/delete-dialog";
// Import placeholder for content dialog (you can create pyq-content later)
// import { SourceContentDialog } from "../sources/_components/source-content-dialog";

export default function AdminPyqPage() {
    const queryClient = useQueryClient();
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSource, setEditingSource] = useState<Source | null>(null);
    const [form, setForm] = useState<PyqFormData>(defaultPyqForm);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);
    const [contentSource, setContentSource] = useState<Source | null>(null);

    // ─── Fetch PYQs ────────────────────────────────────────────────────────
    const { data, isLoading } = useQuery({
        queryKey: queryKeys.sources.pyq,
        queryFn: async () => {
            const res = await api.api.admin.sources.$get({ query: { type: "pyq" } });
            if (!res.ok) throw new Error("Failed to fetch PYQs");
            return res.json();
        },
    });

    const sources = (data as any)?.data as Source[] | undefined;

    // ─── Fetch Exams for Filter ──────────────────────────────────────────────
    const { data: examsData } = useQuery({
        queryKey: queryKeys.exams.list,
        queryFn: async () => {
            const res = await api.api.admin.exams.$get();
            if (!res.ok) throw new Error("Failed to fetch exams");
            return res.json();
        },
    });

    // Typecast exam data correctly based on how you fetch it elsewhere
    const exams = (examsData as any)?.data || [];

    // ─── Mutations ───────────────────────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: async (body: PyqFormData) => {
            const payload = { ...body, type: "pyq" as const };
            // Ensure shift is a number if provided
            if (payload.shift === "") delete (payload as any).shift;

            const res = await api.api.admin.sources.$post({ json: payload });
            if (!res.ok) throw new Error("Failed to create PYQ");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.sources.pyq });
            closeModal();
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, body }: { id: string; body: Partial<PyqFormData> }) => {
            const payload = { ...body };
            if (payload.shift === "") payload.shift = null as any; // Handle clearing

            const res = await (api.api.admin.sources as any)[":id"].$put({
                param: { id },
                json: payload,
            });
            if (!res.ok) throw new Error("Failed to update PYQ");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.sources.pyq });
            closeModal();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await (api.api.admin.sources as any)[":id"].$delete({
                param: { id },
            });
            if (!res.ok) throw new Error("Failed to delete PYQ");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.sources.pyq });
            setDeleteId(null);
        },
    });

    const toggleStatusMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await (api.api.admin.sources as any)[":id"]["toggle"].$patch({
                param: { id },
            });
            if (!res.ok) throw new Error("Failed to toggle PYQ status");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.sources.pyq });
        },
    });

    // ─── Handlers ────────────────────────────────────────────────────────────
    const openCreate = () => {
        setEditingSource(null);
        setForm(defaultPyqForm);
        setModalOpen(true);
    };

    const openEdit = (source: Source) => {
        setEditingSource(source);

        // Format date to YYYY-MM-DD for the input
        let dateStr = "";
        if (source.sessionDate) {
            const date = new Date(source.sessionDate);
            dateStr = date.toISOString().split('T')[0];
        }

        setForm({
            title: source.title,
            examId: source.examId || "",
            sessionDate: dateStr,
            shift: source.shift ?? "",
            instructions: source.instructions ?? "",
            hasSectionalTiming: source.hasSectionalTiming,
        });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingSource(null);
        setForm(defaultPyqForm);
    };

    const handleSubmit = () => {
        if (editingSource) {
            // Include only changed fields or all PYQ fields
            updateMutation.mutate({ id: editingSource.id, body: form });
        } else {
            createMutation.mutate(form);
        }
    };

    const isSaving = createMutation.isPending || updateMutation.isPending;

    const filteredSources = sources?.filter(
        (s) => {
            const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase()) ||
                s.examName?.toLowerCase().includes(search.toLowerCase());
            const matchesExam = selectedExamIds.length === 0 || (s.examId && selectedExamIds.includes(s.examId));
            return matchesSearch && matchesExam;
        }
    );

    return (
        <div className="space-y-6 p-4 md:p-6 md:pb-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Previous Year Questions</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage past exam papers with session and shift details.
                    </p>
                </div>
                <Button onClick={openCreate} className="gap-2">
                    <Plus className="size-4" />
                    Add PYQ
                </Button>
            </div>

            {/* Exam Filter & Search Bar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search PYQs..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {exams && exams.length > 0 && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="border-dashed flex items-center gap-2">
                                <Filter className="size-4" />
                                {selectedExamIds.length > 0 ? (
                                    <>
                                        Exams
                                        <Badge variant="secondary" className="rounded-sm px-1 font-normal ml-1">
                                            {selectedExamIds.length}
                                        </Badge>
                                    </>
                                ) : (
                                    "Filter Exams"
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Search exams..." />
                                <CommandList>
                                    <CommandEmpty>No exams found.</CommandEmpty>
                                    <CommandGroup>
                                        <CommandItem
                                            onSelect={() => setSelectedExamIds([])}
                                            className="justify-between"
                                        >
                                            All Exams
                                            {selectedExamIds.length === 0 && (
                                                <Checkbox checked disabled />
                                            )}
                                        </CommandItem>
                                        {exams.map((exam: any) => {
                                            const isSelected = selectedExamIds.includes(exam.id);
                                            return (
                                                <CommandItem
                                                    key={exam.id}
                                                    onSelect={() => {
                                                        if (isSelected) {
                                                            setSelectedExamIds(selectedExamIds.filter((id) => id !== exam.id));
                                                        } else {
                                                            setSelectedExamIds([...selectedExamIds, exam.id]);
                                                        }
                                                    }}
                                                    className="flex items-center gap-2 cursor-pointer"
                                                >
                                                    <Checkbox checked={isSelected} />
                                                    {exam.name}
                                                </CommandItem>
                                            );
                                        })}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                )}
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
            )}

            {/* Empty */}
            {!isLoading && (!filteredSources || filteredSources.length === 0) && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-20">
                    <div className="rounded-full bg-muted p-4">
                        <FileText className="size-8 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">No PYQs found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Get started by adding past year papers.
                    </p>
                    <Button onClick={openCreate} className="mt-4 gap-2">
                        <Plus className="size-4" />
                        Add PYQ
                    </Button>
                </div>
            )}

            {/* Grid */}
            {filteredSources && filteredSources.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredSources.map((source) => (
                        <SourceCard
                            key={source.id}
                            source={source}
                            onEdit={openEdit}
                            onDelete={setDeleteId}
                            onToggleStatus={(src) => toggleStatusMutation.mutate(src.id)}
                            onManageContent={setContentSource}
                        />
                    ))}
                </div>
            )}

            {/* Modals */}
            <SourceModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                type="pyq"
                editingSource={editingSource}
                form={form}
                onFormChange={setForm}
                onSubmit={handleSubmit}
                onClose={closeModal}
                isSaving={isSaving}
            />

            <DeleteDialog
                open={!!deleteId}
                onOpenChange={() => setDeleteId(null)}
                title="Delete PYQ"
                description="Are you sure you want to permanently delete this PYQ and all its sections and questions?"
                onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
                isPending={deleteMutation.isPending}
            />

            {/* TODO: Implement PYQ section/question management dialog later */}
            <Dialog open={!!contentSource} onOpenChange={() => setContentSource(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Content Management coming soon</DialogTitle>
                    </DialogHeader>
                    <div>Building section builder in next phase.</div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
