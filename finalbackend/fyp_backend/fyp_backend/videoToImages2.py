from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from ultralytics import YOLO
import cv2
import os
import shutil

# ---------------- APP INIT ----------------
app = FastAPI(title="Car Orientation Detection API")

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- PATHS ----------------
UPLOAD_DIR = "uploads"
PROCESSED_DIR = "static/processed"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")

# ---------------- LOAD YOLO MODEL ----------------
model = YOLO("model3.pt")  # ensure classes = front, side, rear

# ---------------- API ----------------
@app.post("/process-video")
async def process_video(video: UploadFile = File(...)):
    # clear old frames
    if os.path.exists(PROCESSED_DIR):
        shutil.rmtree(PROCESSED_DIR)
    os.makedirs(PROCESSED_DIR, exist_ok=True)

    # save uploaded video
    video_path = os.path.join(UPLOAD_DIR, video.filename)
    with open(video_path, "wb") as f:
        shutil.copyfileobj(video.file, f)

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    interval = max(1, int(fps / 2))  # process every 0.5 sec

    frames = []
    frame_index = 0
    saved_index = 0

    # predefined color palette for unique car boxes (BGR)
    CAR_COLORS = [
        (0, 255, 255),   # yellow
        (255, 0, 255),   # magenta
        (255, 255, 0),   # cyan
        (128, 0, 128),   # purple
        (0, 128, 255),   # orange
        (0, 255, 128),   # light green
        (255, 128, 0),   # light blue
        (128, 255, 0),   # lime
    ]

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        if frame_index % interval == 0:
            results = model.predict(frame, conf=0.25, verbose=False)

            frame_copy = frame.copy()
            cars = []

            for i, box in enumerate(results[0].boxes):
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                class_id = int(box.cls[0])
                side = results[0].names[class_id].capitalize()
                confidence = float(box.conf[0])

                # assign a unique color to each car
                color = CAR_COLORS[i % len(CAR_COLORS)]

                # draw rectangle and label with confidence
                cv2.rectangle(frame_copy, (x1, y1), (x2, y2), color, 2)
                cv2.putText(
                    frame_copy,
                    f"{side} {confidence:.2f}",
                    (x1, y1 - 8),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    color,
                    2
                )

                # convert BGR to HEX for frontend
                bbox_color_hex = f"#{color[2]:02X}{color[1]:02X}{color[0]:02X}"

                cars.append({
                    "id": f"Car {i + 1}",
                    "side": side,
                    "confidence": round(confidence, 2),
                    "bbox_color": bbox_color_hex
                })

            img_name = f"frame_{saved_index}.jpg"
            save_path = os.path.join(PROCESSED_DIR, img_name)
            cv2.imwrite(save_path, frame_copy)

            frames.append({
                "image": f"http://localhost:8002/static/processed/{img_name}",
                "cars": cars
            })

            saved_index += 1

        frame_index += 1

    cap.release()

    return {
        "total_frames": len(frames),
        "frames": frames
    }

# ---------------- RUN SERVER ----------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8002)