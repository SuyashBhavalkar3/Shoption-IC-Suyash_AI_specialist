from sqlalchemy import distinct, func
from sqlalchemy.orm import Session

from app.models.event import Event

FUNNEL_EVENTS = ["login", "product_view", "add_to_cart", "checkout_started", "purchase"]


class FunnelService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_funnel_counts(self, project_id: int) -> dict[str, int]:
        rows = (
            self.db.query(Event.event_name, func.count(Event.id).label("count"))
            .filter(Event.project_id == project_id)
            .filter(Event.event_name.in_(FUNNEL_EVENTS))
            .group_by(Event.event_name)
            .all()
        )
        counts = {name: 0 for name in FUNNEL_EVENTS}
        for event_name, count in rows:
            counts[event_name] = int(count)
        return counts

    def get_overview(self, project_id: int) -> dict[str, object]:
        funnel = self.get_funnel_counts(project_id)
        total_events = (
            self.db.query(func.count(Event.id))
            .filter(Event.project_id == project_id)
            .scalar() or 0
        )
        unique_users = (
            self.db.query(func.count(distinct(func.coalesce(Event.user_id, Event.anonymous_id))))
            .filter(Event.project_id == project_id)
            .scalar() or 0
        )
        recent_events = (
            self.db.query(Event)
            .filter(Event.project_id == project_id)
            .order_by(Event.created_at.desc())
            .limit(5)
            .all()
        )
        return {
            "total_events": int(total_events),
            "unique_users": int(unique_users),
            "purchases": int(funnel.get("purchase", 0)),
            "funnel": funnel,
            "recent_events": [
                {
                    "id": event.id,
                    "user_id": event.user_id,
                    "anonymous_id": event.anonymous_id,
                    "event_name": event.event_name,
                    "created_at": event.created_at,
                    "properties": event.properties,
                }
                for event in recent_events
            ],
        }

    def get_modular_funnels(self, project_id: int) -> dict[str, dict[str, object]]:
        modules_config = {
            "authentication": {
                "name": "Authentication Funnel",
                "events": [
                    "mobile_number_entered",
                    "otp_entered",
                    "user_type_selected",
                    "profile_started",
                    "profile_completed",
                    "login",
                    "logout",
                ],
            },
            "discovery": {
                "name": "Discovery Funnel",
                "events": [
                    "product_searched",
                    "category_clicked",
                    "subcategory_clicked",
                    "catalog_option_selected",
                    "brand_selected",
                    "product_view",
                ],
            },
            "cart": {
                "name": "Cart Funnel",
                "events": [
                    "product_view",
                    "add_to_cart",
                    "cart_viewed",
                    "cart_updated",
                    "remove_from_cart",
                ],
            },
            "checkout": {
                "name": "Checkout Funnel",
                "events": [
                    "checkout_started",
                    "checkout_continued",
                    "coupon_applied",
                    "coupon_failed",
                    "coupon_removed",
                    "payment_method_selected",
                    "pay_now_clicked",
                    "purchase",
                ],
            },
            "orders": {
                "name": "Orders Funnel",
                "events": [
                    "purchase",
                    "order_viewed",
                    "booking_cancelled",
                ],
            },
        }

        # Collect all events across all modules
        all_event_names = set()
        for mod in modules_config.values():
            all_event_names.update(mod["events"])

        # Query counts and unique users per event
        event_stats_rows = (
            self.db.query(
                Event.event_name,
                func.count(Event.id).label("count"),
                func.count(distinct(func.coalesce(Event.user_id, Event.anonymous_id))).label("unique_users")
            )
            .filter(Event.project_id == project_id)
            .filter(Event.event_name.in_(list(all_event_names)))
            .group_by(Event.event_name)
            .all()
        )

        stats_by_event = {row[0]: {"count": row[1], "unique_users": row[2]} for row in event_stats_rows}

        response_data = {}
        for key, config in modules_config.items():
            stages = []
            total_events = 0
            for name in config["events"]:
                stats = stats_by_event.get(name, {"count": 0, "unique_users": 0})
                stages.append({
                    "event_name": name,
                    "count": stats["count"],
                    "unique_users": stats["unique_users"]
                })
                total_events += stats["count"]

            # Calculate unique users who did any event in the module
            mod_unique_users = (
                self.db.query(func.count(distinct(func.coalesce(Event.user_id, Event.anonymous_id))))
                .filter(Event.project_id == project_id)
                .filter(Event.event_name.in_(config["events"]))
                .scalar() or 0
            )

            # Calculate conversion rate: (last stage count / first stage count) * 100
            first_count = stages[0]["count"]
            last_count = stages[-1]["count"]
            conversion_rate = round((last_count / first_count) * 100.0, 2) if first_count > 0 else 0.0

            # Calculate lost users: sum of drop-offs between consecutive stages
            lost_users = 0
            for i in range(len(stages) - 1):
                lost_users += max(0, stages[i]["count"] - stages[i+1]["count"])

            response_data[key] = {
                "name": config["name"],
                "stages": stages,
                "kpis": {
                    "total_events": total_events,
                    "unique_users": mod_unique_users,
                    "conversion_rate": conversion_rate,
                    "lost_users": lost_users
                }
            }

        return response_data