"""
LuxeMarket Database Seed Script
=================================
Seeds ONLY users (no products — admin adds products via the dashboard).
Run from /backend:  python seed.py
"""
import sys, os, random
from datetime import datetime, timedelta
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models.user import User, UserRole, UserStatus
from app.models.order import Order, OrderItem
from app.models.analytics import AnalyticsEvent, AnalyticsEventType
# The import below is corrected to match the new security naming
from app.core.security import get_password_hash 

Base.metadata.create_all(bind=engine)

USERS_DATA = [
    {"name": "Alex Rivera",   "email": "admin@luxemarket.com",  "password": "admin123",  "role": UserRole.super_admin, "status": UserStatus.active},
    {"name": "David Chen",    "email": "editor@luxemarket.com", "password": "editor123", "role": UserRole.editor,      "status": UserStatus.active},
    {"name": "Jane Doe",      "email": "user@luxemarket.com",   "password": "user123",   "role": UserRole.customer,    "status": UserStatus.active},
    {"name": "Sophia Chen",   "email": "sophia.chen@email.com", "password": "pass123",   "role": UserRole.customer,    "status": UserStatus.active},
    {"name": "James Wilson",  "email": "james.wilson@email.com","password": "pass123",   "role": UserRole.customer,    "status": UserStatus.active},
    {"name": "Emma Thompson", "email": "emma.t@email.com",      "password": "pass123",   "role": UserRole.customer,    "status": UserStatus.suspended},
    {"name": "Marcus Knight", "email": "marcus.k@email.com",    "password": "pass123",   "role": UserRole.customer,    "status": UserStatus.active},
    {"name": "Lena Park",     "email": "lena.park@email.com",   "password": "pass123",   "role": UserRole.customer,    "status": UserStatus.blocked},
    {"name": "Noah Rivera",   "email": "noah.r@email.com",      "password": "pass123",   "role": UserRole.customer,    "status": UserStatus.active},
]


def run():
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            print("⚠️  Already seeded. Drop tables to reseed.")
            return

        print("🌱 Seeding LuxeMarket users...")
        users = []
        for ud in USERS_DATA:
            u = User(
                name=ud["name"], email=ud["email"],
                # Function call corrected to get_password_hash
                hashed_password=get_password_hash(ud["password"]),
                role=ud["role"], status=ud["status"],
                member_since=datetime.utcnow() - timedelta(days=random.randint(30, 365)),
            )
            db.add(u)
            users.append(u)
        db.commit()
        print(f"  ✅ {len(users)} users created")
        print()
        print("  admin@luxemarket.com  / admin123  (Super Admin)")
        print("  editor@luxemarket.com / editor123 (Editor)")
        print("  user@luxemarket.com   / user123   (Customer)")
        print()
        print("  ℹ️  No products seeded — add them via the admin dashboard.")
    except Exception as e:
        db.rollback()
        print(f"❌ Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run()