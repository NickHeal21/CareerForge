---
name: Functional Clarity
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daef'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e1e8fd'
  surface-container-highest: '#dce2f7'
  on-surface: '#141b2b'
  on-surface-variant: '#424754'
  inverse-surface: '#293040'
  inverse-on-surface: '#edf0ff'
  outline: '#727785'
  outline-variant: '#c2c6d6'
  surface-tint: '#005ac2'
  primary: '#0058be'
  on-primary: '#ffffff'
  primary-container: '#2170e4'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#924700'
  on-tertiary: '#ffffff'
  tertiary-container: '#b75b00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffdcc6'
  tertiary-fixed-dim: '#ffb786'
  on-tertiary-fixed: '#311400'
  on-tertiary-fixed-variant: '#723600'
  background: '#f9f9ff'
  on-background: '#141b2b'
  surface-variant: '#dce2f7'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  code:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 20px
  gutter: 16px
---

## Brand & Style

The design system is rooted in functional minimalism, prioritizing utility and information density over decorative elements. It adopts a "tool-like" aesthetic similar to high-end productivity software, where the interface recedes to let the user's career data and content take center stage.

The personality is professional, objective, and efficient. It avoids all trend-driven effects like gradients, shadows, or blurs, relying instead on structural integrity, precise alignment, and purposeful whitespace to create hierarchy. The goal is to evoke a sense of focused calm and institutional reliability.

## Colors

The palette is strictly functional. White is the primary canvas, ensuring maximum clarity. 

- **Primary:** A focused blue used sparingly for actionable elements, progress indicators, and active states.
- **Surface:** Secondary surfaces use very light grays (`#F9FAFB`) to create subtle containment without the weight of shadows.
- **Borders:** A consistent light gray (`#E5E7EB`) defines the structure of the UI.
- **Text:** High-contrast dark tones ensure readability, with subtle shifts to slate grays for secondary metadata.

## Typography

This design system utilizes a single typeface family to maintain a systematic, cohesive feel. Inter is chosen for its exceptional legibility on digital screens and its neutral, modern character.

Hierarchy is established through weight and size rather than color. Headlines use tighter letter spacing and heavier weights to feel grounded. Body text is optimized for long-form reading with generous line heights. Labels use a slightly heavier weight and tracking to distinguish them from standard body copy.

## Layout & Spacing

The layout follows a strict 4px baseline grid. On mobile, the system uses a single-column fluid layout with 20px side margins. On desktop, it transitions to a structured grid with a maximum content width of 1200px.

Spacing is used as the primary tool for grouping. Related elements (like a label and an input) use 8px spacing, while distinct sections use 32px or more. Sidebars and navigation menus are separated by a 1px solid border rather than a shadow or color shift.

## Elevation & Depth

This design system is flat. Depth is conveyed exclusively through:
- **Tonal Layering:** Using `#F9FAFB` for background containers or sidebars to distinguish them from the main `#FFFFFF` content area.
- **Outlines:** 1px solid borders (`#E5E7EB`) define the boundaries of all interactive cards and sections.
- **State Changes:** Hover states are indicated by subtle background color shifts (e.g., White to `#F3F4F6`) rather than elevation or shadow increases.

## Shapes

All interactive and container elements use a uniform 8px corner radius. This creates a balanced look—friendly enough to be approachable, but sharp enough to feel professional and structured. Small components like tags or checkboxes also adhere to this radius to maintain a consistent visual language.

## Components

### Buttons
Buttons are solid and rectangular with 8px corners. Primary buttons use a solid blue background with white text. Secondary buttons use a 1px border with no fill. All buttons use a 14px semi-bold font.

### Input Fields
Inputs consist of a 1px border and a subtle light gray background. On focus, the border color changes to the primary blue. Labels sit directly above the input in a smaller, bold typeface.

### Cards
Cards are simple containers with a 1px gray border. There is no shadow. Padding inside cards is a consistent 24px (lg spacing) to ensure content breathes.

### Chips & Tags
Used for skills or categories, these have a very light gray fill and 12px medium-weight text. They use the same 8px radius as all other elements.

### Progress Indicators
Linear bars with a 4px height. The background track is light gray, and the progress fill is the primary blue. No rounded ends; use the standard system radius.