from pydantic import BaseModel
from typing import Dict, Any


class ActionRequest(BaseModel):
    agent_id: str
    tool_name: str
    action: str
    parameters: Dict[str, Any]
    dry_run: bool = False