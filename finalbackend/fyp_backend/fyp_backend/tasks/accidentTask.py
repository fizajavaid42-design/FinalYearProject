from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import Optional
import os
import cv2
import numpy as np
import easyocr
import re
from ultralytics import YOLO

router = APIRouter()

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

MODEL_PATH = "best.pt"

SPEED_LIMIT = 80  # km/h

# ══════════════════════════════════════════════════════════════
#  CONFIG — AI Pipeline model paths
# ══════════════════════════════════════════════════════════════
CAR_DETECTION_MODEL_PATH = "best.pt"
PLATE_MODEL_PATH = "license_plate_detector.pt"
COMPANY_MODEL_PATH = "company.pt"
HONDA_MODEL_PATH = "honda.pt"
SUZUKI_MODEL_PATH = "suzuki.pt"
TOYOTA_MODEL_PATH = "toyota.pt"

# ✅ Absolute paths for color model files
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
COLOR_MODEL_PATH = os.path.join(BASE_DIR, "model-weights-spectrico-car-colors-recognition-mobilenet_v3-224x224-180420.pb")
COLOR_LABELS_PATH = os.path.join(BASE_DIR, "labels.txt")
COLOR_OUTPUT_LAYER = "Predictions/Softmax/Softmax"
COLOR_INPUT_SIZE = (224, 224)

# ✅ DB imports
from database import SessionLocal
from models.vehicle_detection import VehicleDetection
from models.ai_alert import AIAlert
from models.speed_detection import SpeedDetection


# ══════════════════════════════════════════════════════════════
#  HELPER FUNCTIONS (AI Pipeline)
# ══════════════════════════════════════════════════════════════

def format_model_name(model_name: str) -> str:
    if not model_name or model_name == "Unknown":
        return model_name

    model_name_lower = model_name.lower()
    patterns = {
        "city": "City", "civic": "Civic",
        "corolla": "Corolla", "yaris": "Yaris",
        "alto": "Alto", "cultus": "Cultus",
    }

    for key, display_name in patterns.items():
        if key in model_name_lower:
            numbers = re.findall(r'\d+', model_name)
            if numbers:
                num = int(numbers[0])
                suffix = {1: "1st", 2: "2nd", 3: "3rd"}.get(num, f"{num}th")
                return f"{display_name} ({suffix} Generation)"
            else:
                return display_name

    return model_name.capitalize()


def get_generation_from_ai(model_raw: str) -> str | None:
    if not model_raw:
        return None
    numbers = re.findall(r'\d+', model_raw)
    if numbers:
        num = int(numbers[0])
        return {1: "1st", 2: "2nd", 3: "3rd"}.get(num, f"{num}th")
    return None


def preprocess_plate_crop(crop: np.ndarray):
    try:
        crop = cv2.resize(crop, (400, 100))
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (3, 3), 0)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        gray = cv2.dilate(gray, kernel, iterations=1)
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        return thresh
    except:
        return None


# ══════════════════════════════════════════════════════════════
#  CAR PIPELINE CLASS
# ══════════════════════════════════════════════════════════════

class CarPipeline:
    def __init__(self):
        print("[INFO] Loading models — please wait...")
        self.car_detector = YOLO(CAR_DETECTION_MODEL_PATH)
        print("[OK] Car detector loaded (best.pt)")
        self.plate_model = YOLO(PLATE_MODEL_PATH)
        print("[OK] License plate detector loaded")
        self.company_model = YOLO(COMPANY_MODEL_PATH)
        print("[OK] Company model loaded")
        self.sub_models = {
            "honda": YOLO(HONDA_MODEL_PATH),
            "suzuki": YOLO(SUZUKI_MODEL_PATH),
            "toyota": YOLO(TOYOTA_MODEL_PATH),
        }
        print("[OK] Sub-models loaded (honda, suzuki, toyota)")
        self.ocr_reader = easyocr.Reader(['en'], gpu=False)
        print("[OK] EasyOCR ready")
        self.color_net = cv2.dnn.readNetFromTensorflow(COLOR_MODEL_PATH)
        self.color_labels = self._load_labels(COLOR_LABELS_PATH)
        print("[OK] Color model loaded")
        print("[INFO] All models ready!\n")

    @staticmethod
    def _load_labels(path):
        with open(path, "r") as f:
            return [line.strip() for line in f.readlines()]


