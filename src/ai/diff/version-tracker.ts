// ─────────────────────────────────────────────
// Version Tracker – Track history of AI edits per section
// Developer 3 – AI Integration
// ─────────────────────────────────────────────

import { SectionVersion } from '../types';

/**
 * Tracks version history for each section of a MRCF document.
 * Supports rollback to any previous version.
 */
export class VersionTracker {
    private history: Map<string, SectionVersion[]> = new Map();

    /**
     * Records a new version for a section.
     */
    recordVersion(
        sectionName: string,
        content: string,
        source: 'human' | 'ai',
        changeId?: string
    ): SectionVersion {
        const key = sectionName.toUpperCase();
        const versions = this.history.get(key) ?? [];

        const version: SectionVersion = {
            version: versions.length + 1,
            content,
            timestamp: new Date().toISOString(),
            source,
            changeId,
        };

        versions.push(version);
        this.history.set(key, versions);
        return version;
    }

    /**
     * Returns all versions for a section.
     */
    getVersions(sectionName: string): SectionVersion[] {
        return this.history.get(sectionName.toUpperCase()) ?? [];
    }

    /**
     * Returns the latest version. Undefined if no versions recorded.
     */
    getLatestVersion(sectionName: string): SectionVersion | undefined {
        const versions = this.getVersions(sectionName);
        return versions.length > 0 ? versions[versions.length - 1] : undefined;
    }

    /**
     * Returns a specific version by number.
     */
    getVersion(sectionName: string, versionNumber: number): SectionVersion | undefined {
        const versions = this.getVersions(sectionName);
        return versions.find((v) => v.version === versionNumber);
    }

    /**
     * Returns the content at a specific version for rollback purposes.
     */
    rollback(sectionName: string, toVersion: number): string | undefined {
        const version = this.getVersion(sectionName, toVersion);
        return version?.content;
    }

    /**
     * Returns section names that have recorded versions.
     */
    getTrackedSections(): string[] {
        return Array.from(this.history.keys());
    }

    /**
     * Clears all version history.
     */
    clear(): void {
        this.history.clear();
    }
}
