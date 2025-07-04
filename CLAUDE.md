# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI/LLM engineer interview preparation learning website built with Remix (React Router v7), React, TypeScript, and Tailwind CSS. The project consists primarily of structured learning content rather than traditional application code.

## Core Architecture

### Data Structure
The project follows a content-first architecture with two main data types:

1. **Interview Questions** (`app/data/interviews/Q*.md`): 50 structured interview questions with answers
   - Format: front matter with `id`, `keywords` array, followed by question and answer sections
   - Japanese language content focused on AI/LLM concepts
   - Automatically generated from YAML files using conversion script
   - Keywords are automatically linked to keypoint files

2. **Keyword Definitions** (`app/data/keypoint/*.md`): 75+ AI/LLM terminology files
   - Front matter format: `title`, `contexts` array
   - Content wrapped in `<Context name="contextName">` tags following ADR-001
   - Core knowledge generated using specific conceptual understanding prompts

### Context System
The project implements a sophisticated context categorization system for AI/LLM terminology:

- **Primary context**: `ai` (used for most AI-specific terms)
- **Specialized contexts**: `math`, `nlp`, `optimization`, `optimization-algorithms`, `rag`, `transformer`
- **Context validation**: Follows the principle that `{context}文脈での{keyword}とは` should form a natural question

### Ubiquitous Language (Domain Model)
Key concepts defined in `doc/ubiquitous-language.md`:
- **keyword**: AI/LLM technical terms found in answers
- **context**: 1:1 mapping to keywords for disambiguation
- **core-knowledge**: Conceptual understanding content generated via specific prompts
- **question/answer**: Interview Q&A pairs

## Development Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Production server
npm start
```

## Content Generation Commands

The project includes a custom slash command system for content management:

```bash
# Generate core knowledge for all keypoint files
/gen-core-knowledge
```

### Script Commands

```bash
# Convert YAML interview files to Markdown format
node scripts/convert-yaml-to-md.js
```

## Working with Content

### Adding New Keywords
1. Create markdown file in `app/data/keypoint/`
2. Use appropriate context from `app/data/context.md`
3. Follow context validation: prefer `ai` unless ambiguity exists
4. Test naturalness of `{context}文脈での{keyword}とは`
5. Use `/gen-core-knowledge` command to generate core knowledge content

### Context Guidelines
- **Use `ai`** for terms unique to AI/LLM domain
- **Use specific contexts** only when avoiding ambiguity (e.g., `クエリ` uses `transformer` and `rag` to distinguish from database queries)
- **Validate contexts** by checking if they form natural questions

### Front Matter Format
```yaml
---
title: キーワード名
contexts:
  - ai  # or specific context if needed
---
```

## Architecture Decisions

### ADR-001: Context-Dependent Term Management
- **Decision**: Use front matter + URL query parameters for context switching
- **URL Pattern**: `/glossary/query?context=transformer`
- **Content Pattern**: `<Context name="contextName">content</Context>`
- **Rationale**: Maintains related content in single files while enabling context-specific display

## Tech Stack
- **Frontend**: Remix (React Router v7), React, TypeScript
- **Styling**: Tailwind CSS via CDN  
- **Data Persistence**: localStorage API
- **Build Tool**: Vite

## Content Maintenance

When updating keyword contexts or adding new terms, ensure:
1. Context naturalness validation
2. Consistency with ubiquitous language definitions
3. Proper categorization in `app/data/context.md`
4. Front matter format compliance
5. Core knowledge generation using the exact prompt format specified in `doc/ubiquitous-language.md`

### Core Knowledge Generation Prompt
When generating core knowledge content, use this exact prompt format:

```
{context}文脈・分野における{keyword}について以下の条件を最短経路で満たせる説明をして

- 応用が利く（新しい問題にも対応できる）
- 長期的に記憶に残りやすい
- 他の知識との関連付けができる
- 「なぜ？」という問いに答えられる

出力はMarkdown記法、見出し2は `## {keyword}`
```

### Data Flow
1. **YAML Source** (`app/data/interviews/old/Q*.yaml`) → **Conversion Script** → **Markdown Files** (`app/data/interviews/Q*.md`)
2. **Keyword Links** are automatically generated during conversion, pointing to keypoint files with `?context=ai` query parameters
3. **Keypoint Files** contain context-specific content wrapped in `<Context>` tags for dynamic display

The project prioritizes content accuracy and learning effectiveness over traditional software development patterns.