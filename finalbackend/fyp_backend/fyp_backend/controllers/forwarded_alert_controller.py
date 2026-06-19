from sqlalchemy.orm import Session, joinedload
from models.forwarded_alert import ForwardedAlert
from models.ai_alert import AIAlert
from models.checkpoint import CheckPoint, CheckPointCamera, CheckPointOfficer, CheckPointGraph
from models.user import User
from models.cctv_camera import CCTVCamera
from models.registration_vehicle import Vehicle, Registration
from models.report import WitnessReport, UserReport
from controllers.checkpoint_controller import get_next_checkpoints, get_alert_targets


def forward_alert_to_checkpoints(
    db: Session,
    alert_id: int,
    forwarded_by: int,
    depth: int = 2
) -> dict:
    """
    Alert ko next checkpoints tak forward karo.
    Returns list of ForwardedAlert records.
    """

    # 1. Alert fetch karo
    alert = db.query(AIAlert).filter(AIAlert.alert_id == alert_id).first()
    if not alert:
        return {"error": "Alert not found"}

    print(f"🟢 Alert ID: {alert_id}, Camera ID: {alert.camera_id}")

    # 2. Starting checkpoint nikalo (Pehle forwarding officer ka assigned checkpoint, phir fallback camera link)
    from_checkpoint_id = None

    officer_cp = db.query(CheckPointOfficer).filter(
        CheckPointOfficer.user_id == forwarded_by
    ).first()

    if officer_cp:
        from_checkpoint_id = officer_cp.checkpoint_id
        print(f"🟢 Resolved starting checkpoint from forwarding officer: {from_checkpoint_id}")
    else:
        if not alert.camera_id:
            return {"error": "Alert has no camera linked and forwarding user is not an officer"}

        cam_link = db.query(CheckPointCamera).filter(
            CheckPointCamera.camera_id == alert.camera_id
        ).first()

        print(f"🟢 Camera Link Found: checkpoint_id={cam_link.checkpoint_id if cam_link else 'None'}")

        if not cam_link:
            return {"error": "Camera not linked to any checkpoint and forwarding user is not an officer"}

        from_checkpoint_id = cam_link.checkpoint_id
        print(f"🟢 Resolved starting checkpoint from camera link: {from_checkpoint_id}")

    # 3. Next checkpoints nikalo BFS se
    next_cp_ids = get_next_checkpoints(db, from_checkpoint_id, depth=depth)
    print(f"🟢 Next Checkpoint IDs: {next_cp_ids}")

    if not next_cp_ids:
        return {"error": "No next checkpoints found", "forwarded": []}

    # 4. Har next checkpoint ke liye ForwardedAlert banao
    forwarded_list = []

    for to_cp_id in next_cp_ids:
        # CheckPoint details lo
        to_cp = db.query(CheckPoint).filter(
            CheckPoint.checkpoint_id == to_cp_id
        ).first()

        if not to_cp:
            continue

        # Officers nikalo is checkpoint ke
        officers = db.query(CheckPointOfficer).filter(
            CheckPointOfficer.checkpoint_id == to_cp_id
        ).all()

        # ForwardedAlert create karo
        forwarded = ForwardedAlert(
            alert_id=alert_id,
            from_checkpoint_id=from_checkpoint_id,
            to_checkpoint_id=to_cp_id,
            forwarded_by=forwarded_by,
            depth=depth,
            status="Pending"
        )
        db.add(forwarded)
        db.flush()

        # Build officer names list safely by querying User table
        officer_details = []
        for o in officers:
            user_obj = db.query(User).filter(User.user_id == o.user_id).first()
            officer_details.append({
                "user_id": o.user_id,
                "name": user_obj.name if user_obj else "Unknown"
            })

        forwarded_list.append({
            "forward_id": forwarded.forward_id,
            "to_checkpoint_id": to_cp_id,
            "to_checkpoint_name": to_cp.name,
            "officers": officer_details,
            "depth": depth,
            "status": "Pending"
        })

    db.commit()

    # 5. Alert info bhi saath bhejo
    alert_info = _get_alert_details(db, alert)

    return {
        "message": f"Alert forwarded to {len(forwarded_list)} checkpoints",
        "alert": alert_info,
        "forwarded_to": forwarded_list
    }


def _get_alert_details(db: Session, alert: AIAlert) -> dict:
    """Alert ki details nikalo with vehicle info"""

    vehicle_info = None

    # Check if alert has vehicle directly
    if alert.vehicle:
        reg = db.query(Registration).filter(
            Registration.reg_id == alert.vehicle.reg_id
        ).first()
        vehicle_info = {
            "vehicle_id": alert.vehicle.vehicle_id,
            "company": alert.vehicle.company,
            "model": alert.vehicle.model,
            "color": alert.vehicle.color,
            "no_plate": reg.no_plate if reg else None,
            "source": "vehicle_table"
        }

    # Check witness report
    elif alert.report_type and alert.report_type.lower().replace("report", "") == "witness" and alert.report_id:
        witness = db.query(WitnessReport).filter(
            WitnessReport.witness_report_id == alert.report_id
        ).first()
        if witness:
            vehicle_info = {
                "vehicle_id": None,
                "company": witness.company,
                "model": witness.model,
                "generation": witness.generation,
                "vehicle_type": witness.vehicle_type,
                "color": witness.color,
                "no_plate": witness.no_plate,
                "source": "witness_report"
            }

    # Detection info
    detection_info = None
    if alert.detection:
        detection_info = {
            "detection_id": alert.detection.detection_id,
            "company": alert.detection.company,
            "model": alert.detection.model,
            "color": alert.detection.color,
            "no_plate": alert.detection.no_plate,
            "detected_at": str(alert.detection.detected_at) if alert.detection.detected_at else None,
            "image_path": alert.detection.image_path,
        }

    # Camera info
    camera_info = None
    if alert.camera:
        camera_info = {
            "camera_id": alert.camera.camera_id,
            "direction": alert.camera.direction,
            "place_name": alert.camera.place.name if alert.camera.place else None,
        }

    return {
        "alert_id": alert.alert_id,
        "alert_time": str(alert.alert_time) if alert.alert_time else None,
        "matched_on": alert.matched_on,
        "report_type": alert.report_type,
        "report_id": alert.report_id,
        "vehicle": vehicle_info,
        "detection": detection_info,
        "camera": camera_info,
    }


