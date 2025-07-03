# Design System - Real-Time Quiz Game

This document outlines the design system for the Real-Time Quiz Game frontend. The goal is to maintain a consistent and modern user interface that aligns with STEAM principles.

## 1. Colors

The primary color palette is based on STEAM themes:

- **Tech Blue**: `#007bff` (Tailwind: `bg-steam-blue`, `text-steam-blue`, etc.)
  - Usage: Primary actions, active states, links, technological elements.
- **Creative Purple**: `#6f42c1` (Tailwind: `bg-steam-purple`, `text-steam-purple`, etc.)
  - Usage: Secondary actions, highlighting creative content, decorative elements.
- **Learning Yellow**: `#ffc107` (Tailwind: `bg-steam-yellow`, `text-steam-yellow`, etc.)
  - Usage: Accents, notifications, calls to attention for learning points.

### Neutral Palette:
Tailwind's default neutral colors (`gray`, `slate`, etc.) will be used for backgrounds, borders, and text.
- `bg-slate-800` / `bg-gray-900` for dark backgrounds.
- `text-slate-100` / `text-gray-200` for light text on dark backgrounds.
- `bg-white` / `bg-slate-50` for light backgrounds.
- `text-slate-900` / `text-gray-800` for dark text on light backgrounds.

## 2. Typography

- **Font Family**: We will use Tailwind's default sans-serif font stack (`font-sans`), which typically includes system UI fonts for optimal performance and native feel.
  - `font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;` (as defined in `index.css` and overridden by Tailwind's base styles).

- **Headings**:
  - `h1`: `text-4xl font-bold` (e.g., Page titles)
  - `h2`: `text-3xl font-bold` (e.g., Section titles)
  - `h3`: `text-2xl font-semibold` (e.g., Card titles)
  - `h4`: `text-xl font-semibold` (e.g., Sub-headings)

- **Body Text**:
  - `p`: `text-base font-normal` (e.g., Standard paragraph text)
  - `small`: `text-sm` (e.g., Captions, secondary information)

- **Links**:
  - Styled with `text-steam-blue hover:underline`.

## 3. Spacing

Tailwind's default spacing scale (multiples of 0.25rem) will be used for consistency.
- **Padding**: `p-1`, `p-2`, `p-4`, `p-6`, `p-8`, etc.
- **Margins**: `m-1`, `m-2`, `m-4`, `m-6`, `m-8`, etc.
- **Gaps** (for flex/grid): `gap-2`, `gap-4`, `gap-6`, etc.

Common spacing units:
- Small gaps: `1`, `2` (0.25rem, 0.5rem)
- Medium gaps/padding: `4`, `6` (1rem, 1.5rem)
- Large gaps/padding: `8`, `12`, `16` (2rem, 3rem, 4rem)

## 4. Components (General Guidelines)

Specific components like `QuestionCard`, `AnswerOption`, etc., will be styled using Tailwind utility classes following these design principles.

- **Buttons**:
  - Primary: `bg-steam-blue text-white font-semibold py-2 px-4 rounded hover:bg-steam-blue/90`
  - Secondary: `bg-steam-purple text-white font-semibold py-2 px-4 rounded hover:bg-steam-purple/90`
  - Outline: `border border-steam-blue text-steam-blue font-semibold py-2 px-4 rounded hover:bg-steam-blue hover:text-white`

- **Cards**:
  - `bg-slate-700` or `bg-white` (depending on theme context)
  - `rounded-lg shadow-md p-4` or `p-6`

- **Inputs**:
  - `border border-slate-500 rounded px-3 py-2 focus:ring-steam-blue focus:border-steam-blue`

## 5. Responsiveness

Layouts will be designed mobile-first using Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`).
- Mobile: Single column, clear touch targets.
- Tablet: Two columns where appropriate, increased spacing.
- Desktop: Multi-column layouts, richer information display.

## 6. Theme

The overall theme aims to be modern, clean, and engaging, reflecting the scientific and educational nature of a STEAM quiz. Dark mode will be the default, leveraging Tailwind's dark mode variants if a light mode is introduced later.
The `index.css` currently has a `color-scheme: light dark;` and a `@media (prefers-color-scheme: light)` block. We will primarily focus on the dark theme provided by default by `background-color: #242424;` and `color: rgba(255, 255, 255, 0.87);` in `:root`, which Tailwind will build upon.
We will remove these default styles from `index.css` later and rely on Tailwind for background and text colors for better consistency.Tool output for `create_file_with_block`:
