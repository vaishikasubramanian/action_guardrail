from app.logs.audit_logger import log_action
from app.guardrail.policy_engine import PolicyEngine
from app.tools.database_tool import delete_records
from app.tools.email_tool import send_email
from app.tools.file_tool import read_file
from app.hitl.hitl_manager import create_hitl_request
from app.agents.agent_manager import is_tool_allowed


class ActionGuardrail:

    def __init__(self):
        self.policy_engine = PolicyEngine()

    def execute(self, action_request):

        # -----------------------------------
        # Agent Tool Authorization
        # -----------------------------------

        if not is_tool_allowed(
            action_request.agent_id,
            action_request.tool_name
        ):

            # Audit unauthorized attempt
            log_action(
                action_request.agent_id,
                action_request.tool_name,
                action_request.action,
                "block",
                "AGENT_AUTHORIZATION"
            )

            return {
                "status": "blocked",
                "decision": "block",
                "message": "Agent is not authorized to use this tool.",
                "rule_id": "AGENT_AUTHORIZATION"
            }

        # -----------------------------------
        # Policy Evaluation
        # -----------------------------------

        result = self.policy_engine.evaluate(
            action_request
        )

        decision = result["decision"]

        # -----------------------------------
        # Audit Logging
        # -----------------------------------

        log_action(
            action_request.agent_id,
            action_request.tool_name,
            action_request.action,
            decision,
            result["rule_id"]
        )

        # -----------------------------------
        # Dry Run Mode
        # -----------------------------------

        if getattr(
            action_request,
            "dry_run",
            False
        ):
            return {
                "status": "simulation",
                "decision": decision,
                "message": (
                    f"Dry run mode: action would result in "
                    f"'{decision}'"
                ),
                "rule_id": result["rule_id"]
            }

        # -----------------------------------
        # BLOCK
        # -----------------------------------

        if decision == "block":
            return {
                "status": "blocked",
                "decision": "block",
                "message": "Action blocked by policy.",
                "rule_id": result["rule_id"]
            }

        # -----------------------------------
        # HUMAN APPROVAL
        # -----------------------------------

        elif decision == "require_hitl":

            hitl_request = create_hitl_request(
                action_request,
                result["rule_id"]
            )

            return {
                "status": "pending_approval",
                "decision": "require_hitl",
                "message": "Human approval required.",
                "request_id": hitl_request.id,
                "rule_id": result["rule_id"]
            }

        # -----------------------------------
        # LOG AND ALLOW
        # -----------------------------------

        elif decision == "log_and_allow":
            return self.execute_tool(
                action_request
            )

        # -----------------------------------
        # ALLOW
        # -----------------------------------

        return self.execute_tool(
            action_request
        )

    def execute_tool(self, action_request):

        if action_request.action == "delete_records":
            return delete_records(
                action_request.parameters[
                    "record_count"
                ]
            )

        elif action_request.action == "send_email":
            return send_email(
                action_request.parameters[
                    "recipient"
                ]
            )

        elif action_request.action == "read_file":
            return read_file(
                action_request.parameters[
                    "path"
                ]
            )

        return {
            "status": "error",
            "message": "Unknown action"
        }