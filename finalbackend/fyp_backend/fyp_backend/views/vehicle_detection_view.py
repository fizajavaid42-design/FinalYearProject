import cv2
import numpy as np
import tempfile
import os
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from controllers.vehice_detection_controller import (
    process_detection,
    get_all_Provincedetections,
    get_all_alerts,
    _format_model_name,
    get_generation_from_ai,
get_all_Cardetections
)

router = APIRouter(prefix="/detection", tags=["Vehicle Detection"])

# ── Lazy load pipeline (load once, reuse) ────────────────────────────────────
_pipeline = None

def get_pipeline():
    global _pipeline
    if _pipeline is None:
        from ai_pipeline import CarPipeline
        _pipeline = CarPipeline()
    return _pipeline


# ══════════════════════════════════════════════════════════════════════════════
# POST /detection/process
# Flutter se: image + camera_id → AI run → save → match → alert
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/process")
async def process_image(
    camera_id: Optional[int]  = Form(None),
    image:     UploadFile      = File(...),
    db:        Session         = Depends(get_db),
):
    # 1. Save uploaded image to temp file
    suffix    = os.path.splitext(image.filename)[-1] or ".jpg"
    tmp_path  = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await image.read())
            tmp_path = tmp.name

        # 2. Run AI pipeline
        pipeline = get_pipeline()

        from ai_pipeline import (
            detect_all_cars,
            process_single_car,
        )

        img = cv2.imread(tmp_path)
        if img is None:
            raise HTTPException(status_code=400, detail="Image could not be read")

        car_crops = detect_all_cars(pipeline, img)
        if not car_crops:
            raise HTTPException(status_code=400, detail="No cars detected in image")

        all_results = []

        for idx, (car_crop, bbox) in enumerate(car_crops, start=1):
            ai_result = process_single_car(pipeline, car_crop, idx)

            # model_raw e.g. 'civic10'
            model_raw  = ai_result.get("Model", "Unknown")
            company    = ai_result.get("Company", "Unknown")
            color      = ai_result.get("Color", "Unknown")
            no_plate   = ai_result.get("Plate Number", "")

            # Re-upload image file for saving
            # Reset file pointer for each car using the temp path
            from fastapi import UploadFile as UF
            import io

            # Encode car crop to bytes
            _, img_bytes = cv2.imencode(suffix, car_crop)
            img_io = io.BytesIO(img_bytes.tobytes())

            class FakeUpload:
                def __init__(self, data, name):
                    self.file     = data
                    self.filename = name

            fake_file = FakeUpload(img_io, f"car_{idx}{suffix}")

            # 3. Save detection + match + alert
            result = process_detection(
                db         = db,
                camera_id  = camera_id,
                company    = company,
                model_raw  = model_raw,
                color      = color,
                no_plate   = no_plate if no_plate != "Not Found" else "",
                image_file = fake_file,
            )
            result["car_index"] = idx
            result["bbox"]      = list(bbox)
            all_results.append(result)

        return {
            "total_cars_detected": len(all_results),
            "results": all_results,
        }

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


# ══════════════════════════════════════════════════════════════════════════════
# GET /detection/all — All detections
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/all")
def all_detections(db: Session = Depends(get_db)):
    return get_all_Provincedetections(db)


# ══════════════════════════════════════════════════════════════════════════════
# GET /detection/alerts — All AI alerts
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/alerts")
def all_alerts(db: Session = Depends(get_db)):
    return get_all_alerts(db)


@router.get("/alls")
def all_detections(db: Session = Depends(get_db)):
    return get_all_Cardetections(db)