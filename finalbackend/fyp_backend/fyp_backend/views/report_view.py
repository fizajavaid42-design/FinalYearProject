from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from pydantic import BaseModel

from controllers.report_controller import (
    create_theft_report,
    create_accident_report,
    get_reports_by_user,
    get_witness_reports_by_user,
    get_report_count_by_user,
    get_report_by_id,
    get_all_reports_with_vehicle,
    update_report_status,
    delete_report,
)

from models.report import UserReport, WitnessReport
from models.recovery import Recovery
from models.police_station import PoliceStationOfficer
from sqlalchemy.sql import func

router = APIRouter(prefix="/reports", tags=["Reports"])


class StatusUpdateModel(BaseModel):
    status: str


# ─── CREATE: Theft Report ─────────────────────────────────────────────────────
@router.post("/theft")
async def theft_report(
        user_id: int = Form(...),
        vehicle_id: int = Form(...),
        place_id: int = Form(...),
        description: str = Form(...),
        contact: str = Form(...),
        db: Session = Depends(get_db),
):
    result = create_theft_report(
        db, user_id, vehicle_id, place_id, description, contact
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


# ─── CREATE: Accident / Witness Report ───────────────────────────────────────
@router.post("/accident")
async def accident_report(
        user_id: int = Form(None),
        no_plate: Optional[str] = Form(None),
        color: Optional[str] = Form(None),
        company: Optional[str] = Form(None),
        model: Optional[str] = Form(None),
        vehicle_type: Optional[str] = Form(None),  # ✅ YEH ADD KARO
        generation: Optional[str] = Form(None),  # ✅ NAYA
        description: str = Form(...),
        place_id: Optional[int] = Form(None),
        car_image: Optional[UploadFile] = File(None),
        db: Session = Depends(get_db),
):
    result = create_accident_report(
        db=db,
        user_id=user_id,
        no_plate=no_plate or "",
        color=color or "",
        company=company or "",
        model=model or "",
        description=description,
        vehicle_type=vehicle_type or "",  # ✅ YEH ADD KARO
        generation=generation or "",  # ✅ NAYA
        place_id=place_id,
        image_file=car_image,
    )
    return result


# ─── READ: All reports ────────────────────────────────────────────────────────
@router.get("/all")
def all_reports(db: Session = Depends(get_db)):
    return get_all_reports_with_vehicle(db)


# ─── READ: Theft reports by user ─────────────────────────────────────────────
@router.get("/user/{user_id}")
def user_reports(user_id: int, db: Session = Depends(get_db)):
    return get_reports_by_user(db, user_id)


# ─── READ: Witness reports by user ───────────────────────────────────────────
@router.get("/witness/user/{user_id}")
def witness_reports(user_id: int, db: Session = Depends(get_db)):
    reports = db.query(WitnessReport).filter(WitnessReport.user_id == user_id).all()
    result = []
    for r in reports:
        recovery = db.query(Recovery).filter(Recovery.witness_report_id == r.witness_report_id).first()
        final_status = r.status if r.status else "Pending"
        if recovery and final_status != "Recovered":
            final_status = "Recovered"
            r.status = "Recovered"
            db.commit()
        result.append({
            "witness_report_id": r.witness_report_id,
            "no_plate": r.no_plate,
            "color": r.color,
            "company": r.company,
            "model": r.model,
            "generation": r.generation,  # ✅ YEH LINE ADD KARO
            "description": r.description,
            "car_image_path": r.car_image_path,
            "vehicle_type": r.vehicle_type,
            "place_name": r.place.name if r.place else None,
            "status": final_status,
            "is_recovered": recovery is not None,

            "date": str(r.date) if r.date else None,
        })
    return result


# ─── READ: Report count ───────────────────────────────────────────────────────
@router.get("/count/{user_id}")
def report_count(user_id: int, db: Session = Depends(get_db)):
    return {"count": get_report_count_by_user(db, user_id)}


# ─── READ: Single Theft Report ────────────────────────────────────────────────
@router.get("/{report_id}")
def single_report(report_id: int, db: Session = Depends(get_db)):
    report = get_report_by_id(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return {
        "report_id": report.user_report_id,
        "incident_type": report.incident_type,
        "description": report.description,
        "status": report.status,
        "contact": report.contact,
        "date": str(report.date) if report.date else None,
        "place_name": report.place.name if report.place else None,
    }


# ─── READ: Single Witness Report ─────────────────────────────────────────────
@router.get("/witness/{report_id}")
def single_witness_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(WitnessReport).filter(
        WitnessReport.witness_report_id == report_id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Witness report not found")
    recovery = db.query(Recovery).filter(Recovery.witness_report_id == report_id).first()
    final_status = report.status if report.status else "Pending"
    if recovery and final_status != "Recovered":
        final_status = "Recovered"
    return {
        "report_id": report.witness_report_id,
        "description": report.description,
        "status": final_status,
        "place_name": report.place.name if report.place else None,
        "vehicle": {
            "no_plate": report.no_plate,
            "company": report.company,
            "model": report.model,
            "generation": report.generation,  # ✅ YEH LINE ADD KARO
            "color": report.color,
    "vehicle_type": report.vehicle_type,  # ✅ YEH ADD KARO
        },
        "car_image_path": report.car_image_path,
        "is_recovered": recovery is not None,
        "date": str(report.date) if report.date else None,
    }


# ─── UPDATE: Status ──────────────────────────────────────────────────────────
@router.patch("/{report_id}/status")
def update_status(
        report_id: int,
        status: str = Form(...),
        is_witness: bool = Form(False),
        db: Session = Depends(get_db),
):
    if is_witness:
        report = db.query(WitnessReport).filter(
            WitnessReport.witness_report_id == report_id
        ).first()
        if not report:
            raise HTTPException(status_code=404, detail="Witness report not found")
        if hasattr(report, 'status'):
            report.status = status
        db.commit()
        print(f"✅ Witness report {report_id} status updated to {status}")

        # ✅ Create new recovery for "Recovered" status
        if status == "Recovered":
            new_recovery = Recovery(
                witness_report_id=report_id,
                user_id=report.user_id,
                recovery_date=func.now()
            )
            db.add(new_recovery)
            db.commit()
            print(f"✅ New recovery created for accident report {report_id}")

        return {
            "message": f"Status updated to {status}",
            "report_id": report_id,
            "report_type": "accident"
        }

    else:
        # Theft report
        result = update_report_status(db, report_id, status)
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])

        # ✅ Create new recovery for "Recovered" status (even if previous exists)
        if status == "Recovered":
            report = db.query(UserReport).filter(
                UserReport.user_report_id == report_id
            ).first()
            if report and report.vehicle:
                new_recovery = Recovery(
                    report_id=report_id,
                    user_id=report.vehicle.user_id,
                    recovery_date=func.now()
                )
                db.add(new_recovery)
                db.commit()
                print(f"✅ New recovery created for theft report {report_id}")

        return result


# ─── DELETE: Report ───────────────────────────────────────────────────────────
@router.delete("/{report_id}")
def delete(report_id: int, db: Session = Depends(get_db)):
    result = delete_report(db, report_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


# ─── READ: Police officer ki assigned reports ────────────────────────────────
@router.get("/police/assigned-reports")
def get_assigned_reports(
        officer_id: int,
        db: Session = Depends(get_db)
):
    from models.report import UserReport, WitnessReport
    officer_station = db.query(PoliceStationOfficer).filter(
        PoliceStationOfficer.user_id == officer_id
    ).first()
    if not officer_station:
        return {
            "reports": [],
            "message": "You are not assigned to any police station"
        }
    station_id = officer_station.station_id
    theft_reports = db.query(UserReport).filter(
        UserReport.police_station_id == station_id
    ).order_by(UserReport.date.desc()).all()
    accident_reports = db.query(WitnessReport).filter(
        WitnessReport.police_station_id == station_id
    ).order_by(WitnessReport.witness_report_id.desc()).all()
    all_reports = []
    for r in theft_reports:
        all_reports.append({
            "report_id": r.user_report_id,
            "incident_type": r.incident_type,
            "description": r.description,
            "status": r.status,
            "date": str(r.date) if r.date else None,
            "place_name": r.place.name if r.place else None,
            "is_witness": False,
        })
    for r in accident_reports:
        all_reports.append({
            "report_id": r.witness_report_id,
            "incident_type": "Accident",
            "description": r.description,
            "status": getattr(r, 'status', 'Pending'),
            "date": str(r.date) if hasattr(r, 'date') and r.date else None,
            "place_name": r.place.name if r.place else None,
            "is_witness": True,
        })
    all_reports.sort(key=lambda x: x.get('date', ''), reverse=True)
    return {
        "reports": all_reports,
        "station_id": station_id,
        "count": len(all_reports)
    }