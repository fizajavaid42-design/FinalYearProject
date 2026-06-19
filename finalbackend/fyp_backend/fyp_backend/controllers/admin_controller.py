from sqlalchemy.orm import Session
from models.user                 import User
from models.user_document        import UserDocument
from models.registration_vehicle import Vehicle, VehicleDocument, Registration


# ══════════════════════════════════════════════════════════════════════════════
# USER APPROVAL
# ══════════════════════════════════════════════════════════════════════════════

def get_all_users(db: Session) -> list:
    """Sirf PENDING users dikhao (Approved/Rejected wale nahi)"""
    users = db.query(User).filter(
        User.role.in_(["citizen", "police"]),
        User.approval_status == "Pending"  # ✅ Sirf pending wale dikho
    ).order_by(User.user_id.desc()).all()

    result = []
    for u in users:
        docs = db.query(UserDocument).filter(
            UserDocument.user_id == u.user_id
        ).all()
        result.append({
            "user_id": u.user_id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "contact": u.contact,
            "designation": u.designation,
            "approval_status": u.approval_status,
            "documents": [
                {
                    "document_id": d.document_id,
                    "document_type": d.document_type,
                    "document_path": d.document_path,
                }
                for d in docs
            ],
        })
    return result

def get_pending_users(db: Session) -> list:
    users = db.query(User).filter(
        User.role.in_(["citizen", "police"]),
        User.approval_status == "Pending"
    ).order_by(User.user_id.desc()).all()

        # ... rest same
# def get_pending_users(db: Session) -> list:
#     users = db.query(User).filter(
#         User.approval_status == "Pending"
#     ).order_by(User.user_id.desc()).all()



    result = []
    for u in users:
        docs = db.query(UserDocument).filter(
            UserDocument.user_id == u.user_id
        ).all()
        result.append({
            "user_id":         u.user_id,
            "name":            u.name,
            "email":           u.email,
            "role":            u.role,
            "contact":         u.contact,
            "designation":     u.designation,
            "approval_status": u.approval_status,
            "documents": [
                {
                    "document_id":   d.document_id,
                    "document_type": d.document_type,
                    "document_path": d.document_path,
                }
                for d in docs
            ],
        })
    return result


def update_user_approval(
    db: Session, user_id: int, status: str
) -> dict:
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        return {"error": "User not found"}
    if status not in ("Approved", "Rejected", "Pending"):
        return {"error": "Invalid status"}
    user.approval_status = status
    db.commit()
    return {
        "message": f"User {status} successfully",
        "user_id": user_id,
        "status":  status,
    }


# ══════════════════════════════════════════════════════════════════════════════
# VEHICLE VERIFICATION
# ══════════════════════════════════════════════════════════════════════════════

def get_all_vehicles_admin(db: Session) -> list:
    vehicles = db.query(Vehicle).order_by(
        Vehicle.vehicle_id.desc()
    ).all()

    result = []
    for v in vehicles:
        reg = db.query(Registration).filter(
            Registration.reg_id == v.reg_id
        ).first() if v.reg_id else None

        # VehicleDocument mein upload_date nahi hai
        docs = db.query(VehicleDocument).filter(
            VehicleDocument.vehicle_id == v.vehicle_id
        ).all()

        result.append({
            "vehicle_id":      v.vehicle_id,
            "company":         v.company,
            "model":           v.model,
            "car_year":        v.car_year,
            "import_year":     v.import_year,
            "engine_no":       v.engine_no,
            "chassis_no":      v.chassis_no,
            "color":           v.color,
            "approval_status": v.approval_status,
            "no_plate":        reg.no_plate if reg else None,
            "documents": [
                {
                    "vehicle_document_id": d.vehicle_document_id,
                    "document_type":       d.document_type,
                    "document_path":       d.document_path,
                }
                for d in docs
            ],
        })
    return result


def get_pending_vehicles(db: Session) -> list:
    vehicles = db.query(Vehicle).filter(
        Vehicle.approval_status == "Pending"
    ).order_by(Vehicle.vehicle_id.desc()).all()

    result = []
    for v in vehicles:
        reg = db.query(Registration).filter(
            Registration.reg_id == v.reg_id
        ).first() if v.reg_id else None

        docs = db.query(VehicleDocument).filter(
            VehicleDocument.vehicle_id == v.vehicle_id
        ).all()

        result.append({
            "vehicle_id":      v.vehicle_id,
            "company":         v.company,
            "model":           v.model,
            "car_year":        v.car_year,
            "engine_no":       v.engine_no,
            "chassis_no":      v.chassis_no,
            "color":           v.color,
            "approval_status": v.approval_status,
            "no_plate":        reg.no_plate if reg else None,
            "documents": [
                {
                    "vehicle_document_id": d.vehicle_document_id,
                    "document_type":       d.document_type,
                    "document_path":       d.document_path,
                }
                for d in docs
            ],
        })
    return result


def update_vehicle_approval(
    db: Session, vehicle_id: int, status: str
) -> dict:
    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == vehicle_id
    ).first()
    if not vehicle:
        return {"error": "Vehicle not found"}
    if status not in ("Approved", "Rejected", "Pending"):
        return {"error": "Invalid status"}
    vehicle.approval_status = status
    db.commit()
    return {
        "message":    f"Vehicle {status} successfully",
        "vehicle_id": vehicle_id,
        "status":     status,
    }