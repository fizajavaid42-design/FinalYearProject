from sqlalchemy.orm import Session
from models.recovery import Recovery
from models.vehicle_handover import VehicleHandover
from models.report import UserReport, WitnessReport
from models.registration_vehicle import Vehicle, Registration


# ─── CREATE: Recovery (Police ne recover mark kiya) - THEFT ───────────────────
def create_recovery(
        db: Session,
        report_id: int,
        user_id: int,
        police_station_id: int | None = None,
        checkpoint_id: int | None = None,
) -> dict:
    report = db.query(UserReport).filter(
        UserReport.user_report_id == report_id
    ).first()
    if not report:
        return {"error": "Report not found"}

    # ✅ Multiple recovery allowed - don't check existing
    recovery = Recovery(
        report_id=report_id,
        user_id=user_id,
        police_station_id=police_station_id,
        checkpoint_id=checkpoint_id,
    )
    db.add(recovery)
    report.status = "Recovered"
    db.commit()
    db.refresh(recovery)

    return {
        "recovery_id": recovery.recovery_id,
        "report_id": recovery.report_id,
        "recovery_date": str(recovery.recovery_date),
        "message": "Recovery recorded successfully",
    }


# ─── CREATE Recovery for Witness/Accident Report ─────────────────────────────
def create_recovery_for_witness(
        db: Session,
        witness_report_id: int,
        user_id: int,
        police_station_id: int | None = None,
        checkpoint_id: int | None = None,
) -> dict:
    report = db.query(WitnessReport).filter(
        WitnessReport.witness_report_id == witness_report_id
    ).first()
    if not report:
        return {"error": "Witness report not found"}

    recovery = Recovery(
        witness_report_id=witness_report_id,
        user_id=user_id,
        police_station_id=police_station_id,
        checkpoint_id=checkpoint_id,
    )
    db.add(recovery)
    if hasattr(report, 'status'):
        report.status = "Recovered"
    db.commit()
    db.refresh(recovery)

    return {
        "recovery_id": recovery.recovery_id,
        "witness_report_id": recovery.witness_report_id,
        "recovery_date": str(recovery.recovery_date),
        "message": "Recovery recorded successfully for accident report",
    }


# ─── READ: User ki saari vehicles with recovery status ───────────────────────
def get_user_vehicles_with_recovery_status(db: Session, user_id: int) -> list:
    result = []

    # THEFT REPORTS
    vehicles = db.query(Vehicle).filter(Vehicle.user_id == user_id).all()

    for v in vehicles:
        # ✅ Get latest report for this vehicle
        report = db.query(UserReport).filter(
            UserReport.vehicle_id == v.vehicle_id
        ).order_by(UserReport.date.desc()).first()

        if report:
            # ✅ Get latest recovery for this report
            recovery = db.query(Recovery).filter(
                Recovery.report_id == report.user_report_id
            ).order_by(Recovery.recovery_date.desc()).first()

            handover_status = None
            if recovery:
                handover = db.query(VehicleHandover).filter(
                    VehicleHandover.recovery_id == recovery.recovery_id
                ).order_by(VehicleHandover.handover_date.desc()).first()
                if handover:
                    handover_status = handover.status

            reg = db.query(Registration).filter(Registration.reg_id == v.reg_id).first()

            result.append({
                "vehicle_id": v.vehicle_id,
                "no_plate": reg.no_plate if reg else "N/A",
                "company": v.company,
                "model": v.model,
                "color": v.color,
                "car_year": v.car_year,
                "engine_no": v.engine_no,
                "chassis_no": v.chassis_no,
                "report_id": report.user_report_id,
                "is_recovered": recovery is not None,
                "recovery_id": recovery.recovery_id if recovery else None,
                "recovery_date": str(recovery.recovery_date) if recovery else None,
                "handover_status": handover_status,
                "is_accident": False,
            })

    # ACCIDENT REPORTS
    accident_reports = db.query(WitnessReport).filter(WitnessReport.user_id == user_id).all()

    for report in accident_reports:
        # ✅ Get latest recovery for this report
        recovery = db.query(Recovery).filter(
            Recovery.witness_report_id == report.witness_report_id
        ).order_by(Recovery.recovery_date.desc()).first()

        handover_status = None
        if recovery:
            handover = db.query(VehicleHandover).filter(
                VehicleHandover.recovery_id == recovery.recovery_id
            ).order_by(VehicleHandover.handover_date.desc()).first()
            if handover:
                handover_status = handover.status

        result.append({
            "vehicle_id": None,
            "no_plate": report.no_plate or "N/A",
            "company": report.company or "Unknown",
            "model": report.model or "Unknown",
            "color": report.color or "Unknown",
            "car_year": None,
            "engine_no": None,
            "chassis_no": None,
            "report_id": report.witness_report_id,
            "is_recovered": recovery is not None,
            "recovery_id": recovery.recovery_id if recovery else None,
            "recovery_date": str(recovery.recovery_date) if recovery else None,
            "handover_status": handover_status,
            "is_accident": True,
            "car_image_path": report.car_image_path,
        })

    return result


