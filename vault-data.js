// Sample Obsidian vault - PKM (Personal Knowledge Management) example
// Each file uses wiki-links [[Note Name]] and tags #tag

window.SAMPLE_VAULT = {
  "Welcome.md": `# Welcome to your Vault 👋

This is your **Obsidian** knowledge base. Start by exploring these entry points:

- [[Home]] — your daily dashboard
- [[How to use this vault]] — a quick guide
- [[Zettelkasten method]] — the philosophy behind it

## Quick links

- 📚 [[Reading list 2026]]
- 🧠 [[Second Brain]]
- 🗓️ [[Daily/2026-04-21]]

> "The best way to take notes is the one you'll actually use."

#meta #start`,

  "Home.md": `# Home

Welcome back. Today is a great day to think.

## 🎯 Current focus
- Finishing [[Project Atlas]]
- Deep-diving into [[Spaced repetition]]
- Rereading [[How to Take Smart Notes]]

## 🧵 Threads
- [[Second Brain]] — the why
- [[Zettelkasten method]] — the how
- [[Evergreen notes]] — the what

## 📥 Inbox
- [[Ideas/Newsletter about focus]]
- [[Ideas/Podcast — slow productivity]]

#dashboard`,

  "How to use this vault.md": `# How to use this vault

A quick orientation.

## Principles
1. **Capture** freely into the [[Inbox]]
2. **Connect** ideas with [[Wiki links]]
3. **Curate** evergreen ideas in [[Second Brain]]

## Daily rhythm
- Morning: open [[Daily/2026-04-21]] and plan
- Midday: process [[Inbox]]
- Evening: review [[Backlinks]]

See also: [[Zettelkasten method]], [[Spaced repetition]]

#meta #workflow`,

  "Zettelkasten method.md": `# Zettelkasten method

A note-taking system developed by sociologist Niklas Luhmann. He produced 70 books and hundreds of papers using ~90,000 index cards.

## Core principles
- **Atomicity** — one idea per note
- **Autonomy** — each note stands alone
- **Link densely** — context lives in the web, not the folder

## Types of notes
- [[Fleeting notes]] — quick captures
- [[Literature notes]] — from books/articles
- [[Permanent notes]] — your ideas, your words
- [[Evergreen notes]] — polished, reusable

## Related
- [[Second Brain]]
- [[How to Take Smart Notes]]
- [[Spaced repetition]]

#method #pkm`,

  "Second Brain.md": `# Second Brain

Tiago Forte's framework for a **personal knowledge management** system, built on CODE:

- **C**apture — keep what resonates
- **O**rganize — by actionability (see [[PARA method]])
- **D**istill — progressive summarization
- **E**xpress — ship your ideas

## Contrast with [[Zettelkasten method]]
Zettelkasten is *idea-first*. Second Brain is *project-first*. They compose well.

## Related
- [[PARA method]]
- [[Evergreen notes]]
- [[How to Take Smart Notes]]

#pkm #method`,

  "PARA method.md": `# PARA method

Organize information by actionability, not topic.

- **P**rojects — active, with deadlines
- **A**reas — ongoing responsibilities
- **R**esources — future interest
- **A**rchive — inactive

This is the organizational layer of the [[Second Brain]].

#method #organization`,

  "Evergreen notes.md": `# Evergreen notes

Coined by Andy Matuschak.

> Notes should be atomic, concept-oriented, and densely linked.

They're the opposite of disposable notes. You refactor them over time like code.

## Contrast
- Not journal entries — those live in [[Daily/2026-04-21]]
- Not book summaries — those are [[Literature notes]]

## Related
- [[Zettelkasten method]]
- [[Spaced repetition]]

#evergreen #pkm`,

  "Spaced repetition.md": `# Spaced repetition

A learning technique that exploits the **spacing effect** — memory consolidates when we're re-exposed to information at increasing intervals.

## Tools
- Anki — most popular
- Mochi — markdown-native
- Obsidian plugins (Spaced Repetition by st3v3nmw)

## Why it works
Forgetting is not the enemy; it's the signal. Practicing *retrieval* just before you'd forget maximally strengthens memory.

## Related
- [[Evergreen notes]] — SR cards *from* your evergreens
- [[How to Take Smart Notes]]

#learning #memory`,

  "How to Take Smart Notes.md": `# How to Take Smart Notes

By Sönke Ahrens (2017).

A practical introduction to [[Zettelkasten method]] for English readers.

## Key takeaways
1. Writing is thinking — don't separate them
2. The slip-box has to do the work, not your memory
3. Bottom-up beats top-down outlining
4. A good note is one that will surprise future-you

## Related
- [[Evergreen notes]]
- [[Fleeting notes]]
- [[Literature notes]]

#book #pkm`,

  "Fleeting notes.md": `# Fleeting notes

Quick captures. Meant to be **processed within 48 hours** or discarded.

Source: [[Zettelkasten method]], [[How to Take Smart Notes]]

Mine live in the [[Inbox]].

#pkm`,

  "Literature notes.md": `# Literature notes

Notes *about* a source — in your own words.

Distinct from [[Fleeting notes]] (raw) and [[Permanent notes]] (yours).

Examples: [[How to Take Smart Notes]]

#pkm`,

  "Permanent notes.md": `# Permanent notes

Atomic, self-contained, linked. The "currency" of a [[Zettelkasten method]].

Once a permanent note earns its keep (gets linked, reread, reused), it graduates to an [[Evergreen notes|evergreen note]].

#pkm`,

  "Wiki links.md": `# Wiki links

Double-bracket syntax: \`[[Note name]]\` creates a link and — if the note doesn't exist yet — creates a placeholder.

## Flavors
- \`[[Note]]\` — plain link
- \`[[Note|custom label]]\` — aliased link
- \`[[Note#Heading]]\` — link to section
- \`[[Note^block]]\` — link to block

These are the connective tissue of your vault. See [[Backlinks]].

#syntax`,

  "Backlinks.md": `# Backlinks

The inverse of a [[Wiki links|wiki link]]. If note A links to note B, then B has A as a backlink.

This is where **emergent structure** comes from. You don't design the graph; it grows.

Open the right panel to see backlinks for the current note.

#syntax #pkm`,

  "Inbox.md": `# Inbox

Unprocessed captures. Triage within 48 hours.

## Current
- [[Ideas/Newsletter about focus]]
- [[Ideas/Podcast — slow productivity]]

#workflow`,

  "Project Atlas.md": `# Project Atlas

**Status**: in progress
**Deadline**: 2026-05-30

A personal cartography project — mapping the shape of my knowledge base.

## Todo
- [x] Export vault to JSON
- [x] Compute note embeddings
- [ ] Render 2D projection with UMAP
- [ ] Publish interactive site

## Related
- [[Second Brain]]
- [[Evergreen notes]]

#project #active`,

  "Reading list 2026.md": `# Reading list 2026

## In progress
- *How to Take Smart Notes* — Ahrens → see [[How to Take Smart Notes]]
- *The Extended Mind* — Paul

## Queued
- *Four Thousand Weeks* — Burkeman
- *The Beginning of Infinity* — Deutsch

## Finished
- *Building a Second Brain* — Forte → see [[Second Brain]]

#reading #2026`,

  "Daily/2026-04-21.md": `# 2026-04-21

## 🌅 Morning
- Reviewed [[Inbox]]
- Started writing [[Spaced repetition]]

## 🧠 Thoughts
Progressive summarization really does feel like compound interest on reading. Linking today's reading to [[How to Take Smart Notes]].

## 🌙 Evening
- 3 new permanent notes
- Graph is getting dense around [[Zettelkasten method]]

#daily`,

  "Daily/2026-04-20.md": `# 2026-04-20

## 🌅 Morning
- Long walk, thought about [[Evergreen notes]]

## 🧠 Thoughts
The vault is starting to feel like a garden, not a filing cabinet.

#daily`,

  "Ideas/Newsletter about focus.md": `# Newsletter about focus

Weekly essay, 5-min read. Angle: cognitive environment design.

Pull from [[Spaced repetition]], [[Evergreen notes]], [[Second Brain]].

#idea #writing`,

  "Ideas/Podcast — slow productivity.md": `# Podcast — slow productivity

Interview format, 30-40 min. First guests: authors adjacent to [[How to Take Smart Notes]].

#idea #podcast`,
};
