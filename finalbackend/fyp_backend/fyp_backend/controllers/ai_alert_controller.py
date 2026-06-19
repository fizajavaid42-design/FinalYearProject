from sqlalchemy.orm import Session
from models.ai_alert import AIAlert
from models.report import WitnessReport
from models.report import UserReport
from models.registration_vehicle import Vehicle
from models.checkpoint import CheckPointOfficer, CheckPointCamera  # ✅ ADD
from typing import Optional  # ✅ ADD


def get_witness_vehicle_info(db: Session, alert: AIAlert):
    """Extract vehicle info from witness report"""
    report_type = (alert.report_type or "").lower().replace("report", "")
    if report_type == "witness" and alert.report_id:
        witness = db.query(WitnessReport).filter(
            WitnessReport.witness_report_id == alert.report_id
        ).first()

        if witness:
            return {
                "vehicle_id": None,
                "company": witness.company,
                "model": witness.model,
                "generation": witness.generation,
                "vehicle_type": witness.vehicle_type,
                "color": witness.color,
                "no_plate": witness.no_plate,
                "source": "witness_report"
            }
    return None


def get_user_report_vehicle_info(db: Session, alert: AIAlert):
    """Extract vehicle info from user report (if any)"""
    report_type = (alert.report_type or "").lower().replace("report", "")
    if report_type == "user" and alert.report_id:
        user_report = db.query(UserReport).filter(
            UserReport.user_report_id == alert.report_id
        ).first()

        if user_report and user_report.vehicle_id:
            vehicle = db.query(Vehicle).filter(
                Vehicle.vehicle_id == user_report.vehicle_id
            ).first()

            if vehicle:
                return {
                    "vehicle_id": vehicle.vehicle_id,
                    "company": vehicle.company,
                    "model": vehicle.model,
                    "generation": None,
                    "vehicle_type": None,
                    "color": vehicle.color,
                    "no_plate": vehicle.registration.no_plate if vehicle.registration else None,
                    "car_year": vehicle.car_year,
                    "engine_no": vehicle.engine_no,
                    "chassis_no": vehicle.chassis_no,
                    "source": "user_report"
                }
    return None


def get_camera_vehicle_info(alert: AIAlert):
    """Extract vehicle info from camera detection"""
    if alert.vehicle:
        return {
            "vehicle_id": alert.vehicle.vehicle_id,
            "company": alert.vehicle.company,
            "model": alert.vehicle.model,
            "generation": None,
            "vehicle_type": None,
            "color": alert.vehicle.color,
            "no_plate": alert.vehicle.registration.no_plate if alert.vehicle.registration else None,
            "car_year": alert.vehicle.car_year,
            "engine_no": alert.vehicle.engine_no,
            "chassis_no": alert.vehicle.chassis_no,
            "source": "camera_detection"
        }
    return None


def build_match_text(db: Session, alert: AIAlert):
    """Build match text based on alert type and matched_on field"""

    report_type = (alert.report_type or "").lower().replace("report", "")

    if report_type == "witness" and alert.report_id:
        witness = db.query(WitnessReport).filter(
            WitnessReport.witness_report_id == alert.report_id
        ).first()

        if witness:
            if alert.matched_on == "no_plate":
                return f"Witness Report: Plate {witness.no_plate} matched"
            elif alert.matched_on == "color":
                return f"Witness Report: Vehicle color {witness.color} matched"
            elif alert.matched_on == "model":
                return f"Witness Report: Vehicle model {witness.model} matched"
            elif alert.matched_on == "company":
                return f"Witness Report: Vehicle company {witness.company} matched"
            elif alert.matched_on == "company_model_color":
                return f"Witness Report: Color-Model-Company matched"
            elif alert.matched_on == "company_model_color_gen":
                return f"Witness Report: Color-Model-Company-Generation matched"
            else:
                return f"Witness Report: {alert.matched_on} matched"

    if report_type == "user" and alert.report_id:
        if alert.matched_on == "no_plate":
            plate = alert.detection.no_plate if alert.detection else "Unknown"
            return f"User Report: No. Plate '{plate}' Matched"
        elif alert.matched_on == "company_model_color_gen":
            return "User Report: Company, Model, Color & Generation Matched"
        else:
            return f"User Report: {alert.matched_on} matched"

    if alert.report_type == "legal_check":
        if alert.matched_on == "illegal_plate":
            return "🚨 Illegal Plate Detected!"
        elif alert.matched_on == "plate_mismatch":
            return "⚠️ Plate Mismatch - Details Don't Match!"
        elif alert.matched_on == "legal_verified":
            return "✅ Legal Vehicle Verified"

    if alert.report_type == "speed_detection":
        return "⚠️ Overspeed Vehicle Detected!"

    if alert.matched_on == "no_plate":
        plate = alert.detection.no_plate if alert.detection else "Unknown"
        return f"No Plate Matched: {plate}"

    if alert.matched_on == "color":
        color = alert.vehicle.color if alert.vehicle else "Unknown"
        return f"Vehicle Color Matched: {color}"

    if alert.matched_on == "model":
        model = alert.vehicle.model if alert.vehicle else "Unknown"
        return f"Vehicle Model Matched: {model}"

    if alert.matched_on == "company":
        company = alert.vehicle.company if alert.vehicle else "Unknown"
        return f"Vehicle Company Matched: {company}"

    return "Alert Generated"


