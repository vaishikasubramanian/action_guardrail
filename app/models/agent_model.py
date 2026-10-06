from sqlalchemy import Column, Integer, String, Boolean
from app.database.database import Base


class Agent(Base):
    __tablename__ = "agents"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    agent_name = Column(
        String,
        unique=True,
        nullable=False
    )

    description = Column(String)

    allowed_tools = Column(String)

    enabled = Column(
        Boolean,
        default=True
    )