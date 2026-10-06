from app.database.database import SessionLocal
from app.models.hitl_request_model import HITLRequest
import json


def create_hitl_request(action_request, rule_id):
    db = SessionLocal()

    request = HITLRequest(
        agent_id=action_request.agent_id,
        tool_name=action_request.tool_name,
        action=action_request.action,
        parameters=json.dumps(action_request.parameters),
        status="pending",
        rule_id=rule_id
    )

    db.add(request)
    db.commit()
    db.refresh(request)

    db.close()

    return request


def get_pending_requests():
    db = SessionLocal()

    requests = db.query(HITLRequest).filter(
        HITLRequest.status == "pending"
    ).all()

    db.close()

    return requests


def approve_request(request_id):
    """
    Approves the HITL request and returns the request data
    so the caller can resume tool execution.
    """
    db = SessionLocal()

    request = db.query(HITLRequest).filter(
        HITLRequest.id == request_id
    ).first()

    if not request:
        db.close()
        return None

    request.status = "approved"
    db.commit()

    # Capture the data we need before closing the session
    approved_data = {
        "id": request.id,
        "agent_id": request.agent_id,
        "tool_name": request.tool_name,
        "action": request.action,
        "parameters": json.loads(request.parameters),
        "rule_id": request.rule_id,
        "status": request.status
    }

    db.close()

    return approved_data


def reject_request(request_id):
    db = SessionLocal()

    request = db.query(HITLRequest).filter(
        HITLRequest.id == request_id
    ).first()

    if not request:
        db.close()
        return None

    request.status = "rejected"
    db.commit()

    rejected_data = {
        "id": request.id,
        "agent_id": request.agent_id,
        "tool_name": request.tool_name,
        "action": request.action,
        "status": request.status
    }

    db.close()

    return rejected_data