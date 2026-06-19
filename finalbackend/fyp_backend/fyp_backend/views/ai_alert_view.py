from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from controllers.ai_alert_controller import (
    get_all_ai_alerts,
    get_ai_alert_by_id
)

router = APIRouter(prefix="/ai-alerts", tags=["AI Alerts"])


# ───────── LIST ─────────
@router.get("/")
def all_alerts(
    officer_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    return get_all_ai_alerts(db, officer_id=officer_id)


# ───────── DETAIL ─────────
@router.get("/{alert_id}")
def alert_detail(alert_id: int, db: Session = Depends(get_db)):
    alert = get_ai_alert_by_id(db, alert_id)

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    return alert