import os, shutil
from sqlalchemy.orm import Session
from models.registration_vehicle import Registration, Vehicle, VehicleDocument

UPLOAD_DIR = "uploads/vehicle_documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ─── CREATE ──────────────────────────────────────────────────────────────────

def register_vehicle(
    db: Session,
    user_id: int,
    no_plate: str,
    company: str,
    model: str,
    car_year: int,
    color: str,
    import_year: int | None,
    engine_no: str | None,
    chassis_no: str | None,
    document_files: list,          # list of UploadFile objects
) -> dict:

    # 1. Check duplicate no_plate
    existing_reg = db.query(Registration).filter(
        Registration.no_plate == no_plate
    ).first()
    if existing_reg:
        return {"error": f"Number plate '{no_plate}' already registered"}

    # 2. Check duplicate engine_no (if provided)
    if engine_no:
        existing_engine = db.query(Vehicle).filter(
            Vehicle.engine_no == engine_no
        ).first()
        if existing_engine:
            return {"error": f"Engine number '{engine_no}' already exists"}

    # 3. Check duplicate chassis_no (if provided)
    if chassis_no:
        existing_chassis = db.query(Vehicle).filter(
            Vehicle.chassis_no == chassis_no
        ).first()
        if existing_chassis:
            return {"error": f"Chassis number '{chassis_no}' already exists"}

    # 4. Create Registration entry (no_plate linked to user)
    registration = Registration(
        user_id  = user_id,
        no_plate = no_plate,
    )
    db.add(registration)
    db.flush()  # get reg_id without committing

    # 5. Create Vehicle
    vehicle = Vehicle(
        user_id         = user_id,
        reg_id          = registration.reg_id,
        company         = company,
        model           = model,
        car_year        = car_year,
        import_year     = import_year,
        engine_no       = engine_no or None,
        chassis_no      = chassis_no or None,
        color           = color,
        approval_status = "Pending",
    )
    db.add(vehicle)
    db.flush()  # get vehicle_id

    # 6. Save documents
    saved_docs = []
    for file in document_files:
        ext       = os.path.splitext(file.filename)[-1]
        file_name = f"vehicle_{vehicle.vehicle_id}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, file_name)

        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        doc = VehicleDocument(
            vehicle_id    = vehicle.vehicle_id,
            document_type = ext.replace(".", "").upper(),
            document_path = file_path,
        )
        db.add(doc)
        saved_docs.append(file_path)

    db.commit()
    db.refresh(vehicle)

    return {
        "vehicle_id":      vehicle.vehicle_id,
        "reg_id":          registration.reg_id,
        "no_plate":        no_plate,
        "approval_status": vehicle.approval_status,
        "documents_saved": len(saved_docs),
    }


# ─── READ ─────────────────────────────────────────────────────────────────────

def get_vehicle_by_id(db: Session, vehicle_id: int):
    return db.query(Vehicle).filter(Vehicle.vehicle_id == vehicle_id).first()


def get_vehicles_by_user(db: Session, user_id: int):
    return db.query(Vehicle).filter(Vehicle.user_id == user_id).all()


def get_all_vehicles(db: Session):
    return db.query(Vehicle).all()


def get_registration_by_plate(db: Session, no_plate: str):
    return db.query(Registration).filter(
        Registration.no_plate == no_plate
    ).first()


# ─── UPDATE ───────────────────────────────────────────────────────────────────

def update_vehicle(
    db: Session,
    vehicle_id: int,
    company: str | None     = None,
    model: str | None       = None,
    car_year: int | None    = None,
    import_year: int | None = None,
    color: str | None       = None,
    engine_no: str | None   = None,
    chassis_no: str | None  = None,
) -> dict:
    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == vehicle_id).first()
    if not vehicle:
        return {"error": "Vehicle not found"}

    if company:     vehicle.company     = company
    if model:       vehicle.model       = model
    if car_year:    vehicle.car_year    = car_year
    if import_year: vehicle.import_year = import_year
    if color:       vehicle.color       = color
    if engine_no:   vehicle.engine_no   = engine_no
    if chassis_no:  vehicle.chassis_no  = chassis_no

    db.commit()
    db.refresh(vehicle)
    return {"message": "Vehicle updated", "vehicle_id": vehicle.vehicle_id}


def update_approval_status(db: Session, vehicle_id: int, status: str) -> dict:
    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == vehicle_id).first()
    if not vehicle:
        return {"error": "Vehicle not found"}
    vehicle.approval_status = status
    db.commit()
    return {"message": f"Status updated to {status}"}


# ─── DELETE ───────────────────────────────────────────────────────────────────

def delete_vehicle(db: Session, vehicle_id: int) -> dict:
    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == vehicle_id).first()
    if not vehicle:
        return {"error": "Vehicle not found"}

    # Delete documents from disk
    for doc in vehicle.documents:
        if os.path.exists(doc.document_path):
            os.remove(doc.document_path)
        db.delete(doc)

    # Delete registration
    if vehicle.reg_id:
        reg = db.query(Registration).filter(
            Registration.reg_id == vehicle.reg_id
        ).first()
        if reg:
            db.delete(reg)

    db.delete(vehicle)
    db.commit()
    return {"message": "Vehicle deleted", "vehicle_id": vehicle_id}