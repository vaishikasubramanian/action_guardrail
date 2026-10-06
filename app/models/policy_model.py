from sqlalchemy import Column, Integer, String, Boolean
from app.database.database import Base


class Policy(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True)

    rule_id = Column(String, unique=True)

    action = Column(String)

    field = Column(String)

    operator = Column(String)

    value = Column(String)

    decision = Column(String)

    enabled = Column(Boolean, default=True)

    agent_name = Column(
        String,
        nullable=True
    )