## Recent Frontend Updates

The Chakancha frontend has been refined to better match the official brand identity, improve the hero experience, resolve production errors, and create a more consistent chatbot interface.

### Brand Assets and Visual Identity

- Added additional hero background images featuring Nandi Hills and Chakancha tea fields.
- Added and updated icons, logo marks, wordmarks, and lockup logo assets.
- Improved the visual quality of the Nandi Hills hero scenery.
- Updated hero controls and buttons to match the Chakancha brand system.
- Updated the Send/Enter button to use the official Chakancha logo mark.
- Added an image to the Review section.
- Replaced generic tea-leaf icons in the chatbot with the official Chakancha mark.
- Applied the approved Chakancha digital tokens to chatbot surfaces, text, borders, focus states, spacing, and interactive controls.

### Hero Section Improvements

- Improved hero image transitions to reduce noticeable pauses between slides.
- Removed the **“Ask anything”** text.
- Replaced the hero headline with:

  > From Nandi Hills to your cup.

- Removed the **AI Chat** and **Search** mode options.
- Reduced the size of the hero prompt input for a cleaner and more balanced layout.
- Removed the **“Single Origin Nandi Hills”** text.
- Refined the hero layout and scenery to make the Nandi Hills presentation more visually engaging.

### Header Navigation Updates

Changed the header navigation label from:

```text
Shop Teas
```

to:

```text
Order Teas
```

### Chatbot Brand Mark Updates

The chatbot previously used generic leaf illustrations and Lucide `Leaf` icons in several locations. These were replaced with the official Chakancha mark to create a more consistent branded experience.

The following changes were made:

- Replaced the leaf icon in the chatbot top header with the official Chakancha mark.
- Replaced the leaf icon in the chatbot empty state with the official Chakancha mark.
- Replaced the custom inline tea-leaf SVG in `AIAvatar.jsx` with the official Chakancha mark.
- Used the standard dark Chakancha mark on light chatbot surfaces.
- Used the white Chakancha mark inside the dark AI response avatar.
- Preserved the streaming pulse animation around the AI avatar.
- Changed the streaming ring to use `--color-accent-muted-gold`.
- Changed the AI avatar background to use `--color-background-dark`.
- Removed dependence on the legacy tea-green avatar colors.
- Kept the marks decorative where appropriate by using empty alternative text and `aria-hidden`.

The chatbot now uses the following mark treatment:

| Location | Chakancha asset treatment |
|---|---|
| Chat top header | Standard Chakancha mark on a light surface |
| Chat empty state | Standard Chakancha mark |
| AI response avatar | White Chakancha mark on `--color-background-dark` |
| Streaming avatar ring | `--color-accent-muted-gold` |

### Chat Input Refinement

Resolved a color clash affecting the active prompt input on the conversation page.

The shared `PromptInput` component was originally designed for the dark Nandi Hills hero image. Its dark glass background and inverse text treatment were also being applied inside the light chatbot conversation page.

The following improvements were made:

- Added chat-specific styling through the existing `chatMode` class.
- Added dark text styling through the existing `textareaChat` class.
- Added a dedicated loading state for the conversation prompt.
- Preserved the original dark glass-morphism design on the hero page.
- Changed the conversation input to use `--color-background-soft`.
- Changed the focused state to `--color-surface-card`.
- Changed the focused border to `--color-accent-muted-gold`.
- Changed the loading state to use `--color-background-muted`.
- Changed the chat submit button to use `--color-background-dark`.
- Used `--color-text-inverse` for the white Chakancha mark and inverse button content.
- Used `--color-text-primary`, `--color-text-muted`, and `--color-border-soft` for readable text and borders.
- Improved disabled text and placeholder readability.
- Kept the white Chakancha mark visible on the submit button.
- Corrected the invalid `@@media` responsive rule.
- Removed the unused `Icon` import from `PromptInput.jsx`.
- Removed reliance on legacy green, cream, olive, and gray tokens in the updated chatbot input styles.

The prompt input now behaves differently according to its context:

