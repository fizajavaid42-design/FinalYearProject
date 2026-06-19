import os, shutil, re
from sqlalchemy.orm import Session
from models.vehicle_detection import VehicleDetection
from models.ai_alert import AIAlert
from models.report import UserReport, WitnessReport
from models.registration_vehicle import Vehicle, Registration
from models.legal_vehicle import LegalVehicle
from sqlalchemy import distinct,select,func

# ══════════════════════════════════════════════════════════════════════════════
# GENERATION MAPPING
# ══════════════════════════════════════════════════════════════════════════════
UPLOAD_DIR = "uploads/detections"
os.makedirs(UPLOAD_DIR, exist_ok=True)

GENERATION_MAP = [
    ("honda", "civic", "8th", 2006, 2012),
    ("honda", "civic", "10th", 2016, 2022),
    ("honda", "city", "5th", 2009, 2020),
    ("honda", "city", "6th", 2021, 2099),
    ("toyota", "corolla", "9th", 2002, 2007),
    ("toyota", "corolla", "10th", 2008, 2013),
    ("toyota", "corolla", "11th", 2014, 2023),
    ("toyota", "yaris", "1st", 2020, 2099),
    ("suzuki", "alto", "2nd", 1984, 1988),
    ("suzuki", "alto", "8th", 2019, 2099),
    ("suzuki", "cultus", "2nd", 2000, 2016),
    ("suzuki", "cultus", "3rd", 2017, 2099),
]


def _format_model_name(model_name: str) -> str:
    if not model_name or model_name.lower() == "unknown":
        return model_name
    patterns = {
        "city": "City", "civic": "Civic",
        "corolla": "Corolla", "yaris": "Yaris",
        "alto": "Alto", "cultus": "Cultus",
    }
    ml = model_name.lower()
    for key, display in patterns.items():
        if key in ml:
            numbers = re.findall(r'\d+', model_name)
            if numbers:
                num = int(numbers[0])
                suffix = {1: "1st", 2: "2nd", 3: "3rd"}.get(num, f"{num}th")
                return f"{display} ({suffix} Generation)"
            return display
    return model_name.capitalize()


def get_generation_from_ai(model_raw: str) -> str | None:
    if not model_raw:
        return None
    numbers = re.findall(r'\d+', model_raw)
    if numbers:
        num = int(numbers[0])
        return {1: "1st", 2: "2nd", 3: "3rd"}.get(num, f"{num}th")
    return None


def get_generation_from_year(company: str, model: str, car_year: int) -> str | None:
    if not company or not model or not car_year:
        return None
    co = company.lower()
    mo = model.lower()
    for (c, m, gen, y_start, y_end) in GENERATION_MAP:
        if c in co and m in mo and y_start <= car_year <= y_end:
            return gen
    return None


# ══════════════════════════════════════════════════════════════════════════════
# SAVE DETECTION
# ══════════════════════════════════════════════════════════════════════════════

def save_detection(db, camera_id, company, model, generation, color, no_plate, image_file=None):
    image_path = None
    if image_file:
        file_name = f"det_{image_file.filename}"
        image_path = os.path.join(UPLOAD_DIR, file_name)
        with open(image_path, "wb") as f:
            shutil.copyfileobj(image_file.file, f)

    detection = VehicleDetection(
        camera_id=camera_id or None,
        company=company or None,
        model=model or None,
        generation=generation or None,
        color=color or None,
        no_plate=no_plate or None,
        image_path=image_path,
    )
    db.add(detection)
    db.flush()
    return detection


# ══════════════════════════════════════════════════════════════════════════════
# LEGAL VEHICLE CHECK
# ══════════════════════════════════════════════════════════════════════════════

def check_legal_vehicle(db, detection):
    det_plate = (detection.no_plate or "").upper().strip()
    if not det_plate:
        return None

    legal = db.query(LegalVehicle).filter(LegalVehicle.no_plate == det_plate).first()

    if not legal:
        return {
            "legal_status": "illegal_plate",
            "message": f"Plate '{det_plate}' not found in legal vehicles database",
            "matched_on": "illegal_plate",
        }

    det_company = (detection.company or "").lower().strip()
    det_model = (detection.model or "").lower().strip()
    det_color = (detection.color or "").lower().strip()

    legal_company = (legal.company or "").lower().strip()
    legal_model = (legal.model or "").lower().strip()
    legal_color = (legal.color or "").lower().strip()

    company_ok = det_company and legal_company and det_company in legal_company
    model_ok = det_model and legal_model and _model_keyword_match(det_model, legal_model)
    color_ok = det_color and legal_color and det_color in legal_color

    if company_ok and model_ok and color_ok:
        return {
            "legal_status": "legal",
            "message": f"Legal vehicle confirmed: {legal.company} {legal.model}",
            "matched_on": "legal_verified",
        }
    else:
        return {
            "legal_status": "plate_mismatch",
            "message": f"Plate '{det_plate}' found but vehicle details mismatch",
            "matched_on": "plate_mismatch",
        }


