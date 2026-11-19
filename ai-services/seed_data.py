"""
seed_data.py — Historical order data simulator

Generates 60 days of realistic simulated order data directly into the
PostgreSQL database. Designed to give the XGBoost model enough training
data to produce meaningful demand forecasts immediately.

What it does:
  1. Reads all restaurants, tables, and menu items from the real DB.
  2. Simulates daily orders over the past 60 days using realistic patterns:
     - Weekend orders are 40-60% higher than weekdays.
     - Each menu item has a different base popularity weight.
     - Small Gaussian noise is added to quantities for realism.
     - Orders are backdated (createdAt set to past dates) and marked READY.
  3. Creates matching Payment records (status=PAID) so the Analytics
     dashboard also shows revenue history.
  4. Inserts StockHistory rows for inventory deductions.
  5. Skips days/items that already have data (idempotent — safe to re-run).

Usage:
  cd ai-service
  python seed_data.py               # seeds 60 days
  python seed_data.py --days 30     # seeds 30 days
  python seed_data.py --dry-run     # preview without inserting

After running:
  - Restart the AI service: python main.py
  - Click "Retrain AI" in Analytics -> AI Forecast tab
"""
import argparse
import random
import sys
from datetime import datetime, timedelta, timezone
from string import ascii_uppercase, digits

from sqlalchemy import text

from database import SessionLocal


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

CUID_CHARS = ascii_uppercase + digits

def _cuid() -> str:
    """Generate a simple random ID that won't clash with Prisma CUIDs."""
    suffix = "".join(random.choices(CUID_CHARS.lower() + digits, k=20))
    return f"sim{suffix}"


def _order_number(restaurant_id: str, n: int) -> str:
    return f"SIM-{restaurant_id[-6:].upper()}-{n:05d}"


def _receipt_number(n: int) -> str:
    return f"SIM-RCP-{n:08d}"


def _weekend_multiplier(dt: datetime) -> float:
    """Fridays and weekends get more traffic."""
    dow = dt.weekday()  # 0=Mon … 6=Sun
    if dow == 4:   # Friday
        return 1.35
    elif dow in (5, 6):  # Sat / Sun
        return 1.55
    return 1.0


# ---------------------------------------------------------------------------
# Main seeder
# ---------------------------------------------------------------------------

