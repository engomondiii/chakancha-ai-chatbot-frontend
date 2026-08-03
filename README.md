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

### Result

The frontend now provides:

- Smoother hero transitions.
- More consistent Chakancha branding.
- Official Chakancha marks throughout the chatbot interface.
- Improved logo and icon reliability.
- Cleaner header navigation.
- Better chatbot input readability.
- Separate visual treatments for hero and conversation inputs.
- Brand-manual-aligned digital tokens.
- Fewer hydration and asset-loading errors.