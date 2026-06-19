from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from controllers.place_controller import create_place, get_all_places

router = APIRouter()


# Add Place
@router.post("/place")
def add_place(
    name: str = Form(...),
    city: str = Form(...),
    latitude: str = Form(...),
    longitude: str = Form(...),
    db: Session = Depends(get_db)
):
    place = create_place(db, name, city, latitude, longitude)
    return {
        "success": True,
        "place_id": place.place_id,
        "name": place.name,
        "city": place.city,
        "latitude": place.latitude,
        "longitude": place.longitude
    }


# View All Places
@router.get("/places")
def view_places(db: Session = Depends(get_db)):
    places = get_all_places(db)
    return [
        {
            "id": p.place_id,
            "name": p.name,
            "city": p.city,
            "latitude": p.latitude,
            "longitude": p.longitude
        }
        for p in places
    ]
