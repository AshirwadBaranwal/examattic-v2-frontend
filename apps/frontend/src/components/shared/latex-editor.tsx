"use client";

import { forwardRef } from "react";
import { RichContentRenderer } from "./rich-content-renderer";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

// ============================================================================
// LATEX TEXT EDITOR - Simple textarea with live preview
// ============================================================================

interface LaTeXEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    helpText?: string;
    minHeight?: string;
    disabled?: boolean;
    className?: string;
    showPreview?: boolean;
}

/**
 * Simple LaTeX text editor with optional live preview.
 * Uses a plain textarea — what you type is exactly what gets stored.
 */
export const LaTeXEditor = forwardRef<HTMLTextAreaElement, LaTeXEditorProps>(
    function LaTeXEditor(
        {
            value,
            onChange,
            placeholder = "Enter content with LaTeX...\n\nInline: \\( x^2 \\)\nBlock: \\[ \\frac{a}{b} \\]",
            label,
            helpText = "Use \\( ... \\) for inline math, \\[ ... \\] for block math",
            minHeight = "120px",
            disabled = false,
            className,
            showPreview = false,
        },
        ref
    ) {
        return (
            <div className={cn("space-y-2", className)}>
                {label && <Label>{label}</Label>}

                <textarea
                    ref={ref}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={cn(
                        "w-full rounded-md border border-input bg-background px-3 py-2",
                        "font-mono text-sm leading-relaxed",
                        "focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring",
                        "resize-y placeholder:text-muted-foreground",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                    style={{ minHeight }}
                />

                {helpText && (
                    <p className="text-xs text-muted-foreground">{helpText}</p>
                )}

                {showPreview && value && (
                    <div className="rounded-md border bg-muted/30 p-3">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                            Preview
                        </div>
                        <RichContentRenderer content={value} />
                    </div>
                )}
            </div>
        );
    }
);

// ============================================================================
// SIMPLE OPTION EDITOR - For question options
// ============================================================================

interface OptionEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

/**
 * Compact single-line LaTeX editor for options.
 * Auto-resizes based on content.
 */
export function OptionEditor({
    value,
    onChange,
    placeholder = "Option text...",
    disabled = false,
    className,
}: OptionEditorProps) {
    return (
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
                "w-full rounded-md border border-input bg-background px-3 py-2",
                "font-mono text-sm leading-relaxed",
                "focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring",
                "resize-none placeholder:text-muted-foreground",
                disabled && "opacity-50 cursor-not-allowed",
                className
            )}
            style={{ minHeight: "40px" }}
            onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.max(40, target.scrollHeight) + "px";
            }}
        />
    );
}

export default LaTeXEditor;
