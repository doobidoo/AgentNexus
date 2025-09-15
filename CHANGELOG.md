# Changelog

All notable changes to AgentNexus will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2025-01-15

### Security
- Fixed critical vulnerability in axios (DoS through lack of data size check)
- Fixed critical vulnerability in form-data (unsafe random function for boundary selection)
- Fixed multiple vulnerabilities in Next.js including SSRF, cache confusion, and content injection
- Fixed vulnerability in tmp package (arbitrary file/directory write via symlinks)
- Fixed RegEx DoS vulnerability in brace-expansion

### Changed
- Updated axios from 1.8.4 to 1.12.2
- Updated Next.js from 14.2.28 to 14.2.32
- Updated eslint-config-next from 14.1.0 to 14.2.32
- Updated @typescript-eslint/eslint-plugin from 8.30.1 to 8.43.0
- Updated @typescript-eslint/parser from 8.30.1 to 8.43.0
- Updated typescript from 5.8.3 to 5.9.2
- Updated various other minor dependencies for security patches

### Added
- Added graphql as a dependency (required by weaviate-ts-client)
- Created CHANGELOG.md to track version history

## [0.1.0] - Previous Release

### Added
- Initial release of AgentNexus
- Core agent system with multiple AI model support
- Tool system for various capabilities (vector search, text generation, code execution, web browsing)
- API routes for agent interaction and model management
- Support for Anthropic, OpenAI, Gemini, and Ollama models