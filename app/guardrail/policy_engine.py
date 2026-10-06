import logging
from app.database.database import SessionLocal
from app.models.policy_model import Policy

logger = logging.getLogger("action_guardrail.policy_engine")


class PolicyEngine:

    def get_rules(self):
        db = SessionLocal()
        try:
            return db.query(Policy).filter(Policy.enabled == True).all()
        finally:
            db.close()

    def evaluate(self, action_request):

        rules = self.get_rules()

        logger.info(
            f"Evaluating action '{action_request.action}' "
            f"for agent '{action_request.agent_id}' | "
            f"params={action_request.parameters}"
        )

        explanations = []

        for rule in rules:

            # Match agent-scoped rules
            if rule.agent_name and rule.agent_name != action_request.agent_id:
                continue

            # Match action
            if rule.action != action_request.action:
                continue

            field = rule.field
            operator = rule.operator
            value = action_request.parameters.get(field)

            # -----------------------------------
            # greater_than
            # -----------------------------------
            if operator == "greater_than":
                if value is not None and value > int(rule.value):
                    explanations.append(
                        f"{field} ({value}) exceeded threshold of {rule.value}"
                    )
                    logger.info(
                        f"Rule {rule.rule_id} triggered: {field}={value} > {rule.value} "
                        f"-> decision={rule.decision}"
                    )
                    return {
                        "decision": rule.decision,
                        "rule_id": rule.rule_id,
                        "agent": rule.agent_name,
                        "explanations": explanations
                    }

            # -----------------------------------
            # contains
            # -----------------------------------
            elif operator == "contains":
                if value and rule.value.lower() in str(value).lower():
                    explanations.append(
                        f"{field} contains restricted keyword '{rule.value}'"
                    )
                    logger.info(
                        f"Rule {rule.rule_id} triggered: {field} contains '{rule.value}' "
                        f"-> decision={rule.decision}"
                    )
                    return {
                        "decision": rule.decision,
                        "rule_id": rule.rule_id,
                        "agent": rule.agent_name,
                        "explanations": explanations
                    }

            # -----------------------------------
            # external_email
            # -----------------------------------
            elif operator == "external_email":
                internal_domain = "@company.com"
                if value and not str(value).endswith(internal_domain):
                    explanations.append(
                        f"External email detected: {value}"
                    )
                    logger.info(
                        f"Rule {rule.rule_id} triggered: external email '{value}' "
                        f"-> decision={rule.decision}"
                    )
                    return {
                        "decision": rule.decision,
                        "rule_id": rule.rule_id,
                        "agent": rule.agent_name,
                        "explanations": explanations
                    }

        logger.info(
            f"No policy matched for action '{action_request.action}' "
            f"by agent '{action_request.agent_id}' -> decision=allow"
        )

        return {
            "decision": "allow",
            "rule_id": None,
            "agent": action_request.agent_id,
            "explanations": ["No matching policy found — action allowed"]
        }
