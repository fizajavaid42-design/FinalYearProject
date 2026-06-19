import cv2
import os
import shutil
from fastapi import FastAPI, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware  # Naya: CORS ke liye
from ultralytics import YOLO

app = FastAPI()

# --- CORS SETUP (Windows Desktop ke liye zaroori hai) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Har jagah se request allow karega
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
PROCESSED_DIR = "static/processed"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")

model = YOLO("model3.pt")


@app.post("/process-video")
async def process_video(video: UploadFile = File(...)):
    if os.path.exists(PROCESSED_DIR):
        shutil.rmtree(PROCESSED_DIR)
    os.makedirs(PROCESSED_DIR, exist_ok=True)

    video_path = os.path.join(UPLOAD_DIR, video.filename)
    with open(video_path, "wb") as buffer:
        shutil.copyfileobj(video.file, buffer)

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    interval = max(1, int(fps / 2))

    image_list = []
    frame_count = 0
    saved_count = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break

        if frame_count % interval == 0:
            results = model.predict(frame, conf=0.15)
            img_name = f"result_{saved_count}.jpg"
            save_path = os.path.join(PROCESSED_DIR, img_name)
            results[0].save(save_path)

            # Localhost use karen kyunke dono ek hi machine par hain
            image_url = f"http://localhost:8000/static/processed/{img_name}"
            image_list.append(image_url)
            saved_count += 1
        frame_count += 1

    cap.release()
    return {"image_list": image_list}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)