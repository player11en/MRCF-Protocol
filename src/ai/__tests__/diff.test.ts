// ─────────────────────────────────────────────
// Unit Tests: Diff & Safety Module (Epic 4)
// Developer 3 – AI Integration
// ─────────────────────────────────────────────

import { computeDiff, hasChanges, summarizeDiff, formatDiff } from '../diff/diff-engine';
import { ChangeManager } from '../diff/change-manager';
import { VersionTracker } from '../diff/version-tracker';
import { MrcfDocument } from '../types';

// ─────────────────────────────────────────────
// Diff Engine Tests
// ─────────────────────────────────────────────

describe('computeDiff', () => {
    it('detects no changes in identical content', () => {
        const diff = computeDiff('PLAN', 'Phase 1\nPhase 2', 'Phase 1\nPhase 2');
        expect(hasChanges(diff)).toBe(false);
        expect(diff.lines.every((l) => l.type === 'unchanged')).toBe(true);
    });

    it('detects added lines', () => {
        const diff = computeDiff('PLAN', 'Phase 1', 'Phase 1\nPhase 2');
        expect(hasChanges(diff)).toBe(true);
        const added = diff.lines.filter((l) => l.type === 'added');
        expect(added.length).toBe(1);
        expect(added[0].content).toBe('Phase 2');
    });

    it('detects removed lines', () => {
        const diff = computeDiff('PLAN', 'Phase 1\nPhase 2', 'Phase 1');
        const removed = diff.lines.filter((l) => l.type === 'removed');
        expect(removed.length).toBe(1);
        expect(removed[0].content).toBe('Phase 2');
    });

    it('handles complete replacement', () => {
        const diff = computeDiff('VISION', 'Old vision', 'New different vision');
        expect(hasChanges(diff)).toBe(true);
    });
});

describe('summarizeDiff', () => {
    it('returns "No changes." when identical', () => {
        const diff = computeDiff('X', 'same', 'same');
        expect(summarizeDiff(diff)).toBe('No changes.');
    });

    it('reports counts of added and removed lines', () => {
        const diff = computeDiff('X', 'old', 'new');
        const summary = summarizeDiff(diff);
        expect(summary).toContain('added');
        expect(summary).toContain('removed');
    });
});

describe('formatDiff', () => {
    it('produces unified-style output', () => {
        const diff = computeDiff('PLAN', 'Phase 1', 'Phase 1\nPhase 2');
        const formatted = formatDiff(diff);
        expect(formatted).toContain('--- PLAN (original)');
        expect(formatted).toContain('+++ PLAN (proposed)');
        expect(formatted).toContain('+ Phase 2');
    });
});

// ─────────────────────────────────────────────
// Change Manager Tests
// ─────────────────────────────────────────────

