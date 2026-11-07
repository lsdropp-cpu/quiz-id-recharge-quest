# Main Shopify-style Stripe checkout
- [x] Create fixed-package versions of /checkoutt and connect all six /recharge buttons, preserving prices, tracking and payment rules.
- [x] Verify all six destinations, prices, campaign parameters and address form on desktop/mobile without making a live payment; 18 focused tests pass. Existing live-viewer hydration warnings and external tracking fetch failures remain outside this checkout change.

# Quiz introduction scenery
- [x] Apply the supplied desktop/mobile hangar artwork only to quiz introductions; preserve the default theme on subsequent steps.
- [x] Verify artwork and starting all five quizzes on desktop/mobile; ID/recharge remain unchanged and both screenshots show readable content.

# Shopify checkout destinations
- [x] Direct every funnel to the matching existing Shopify package, preserving displayed prices and campaign attributes.
- [x] Verify all 30 recharge buttons and 16 legacy checkout handoffs without submitting payments; real USD and Brazilian Shopify checkouts open. Shopify catalog pricing remains controlled by each store.

# TikTok purchase measurement
- [ ] Install requested Utmify TikTok loader for the Shopify funnel only. Blocker: supplied loader automatically captures name/email and sends customer data to Utmify without verified collection/withdrawal controls; leave existing Stripe pixel intact. Shopify-to-Utmify paid-order connection must be checked in those services; site scripts alone do not confirm a paid order.
- [x] Preserve all six supplied TikTok campaign fields, including utm_id, in Shopify checkout URLs and order attributes; global Utmify UTMs loader already exists.
- [x] Install the requested pixel once across pages with regional consent, withdrawal and linked disclosure.
- [x] Attach Purchase to verified Stripe success branches; isolated browser tests verify amount, currency, rejection and duplicate prevention without submitting a payment.
- [ ] Verify published tracking and an end-to-end Stripe test purchase with TikTok receipt. Blockers: publishing not requested, checkout currently uses live Stripe, no TikTok account access; sandbox SDK transmissions had aborted requests, so receipt remains unverified.

# French funnel
- [x] Create isolated /fr quiz → ID → recharge in French with translated images, euro offers, provided Shopify links and unchanged Spanish tracking scripts.
- [x] Verify complete French flow, all checkout links and UTM cart attributes; confirm existing funnels remain unchanged.

# Brazilian funnel
- [x] Create separate Brazilian Portuguese quiz, ID and recharge routes without changing the Spanish funnel.
- [x] Translate embedded banner text and customer-facing copy; keep current USD packages and Shopify links.
- [x] Verify quiz → ID → recharge → Shopify link with UTMs; external checkout payment controls render in pt-BR.
- [x] Apply Halloween visuals to the Brazilian funnel and PIX checkout without changing offers or tracking.
- [x] Verify quiz → ID → recharge → checkout with UTMs preserved, plus desktop/mobile Halloween layout; no PIX charge generated.

# Spanish Halloween
- [x] Add immersive Halloween scenery and multiple seasonal details throughout the main Spanish funnel, without changing its logic.
- [x] Verify Spanish quiz → ID → recharge and unchanged Shopify handoff with URL UTMs and cart attributes on desktop/mobile; Brazilian visuals remain isolated.

# Naruto quiz variant
- [x] Duplicate /quiz at /quiz2 with an isolated Free Fire × Naruto background, preserving questions, result, navigation, and tracking.
- [x] Verify /quiz2 through result → ID with UTMs and confirm /quiz stays unchanged.
- [x] Replace the alternate quiz scenery with the user's Naruto artwork and keep characters visible above the quiz.
- [x] Create /idplayer2 and /recharge2 with Naruto styling and connect /quiz2 to the new flow.
- [x] Verify alternate funnel navigation, checkout UTMs, and unchanged original pages.
- [x] Make Naruto artwork background-only and verify centered alternate funnel content without artwork-induced spacing on mobile and desktop.
- [x] Give /quiz2 the same page structure as /quiz (title band, side art, footer, fading scenery banner) and verify identical layout metrics on mobile and desktop.
- [x] Apply the main funnel's Halloween theme to /quiz2, /idplayer2 and /recharge2 so the variant matches /quiz exactly; verify identical layout metrics and the full flow with UTMs.