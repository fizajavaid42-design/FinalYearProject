from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from controllers.forwarded_alert_controller import (
    forward_alert_to_checkpoints,
    get_forwarded_alerts_for_officer,
    get_all_forwarded_alerts,
    update_forwarded_alert_status,
)

router = APIRouter(prefix="/forwarded-alert", tags=["Forwarded Alerts"])


# ─── FORWARD ALERT ───────────────────────────────────────────────
@router.post("/forward")
def forward_alert(
    alert_id: int = Form(...),
    forwarded_by: int = Form(...),
    depth: int = Form(2),  # default 2 checkpoints
    db: Session = Depends(get_db),
):
    """
    Alert ko next checkpoints tak forward karo.
    depth=2 matlab next 2 checkpoints tak alert jayega.
    """
    result = forward_alert_to_checkpoints(
        db=db,
        alert_id=alert_id,
        forwarded_by=forwarded_by,
        depth=depth,
    )

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return result


# ─── GET FORWARDED ALERTS FOR OFFICER ────────────────────────────
@router.get("/officer/{user_id}")
def get_officer_alerts(
    user_id: int,
    db: Session = Depends(get_db),
):
    """
    Officer ke checkpoint ke liye forwarded alerts.
    """
    alerts = get_forwarded_alerts_for_officer(db, user_id)
    return alerts


# ─── GET ALL FORWARDED ALERTS (ADMIN) ─────────────────────────────
@router.get("/all")
def get_all_forwarded(
    db: Session = Depends(get_db),
):
    """
    Admin ke liye saare forwarded alerts.
    """
    return get_all_forwarded_alerts(db)


# ─── UPDATE STATUS ───────────────────────────────────────────────
@router.patch("/{forward_id}/status")
def update_status(
    forward_id: int,
    status: str = Form(...),
    db: Session = Depends(get_db),
):
    """
    Forwarded alert ka status update karo.
    """
    result = update_forwarded_alert_status(db, forward_id, status)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result