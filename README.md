**## Recent Frontend Updates**

The Chakancha frontend has been refined to better match the official brand identity, improve the hero and product experiences, resolve production errors, and create a more consistent chatbot interface.

**### Brand Assets and Visual Identity**

\- Added additional hero background images featuring Nandi Hills and Chakancha tea fields.
\- Added and updated icons, logo marks, wordmarks, and lockup logo assets.
\- Improved the visual quality of the Nandi Hills hero scenery.
\- Updated hero controls and buttons to match the Chakancha brand system.
\- Updated the Send/Enter button to use the official Chakancha logo mark.
\- Added an image to the Review section.
\- Replaced generic tea-leaf icons in the chatbot with the official Chakancha mark.
\- Applied the approved Chakancha digital tokens to chatbot surfaces, text, borders, focus states, spacing, and interactive controls.

**### Hero Section Improvements**

\- Improved hero image transitions to reduce noticeable pauses between slides.
\- Removed the **\*\*“Ask anything”\*\*** text.
\- Replaced the hero headline with:

  > From Nandi Hills to your cup.

\- Removed the **\*\*AI Chat\*\*** and **\*\*Search\*\*** mode options.
\- Reduced the size of the hero prompt input for a cleaner and more balanced layout.
\- Removed the **\*\*“Single Origin Nandi Hills”\*\*** text.
\- Refined the hero layout and scenery to make the Nandi Hills presentation more visually engaging.

**### Header Navigation Updates**

Changed the header navigation label from:

