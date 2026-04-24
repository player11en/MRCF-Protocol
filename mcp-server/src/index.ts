#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { parse, validate } from "@mrcf/parser";

// Create the server instance
const server = new McpServer({
  name: "mrcf-mcp-server",
  version: "0.1.0",
});

// Helper to safely read and parse an MRCF file
function readAndParse(filePath: string) {
  try {
    const absolutePath = path.resolve(filePath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not found: ${absolutePath}`);
    }
    const source = fs.readFileSync(absolutePath, "utf-8");
    const result = parse(source);
    if (!result.ok) {
      throw new Error(`Failed to parse MRCF file:\n${result.errors.map(e => `- ${e.message} (line ${e.line || 'unknown'})`).join('\n')}`);
    }
    return { document: result.document!, source, absolutePath };
  } catch (err) {
    throw new Error(`Error processing ${filePath}: ${(err as Error).message}`);
  }
}

// 1. Tool: mrcf_read
// Reads and parses an MRCF file, returning its structured JSON representation
server.tool(
  "mrcf_read",
  {
    filePath: z.string().describe("Absolute or relative path to the .mrcf file"),
  },
  async ({ filePath }) => {
    try {
      const { document } = readAndParse(filePath);
      return {
        content: [{ type: "text", text: JSON.stringify(document, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: (err as Error).message }],
        isError: true,
      };
    }
  }
);

// 2. Tool: mrcf_validate
// Validates an MRCF file against all 9 standard rules
server.tool(
  "mrcf_validate",
  {
    filePath: z.string().describe("Absolute or relative path to the .mrcf file"),
  },
  async ({ filePath }) => {
    try {
      const { document } = readAndParse(filePath);
      const validation = validate(document);
      return {
        content: [{ type: "text", text: JSON.stringify(validation, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: (err as Error).message }],
        isError: true,
      };
    }
  }
);

// 3. Tool: mrcf_get_section
// Extracts the raw Markdown content of a specific section (e.g., VISION, TASKS)
server.tool(
  "mrcf_get_section",
  {
    filePath: z.string().describe("Path to the .mrcf file"),
    sectionName: z.string().describe("Name of the section to extract (e.g., VISION, PLAN, TASKS)"),
  },
  async ({ filePath, sectionName }) => {
    try {
      const { document } = readAndParse(filePath);
      const section = document.sectionIndex.get(sectionName.toUpperCase());
      
      if (!section) {
        return {
          content: [{ type: "text", text: `Section '${sectionName}' not found in document.` }],
          isError: true,
        };
      }
      
      return {
        content: [{ type: "text", text: section.content }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: (err as Error).message }],
        isError: true,
      };
    }
  }
);

// 4. Tool: mrcf_get_tasks
// Gets all tasks from the TASKS section with their status, owner, and priority
server.tool(
  "mrcf_get_tasks",
  {
    filePath: z.string().describe("Path to the .mrcf file"),
  },
  async ({ filePath }) => {
    try {
      const { document } = readAndParse(filePath);
      const tasksSection = document.sectionIndex.get("TASKS");
      
      if (!tasksSection || !tasksSection.tasks || tasksSection.tasks.length === 0) {
        return {
          content: [{ type: "text", text: "No tasks found in the document." }],
        };
      }
      
      return {
        content: [{ type: "text", text: JSON.stringify(tasksSection.tasks, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: (err as Error).message }],
        isError: true,
      };
    }
  }
);

// 5. Tool: mrcf_get_summary
// Gets the SUMMARY snapshot for fast AI context re-entry
server.tool(
  "mrcf_get_summary",
  {
    filePath: z.string().describe("Path to the .mrcf file"),
  },
  async ({ filePath }) => {
    try {
      const { document } = readAndParse(filePath);
      const summarySection = document.sectionIndex.get("SUMMARY");
      
      if (!summarySection || !summarySection.summary) {
        return {
          content: [{ type: "text", text: "No SUMMARY block found in the document." }],
        };
      }
      
      return {
        content: [{ type: "text", text: JSON.stringify(summarySection.summary, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: (err as Error).message }],
        isError: true,
      };
    }
  }
);

// 6. Tool: mrcf_get_insights
// Gets all insights from the INSIGHTS section to inform AI decisions
server.tool(
  "mrcf_get_insights",
  {
    filePath: z.string().describe("Path to the .mrcf file"),
  },
  async ({ filePath }) => {
    try {
      const { document } = readAndParse(filePath);
      const insightsSection = document.sectionIndex.get("INSIGHTS");
      
      if (!insightsSection || !insightsSection.insights || insightsSection.insights.length === 0) {
        return {
          content: [{ type: "text", text: "No insights found in the document." }],
        };
      }
      
      return {
        content: [{ type: "text", text: JSON.stringify(insightsSection.insights, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: (err as Error).message }],
        isError: true,
      };
    }
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MRCF MCP Server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
