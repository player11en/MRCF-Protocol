# Contributing to MRCF

Thank you for your interest in contributing. Here's how to get started.

## Setup

```bash
git clone https://github.com/playerelevenstudios/mrcf.git
cd mrcf
npm install         # installs all workspace dependencies
npm run test:all    # verify everything passes
```

## Repository structure

| Directory | Package | Owner area |
|-----------|---------|------------|
| `parser/` | `@mrcf/parser` | Format spec, parsing, validation |
| `src/ai/` | `@mrcf/ai` | LLM providers, generation, diff engine |
| `src/renderer/` | `@mrcf/renderer` | HTML, slides, static site, export |
| `extension/` | VS Code extension | Editor UX, sidebar, AI panel |
| `scripts/` | — | CLI tools (smoke test, importer) |
| `docs/` | — | Specification and design docs |

## Running tests

```bash
npm run test:parser     # @mrcf/parser (31 tests)
npm run test:ai         # @mrcf/ai (87 tests)
npm run test:renderer   # @mrcf/renderer (63 tests)
npm run test:all        # all of the above
npm run lint            # TypeScript type check
```

## Before opening a pull request

1. Run `npm run test:all` — all tests must pass
2. Run `npm run lint` — no TypeScript errors
3. If you're changing the `.mrcf` format, update `docs/mrcf-spec.md`
4. Keep changes focused — one concern per PR

## Filing issues

- **Bug reports:** Include the `.mrcf` file that triggered the issue, the expected vs. actual output, and the Node.js version
- **Feature requests:** Describe the use case, not just the solution
- **Format changes:** Open a discussion issue first — format changes affect all four packages

## Format specification

The canonical MRCF format specification lives in [`docs/mrcf-spec.md`](docs/mrcf-spec.md).
It is an open standard — anyone may implement a parser, editor, or renderer under MIT license.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
