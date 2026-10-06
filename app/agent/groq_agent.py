import json
import os

from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def generate_tool_call(user_prompt):

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": """
You are an AI agent responsible for converting user instructions
into tool calls.

Available tools:

1. database_tool
   action: delete_records
   parameters:
       record_count

2. email_tool
   action: send_email
   parameters:
       recipient

3. file_tool
   action: read_file
   parameters:
       path

IMPORTANT RULES:
- Return ONLY valid JSON.
- Do NOT include explanations.
- Do NOT include markdown.
- Do NOT include ```json blocks.
- Do NOT include any extra text.
- Your entire response must be a single JSON object.

Examples:

User:
Delete 500 customer records

Response:
{
    "tool_name": "database_tool",
    "action": "delete_records",
    "parameters": {
        "record_count": 500
    }
}

User:
Send payroll report to user@gmail.com

Response:
{
    "tool_name": "email_tool",
    "action": "send_email",
    "parameters": {
        "recipient": "user@gmail.com"
    }
}

User:
Read confidential/payroll.csv

Response:
{
    "tool_name": "file_tool",
    "action": "read_file",
    "parameters": {
        "path": "/confidential/payroll.csv"
    }
}
"""
            },
            {
                "role": "user",
                "content": user_prompt
            }
        ],
        temperature=0
    )

    tool_call = response.choices[0].message.content.strip()

    print("\nRAW GROQ RESPONSE:")
    print(tool_call)

    # Remove markdown if model still returns it
    tool_call = tool_call.replace("```json", "")
    tool_call = tool_call.replace("```", "")
    tool_call = tool_call.strip()

    try:
        return json.loads(tool_call)

    except json.JSONDecodeError:
        return {
            "error": "Invalid JSON returned from Groq",
            "raw_response": tool_call
        }