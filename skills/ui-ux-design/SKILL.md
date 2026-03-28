---
name: ui-ux-design
description: User interface and user experience design with mobile-first approach, cognitive simplicity, and accessibility-first principles
author: StrRay Framework
version: 2.1.0
tags: [design, ui, ux, accessibility, mobile-first, visual-hierarchy, wcag, contrast, color-theory, dont-make-me-think]

mcp:
  ui-ux-design:
    command: node
    args: [node_modules/strray-ai/dist/mcps/knowledge-skills/ui-ux-design.server.js]
---

# UI/UX Design Skill v2.1.0

Professional user interface and user experience design with mobile-first approach, cognitive simplicity, rigorous accessibility compliance, and color contrast validation.

## Core Philosophy: "Don't Make Me Think"

**Every design decision must reduce cognitive load.** If users have to think about how to use your interface, you've failed.

### Key Principles from Steve Krug:
1. **Eliminate question marks** - Users shouldn't wonder what to do
2. **Omit needless words** - Cut copy in half, then half again
3. **Create clear visual hierarchies** - Size, color, placement = importance
4. **Make clickable things obvious** - Buttons should look like buttons
5. **Reduce noise** - Every element competes for attention

---

## Design Philosophy

### 1. Mobile-First Design (Mandatory)

**Design for mobile first, then enhance for desktop.**

#### Mobile-First Principles:
```
✅ START: 320px viewport (iPhone SE)
✅ PROGRESSIVE ENHANCEMENT: Add complexity as screen grows
❌ NEVER: Design desktop then "squeeze" to mobile
```

#### Mobile Design Constraints (Embrace Them):
| Constraint | Solution |
|------------|----------|
| Small screen (320-428px) | Single column, vertical stack |
| Touch targets (44px min) | Larger buttons, generous spacing |
| Limited attention | One primary action per screen |
| Slow connections | Optimize images, lazy loading |
| Fat fingers | 48px minimum touch targets |

#### Mobile Typography Scale:
```css
/* Mobile Base */
html { font-size: 16px; }

h1 { font-size: 2rem; line-height: 1.2; }      /* 32px */
h2 { font-size: 1.75rem; line-height: 1.3; }  /* 28px */
h3 { font-size: 1.5rem; line-height: 1.4; }   /* 24px */
body { font-size: 1rem; line-height: 1.5; }   /* 16px */
small { font-size: 0.875rem; }                /* 14px */

/* Desktop Enhancement (min-width: 768px) */
@media (min-width: 768px) {
  h1 { font-size: 3rem; }    /* 48px */
  h2 { font-size: 2.5rem; }  /* 40px */
}
```

#### Mobile Navigation Patterns:
- **Hamburger menu** with clear label "Menu"
- **Bottom navigation** for primary actions (thumb zone)
- **Swipe gestures** for carousels/galleries
- **Pull-to-refresh** for lists
- **Sticky CTA** at bottom for conversion

### 2. Visual Hierarchy (The 3-Second Rule)

**Users should understand the page purpose in 3 seconds.**

#### Hierarchy Levels:
```
Level 1 (Most Important):
- Page title/hero headline
- Primary CTA
- Critical alerts

Level 2 (Important):
- Section headings
- Supporting text
- Secondary CTAs

Level 3 (Supporting):
- Body text
- Metadata
- Footer links
```

#### Visual Hierarchy Techniques:

**1. Size & Scale:**
```css
/* Hero headline must dominate */
.hero h1 { 
  font-size: 3rem;        /* 3x body size */
  font-weight: 700;
  margin-bottom: 1rem;
}

/* Supporting text subordinate */
.hero p {
  font-size: 1.125rem;    /* Slightly larger than body */
  color: #6b7280;         /* Muted color */
}
```

**2. Color & Contrast:**
- High contrast = High importance
- Muted colors = Secondary information
- Accent color = Only for CTAs and key actions

**3. Spacing & Proximity:**
```css
/* Related items close together */
.card-content { padding: 1.5rem; }

/* Unrelated items separated */
.section { margin-bottom: 4rem; }

/* White space = breathing room */
.hero { padding: 6rem 0; }
```

**4. Typography Weight:**
```css
/* Bold for headlines only */
h1, h2 { font-weight: 700; }

/* Regular for body */
p { font-weight: 400; }

/* Medium for emphasis */
strong { font-weight: 600; }
```

