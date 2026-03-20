/**
 * Benchmark Script — Developer 4
 *
 * Performance test for generating output from a large document.
 * Creates a synthetic MrcfDocument with 500+ tasks and measures rendering speeds.
 */

import type { MrcfDocument, MrcfSection } from '@mrcf/parser';
import { exportDocument } from '../src/renderer/exportService';

async function runBenchmark() {
    console.log('--- MRCF Renderer Benchmark ---');

    const tasks = Array.from({ length: 500 }, (_, i) => ({
        description: `This is benchmark task number ${i + 1}`,
        completed: i % 3 === 0,
    }));

    const subsections = Array.from({ length: 50 }, (_, i) => ({
        name: `Subsection ${i + 1}`,
        level: 2,
        content: `Content for subsection ${i + 1}.\n\n- Point 1\n- Point 2\n\n\`\`\`ts\nconst x = ${i};\n\`\`\``,
        subsections: [],
        tasks: [],
        assets: [],
    }));

    const doc: MrcfDocument = {
        metadata: {
            title: 'Large Benchmark Document',
            version: '1.0.0',
            created: new Date().toISOString(),
        },
        sections: [
            { name: 'VISION', isStandard: true, content: 'Vision content.', subsections: [], tasks: [], assets: [] },
            { name: 'CONTEXT', isStandard: true, content: 'Context content.', subsections: [], tasks: [], assets: [] },
            { name: 'STRUCTURE', isStandard: true, content: 'Structure content.', subsections, tasks: [], assets: [] },
            { name: 'PLAN', isStandard: true, content: 'Plan content.', subsections: [], tasks: [], assets: [] },
            { name: 'TASKS', isStandard: true, content: 'Tasks content.', subsections: [], tasks, assets: [] },
        ],
        assets: [],
        sectionIndex: new Map(),
    };

    const runRenderTest = async (format: 'html' | 'slides' | 'site' | 'zip') => {
        const start = performance.now();
        const result = await exportDocument(doc, format);
        const timeMs = performance.now() - start;

        console.log(`Format [${format}]`);
        console.log(`  Render time: ${timeMs.toFixed(2)}ms`);
        console.log(`  Success:     ${result.ok}`);
        if (format !== 'zip') {
            console.log(`  Output size: ${(result.output.length / 1024).toFixed(2)} KB`);
        } else {
            // base64 decoded size approx:
            const sizeBytes = result.output.length * 0.75;
            console.log(`  Output size: ${(sizeBytes / 1024).toFixed(2)} KB (Zipped)`);
        }
    };

    await runRenderTest('html');
    await runRenderTest('slides');
    await runRenderTest('site');
    await runRenderTest('zip');

    console.log('--- Benchmark Complete ---');
}

runBenchmark().catch(console.error);
