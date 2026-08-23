# Walkthrough - Cart Update & Checkout Refinements

Successfully completed the implementation of dynamic cart updates, unified checkout calculations, order summary refinements, and order card layout improvements.

## Changes Made

### 1. Dynamic Pricing & Cart Updates
- **`ProductDetail.tsx`**: Updated pricing cards to dynamically calculate totals based on user-selected quantities. Added state tracker that loads cart details, switches CTA to `"Update Cart"` if item is already in cart, and triggers a `/api/cart/update` request.
- **`PaymentOptionModal.tsx`**: Added similar cart state hook. Dynamically multiplies prices by quantity inside option columns, filters out redundant MRP/Discount fields, changes action button to `"Update Cart"` when item already exists, and hits update endpoint.
- **`Products.tsx`, `BestSellingTools.tsx`, `AllProducts.tsx`, `FeaturedProducts.tsx`**: Configured product card buttons to dynamically change label to `"Update Cart"` if a user has that item in their cart.

### 2. Checkout Calculation & Summary Fixes
- **`Cart.tsx`**: 
  - Wrapped cart item images and titles in Next.js `Link` components to direct users to the product details page (`/products/view_product?item_code=...`) so they can easily alter quantities and configurations.
  - Removed `"Delivery: FREE"` row from order summary to prevent confusion with the checkout page details.
- **`Checkout.tsx`**: 
  - Net discount logic implemented to prevent overlap (base discount shown is net of coupon discount: `discount_amount - coupen_discount`).
  - Added savings banner tag (`🎁 You'll save ₹X on this order!`) at the bottom of the Cash on Delivery booking option card and directly above the place order button in the checkout summary.
  - Refactored the Checkout payment mode cards copy, labels, and styles:
    - **Full Payment Card**: Added `"POPULAR"` RECOMMENDED badge, changed description to `"Pay complete amount now"`, updated M.R.P. list view to use `"Order Total"` (decorated with a line-through strikeout style to look erased), and instant discount to use `"Instant Discount"` and `"Promo Discount"` split dynamically if a coupon is active.
    - **Book Now & Pay On Delivery Card**: Renamed card title to `"Book Now & Pay On Delivery"`, updated description to `"Confirm your order instantly"`, changed subtotal list view to show `"Order Total"` (decorated with a line-through strikeout style to look erased), and added a new calculated `"Effective Total"` row along with split `"Instant Discount"` and `"Promo Discount"` rows.
  - Renamed right-side Order Summary breakdown keys:
    - `"Subtotal"` -> `"Total"`
    - `"Delivery"` -> `"Delivery Charges"`
    - `"Discount"` -> `"Discount (₹ X Off)"`
    - `"Coupon Discount"` -> `"Coupon Discount (₹ Y Off)"`
    - `"Pay Now"` -> `"Payable Amount"`

### 3. Order List Financial Cards & Badges
- **`order_list.tsx`**:
  - Restructured the actions so that Cash on Delivery orders only permit paying the booking deposit online (paying the pending COD balance online is disabled to avoid transporter collection conflicts).
  - Configured **`UNSETTLED AMOUNT`** to always show on the financial card (defaulting to `₹0.00` if the value is zero, null, or empty).
  - Updated the payment type badge so that if it is a COD order and the booking deposit has been paid, it dynamically changes from `"Book Now (COD)"` to `"Booked (COD)"`.
  - Standardized all financial numbers in the order cards to be GBRU theme green (`#0D9740`) for UI consistency.
  - Corrected the Payments shortcut card redirection to point directly to `/payments`.