def get_report_details(db: Session, alert: AIAlert) -> dict | None:
    """Get full report details for popup"""
    report_type = (alert.report_type or "").lower().replace("report", "")

    if report_type == "user" and alert.report_id:
        report = db.query(UserReport).filter(
            UserReport.user_report_id == alert.report_id
        ).first()
        if report:
            return {
                "report_type": "User Report (Theft)",
                "report_id": report.user_report_id,
                "description": report.description,
                "contact": report.contact,
                "incident_type": report.incident_type,
                "status": report.status,
                "date": str(report.date) if report.date else None,
                "place_name": report.place.name if report.place else None,
            }

    if report_type == "witness" and alert.report_id:
        report = db.query(WitnessReport).filter(
            WitnessReport.witness_report_id == alert.report_id
        ).first()
        if report:
            return {
                "report_type": "Witness Report (Accident)",
                "report_id": report.witness_report_id,
                "description": report.description,
                "vehicle_type": report.vehicle_type,
                "generation": report.generation,
                "status": report.status if hasattr(report, 'status') else "Pending",
                "date": str(report.date) if hasattr(report, 'date') and report.date else None,
                "place_name": report.place.name if report.place else None,
                "user_id": report.user_id,
            }

    return None


def get_vehicle_info_for_alert(db: Session, alert: AIAlert):
    """Main function to get vehicle info from appropriate source"""

    report_type = (alert.report_type or "").lower().replace("report", "")

    if report_type == "user":
        vehicle_info = get_user_report_vehicle_info(db, alert)
        if vehicle_info:
            return vehicle_info

    if report_type == "witness":
        vehicle_info = get_witness_vehicle_info(db, alert)
        if vehicle_info:
            return vehicle_info

    vehicle_info = get_camera_vehicle_info(alert)
    if vehicle_info:
        return vehicle_info

    return None


# ───────────── LIST ALL ALERTS ─────────────
def get_all_ai_alerts(db: Session, officer_id: Optional[int] = None):
    # ✅ Agar officer_id diya hai to filter karo
    if officer_id:
        # Officer ka checkpoint nikalo
        officer_cp = db.query(CheckPointOfficer).filter(
            CheckPointOfficer.user_id == officer_id
        ).first()

        if not officer_cp:
            return []  # Officer kisi checkpoint pe nahi hai

        checkpoint_id = officer_cp.checkpoint_id

        # Us checkpoint ke cameras nikalo
        cp_cameras = db.query(CheckPointCamera).filter(
            CheckPointCamera.checkpoint_id == checkpoint_id
        ).all()

        camera_ids = [c.camera_id for c in cp_cameras]

        if not camera_ids:
            return []

        # Sirf un cameras ke alerts
        alerts = db.query(AIAlert).filter(
            AIAlert.camera_id.in_(camera_ids)
        ).order_by(AIAlert.alert_time.desc()).all()
    else:
        # Admin ke liye saare alerts
        alerts = db.query(AIAlert).order_by(AIAlert.alert_time.desc()).all()

    result = []

    for a in alerts:
        vehicle_info = get_vehicle_info_for_alert(db, a)

        result.append({
            "alert_id": a.alert_id,
            "alert_time": str(a.alert_time),
            "matched_on": a.matched_on,
            "report_type": a.report_type,
            "report_id": a.report_id,
            "match_text": build_match_text(db, a),

            "vehicle": vehicle_info,

            "camera": {
                "camera_id": a.camera.camera_id if a.camera else None,
                "direction": a.camera.direction if a.camera else None,
                "place_id": a.camera.place_id if a.camera else None,
                "place_name": a.camera.place.name if a.camera and a.camera.place else None,
            } if a.camera else None,

            "detection": {
                "detection_id": a.detection.detection_id if a.detection else None,
                "no_plate": a.detection.no_plate if a.detection else None,
                "image_path": a.detection.image_path if a.detection else None,
                "detected_at": str(a.detection.detected_at) if a.detection else None,
                "company": a.detection.company if a.detection else None,
                "model": a.detection.model if a.detection else None,
                "color": a.detection.color if a.detection else None,
            } if a.detection else None,
        })

    return result


# ───────────── SINGLE ALERT ─────────────
def get_ai_alert_by_id(db: Session, alert_id: int):
    alert = db.query(AIAlert).filter(AIAlert.alert_id == alert_id).first()

    if not alert:
        return None

    vehicle_info = get_vehicle_info_for_alert(db, alert)
    report_details = get_report_details(db, alert)

    return {
        "alert_id": alert.alert_id,
        "alert_time": str(alert.alert_time),
        "matched_on": alert.matched_on,
        "report_type": alert.report_type,
        "report_id": alert.report_id,
        "match_text": build_match_text(db, alert),

        "vehicle": vehicle_info,
        "report_details": report_details,

        "camera": {
            "camera_id": alert.camera.camera_id if alert.camera else None,
            "direction": alert.camera.direction if alert.camera else None,
            "place_id": alert.camera.place_id if alert.camera else None,
            "place_name": alert.camera.place.name if alert.camera and alert.camera.place else None,
        } if alert.camera else None,

        "detection": {
            "detection_id": alert.detection.detection_id if alert.detection else None,
            "no_plate": alert.detection.no_plate if alert.detection else None,
            "image_path": alert.detection.image_path if alert.detection else None,
            "detected_at": str(alert.detection.detected_at) if alert.detection else None,
            "company": alert.detection.company if alert.detection else None,
            "model": alert.detection.model if alert.detection else None,
            "color": alert.detection.color if alert.detection else None,
        } if alert.detection else None,
    }