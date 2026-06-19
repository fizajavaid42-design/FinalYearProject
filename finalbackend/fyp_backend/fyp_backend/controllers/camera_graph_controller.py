from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from models.camera_graph import CameraGraph
from models.cctv_camera import CCTVCamera


# -------------------- CREATE EDGE --------------------
def create_camera_link(db: Session, from_camera_id: int, to_camera_id: int):
    from_camera = db.query(CCTVCamera).filter(CCTVCamera.camera_id == from_camera_id).first()
    to_camera = db.query(CCTVCamera).filter(CCTVCamera.camera_id == to_camera_id).first()

    if not from_camera:
        raise ValueError(f"Source camera with ID {from_camera_id} does not exist")
    if not to_camera:
        raise ValueError(f"Destination camera with ID {to_camera_id} does not exist")
    if from_camera_id == to_camera_id:
        raise ValueError("Camera cannot link to itself")

    existing = db.query(CameraGraph).filter(
        and_(
            CameraGraph.from_camera_id == from_camera_id,
            CameraGraph.to_camera_id == to_camera_id
        )
    ).first()
    if existing:
        from_place = from_camera.place.name if from_camera.place else "Unknown"
        to_place = to_camera.place.name if to_camera.place else "Unknown"
        raise ValueError(f"Link already exists: {from_place} → {to_place}")

    link = CameraGraph(from_camera_id=from_camera_id, to_camera_id=to_camera_id)
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


# -------------------- GET ALL LINKS --------------------
def get_all_camera_links(db: Session):
    return db.query(CameraGraph).options(
        joinedload(CameraGraph.from_camera).joinedload(CCTVCamera.place),
        joinedload(CameraGraph.to_camera).joinedload(CCTVCamera.place)
    ).all()


# -------------------- DELETE LINK --------------------
def delete_camera_link(db: Session, graph_id: int):
    link = db.query(CameraGraph).filter(CameraGraph.graph_id == graph_id).first()

    if not link:
        all_ids = [row.graph_id for row in db.query(CameraGraph.graph_id).all()]
        raise ValueError(f"Link {graph_id} not found. Available IDs: {all_ids}")

    db.delete(link)
    db.commit()
    return True