- **`order_details.tsx`**:
  - Applied the same payAmount restriction for COD orders and updated the CTA label to `"Pay Booking Deposit"`.
  - Fixed variable mapping discrepancies (fallback to check both `order_summary` and parent `order` details object) to resolve `₹0` values. Map to `summary.received` if `summary.received_amount` is not present, and fallback to calculating `pending_amount` dynamically via `total_amount - received_amount`.
  - Configured layout to hide the pay CTA button for COD orders once the booking deposit is paid (ensures pending amount cannot be paid online).
  - Merged list-level order information (like `payupreferedmode` and `payupreferedamount` from `/api/orders` list response) into details state in `order_details.tsx` to ensure proper fallback value detection for variables.
  - Replicated Mobile App UI for Invoices: Collapsible accordion panels with full print buttons, inline "Track Order" trigger buttons loading details dynamically per package card, detailed package status badges, and expandable LR/Stickers cards inline.
  - Rendered a custom Warning Banner alert notice at the top of the order details view if a custom `paynow_message` is returned by the ERP method.
  - Enabled unconditional display of the **Print LR** button for all package/sticker entries containing a `print_url` or fallback `document_url` property.
  - Restricted **Track Order** button and package cards visibility inside the invoice layout to ONLY display when the transporter is `"Indian Post"`.
  - Removed duplicate/redundant "Track Order" and "Print LR" buttons from the summary card on the left side of the order details.
  - Removed redundant "Indian Post Stickers" card container from the left column of the order details.
  - Wired product image thumbnails (`item.image`) into the shipment items list view.
  - Formatted all financial row numbers to GBRU theme green (`#0D9740`).

### 4. User Profile & Address management
- **`UserProfile.tsx`**:
  - Reconfigured the **Addresses** shortcut card click handler. Clicking it now smoothly scrolls down to the **Saved Addresses** section where users can view their saved addresses and perform operations like add, edit (update), delete, or make primary.
  - Made the **Order Summary** block (Pending, Delivered, Cancelled counts) and **Payment Info** card (Full Payment, Booking counts) fully dynamic by fetching orders from `/api/orders` in real time.
  - Linked each Order Summary status card directly to the `/orders` list route.

### 5. WhatsApp Support Redirects
- **`ProductDetail.tsx`**: Standardized the WhatsApp support link redirect format to `https://wa.me/919226514174` for robust desktop and mobile redirection.

### 6. Meta Favicon Customization
- **`layout.tsx`**: Configured custom metadata icons parameter referencing `/assets/gbru_green.png` to replace the default Next.js tab icon.

### 7. Footer Layout
- **`Footer.tsx`**: Added margin-top to the footer element to create visual separation from parent section items.

### 8. Categories API Update
- **`app/api/categories/route.ts`**: Updated the target ERP API method called on backend from `shoption_api.erp_api.category_api.get_categories` to `shoption_api.gbru_shoption.item_api.get_gbru_categories`.

### 9. Help Centre Nova Avatar
- **`components/HelpCentre.tsx`**: Replaced the default WhatsApp logo inside the "Talk to Shoption NOVA" sidebar with the custom `nova.jpeg` avatar image.

### 10. Similar Items Slider
- **`app/api/products/similar/route.ts`** [NEW]: Created backend API endpoint to call `shoption_api.gbru_shoption.item_api.get_gbru_similar_items`.
- **`components/ProductDetail.tsx`**: Integrated the new similar products API, filtering out the currently viewed product, and rendered a premium responsive layout grid below the tab info section.

### 11. Added to Cart Recommendations Modal
- **`app/api/products/popular/route.ts`** [NEW]: Created API handler for `shoption_api.erp_api.utility.get_popular_items`. Added force-dynamic export to fully disable Next.js server-side caching of recommendations.
- **`components/PopularItemsModal.tsx`** [NEW]: Created global modal component to show popular recommendations when an item is added to the cart, with inline checkout/shopping navigation and direct add to cart actions. Query active cart items dynamically on modal open to set accurate Add vs Added button states. Explicitly reset recommendation added state on every modal trigger event to prevent state leakage. Bypassed Next.js client-side fetch caching by adding `cache: 'no-store'` and cache-busting timestamp parameters. Strictly format state keys and checks as trimmed, lowercase strings to prevent matching failures. Redirects the checkout action button directly to the `/cart` page (labeled `"Go to Cart"`).
- **`app/api/cart/route.ts`**: Configured backend ERP `get_cart` fetch request to bypass server-side caching using `cache: 'no-store'` and stamps, and exported force-dynamic.
- **`app/layout.tsx`**: Mounted `PopularItemsModal` globally inside the root wrapper layout.
- **`components/ProductDetail.tsx`**, **`components/PaymentOptionModal.tsx`**: Dispatched the `productAddedToCart` custom event containing category metadata on successful cart additions.

