# HoiThao UI Design System

## 1. Product Visual Direction

HoiThao is a real-time seminar engagement platform. The interface should feel clear, trustworthy, and energetic: enterprise-ready for organizers, but approachable for participants joining quickly by seminar code or QR.

The current implementation uses a token-driven design system built on Tailwind + shadcn conventions with CSS variables in `app/globals.css`. The UX should preserve three core qualities:

- Fast scanning under live event pressure (high information density, low visual noise)
- Strong action clarity (primary actions stand out immediately)
- Theme flexibility (light/dark + color theme support without redesigning components)

**Key Characteristics:**
- Clean, modern cards with soft radius and subtle borders
- Strong primary color semantics for actions and live status
- High-contrast typography for readability on projectors and mobile
- Component consistency across Home, Join, Session, and Admin experiences
- Responsive-first behavior for participant devices

## 2. Color System & Theme Tokens

The app uses semantic tokens rather than fixed hex values in components. Colors are defined as CSS variables and mapped into utility classes.

### Core Semantic Tokens

- `--background`: App page background
- `--foreground`: Primary text color
- `--card` / `--card-foreground`: Surface and text for cards/panels
- `--primary` / `--primary-foreground`: Main call-to-action color pair
- `--secondary` / `--secondary-foreground`: Secondary interactive surfaces
- `--muted` / `--muted-foreground`: Low-emphasis UI/text
- `--accent` / `--accent-foreground`: Highlight/celebratory accent
- `--destructive`: Error and irreversible action color
- `--border` / `--input` / `--ring`: Border, input surface, and focus ring colors
- `--chart-1` ... `--chart-5`: Analytics palette

### Supported Theme Modes

- **Blue theme (default)** via `:root` and `[data-theme="blue"]`
- **Red theme** via `[data-theme="red"]` (vivid profile: stronger `--primary`, `--accent`, `--ring`, warmer surfaces to avoid dull mood)
- **Dark mode** via `.dark`

### Theme-specific helper tokens

- `--theme-primary`
- `--theme-primary-light`
- `--theme-accent`
- `--theme-accent-light`

These tokens are useful for gradients, decorative effects, and marketing sections.

## 3. Typography Rules

### Font Stack

- Primary text: `--font-geist-sans` mapped to `--font-sans`
- Monospace: `--font-geist-mono`
- Heading: `--font-heading` (currently Geist Sans)

### Hierarchy Guidance

Recommended practical scale for this product:

| Role | Suggested Size | Weight | Typical Use |
|------|----------------|--------|-------------|
| Hero Title | 36-56px | 700 | Landing hero, major marketing statements |
| Section Heading | 24-32px | 700 | Features, solutions, analytics section headers |
| Card Title | 16-20px | 600-700 | Dashboard cards, panel titles |
| Body | 14-16px | 400-500 | Explanations, descriptions |
| Caption/Meta | 12-13px | 400-500 | Labels, IDs, hints, timestamps |

### Typography Principles

- Keep participant-facing text short and direct
- Use stronger weights for state labels (`LIVE`, status badges)
- Prefer sentence case for readability and localization friendliness
- Ensure projected-view legibility (avoid tiny text in live session contexts)

## 4. Component Styling Standards

### Buttons

**Primary**
- Use `bg-primary text-primary-foreground`
- Rounded style: `rounded-xl` or `rounded-full` based on context
- Strong hover feedback: shade/border/transform where appropriate

**Secondary**
- Use `bg-secondary text-secondary-foreground`
- Preserve border contrast in both light and dark modes

**Destructive**
- Use `bg-destructive` for irreversible actions only

**States**
- Hover/active/focus-visible states must always be present
- Disabled states should reduce contrast and remove elevated shadows

### Cards & Panels

- Base: `bg-card text-card-foreground border border-border`
- Radius: default `rounded-xl` to `rounded-2xl`
- For high-priority or interactive cards, pair with subtle shadow and hover border tint
- Keep panel headers visually distinct using bottom borders or soft background contrast

### Inputs & Forms

- Inputs should use `bg-background` or `bg-card` with `border-input`
- Clear focus ring using `ring` token and visible contrast
- Validation messages should use semantic colors and concise wording
- Join-code input must prioritize speed and error clarity

### Navigation

- Sticky/top bars should remain low-noise with strong action landmarks
- Keep session identifiers visible in admin/session context
- Mobile navigation must avoid deep nesting and keep primary actions reachable

