from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.orm import Session, joinedload
from database import get_db
from controllers.checkpoint_controller import (
    create_checkpoint,
    get_all_checkpoints,
    get_checkpoint_by_id,
    add_graph_edge,
    get_alert_targets,
    get_unassigned_officers,
)
from models.checkpoint import CheckPoint


router = APIRouter()


# ── Create CheckPoint ─────────────────────────────────────────
@router.post("/checkpoint")
def register_checkpoint(
    name: str = Form(...),
    place_id: int = Form(...),
    camera_ids: str = Form(""),   # comma separated: "1,2,3"
    officer_ids: str = Form(""),  # comma separated: "4,5"
    db: Session = Depends(get_db)
):

    parsed_camera_ids = [
        int(i) for i in camera_ids.split(",")
        if i.strip()
    ]

    parsed_officer_ids = [
        int(i) for i in officer_ids.split(",")
        if i.strip()
    ]

    checkpoint = create_checkpoint(
        db,
        name=name,
        place_id=place_id,
        camera_ids=parsed_camera_ids,
        officer_ids=parsed_officer_ids,
    )

    return {
        "id": checkpoint.checkpoint_id,
        "name": checkpoint.name,
        "place_id": checkpoint.place_id,
    }


@router.get("/checkpoints/debug-graph")
def debug_graph(db: Session = Depends(get_db)):
    from models.checkpoint import CheckPointGraph, CheckPointOfficer, CheckPointCamera
    cps = db.query(CheckPoint).all()
    edges = db.query(CheckPointGraph).all()
    officers = db.query(CheckPointOfficer).all()
    cameras = db.query(CheckPointCamera).all()
    return {
        "checkpoints": [{"id": c.checkpoint_id, "name": c.name} for c in cps],
        "edges": [{"from": e.from_checkpoint_id, "to": e.to_checkpoint_id, "order": e.order} for e in edges],
        "officers": [{"checkpoint_id": o.checkpoint_id, "user_id": o.user_id} for o in officers],
        "cameras": [{"checkpoint_id": c.checkpoint_id, "camera_id": c.camera_id} for c in cameras],
    }


# ── Get All CheckPoints ───────────────────────────────────────
@router.get("/checkpoints")
def fetch_checkpoints(
    db: Session = Depends(get_db)
):

    checkpoints = db.query(CheckPoint).options(

        joinedload(CheckPoint.cameras),

        joinedload(CheckPoint.officers),

        joinedload(CheckPoint.outgoing_edges)

    ).all()

    return [

        {
            "id": c.checkpoint_id,

            "name": c.name,

            "place_id": c.place_id,

            "linked_camera_ids": [
                cam.camera_id
                for cam in c.cameras
            ],

            "linked_officer_ids": [
                o.user_id
                for o in c.officers
            ],

            "next_checkpoint_ids": [
                e.to_checkpoint_id
                for e in c.outgoing_edges
            ],
        }

        for c in checkpoints
    ]


# ── Get Single CheckPoint ─────────────────────────────────────
@router.get("/checkpoint/{checkpoint_id}")
def fetch_checkpoint(
    checkpoint_id: int,
    db: Session = Depends(get_db)
):

    cp = get_checkpoint_by_id(
        db,
        checkpoint_id
    )

    if not cp:
        raise HTTPException(
            status_code=404,
            detail="CheckPoint not found."
        )

    return {

        "id": cp.checkpoint_id,

        "name": cp.name,

        "place_id": cp.place_id,

        "linked_camera_ids": [
            cam.camera_id
            for cam in cp.cameras
        ],

        "linked_officer_ids": [
            o.user_id
            for o in cp.officers
        ],

        "next_checkpoint_ids": [
            e.to_checkpoint_id
            for e in cp.outgoing_edges
        ],
    }


# ── Add Graph Edge ────────────────────────────────────────────
@router.post("/checkpoint-graph")
def create_graph_edge(

    from_checkpoint_id: int = Form(...),

    to_checkpoint_id: int = Form(...),

    order: int = Form(1),

    db: Session = Depends(get_db)

):
    """
    A → B connection banao
    order=1 matlab directly next
    order=2 matlab 2nd next
    """

    if from_checkpoint_id == to_checkpoint_id:

        raise HTTPException(
            status_code=400,
            detail="Same CheckPoint connect nahi kar sakte."
        )

    edge = add_graph_edge(
        db,
        from_checkpoint_id,
        to_checkpoint_id,
        order
    )

    return {
        "from": edge.from_checkpoint_id,
        "to": edge.to_checkpoint_id,
        "order": edge.order
    }


# ── Alert Targets ─────────────────────────────────────────────
@router.get("/checkpoint-alert/{camera_id}")
def get_checkpoint_alert(

    camera_id: int,

    depth: int = 2,

    db: Session = Depends(get_db)

):
    """
    Camera ID do
    current + next checkpoints ke officers milenge

    depth=2 matlab
    next 2 checkpoints tak alert jayega
    """

    result = get_alert_targets(
        db,
        camera_id,
        depth=depth
    )

    if (
        not result["current_officers"]
        and
        not result["next_checkpoints"]
    ):

        raise HTTPException(
            status_code=404,
            detail="Is camera se koi CheckPoint link nahi hai."
        )

    return result


@router.get("/checkpoints/unassigned-officers")
def fetch_unassigned_checkpoint_officers(db: Session = Depends(get_db)):
    """Fetch unassigned officers specifically for checkpoints"""
    officers = get_unassigned_officers(db)
    return [
        {
            "user_id": o.user_id,
            "name": o.name,
            "designation": o.designation
        }
        for o in officers
    ]