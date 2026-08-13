"""Prompt templates for mock interview generation and evaluation."""

GENERATE_QUESTIONS_PROMPT = """You are an experienced technical interviewer.

Generate {num_questions} interview questions for the following:

INTERVIEW TYPE: {interview_type}
TOPIC/ROLE: {topic}
DIFFICULTY: {difficulty}

RELEVANT KNOWLEDGE BASE CONTEXT:
{rag_context}

Return the questions in JSON format (return ONLY valid JSON, no markdown):
{{
    "questions": [
        {{
            "id": 1,
            "question": "The interview question text",
            "category": "DSA / System Design / HR / etc.",
            "difficulty": "easy / medium / hard",
            "hints": ["Optional hint 1"]
        }}
    ]
}}

Make questions realistic and commonly asked in actual interviews.
"""

EVALUATE_ANSWER_PROMPT = """You are an experienced technical interviewer evaluating a candidate's answer.

QUESTION: {question}
CANDIDATE'S ANSWER: {user_answer}

Evaluate the answer and return in JSON format (return ONLY valid JSON, no markdown):
{{
    "score": 7,
    "max_score": 10,
    "feedback": "Detailed feedback on the answer",
    "ideal_answer": "A concise ideal answer for reference",
    "strengths": ["What the candidate did well"],
    "improvements": ["What could be improved"]
}}

Be constructive and educational in your feedback. Score fairly: 1-3 poor, 4-6 average, 7-8 good, 9-10 excellent.
"""
