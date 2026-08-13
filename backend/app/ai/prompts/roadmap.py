"""Prompt template for learning roadmap generation."""

ROADMAP_PROMPT = """You are a senior tech career mentor creating personalized learning roadmaps.

Create a week-by-week learning roadmap based on the following:

TARGET ROLE: {target_role}
CURRENT SKILLS: {current_skills}
SKILL GAPS: {skill_gaps}
AVAILABLE WEEKS: {weeks}

RELEVANT LEARNING RESOURCES FROM KNOWLEDGE BASE:
{rag_context}

Return your roadmap in the following JSON format (return ONLY valid JSON, no markdown):
{{
    "title": "Learning Roadmap: [Target Role]",
    "description": "Brief description of the roadmap",
    "estimated_weeks": {weeks},
    "milestones": [
        {{
            "week": 1,
            "title": "Week 1: Foundation Setup",
            "description": "What to learn and achieve this week",
            "tasks": [
                "Complete Python basics course",
                "Set up development environment",
                "Build a simple CLI project"
            ],
            "resources": [
                {{"title": "Resource Name", "url": "https://example.com", "type": "course"}}
            ]
        }}
    ],
    "projects": [
        {{
            "title": "Project Name",
            "description": "What to build",
            "skills_covered": ["Python", "FastAPI"],
            "difficulty": "intermediate"
        }}
    ]
}}

Make the roadmap practical, progressive, and achievable. Focus on hands-on learning with real projects.
"""
