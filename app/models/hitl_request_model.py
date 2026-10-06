from sqlalchemy import Column, Integer, String
from app.database.database import Base


class HITLRequest(Base):
    __tablename__ = "hitl_requests"

    id = Column(Integer, primary_key=True, index=True)

    agent_id = Column(String)
    tool_name = Column(String)
    action = Column(String)

    parameters = Column(String)

    status = Column(String)

    rule_id = Column(String)