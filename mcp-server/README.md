# @mrcf/mcp-server

This is the official Model Context Protocol (MCP) server for the MRCF Document standard. It acts as a bridge between your MRCF files and AI assistants (like Claude Desktop, Cursor, or any MCP-compatible client), allowing the AI to query, read, and validate your project's context natively.

## Features

This server exposes 6 MCP tools:
- `mrcf_read`: Reads and parses an MRCF file into a structured JSON representation.
- `mrcf_validate`: Validates an MRCF document against all 9 specification rules.
- `mrcf_get_section`: Extracts the raw Markdown content of a specific section (e.g., VISION, PLAN, TASKS).
- `mrcf_get_summary`: Retrieves the project's SUMMARY snapshot for fast AI context re-entry.
- `mrcf_get_tasks`: Extracts all tasks with their metadata (status, owner, priority).
- `mrcf_get_insights`: Retrieves the project's learnings and insights.

## Installation

You can run the server directly via `npx` if it is published, or build it locally.

### Local Setup

```bash
cd mcp-server
npm install
npm run build
```

## Configuring Clients

### Claude Desktop

To use this server with Claude Desktop, add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mrcf": {
      "command": "node",
      "args": ["/absolute/path/to/MRCF-Protocol/mcp-server/dist/index.js"]
    }
  }
}
```

### Cursor

In Cursor Settings > Features > MCP, add a new server:
- Type: `command`
- Name: `mrcf`
- Command: `node /absolute/path/to/MRCF-Protocol/mcp-server/dist/index.js`