| Context | Visual treatment |
|---|---|
| Hero page | Dark translucent glass input with inverse text |
| Chat page | `--color-background-soft` with `--color-text-primary` |
| Focused chat input | `--color-surface-card` with muted-gold border |
| Loading state | `--color-background-muted` with muted-gold emphasis |
| Active submit button | `--color-background-dark` with inverse content |

### Global CSS and Design Token Consolidation

The active global stylesheet was confirmed as:

```text
src/app/globals.css
```

This file is now the primary source of truth for frontend design tokens. Component CSS Modules read the variables declared under `:root`, regardless of whether the component is located inside `src/app`, `src/components`, or another frontend folder.

The following updates were made:

- Replaced the previous green-and-brown color system with the approved Chakancha Brand Manual palette.
- Added canonical background tokens:
  - `--color-background-main`
  - `--color-background-soft`
  - `--color-background-muted`
  - `--color-background-dark`
  - `--color-background-charcoal`
- Added canonical text tokens:
  - `--color-text-primary`
  - `--color-text-secondary`
  - `--color-text-muted`
  - `--color-text-inverse`
- Added approved accent tokens:
  - `--color-accent-muted-gold`
  - `--color-accent-sand`
  - `--color-accent-dark-olive`
- Added surface, border, divider, and semantic color tokens.
- Added reusable black and white opacity tokens.
- Added canonical display, primary, and monospaced font-family tokens.
- Added a responsive typography scale.
- Added a canonical 8px spacing system.
- Added standardized card, panel, and pill/button radii.
- Updated shadows to use neutral black-based values.
- Added standardized transitions, easing values, content widths, and z-index levels.
- Updated body, headings, paragraphs, links, form controls, selection, focus, scrollbar, and shared utility styles.
- Retained temporary compatibility aliases so older components continue to work while they are migrated.
- Confirmed that component CSS Modules should not import `globals.css` directly.
- Confirmed that the second global stylesheet should not be loaded simultaneously with `src/app/globals.css`.

The canonical color palette now includes:

| Token | Value |
|---|---|
| `--color-background-main` | `#FBFAF7` |
| `--color-background-soft` | `#F7F4EE` |
| `--color-background-muted` | `#ECE8E1` |
| `--color-background-dark` | `#111111` |
| `--color-background-charcoal` | `#2B2B2B` |
| `--color-text-primary` | `#111111` |
| `--color-text-secondary` | `#2B2B2B` |
| `--color-text-muted` | `#4A4A4A` |
| `--color-text-inverse` | `#F7F4EE` |
| `--color-accent-muted-gold` | `#B9A777` |
| `--color-accent-sand` | `#D2C59A` |
| `--color-accent-dark-olive` | `#3C4031` |
| `--color-border-soft` | `#D6D0C5` |
| `--color-surface-card` | `#FFFFFF` |

### Footer Brand Alignment

The footer was updated to read its colors, typography, borders, transitions, and interactive states from `src/app/globals.css`.

The following changes were made:

- Replaced the previous dark tea-green background with `--color-background-charcoal`.
- Updated inverse footer text to use `--color-text-inverse`.
- Replaced the previous sunrise-gold treatment with `--color-accent-muted-gold`.
- Added `--color-accent-sand` for softer hover states.
- Updated social icon colors, borders, and hover treatments.
- Updated footer column headings to use muted gold.
- Updated footer navigation links to use controlled inverse-text opacity values.
- Updated newsletter input colors, borders, placeholders, focus states, and shadows.
- Updated the newsletter submit button to use the approved accent palette.
- Updated the subscription confirmation treatment.
- Updated copyright text, legal links, separators, and the footer divider.
- Added keyboard focus states using muted gold.
- Added fallback values to critical CSS variables to prevent transparent or broken styling.
- Preserved the desktop footer margin:

```css
margin-top: 80px;
```

- Preserved the mobile footer margin:

```css
margin-top: 48px;
```

- Confirmed that `Footer.jsx` does not need to change for the footer background to use the global tokens.
- Confirmed that `Footer.module.css` should not import `globals.css` directly.

