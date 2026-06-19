from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional, List
from database import get_db
from pydantic import BaseModel
from controllers.recovery_controller import (
    create_recovery,
    get_user_vehicles_with_recovery_status,
    get_recoveries_by_user,
    get_recovery_by_id,
    get_all_recoveries,
    search_recovery_by_plate,
    delete_recovery,
    create_handover_request,
)
import os
import shutil

# ✅ Missing imports - ADD KARO
from models.vehicle_handover import VehicleHandover
from models.registration_vehicle import Registration
from models.police_station import PoliceStation

router = APIRouter(prefix="/recovery", tags=["Recovery"])

UPLOAD_DIR = "uploads/handover_documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ─── CREATE: Recovery (Police) ───────────────────────────────────────────────
@router.post("/")
def add_recovery(
        report_id: int = Form(...),
        user_id: int = Form(...),
        police_station_id: Optional[int] = Form(None),
        checkpoint_id: Optional[int] = Form(None),
        db: Session = Depends(get_db),
):
    result = create_recovery(db, report_id, user_id, police_station_id, checkpoint_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


# ─── READ: User ki saari vehicles with recovery status ───────────────────────
@router.get("/user-vehicles/{user_id}")
def user_vehicles_with_status(user_id: int, db: Session = Depends(get_db)):
    return get_user_vehicles_with_recovery_status(db, user_id)


# ─── READ: Recoveries by user ────────────────────────────────────────────────
@router.get("/user/{user_id}")
def user_recoveries(user_id: int, db: Session = Depends(get_db)):
    return get_recoveries_by_user(db, user_id)


# ─── READ: Search by number plate ────────────────────────────────────────────
@router.get("/search")
def search_by_plate(
        no_plate: str,
        user_id: int,
        db: Session = Depends(get_db),
):
    result = search_recovery_by_plate(db, no_plate, user_id)
    if not result:
        raise HTTPException(status_code=404, detail="No recovery found for this plate")
    return result


# ─── CREATE: Handover Request (with multiple documents) ──────────────────────
@router.post("/handover")
async def submit_handover(
        recovery_id: int = Form(...),
        police_station_id: int = Form(...),
        owner_cnic: str = Form(...),
        documents: List[UploadFile] = File(None),
        db: Session = Depends(get_db),
):
    saved_paths = []
    if documents:
        for doc in documents:
            if doc.filename:
                file_name = f"handover_{recovery_id}_{doc.filename}"
                file_path = os.path.join(UPLOAD_DIR, file_name)
                with open(file_path, "wb") as f:
                    shutil.copyfileobj(doc.file, f)
                saved_paths.append(file_path)

    document_paths = ",".join(saved_paths) if saved_paths else None

    result = create_handover_request(
        db,
        recovery_id=recovery_id,
        police_station_id=police_station_id,
        owner_cnic=owner_cnic,
        document_paths=document_paths,
    )

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


# ─── READ: All recoveries (Admin) ────────────────────────────────────────────
@router.get("/all")
def all_recoveries(db: Session = Depends(get_db)):
    return get_all_recoveries(db)


# ─── READ: Single recovery ───────────────────────────────────────────────────
@router.get("/{recovery_id}")
def single_recovery(recovery_id: int, db: Session = Depends(get_db)):
    recovery = get_recovery_by_id(db, recovery_id)
    if not recovery:
        raise HTTPException(status_code=404, detail="Recovery not found")
    return {
        "recovery_id": recovery.recovery_id,
        "report_id": recovery.report_id,
        "user_id": recovery.user_id,
        "police_station_id": recovery.police_station_id,
        "recovery_date": str(recovery.recovery_date),
    }


# ─── DELETE: Recovery ────────────────────────────────────────────────────────
@router.delete("/{recovery_id}")
def delete(recovery_id: int, db: Session = Depends(get_db)):
    result = delete_recovery(db, recovery_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


# ================================================================
# ✅ HANDOVER ENDPOINTS (Police ke liye)
# ================================================================

class HandoverStatusUpdate(BaseModel):
    status: str  # Approved, Rejected


# GET pending handover requests
@router.get("/handover/pending")
def get_pending_handovers(db: Session = Depends(get_db)):
    """Get all pending handover requests for police dashboard"""
    handovers = db.query(VehicleHandover).filter(
        VehicleHandover.status == "Pending"
    ).order_by(VehicleHandover.handover_date.desc()).all()

    result = []
    for h in handovers:
        recovery = h.recovery
        if recovery:
            report = recovery.report
            vehicle = report.vehicle if report else None
            reg = None
            if vehicle and vehicle.reg_id:
                reg = db.query(Registration).filter(
                    Registration.reg_id == vehicle.reg_id
                ).first()

            station = db.query(PoliceStation).filter(
                PoliceStation.station_id == h.police_station_id
            ).first()

            result.append({
                "handover_id": h.handover_id,
                "owner_cnic": h.owner_cnic,
                "status": h.status,
                "handover_date": str(h.handover_date),
                "document_paths": h.document_paths,
                "vehicle_no_plate": reg.no_plate if reg else None,
                "police_station_name": station.name if station else None,
            })

    return result


# GET all handover requests (with filters)
@router.get("/handover/all")
def get_all_handovers(
        status: Optional[str] = None,
        db: Session = Depends(get_db)
):
    """Get all handover requests, optionally filtered by status"""
    query = db.query(VehicleHandover)
    if status:
        query = query.filter(VehicleHandover.status == status)

    handovers = query.order_by(VehicleHandover.handover_date.desc()).all()

    result = []
    for h in handovers:
        recovery = h.recovery
        if recovery:
            report = recovery.report
            vehicle = report.vehicle if report else None
            reg = None
            if vehicle and vehicle.reg_id:
                reg = db.query(Registration).filter(
                    Registration.reg_id == vehicle.reg_id
                ).first()

            station = db.query(PoliceStation).filter(
                PoliceStation.station_id == h.police_station_id
            ).first()

            result.append({
                "handover_id": h.handover_id,
                "owner_cnic": h.owner_cnic,
                "status": h.status,
                "handover_date": str(h.handover_date),
                "document_paths": h.document_paths,
                "vehicle_no_plate": reg.no_plate if reg else None,
                "police_station_name": station.name if station else None,
            })

    return result


# UPDATE handover status
@router.patch("/handover/{handover_id}/status")
def update_handover_status(
        handover_id: int,
        body: HandoverStatusUpdate,
        db: Session = Depends(get_db)
):
    """Approve or reject handover request"""
    handover = db.query(VehicleHandover).filter(
        VehicleHandover.handover_id == handover_id
    ).first()

    if not handover:
        raise HTTPException(status_code=404, detail="Handover not found")

    handover.status = body.status
    db.commit()

    return {
        "message": f"Handover {body.status}",
        "handover_id": handover_id,
        "status": body.status
    }


@router.get("/download-document/{filename}")
async def download_document(filename: str):
    """
    Download handover document by filename
    Example: /recovery/download-document/handover_18_1.png
    """
    # Multiple possible locations check karo
    possible_paths = [
        f"uploads/handover_documents/{filename}",
        f"uploads/{filename}",
        f"./uploads/handover_documents/{filename}",
    ]

    for file_path in possible_paths:
        if os.path.exists(file_path):
            print(f"✅ Found document: {file_path}")
            return FileResponse(
                path=file_path,
                filename=filename,
                media_type="application/octet-stream"
            )

    return {"error": f"Document not found: {filename}"}