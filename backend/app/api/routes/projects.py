from fastapi import APIRouter, HTTPException, Response, status
from pydantic import BaseModel

router = APIRouter(tags=["projects"])


class ProjectCreateRequest(BaseModel):
    name: str


class Project(BaseModel):
    id: int
    name: str


_PROJECTS: dict[int, Project] = {}
_NEXT_PROJECT_ID = 1


@router.post("", response_model=Project, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreateRequest) -> Project:
    global _NEXT_PROJECT_ID

    project = Project(id=_NEXT_PROJECT_ID, name=payload.name)
    _PROJECTS[project.id] = project
    _NEXT_PROJECT_ID += 1
    return project


@router.get("", response_model=list[Project])
def list_projects() -> list[Project]:
    return list(_PROJECTS.values())


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(id: int) -> Response:
    if id not in _PROJECTS:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    del _PROJECTS[id]
    return Response(status_code=status.HTTP_204_NO_CONTENT)