### Logo Asset Export and Usage Workflow

A consistent Figma-to-code logo workflow was established.

The following approach is now used:

- Logo SVG files should have transparent backgrounds.
- Page and component backgrounds are controlled by CSS, not embedded in the SVG.
- White background rectangles should be removed before exporting.
- Separate SVG files are not required for white, off-white, black, and charcoal backgrounds.
- Two primary color treatments are sufficient:
  - Dark logo for white and off-white surfaces.
  - Light logo for black and charcoal surfaces.
- Both the full lockup and standalone mark should be exported.

Recommended asset structure:

```text
public/
└── brand/
    ├── chakancha-lockup-dark.svg
    ├── chakancha-lockup-light.svg
    ├── chakancha-symbol-dark.svg
    └── chakancha-symbol-light.svg
```

The intended usage is:

| Background | Logo treatment |
|---|---|
| White | Dark logo |
| Off-white | Dark logo |
| Black | Light logo |
| Charcoal | Light logo |

### Header Logo Clear Space

The header logo spacing was refined to follow the Brand Manual’s clear-space guidance.

The following updates were made:

- Added transparent breathing room around the main header lockup.
- Increased the header’s minimum height so the logo does not appear crowded.
- Added controlled vertical and horizontal padding around the logo link.
- Preserved the transparent header treatment over the hero image.
- Added separate mobile clear-space values.
- Confirmed that clear space does not require a white rectangle behind the logo.
- Corrected the CSS Module class-name mismatch between:

```jsx
styles.LogoMark
```

and the previous selector:

```css
.logoLockup
```

- Updated the selector to match the case-sensitive JSX class:

```css
.LogoMark
```

- Removed the invalid declaration:

```css
padding-top: 1;
```

- Improved vertical alignment between the logo, navigation links, cart, and account actions.

### Conversation View Design-System Alignment

`ConversationView.module.css` was aligned with the canonical variables from `src/app/globals.css`.

The following improvements were made:

- Replaced legacy color aliases with canonical Brand Manual tokens.
- Updated the main conversation background to use `--color-background-main`.
- Updated the sticky top bar to use a translucent version of the main background.
- Updated top-bar borders to use `--color-border-soft`.
- Updated the conversation title to use canonical typography and text tokens.
- Updated the intent badge to use the limited dark-olive accent.
- Updated top-bar buttons to use neutral borders and muted-gold interaction states.
- Updated destructive buttons to use the semantic error token.
- Updated the custom scrollbar styling.
- Updated message-list spacing to use the canonical spacing scale.
- Updated the empty-state mark, title, subtitle, and suggestion chips.
- Updated suggestion chips to use card surfaces, neutral borders, pill radii, and muted-gold hover states.
- Updated error bars and retry buttons to use semantic error styling.
- Updated the scroll-to-bottom button to use charcoal and muted-gold treatments.
- Updated the input bar to use canonical backgrounds, borders, and transparency values.
- Added `100dvh` support for improved mobile viewport behavior.
- Added `min-height: 0` to the scrollable message area to prevent flex overflow.
- Added `overscroll-behavior-y: contain`.
- Replaced independently hardcoded header offsets with spacing-token calculations.
- Corrected the invalid PromptInput wildcard selector by using a valid class attribute selector.
- Added mobile-specific spacing, action, and layout refinements.

The conversation page now follows this visual structure:

| Element | Token treatment |
|---|---|
| Main conversation background | `--color-background-main` |
| Sticky top bar | Translucent `--color-background-main` |
| Borders | `--color-border-soft` |
| Main text | `--color-text-primary` |
| Supporting text | `--color-text-muted` |
| Interactive emphasis | `--color-accent-muted-gold` |
| Limited contextual accent | `--color-accent-dark-olive` |
| Scroll button | `--color-background-charcoal` |

### Message Bubble Design-System Alignment

`MessageBubble.module.css` was aligned with the canonical global design system.

The following improvements were made:

