from app.database.database import SessionLocal
from app.models.audit_log_model import AuditLog
from datetime import datetime


def log_action(
    agent_id,
    tool_name,
    action,
    decision,
    rule_id
):
    db = SessionLocal()

    log = AuditLog(
        timestamp=datetime.now().isoformat(),
        agent_id=agent_id,
        tool_name=tool_name,
        action=action,
        decision=decision,
        rule_id=rule_id
    )

    db.add(log)
    db.commit()
    db.refresh(log)

    db.close()

    return log


def get_logs():
    db = SessionLocal()
    logs = db.query(AuditLog).all()
    db.close()
    return logs