### 12. Support & Help Ticket Details
- **`app/support-help/page.tsx`**: Rendered the full creation timestamp (`creation`) containing both date and time on raised ticket status cards. Added fallback checks for `order` (`order_id`) and `creation` date parameters (`created`, `created_on`, `created_at`, `creation_date`, `modified`, `date`) to ensure they populate correctly. If the API returns no creation date at all, extracts year/month automatically from the ticket ID name (e.g. `CMP-202608-00008` -> `01-08-2026`) and renders it in strict `dd-mm-yyyy` format. Rendered the ticket `subject` (`complaint_subject`) field dynamically.

### 13. Dynamic Maintenance Mode (Firestore Integration)
- **`lib/firebaseAdmin.ts`** [NEW]: Securely initializes the Firebase Admin SDK using modular imports (`firebase-admin/app` & `firebase-admin/firestore`) to prevent dependency evaluation errors. Implements lazy-loaded database initialization (`getDB()`) to handle missing credentials safely without crashing. Declared `'server-only'` to guarantee it is never bundled by the client compilation steps.
- **`app/api/maintenance-status/route.ts`** [NEW]: Dynamically queries the Firestore collection `maintenance` document `mode` and retrieves the boolean variable `recom_gbru_shoption`.
- **`components/MaintenanceGuard.tsx`** [NEW]: A global client-side router guard mounted inside the layout. Periodically fetches the maintenance status API every 10 seconds. If `recom_gbru_shoption` is `true`, redirects users instantly to `/maintenance`. Once it returns to `false`, automatically redirects users back to the home page (`/`). Optimized to only poll periodically (every 30 seconds) when the user is currently stuck on the `/maintenance` screen, completely disabling idle background polling when the website is online.
- **`app/maintenance/page.tsx`** [NEW]: A premium, responsive, light-themed maintenance screen styled with animated spinning cogs, GBRU green accents (`#0D9740`), and helpful contact details in line with GBRU brand guidelines.
- **`app/layout.tsx`**: Mounted `MaintenanceGuard` globally at the root level.

### 14. B2C Auto Lead Integration
- **`lib/lead.ts`** [NEW]: Helper logic to trigger lead creation on the ERP endpoint `warrior.apis.lead.add_b2c_auto_lead` using system API keys. Compulsorily loads `CAMPAIGN_NAME` from environment variables, logging an error if not found.
- **`app/api/verify-otp/route.ts`**: Imports `createB2CLead` and triggers it for existing verified users by passing their registered name and mobile number.
- **`app/api/short-registration/route.ts`**: Calls `createB2CLead` after a new user completes the short registration form with their name.

### 15. Codebase Log Cleanup
- Removed all `console.log`, `console.warn`, and `console.error` calls throughout the target components, routes, utilities, and `utils` helper files (`utils/cartUtils.ts`) to keep the production console output clean and secure.

### 16. Spacing Layout Refinements
- **`components/Categories.tsx`**: Optimized the layout margins, card gaps, and button padding inside the **Shop By Category** section to make it spacious and fully prevent overlap issues on desktop screen layouts.
- **`components/AppDownload.tsx`**: Shifted the absolute left position of the mockup phone in hand graphic (`phone_in_hand.png`) on desktop viewports (`lg:left-[440px]`) and anchored it flush to the bottom boundary edge of the container (`lg:bottom-0 lg:top-auto`). Shifted the background leaves overlay (`green_leaves.jpg`) downwards by applying a negative vertical position offset (`backgroundPosition: "center bottom -120px"`) within the full container constraints.

