from app.database.database import SessionLocal
from app.models.policy_model import Policy


def seed_policies():

    db = SessionLocal()

    existing = db.query(Policy).count()

    if existing > 0:
        db.close()
        return

    policies = [

        Policy(
            rule_id="RULE001",
            action="delete_records",
            field="record_count",
            operator="greater_than",
            value="100",
            decision="block",
            enabled=True
        ),

        Policy(
            rule_id="RULE002",
            action="send_email",
            field="recipient",
            operator="external_email",
            value="",
            decision="require_hitl",
            enabled=True
        ),

        Policy(
            rule_id="RULE003",
            action="read_file",
            field="path",
            operator="contains",
            value="confidential",
            decision="log_and_allow",
            enabled=True
        )
    ]

    db.add_all(policies)
    db.commit()
    db.close()