from app.database import SessionLocal
from app.models.job import Job


SAMPLE_JOBS = [
    {
        "title": "Junior Software Engineer",
        "company_name": "Northstar Labs",
        "location": "Bengaluru, India · Hybrid",
        "description": "Sample development role for an early-career engineer. Work with a small product team to build and maintain web services, write clear tests, and take features from review to release. Ideal candidates have a strong programming foundation and enjoy learning from feedback.",
        "required_skills": "Python, JavaScript, REST APIs, SQL, Git",
        "application_url": "https://example.com/careers/junior-software-engineer",
    },
    {
        "title": "Graduate Data Analyst",
        "company_name": "Leafline Insights",
        "location": "Pune, India · On-site",
        "description": "Sample graduate opportunity supporting teams with reliable reporting and practical analysis. Prepare datasets, build dashboards, document assumptions, and explain findings to non-technical partners. This role is suited to a recent graduate who is curious about how data informs decisions.",
        "required_skills": "SQL, Excel, Python, Data Visualization, Communication",
        "application_url": "https://example.com/careers/graduate-data-analyst",
    },
    {
        "title": "Associate Product Designer",
        "company_name": "Cedar & Coast Studio",
        "location": "Remote · India",
        "description": "Sample entry-level product design role working alongside product managers and engineers. Help research user needs, map flows, create accessible interface concepts, and refine prototypes through critique and usability feedback.",
        "required_skills": "Figma, Wireframing, Prototyping, User Research, Accessibility",
        "application_url": "https://example.com/careers/associate-product-designer",
    },
    {
        "title": "Software Quality Engineer Intern",
        "company_name": "Brightpath Systems",
        "location": "Hyderabad, India · Hybrid",
        "description": "Sample internship for a detail-oriented student interested in software quality. Collaborate with developers to write test cases, reproduce issues, exercise APIs, and improve the team’s automated testing coverage.",
        "required_skills": "Manual Testing, Python, API Testing, Git, Attention to Detail",
        "application_url": "https://example.com/careers/quality-engineer-intern",
    },
    {
        "title": "Cloud Support Associate",
        "company_name": "Westbridge Technology",
        "location": "Chennai, India · Hybrid",
        "description": "Sample early-career role helping customers troubleshoot cloud and Linux environments. Investigate service issues, write clear incident notes, and work with engineering teams to improve support documentation and common diagnostics.",
        "required_skills": "Linux, Networking, Cloud Fundamentals, Python, Customer Support",
        "application_url": "https://example.com/careers/cloud-support-associate",
    },
]


def seed_jobs():
    """Insert sample listings once, without duplicating them on later starts."""
    with SessionLocal() as db:
        for values in SAMPLE_JOBS:
            exists = db.query(Job.id).filter(
                Job.title == values["title"],
                Job.company_name == values["company_name"],
            ).first()
            if not exists:
                db.add(Job(**values))
        db.commit()
