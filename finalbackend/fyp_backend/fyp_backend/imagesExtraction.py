import ffmpeg
import os
from pathlib import Path

# -------- CONFIG --------
video_folder = r"D:\STREAM"      # folder containing all .MTS videos
output_folder = r"D:\test"       # output image folder
interval_seconds = 0.25
fps_extract = 6

# Resolution settings
scale_width = 1920   # Full HD
scale_height = 1080

# Sharpening settings (adjust as needed)
sharpen_amount = 2.0 # 0.5 to 2.0, higher = more sharp
# ------------------------

os.makedirs(output_folder, exist_ok=True)

image_counter = 1

for video_file in sorted(Path(video_folder).glob("*.MTS")):
    print(f"Processing: {video_file.name}")

    (
        ffmpeg
        .input(str(video_file))
        .filter("yadif", mode=1)                    # Better de-interlace
        .filter("fps", fps=fps_extract)
        .filter("scale", scale_width, scale_height, flags='lanczos')  # Best scaling
        .filter("unsharp", luma_msize_x=5, luma_msize_y=5,           # Sharpening filter
                luma_amount=sharpen_amount)                          # Sharpness amount
        .output(
            os.path.join(output_folder, "%d.png"),
            start_number=image_counter,
            **{'c:v': 'png',
               'pix_fmt': 'rgb24',
               'compression_level': '1'}
        )
        .run(overwrite_output=True, quiet=True)
    )

    image_counter = max(
        [int(p.stem) for p in Path(output_folder).glob("*.png")]
    ) + 1

print("✅ All videos processed with sharpening!")