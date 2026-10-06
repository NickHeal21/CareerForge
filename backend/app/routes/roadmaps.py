from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.ai.gemini import GeminiUnavailableError, generate_roadmap
from app.dependencies import get_current_user, get_db
from app.models.readiness_analysis import ReadinessAnalysis
from app.models.roadmap import Roadmap, RoadmapItem
from app.models.user import User
from app.schemas.roadmap import RoadmapCreate, RoadmapItemUpdate, RoadmapResponse

router = APIRouter(tags=["roadmaps"])


def roadmap_query(db: Session):
    return db.query(Roadmap).options(
        joinedload(Roadmap.job),
        joinedload(Roadmap.resume),
        joinedload(Roadmap.readiness_analysis),
        joinedload(Roadmap.items),
    )


def owned_roadmap(roadmap_id: int, user: User, db: Session) -> Roadmap:
    roadmap = roadmap_query(db).filter(Roadmap.id == roadmap_id, Roadmap.user_id == user.id).first()
    if roadmap is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap not found.")
    return roadmap


@router.post("", response_model=RoadmapResponse, status_code=status.HTTP_201_CREATED)
def create_roadmap(
    body: RoadmapCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    analysis = db.query(ReadinessAnalysis).options(
        joinedload(ReadinessAnalysis.job), joinedload(ReadinessAnalysis.resume)
    ).filter(
        ReadinessAnalysis.id == body.readiness_analysis_id,
        ReadinessAnalysis.user_id == current_user.id,
    ).first()
    if analysis is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Readiness analysis not found.")

    existing = roadmap_query(db).filter(Roadmap.readiness_analysis_id == analysis.id).first()
    if existing:
        return existing

    try:
        result = generate_roadmap(
            readiness_percentage=analysis.readiness_percentage,
            missing_skills=analysis.missing_skills,
            weaknesses=analysis.weaknesses,
            recommendations=analysis.recommendations,
            job_title=analysis.job.title,
            company_name=analysis.job.company_name,
            required_skills=analysis.job.required_skills,
        )
    except GeminiUnavailableError as exc:
        configured = "not configured" in str(exc).lower()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE if configured else status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    roadmap = Roadmap(
        user_id=current_user.id,
        resume_id=analysis.resume_id,
        job_id=analysis.job_id,
        readiness_analysis_id=analysis.id,
        title=result.title,
        items=[
            RoadmapItem(
                title=item.title,
                description=item.description,
                estimated_duration=item.estimated_duration,
                completed=False,
                order_index=index,
            )
            for index, item in enumerate(result.items, start=1)
        ],
    )
    db.add(roadmap)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = roadmap_query(db).filter(Roadmap.readiness_analysis_id == analysis.id).first()
        if existing:
            return existing
        raise
    return roadmap_query(db).filter(Roadmap.id == roadmap.id).first()


@router.get("", response_model=list[RoadmapResponse])
def list_roadmaps(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return roadmap_query(db).filter(Roadmap.user_id == current_user.id).order_by(
        Roadmap.created_at.desc(), Roadmap.id.desc()
    ).all()


@router.get("/{roadmap_id}", response_model=RoadmapResponse)
def get_roadmap(
    roadmap_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return owned_roadmap(roadmap_id, current_user, db)


@router.patch("/{roadmap_id}/items/{item_id}", response_model=RoadmapResponse)
def update_roadmap_item(
    roadmap_id: int,
    item_id: int,
    body: RoadmapItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    roadmap = owned_roadmap(roadmap_id, current_user, db)
    item = next((item for item in roadmap.items if item.id == item_id), None)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap item not found.")
    item.completed = body.completed
    db.commit()
    return owned_roadmap(roadmap.id, current_user, db)