### 3. Image Strategy & Libraries

**Every image must serve a purpose.** Decorative images are waste.

#### Image Requirements Checklist:
- [ ] Supports the content message
- [ ] High quality (not pixelated)
- [ ] Optimized for web (< 200KB ideally)
- [ ] Alt text for accessibility
- [ ] Responsive srcset
- [ ] Lazy loaded below fold

#### Recommended Image Libraries:

**Stock Photography (High Quality):**
1. **Unsplash** (unsplash.com) - Free, high-quality, diverse
2. **Pexels** (pexels.com) - Free, good variety
3. **Pixabay** (pixabay.com) - Free, includes illustrations
4. **Shutterstock** - Premium, extensive catalog
5. **Getty Images** - Premium, editorial quality

**Illustrations & Graphics:**
1. **unDraw** (undraw.co) - Free, customizable color
2. **Blush** (blush.design) - Customizable illustrations
3. **Humaaans** - Mix-and-match people illustrations
4. **Open Peeps** - Hand-drawn characters
5. **Heroicons** - Icons (SVG)

**Icons:**
1. **Lucide** (lucide.dev) - Clean, modern icons
2. **Phosphor Icons** - Flexible weight system
3. **Font Awesome** - Extensive library
4. **Tabler Icons** - Free, consistent style

**Image Generation (AI):**
1. **Midjourney** - Artistic, high-quality
2. **DALL-E 3** - Photorealistic options
3. **Stable Diffusion** - Open source, customizable

#### Image Best Practices:

**Hero Images:**
```css
/* Full-width hero with overlay for text readability */
.hero {
  background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)),
              url('hero-image.jpg');
  background-size: cover;
  background-position: center;
}
```

**Responsive Images:**
```html
<img src="image-800.jpg"
     srcset="image-400.jpg 400w,
             image-800.jpg 800w,
             image-1200.jpg 1200w"
     sizes="(max-width: 600px) 400px,
            (max-width: 1000px) 800px,
            1200px"
     alt="Descriptive text"
     loading="lazy">
```

**Image Formats:**
- **Photos:** WebP (with JPEG fallback)
- **Icons:** SVG
- **Simple graphics:** SVG or PNG-8
- **Complex illustrations:** WebP

### 4. Cognitive Load Reduction

**Make decisions effortless.**

#### Hick's Law (Decision Time):
```
More options = More time to decide

✅ GOOD: 3-5 navigation items
❌ BAD: 20-item dropdown menu

✅ GOOD: Single primary CTA
❌ BAD: 5 competing buttons
```

#### Jakob's Law (Familiarity):
```
Users spend 90% of time on OTHER sites.

✅ Follow conventions:
   - Logo top-left, links to home
   - Search icon = magnifying glass
   - Hamburger icon = menu
   - Shopping cart top-right

❌ Don't innovate for innovation's sake
```

#### Progressive Disclosure:
```
Show only what's needed, when needed.

✅ Primary actions visible
✅ Secondary actions in menu
✅ Advanced options in "More" dropdown
✅ Details in expandable sections
```

#### The Magical Number Seven:
```
Humans can hold 7±2 items in working memory.

Navigation: Max 7 items
Form fields: Group in 5-9 chunks
Features: Highlight 3-7 benefits
```

### 5. Accessibility-First Design
- **WCAG 2.1 AA Compliance** is mandatory, not optional
- All designs must pass automated accessibility checks
- Color contrast is validated before any design is approved

### 2. Hero Section Contrast Rules

**CRITICAL: Hero sections with background images/colors MUST meet these requirements:**

#### Background + Text Contrast
```
✅ LIGHT BACKGROUND → DARK TEXT (black, dark gray, navy)
   - Background: #ffffff, #f8f9fa, light gradients
   - Text: #000000, #212529, #1a1a2e
   - Minimum contrast ratio: 4.5:1 (AA), 7:1 (AAA)

✅ DARK BACKGROUND → LIGHT TEXT (white, off-white)
   - Background: #000000, #1a1a2e, dark gradients, dark images
   - Text: #ffffff, #f8f9fa, #e9ecef
   - Minimum contrast ratio: 4.5:1 (AA), 7:1 (AAA)

❌ NEVER: Light background + light text
❌ NEVER: Dark background + dark text
❌ NEVER: Busy image background without text shadow/overlay
```