### Status & Live Signals

- `LIVE` indicators should combine color + shape + motion (e.g., pulse dot)
- Do not rely on color alone for critical status
- Use consistent badge styling across session/admin pages

## 5. Layout & Spacing

### Spacing System

Use Tailwind spacing scale consistently; practical rhythm:

- `4-8px`: tight icon/text spacing
- `12-16px`: control and card internal spacing
- `20-24px`: section spacing inside dashboards
- `32-64px`: page and hero vertical rhythm

### Container Strategy

- Landing pages: wider containers for storytelling and feature grids
- Product/dashboard pages: constrained widths for scanability
- Keep primary content aligned to a stable grid to reduce cognitive load

### Density by Context

- **Participant join flow**: minimal fields, single dominant action
- **Live session view**: medium density, high state visibility
- **Admin analytics**: higher density acceptable, but maintain clear grouping

## 6. Elevation, Motion, and Effects

### Elevation

- Default: flat surfaces + border separation
- Elevated interactive surfaces: soft, low-blur shadows
- Avoid heavy layered shadows in dense admin screens

### Motion

The project includes reusable animations:

- `shimmer`
- `float`
- `pulse-glow`
- `gold-pulse`
- `ai-match-flash`

Use animation to communicate system state or delight, not as decoration. Keep durations smooth and avoid stacking too many simultaneous effects.

### Utility Visual Styles

- `.glass`: translucent card/nav effect
- `.text-gradient-gold`: highlighted text treatment
- `.hero-gradient`: subtle branded hero background
- `.card-vietnam:hover`: branded interactive card hover

Apply these styles selectively to hero and highlight zones, not every surface.

## 7. Accessibility & UX Quality Bar

### Required Standards

- Keyboard focus visibility on all interactive components
- Touch targets >= 44x44px for mobile controls
- Sufficient text contrast in both light and dark themes
- Error messages must explain next user action clearly
- Loading states should show progress feedback (spinners/skeletons)

### Content Guidelines

- Prefer concise microcopy for live workflows
- Avoid ambiguous labels ("Submit" -> "Join Session", "Start Seminar", etc.)
- Keep localization-ready strings short and context-specific

## 8. Responsive Behavior

### Breakpoint Intent

- **Mobile (<768px):** single-column, fast interaction, large touch areas
- **Tablet (768-1024px):** mixed layout with prioritized controls
- **Desktop (>1024px):** multi-panel admin and analytics layouts

### Current UI Priorities

- Navigation collapses cleanly on mobile
- Session/admin top controls remain visible and actionable
- Analytics cards/charts reflow without truncating critical labels
- Hero and feature sections simplify rather than shrink excessively

## 9. Screen-Specific Design Notes

### Home (`/`)

- Bold product value proposition
- Immediate join action by room code
- Feature storytelling with icons and clear CTA hierarchy

### Join (`/join/[id]`)

- Minimal distractions
- Clear seminar identity and participation confirmation flow
- Strong input and permission guidance (e.g., mic usage)

### Session (`/session/[id]`)

- Live interaction-first design
- Real-time feedback should be visible without page refresh assumptions
- Question/voice interactions should prioritize submission confidence

### Admin (`/session/[id]/admin`)

- Tabbed model for interactions vs analytics
- High visibility for session ID and live status
- Future interaction modules should follow existing card/tab language

## 10. Engineering Rules for UI Consistency

- Always consume semantic tokens (`bg-background`, `text-foreground`, etc.) instead of hardcoded colors in components
- Reuse existing animation and utility classes before creating new ones
- Keep border radius and spacing consistent with current scale
- Prefer shared components for repeated patterns (status badges, metric cards, tabs)
- Validate new UI in:
  - light mode
  - dark mode
  - blue and red themes
  - mobile and desktop breakpoints

## 11. Prompt Guide for Future UI Iterations

When asking an AI agent to generate or refine UI, include:

1. **Screen context** (Home/Join/Session/Admin)
2. **State context** (idle/loading/live/error/empty)
3. **Theme context** (light/dark and blue/red)
4. **Interaction priority** (what must be most obvious)
5. **Constraints** (must use semantic tokens, existing animation utilities, responsive behavior)

### Example Prompt

"Refine the admin analytics panel for `/session/[id]/admin` in dark mode. Keep existing token system, improve card grouping and chart readability, and ensure key session status stays visible above the fold on tablet and desktop."
