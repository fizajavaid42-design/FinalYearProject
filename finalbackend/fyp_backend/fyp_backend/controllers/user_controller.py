from sqlalchemy.orm import Session
from models.user import User
from models.user_document import UserDocument
import hashlib
import os
import shutil

UPLOAD_DIR = "uploads/cnic"

def create_user(db: Session, name, email, password, role, contact, designation=None, document=None):

    role = role.lower()

    # 🚫 Only police & citizen allowed
    if role not in ["police", "citizen"]:
        return {"error": "Invalid role selected"}

    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        return {"error": "Email already registered"}

    hashed_password = hashlib.sha256(password.encode()).hexdigest()

    # Approval logic
    # approval_status = "Approved" if role == "citizen" else "Pending"
    # ✅ Sirf ADMIN role ko Approved, baqi sab ko Pending
    if role == "ADMIN":
        approval_status = "Approved"
    else:
        approval_status = "Pending"

    user = User(
        name=name,
        email=email,
        password=hashed_password,
        role=role,
        designation=designation,
        approval_status=approval_status,
        contact=contact
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    # Handle CNIC upload
    if document:
        if not os.path.exists(UPLOAD_DIR):
            os.makedirs(UPLOAD_DIR)

        file_path = os.path.join(UPLOAD_DIR, document.filename)

        with open(file_path, "wb") as f:
            shutil.copyfileobj(document.file, f)

        user_doc = UserDocument(
            user_id=user.user_id,
            document_type="CNIC",
            document_path=file_path
        )
        db.add(user_doc)
        db.commit()

    return user


def verify_user(db: Session, email: str, password: str):

    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None

    hashed_input = hashlib.sha256(password.encode()).hexdigest()

    if hashed_input == user.password:
        return user

    return None
