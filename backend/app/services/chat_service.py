"""
Chat service — RAG-augmented AI mentor chat.
Uses in-memory conversation history (no Redis needed).
"""

import logging
from typing import Dict, List

from app.ai.rag_pipeline import query_with_rag
from app.ai.prompts.mentor_chat import MENTOR_SYSTEM_PROMPT

logger = logging.getLogger(__name__)

# In-memory conversation store (per user)
# In production, you'd use a database or Redis
_conversation_store: Dict[str, List[dict]] = {}

MAX_HISTORY = 20  # Keep last 20 messages per user


class ChatService:
    def __init__(self, user_id: str):
        self.user_id = user_id

    def send_message(self, message: str) -> dict:
        """Send a message to the AI mentor with RAG-augmented context."""

        # Get conversation history
        history = _conversation_store.get(self.user_id, [])

        # Format history for prompt
        history_text = ""
        for msg in history[-10:]:  # Last 10 messages for context
            role = "User" if msg["role"] == "user" else "AI Mentor"
            history_text += f"{role}: {msg['content']}\n"

        # Build system prompt with history
        system_prompt = MENTOR_SYSTEM_PROMPT.format(chat_history=history_text)

        # Query with RAG (retrieves relevant knowledge base context automatically)
        try:
            response = query_with_rag(
                query=message,
                system_prompt=system_prompt,
                top_k=3,
                temperature=0.7,
            )
        except Exception as e:
            logger.error(f"Chat failed: {e}")
            response = f"I apologize, but I encountered an error. Please make sure your GEMINI_API_KEY is configured correctly. Error: {str(e)}"

        # Update conversation history
        history.append({"role": "user", "content": message})
        history.append({"role": "assistant", "content": response})

        # Trim history
        if len(history) > MAX_HISTORY * 2:
            history = history[-(MAX_HISTORY * 2):]

        _conversation_store[self.user_id] = history

        return {
            "response": response,
            "message_count": len(history),
        }

    def get_history(self) -> list:
        """Get conversation history for the user."""
        return _conversation_store.get(self.user_id, [])

    def clear_history(self):
        """Clear conversation history."""
        _conversation_store.pop(self.user_id, None)
