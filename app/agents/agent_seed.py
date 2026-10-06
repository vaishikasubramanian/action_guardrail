from app.database.database import SessionLocal
from app.models.agent_model import Agent


def seed_agents():

    db = SessionLocal()

    default_agents = [
        {
            "agent_name": "finance_agent",
            "description": "Handles financial operations",
            "allowed_tools": "database_tool,email_tool"
        },
        {
            "agent_name": "support_agent",
            "description": "Handles customer support requests",
            "allowed_tools": "email_tool,file_tool"
        },
        {
            "agent_name": "research_agent",
            "description": "Handles research and document analysis",
            "allowed_tools": "file_tool"
        },
        {
            "agent_name": "groq_agent",
            "description": "General-purpose LLM agent powered by Groq",
            "allowed_tools": "database_tool,email_tool,file_tool"
        },
        {
            "agent_name": "demo_agent",
            "description": "Demo agent used for scenario demonstrations",
            "allowed_tools": "database_tool,email_tool,file_tool"
        }
    ]

    for agent_data in default_agents:

        existing = db.query(
            Agent
        ).filter(
            Agent.agent_name == agent_data["agent_name"]
        ).first()

        if not existing:

            agent = Agent(
                agent_name=agent_data["agent_name"],
                description=agent_data["description"],
                allowed_tools=agent_data["allowed_tools"],
                enabled=True
            )

            db.add(agent)

    db.commit()
    db.close()

    print("Default agents seeded.")