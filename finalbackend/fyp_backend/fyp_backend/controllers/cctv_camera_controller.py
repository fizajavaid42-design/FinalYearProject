from sqlalchemy.orm import Session
from models.cctv_camera import CCTVCamera


def create_camera(
    db: Session,
    place_id: int,
    direction: str,
    status: str = "Active"
):
    cam = CCTVCamera(
        place_id=place_id,
        direction=direction,
        status=status
    )
    db.add(cam)
    db.commit()
    db.refresh(cam)
    return cam


def get_all_cameras(db: Session):
    return db.query(CCTVCamera).all()