\`\`\`text
Shop Teas
\`\`\`

to:

\`\`\`text
Order Teas
\`\`\`

**### Chatbot Brand Mark Updates**

The chatbot previously used generic leaf illustrations and Lucide \`Leaf\` icons in several locations. These were replaced with the official Chakancha mark to create a more consistent branded experience.

The following changes were made:

\- Replaced the leaf icon in the chatbot top header with the official Chakancha mark.
\- Replaced the leaf icon in the chatbot empty state with the official Chakancha mark.
\- Replaced the custom inline tea-leaf SVG in \`AIAvatar.jsx\` with the official Chakancha mark.
\- Used the standard dark Chakancha mark on light chatbot surfaces.
\- Used the white Chakancha mark inside the dark AI response avatar.
\- Preserved the streaming pulse animation around the AI avatar.
\- Changed the streaming ring to use \`--color-accent-muted-gold\`.
\- Changed the AI avatar background to use \`--color-background-dark\`.
\- Removed dependence on the legacy tea-green avatar colors.
\- Kept the marks decorative where appropriate by using empty alternative text and \`aria-hidden\`.

The chatbot now uses the following mark treatment:

\| Location              | Chakancha asset treatment                         |
\| --------------------- | ------------------------------------------------- |
\| Chat top header       | Standard Chakancha mark on a light surface        |
\| Chat empty state      | Standard Chakancha mark                           |
\| AI response avatar    | White Chakancha mark on \`--color-background-dark\` |
\| Streaming avatar ring | \`--color-accent-muted-gold\`                       |

**### Chat Input Refinement**

Resolved a color clash affecting the active prompt input on the conversation page.

The shared \`PromptInput\` component was originally designed for the dark Nandi Hills hero image. Its dark glass background and inverse text treatment were also being applied inside the light chatbot conversation page.

The following improvements were made:

\- Added chat-specific styling through the existing \`chatMode\` class.
\- Added dark text styling through the existing \`textareaChat\` class.
\- Added a dedicated loading state for the conversation prompt.
\- Preserved the original dark glass-morphism design on the hero page.
\- Changed the conversation input to use \`--color-background-soft\`.
\- Changed the focused state to \`--color-surface-card\`.
\- Changed the focused border to \`--color-accent-muted-gold\`.
\- Changed the loading state to use \`--color-background-muted\`.
\- Changed the chat submit button to use \`--color-background-dark\`.
\- Used \`--color-text-inverse\` for the white Chakancha mark and inverse button content.
\- Used \`--color-text-primary\`, \`--color-text-muted\`, and \`--color-border-soft\` for readable text and borders.
\- Improved disabled text and placeholder readability.
\- Kept the white Chakancha mark visible on the submit button.
\- Corrected the invalid \`@@media\` responsive rule.
\- Removed the unused \`Icon\` import from \`PromptInput.jsx\`.
\- Removed reliance on legacy green, cream, olive, and gray tokens in the updated chatbot input styles.

The prompt input now behaves differently according to its context:

\| Context              | Visual treatment                                      |
\| -------------------- | ----------------------------------------------------- |
\| Hero page            | Dark translucent glass input with inverse text        |
\| Chat page            | \`--color-background-soft\` with \`--color-text-primary\` |
\| Focused chat input   | \`--color-surface-card\` with muted-gold border         |
\| Loading state        | \`--color-background-muted\` with muted-gold emphasis   |
\| Active submit button | \`--color-background-dark\` with inverse content        |

**### Global CSS and Design Token Consolidation**

The active global stylesheet was confirmed as:

\`\`\`text
src/app/globals.css
\`\`\`

This file is now the primary source of truth for frontend design tokens. Component CSS Modules read the variables declared under \`:root\`, regardless of whether the component is located inside \`src/app\`, \`src/components\`, or another frontend folder.

The following updates were made:

\- Replaced the previous green-and-brown color system with the approved Chakancha Brand Manual palette.
\- Added canonical background tokens:
  - \`--color-background-main\`
  - \`--color-background-soft\`
  - \`--color-background-muted\`
  - \`--color-background-dark\`
  - \`--color-background-charcoal\`
\- Added canonical text tokens:
  - \`--color-text-primary\`
  - \`--color-text-secondary\`
  - \`--color-text-muted\`
  - \`--color-text-inverse\`
\- Added approved accent tokens:
  - \`--color-accent-muted-gold\`
  - \`--color-accent-sand\`
  - \`--color-accent-dark-olive\`
\- Added surface, border, divider, and semantic color tokens.
\- Added reusable black and white opacity tokens.
\- Added canonical display, primary, and monospaced font-family tokens.
\- Added a responsive typography scale.
\- Added a canonical 8px spacing system.
\- Added standardized card, panel, and pill/button radii.
\- Updated shadows to use neutral black-based values.
\- Added standardized transitions, easing values, content widths, and z-index levels.
\- Updated body, headings, paragraphs, links, form controls, selection, focus, scrollbar, and shared utility styles.
\- Retained temporary compatibility aliases so older components continue to work while they are migrated.
\- Confirmed that component CSS Modules should not import \`globals.css\` directly.
\- Confirmed that the second global stylesheet should not be loaded simultaneously with \`src/app/globals.css\`.

The canonical color palette now includes:

\| Token                         | Value     |
\| ----------------------------- | --------- |
\| \`--color-background-main\`     | \`#FBFAF7\` |
\| \`--color-background-soft\`     | \`#F7F4EE\` |
\| \`--color-background-muted\`    | \`#ECE8E1\` |
\| \`--color-background-dark\`     | \`#111111\` |
\| \`--color-background-charcoal\` | \`#2B2B2B\` |
\| \`--color-text-primary\`        | \`#111111\` |
\| \`--color-text-secondary\`      | \`#2B2B2B\` |
\| \`--color-text-muted\`          | \`#4A4A4A\` |
\| \`--color-text-inverse\`        | \`#F7F4EE\` |
\| \`--color-accent-muted-gold\`   | \`#B9A777\` |
\| \`--color-accent-sand\`         | \`#D2C59A\` |
\| \`--color-accent-dark-olive\`   | \`#3C4031\` |
\| \`--color-border-soft\`         | \`#D6D0C5\` |
\| \`--color-surface-card\`        | \`#FFFFFF\` |

**### Footer Brand Alignment**

The footer was updated to read its colors, typography, borders, transitions, and interactive states from \`src/app/globals.css\`.

The following changes were made:

\- Replaced the previous dark tea-green background with \`--color-background-charcoal\`.
\- Updated inverse footer text to use \`--color-text-inverse\`.
\- Replaced the previous sunrise-gold treatment with \`--color-accent-muted-gold\`.
\- Added \`--color-accent-sand\` for softer hover states.
\- Updated social icon colors, borders, and hover treatments.
\- Updated footer column headings to use muted gold.
\- Updated footer navigation links to use controlled inverse-text opacity values.
\- Updated newsletter input colors, borders, placeholders, focus states, and shadows.
\- Updated the newsletter submit button to use the approved accent palette.
\- Updated the subscription confirmation treatment.
\- Updated copyright text, legal links, separators, and the footer divider.
\- Added keyboard focus states using muted gold.
\- Added fallback values to critical CSS variables to prevent transparent or broken styling.
\- Preserved the desktop footer margin:

\`\`\`css
margin-top: 80px;
\`\`\`

\- Preserved the mobile footer margin:

\`\`\`css
margin-top: 48px;
\`\`\`

\- Confirmed that \`Footer.jsx\` does not need to change for the footer background to use the global tokens.
\- Confirmed that \`Footer.module.css\` should not import \`globals.css\` directly.

**### Logo Asset Export and Usage Workflow**

A consistent Figma-to-code logo workflow was established.

The following approach is now used:

\- Logo SVG files should have transparent backgrounds.
\- Page and component backgrounds are controlled by CSS, not embedded in the SVG.
\- White background rectangles should be removed before exporting.
\- Separate SVG files are not required for white, off-white, black, and charcoal backgrounds.
\- Two primary color treatments are sufficient:
  - Dark logo for white and off-white surfaces.
  - Light logo for black and charcoal surfaces.
\- Both the full lockup and standalone mark should be exported.

Recommended asset structure:

\`\`\`text
public/
└── brand/
    ├── chakancha-lockup-dark.svg
    ├── chakancha-lockup-light.svg
    ├── chakancha-symbol-dark.svg
    └── chakancha-symbol-light.svg
\`\`\`

The intended usage is:

\| Background | Logo treatment |
\| ---------- | -------------- |
\| White      | Dark logo      |
\| Off-white  | Dark logo      |
\| Black      | Light logo     |
\| Charcoal   | Light logo     |

**### Header Logo Clear Space**

The header logo spacing was refined to follow the Brand Manual’s clear-space guidance.

The following updates were made:

\- Added transparent breathing room around the main header lockup.
\- Increased the header’s minimum height so the logo does not appear crowded.
\- Added controlled vertical and horizontal padding around the logo link.
\- Preserved the transparent header treatment over the hero image.
\- Added separate mobile clear-space values.
\- Confirmed that clear space does not require a white rectangle behind the logo.
\- Corrected the CSS Module class-name mismatch between:

\`\`\`jsx
styles.LogoMark;
\`\`\`

and the previous selector:

\`\`\`css
.logoLockup
\`\`\`

\- Updated the selector to match the case-sensitive JSX class:

\`\`\`css
.LogoMark
\`\`\`

\- Removed the invalid declaration:

\`\`\`css
padding-top: 1;
\`\`\`

\- Improved vertical alignment between the logo, navigation links, cart, and account actions.

**### Conversation View Design-System Alignment**

\`ConversationView\.module.css\` was aligned with the canonical variables from \`src/app/globals.css\`.

The following improvements were made:

\- Replaced legacy color aliases with canonical Brand Manual tokens.
\- Updated the main conversation background to use \`--color-background-main\`.
\- Updated the sticky top bar to use a translucent version of the main background.
\- Updated top-bar borders to use \`--color-border-soft\`.
\- Updated the conversation title to use canonical typography and text tokens.
\- Updated the intent badge to use the limited dark-olive accent.
\- Updated top-bar buttons to use neutral borders and muted-gold interaction states.
\- Updated destructive buttons to use the semantic error token.
\- Updated the custom scrollbar styling.
\- Updated message-list spacing to use the canonical spacing scale.
\- Updated the empty-state mark, title, subtitle, and suggestion chips.
\- Updated suggestion chips to use card surfaces, neutral borders, pill radii, and muted-gold hover states.
\- Updated error bars and retry buttons to use semantic error styling.
\- Updated the scroll-to-bottom button to use charcoal and muted-gold treatments.
\- Updated the input bar to use canonical backgrounds, borders, and transparency values.
\- Added \`100dvh\` support for improved mobile viewport behavior.
\- Added \`min-height: 0\` to the scrollable message area to prevent flex overflow.
\- Added \`overscroll-behavior-y: contain\`.
\- Replaced independently hardcoded header offsets with spacing-token calculations.
\- Corrected the invalid PromptInput wildcard selector by using a valid class attribute selector.
\- Added mobile-specific spacing, action, and layout refinements.

The conversation page now follows this visual structure:

\| Element                      | Token treatment                       |
\| ---------------------------- | ------------------------------------- |
\| Main conversation background | \`--color-background-main\`             |
\| Sticky top bar               | Translucent \`--color-background-main\` |
\| Borders                      | \`--color-border-soft\`                 |
\| Main text                    | \`--color-text-primary\`                |
\| Supporting text              | \`--color-text-muted\`                  |
\| Interactive emphasis         | \`--color-accent-muted-gold\`           |
\| Limited contextual accent    | \`--color-accent-dark-olive\`           |
\| Scroll button                | \`--color-background-charcoal\`         |

**### Message Bubble Design-System Alignment**

\`MessageBubble.module.css\` was aligned with the canonical global design system.

The following improvements were made:

\- Replaced the previous tea-green user bubble with a charcoal user bubble.
\- Updated user-message text to use \`--color-text-inverse\`.
\- Updated AI-message bubbles to use \`--color-surface-card\`.
\- Updated AI-message text to use \`--color-text-secondary\`.
\- Updated bubble borders to use \`--color-border-soft\`.
\- Updated bubble spacing, radii, shadows, and transitions.
\- Updated system-message pills to use the soft background and pill radius.
\- Added explicit text inheritance inside dark user bubbles.
\- Prevented global paragraph styling from turning user-message text dark.
\- Updated links inside user bubbles to use the sand accent.
\- Updated links inside AI messages to use dark olive with muted-gold underlines.
\- Added styling for paragraphs, lists, links, inline code, code blocks, and blockquotes inside AI responses.
\- Updated action buttons to use neutral surfaces and muted-gold focus states.
\- Added \`focus-within\` support so message controls remain visible during keyboard interaction.
\- Updated timestamps to use muted text.
\- Added mobile behavior that keeps message actions visible on touch devices.
\- Improved wrapping for long links, code, and unbroken message content.
\- Added accessible focus states across message actions.

The message treatment is now:

\| Message type      | Visual treatment                      |
\| ----------------- | ------------------------------------- |
\| User message      | Charcoal background with inverse text |
\| AI message        | White card surface with dark text     |
\| System message    | Soft off-white pill                   |
\| User-message link | Sand accent                           |
\| AI-message link   | Dark olive with muted-gold underline  |
\| Code block        | Charcoal background with inverse text |
\| Blockquote        | Muted text with muted-gold border     |

**### CSS Module and Global Variable Architecture**

The frontend styling architecture was clarified and standardized.

The project now follows this relationship:

\`\`\`text
src/app/globals.css
        ↓
Defines global \:root design tokens
        ↓
Component CSS Modules read the variables
        ↓
Header.module.css
Footer.module.css
ConversationView\.module.css
MessageBubble.module.css
PromptInput.module.css
\`\`\`

Implementation rules:

\- Global CSS is loaded once by the Next.js application.
\- Component CSS Modules do not import the global stylesheet.
\- Component folder location does not affect access to \`:root\` variables.
\- CSS custom properties are inherited through the rendered document.
\- Updated components should use canonical variables instead of hardcoded colors.
\- Compatibility aliases remain temporary and should be removed gradually.
\- New components should use canonical tokens directly.

**### Logo Mark Replacement Across Frontend Pages**

The official Chakancha logo mark was expanded beyond the chatbot and applied across additional frontend pages.

The following updates were made:

\- Updated the centralized \`LogoMark\` width so the official mark displays at the correct visual scale.
\- Replaced the previous generic \`Leaf\` icon on the login page.
\- Replaced the previous generic \`Leaf\` icon on the signup page.
\- Replaced the leaf icon used in the product page headline.
\- Replaced the previous generic \`Leaf\` icon on the forgot-password page.
\- Replaced the leaf icon shown in the empty-cart state.
\- Reused the centralized \`LogoMark\` component instead of repeating direct SVG paths across pages.
\- Used the dark mark on light surfaces and the white mark on dark surfaces.
\- Continued using the SVG assets stored under:

\`\`\`text
public/images/icons/
\`\`\`

\- Preserved \`clickable={false}\` where the logo mark is decorative and should not create a nested link.
\- Improved consistency between authentication pages, product pages, and cart states.

The updated logo mark coverage now includes:

\| Location              | Logo mark treatment          |
\| --------------------- | ---------------------------- |
\| Login page            | Official Chakancha logo mark |
\| Signup page           | Official Chakancha logo mark |
\| Product page headline | Official Chakancha logo mark |
\| Forgot-password page  | Official Chakancha logo mark |
\| Empty-cart state      | Official Chakancha logo mark |
\| Chatbot interface     | Official Chakancha logo mark |
\| AI response avatar    | White mark on a dark surface |

**### Product Page Brand-Manual Alignment**

The \`/products\` experience was updated to present Chakancha's current tea range more clearly and consistently with the Brand Manual. The page is now focused on **\*\*Nandi Gold\*\*** and **\*\*Nandi Black\*\***, while recipe and preparation imagery supports the broader product story.

The following page-level changes were made:

\- Updated \`src/app/products/page.jsx\` with a more focused product introduction and brand-aligned layout.
\- Replaced legacy green-and-brown visual treatments with the canonical tokens from \`src/app/globals.css\`.
\- Used the official Chakancha \`LogoMark\` instead of generic tea-leaf decoration where a brand symbol is appropriate.
\- Removed the previous broad catalog language that referred to black, green, purple, and white tea ranges.
\- Simplified the product area so the frontend no longer depends on product-category filter pills or marketplace-style sorting controls.
\- Kept product data connected to the existing Django product API through \`useProducts()\` and \`useProduct()\`.
\- Structured the page around the two active Chakancha products rather than the previous four-product demonstration catalog.

**#### Product Grid Updates**

\`ProductGrid.jsx\` and \`ProductGrid.module.css\` were updated to support the focused two-product range.

The following improvements were made:

\- Removed frontend category filtering and name/price sorting from the product grid.
\- Added a fixed editorial ordering that places Nandi Gold before Nandi Black when matching names or slugs are available.
\- Reduced the loading state from four skeleton products to two.
\- Added dedicated empty and error states.
\- Updated the desktop layout to show two products side by side.
\- Updated tablet and mobile layouts to show one product per row.
\- Replaced inline grid styling with \`ProductGrid.module.css\` classes.
\- Applied canonical spacing, borders, surfaces, radii, shadows, typography, and reduced-motion handling.

The product layout now behaves as follows:

\| Viewport | Product layout |
\| -------- | -------------- |
\| Desktop  | Nandi Gold and Nandi Black side by side |
\| Tablet   | One product per row |
\| Mobile   | One compact product card per row |

**#### Product Card Updates**

\`ProductCard.jsx\` and \`ProductCard.module.css\` were redesigned from marketplace-style tiles into focused editorial product cards.

The following changes were made:

\- Added product numbering for the two-product presentation.
\- Displayed the product name, short description, price, detail link, package image, and cart action.
\- Removed category labels, caffeine color coding, quick-view overlays, featured badges, and compact tasting-note chips from the catalog card.
\- Replaced the generic leaf-emoji fallback with the official Chakancha logo mark.
\- Added support for image values returned as strings or image objects.
\- Added support for \`image\`, \`primaryImage\`, \`primary\_image\`, and \`images\` fields.
\- Replaced the fully clickable article pattern with proper product links and a separate add-to-cart button.
\- Preserved the existing cart-store integration and success notification behavior.
\- Updated product images to use \`object-fit: contain\` so package artwork is not cropped.
\- Updated purchase buttons to use the approved dark background and muted-gold interaction treatment.

**#### Product Detail Updates**

\`ProductDetail.jsx\` and \`ProductDetail.module.css\` were aligned with the product-card treatment and the global design system.

The following improvements were made:

\- Improved normalization of backend product images returned as URL strings or objects.
\- Added primary-image fallback support through \`image\`, \`primaryImage\`, and \`primary\_image\`.
\- Removed the unused \`sendMessage\` store selector.
\- Preserved support for camelCase and snake\_case product fields.
\- Changed certification display so the interface shows the actual certification value instead of automatically labeling every certification as living-wage verification.
\- Added optional support for an explicit \`livingWageVerified\` or \`living\_wage\_verified\` field.
\- Removed the hardcoded shipping-note claim and now displays a note only when product data provides one.
\- Improved quantity controls, disabled states, cart wording, wishlist interaction, and keyboard focus treatment.
\- Updated the product-specific AI prompt to ask about the tea, brewing guidance, and relevant recipes.
\- Updated page layout, pricing, buttons, borders, surfaces, and responsive behavior using canonical design tokens.

**#### Brewing Guide Updates**

\`BrewingGuide.jsx\` was refined while preserving its backend compatibility.

The following changes were made:

\- Continued supporting both camelCase and snake\_case brewing fields.
\- Replaced the decorative leaf heading icon with the official Chakancha logo mark.
\- Replaced the tea-amount leaf icon with the functional \`Scale\` icon.
\- Added accessible expanded/collapsed attributes.
\- Updated brewing cards to use neutral surfaces, soft borders, dark text, and limited muted-gold or dark-olive emphasis.
\- Preserved dynamic temperature, steeping time, tea amount, and resteep values from each product record.

**#### Product and Origin Image Assets**

The following product assets were added:

\`\`\`text
public/images/products/ColdMilkTea.png
public/images/products/HotMilkTea.png
public/images/products/HotStaightBlackTea.png
public/images/products/IcedStraightBlackTea.png
public/images/products/NandiBlackLeaves.png
public/images/products/NandiBlackPackage.svg
public/images/products/NandiGoldLeaves.png
public/images/products/NandiGoldPackage.svg
public/images/products/landImg.svg
public/images/products/originHero2.svg
public/images/products/peopleImg.svg
\`\`\`

The following origin assets were added:

\`\`\`text
public/images/origin/landImg.svg
public/images/origin/originHero2.svg
public/images/origin/peopleImg.svg
\`\`\`

The following previous demonstration-product images were removed:

\`\`\`text
public/images/products/green-tea-1.png
public/images/products/purple-tea-1.png
public/images/products/white-tea-1.png
\`\`\`

Product-image relationships remain controlled by the Django product data. Image URLs can be entered through the Django Admin product-image inline and returned through the product serializers to \`ProductCard\`, \`ProductDetail\`, and the product gallery.


**### Product Image Pipeline and Gallery Fix**

The frontend product API normalization was strengthened so product cards can continue using a single primary package image while product-detail pages retain the complete backend image gallery.

The following updates were made:

- Updated `src/lib/api/products.js` so `normalizeProduct()` preserves the full `raw.images` array returned by the Django API.
- Added consistent normalization for image objects returned with `url`, `alt_text`, `is_primary`, and `sort_order`.
- Added primary-image fallback logic that derives the primary product image from `raw.images` when `primary_image`, `image`, or `thumbnail` is not provided directly by the backend.
- Continued resolving full `https://` image URLs as-is.
- Continued resolving frontend `/images/...` assets against `NEXT_PUBLIC_SITE_URL`.
- Continued resolving backend media paths against `NEXT_PUBLIC_API_URL`.
- Kept the product-card behavior focused on the primary package image.
- Preserved all secondary images for the product-detail gallery.
- Ensured the product-detail flow can receive package, tea-leaf, brewed-tea, and other supporting product images without collapsing the response to only the primary image.

