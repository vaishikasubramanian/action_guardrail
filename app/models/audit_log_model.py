from sqlalchemy import Column, Integer, String
from app.database.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)

    timestamp = Column(String)
    agent_id = Column(String)
    tool_name = Column(String)
    action = Column(String)
    decision = Column(String)
    rule_id = Column(String)