- Replaced the previous tea-green user bubble with a charcoal user bubble.
- Updated user-message text to use `--color-text-inverse`.
- Updated AI-message bubbles to use `--color-surface-card`.
- Updated AI-message text to use `--color-text-secondary`.
- Updated bubble borders to use `--color-border-soft`.
- Updated bubble spacing, radii, shadows, and transitions.
- Updated system-message pills to use the soft background and pill radius.
- Added explicit text inheritance inside dark user bubbles.
- Prevented global paragraph styling from turning user-message text dark.
- Updated links inside user bubbles to use the sand accent.
- Updated links inside AI messages to use dark olive with muted-gold underlines.
- Added styling for paragraphs, lists, links, inline code, code blocks, and blockquotes inside AI responses.
- Updated action buttons to use neutral surfaces and muted-gold focus states.
- Added `focus-within` support so message controls remain visible during keyboard interaction.
- Updated timestamps to use muted text.
- Added mobile behavior that keeps message actions visible on touch devices.
- Improved wrapping for long links, code, and unbroken message content.
- Added accessible focus states across message actions.

The message treatment is now:

| Message type | Visual treatment |
|---|---|
| User message | Charcoal background with inverse text |
| AI message | White card surface with dark text |
| System message | Soft off-white pill |
| User-message link | Sand accent |
| AI-message link | Dark olive with muted-gold underline |
| Code block | Charcoal background with inverse text |
| Blockquote | Muted text with muted-gold border |

### CSS Module and Global Variable Architecture

The frontend styling architecture was clarified and standardized.

The project now follows this relationship:

```text
src/app/globals.css
        ↓
Defines global :root design tokens
        ↓
Component CSS Modules read the variables
        ↓
Header.module.css
Footer.module.css
ConversationView.module.css
MessageBubble.module.css
PromptInput.module.css
```

Implementation rules:

- Global CSS is loaded once by the Next.js application.
- Component CSS Modules do not import the global stylesheet.
- Component folder location does not affect access to `:root` variables.
- CSS custom properties are inherited through the rendered document.
- Updated components should use canonical variables instead of hardcoded colors.
- Compatibility aliases remain temporary and should be removed gradually.
- New components should use canonical tokens directly.

### Error Fixes

#### Missing Dark Logo Error

Resolved the `404` error for:

```text
/images/icons/chakancha-lockup-dark.svg
```

The logo filename was corrected so that the browser path matches the asset inside the public images directory.

#### React Hydration Errors

Resolved React hydration errors `#418` and `#423`.

The issue was caused by a clickable logo component being rendered inside an existing navigation link, which created nested anchor elements.

The mobile logo was updated to disable its internal clickable behavior when it is already wrapped by the navigation link.

#### Global Stylesheet Conflict

Identified two separate global CSS files in the frontend.

The active stylesheet was confirmed as:

```text
src/app/globals.css
```

The styling architecture was updated so this file controls the global design tokens used by the footer, header, chatbot, conversation view, and message bubbles.

This prevents the legacy green-and-brown token system from overriding the Brand Manual palette.

### Result

The frontend now provides:

- Smoother hero transitions.
- More consistent Chakancha branding.
- Official Chakancha marks throughout the chatbot interface.
- Improved logo and icon reliability.
- A standardized transparent SVG logo workflow.
- Dark and light logo treatments for different surfaces.
- Brand-manual-aligned clear space around the header logo.
- Cleaner header navigation.
- A dark, structured, brand-aligned footer.
- Footer colors controlled through the global design system.
- Preserved desktop and mobile footer margins.
- Better chatbot input readability.
- Separate visual treatments for hero and conversation inputs.
- A consolidated global design-token system.
- Canonical colors, typography, spacing, radii, shadows, transitions, and z-index values.
- Temporary compatibility aliases for older components.
- A conversation interface aligned with the Brand Manual.
- Charcoal user-message bubbles with readable inverse text.
- Neutral AI-message cards with improved rich-text formatting.
- Improved keyboard, focus, hover, and mobile interaction states.
- Clearer CSS Module and global-variable architecture.
- Fewer hydration, styling, and asset-loading errors.