def get_forwarded_alerts_for_officer(db: Session, user_id: int) -> list:
    """
    Officer ke checkpoint ke saare forwarded alerts nikalo.
    Pehle officer ka checkpoint nikalo, phir us checkpoint ke liye forwarded alerts.
    """

    # Officer kis checkpoint pe hai?
    officer_cp = db.query(CheckPointOfficer).filter(
        CheckPointOfficer.user_id == user_id
    ).first()

    if not officer_cp:
        return []

    checkpoint_id = officer_cp.checkpoint_id

    # Is checkpoint ke liye forwarded alerts
    forwarded_alerts = db.query(ForwardedAlert).filter(
        ForwardedAlert.to_checkpoint_id == checkpoint_id
    ).order_by(ForwardedAlert.forwarded_at.desc()).all()

    result = []
    for fa in forwarded_alerts:
        alert = fa.alert

        vehicle_info = None
        detection_info = None
        camera_info = None

        if alert:
            # Vehicle info
            if alert.vehicle:
                reg = db.query(Registration).filter(
                    Registration.reg_id == alert.vehicle.reg_id
                ).first()
                vehicle_info = {
                    "vehicle_id": alert.vehicle.vehicle_id,
                    "company": alert.vehicle.company,
                    "model": alert.vehicle.model,
                    "color": alert.vehicle.color,
                    "no_plate": reg.no_plate if reg else None,
                    "source": "vehicle_table"
                }
            elif alert.report_type and alert.report_type.lower().replace("report", "") == "witness" and alert.report_id:
                witness = db.query(WitnessReport).filter(
                    WitnessReport.witness_report_id == alert.report_id
                ).first()
                if witness:
                    vehicle_info = {
                        "vehicle_id": None,
                        "company": witness.company,
                        "model": witness.model,
                        "generation": witness.generation,
                        "vehicle_type": witness.vehicle_type,
                        "color": witness.color,
                        "no_plate": witness.no_plate,
                        "source": "witness_report"
                    }

            # Detection info
            if alert.detection:
                detection_info = {
                    "detection_id": alert.detection.detection_id,
                    "company": alert.detection.company,
                    "model": alert.detection.model,
                    "color": alert.detection.color,
                    "no_plate": alert.detection.no_plate,
                    "detected_at": str(alert.detection.detected_at) if alert.detection.detected_at else None,
                    "image_path": alert.detection.image_path,
                }

            # Camera info
            if alert.camera:
                camera_info = {
                    "camera_id": alert.camera.camera_id,
                    "direction": alert.camera.direction,
                    "place_name": alert.camera.place.name if alert.camera.place else None,
                }

        result.append({
            "forward_id": fa.forward_id,
            "alert_id": fa.alert_id,
            "from_checkpoint": fa.from_checkpoint.name if fa.from_checkpoint else "Unknown",
            "to_checkpoint": fa.to_checkpoint.name if fa.to_checkpoint else "Unknown",
            "forwarded_by_user": fa.forwarded_by_user.name if fa.forwarded_by_user else "Unknown",
            "depth": fa.depth,
            "forwarded_at": str(fa.forwarded_at) if fa.forwarded_at else None,
            "status": fa.status,
            "alert": {
                "alert_id": alert.alert_id if alert else None,
                "alert_time": str(alert.alert_time) if alert and alert.alert_time else None,
                "matched_on": alert.matched_on if alert else None,
                "report_type": alert.report_type if alert else None,
                "report_id": alert.report_id if alert else None,
                "vehicle": vehicle_info,
                "detection": detection_info,
                "camera": camera_info,
            } if alert else None
        })

    return result


def get_all_forwarded_alerts(db: Session) -> list:
    """Admin ke liye saare forwarded alerts"""
    forwarded_alerts = db.query(ForwardedAlert).order_by(
        ForwardedAlert.forwarded_at.desc()
    ).all()

    result = []
    for fa in forwarded_alerts:
        result.append({
            "forward_id": fa.forward_id,
            "alert_id": fa.alert_id,
            "from_checkpoint": fa.from_checkpoint.name if fa.from_checkpoint else None,
            "to_checkpoint": fa.to_checkpoint.name if fa.to_checkpoint else None,
            "forwarded_by": fa.forwarded_by_user.name if fa.forwarded_by_user else None,
            "depth": fa.depth,
            "forwarded_at": str(fa.forwarded_at) if fa.forwarded_at else None,
            "status": fa.status,
        })

    return result


def update_forwarded_alert_status(db: Session, forward_id: int, status: str) -> dict:
    """Forwarded alert ka status update karo"""
    forwarded = db.query(ForwardedAlert).filter(
        ForwardedAlert.forward_id == forward_id
    ).first()

    if not forwarded:
        return {"error": "Forwarded alert not found"}

    if status not in ("Pending", "Received", "Action Taken"):
        return {"error": "Invalid status"}

    forwarded.status = status
    db.commit()

    return {
        "message": f"Status updated to {status}",
        "forward_id": forward_id,
        "status": status
    }