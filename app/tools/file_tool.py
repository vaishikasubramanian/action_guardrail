from datetime import datetime
import os


def read_file(path: str):
    """
    Simulates reading a file.
    In production, this would read from actual storage.
    Confidential file reads are logged before reaching this function.
    """
    filename = os.path.basename(path)
    is_confidential = "confidential" in path.lower()

    return {
        "status": "success",
        "tool": "file_tool",
        "action": "read_file",
        "path": path,
        "filename": filename,
        "classification": "CONFIDENTIAL" if is_confidential else "STANDARD",
        "size_bytes": 204800,
        "message": f"File '{filename}' read successfully.",
        "executed_at": datetime.now().isoformat(),
        "note": "Guardrail approved this action before execution."
    }