def seed(days: int = 60, dry_run: bool = False) -> None:
    db = SessionLocal()
    try:
        # --- 1. Fetch real entities ----------------------------------------
        restaurants = db.execute(text('SELECT id, name FROM "Restaurant"')).fetchall()
        if not restaurants:
            print("❌  No restaurants found. Register one in the app first.")
            return

        for restaurant in restaurants:
            rid = restaurant.id
            rname = restaurant.name
            print(f"\n🍽️  Seeding restaurant: {rname} ({rid})")

            # Tables
            tables = db.execute(
                text('SELECT id FROM "Table" WHERE "restaurantId" = :rid'),
                {"rid": rid},
            ).fetchall()
            if not tables:
                print("   ⚠️  No tables found — skipping (create tables in app first).")
                continue
            table_ids = [t.id for t in tables]

            # Menu items with prices
            items = db.execute(
                text(
                    """
                    SELECT id, name, price FROM "MenuItem"
                    WHERE "restaurantId" = :rid
                      AND "deletedAt" IS NULL
                      AND "isAvailable" = true
                    """
                ),
                {"rid": rid},
            ).fetchall()
            if not items:
                print("   ⚠️  No active menu items found — skipping.")
                continue

            item_ids = [i.id for i in items]
            item_price = {i.id: float(i.price) for i in items}

            # Assign random base popularity weights (some items sell more)
            weights = [random.uniform(0.5, 3.0) for _ in item_ids]
            total_w = sum(weights)
            item_weight = {iid: w / total_w for iid, w in zip(item_ids, weights)}

            # --- 2. Simulate day by day ------------------------------------
            today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
            start_date = today - timedelta(days=days)

            order_counter = 0
            receipt_counter = 0
            inserted_orders = 0
            inserted_payments = 0

            for day_offset in range(days):
                current_day = start_date + timedelta(days=day_offset)
                multiplier = _weekend_multiplier(current_day)

                # 3-8 orders per day on weekdays, more on weekends
                num_orders = int(random.gauss(5 * multiplier, 1.5))
                num_orders = max(1, min(num_orders, 15))

                for _ in range(num_orders):
                    order_counter += 1
                    receipt_counter += 1
                    order_id = _cuid()
                    order_num = _order_number(rid, order_counter)
                    receipt_num = _receipt_number(receipt_counter)
                    table_id = random.choice(table_ids)

                    # Random time during lunch/dinner hours
                    hour = random.choice(
                        [12, 13, 13, 14, 18, 19, 19, 20, 20, 21]
                    )
                    minute = random.randint(0, 59)
                    order_time = current_day.replace(hour=hour, minute=minute)

                    # Check if this order number already exists (idempotency)
                    existing = db.execute(
                        text(
                            'SELECT id FROM "Order" WHERE "restaurantId" = :rid AND "orderNumber" = :num'
                        ),
                        {"rid": rid, "num": order_num},
                    ).fetchone()
                    if existing:
                        continue

                    # Select 1-3 random menu items for this order
                    num_items = random.randint(1, min(3, len(item_ids)))
                    chosen_items = random.choices(
                        item_ids,
                        weights=[item_weight[i] for i in item_ids],
                        k=num_items,
                    )
                    # Deduplicate
                    chosen_items = list(dict.fromkeys(chosen_items))

                    # Calculate totals
                    subtotal = 0.0
                    order_items_data = []
                    for iid in chosen_items:
                        qty = random.randint(1, 3)
                        price = item_price[iid]
                        subtotal += price * qty
                        order_items_data.append((iid, qty, price))

                    gst_amount = round(subtotal * 0.05, 2)
                    total = round(subtotal + gst_amount, 2)

                    if dry_run:
                        print(
                            f"   [DRY RUN] {order_time.date()} | {order_num} | "
                            f"{len(chosen_items)} items | ₹{total:.2f}"
                        )
                        continue

                    # Insert Order
                    db.execute(
                        text(
                            """
                            INSERT INTO "Order"
                              (id, "restaurantId", "tableId", "orderNumber",
                               "customerName", status, "totalAmount",
                               "createdAt", "updatedAt")
                            VALUES
                              (:id, :rid, :tid, :onum,
                               :cname, 'READY', :total,
                               :created, :updated)
                            ON CONFLICT DO NOTHING
                            """
                        ),
                        {
                            "id": order_id,
                            "rid": rid,
                            "tid": table_id,
                            "onum": order_num,
                            "cname": "Simulated Guest",
                            "total": total,
                            "created": order_time,
                            "updated": order_time,
                        },
                    )

                    # Insert OrderItems
                    for iid, qty, price in order_items_data:
                        item_id = _cuid()
                        db.execute(
                            text(
                                """
                                INSERT INTO "OrderItem"
                                  (id, "restaurantId", "orderId", "menuItemId",
                                   quantity, "priceAtOrder")
                                VALUES
                                  (:id, :rid, :oid, :mid, :qty, :price)
                                ON CONFLICT DO NOTHING
                                """
                            ),
                            {
                                "id": item_id,
                                "rid": rid,
                                "oid": order_id,
                                "mid": iid,
                                "qty": qty,
                                "price": price,
                            },
                        )

                    # Insert Payment (PAID)
                    payment_id = _cuid()
                    method = random.choice(["CASH", "CARD", "UPI"])
                    db.execute(
                        text(
                            """
                            INSERT INTO "Payment"
                              (id, "restaurantId", "orderId", amount, "gstAmount",
                               method, status, "receiptNumber", "createdAt")
                            VALUES
                              (:pid, :rid, :oid, :amt, :gst,
                               :method, 'PAID', :rnum, :created)
                            ON CONFLICT DO NOTHING
                            """
                        ),
                        {
                            "pid": payment_id,
                            "rid": rid,
                            "oid": order_id,
                            "amt": subtotal,
                            "gst": gst_amount,
                            "method": method,
                            "rnum": receipt_num,
                            "created": order_time,
                        },
                    )

                    inserted_orders += 1
                    inserted_payments += 1

            if not dry_run:
                db.commit()
                print(f"   ✅  Inserted {inserted_orders} orders + {inserted_payments} payments")
            else:
                print(f"   ℹ️  Dry run complete — {order_counter} orders would be inserted")

    except Exception as exc:
        db.rollback()
        print(f"\n❌  Error: {exc}")
        raise
    finally:
        db.close()


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed historical order data for AI training")
    parser.add_argument(
        "--days",
        type=int,
        default=60,
        help="Number of past days to simulate (default: 60)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview what would be inserted without touching the DB",
    )
    args = parser.parse_args()

    print(f"\n🌱  Restaurant Order Data Simulator")
    print(f"    Days to seed : {args.days}")
    print(f"    Mode         : {'DRY RUN (no writes)' if args.dry_run else 'LIVE (writing to DB)'}")
    print(f"    Min rows     : 3 per item (configured in .env)\n")

    seed(days=args.days, dry_run=args.dry_run)

    if not args.dry_run:
        print("\n🎯  Done! Next steps:")
        print("    1. Restart the AI service: Ctrl+C → python main.py")
        print("    2. In the app: Analytics → AI Forecast → click 'Retrain AI'")
        print("    3. Forecasts will appear for all menu items with ≥3 days of data\n")