#### Hero Section Text Overlay Rules
1. **Always use text shadow for image backgrounds:**
   ```css
   text-shadow: 0 2px 4px rgba(0,0,0,0.5);
   ```

2. **Or use semi-transparent overlay:**
   ```css
   background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('hero.jpg');
   ```

3. **Check contrast in multiple viewport sizes**

### 3. Color Contrast Standards

**Text Contrast Requirements (WCAG 2.1):**
| Text Type | Normal Size | Large Scale (18pt+/14pt bold) |
|-----------|-------------|-------------------------------|
| AA Level | 4.5:1 | 3:1 |
| AAA Level | 7:1 | 4.5:1 |

**UI Component Contrast:**
- Buttons: 3:1 minimum against adjacent colors
- Form borders: 3:1 against background
- Focus indicators: 3:1 against all backgrounds

### 4. Pre-Approved Accessible Color Combinations

**Hero Section Palettes:**

**Option 1: Dark Hero (Recommended)**
```
Background: #0f172a (dark slate)
Text: #ffffff (white)
Accent: #3b82f6 (blue)
Contrast Ratio: 15.8:1 ✅
```

**Option 2: Light Hero**
```
Background: #f8fafc (light gray)
Text: #0f172a (dark slate)
Accent: #2563eb (blue)
Contrast Ratio: 12.4:1 ✅
```

**Option 3: Gradient Hero**
```
Background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
Text: #ffffff with text-shadow
Contrast Ratio: 4.8:1 (with shadow) ✅
```

