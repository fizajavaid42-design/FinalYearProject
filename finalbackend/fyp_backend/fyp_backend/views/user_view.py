from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from controllers.user_controller import create_user, verify_user
from controllers.police_station_controller import get_unassigned_officers
from models.police_station import PoliceStationOfficer   # ✅ FIX 1: yeh import miss tha

router = APIRouter()

# ---------------- SIGNUP ----------------
@router.post("/signup")
async def signup(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    confirm_password: str = Form(...),
    role: str = Form(...),
    contact: str = Form(...),
    designation: str = Form(None),
    document: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    if password != confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    if role.lower() == "police" and not designation:
        raise HTTPException(status_code=400, detail="Designation required for Police")

    user = create_user(
        db, name, email, password, role, contact, designation, document
    )

    if isinstance(user, dict) and "error" in user:
        raise HTTPException(status_code=400, detail=user["error"])

    return {
        "message": "Signup successful",
        "user_id": user.user_id,
        "role": user.role,
        "approval_status": user.approval_status
    }


# ---------------- LOGIN ----------------
@router.post("/login")
async def login(
        email: str = Form(...),
        password: str = Form(...),
        db: Session = Depends(get_db)
):
    user = verify_user(db, email, password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # ✅ Approval check - Sirf citizen aur police ke liye
    if user.role in ["citizen", "police"]:
        if user.approval_status != "Approved":
            raise HTTPException(
                status_code=403,
                detail="Your account is pending admin approval. Please wait."
            )

    # ✅ Police hai to junction table se station_id fetch karo
    station_id = None
    if user.role and user.role.lower() == "police":
        assignment = db.query(PoliceStationOfficer).filter(
            PoliceStationOfficer.user_id == user.user_id
        ).first()
        station_id = assignment.station_id if assignment else None

    # ✅ ADMIN ko hamesha login allowed
    return {
        "user_id": user.user_id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "approval_status": user.approval_status,
        "station_id": station_id   # ✅ FIX 2: yeh field bhejna miss tha
    }


# ---------------- GET POLICE OFFICERS — Sirf Unassigned ----------------
@router.get("/users/police")
def get_police_officers(db: Session = Depends(get_db)):
    officers = get_unassigned_officers(db)
    return [
        {
            "user_id": o.user_id,
            "name": o.name,
            "designation": o.designation
        }
        for o in officers
    ]

# from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
# from sqlalchemy.orm import Session
# from database import get_db
# from controllers.user_controller import create_user, verify_user
# from controllers.police_station_controller import get_unassigned_officers
# from models.police_station import PoliceStationOfficer
#
# router = APIRouter()
#
# # ---------------- SIGNUP ----------------
# @router.post("/signup")
# async def signup(
#     name: str = Form(...),
#     email: str = Form(...),
#     password: str = Form(...),
#     confirm_password: str = Form(...),
#     role: str = Form(...),
#     contact: str = Form(...),
#     designation: str = Form(None),
#     document: UploadFile = File(None),
#     db: Session = Depends(get_db)
# ):
#     if password != confirm_password:
#         raise HTTPException(status_code=400, detail="Passwords do not match")
#
#     if role.lower() == "police" and not designation:
#         raise HTTPException(status_code=400, detail="Designation required for Police")
#
#     user = create_user(
#         db, name, email, password, role, contact, designation, document
#     )
#
#     if isinstance(user, dict) and "error" in user:
#         raise HTTPException(status_code=400, detail=user["error"])
#
#     return {
#         "message": "Signup successful",
#         "user_id": user.user_id,
#         "role": user.role,
#         "approval_status": user.approval_status
#     }
#
#
# # ---------------- LOGIN ----------------
# @router.post("/login")
# async def login(
#         email: str = Form(...),
#         password: str = Form(...),
#         db: Session = Depends(get_db)
# ):
#     user = verify_user(db, email, password)
#     if not user:
#         raise HTTPException(status_code=401, detail="Invalid credentials")
#
#     # ✅ Approval check - Sirf citizen aur police ke liye
#     if user.role in ["citizen", "police"]:
#         if user.approval_status != "Approved":
#             raise HTTPException(
#                 status_code=403,
#                 detail="Your account is pending admin approval. Please wait."
#             )
#     station_id = None
#     if user.role and user.role.lower() == "police":
#        assignment = db.query(PoliceStationOfficer).filter(
#            PoliceStationOfficer.user_id == user.user_id  # ✅ user_id (not officer_id)
#             ).first()
#        station_id = assignment.station_id if assignment else None
#
#     # ✅ ADMIN ko hamesha login allowed
#     return {
#         "user_id": user.user_id,
#         "name": user.name,
#         "email": user.email,
#         "role": user.role,
#         "approval_status": user.approval_status
#     }
# # ---------------- GET POLICE OFFICERS — Sirf Unassigned ----------------
# @router.get("/users/police")
# def get_police_officers(db: Session = Depends(get_db)):
#     officers = get_unassigned_officers(db)
#     return [
#         {
#             "user_id": o.user_id,
#             "name": o.name,
#             "designation": o.designation
#         }
#         for o in officers
#     ]