---
name: Deep Space HUD
colors:
  surface: '#0c1324'
  surface-dim: '#0c1324'
  surface-bright: '#33394c'
  surface-container-lowest: '#070d1f'
  surface-container-low: '#151b2d'
  surface-container: '#191f31'
  surface-container-high: '#23293c'
  surface-container-highest: '#2e3447'
  on-surface: '#dce1fb'
  on-surface-variant: '#bbc9cd'
  inverse-surface: '#dce1fb'
  inverse-on-surface: '#2a3043'
  outline: '#859397'
  outline-variant: '#3c494c'
  surface-tint: '#2fd9f4'
  primary: '#8aebff'
  on-primary: '#00363e'
  primary-container: '#22d3ee'
  on-primary-container: '#005763'
  inverse-primary: '#006877'
  secondary: '#ddb7ff'
  on-secondary: '#490080'
  secondary-container: '#6f00be'
  on-secondary-container: '#d6a9ff'
  tertiary: '#d9e70d'
  on-tertiary: '#2f3300'
  tertiary-container: '#beca00'
  on-tertiary-container: '#4d5300'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#a2eeff'
  primary-fixed-dim: '#2fd9f4'
  on-primary-fixed: '#001f25'
  on-primary-fixed-variant: '#004e5a'
  secondary-fixed: '#f0dbff'
  secondary-fixed-dim: '#ddb7ff'
  on-secondary-fixed: '#2c0051'
  on-secondary-fixed-variant: '#6900b3'
  tertiary-fixed: '#dfed1a'
  tertiary-fixed-dim: '#c3d000'
  on-tertiary-fixed: '#1b1d00'
  on-tertiary-fixed-variant: '#454a00'
  background: '#0c1324'
  on-background: '#dce1fb'
  surface-variant: '#2e3447'
  surface-base: '#020617'
  surface-glass: rgba(15, 23, 42, 0.6)
  border-glass: rgba(255, 255, 255, 0.1)
  glow-cyan: rgba(34, 211, 238, 0.4)
  glow-purple: rgba(168, 85, 247, 0.3)
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.04em
  display-lg-mobile:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-edge: 40px
  container-max: 1440px
---

## Brand & Style
The design system embodies a "Jarvis-like" intelligence: hyper-efficient, futuristic, and computationally superior. The visual direction merges the technical precision of modern DevOps tools with a cinematic, sci-fi aesthetic. 

The core style is **Cinematic Glassmorphism**. It utilizes deep atmospheric depth, high-contrast typography, and ethereal glow effects to create a layered interface that feels like a holographic projection. The target audience—DevOps engineers and SREs—requires a high-density information environment that maintains clarity through visual hierarchy and light-based feedback loops.

## Colors
This design system utilizes a dark-first palette to reduce eye strain during long "war room" sessions.

- **Primary (Cyan):** Used for "Active" states, data streams, and successful deployments. It provides the core "HUD" feel.
- **Secondary (Purple):** Reserved for AI-driven insights, background ambiance, and high-level orchestration features.
- **Tertiary (Neon Lime):** Inherited from the reference, used sparingly for critical warnings or "breaking" highlights that need immediate visual separation.
- **Surface Strategy:** The background is a static `#020617`. Overlays use `Slate-900` with varying levels of opacity and a minimum of `20px` backdrop-blur. 
- **Ambient Gradients:** Subtle, large-radius radial gradients of purple and cyan should be positioned at the viewport corners to provide depth without distracting from the UI content.

## Typography
The typography system balances modern UI clarity with technical authority. 

- **Display & Headlines:** Use **Geist** for its mathematical precision and clean terminals. Large display type should use tight letter-spacing to feel "engineered."
- **Body:** **Inter** handles all long-form text and interface labels for maximum legibility against dark backgrounds.
- **Technical/Code:** **JetBrains Mono** is the workhorse for terminal outputs, log streams, and metadata labels.
- **Label-Caps:** Used for small UI headers (e.g., sidebar categories). These should always be uppercase with generous letter spacing to evoke a digital instrument panel.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model. The core workspace resides in a constrained central container (max 1440px), while ambient background effects and secondary navigation elements may bleed to the screen edges.

- **Grid:** A 12-column system with 24px gutters. 
- **Rhythm:** All padding and margins must be multiples of 4px. 
- **Density:** High information density is preferred. Use tight vertical spacing for lists and data tables, but maintain wide "breathing room" (40px+) around major section headers to preserve the premium feel.
- **Mobile Reflow:** On mobile, sidebars collapse into a bottom-anchored "Command Bar," and 40px margins reduce to 16px.

## Elevation & Depth
Elevation is achieved through **optical transparency** rather than traditional drop shadows.

1.  **Level 0 (Floor):** Deep Navy (#020617) with ambient purple/cyan radial blurs.
2.  **Level 1 (Panels):** Semi-transparent Slate-900 (60% opacity) with 20px backdrop-blur and a 1px "glass" border (rgba 255, 255, 255, 0.05).
3.  **Level 2 (Modals/Popovers):** Higher opacity Slate-900 (80%) with 40px backdrop-blur and a subtle outer glow using the primary cyan (opacity 10%).
4.  **Floating Elements:** Elements like tooltips or the AI chat bubble use a "gradient border" technique—a 1px stroke that transitions from Cyan to Purple.

## Shapes
The shape language is "Soft-Technical." Elements use a consistent 0.25rem (4px) base radius to maintain a crisp, professional edge.

- **Cards/Containers:** Use `rounded-lg` (8px) for a subtle softening of the glass panels.
- **Buttons:** Use `rounded-md` (6px). Avoid pill-shapes unless for specific "Status" chips.
- **Inputs:** Strict 4px corners to align with the monospaced font aesthetic.

## Components

- **Buttons:** 
  - *Primary:* Solid Cyan background with black text. On hover, add a 4px Cyan outer glow. 
  - *Ghost:* 1px Cyan border, transparent background. Hover triggers a subtle "Pulse" animation in the border.
- **Glass Cards:** Must feature a `top-left` to `bottom-right` linear gradient stroke (rgba white 10% to 0%).
- **AI Command Bar:** A centered, floating input field with a perpetual, low-frequency purple glow. Uses JetBrains Mono for the placeholder text.
- **Status Chips:** Small, monospaced text. "Active" status must include a small blinking dot (pulse) next to the label.
- **Code Blocks:** Deep Slate-950 background, no blur, with JetBrains Mono. Syntax highlighting uses the primary Cyan and Secondary Purple.
- **Micro-interactions:** All transitions (hover, focus) should use a `cubic-bezier(0.16, 1, 0.3, 1)` easing function for a "snappy" yet smooth high-end feel.