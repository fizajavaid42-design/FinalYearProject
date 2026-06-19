import os, shutil
from sqlalchemy.orm import Session
from models.report import UserReport, WitnessReport
from models.registration_vehicle import Vehicle, Registration
from models.place import Place
from models.recovery import Recovery
from sqlalchemy.sql import func

UPLOAD_DIR = "uploads/accident_images"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ─── Helper: Get Police Station by Place ─────────────────────────────────────

def get_police_station_by_place(db: Session, place_id: int):
    if not place_id:
        return None

    from models.police_station import PoliceStationPlace
    station_place = db.query(PoliceStationPlace).filter(
        PoliceStationPlace.place_id == place_id
    ).first()

    if station_place:
        return station_place.station_id

    return None


# ─── CREATE: Theft Report ─────────────────────────────────────────────────────

def create_theft_report(
        db: Session,
        user_id: int,
        vehicle_id: int,
        place_id: int,
        description: str,
        contact: str,
) -> dict:
    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == vehicle_id,
        Vehicle.user_id == user_id,
    ).first()
    if not vehicle:
        return {"error": "Vehicle not found or does not belong to you"}

    police_station_id = None
    if place_id:
        police_station_id = get_police_station_by_place(db, place_id)

    report = UserReport(
        description=description,
        status="Pending",
        contact=contact,
        incident_type="Theft",
        place_id=place_id,
        vehicle_id=vehicle_id,
        police_station_id=police_station_id,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return {
        "report_id": report.user_report_id,
        "incident_type": report.incident_type,
        "status": report.status,
        "message": "Theft report submitted successfully",
    }


# ─── CREATE: Accident / Witness Report ───────────────────────────────────────

def create_accident_report(
        db: Session,
        user_id: int,
        no_plate: str,
        color: str,
        company: str,
        vehicle_type: str,
        generation: str,
        model: str,
        description: str,
        place_id: int | None,
        image_file=None,
) -> dict:
    image_path = None
    if image_file:
        file_name = f"accident_{image_file.filename}"
        image_path = os.path.join(UPLOAD_DIR, file_name)
        with open(image_path, "wb") as f:
            shutil.copyfileobj(image_file.file, f)

    police_station_id = None
    if place_id:
        police_station_id = get_police_station_by_place(db, place_id)

    report = WitnessReport(
        car_image_path=image_path,
        no_plate=no_plate or None,
        color=color or None,
        company=company or None,
        model=model or None,
        description=description,
        place_id=place_id or None,
        vehicle_type=vehicle_type or None,
        generation=generation or None,
        user_id=user_id,
        status="Pending",
        police_station_id=police_station_id,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return {
        "report_id": report.witness_report_id,
        "message": "Accident report submitted successfully",
    }


# ─── READ: All reports with vehicle details ──────────────────────────────────

def get_all_reports_with_vehicle(db: Session) -> list:
    result = []

    theft_reports = db.query(UserReport).order_by(UserReport.date.desc()).all()
    for r in theft_reports:
        vehicle_info = None
        if r.vehicle:
            reg = None
            if r.vehicle.reg_id:
                reg = db.query(Registration).filter(
                    Registration.reg_id == r.vehicle.reg_id
                ).first()
            vehicle_info = {
                "vehicle_id": r.vehicle.vehicle_id,
                "company": r.vehicle.company,
                "model": r.vehicle.model,
                "car_year": r.vehicle.car_year,
                "color": r.vehicle.color,
                "engine_no": r.vehicle.engine_no,
                "chassis_no": r.vehicle.chassis_no,
                "no_plate": reg.no_plate if reg else None,
            }
        result.append({
            "report_id": r.user_report_id,
            "incident_type": r.incident_type,
            "description": r.description,
            "status": r.status,
            "contact": r.contact,
            "date": str(r.date) if r.date else None,
            "place_name": r.place.name if r.place else None,
            "vehicle_id": r.vehicle_id,
            "vehicle": vehicle_info,
            "is_witness": False,
            "police_station_id": r.police_station_id,
        })

    accident_reports = db.query(WitnessReport).order_by(WitnessReport.witness_report_id.desc()).all()
    for r in accident_reports:
        recovery = db.query(Recovery).filter(Recovery.witness_report_id == r.witness_report_id).first()
        result.append({
            "report_id": r.witness_report_id,
            "incident_type": "Accident",
            "description": r.description,
            "status": getattr(r, 'status', 'Pending'),
            "contact": None,
            "date": str(r.date) if hasattr(r, 'date') and r.date else None,
            "place_name": r.place.name if r.place else None,
            "vehicle_id": None,
            "vehicle": {
                "no_plate": r.no_plate,
                "company": r.company,
                "model": r.model,
                "color": r.color,
                "generation": r.generation,
            },
            "car_image_path": r.car_image_path,
            "is_witness": True,
            "is_recovered": recovery is not None,
            "recovery_id": recovery.recovery_id if recovery else None,
            "police_station_id": r.police_station_id,
        })

    return result


# ─── READ: Theft reports by user ─────────────────────────────────────────────

def get_reports_by_user(db: Session, user_id: int) -> list:
    reports = (
        db.query(UserReport)
        .join(Vehicle, UserReport.vehicle_id == Vehicle.vehicle_id)
        .filter(Vehicle.user_id == user_id)
        .order_by(UserReport.date.desc())
        .all()
    )
    result = []
    for r in reports:
        vehicle_info = None
        if r.vehicle:
            reg = None
            if r.vehicle.reg_id:
                reg = db.query(Registration).filter(
                    Registration.reg_id == r.vehicle.reg_id
                ).first()
            vehicle_info = {
                "vehicle_id": r.vehicle.vehicle_id,
                "company": r.vehicle.company,
                "model": r.vehicle.model,
                "car_year": r.vehicle.car_year,
                "color": r.vehicle.color,
                "engine_no": r.vehicle.engine_no,
                "chassis_no": r.vehicle.chassis_no,
                "no_plate": reg.no_plate if reg else None,
            }
        result.append({
            "report_id": r.user_report_id,
            "incident_type": r.incident_type,
            "description": r.description,
            "status": r.status,
            "contact": r.contact,
            "date": str(r.date) if r.date else None,
            "place_name": r.place.name if r.place else None,
            "vehicle_id": r.vehicle_id,
            "vehicle": vehicle_info,
        })
    return result


# ─── READ: Witness reports by user ───────────────────────────────────────────

def get_witness_reports_by_user(db: Session, user_id: int) -> list:
    reports = (
        db.query(WitnessReport)
        .filter(WitnessReport.user_id == user_id)
        .order_by(WitnessReport.witness_report_id.desc())
        .all()
    )
    result = []
    for r in reports:
        result.append({
            "witness_report_id": r.witness_report_id,
            "no_plate": r.no_plate,
            "color": r.color,
            "company": r.company,
            "model": r.model,
            "description": r.description,
            "car_image_path": r.car_image_path,
            "place_name": r.place.name if r.place else None,
            "status": getattr(r, 'status', 'Pending'),
            "date": str(r.date) if hasattr(r, 'date') and r.date else None,
        })
    return result


# ─── READ: Report count ───────────────────────────────────────────────────────

def get_report_count_by_user(db: Session, user_id: int) -> int:
    theft_count = (
        db.query(UserReport)
        .join(Vehicle, UserReport.vehicle_id == Vehicle.vehicle_id)
        .filter(Vehicle.user_id == user_id)
        .count()
    )
    witness_count = (
        db.query(WitnessReport)
        .filter(WitnessReport.user_id == user_id)
        .count()
    )
    return theft_count + witness_count


# ─── READ: Single report ─────────────────────────────────────────────────────

def get_report_by_id(db: Session, report_id: int):
    return db.query(UserReport).filter(
        UserReport.user_report_id == report_id
    ).first()


# ─── READ: All reports basic ─────────────────────────────────────────────────

def get_all_reports(db: Session) -> list:
    return get_all_reports_with_vehicle(db)


# ─── UPDATE: Report status for Theft reports ─────────────────────────────────

def update_report_status(db: Session, report_id: int, status: str) -> dict:
    report = db.query(UserReport).filter(
        UserReport.user_report_id == report_id
    ).first()
    if not report:
        return {"error": "Report not found"}

    # ✅ Allow: Recovered, Rejected, Pending
    if status not in ("Recovered", "Rejected", "Pending"):
        return {"error": "Invalid status"}

    report.status = status
    db.commit()
    return {"message": f"Status updated to {status}"}


# ─── UPDATE: Status for Witness reports ─────────────────────────────────────

def update_witness_report_status(db: Session, report_id: int, status: str) -> dict:
    report = db.query(WitnessReport).filter(
        WitnessReport.witness_report_id == report_id
    ).first()
    if not report:
        return {"error": "Witness report not found"}

    # ✅ Allow: Approved, Rejected, Recovered, Pending
    if status not in ("Approved", "Rejected", "Recovered", "Pending"):
        return {"error": "Invalid status"}

    if hasattr(report, 'status'):
        report.status = status
    db.commit()
    return {"message": f"Status updated to {status}"}


# ─── CREATE: Recovery for witness report ─────────────────────────────────────

def create_recovery_for_witness(db: Session, witness_report_id: int, user_id: int) -> dict:
    existing = db.query(Recovery).filter(
        Recovery.witness_report_id == witness_report_id
    ).first()
    if existing:
        return {"error": "Recovery already exists", "recovery_id": existing.recovery_id}
    new_recovery = Recovery(
        witness_report_id=witness_report_id,
        user_id=user_id,
        recovery_date=func.now()
    )
    db.add(new_recovery)
    db.commit()
    db.refresh(new_recovery)
    return {
        "message": "Recovery created successfully",
        "recovery_id": new_recovery.recovery_id
    }


# ─── READ: Reports by police officer ─────────────────────────────────────────

def get_reports_by_police_officer(db: Session, officer_user_id: int):
    from models.police_station import PoliceStationOfficer

    officer_station = db.query(PoliceStationOfficer).filter(
        PoliceStationOfficer.user_id == officer_user_id
    ).first()

    if not officer_station:
        return {
            "theft_reports": [],
            "accident_reports": [],
            "message": "You are not assigned to any police station"
        }

    station_id = officer_station.station_id

    theft_reports = db.query(UserReport).filter(
        UserReport.police_station_id == station_id
    ).order_by(UserReport.date.desc()).all()

    accident_reports = db.query(WitnessReport).filter(
        WitnessReport.police_station_id == station_id
    ).order_by(WitnessReport.witness_report_id.desc()).all()

    return {
        "theft_reports": theft_reports,
        "accident_reports": accident_reports,
        "station_id": station_id,
        "message": f"Showing reports for your station"
    }


# ─── DELETE: Report ─────────────────────────────────────────────────────────

def delete_report(db: Session, report_id: int) -> dict:
    report = db.query(UserReport).filter(
        UserReport.user_report_id == report_id
    ).first()
    if not report:
        return {"error": "Report not found"}
    db.delete(report)
    db.commit()
    return {"message": "Report deleted"}