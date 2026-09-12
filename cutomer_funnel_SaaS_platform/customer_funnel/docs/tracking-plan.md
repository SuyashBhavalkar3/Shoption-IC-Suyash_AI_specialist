# Tracking Plan

## Core funnel events

1. `login`
2. `product_view`
3. `add_to_cart`
4. `checkout_started`
5. `purchase`

## SDK payload fields

- `user_id`: optional known user ID
- `anonymous_id`: generated browser identifier
- `event_name`: required event name
- `properties`: event metadata as JSON

## Guidance

- Send `anonymous_id` for all events.
- Call `identify(userId)` if the customer logs in and the session should be tied to a known user.
- Keep properties small and event-specific.
