# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **llm-interview** - a flashcard-style learning application for LLM interview preparation, built with Remix (React Router v7) and TypeScript. The application works on both PC and mobile devices.

## Commands

```bash
# Development
npm run dev          # Start development server with hot reload

# Build & Production
npm run build        # Build for production
npm start           # Run production server

# Code Quality
npm run lint        # Run ESLint
npm run typecheck   # Run TypeScript type checking
```

## Architecture

### Data Management Strategy
- **Interview Questions**: Stored in `~/data/interview.json` with JSON Schema validation (`~/data/interview.schema.json`)
- **User Progress**: Persisted in localStorage with the following keys:
  - `llm-interview-progress`: Individual question progress with SM-2 algorithm data
  - `llm-interview-sessions`: Study session history
  - `llm-interview-settings`: User preferences (theme, cards per session, etc.)

### Interview Data Structure
Each interview question follows this structure - see @doc/DATA-SPEC.md for complete type definitions.

### Key Architectural Decisions
1. **Client-Only State**: All user data is stored in localStorage - no backend required
2. **Spaced Repetition**: Implements SM-2 algorithm for optimal learning intervals
3. **Path Aliases**: Use `~/*` to import from the `app` directory (e.g., `~/components/Card`)
4. **Vite Configuration**: Uses Remix v3 future flags including single fetch and lazy route discovery

### Route Structure
- `/` - Home screen with study statistics
- `/interview` - Main study interface with flashcards
- `/interview/:sessionId` - Specific study session
- `/progress` - Progress tracking and analytics
- `/settings` - User preferences and data management

### TypeScript Conventions
- Strict mode is enabled
- All components should have proper type definitions
- Interview data types should be defined in `~/types/interview.ts`
- Node.js version requirement: >= 20.0.0

### Styling
- Uses Tailwind CSS with default configuration
- Mobile-first responsive design - see @doc/UI-SPEC.md for detailed specifications

## Implementation References

For detailed implementation guidance, refer to:

- **UI/UX Specifications**: @doc/UI-SPEC.md
  - Screen layouts and component designs
  - Interaction patterns and animations
  - Responsive design guidelines

- **Data Specifications**: @doc/DATA-SPEC.md  
  - Complete TypeScript type definitions
  - State management patterns
  - localStorage structure and API design

- **Feature Specifications**: @doc/FEATURE.md
  - SM-2 algorithm implementation details
  - Hint system with random selection logic
  - Study session management and progress tracking

## Interaction Guidelines
- 常に日本語で回答