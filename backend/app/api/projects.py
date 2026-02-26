from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Project, User
from app.schemas import ProjectCreate, ProjectResponse
from app.security import get_current_user

projects_router = APIRouter(tags=["projects"])


@projects_router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Project:
    project = Project(name=payload.name, description=payload.description, owner_id=current_user.id)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@projects_router.get("", response_model=list[ProjectResponse])
def list_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[Project]:
    return db.query(Project).filter(Project.owner_id == current_user.id).all()


@projects_router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    db.delete(project)
    db.commit()
    return None