# ══════════════════════════════════════════════════════════════
#  AI DETECTION FUNCTIONS
# ══════════════════════════════════════════════════════════════

def detect_company(pipeline: CarPipeline, image: np.ndarray) -> str:
    try:
        results = pipeline.company_model(image, verbose=False, conf=0.01, imgsz=320)
        for result in results:
            if result.boxes and len(result.boxes) > 0:
                confidences = result.boxes.conf.tolist()
                best_idx = int(np.argmax(confidences))
                class_id = int(result.boxes.cls[best_idx])
                class_name = result.names[class_id].lower()
                return class_name
        return "Unknown"
    except:
        return "Unknown"


def detect_car_model(pipeline: CarPipeline, image: np.ndarray, company: str) -> str:
    company = company.lower()
    if company not in pipeline.sub_models:
        return "Unknown"
    try:
        sub_model = pipeline.sub_models[company]
        results = sub_model(image, verbose=False, conf=0.01, imgsz=320)
        for result in results:
            if result.boxes and len(result.boxes) > 0:
                confidences = result.boxes.conf.tolist()
                best_idx = int(np.argmax(confidences))
                class_id = int(result.boxes.cls[best_idx])
                class_name = result.names[class_id]
                return class_name
        return "Unknown"
    except:
        return "Unknown"


def detect_plate(pipeline: CarPipeline, image: np.ndarray) -> str:
    try:
        results = pipeline.plate_model(image, verbose=False, conf=0.25, imgsz=640)
        for result in results:
            if result.boxes:
                for box in result.boxes.xyxy:
                    x1, y1, x2, y2 = map(int, box)
                    crop = image[y1:y2, x1:x2]
                    if crop.size == 0:
                        continue
                    preprocessed = preprocess_plate_crop(crop)
                    if preprocessed is None:
                        continue
                    ocr_results = pipeline.ocr_reader.readtext(
                        preprocessed, detail=0,
                        allowlist='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-',
                        paragraph=False
                    )
                    for text in ocr_results:
                        text = text.strip().replace(" ", "")
                        if len(text) >= 5 and any(c.isalpha() for c in text) and any(c.isdigit() for c in text):
                            return text
        return "Not Found"
    except:
        return "Not Found"


def detect_color(pipeline: CarPipeline, image: np.ndarray) -> str:
    try:
        blob = cv2.dnn.blobFromImage(
            image, scalefactor=1.0 / 255.0, size=COLOR_INPUT_SIZE,
            mean=(0, 0, 0), swapRB=True, crop=False
        )
        pipeline.color_net.setInput(blob)
        predictions = pipeline.color_net.forward(COLOR_OUTPUT_LAYER)
        scores = predictions[0]
        top_idx = int(np.argmax(scores))
        color = pipeline.color_labels[top_idx]
        return color
    except:
        return "Unknown"


def process_single_car(pipeline: CarPipeline, car_crop: np.ndarray, car_id: int) -> dict:
    company = detect_company(pipeline, car_crop)
    company = company.capitalize() if company != "Unknown" else "Unknown"

    if company.lower() in ["honda", "suzuki", "toyota"]:
        car_model_raw = detect_car_model(pipeline, car_crop, company)
        car_model = format_model_name(car_model_raw)
    else:
        car_model = "Unknown"

    plate = detect_plate(pipeline, car_crop)
    color = detect_color(pipeline, car_crop)
    color = color.capitalize() if color != "Unknown" else "Unknown"

    return {
        "Car_ID": car_id,
        "Company": company,
        "Model": car_model,
        "Plate Number": plate,
        "Color": color
    }


# ══════════════════════════════════════════════════════════════
#  INIT PIPELINE (Load Once)
# ══════════════════════════════════════════════════════════════
_pipeline = None

def get_pipeline():
    global _pipeline
    if _pipeline is None:
        _pipeline = CarPipeline()
    return _pipeline


# ══════════════════════════════════════════════════════════════
#  PROCESS VIDEO FUNCTION
# ══════════════════════════════════════════════════════════════

