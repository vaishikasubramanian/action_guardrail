from datetime import datetime


def send_email(recipient: str):
    """
    Simulates sending an email.
    In production, this would connect to an SMTP server or email API.
    External emails require HITL approval before reaching this function.
    """
    domain = recipient.split("@")[-1] if "@" in recipient else "unknown"
    is_internal = domain == "company.com"

    return {
        "status": "success",
        "tool": "email_tool",
        "action": "send_email",
        "recipient": recipient,
        "domain": domain,
        "type": "internal" if is_internal else "external",
        "message": f"Email successfully sent to {recipient}.",
        "executed_at": datetime.now().isoformat(),
        "note": "Guardrail approved this action before execution."
    }
