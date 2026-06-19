from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
from database import get_db
from controllers.car_tracking_controller import (
    search_cars_by_plate,
    get_car_route,
    get_detection_image,
)

router = APIRouter(prefix="/car-tracking", tags=["Car Tracking"])


@router.get("/search")
def search_cars(
    plate: str = Query(..., min_length=2),
    db: Session = Depends(get_db),
):
    """
    Plate number se cars search karo
    Example: /car-tracking/search?plate=ABC
    """
    results = search_cars_by_plate(db, plate)
    return {
        "total": len(results),
        "cars": results,
    }


@router.get("/route/{no_plate}")
def get_route(
    no_plate: str,
    db: Session = Depends(get_db),
):
    """
    Poori car route nikalo
    Example: /car-tracking/route/ABC-123
    """
    result = get_car_route(db, no_plate)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.get("/image/{detection_id}")
def get_image(
    detection_id: int,
    db: Session = Depends(get_db),
):
    """
    Detection image download karo
    """
    image_path = get_detection_image(db, detection_id)
    if image_path and os.path.exists(image_path):
        return FileResponse(image_path, media_type="image/jpeg")
    raise HTTPException(status_code=404, detail="Image not found")