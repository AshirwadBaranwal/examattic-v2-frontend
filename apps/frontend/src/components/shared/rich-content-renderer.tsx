"use client";

import { useMemo } from "react";
import katex from "katex";

interface RichContentRendererProps {
    content: string;
    className?: string;
}

/**
 * Renders text with LaTeX math expressions using KaTeX.
 *
 * Handles both single and double backslash delimiters:
 * - Inline: \( ... \)  or  \\( ... \\)  or  $ ... $
 * - Block:  \[ ... \]  or  \\[ ... \\]  or  $$ ... $$
 *
 * Also normalizes double-backslash LaTeX commands (\\frac → \frac)
 * so content pasted from JSON or old databases renders correctly.
 */
export function RichContentRenderer({ content, className }: RichContentRendererProps) {
    const html = useMemo(() => {
        if (!content) return "";

        let result = content;

        // Normalize math content: \\frac → \frac, \\pi → \pi, etc.
        const normalizeMath = (math: string): string => {
            return math.replace(/\\\\/g, "\\");
        };

        // Render KaTeX safely
        const renderKatex = (math: string, displayMode: boolean): string => {
            const normalized = normalizeMath(math).trim();
            if (!normalized) return "";
            try {
                return katex.renderToString(normalized, {
                    displayMode,
                    throwOnError: false,
                    strict: false,
                    trust: true,
                });
            } catch {
                return `<span style="color:#ef4444;font-size:12px">[Math Error]</span>`;
            }
        };

        // ── Block math ────────────────────────────────────────────────

        // \\[ ... \\]  or  \[ ... \]
        result = result.replace(/\\{1,2}\[([\s\S]*?)\\{1,2}\]/g, (_, math) => {
            return `<div style="margin:12px 0;text-align:center;">${renderKatex(math, true)}</div>`;
        });

        // $$ ... $$
        result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
            return `<div style="margin:12px 0;text-align:center;">${renderKatex(math, true)}</div>`;
        });

        // ── Inline math ───────────────────────────────────────────────

        // \\( ... \\)  or  \( ... \)
        result = result.replace(/\\{1,2}\(([\s\S]*?)\\{1,2}\)/g, (_, math) => {
            return renderKatex(math, false);
        });

        // Single $ ... $ (don't match already-processed $$)
        result = result.replace(/(?<!\$)\$(?!\$)((?:[^$\\]|\\.)+)\$(?!\$)/g, (_, math) => {
            return renderKatex(math, false);
        });

        // Handle <br> tags and newlines
        result = result.replace(/\n/g, "<br />");

        return result;
    }, [content]);

    return (
        <div
            className={className}
            dangerouslySetInnerHTML={{ __html: html }}
            style={{ lineHeight: 1.8 }}
        />
    );
}
