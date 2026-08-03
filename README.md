## Recent Frontend Updates

The Chakancha frontend has been refined to better match the official brand identity, improve the hero experience, resolve production errors, and create a more consistent chatbot interface.

### Brand Assets and Visual Identity

- Added additional hero background images featuring Nandi Hills and Chakancha tea fields.
- Added and updated icons, logo marks, wordmarks, and lockup logo assets.
- Improved the visual quality of the Nandi Hills hero scenery.
- Updated hero controls and buttons to match the Chakancha brand system.
- Updated the Send/Enter button to use the Chakancha logo mark.
- Added an image to the Review section.

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

### Chat Input Refinement

Resolved a color clash affecting the active prompt input on the white conversation page.

The shared `PromptInput` component was originally designed for the dark Nandi Hills hero image. Its dark glass background and white text were also being applied inside the chatbot conversation page.

The following improvements were made:

- Added chat-specific styling through the existing `chatMode` class.
- Added dark text styling through the existing `textareaChat` class.
- Added a dedicated loading state for the conversation prompt.
- Preserved the original dark glass-morphism design on the hero page.
- Changed the conversation input to use a warm cream background.
- Changed the focused state to soft white with a tea-green border.
- Changed the loading state to use muted olive accents.
- Updated the active submit button to use Chakancha tea green.
- Improved disabled text and placeholder readability.
- Kept the white Chakancha mark visible on the submit button.
- Corrected the invalid `@@media` responsive rule.
- Removed the unused `Icon` import from `PromptInput.jsx`.

The prompt input now behaves differently according to its context:

| Context | Visual treatment |
|---|---|
| Hero page | Dark translucent glass input with white text |
| Chat page | Warm cream input with dark text |
| Focused chat input | Soft white background with green focus border |
| Loading state | Warm cream with muted olive emphasis |
| Active submit button | Chakancha tea green |

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
- Improved logo and icon reliability.
- Cleaner header navigation.
- Better chatbot input readability.
- Separate visual treatments for hero and conversation inputs.
- Fewer hydration and asset-loading errors.