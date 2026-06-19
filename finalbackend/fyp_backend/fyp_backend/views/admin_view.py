from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from controllers.admin_controller import (
    get_all_users,
    get_pending_users,
    update_user_approval,
    get_all_vehicles_admin,
    get_pending_vehicles,
    update_vehicle_approval,
)

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── Pydantic schema ────────────────────────────────────────────────────────────
class ApprovalUpdate(BaseModel):
    status: str   # 'Approved' | 'Rejected' | 'Pending'


# ══════════════════════════════════════════════════════════════════════════════
# DATABASE CLEANING ENDPOINT
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/clear-database-fully")
def clear_database_fully(db: Session = Depends(get_db)):
    from sqlalchemy import text
    try:
        # Disable all constraints
        db.execute(text("EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'"))
        
        tables = [
            "ForwardedAlert",
            "AIAlert",
            "CameraGraph",
            "CheckPointOfficer",
            "CheckPointCamera",
            "CheckPointGraph",
            "CheckPoint",
            "PoliceStationOfficer",
            "PoliceStationPlace",
            "PoliceStation",
            "Recovery",
            "VehicleHandover",
            "UserReport",
            "WitnessReport",
            "VehicleDetection",
            "Vehicle",
            "Registration"
        ]
        
        for table in tables:
            try:
                db.execute(text(f"DELETE FROM [{table}]"))
            except Exception as e:
                print(f"Failed to delete from {table}: {e}")
                
        # Delete non-admin users
        db.execute(text("DELETE FROM [User] WHERE LOWER(role) NOT IN ('admin', 'system_admin', 'system admin', 'systemadmin')"))
        
        # Re-enable all constraints
        db.execute(text("EXEC sp_MSforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'"))
        
        db.commit()
        return {"status": "success", "message": "Database cleared successfully except admin users"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════════════════════════
# USER APPROVAL ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

# GET all users
@router.get("/users/all")
def all_users(db: Session = Depends(get_db)):
    return get_all_users(db)


# GET only pending users
@router.get("/users/pending")
def pending_users(db: Session = Depends(get_db)):
    return get_pending_users(db)


# PATCH approve/reject user
@router.patch("/users/{user_id}/approval")
def approve_user(
    user_id: int,
    body:    ApprovalUpdate,
    db:      Session = Depends(get_db),
):
    result = update_user_approval(db, user_id, body.status)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


# ══════════════════════════════════════════════════════════════════════════════
# VEHICLE VERIFICATION ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

# GET all vehicles
@router.get("/vehicles/all")
def all_vehicles(db: Session = Depends(get_db)):
    return get_all_vehicles_admin(db)


# GET only pending vehicles
@router.get("/vehicles/pending")
def pending_vehicles(db: Session = Depends(get_db)):
    return get_pending_vehicles(db)


# PATCH approve/reject vehicle
@router.patch("/vehicles/{vehicle_id}/approval")
def approve_vehicle(
    vehicle_id: int,
    body:       ApprovalUpdate,
    db:         Session = Depends(get_db),
):
    result = update_vehicle_approval(db, vehicle_id, body.status)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result