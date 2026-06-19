from sqlalchemy.orm import Session
from sqlalchemy import distinct
from models.vehicle_detection import VehicleDetection
from models.cctv_camera import CCTVCamera
from models.place import Place
from models.checkpoint import CheckPoint, CheckPointCamera


def search_cars_by_plate(db: Session, plate: str) -> list:
    """
    Plate number se unique cars search karo
    """
    if not plate or len(plate.strip()) < 2:
        return []

    plate = plate.strip().upper()

    # Unique cars with their latest detection
    detections = db.query(VehicleDetection).filter(
        VehicleDetection.no_plate.contains(plate)
    ).order_by(
        VehicleDetection.no_plate,
        VehicleDetection.detected_at.desc()
    ).all()

    # Group by plate number
    result_map = {}
    for det in detections:
        plate_key = det.no_plate or "Unknown"
        if plate_key not in result_map:
            camera = db.query(CCTVCamera).filter(
                CCTVCamera.camera_id == det.camera_id
            ).first()

            result_map[plate_key] = {
                "no_plate": plate_key,
                "company": det.company,
                "model": det.model,
                "generation": det.generation,
                "color": det.color,
                "last_detection_id": det.detection_id,
                "last_detected_at": str(det.detected_at) if det.detected_at else None,
                "last_camera": {
                    "camera_id": camera.camera_id if camera else None,
                    "direction": camera.direction if camera else None,
                    "place_name": camera.place.name if camera and camera.place else None,
                } if camera else None,
                "total_detections": 0,
            }

        result_map[plate_key]["total_detections"] += 1

    return list(result_map.values())


def get_car_route(db: Session, no_plate: str) -> dict:
    """
    Ek car ki poori route nikalo — all detections ordered by time
    """
    if not no_plate:
        return {"error": "Plate number required"}

    no_plate = no_plate.strip().upper()

    detections = db.query(VehicleDetection).filter(
        VehicleDetection.no_plate == no_plate
    ).order_by(VehicleDetection.detected_at.asc()).all()

    if not detections:
        return {"error": "No detections found for this plate"}

    car_info = {
        "no_plate": no_plate,
        "company": detections[0].company,
        "model": detections[0].model,
        "generation": detections[0].generation,
        "color": detections[0].color,
    }

    route = []
    checkpoints_set = set()

    for det in detections:
        camera = db.query(CCTVCamera).filter(
            CCTVCamera.camera_id == det.camera_id
        ).first()

        # CheckPoint find karo is camera ka
        cp_link = db.query(CheckPointCamera).filter(
            CheckPointCamera.camera_id == det.camera_id
        ).first()

        checkpoint_info = None
        if cp_link:
            cp = db.query(CheckPoint).filter(
                CheckPoint.checkpoint_id == cp_link.checkpoint_id
            ).first()
            if cp:
                checkpoint_info = {
                    "checkpoint_id": cp.checkpoint_id,
                    "name": cp.name,
                }
                checkpoints_set.add(cp.checkpoint_id)

        route.append({
            "detection_id": det.detection_id,
            "detected_at": str(det.detected_at) if det.detected_at else None,
            "image_path": det.image_path,
            "camera": {
                "camera_id": camera.camera_id if camera else None,
                "direction": camera.direction if camera else None,
                "place_name": camera.place.name if camera and camera.place else None,
            } if camera else None,
            "checkpoint": checkpoint_info,
        })

    # Time span
    first_time = detections[0].detected_at
    last_time = detections[-1].detected_at
    time_span_minutes = None
    if first_time and last_time:
        diff = last_time - first_time
        time_span_minutes = round(diff.total_seconds() / 60, 1)

    return {
        "car_info": car_info,
        "total_detections": len(detections),
        "total_checkpoints": len(checkpoints_set),
        "time_span_minutes": time_span_minutes,
        "first_seen": str(first_time) if first_time else None,
        "last_seen": str(last_time) if last_time else None,
        "route": route,
    }


def get_detection_image(db: Session, detection_id: int):
    """Get image path for a detection"""
    detection = db.query(VehicleDetection).filter(
        VehicleDetection.detection_id == detection_id
    ).first()
    if detection and detection.image_path:
        return detection.image_path
    return None