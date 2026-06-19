from fastapi import FastAPI, UploadFile, File
import cv2
import os

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Backend is running"}

@app.post("/process-video")
async def process_video(video: UploadFile = File(...)):
    os.makedirs("videos", exist_ok=True)
    video_path = f"videos/{video.filename}"

    with open(video_path, "wb") as f:
        f.write(await video.read())

    cap = cv2.VideoCapture(video_path)

    fps = int(cap.get(cv2.CAP_PROP_FPS))
    frame_gap = fps // 2   # 2 frames per second

    frames = []
    count = 0

    os.makedirs("frames", exist_ok=True)

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if count % frame_gap == 0:
            frame_name = f"frames/frame_{count}.jpg"
            cv2.imwrite(frame_name, frame)
            frames.append(frame_name)

        count += 1

    cap.release()

    return {
        "total_frames": len(frames),
        "frames": frames[:6]   # first 6 frames
    }
