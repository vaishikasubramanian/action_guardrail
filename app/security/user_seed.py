from app.database.database import SessionLocal
from app.models.user_model import User
from app.security.security import hash_password


def seed_admin():

    db = SessionLocal()

    # ----------------------
    # Admin User
    # ----------------------

    existing_admin = db.query(User).filter(
        User.username == "admin"
    ).first()

    if not existing_admin:
        admin = User(
            username="admin",
            password=hash_password("admin123"),
            role="admin"
        )

        db.add(admin)

    # ----------------------
    # Auditor User
    # ----------------------

    existing_auditor = db.query(User).filter(
        User.username == "auditor"
    ).first()

    if not existing_auditor:
        auditor = User(
            username="auditor",
            password=hash_password("auditor123"),
            role="auditor"
        )

        db.add(auditor)


    existing_reviewer = db.query(User).filter(
    User.username == "reviewer"
).first()

    if not existing_reviewer:
        reviewer = User(
            username="reviewer",
            password=hash_password("reviewer123"),
            role="reviewer"
        )

        db.add(reviewer)

    db.commit()
    db.close()

    print("Default users seeded successfully.")