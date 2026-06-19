from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from controllers.cctv_camera_controller import create_camera, get_all_cameras

router = APIRouter()

# -------------------- ADD CAMERA --------------------
@router.post("/camera")
def add_camera(
    place_id: int = Form(...),
    direction: str = Form(...),
    status: str = Form("Active"),
    db: Session = Depends(get_db)
):
    """
    Add a new camera
    """
    cam = create_camera(db, place_id, direction, status)
    return {
        "id": cam.camera_id,
        "place_id": cam.place_id,
        "direction": cam.direction,
        "status": cam.status
    }


# -------------------- GET ALL CAMERAS --------------------
@router.get("/cameras")
def fetch_cameras(db: Session = Depends(get_db)):
    from sqlalchemy.orm import joinedload
    from models.cctv_camera import CCTVCamera

    cams = db.query(CCTVCamera).options(joinedload(CCTVCamera.place)).all()

    return [
        {
            "id": c.camera_id,
            "place_id": c.place_id,
            "place": c.place.name if c.place else "Unknown Place",

            # ✅ FIXED LINE
            "direction": f"Camera Direction: {c.direction}" if c.direction else "Unknown",

            "status": c.status
        }
        for c in cams
    ]