### 17. Global Scaling & Scrollbar Hiding
- **`app/globals.css`**: Configured a `zoom: 1.1` scaling factor globally on the root `html` tag to apply a unified 1.1x viewport preset. Added CSS rules to globally hide horizontal and vertical scrollbars (`::-webkit-scrollbar` & `scrollbar-width: none`) across all viewports and elements, while maintaining all scrollability.

### 18. Mobile Footer Accordion Layout
- **`components/Footer.tsx`**: Implemented a responsive mobile footer (`lg:hidden`) following the Figma specification. Features expandable accordion sections (Quick Links, Support, Contact), brand description block, styled inline newsletter subscription card input group, social links row, and centralized copyright attribution. The full desktop footer grid remains fully intact and unchanged for larger desktop displays.

### 19. Mobile Testimonials Reorganisation
- **`components/Testimonials.tsx`**: Redesigned the mobile testimonial presentation (`lg:hidden` layout) into a clean, spacious, centered single-column vertical stack with `24px` border radius cards and explicit spacing margins. The desktop layout grid remains untouched.

### 20. Mobile Hero Realignment (Figma Match)
- **`components/Hero.tsx`**: Refactored the mobile layout viewport rendering path to mirror the Figma mockup structure. Title and subtitles are clean and centered, followed directly by the image slider carousel, side-by-side CTA buttons, a horizontal row of glassmorphic video cards, and a 2x2 grid features card at the bottom. Corrected the text colors on the mobile titles to match the green/black split styling.

### 21. Mobile Login / OTP Flow Cleanup
- **`components/Login.tsx`**, **`components/Otp.tsx`**: Configured the green feature welcome banner card to be hidden completely on mobile viewports (`hidden md:flex`), presenting a clean, spacious, centered mobile verification layout with inline GBRU branding centered above the forms. Desktop double-column views remain fully intact.
- **`components/Otp.tsx`**: Redesigned mobile OTP input fields to dynamically shrink using `flex-1` and `max-w-[44px]` container bounds, avoiding horizontal clipping. Adjusted left/right margins and layout centering for text items. Aligned the 6 boxes to the exact center of the page with mathematically identical left and right whitespace by setting the container layout to `justify-center gap-2.5 mx-auto`.

### 22. Mobile Navbar Alignment & Profile Session Detection
- **`components/Navbar.tsx`**: 
  - Updated the horizontal container padding constraints for mobile viewports (`pr-4 sm:pr-6 lg:pr-[47px]`). This shifts the mobile cart icon and hamburger menu button to sit flush with the right screen margin.
  - Wrapped the mobile menu drawer's action button block in a session verification checker. Displays the logged-in user's first name and triggers the user profile sidebar pop directly upon interaction, keeping the yellow "Sign up" button fallback strictly for unauthenticated sessions.

### 23. Mobile Dealer Account Detected Screen Spacing
- **`components/DealerProfile.tsx`**: Hidden the left green welcome panel on mobile viewports (`hidden md:flex`) and added a centered GBRU branding logo block at the top of the details card. Centered the heading, subtext, and download details to fit perfectly on mobile screens.

### 24. 22 Indian Regional Languages Support (Google Translate Integration)
- **`app/layout.tsx`**: 
  - Injected the global Google Translate element initialization scripts inside the layout `<head>`, listing all 22 compatible Indian languages.
  - Added a blocking, synchronous inline script in the `<head>` to read the user's preferred language from `localStorage` (`gbru_selected_lang`) and synchronize it directly to the `googtrans` cookie before Google Translate script parses it. This guarantees the language selection remains correctly applied on all refreshes and page navigations.
- **`app/globals.css`**: Configured absolute override styling rules to hide the default Google Translation top bar, banner frames, popovers, and text highlighting, preserving GBRU's premium branding.
- **`components/Navbar.tsx`**: Integrated custom dropdown selectors for both desktop (floating selection popover next to action CTAs) and mobile (collapsible accordion list section inside the hamburger menu drawer). Selecting a language updates `localStorage` and reloads the window.

## Verification
- Verified compilation and types.
- All changes staged, committed, and pushed successfully to `test` branch.