def process_video(VIDEO_PATH, camera_id=None):
    REAL_DISTANCE = 20
    LINE_A_Y = 100
    LINE_B_Y = 340

    pipeline = get_pipeline()
    model = YOLO(MODEL_PATH)
    cap = cv2.VideoCapture(VIDEO_PATH)

    if not cap.isOpened():
        print(f"[ERROR] Video nahi khuli: {VIDEO_PATH}")
        return []

    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    FPS = cap.get(cv2.CAP_PROP_FPS) or 30

    if LINE_B_Y is None:
        LINE_B_Y = int(H * 0.75)

    print(f"[INFO] {W}x{H} @ {FPS:.1f} FPS")
    print(f"[INFO] Line A: y={LINE_A_Y} | Line B: y={LINE_B_Y}")
    print(f"[INFO] Real distance: {REAL_DISTANCE} m")
    print(f"[INFO] Speed Limit: {SPEED_LIMIT} km/h")
    print("-" * 70)

    COLORS = [
        (0, 255, 0), (255, 0, 255), (0, 165, 255),
        (255, 255, 0), (128, 0, 255), (0, 255, 255),
        (255, 128, 0), (0, 128, 255), (180, 255, 0),
    ]

    def get_color(tid):
        return COLORS[tid % len(COLORS)]

    def crossed_line(prev_cy, curr_cy, line_y):
        if prev_cy is None:
            return False
        return (prev_cy < line_y <= curr_cy) or (curr_cy <= line_y < prev_cy)

    car_data = {}
    frame_num = 0

    db = SessionLocal()

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame_num += 1
        results = model.track(frame, persist=True, verbose=False)

        for r in results:
            if r.boxes.id is None:
                continue

            for box, track_id in zip(r.boxes, r.boxes.id.int().tolist()):
                cls_id = int(box.cls[0])
                if model.names[cls_id] != "car":
                    continue

                x1, y1, x2, y2 = map(int, box.xyxy[0])
                cx = (x1 + x2) // 2
                cy = (y1 + y2) // 2

                if track_id not in car_data:
                    car_data[track_id] = {
                        "prev_cy": None,
                        "frame_A": None,
                        "frame_B": None,
                        "time_A_str": None,
                        "time_B_str": None,
                        "speed_kmh": None,
                        "total_time_sec": None,
                        "is_over": False,
                        "company": None,
                        "model": None,
                        "generation": None,
                        "color": None,
                        "no_plate": None,
                        "alert_id": None,
                        "detection_id": None,
                        "speed_db_id": None,
                    }

                info = car_data[track_id]
                prev_cy = info["prev_cy"]

                if info["frame_A"] is None:
                    if crossed_line(prev_cy, cy, LINE_A_Y):
                        info["frame_A"] = frame_num
                        info["time_A_str"] = f"Frame {frame_num} | Video: {frame_num / FPS:.2f}s"

                elif info["frame_B"] is None:
                    if crossed_line(prev_cy, cy, LINE_B_Y):
                        info["frame_B"] = frame_num
                        info["time_B_str"] = f"Frame {frame_num} | Video: {frame_num / FPS:.2f}s"

                        total_frames = info["frame_B"] - info["frame_A"]
                        time_seconds = total_frames / FPS
                        info["total_time_sec"] = time_seconds

                        if time_seconds > 0:
                            info["speed_kmh"] = (REAL_DISTANCE * 3.6) / time_seconds
                            info["is_over"] = info["speed_kmh"] > SPEED_LIMIT

                        # AI Detection
                        car_crop = frame[y1:y2, x1:x2]
                        if car_crop.size > 0:
                            try:
                                ai_result = process_single_car(pipeline, car_crop, track_id)
                                info["company"] = ai_result.get("Company", "Unknown")
                                info["model"] = ai_result.get("Model", "Unknown")
                                info["no_plate"] = ai_result.get("Plate Number", "Not Found")
                                info["color"] = ai_result.get("Color", "Unknown")
                                model_raw = ai_result.get("Model", "")
                                info["generation"] = get_generation_from_ai(model_raw)
                            except Exception as e:
                                print(f"  ⚠️ AI detection error: {e}")

                        # Save VehicleDetection
                        detection = VehicleDetection(
                            camera_id=camera_id,
                            company=info["company"] or "Unknown",
                            model=info["model"] or "Unknown",
                            generation=info["generation"],
                            color=info["color"] or "Unknown",
                            no_plate=info["no_plate"] if info["no_plate"] != "Not Found" else None,
                        )
                        db.add(detection)
                        db.flush()
                        info["detection_id"] = detection.detection_id

                        # Alert for overspeed
                        alert_id = None
                        if info["is_over"]:
                            alert = AIAlert(
                                vehicle_id=None,
                                camera_id=camera_id,
                                detection_id=detection.detection_id,
                                matched_on="overspeed",
                                report_type="speed_detection",
                                report_id=None,
                            )
                            db.add(alert)
                            db.flush()
                            alert_id = alert.alert_id
                            info["alert_id"] = alert_id

                        # Save SpeedDetection
                        speed_record = SpeedDetection(
                            video_path=VIDEO_PATH,
                            car_id=track_id,
                            speed_kmh=round(info["speed_kmh"], 2) if info["speed_kmh"] else None,
                            is_over_speed=info["is_over"],
                            time_A=info["time_A_str"],
                            time_B=info["time_B_str"],
                            time_diff_sec=round(info["total_time_sec"], 3) if info["total_time_sec"] else None,
                            company=info["company"] or "Unknown",
                            model=info["model"] or "Unknown",
                            generation=info["generation"],
                            color=info["color"] or "Unknown",
                            no_plate=info["no_plate"] if info["no_plate"] != "Not Found" else None,
                            camera_id=camera_id,
                            detection_id=detection.detection_id,
                            alert_id=alert_id,
                        )
                        db.add(speed_record)
                        db.flush()
                        info["speed_db_id"] = speed_record.speed_id

                        status = "⚠️  OVERSPEED!" if info["is_over"] else "✅ OK"
                        print(f"  Car#{track_id:>3} -> Line B | Speed: {info['speed_kmh']:.2f} km/h | {info['company']} {info['model']} | {status}")

                info["prev_cy"] = cy

    db.commit()
    db.close()
    cap.release()

    # Final Summary
    speeds = []
    overspeed_count = 0
    for tid, info in sorted(car_data.items()):
        if info["speed_kmh"] is not None:
            speed_val = round(info["speed_kmh"], 2)
            is_over = info["is_over"]
            if is_over:
                overspeed_count += 1
            speeds.append({
                "car_id": tid,
                "speed_kmh": speed_val,
                "time_A": info["time_A_str"],
                "time_B": info["time_B_str"],
                "time_diff_sec": round(info["total_time_sec"], 3) if info["total_time_sec"] else None,
                "is_over_speed": is_over,
                "speed_limit": SPEED_LIMIT,
                "company": info["company"] or "Unknown",
                "model": info["model"] or "Unknown",
                "generation": info["generation"],
                "color": info["color"] or "Unknown",
                "no_plate": info["no_plate"] if info["no_plate"] != "Not Found" else None,
                "alert_generated": info["alert_id"] is not None,
                "alert_id": info["alert_id"],
                "detection_id": info["detection_id"],
                "speed_db_id": info["speed_db_id"],
            })

    print(f"[INFO] Total: {len(speeds)} | Overspeed: {overspeed_count}")
    return speeds


# ══════════════════════════════════════════════════════════════
#  API ROUTE
# ══════════════════════════════════════════════════════════════

@router.post("/upload_video")
async def upload_video(
    video: UploadFile = File(...),
    camera_id: Optional[int] = Form(None),
):
    if not video.filename:
        return JSONResponse(status_code=400, content={"error": "No video uploaded"})

    filepath = os.path.join(UPLOAD_FOLDER, video.filename)

    with open(filepath, "wb") as f:
        content = await video.read()
        f.write(content)

    speeds = process_video(filepath, camera_id=camera_id)
    overspeed_count = sum(1 for s in speeds if s["is_over_speed"])

    return {
        "message": "Video processed successfully",
        "total_cars": len(speeds),
        "overspeed_count": overspeed_count,
        "speed_limit": SPEED_LIMIT,
        "speeds": speeds,
    }