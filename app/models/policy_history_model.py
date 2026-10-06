from sqlalchemy import Column, Integer, String
from app.database.database import Base


class PolicyHistory(Base):
    __tablename__ = "policy_history"

    id = Column(Integer, primary_key=True, index=True)

    rule_id = Column(String)

    old_value = Column(String)
    new_value = Column(String)

    old_decision = Column(String)
    new_decision = Column(String)

    timestamp = Column(String)