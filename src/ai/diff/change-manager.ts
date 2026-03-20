// ─────────────────────────────────────────────
// Change Manager – Accept/Reject AI Changes
// Developer 3 – AI Integration
// ─────────────────────────────────────────────

import { PendingChange, SectionDiff, ChangeStatus, MrcfDocument } from '../types';
import { computeDiff } from './diff-engine';

let changeCounter = 0;

function generateChangeId(): string {
    changeCounter++;
    return `change-${Date.now()}-${changeCounter}`;
}

/**
 * Manages pending AI-generated changes to a MRCF document.
 * Supports accept, reject, and listing of changes.
 */
export class ChangeManager {
    private changes: Map<string, PendingChange> = new Map();

    /**
     * Proposes a change to a section.
     * Returns the change ID for later accept/reject.
     */
    proposeChange(
        sectionName: string,
        originalContent: string,
        proposedContent: string
    ): PendingChange {
        const diff = computeDiff(sectionName, originalContent, proposedContent);
        const change: PendingChange = {
            id: generateChangeId(),
            sectionName,
            diff,
            status: 'pending',
            timestamp: new Date().toISOString(),
        };

        this.changes.set(change.id, change);
        return change;
    }

    /**
     * Accepts a pending change. Returns the updated document.
     */
    acceptChange(
        changeId: string,
        document: MrcfDocument
    ): MrcfDocument {
        const change = this.changes.get(changeId);
        if (!change) throw new Error(`Change not found: ${changeId}`);
        if (change.status !== 'pending') {
            throw new Error(`Change "${changeId}" is already ${change.status}`);
        }

        change.status = 'accepted';

        // Apply the proposed content to the document
        const sections = document.sections.map((s) => {
            if (s.name.toUpperCase() === change.sectionName.toUpperCase()) {
                return { ...s, content: change.diff.proposed, subsections: [...s.subsections] };
            }
            return { ...s, subsections: [...s.subsections] };
        });

        return { metadata: { ...document.metadata }, sections, assets: [...document.assets], sectionIndex: new Map(document.sectionIndex) };
    }

    /**
     * Rejects a pending change.
     */
    rejectChange(changeId: string): void {
        const change = this.changes.get(changeId);
        if (!change) throw new Error(`Change not found: ${changeId}`);
        if (change.status !== 'pending') {
            throw new Error(`Change "${changeId}" is already ${change.status}`);
        }

        change.status = 'rejected';
    }

    /**
     * Returns all changes, optionally filtered by status.
     */
    listChanges(status?: ChangeStatus): PendingChange[] {
        const all = Array.from(this.changes.values());
        if (!status) return all;
        return all.filter((c) => c.status === status);
    }

    /**
     * Returns a specific change by ID.
     */
    getChange(changeId: string): PendingChange | undefined {
        return this.changes.get(changeId);
    }

    /**
     * Clears all resolved (accepted/rejected) changes.
     */
    clearResolved(): void {
        for (const [id, change] of this.changes) {
            if (change.status !== 'pending') {
                this.changes.delete(id);
            }
        }
    }
}