describe('ChangeManager', () => {
    let manager: ChangeManager;

    beforeEach(() => {
        manager = new ChangeManager();
    });

    it('proposes a change', () => {
        const change = manager.proposeChange('PLAN', 'Old', 'New');
        expect(change.status).toBe('pending');
        expect(change.sectionName).toBe('PLAN');
        expect(change.diff.original).toBe('Old');
        expect(change.diff.proposed).toBe('New');
    });

    it('accepts a change and updates document', () => {
        const doc: MrcfDocument = {
            metadata: { title: 'T', version: '1', created: '2026-01-01' },
            sections: [{ name: 'PLAN', isStandard: true, content: 'Old plan', subsections: [], tasks: [], assets: [] }],
            assets: [],
            sectionIndex: new Map()
        };

        const change = manager.proposeChange('PLAN', 'Old plan', 'New plan');
        const updated = manager.acceptChange(change.id, doc);

        expect(updated.sections[0].content).toBe('New plan');
        expect(manager.getChange(change.id)!.status).toBe('accepted');
    });

    it('rejects a change', () => {
        const change = manager.proposeChange('PLAN', 'Old', 'New');
        manager.rejectChange(change.id);
        expect(manager.getChange(change.id)!.status).toBe('rejected');
    });

    it('throws when accepting already-resolved change', () => {
        const doc: MrcfDocument = {
            metadata: { title: 'T', version: '1', created: '2026-01-01' },
            sections: [{ name: 'PLAN', isStandard: true, content: 'Old', subsections: [], tasks: [], assets: [] }],
            assets: [],
            sectionIndex: new Map()
        };

        const change = manager.proposeChange('PLAN', 'Old', 'New');
        manager.rejectChange(change.id);
        expect(() => manager.acceptChange(change.id, doc)).toThrow('already rejected');
    });

    it('lists changes by status', () => {
        manager.proposeChange('A', 'x', 'y');
        const change2 = manager.proposeChange('B', 'x', 'y');
        manager.rejectChange(change2.id);

        expect(manager.listChanges('pending')).toHaveLength(1);
        expect(manager.listChanges('rejected')).toHaveLength(1);
        expect(manager.listChanges()).toHaveLength(2);
    });

    it('clears resolved changes', () => {
        const change = manager.proposeChange('A', 'x', 'y');
        manager.rejectChange(change.id);
        manager.proposeChange('B', 'x', 'y');

        manager.clearResolved();
        expect(manager.listChanges()).toHaveLength(1); // only pending one remains
    });

    it('throws on unknown change ID', () => {
        const doc: MrcfDocument = {
            metadata: { title: 'T', version: '1', created: '2026-01-01' },
            sections: [],
            assets: [],
            sectionIndex: new Map()
        };
        expect(() => manager.acceptChange('nonexistent', doc)).toThrow('Change not found');
    });
});

// ─────────────────────────────────────────────
// Version Tracker Tests
// ─────────────────────────────────────────────

describe('VersionTracker', () => {
    let tracker: VersionTracker;

    beforeEach(() => {
        tracker = new VersionTracker();
    });

    it('records versions', () => {
        tracker.recordVersion('PLAN', 'v1 content', 'human');
        tracker.recordVersion('PLAN', 'v2 content', 'ai');

        const versions = tracker.getVersions('PLAN');
        expect(versions).toHaveLength(2);
        expect(versions[0].version).toBe(1);
        expect(versions[0].source).toBe('human');
        expect(versions[1].version).toBe(2);
        expect(versions[1].source).toBe('ai');
    });

    it('returns latest version', () => {
        tracker.recordVersion('PLAN', 'v1', 'human');
        tracker.recordVersion('PLAN', 'v2', 'ai');

        const latest = tracker.getLatestVersion('PLAN');
        expect(latest?.content).toBe('v2');
    });

    it('returns undefined for unknown section', () => {
        expect(tracker.getLatestVersion('NONEXISTENT')).toBeUndefined();
    });

    it('supports rollback', () => {
        tracker.recordVersion('PLAN', 'v1 content', 'human');
        tracker.recordVersion('PLAN', 'v2 content', 'ai');
        tracker.recordVersion('PLAN', 'v3 content', 'ai');

        const rollbackContent = tracker.rollback('PLAN', 1);
        expect(rollbackContent).toBe('v1 content');
    });

    it('is case-insensitive', () => {
        tracker.recordVersion('plan', 'content', 'human');
        expect(tracker.getVersions('PLAN')).toHaveLength(1);
    });

    it('tracks multiple sections independently', () => {
        tracker.recordVersion('PLAN', 'plan v1', 'human');
        tracker.recordVersion('TASKS', 'tasks v1', 'human');
        tracker.recordVersion('PLAN', 'plan v2', 'ai');

        expect(tracker.getVersions('PLAN')).toHaveLength(2);
        expect(tracker.getVersions('TASKS')).toHaveLength(1);
        expect(tracker.getTrackedSections()).toHaveLength(2);
    });

    it('clears all history', () => {
        tracker.recordVersion('PLAN', 'v1', 'human');
        tracker.clear();
        expect(tracker.getVersions('PLAN')).toHaveLength(0);
    });
});
