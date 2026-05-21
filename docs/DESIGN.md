# SurplusLink — UI/UX Design Document
**Theme:** Minimalistic Black & White
**Frameworks:** Next.js, Tailwind CSS, shadcn/ui

## 1. Design Philosophy
The design language for SurplusLink is strictly **Minimalistic Black and White**. The goal is to create a premium, no-nonsense interface that prioritizes content (surplus lots and data) over flashy UI elements. 
- **High Contrast:** Rely on stark black and white contrasts for readability and focus.
- **Whitespace:** Generous use of negative space to reduce cognitive load and create a clean aesthetic.
- **Utilitarian Elegance:** UI elements should look functional but refined, avoiding unnecessary shadows, gradients, or heavy rounded corners (opting for sharp or slightly rounded edges).

## 2. Color Palette
To maintain the monochromatic theme, we will use a strict grayscale palette:
- **Background (Base):** `#FFFFFF` (Pure White)
- **Background (Subtle/Surface):** `#F9F9F9` (Off-white for slight separation, used sparingly)
- **Text (Primary):** `#000000` (Pure Black)
- **Text (Secondary):** `#666666` (Medium Gray for descriptions, metadata, placeholders)
- **Borders & Dividers:** `#E5E5E5` (Light Gray)
- **Primary Action (Buttons, active states):** Background `#000000`, Text `#FFFFFF`
- **Secondary Action:** Background `#FFFFFF`, Border `#000000`, Text `#000000`

### Status Indicators (Grayscale Approach)
Instead of using traditional green/red/yellow, status will be communicated via typography, borders, and iconography to maintain the minimal B&W aesthetic:
- `draft`: Light gray text, no border.
- `pending_review`: Dashed gray border, gray text.
- `approved`: Solid black border, black text.
- `assigned`: Solid black background, white text.
- `sold`: Strikethrough text or light gray background with dark gray text.
- `expired`: Muted gray text, diagonal line pattern or opaque overlay.

## 3. Typography
- **Primary Font:** `Inter` or `Geist` (Modern, clean, sans-serif).
- **Scale:**
  - **H1 (Page Titles):** 32px, Bold, tracking-tight.
  - **H2 (Section Headers):** 24px, Semi-bold.
  - **Body (Main Text):** 16px, Regular, 1.5 line height.
  - **Small (Metadata, Labels):** 14px or 12px, Medium weight.
- **Styling:** Strict adherence to font weights to establish hierarchy, rather than using colors.

## 4. Core UI Components (shadcn/ui overrides)
- **Buttons:** Sharp corners (or very small radius `rounded-sm`). Primary buttons are solid black. Hover state shifts to `#333333`.
- **Inputs/Forms:** 1px solid light gray border (`border-gray-200`). On focus, the border turns solid black (`border-black`) with zero outline rings. Clean, floating or top-aligned labels.
- **Cards (Lot Listings):** Flat design. **No drop shadows.** 1px solid border (`border-gray-200`).
- **Modals/Dialogs:** Pure white background, thin black border, stark black overlay with 50% opacity (`bg-black/50`).
- **Badges:** Pill-shaped, monochromatic, adhering to the status indicators defined above.

## 5. Key Screen Layouts & Flows

### 5.1 Onboarding & Authentication
- **Layout:** Centered single-column form on a pure white background.
- **Visuals:** Large, bold typography for the SurplusLink logo/name. Minimalist input fields. 
- **Role Selection:** Presented as distinct, clickable, bordered cards. Active selection turns the border black and increases border width to 2px.

### 5.2 Dashboards (Supplier / Buyer / Agent / Admin)
- **Navigation:** Top navigation bar (1px bottom border) featuring the logo on the left and user profile/logout on the right. No complex sidebars to keep the UI open.
- **Layout:** A clean grid (for lots) or a structured, unlined table (for admin pending users/lots).
- **Filters/Search:** Minimalist search bar with a simple magnifying glass icon. Filter chips that turn black when active, white when inactive.

### 5.3 Lot Listing Card (Feed)
- **Image:** Full-color images are allowed, but they are framed with a 1px light gray border to fit the aesthetic. If no image exists, a minimalist gray pattern or logo placeholder is used.
- **Content:** Title in bold black. Quantity, unit, and location (full address) in secondary gray. 
- **Badges:** Minimalist status badges in the top right corner of the card.

### 5.4 Admin Review Panel
- **Layout:** Two-column split view. The left side shows a scrollable queue of pending lots/users. The right side displays full details of the selected item.
- **Actions:** Large, stark "Approve" (Solid Black) and "Reject" (White with Black border) buttons prominently displayed at the bottom of the detail view.

## 6. Interactions & Micro-animations
- **Hover States:** Text links get a simple black underline. Cards get a slightly darker border (`border-gray-400`) on hover.
- **Transitions:** Fast and crisp (`duration-150 ease-in-out`). No bouncy spring animations; interactions should feel intentional and mechanical.
- **Loading States:** Minimalist light gray skeleton loaders or a simple thin black loading bar at the top of the page. No spinning colorful circles.

## 7. Data Representation Alignment (From PRD/TDD)
- **Forms:** Registration fields (e.g., full address, tax ID) will be split into logical steps or grouped cleanly with ample vertical spacing to prevent visual clutter.
- **Empty States:** When a buyer/agent has no assigned lots, display a simple, centered message in gray text ("No lots assigned yet.") without playful illustrations.