# ══════════════════════════════════════════════════════════════════════════════
# MATCH REPORTS
# ══════════════════════════════════════════════════════════════════════════════

def match_reports(db, detection):
    matches = []

    det_company = (detection.company or "").lower().strip()
    det_model = (detection.model or "").lower().strip()
    det_color = (detection.color or "").lower().strip()
    det_gen = (detection.generation or "").lower().strip()
    det_plate = (detection.no_plate or "").upper().strip()

    user_reports = db.query(UserReport).filter(UserReport.status == "Pending").all()

    for r in user_reports:
        if not r.vehicle:
            continue
        v = r.vehicle

        reg = db.query(Registration).filter(Registration.reg_id == v.reg_id).first() if v.reg_id else None

        v_plate = ""
        if reg and reg.no_plate:
            v_plate = reg.no_plate.upper().strip()
        elif v.no_plate:
            v_plate = v.no_plate.upper().strip()

        if det_plate and v_plate and det_plate == v_plate:
            matches.append({
                "report_type": "user",
                "report_id": r.user_report_id,
                "vehicle_id": v.vehicle_id,
                "matched_on": "no_plate",
            })
            continue

        v_company = (v.company or "").lower().strip()
        v_model = (v.model or "").lower().strip()
        v_color = (v.color or "").lower().strip()
        v_year = v.car_year or 0

        v_gen = get_generation_from_year(v_company, v_model, v_year) or ""
        v_gen = v_gen.lower().strip()

        company_ok = det_company and v_company and det_company in v_company
        model_ok = det_model and v_model and _model_keyword_match(det_model, v_model)
        color_ok = det_color and v_color and det_color in v_color
        gen_ok = det_gen and v_gen and det_gen == v_gen

        if company_ok and model_ok and color_ok and gen_ok:
            matches.append({
                "report_type": "user",
                "report_id": r.user_report_id,
                "vehicle_id": v.vehicle_id,
                "matched_on": "company_model_color_gen",
            })

    witness_reports = db.query(WitnessReport).filter(WitnessReport.status == "Pending").all()

    for r in witness_reports:
        w_plate = (r.no_plate or "").upper().strip()
        w_company = (r.company or "").lower().strip()
        w_model = (r.model or "").lower().strip()
        w_color = (r.color or "").lower().strip()

        plate_given_in_report = bool(w_plate)

        if plate_given_in_report:
            if det_plate and det_plate == w_plate:
                v_id = _find_vehicle_id_by_plate(db, w_plate)
                matches.append({
                    "report_type": "witness",
                    "report_id": r.witness_report_id,
                    "vehicle_id": v_id,
                    "matched_on": "no_plate",
                })
                continue

            company_ok = det_company and w_company and det_company in w_company
            model_ok = det_model and w_model and _model_keyword_match(det_model, w_model)
            color_ok = det_color and w_color and det_color in w_color

            if company_ok and model_ok and color_ok:
                matches.append({
                    "report_type": "witness",
                    "report_id": r.witness_report_id,
                    "vehicle_id": None,
                    "matched_on": "company_model_color",
                })
        else:
            company_ok = det_company and w_company and det_company in w_company
            model_ok = det_model and w_model and _model_keyword_match(det_model, w_model)
            color_ok = det_color and w_color and det_color in w_color

            if company_ok and model_ok and color_ok:
                matches.append({
                    "report_type": "witness",
                    "report_id": r.witness_report_id,
                    "vehicle_id": None,
                    "matched_on": "company_model_color",
                })

    return matches


def _model_keyword_match(det_model, v_model):
    keywords = ["civic", "city", "corolla", "yaris", "alto", "cultus"]
    for kw in keywords:
        if kw in det_model and kw in v_model:
            return True
    return det_model in v_model or v_model in det_model


def _find_vehicle_id_by_plate(db, no_plate):
    reg = db.query(Registration).filter(Registration.no_plate == no_plate).first()
    if reg:
        v = db.query(Vehicle).filter(Vehicle.reg_id == reg.reg_id).first()
        if v:
            return v.vehicle_id
    v = db.query(Vehicle).filter(Vehicle.no_plate == no_plate).first()
    return v.vehicle_id if v else None


# ══════════════════════════════════════════════════════════════════════════════
# GENERATE ALERTS — ✅ RETURNS DICT WITH alert_id
# ══════════════════════════════════════════════════════════════════════════════

