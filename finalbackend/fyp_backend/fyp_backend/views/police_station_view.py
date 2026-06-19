from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from controllers.police_station_controller import (
    create_police_station,
    get_all_stations,
    get_station_by_id,
    get_police_station_summary,  # ✅ ADD THIS
)

router = APIRouter()


# -------------------- REGISTER POLICE STATION --------------------
@router.post("/police-station")
def register_police_station(
    name: str = Form(...),
    place_id: int = Form(...),
    place_ids: str = Form(...),
    officer_ids: str = Form(""),
    db: Session = Depends(get_db)
):
    """
    Register a new police station with location, assigned areas and officers
    """
    parsed_place_ids = [int(i) for i in place_ids.split(",") if i.strip()]
    parsed_officer_ids = [int(i) for i in officer_ids.split(",") if i.strip()]

    if not parsed_place_ids:
        raise HTTPException(status_code=400, detail="At least one area must be selected.")

    station = create_police_station(
        db,
        name=name,
        place_id=place_id,
        place_ids=parsed_place_ids,
        officer_ids=parsed_officer_ids,
    )

    return {
        "id": station.station_id,
        "name": station.name,
        "place_id": station.place_id,
    }


# -------------------- GET ALL POLICE STATIONS --------------------
@router.get("/police-stations")
def fetch_police_stations(db: Session = Depends(get_db)):
    from sqlalchemy.orm import joinedload
    from models.police_station import PoliceStation

    stations = db.query(PoliceStation).options(
        joinedload(PoliceStation.places),
        joinedload(PoliceStation.officers)
    ).all()

    return [
        {
            "id": s.station_id,
            "name": s.name,
            "place_id": s.place_id,
            "assigned_place_ids": [p.place_id for p in s.places],
            "assigned_officer_ids": [o.user_id for o in s.officers],
        }
        for s in stations
    ]


# -------------------- GET SINGLE POLICE STATION --------------------
@router.get("/police-station/{station_id}")
def fetch_police_station(station_id: int, db: Session = Depends(get_db)):
    station = get_station_by_id(db, station_id)
    if not station:
        raise HTTPException(status_code=404, detail="Police station not found.")
    return {
        "id": station.station_id,
        "name": station.name,
        "place_id": station.place_id,
        "assigned_place_ids": [p.place_id for p in station.places],
        "assigned_officer_ids": [o.user_id for o in station.officers],
    }


# -------------------- STATION SUMMARY --------------------
@router.get("/station-summary/{station_id}")
def station_summary(
    station_id: int,
    db: Session = Depends(get_db),
):
    """
    Get police station report summary + all stations comparison
    """
    result = get_police_station_summary(db, station_id)

    if not result["my_station"]:
        raise HTTPException(status_code=404, detail="Station not found")

    return result