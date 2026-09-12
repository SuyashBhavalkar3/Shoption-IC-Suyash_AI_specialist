# API Spec

## Events

### `POST /api/events/track`

Track a single analytics event.

Request body:

```json
{
  "user_id": "123",
  "anonymous_id": "anon-abc-001",
  "event_name": "login",
  "timestamp": "2026-06-06T13:19:01.774Z",
  "properties": {}
}
```

### `GET /api/events`

Query parameters:

- `page` default `1`
- `page_size` default `20`
- `user_id` optional
- `event_name` optional

Returns a paginated event list.

## Analytics

### `GET /api/analytics/funnel`

Returns counts for:

- `login`
- `product_view`
- `add_to_cart`
- `checkout_started`
- `purchase`

### `GET /api/analytics/overview`

Returns dashboard summary values:

- `total_events`
- `unique_users`
- `purchases`
- `funnel`
- `recent_events`