def generate_alerts(db, detection, matches):
    """Returns list of dicts with alert_id"""
    alerts = []
    for m in matches:
        alert = AIAlert(
            vehicle_id=m.get("vehicle_id"),
            camera_id=detection.camera_id,
            detection_id=detection.detection_id,
            matched_on=m["matched_on"],
            report_type=m["report_type"],
            report_id=m.get("report_id"),
        )
        db.add(alert)
        db.flush()

        # ✅ Return dict with alert_id
        alerts.append({
            "report_type": m["report_type"],
            "report_id": m.get("report_id"),
            "matched_on": m["matched_on"],
            "alert_id": alert.alert_id,
        })
    return alerts


# ══════════════════════════════════════════════════════════════════════════════
# MAIN: Process Detection
# ══════════════════════════════════════════════════════════════════════════════

def process_detection(db, camera_id, company, model_raw, color, no_plate, image_file=None):
    generation = get_generation_from_ai(model_raw)
    model_display = _format_model_name(model_raw)

    detection = save_detection(
        db=db,
        camera_id=camera_id,
        company=company.capitalize() if company else None,
        model=model_display,
        generation=generation,
        color=color,
        no_plate=no_plate if no_plate not in ("Not Found", "") else None,
        image_file=image_file,
    )

    # Level 1: Legal check
    legal_check = check_legal_vehicle(db, detection)

    alerts_generated = []
    legal_status = None
    legal_message = None

    if legal_check:
        legal_status = legal_check["legal_status"]
        legal_message = legal_check["message"]

        if legal_status in ("illegal_plate", "plate_mismatch"):
            alert = AIAlert(
                vehicle_id=None,
                camera_id=camera_id,
                detection_id=detection.detection_id,
                matched_on=legal_check["matched_on"],
                report_type="legal_check",
                report_id=None,
            )
            db.add(alert)
            db.flush()

            # ✅ alert_id included
            alerts_generated.append({
                "report_type": "legal_check",
                "report_id": None,
                "matched_on": legal_check["matched_on"],
                "alert_id": alert.alert_id,
            })

    # Level 2 & 3: Reports matching
    if legal_status is None or legal_status == "legal":
        matches = match_reports(db, detection)
        alerts = generate_alerts(db, detection, matches)  # ✅ Now returns dicts with alert_id
        alerts_generated.extend(alerts)

    db.commit()
    db.refresh(detection)

    return {
        "detection_id": detection.detection_id,
        "company": detection.company,
        "model": detection.model,
        "generation": detection.generation,
        "color": detection.color,
        "no_plate": detection.no_plate,
        "detected_at": str(detection.detected_at),
        "legal_status": legal_status,
        "legal_message": legal_message,
        "alerts_generated": len(alerts_generated),
        "matches": alerts_generated,  # ✅ Each match now has alert_id
    }


# ══════════════════════════════════════════════════════════════════════════════
# READ
# ══════════════════════════════════════════════════════════════════════════════

def get_all_detections(db):
    detections = db.query(VehicleDetection).order_by(VehicleDetection.detected_at.desc()).all()
    return [
        {
            "detection_id": d.detection_id,
            "camera_id": d.camera_id,
            "company": d.company,
            "model": d.model,
            "generation": d.generation,
            "color": d.color,
            "no_plate": d.no_plate,
            "detected_at": str(d.detected_at),
            "image_path": d.image_path,
        }
        for d in detections
    ]


def get_all_alerts(db):
    alerts = db.query(AIAlert).order_by(AIAlert.alert_time.desc()).all()
    return [
        {
            "alert_id": a.alert_id,
            "vehicle_id": a.vehicle_id,
            "camera_id": a.camera_id,
            "detection_id": a.detection_id,
            "alert_time": str(a.alert_time),
            "matched_on": a.matched_on,
            "report_type": a.report_type,
            "report_id": a.report_id,
        }
        for a in alerts
    ]



def get_all_Provincedetections(db):
    detections=db.query(func.min(VehicleDetection.detection_id).label("id")).group_by(
        VehicleDetection.no_plate
    ).subquery()
    final=(db.query(VehicleDetection.Province,func.count().label("Total")).filter
    (VehicleDetection.detection_id.in_(detections)).filter(
        func.month(VehicleDetection.detected_at)==5

    ) .group_by(VehicleDetection.Province).all())
    return[
        {
            "Province":d.Province,
            "count":d.Total,
        }
        for d in final
    ]







def get_all_Cardetections(db):
    detections=db.query(func.min(VehicleDetection.detection_id).label("id")).group_by(
        VehicleDetection.no_plate
    ).subquery()
    final=(db.query(VehicleDetection.model,func.count().label("Total")).filter
    (VehicleDetection.detection_id.in_(detections)).group_by(VehicleDetection.model).all())
    return[
        {
            "model":d.model,
            "count":d.Total,
        }
        for d in final
    ]
