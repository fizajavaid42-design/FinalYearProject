from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from database import get_db
from controllers.registration_vehicle_controller import (
    register_vehicle,
    get_vehicle_by_id,
    get_vehicles_by_user,
    get_all_vehicles,
    get_registration_by_plate,
    update_vehicle,
    update_approval_status,
    delete_vehicle,
)

router = APIRouter(prefix="/registration", tags=["Registration"])


# ─── CREATE: Register Vehicle ─────────────────────────────────────────────────
@router.post("/register-vehicle")
async def register_vehicle_endpoint(
    user_id:     int            = Form(...),
    no_plate:    str            = Form(...),
    company:     str            = Form(...),
    model:       str            = Form(...),
    car_year:    int            = Form(...),
    color:       str            = Form(...),
    import_year: Optional[int]  = Form(None),
    engine_no:   Optional[str]  = Form(None),
    chassis_no:  Optional[str]  = Form(None),
    documents:   List[UploadFile] = File([]),
    db:          Session        = Depends(get_db),
):
    result = register_vehicle(
        db          = db,
        user_id     = user_id,
        no_plate    = no_plate,
        company     = company,
        model       = model,
        car_year    = car_year,
        color       = color,
        import_year = import_year,
        engine_no   = engine_no,
        chassis_no  = chassis_no,
        document_files = documents,
    )

    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return result


# ─── READ: Get single vehicle ─────────────────────────────────────────────────
@router.get("/vehicle/{vehicle_id}")
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = get_vehicle_by_id(db, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return {
        "vehicle_id":      vehicle.vehicle_id,
        "company":         vehicle.company,
        "model":           vehicle.model,
        "car_year":        vehicle.car_year,
        "import_year":     vehicle.import_year,
        "color":           vehicle.color,
        "engine_no":       vehicle.engine_no,
        "chassis_no":      vehicle.chassis_no,
        "approval_status": vehicle.approval_status,
        "no_plate":        vehicle.registration.no_plate if vehicle.registration else None,
    }


# ─── READ: Get all vehicles of a user ────────────────────────────────────────
@router.get("/vehicles/user/{user_id}")
def get_user_vehicles(user_id: int, db: Session = Depends(get_db)):
    vehicles = get_vehicles_by_user(db, user_id)
    return [
        {
            "vehicle_id":      v.vehicle_id,
            "company":         v.company,
            "model":           v.model,
            "car_year":        v.car_year,
            "color":           v.color,
            "engine_no": v.engine_no,
            "chassis_no": v.chassis_no,
            "approval_status": v.approval_status,
            "no_plate":        v.registration.no_plate if v.registration else None,
        }
        for v in vehicles
    ]


# ─── READ: Get all vehicles (Admin) ──────────────────────────────────────────
@router.get("/vehicles/all")
def get_all(db: Session = Depends(get_db)):
    vehicles = get_all_vehicles(db)
    return [
        {
            "vehicle_id":      v.vehicle_id,
            "company":         v.company,
            "model":           v.model,
            "car_year":        v.car_year,
            "color":           v.color,
            "engine_no": v.engine_no,
            "chassis_no": v.chassis_no,
            "approval_status": v.approval_status,
            "no_plate":        v.registration.no_plate if v.registration else None,
        }
        for v in vehicles
    ]


# ─── READ: Check no_plate ─────────────────────────────────────────────────────
@router.get("/check-plate/{no_plate}")
def check_plate(no_plate: str, db: Session = Depends(get_db)):
    reg = get_registration_by_plate(db, no_plate)
    return {"exists": reg is not None}


# ─── UPDATE: Vehicle details ──────────────────────────────────────────────────
@router.put("/vehicle/{vehicle_id}")
def update_vehicle_endpoint(
    vehicle_id:  int,
    company:     Optional[str] = Form(None),
    model:       Optional[str] = Form(None),
    car_year:    Optional[int] = Form(None),
    import_year: Optional[int] = Form(None),
    color:       Optional[str] = Form(None),
    engine_no:   Optional[str] = Form(None),
    chassis_no:  Optional[str] = Form(None),
    db:          Session       = Depends(get_db),
):
    result = update_vehicle(
        db, vehicle_id, company, model,
        car_year, import_year, color, engine_no, chassis_no
    )
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


# ─── UPDATE: Approval status (Admin) ─────────────────────────────────────────
@router.patch("/vehicle/{vehicle_id}/approval")
def update_status(
    vehicle_id: int,
    status:     str     = Form(...),
    db:         Session = Depends(get_db),
):
    result = update_approval_status(db, vehicle_id, status)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


# ─── DELETE: Vehicle ──────────────────────────────────────────────────────────
@router.delete("/vehicle/{vehicle_id}")
def delete_vehicle_endpoint(vehicle_id: int, db: Session = Depends(get_db)):
    result = delete_vehicle(db, vehicle_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result