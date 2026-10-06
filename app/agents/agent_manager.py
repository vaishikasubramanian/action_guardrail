from app.database.database import SessionLocal
from app.models.agent_model import Agent


def get_agent(agent_name: str):

    db = SessionLocal()

    agent = db.query(
        Agent
    ).filter(
        Agent.agent_name == agent_name,
        Agent.enabled == True
    ).first()

    db.close()

    return agent


def is_tool_allowed(
    agent_name: str,
    tool_name: str
):

    agent = get_agent(agent_name)

    if not agent:
        return False

    allowed_tools = [
        tool.strip()
        for tool in agent.allowed_tools.split(",")
    ]

    return tool_name in allowed_tools