The intended product-image flow is now:

```text
Django / Railway product API
        ↓
raw.images[]
        ↓
normalizeProduct()
        ↓
primary image → ProductCard
full images[] → ProductDetail → ProductGallery
```

This separation keeps the catalog visually clean while allowing each product detail page to display its complete image set.

**### Product Page Brand Mark Cleanup**

Additional product-page brand cleanup was completed to remove generic leafy decoration and use the real Chakancha identity instead.

The following changes were made:

- Removed decorative leafy imagery from the product-page presentation where it was being used as a generic brand cue.
- Replaced the generic leaf treatment with the centralized `LogoMark` component.
- Kept the official Chakancha mark decorative where appropriate by using `clickable={false}`.
- Continued using the dark Chakancha mark on light product surfaces.
- Standardized product-page logo usage around:

```jsx
import { LogoMark } from "@/components/common/Logo";
```

This keeps the product experience consistent with the chatbot, authentication, cart, checkout, and other brand-aligned frontend surfaces.

**### Files Updated in This Pass**

The current frontend pass includes updates to:

```text
src/app/chat/page.jsx
src/app/checkout/success/page.jsx
src/app/products/[slug]/page.jsx
src/app/products/page.jsx
src/lib/api/products.js
```

The product-related changes in this pass focus on brand-mark consistency, production-safe logo usage, and preserving the complete product image gallery returned by the Railway backend.