# ─── READ: Recoveries by user ────────────────────────────────────────────────
def get_recoveries_by_user(db: Session, user_id: int) -> list:
    theft_recoveries = (
        db.query(Recovery)
        .join(UserReport, Recovery.report_id == UserReport.user_report_id)
        .join(Vehicle, UserReport.vehicle_id == Vehicle.vehicle_id)
        .filter(Vehicle.user_id == user_id)
        .order_by(Recovery.recovery_date.desc())
        .all()
    )

    accident_recoveries = (
        db.query(Recovery)
        .join(WitnessReport, Recovery.witness_report_id == WitnessReport.witness_report_id)
        .filter(WitnessReport.user_id == user_id)
        .order_by(Recovery.recovery_date.desc())
        .all()
    )

    result = []

    for rec in theft_recoveries:
        v = rec.report.vehicle if rec.report else None
        reg = db.query(Registration).filter(Registration.reg_id == v.reg_id).first() if v else None
        result.append({
            "recovery_id": rec.recovery_id,
            "recovery_date": str(rec.recovery_date),
            "no_plate": reg.no_plate if reg else None,
            "company": v.company if v else None,
            "model": v.model if v else None,
            "color": v.color if v else None,
            "car_year": v.car_year if v else None,
            "engine_no": v.engine_no if v else None,
            "chassis_no": v.chassis_no if v else None,
            "is_accident": False,
        })

    for rec in accident_recoveries:
        report = rec.witness_report
        result.append({
            "recovery_id": rec.recovery_id,
            "recovery_date": str(rec.recovery_date),
            "no_plate": report.no_plate if report else None,
            "company": report.company if report else None,
            "model": report.model if report else None,
            "color": report.color if report else None,
            "car_year": None,
            "engine_no": None,
            "chassis_no": None,
            "is_accident": True,
        })

    return result


# ─── READ: Single recovery by ID ─────────────────────────────────────────────
def get_recovery_by_id(db: Session, recovery_id: int):
    return db.query(Recovery).filter(Recovery.recovery_id == recovery_id).first()


# ─── READ: All recoveries (Admin) ────────────────────────────────────────────
def get_all_recoveries(db: Session) -> list:
    recoveries = db.query(Recovery).order_by(Recovery.recovery_date.desc()).all()
    result = []
    for rec in recoveries:
        if rec.report_id:
            v = rec.report.vehicle if rec.report else None
            reg = db.query(Registration).filter(Registration.reg_id == v.reg_id).first() if v else None
            result.append({
                "recovery_id": rec.recovery_id,
                "report_id": rec.report_id,
                "recovery_date": str(rec.recovery_date),
                "no_plate": reg.no_plate if reg else None,
                "company": v.company if v else None,
                "model": v.model if v else None,
                "color": v.color if v else None,
                "type": "theft",
            })
        elif rec.witness_report_id:
            report = rec.witness_report
            result.append({
                "recovery_id": rec.recovery_id,
                "report_id": rec.witness_report_id,
                "recovery_date": str(rec.recovery_date),
                "no_plate": report.no_plate if report else None,
                "company": report.company if report else None,
                "model": report.model if report else None,
                "color": report.color if report else None,
                "type": "accident",
            })
    return result


# ─── SEARCH: Recovery by number plate ────────────────────────────────────────
def search_recovery_by_plate(db: Session, no_plate: str, user_id: int) -> dict | None:
    reg = db.query(Registration).filter(
        Registration.no_plate == no_plate,
        Registration.user_id == user_id,
    ).first()
    if not reg:
        return None
    vehicle = db.query(Vehicle).filter(Vehicle.reg_id == reg.reg_id).first()
    if not vehicle:
        return None
    report = db.query(UserReport).filter(UserReport.vehicle_id == vehicle.vehicle_id).first()
    if not report:
        return None
    recovery = db.query(Recovery).filter(Recovery.report_id == report.user_report_id).first()
    if not recovery:
        return None
    return {
        "vehicle_id": vehicle.vehicle_id,
        "report_id": report.user_report_id,
        "no_plate": reg.no_plate,
        "company": vehicle.company,
        "model": vehicle.model,
        "color": vehicle.color,
        "car_year": vehicle.car_year,
        "engine_no": vehicle.engine_no,
        "chassis_no": vehicle.chassis_no,
        "is_recovered": True,
        "recovery_id": recovery.recovery_id,
        "recovery_date": str(recovery.recovery_date),
    }


# ─── CREATE: Handover Request ────────────────────────────────────────────────
def create_handover_request(
        db: Session,
        recovery_id: int,
        police_station_id: int,
        owner_cnic: str,
        document_paths: str | None = None,
) -> dict:
    recovery = db.query(Recovery).filter(Recovery.recovery_id == recovery_id).first()
    if not recovery:
        return {"error": "Recovery not found"}
    existing = db.query(VehicleHandover).filter(VehicleHandover.recovery_id == recovery_id).first()
    if existing:
        return {"error": "Handover request already submitted"}
    handover = VehicleHandover(
        recovery_id=recovery_id,
        police_station_id=police_station_id,
        owner_cnic=owner_cnic,
        document_paths=document_paths,
        status="Pending"
    )
    db.add(handover)
    db.commit()
    db.refresh(handover)
    return {
        "handover_id": handover.handover_id,
        "message": "Handover request submitted successfully"
    }


# ─── DELETE: Recovery ────────────────────────────────────────────────────────
def delete_recovery(db: Session, recovery_id: int) -> dict:
    recovery = db.query(Recovery).filter(Recovery.recovery_id == recovery_id).first()
    if not recovery:
        return {"error": "Recovery not found"}
    db.delete(recovery)
    db.commit()
    return {"message": "Recovery deleted"}