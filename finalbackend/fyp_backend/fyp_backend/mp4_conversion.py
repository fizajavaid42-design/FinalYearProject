import subprocess
import os

# 👉 Give full paths from D drive
INPUT_DIR = r"D:\BSCS(AI)\8th Semester"        # folder containing .MTS videos
OUTPUT_DIR = r"D:\BSCS(AI)\8th Semester" # output folder

os.makedirs(OUTPUT_DIR, exist_ok=True)

for file in os.listdir(INPUT_DIR):
    if file.lower().endswith(".mts"):
        input_path = os.path.join(INPUT_DIR, file)
        output_path = os.path.join(
            OUTPUT_DIR,
            os.path.splitext(file)[0] + ".mkv"
        )

        cmd = [
            "ffmpeg",
            "-y",
            "-i", input_path,
            "-map", "0",
            "-c", "copy",
            output_path
        ]

        subprocess.run(cmd)
        print(f"✅ Lossless converted: {file}")