**### Error Fixes**

**#### Missing Dark Logo Error**

Resolved the \`404\` error for:

\`\`\`text
/images/icons/chakancha-lockup-dark.svg
\`\`\`

The logo filename was corrected so that the browser path matches the asset inside the public images directory.

**#### React Hydration Errors**

Resolved React hydration errors \`#418\` and \`#423\`.

The issue was caused by a clickable logo component being rendered inside an existing navigation link, which created nested anchor elements.

The mobile logo was updated to disable its internal clickable behavior when it is already wrapped by the navigation link.

**#### Global Stylesheet Conflict**

Identified two separate global CSS files in the frontend.

The active stylesheet was confirmed as:

\`\`\`text
src/app/globals.css
\`\`\`

The styling architecture was updated so this file controls the global design tokens used by the footer, header, chatbot, conversation view, and message bubbles.

This prevents the legacy green-and-brown token system from overriding the Brand Manual palette.

**#### Production Build Import Resolution**

Resolved a production build failure caused by an invalid import path for the centralized Chakancha logo component.

The affected files were importing the logo with an incorrect alias and filename casing:

\`\`\`jsx
import { LogoMark } from "@components/common/logo";
\`\`\`

The import was corrected to the project alias and the exact case-sensitive component filename:

\`\`\`jsx
import { LogoMark } from "@/components/common/Logo";
\`\`\`

The following improvements were made:

\- Added the missing \`/\` after the \`@\` path alias.
\- Updated \`logo\` to \`Logo\` so the import matches \`src/components/common/Logo.jsx\`.
\- Corrected the import in the affected authentication routes, including the verify-email and forgot-password pages.
\- Removed the \`Module not found: Can't resolve '@components/common/logo'\` error that was blocking the optimized Next.js production build.
\- Standardized logo imports so development and production environments resolve the same component path consistently.

Build validation command:

\`\`\`bash
npm run build
\`\`\`


**### Result**

- Product cards continue to use the primary package image while product-detail pages retain the full backend image gallery.
- Product image normalization now derives a primary image from `images[]` when the backend does not expose a separate `primary_image` field.
- Generic leafy product-page decoration has been replaced with the official Chakancha logo mark.


The frontend now provides:

\- A product page aligned with the Chakancha Brand Manual.
\- A focused two-product presentation for Nandi Gold and Nandi Black.
\- Brand-aligned product cards, product details, brewing guidance, and responsive product-grid states.
\- Updated product, preparation, and origin image assets.
\- Removal of obsolete green, purple, and white demonstration-product imagery.

\- Correctly scaled Chakancha logo marks across authentication, product, and cart interfaces.
\- Replaced remaining generic leaf icons on login, signup, product headline, forgot-password, and empty-cart views.

\- Smoother hero transitions.
\- More consistent Chakancha branding.
\- Official Chakancha marks throughout the chatbot interface.
\- Improved logo and icon reliability.
\- A standardized transparent SVG logo workflow.
\- Dark and light logo treatments for different surfaces.
\- Brand-manual-aligned clear space around the header logo.
\- Cleaner header navigation.
\- A dark, structured, brand-aligned footer.
\- Footer colors controlled through the global design system.
\- Preserved desktop and mobile footer margins.
\- Better chatbot input readability.
\- Separate visual treatments for hero and conversation inputs.
\- A consolidated global design-token system.
\- Canonical colors, typography, spacing, radii, shadows, transitions, and z-index values.
\- Temporary compatibility aliases for older components.
\- A conversation interface aligned with the Brand Manual.
\- Charcoal user-message bubbles with readable inverse text.
\- Neutral AI-message cards with improved rich-text formatting.
\- Improved keyboard, focus, hover, and mobile interaction states.
\- Clearer CSS Module and global-variable architecture.
\- Fewer hydration, styling, and asset-loading errors.