**NEVER USE:**
- Yellow text on white background (1.2:1) ❌
- Light gray text on white (2.3:1) ❌
- White text on busy images without overlay ❌
- Pure black (#000) on pure white for large text blocks (causes eye strain) ❌

### 5. Landing Page Design Principles

#### Hero Section Structure
```
┌─────────────────────────────────────────────┐
│  [NAVIGATION - high contrast]               │
├─────────────────────────────────────────────┤
│                                             │
│  HEADLINE (H1)                              │
│  - Max 2 lines                              │
│  - High contrast with background            │
│  - Font size: 48-72px desktop               │
│                                             │
│  Subheadline                                │
│  - 1-2 sentences                            │
│  - Same contrast as headline                │
│                                             │
│  [CTA BUTTON - high contrast]               │
│                                             │
└─────────────────────────────────────────────┘
```

#### Design Validation Checklist

**Visual Hierarchy:**
- [ ] 3-second rule: Purpose clear immediately
- [ ] Clear heading hierarchy (H1 → H2 → H3)
- [ ] One primary action per screen
- [ ] Secondary actions visually subordinate
- [ ] Adequate white space (breathing room)

**Mobile-First:**
- [ ] Designed for 320px viewport first
- [ ] Touch targets ≥ 48px
- [ ] Readable without zoom (16px minimum)
- [ ] No horizontal scroll
- [ ] Sticky CTA for mobile conversion
- [ ] Responsive images with srcset

**Accessibility & Contrast:**
- [ ] Background color defined
- [ ] Text color defined
- [ ] Contrast ratio calculated and ≥ 4.5:1
- [ ] Image backgrounds have overlay or text shadow
- [ ] CTA button contrasts with hero background
- [ ] Mobile viewport contrast verified
- [ ] Alt text for all images

**Cognitive Load:**
- [ ] No more than 7 navigation items
- [ ] Progressive disclosure used
- [ ] Eliminated unnecessary words
- [ ] Clear labels (no cryptic icons)
- [ ] Error prevention in forms

**Image Strategy:**
- [ ] Images from approved libraries
- [ ] Optimized for web (< 200KB)
- [ ] Alt text describes purpose
- [ ] Lazy loaded below fold
- [ ] Responsive sizing

### 6. Tools Available

#### validate_mobile_design ⭐ NEW
Mobile-first design validation:
- Touch target size verification (48px minimum)
- Viewport breakpoint analysis
- Mobile typography scale check
- Thumb zone optimization
- Mobile navigation pattern validation

#### analyze_visual_hierarchy ⭐ NEW
Visual hierarchy and cognitive load analysis:
- 3-second comprehension test
- Heading structure validation
- F-pattern and Z-pattern compliance
- Cognitive load scoring
- "Don't Make Me Think" principles check

#### recommend_images ⭐ NEW
Image strategy and library recommendations:
- Stock photo library suggestions
- Illustration style matching
- Icon set recommendations
- Image optimization requirements
- Alt text generation guidance

#### analyze_ui_component

#### analyze_ui_component
Deep component analysis with accessibility validation:
- Color contrast calculation
- WCAG compliance checking
- Hero section validation
- Landing page pattern analysis

#### design_component
Accessible-first component design:
- Enforces contrast requirements
- Validates color combinations
- Generates accessible markup

#### audit_accessibility
Comprehensive WCAG audit:
- Automated contrast checking
- Screen reader compatibility
- Keyboard navigation validation

#### generate_design_system
Complete accessible design system:
- Pre-validated color palettes
- Typography with contrast ratios
- Accessible component library

#### analyze_hero_contrast ⭐ NEW
Specific hero section analysis:
- Background + text contrast validation
- Image overlay recommendations
- Mobile/desktop contrast check
- Gradient accessibility analysis

### 7. Design Patterns Library

**Landing Page Hero Patterns:**

**Pattern 1: Single Color Background**
```css
.hero {
  background-color: #1e293b;
  color: #ffffff;
}
/* Contrast: 12.6:1 ✅ */
```

**Pattern 2: Image with Overlay**
```css
.hero {
  background: 
    linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)),
    url('hero-image.jpg');
  color: #ffffff;
}
/* Contrast: 8.2:1 with overlay ✅ */
```

**Pattern 3: Gradient Background**
```css
.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}
/* Contrast: 4.8:1 ✅ */
```

### 8. Common Contrast Failures & Solutions

**Failure 1: White Text on Light Gray**
```css
/* ❌ BAD: 2.8:1 contrast */
.hero { background: #e5e7eb; color: #ffffff; }

/* ✅ GOOD: 12.4:1 contrast */
.hero { background: #e5e7eb; color: #1f2937; }
```

**Failure 2: Text on Busy Image**
```css
/* ❌ BAD: Unreadable on complex backgrounds */
.hero { background-image: url('busy-photo.jpg'); color: #ffffff; }

/* ✅ GOOD: Overlay for readability */
.hero {
  background: 
    linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)),
    url('busy-photo.jpg');
  color: #ffffff;
}
```

**Failure 3: Light Gray on White**
```css
/* ❌ BAD: 2.3:1 contrast */
.hero { background: #ffffff; color: #9ca3af; }

/* ✅ GOOD: 7.5:1 contrast */
.hero { background: #ffffff; color: #374151; }
```

### 9. Contrast Calculation Reference

**Luminance Formula (WCAG):**
```
L = 0.2126 * R + 0.7152 * G + 0.0722 * B
Contrast Ratio = (L1 + 0.05) / (L2 + 0.05)
```

**Quick Contrast Guide:**
- White (#fff) on Black (#000): 21:1 ✅
- White (#fff) on Dark Gray (#333): 12.6:1 ✅
- White (#fff) on Medium Gray (#666): 5.7:1 ✅
- Black (#000) on White (#fff): 21:1 ✅
- Dark Gray (#333) on Light Gray (#ddd): 7.8:1 ✅
- Light Gray (#999) on White (#fff): 2.8:1 ❌

### 10. Integration Notes

This skill automatically validates:
1. All color combinations meet WCAG AA standards
2. Hero sections have proper text contrast
3. Landing pages follow accessibility patterns
4. Design tokens include contrast ratios

**When designing landing pages:**
1. Always call `analyze_hero_contrast` before finalizing
2. Verify contrast on both desktop and mobile
3. Test with actual content (not just lorem ipsum)
4. Validate CTA button visibility

---

## Usage Examples

**Example 1: Design Hero Section**
```
Use ui-ux-design skill to:
1. Generate hero section with dark blue background (#1e3a5f)
2. Ensure white text has 4.5:1+ contrast
3. Add CTA button with proper contrast
4. Validate mobile accessibility
```

**Example 2: Audit Landing Page**
```
Use ui-ux-design skill to:
1. Analyze hero section contrast
2. Check all text/background combinations
3. Validate image overlay requirements
4. Generate accessibility report
```

---

**Version:** 2.0.0  
**Last Updated:** 2026-02-18  
**WCAG Version:** 2.1 Level AA
