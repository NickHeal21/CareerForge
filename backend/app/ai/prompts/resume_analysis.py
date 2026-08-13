"""Prompt template for resume analysis and ATS scoring."""

RESUME_ANALYSIS_PROMPT = """You are an expert resume analyst and ATS (Applicant Tracking System) specialist.

Analyze the following resume text and extract structured information.

RESUME TEXT:
{resume_text}

Return your analysis in the following JSON format (return ONLY valid JSON, no markdown):
{{
    "skills": [
        {{"name": "Python", "category": "Programming Language", "proficiency": "advanced"}},
        {{"name": "React", "category": "Frontend", "proficiency": "intermediate"}}
    ],
    "experience": [
        {{"title": "Software Developer", "company": "Example Corp", "duration": "2 years"}}
    ],
    "education": [
        {{"degree": "B.Tech Computer Science", "institution": "Example University", "year": "2024"}}
    ],
    "ats_score": 72,
    "ats_feedback": [
        "Good use of action verbs",
        "Missing quantified achievements",
        "Consider adding more technical keywords"
    ],
    "summary": "Brief 2-line summary of the candidate's profile"
}}

Scoring criteria for ATS score (0-100):
- Keywords and skills relevance: 25 points
- Formatting and structure: 20 points
- Quantified achievements: 20 points
- Action verbs usage: 15 points
- Education and certifications: 10 points
- Overall clarity: 10 points
"""
