import os
import cv2
import ffmpeg
import numpy as np
from ultralytics import YOLO
from pathlib import Path

# ---------------- CONFIG ----------------
video_folder = r"D:\STREAM"
output_folder = r"D:\test"

fps_extract = 30

scale_width = 1920
scale_height = 1080

CAR_CLASS_ID = 2
model = YOLO("yolov8n.pt")

os.makedirs(output_folder, exist_ok=True)

frame_count = 0
saved_count = 0

# ---------------- PROCESS VIDEOS ----------------
for video_file in sorted(Path(video_folder).glob("*.MTS")):
    print(f"\n🎥 Processing: {video_file.name}")

    # 🔥 SAME QUALITY PIPELINE AS YOUR EXTRACTOR
    process = (
        ffmpeg
        .input(str(video_file))
        .filter("yadif", mode=1)  # deinterlace (VERY IMPORTANT for MTS)
        .filter("fps", fps=fps_extract)
        .filter("scale", scale_width, scale_height, flags="lanczos")
        .filter("unsharp", luma_msize_x=5, luma_msize_y=5, luma_amount=1.5)
        .output("pipe:", format="rawvideo", pix_fmt="rgb24")
        .run_async(pipe_stdout=True, pipe_stderr=True)
    )

    frame_size = scale_width * scale_height * 3

    while True:
        in_bytes = process.stdout.read(frame_size)

        if not in_bytes:
            break

        frame = np.frombuffer(in_bytes, np.uint8).reshape([scale_height, scale_width, 3])

        frame_count += 1

        # YOLO inference
        results = model(frame, verbose=False)

        car_detected = False

        for r in results:
            for box in r.boxes:
                if int(box.cls[0]) == CAR_CLASS_ID:
                    car_detected = True
                    break
            if car_detected:
                break

        # Save only car frames
        if car_detected:
            save_path = os.path.join(output_folder, f"car_frame_{frame_count}.jpg")

            # convert RGB → BGR for OpenCV
            cv2.imwrite(save_path, cv2.cvtColor(frame, cv2.COLOR_RGB2BGR))

            saved_count += 1
            print(f"🚗 Car found → saved frame {frame_count}")

    process.stdout.close()

print("\n==============================")
print("✅ DONE")
print(f"📊 Total frames processed: {frame_count}")
print(f"🚗 Car frames saved: {saved_count}")
print(f"📁 Output folder: {output_folder}")