---
name: Earthbound Modern
colors:
  surface: '#fdf8f7'
  surface-dim: '#ddd9d7'
  surface-bright: '#fdf8f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f3f1'
  surface-container: '#f2edeb'
  surface-container-high: '#ece7e6'
  surface-container-highest: '#e6e1e0'
  on-surface: '#1c1b1b'
  on-surface-variant: '#4c463f'
  inverse-surface: '#32302f'
  inverse-on-surface: '#f5f0ee'
  outline: '#7e766e'
  outline-variant: '#cfc5bc'
  surface-tint: '#655d56'
  primary: '#221d18'
  on-primary: '#ffffff'
  primary-container: '#38322c'
  on-primary-container: '#a39a92'
  inverse-primary: '#cfc5bc'
  secondary: '#526168'
  on-secondary: '#ffffff'
  secondary-container: '#d2e2ea'
  on-secondary-container: '#56656c'
  tertiary: '#2f1900'
  on-tertiary: '#ffffff'
  tertiary-container: '#4c2c00'
  on-tertiary-container: '#c79152'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ece1d8'
  primary-fixed-dim: '#cfc5bc'
  on-primary-fixed: '#201b15'
  on-primary-fixed-variant: '#4c463f'
  secondary-fixed: '#d5e5ed'
  secondary-fixed-dim: '#b9c9d1'
  on-secondary-fixed: '#0f1e23'
  on-secondary-fixed-variant: '#3a4950'
  tertiary-fixed: '#ffddbb'
  tertiary-fixed-dim: '#f7bb78'
  on-tertiary-fixed: '#2b1700'
  on-tertiary-fixed-variant: '#663e04'
  background: '#fdf8f7'
  on-background: '#1c1b1b'
  surface-variant: '#e6e1e0'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  gutter: 16px
  margin: 24px
---

## Brand & Style
The design system is rooted in the concept of "Elevated Community." It blends the raw, tactile essence of organic earth tones with a sophisticated, high-end digital execution. The target audience seeks meaningful, real-world connection without sacrificing a premium aesthetic experience.

The chosen style is **Minimalism with Tactile Undercurrents**. It leverages heavy whitespace and a restricted color palette to create a sense of calm and exclusivity. By utilizing high-quality typography and subtle depth, the UI feels grounded and permanent rather than ephemeral. It evokes feelings of warmth, reliability, and modern craftsmanship.

## Colors
The palette is dominated by the warm beige background to ensure a soft, parchment-like reading experience. The deep charcoal/brown serves as the primary anchor for text and structural elements, providing high contrast against the neutral base. 

Muted blue-grey is used for secondary information and utilitarian UI components. The warm ochre and terracotta are reserved for high-intent actions, highlights, and status indicators, ensuring they stand out as meaningful "sparks" within the organic environment.

## Typography
This design system utilizes a dual-font strategy. **Plus Jakarta Sans** provides a modern, welcoming geometry for headlines, giving the brand its friendly and optimistic character. **Inter** is used for body copy and labels to maintain functional clarity and a systematic feel. 

Headlines should use tighter letter spacing for a more "editorial" look. Body text maintains a generous line height to ensure maximum readability against the warm neutral background.

## Layout & Spacing
The layout follows a **Fluid Grid** model with a strong emphasis on whitespace to reflect the "openness" of community activities. Elements are arranged on an 8px baseline grid to ensure mathematical harmony.

On mobile devices, a 4-column grid is used with 24px side margins. On larger screens, this expands to a 12-column grid. Layouts should prioritize vertical stacking with generous padding (using `2xl` and `3xl` tokens) between major sections to prevent visual clutter and maintain a high-end, gallery-like feel.

## Elevation & Depth
Depth is conveyed through **Tonal Layers** and **Ambient Shadows**. Instead of harsh black shadows, we use a "Deep Charcoal" tint at very low opacity (8-12%) to keep the shadows feeling natural and integrated with the earth tones.

- **Level 0 (Base):** Background Beige (#D8CFC0).
- **Level 1 (Cards/Inputs):** Surface Color (#E2DACF) with a subtle 1px border in the Secondary Slate at 10% opacity.
- **Level 2 (Floating elements):** Soft, extra-diffused shadows with a high blur radius (16px+) and a small Y-offset (4px) to simulate light hitting a soft surface.

## Shapes
The shape language is defined by "Organic Geometry." We use a **Rounded** approach (0.5rem base) to soften the UI, making it feel more human and less "tech-heavy." 

Large containers like cards or image wrappers should utilize the `rounded-xl` (1.5rem) token to emphasize the communal, friendly nature of the app. Interactive elements like buttons and input fields should stick to the base roundedness for a precise, modern look.

## Components

### Buttons
- **Primary:** Deep Charcoal background with Beige text. Sharp, high-contrast.
- **Secondary:** Transparent background with a 1.5px Charcoal border.
- **Tertiary/Ghost:** Gold text for subtle calls to action.

### Cards
Cards should use the Surface Color with no visible border, relying instead on the "Level 2" ambient shadow. Padding inside cards should be at least `lg` (24px) to maintain the premium feel.

### Input Fields
Inputs use a slightly lighter version of the background or a subtle 1px outline in Slate. Focus states should transition the border color to Gold and apply a soft Gold-tinted outer glow.

### Chips & Tags
Use the Terracotta and Gold accents for tags. These should have a low-opacity background of the color with high-opacity text of the same hue to ensure readability without being overpowering.

### Community Specifics
- **Activity Feed:** Use large-scale photography with `rounded-xl` corners and overlapping text elements.
- **Member Avatars:** Always circular to contrast against the soft-rectilinear shapes of the rest of the UI.
- **Progress Bars:** Use Terracotta for active states to symbolize energy and movement.