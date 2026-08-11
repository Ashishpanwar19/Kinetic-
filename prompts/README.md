# prompts/ — AI Agent Prompts and Templates

This directory stores all AI prompts used across the PulseNews AI platform. Prompts are versioned and imported from code rather than inlined.

## Structure

```
prompts/
├── ai-agents/       # Agent-specific system prompts
│   ├── summarizer.md
│   ├── mcq-generator.md
│   ├── classifier.md
│   ├── ner-extractor.md
│   ├── fact-checker.md
│   ├── importance-ranker.md
│   ├── tutor.md
│   └── timeline-builder.md
└── templates/       # Reusable prompt templates
    ├── quick-take.md
    ├── flashcard.md
    └── digest.md
```

## Convention

- Each prompt file contains a versioned system prompt
- Prompts are loaded at runtime and never inlined in application code
- Changes to prompts are tracked via git history
