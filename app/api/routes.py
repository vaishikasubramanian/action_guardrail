import logging
from fastapi import APIRouter, Depends, HTTPException

from app.guardrail.action_guardrail import ActionGuardrail
from app.schemas.action_request import ActionRequest
from app.schemas.prompt_request import PromptRequest
from app.logs.audit_logger import get_logs
from app.hitl.hitl_manager import (
    get_pending_requests,
    approve_request,
    reject_request
)
from app.agent.groq_agent import generate_tool_call
from app.security.auth_dependency import get_current_user, require_role
from app.tools.database_tool import delete_records
from app.tools.email_tool import send_email
from app.tools.file_tool import read_file

logger = logging.getLogger("action_guardrail.routes")

router = APIRouter()
guardrail = ActionGuardrail()


# ---------------------------------------------------
# Health Check — public, no auth needed
# ---------------------------------------------------

@router.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": "Action Guardrail",
        "version": "1.0.0"
    }


# ---------------------------------------------------
# Execute Action
# No auth required — this is called by AI agents
# and external systems directly
# ---------------------------------------------------

@router.post("/execute", tags=["Guardrail"])
def execute_action(request: ActionRequest):
    logger.info(
        f"Execute request | "
        f"agent={request.agent_id} action={request.action}"
    )
    result = guardrail.execute(request)
    return result


# ---------------------------------------------------
# Agent Endpoint — natural language to tool call
# No auth required — called by external systems
# ---------------------------------------------------

@router.post("/agent", tags=["Guardrail"])
def agent(prompt_request: PromptRequest):
    logger.info(f"Agent prompt: {prompt_request.prompt[:80]}")

    tool_call = generate_tool_call(prompt_request.prompt)

    if "error" in tool_call:
        raise HTTPException(
            status_code=422,
            detail=f"Could not parse instruction: {tool_call.get('error')}"
        )

    action_request = ActionRequest(
        agent_id="groq_agent",
        tool_name=tool_call["tool_name"],
        action=tool_call["action"],
        parameters=tool_call["parameters"]
    )

    result = guardrail.execute(action_request)

    return {
        "user_prompt": prompt_request.prompt,
        "generated_tool_call": tool_call,
        "guardrail_result": result
    }


# ---------------------------------------------------
# Audit Logs — any authenticated user can read
# ---------------------------------------------------

@router.get("/logs", tags=["Audit"])
def view_logs(current_user=Depends(get_current_user)):
    return get_logs()


# ---------------------------------------------------
# HITL Queue — any authenticated user can view
# ---------------------------------------------------

@router.get("/hitl/pending", tags=["HITL"])
def pending_requests(current_user=Depends(get_current_user)):
    return get_pending_requests()


# ---------------------------------------------------
# HITL Approve — admin or reviewer only
# ---------------------------------------------------

@router.post("/hitl/approve/{request_id}", tags=["HITL"])
def approve(
    request_id: int,
    current_user=Depends(require_role("admin", "reviewer"))
):
    approved = approve_request(request_id)

    if not approved:
        raise HTTPException(status_code=404, detail="HITL request not found.")

    tool_result = _execute_approved_tool(
        approved["action"],
        approved["parameters"]
    )

    logger.info(
        f"HITL request #{request_id} approved by '{current_user['sub']}'"
    )

    return {
        "status": "approved",
        "request_id": request_id,
        "approved_by": current_user["sub"],
        "tool_result": tool_result
    }


# ---------------------------------------------------
# HITL Reject — admin or reviewer only
# ---------------------------------------------------

@router.post("/hitl/reject/{request_id}", tags=["HITL"])
def reject(
    request_id: int,
    current_user=Depends(require_role("admin", "reviewer"))
):
    rejected = reject_request(request_id)

    if not rejected:
        raise HTTPException(status_code=404, detail="HITL request not found.")

    logger.info(
        f"HITL request #{request_id} rejected by '{current_user['sub']}'"
    )

    return {
        "status": "rejected",
        "request_id": request_id,
        "rejected_by": current_user["sub"],
        "message": "Action rejected by human reviewer. Tool was not executed."
    }


# ---------------------------------------------------
# Internal helper — execute tool after HITL approval
# ---------------------------------------------------

def _execute_approved_tool(action: str, parameters: dict):
    if action == "delete_records":
        return delete_records(parameters.get("record_count"))
    elif action == "send_email":
        return send_email(parameters.get("recipient"))
    elif action == "read_file":
        return read_file(parameters.get("path"))
    return {"status": "error", "message": f"Unknown action: {action}"}
