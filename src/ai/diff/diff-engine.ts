// ─────────────────────────────────────────────
// Diff Engine – Compute line-level diffs
// Developer 3 – AI Integration
// ─────────────────────────────────────────────

import { DiffLine, SectionDiff } from '../types';

/**
 * Computes a line-level diff between original and proposed content.
 * Uses a simple LCS (Longest Common Subsequence) based approach.
 */
export function computeDiff(
    sectionName: string,
    original: string,
    proposed: string
): SectionDiff {
    const originalLines = original.split('\n');
    const proposedLines = proposed.split('\n');

    const lcs = computeLCS(originalLines, proposedLines);
    const diffLines = buildDiffFromLCS(originalLines, proposedLines, lcs);

    return {
        sectionName,
        original,
        proposed,
        lines: diffLines,
    };
}

/**
 * Returns true if the diff contains any changes.
 */
export function hasChanges(diff: SectionDiff): boolean {
    return diff.lines.some((l) => l.type !== 'unchanged');
}

/**
 * Returns a human-readable summary of changes.
 */
export function summarizeDiff(diff: SectionDiff): string {
    const added = diff.lines.filter((l) => l.type === 'added').length;
    const removed = diff.lines.filter((l) => l.type === 'removed').length;
    const unchanged = diff.lines.filter((l) => l.type === 'unchanged').length;

    if (added === 0 && removed === 0) return 'No changes.';

    return `${added} line(s) added, ${removed} line(s) removed, ${unchanged} line(s) unchanged.`;
}

/**
 * Formats a diff for display (similar to unified diff format).
 */
export function formatDiff(diff: SectionDiff): string {
    const lines: string[] = [];
    lines.push(`--- ${diff.sectionName} (original)`);
    lines.push(`+++ ${diff.sectionName} (proposed)`);

    for (const line of diff.lines) {
        switch (line.type) {
            case 'added':
                lines.push(`+ ${line.content}`);
                break;
            case 'removed':
                lines.push(`- ${line.content}`);
                break;
            case 'unchanged':
                lines.push(`  ${line.content}`);
                break;
        }
    }

    return lines.join('\n');
}

// ─────────────────────────────────────────────
// LCS Algorithm
// ─────────────────────────────────────────────

function computeLCS(a: string[], b: string[]): number[][] {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () =>
        Array(n + 1).fill(0)
    );

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (a[i - 1] === b[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    return dp;
}

function buildDiffFromLCS(
    original: string[],
    proposed: string[],
    dp: number[][]
): DiffLine[] {
    const result: DiffLine[] = [];
    let i = original.length;
    let j = proposed.length;

    // Backtrack through the LCS table
    const stack: DiffLine[] = [];

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && original[i - 1] === proposed[j - 1]) {
            stack.push({ type: 'unchanged', content: original[i - 1], lineNumber: i });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            stack.push({ type: 'added', content: proposed[j - 1], lineNumber: j });
            j--;
        } else {
            stack.push({ type: 'removed', content: original[i - 1], lineNumber: i });
            i--;
        }
    }

    // Reverse since we built it backwards
    while (stack.length > 0) {
        result.push(stack.pop()!);
    }

    return result;
}
