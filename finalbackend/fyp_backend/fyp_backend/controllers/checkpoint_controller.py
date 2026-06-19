from sqlalchemy.orm import Session
from models.checkpoint import CheckPoint, CheckPointCamera, CheckPointOfficer, CheckPointGraph
from models.police_station import PoliceStationOfficer
from models.user import User


# ── Create CheckPoint ─────────────────────────────────────────
def create_checkpoint(
    db: Session,
    name: str,
    place_id: int,
    camera_ids: list[int],
    officer_ids: list[int]
):
    checkpoint = CheckPoint(name=name, place_id=place_id)
    db.add(checkpoint)
    db.flush()

    # Cameras link karo
    for cid in camera_ids:
        db.add(CheckPointCamera(
            checkpoint_id=checkpoint.checkpoint_id,
            camera_id=cid
        ))

    # Officers link karo — sirf unassigned wale
    for uid in officer_ids:
        already = db.query(CheckPointOfficer).filter(
            CheckPointOfficer.user_id == uid
        ).first()

        if already:
            continue

        officer = db.query(User).filter(
            User.user_id == uid,
            User.role.in_(['police', 'Police'])
        ).first()

        if officer:
            db.add(CheckPointOfficer(
                checkpoint_id=checkpoint.checkpoint_id,
                user_id=uid
            ))

    db.commit()
    db.refresh(checkpoint)

    return checkpoint


# ── Get All CheckPoints ───────────────────────────────────────
def get_all_checkpoints(db: Session):
    return db.query(CheckPoint).all()


# ── Get Single CheckPoint ─────────────────────────────────────
def get_checkpoint_by_id(db: Session, checkpoint_id: int):
    return db.query(CheckPoint).filter(
        CheckPoint.checkpoint_id == checkpoint_id
    ).first()


# ── Add Graph Edge (A → B) ────────────────────────────────────
def add_graph_edge(
    db: Session,
    from_id: int,
    to_id: int,
    order: int = 1
):
    existing = db.query(CheckPointGraph).filter(
        CheckPointGraph.from_checkpoint_id == from_id,
        CheckPointGraph.to_checkpoint_id == to_id
    ).first()

    if existing:
        return existing

    edge = CheckPointGraph(
        from_checkpoint_id=from_id,
        to_checkpoint_id=to_id,
        order=order
    )

    db.add(edge)
    db.commit()
    db.refresh(edge)

    return edge


# ── Get Next CheckPoints ──────────────────────────────────────
def get_next_checkpoints(
    db: Session,
    from_checkpoint_id: int,
    depth: int = 2
):
    """
    BFS — depth tak next checkpoints nikalo
    depth=2 matlab next 2 checkpoints
    """

    visited = set()
    current_level = [from_checkpoint_id]
    result = []

    for _ in range(depth):

        next_level = []

        for cp_id in current_level:

            edges = db.query(CheckPointGraph).filter(
                CheckPointGraph.from_checkpoint_id == cp_id
            ).order_by(CheckPointGraph.order).all()

            for edge in edges:

                if edge.to_checkpoint_id not in visited:

                    visited.add(edge.to_checkpoint_id)

                    next_level.append(edge.to_checkpoint_id)

                    result.append(edge.to_checkpoint_id)

        current_level = next_level

    return result


# ── Alert flow: camera_id se officers nikalo ─────────────────
def get_officers_by_camera(
    db: Session,
    camera_id: int
) -> list[int]:

    """
    Camera ID dena — us camera ke checkpoint ke officers return karega
    """

    cam_link = db.query(CheckPointCamera).filter(
        CheckPointCamera.camera_id == camera_id
    ).first()

    if not cam_link:
        return []

    officers = db.query(CheckPointOfficer).filter(
        CheckPointOfficer.checkpoint_id == cam_link.checkpoint_id
    ).all()

    return [o.user_id for o in officers]


# ── Alert flow: next checkpoint officers bhi nikalo ──────────
def get_alert_targets(
    db: Session,
    camera_id: int,
    depth: int = 2
) -> dict:

    """
    Camera se:
    1. Current checkpoint officers
    2. Next 2 checkpoints + unke officers
    """

    cam_link = db.query(CheckPointCamera).filter(
        CheckPointCamera.camera_id == camera_id
    ).first()

    if not cam_link:
        return {
            "current_officers": [],
            "next_checkpoints": []
        }

    cp_id = cam_link.checkpoint_id

    # Current officers
    current_officers = [
        o.user_id for o in db.query(CheckPointOfficer).filter(
            CheckPointOfficer.checkpoint_id == cp_id
        ).all()
    ]

    # Next checkpoints
    next_cp_ids = get_next_checkpoints(
        db,
        cp_id,
        depth=depth
    )

    next_checkpoints = []

    for ncp_id in next_cp_ids:

        officers = [
            o.user_id for o in db.query(CheckPointOfficer).filter(
                CheckPointOfficer.checkpoint_id == ncp_id
            ).all()
        ]

        next_checkpoints.append({
            "checkpoint_id": ncp_id,
            "officers": officers
        })

    return {
        "triggered_checkpoint": cp_id,
        "current_officers": current_officers,
        "next_checkpoints": next_checkpoints
    }


# ── Unassigned Officers ───────────────────────────────────────
def get_unassigned_officers(db: Session):

    # 1. Fetch officers assigned to checkpoints
    checkpoint_assigned = [
        uid[0] for uid in db.query(
            CheckPointOfficer.user_id
        ).all()
    ]

    # 2. Fetch officers assigned to police stations
    station_assigned = [
        uid[0] for uid in db.query(
            PoliceStationOfficer.user_id
        ).all()
    ]

    # 3. Combine both assigned lists
    assigned_ids = list(set(checkpoint_assigned + station_assigned))

    query = db.query(User).filter(
        User.role.in_(['police', 'Police']),
        User.approval_status == 'Approved'
    )

    if assigned_ids:
        query = query.filter(~User.user_id.in_(assigned_ids))

    return query.all()