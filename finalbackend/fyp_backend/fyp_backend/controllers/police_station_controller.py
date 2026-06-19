from sqlalchemy.orm import Session
from models.police_station import PoliceStation, PoliceStationPlace, PoliceStationOfficer
from models.checkpoint import CheckPointOfficer
from models.user import User
from models.report import UserReport, WitnessReport  # ✅ ADD THIS


def create_police_station(db: Session, name: str, place_id: int, place_ids: list[int], officer_ids: list[int]):
    # Create station with its own location
    station = PoliceStation(name=name, place_id=place_id)
    db.add(station)
    db.flush()

    # Link assigned areas
    for pid in place_ids:
        db.add(PoliceStationPlace(station_id=station.station_id, place_id=pid))

    # Link officers — ✅ sirf woh jo kisi station pe assign nahi hain
    for uid in officer_ids:

        # ✅ Check karo already kisi station pe assign hai?
        already_assigned = db.query(PoliceStationOfficer).filter(
            PoliceStationOfficer.user_id == uid
        ).first()

        if already_assigned:
            continue  # Skip — already assigned hai

        # ✅ Sirf Police role wala ho
        officer = db.query(User).filter(
            User.user_id == uid,
            User.role.in_(['police', 'Police'])
        ).first()

        if officer:
            db.add(PoliceStationOfficer(
                station_id=station.station_id,
                user_id=uid
            ))

    db.commit()
    db.refresh(station)
    return station


def get_all_stations(db: Session):
    return db.query(PoliceStation).all()


def get_station_by_id(db: Session, station_id: int):
    return db.query(PoliceStation).filter(
        PoliceStation.station_id == station_id
    ).first()


def get_officers_for_place(db: Session, place_id: int) -> list[int]:
    """Report routing: given a place_id, return officer user_ids who cover it."""
    station_place = db.query(PoliceStationPlace).filter(
        PoliceStationPlace.place_id == place_id
    ).first()

    if not station_place:
        return []

    officers = db.query(PoliceStationOfficer).filter(
        PoliceStationOfficer.station_id == station_place.station_id
    ).all()

    return [o.user_id for o in officers]


def get_unassigned_officers(db: Session):
    """✅ Sirf woh officers jo kisi station ya checkpoint pe assign nahi hain"""
    # 1. Fetch officers assigned to police stations
    station_assigned = [uid[0] for uid in db.query(PoliceStationOfficer.user_id).all()]

    # 2. Fetch officers assigned to checkpoints
    checkpoint_assigned = [uid[0] for uid in db.query(CheckPointOfficer.user_id).all()]

    # 3. Combine both assigned lists
    assigned_ids = list(set(station_assigned + checkpoint_assigned))

    query = db.query(User).filter(
        User.role.in_(['police', 'Police']),
        User.approval_status == 'Approved'
    )

    if assigned_ids:
        query = query.filter(~User.user_id.in_(assigned_ids))

    return query.all()


def get_police_station_by_place(db: Session, place_id: int):
    """
    Kisi bhi place/area ka police station find karo
    """
    if not place_id:
        return None

    station_place = db.query(PoliceStationPlace).filter(
        PoliceStationPlace.place_id == place_id
    ).first()

    if station_place:
        return station_place.station_id

    return None


# ✅ NEW FUNCTION — Station Summary
def get_police_station_summary(db: Session, station_id: int) -> dict:
    """
    Get summary for a specific police station + all stations comparison
    """

    # All police stations
    all_stations = db.query(PoliceStation).all()

    all_stations_summary = []

    for station in all_stations:
        # Theft reports for this station
        theft_total = db.query(UserReport).filter(
            UserReport.police_station_id == station.station_id
        ).count()

        theft_pending = db.query(UserReport).filter(
            UserReport.police_station_id == station.station_id,
            UserReport.status == "Pending"
        ).count()

        theft_recovered = db.query(UserReport).filter(
            UserReport.police_station_id == station.station_id,
            UserReport.status == "Recovered"
        ).count()

        theft_rejected = db.query(UserReport).filter(
            UserReport.police_station_id == station.station_id,
            UserReport.status == "Rejected"
        ).count()

        # Accident reports for this station
        accident_total = db.query(WitnessReport).filter(
            WitnessReport.police_station_id == station.station_id
        ).count()

        accident_pending = db.query(WitnessReport).filter(
            WitnessReport.police_station_id == station.station_id,
            WitnessReport.status == "Pending"
        ).count()

        accident_approved = db.query(WitnessReport).filter(
            WitnessReport.police_station_id == station.station_id,
            WitnessReport.status == "Approved"
        ).count()

        accident_rejected = db.query(WitnessReport).filter(
            WitnessReport.police_station_id == station.station_id,
            WitnessReport.status == "Rejected"
        ).count()

        total_reports = theft_total + accident_total
        total_pending = theft_pending + accident_pending
        total_resolved = theft_recovered + accident_approved
        total_rejected = theft_rejected + accident_rejected

        station_summary = {
            "station_id": station.station_id,
            "station_name": station.name,
            "total_reports": total_reports,
            "theft_reports": theft_total,
            "accident_reports": accident_total,
            "pending": total_pending,
            "resolved": total_resolved,
            "rejected": total_rejected,
        }

        all_stations_summary.append(station_summary)

    # Find my station
    my_station = None
    for s in all_stations_summary:
        if s["station_id"] == station_id:
            my_station = s
            break

    return {
        "my_station": my_station,
        "all_stations": all_stations_summary,
    }