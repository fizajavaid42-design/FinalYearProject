import cv2
from ultralytics import YOLO

# ─────────────────────────────────────────────────────────────────────
# SETTINGS
# ─────────────────────────────────────────────────────────────────────
VIDEO_PATH = r"C:\Users\DELL\PycharmProjects\fyp_backend\fyp_backend\uploads\speedTESTvideo.mp4"

MODEL_PATH = "best.pt"

REAL_DISTANCE = 20  # meters — TUNE THIS

LINE_A_Y = 100
LINE_B_Y = 340

SPEED_LIMIT = 80  # km/h

DISPLAY_W = 1000
DISPLAY_H = 700
DELAY_MS = 30
# ─────────────────────────────────────────────────────────────────────

# ✅ AI Pipeline import
from ai_pipeline import CarPipeline, process_single_car


def run():
    pipeline = CarPipeline()
    model = YOLO(MODEL_PATH)
    cap = cv2.VideoCapture(VIDEO_PATH)

    if not cap.isOpened():
        print(f"[ERROR] Video nahi khuli: {VIDEO_PATH}")
        return

    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    FPS = cap.get(cv2.CAP_PROP_FPS) or 30

    line_b = LINE_B_Y if LINE_B_Y is not None else int(H * 0.75)

    print(f"[INFO] Video: {W}x{H} @ {FPS:.1f} FPS")
    print(f"[INFO] Line A: y={LINE_A_Y}  |  Line B: y={line_b}")
    print(f"[INFO] Real distance: {REAL_DISTANCE} m")
    print(f"[INFO] Speed Limit: {SPEED_LIMIT} km/h")
    print(f"[INFO] AI Pipeline: Company + Model + Color + Plate + Generation")
    print(f"[INFO] Controls:  P = pause/resume  |  ESC = band karo")
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
    paused = False

    cv2.namedWindow("Car Speed Detection", cv2.WINDOW_NORMAL)
    cv2.resizeWindow("Car Speed Detection", DISPLAY_W, DISPLAY_H)

    while cap.isOpened():

        if paused:
            key = cv2.waitKey(50) & 0xFF
            if key == ord('p') or key == ord('P'):
                paused = False
                print("[INFO] Resumed")
            elif key == 27:
                break
            continue

        ret, frame = cap.read()
        if not ret:
            print("\n[INFO] Video khatam ho gayi!")
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
                        "total_time": None,
                        "is_over": False,
                        "company": None,
                        "model": None,
                        "generation": None,
                        "color": None,
                        "no_plate": None,
                        "color_code": get_color(track_id),
                    }

                info = car_data[track_id]
                color = info["color_code"]
                prev_cy = info["prev_cy"]

                # ── Line A ────────────────────────────────
                if info["frame_A"] is None:
                    if crossed_line(prev_cy, cy, LINE_A_Y):
                        info["frame_A"] = frame_num
                        info["time_A_str"] = f"Frame {frame_num} | Video: {frame_num / FPS:.2f}s"
                        print(f"  Car#{track_id:>3} -> Line A | Frame {frame_num:>5} | "
                              f"Video Time: {frame_num / FPS:.2f}s")

                # ── Line B ────────────────────────────────
                elif info["frame_B"] is None:
                    if crossed_line(prev_cy, cy, line_b):
                        info["frame_B"] = frame_num
                        info["time_B_str"] = f"Frame {frame_num} | Video: {frame_num / FPS:.2f}s"
                        total_frames = info["frame_B"] - info["frame_A"]
                        info["total_time"] = total_frames / FPS

                        if info["total_time"] > 0:
                            info["speed_kmh"] = (REAL_DISTANCE * 3.6) / info["total_time"]
                            info["is_over"] = info["speed_kmh"] > SPEED_LIMIT

                        # ✅ AI Detection
                        car_crop = frame[y1:y2, x1:x2]
                        if car_crop.size > 0:
                            try:
                                ai_result = process_single_car(pipeline, car_crop, track_id)
                                info["company"] = ai_result.get("Company", "Unknown")
                                info["model"] = ai_result.get("Model", "Unknown")
                                info["no_plate"] = ai_result.get("Plate Number", "Not Found")
                                info["color"] = ai_result.get("Color", "Unknown")

                                from ai_pipeline import get_generation_from_ai

                                model_raw = ai_result.get("Model", "")
                                info["generation"] = get_generation_from_ai(model_raw)
                            except Exception as e:
                                print(f"  ⚠️ AI detection error: {e}")

                        status = "⚠️  OVERSPEED!" if info["is_over"] else "✅ OK"
                        print(f"  Car#{track_id:>3} -> Line B | Frame {frame_num:>5} | "
                              f"Frames: {total_frames} | "
                              f"Video Time: {info['total_time']:.2f}s | "
                              f"Speed: {info['speed_kmh']:.2f} km/h | "
                              f"Company: {info['company']} | "
                              f"Model: {info['model']} | "
                              f"Color: {info['color']} | "
                              f"Plate: {info['no_plate']} | "
                              f"{status}")

                info["prev_cy"] = cy

                # ── Bounding Box ──────────────────────────
                box_color = (0, 0, 255) if info["is_over"] else color
                cv2.rectangle(frame, (x1, y1), (x2, y2), box_color, 2)
                cv2.circle(frame, (cx, cy), 6, (0, 0, 255), -1)

                # ── Label ────────────────────────────────
                if info["speed_kmh"] is not None:
                    label = f"Car#{track_id} | {info['speed_kmh']:.1f} km/h"
                    if info["is_over"]:
                        label += " ⚠️"
                    if info["company"]:
                        label += f" | {info['company']} {info['model']}"
                elif info["frame_A"] is not None:
                    elapsed = (frame_num - info["frame_A"]) / FPS
                    label = f"Car#{track_id} | Timing: {elapsed:.1f}s"
                else:
                    label = f"Car#{track_id}"

                (lw, lh), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 2)
                cv2.rectangle(frame, (x1, y1 - lh - 12), (x1 + lw + 4, y1), (0, 0, 0), -1)
                cv2.putText(frame, label, (x1 + 2, y1 - 5),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.45, box_color, 2)

        # ── Reference Lines ───────────────────────────────
        cv2.line(frame, (0, LINE_A_Y), (W, LINE_A_Y), (80, 80, 255), 2)
        cv2.putText(frame, "A (Start)", (10, LINE_A_Y - 8),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.65, (80, 80, 255), 2)

        cv2.line(frame, (0, line_b), (W, line_b), (0, 220, 220), 2)
        cv2.putText(frame, "B (End)", (10, line_b - 8),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 220, 220), 2)

        cv2.putText(frame, f"Limit: {SPEED_LIMIT} km/h", (W - 250, H - 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 255), 2)

        video_time = frame_num / FPS
        cv2.putText(frame, f"Time: {video_time:.2f}s  |  Frame: {frame_num}", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.65, (200, 200, 200), 2)

        cv2.putText(frame, "P=Pause  ESC=Quit", (10, H - 15),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (180, 180, 180), 1)

        # ── Speed Log Panel ───────────────────────────────
        panel_x = W - 320
        panel_y = 30
        cv2.putText(frame, "-- Speed Log --", (panel_x, panel_y),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        panel_y += 26
        for tid, info in sorted(car_data.items()):
            if info["speed_kmh"] is not None:
                txt = f"Car#{tid}: {info['speed_kmh']:.1f} km/h"
                if info["company"]:
                    txt += f" | {info['company']} {info['model']}"
                if info["is_over"]:
                    txt += " ⚠️"
                log_color = (0, 0, 255) if info["is_over"] else info["color_code"]
                cv2.putText(frame, txt, (panel_x, panel_y),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.45, log_color, 2)
                panel_y += 22

        display = cv2.resize(frame, (DISPLAY_W, DISPLAY_H))
        cv2.imshow("Car Speed Detection", display)

        key = cv2.waitKey(DELAY_MS) & 0xFF
        if key == 27:
            break
        elif key == ord('p') or key == ord('P'):
            paused = True
            print(f"[INFO] Paused at frame {frame_num}")

    cap.release()
    cv2.destroyAllWindows()

    # ── Final Summary ─────────────────────────────────────
    print("\n" + "=" * 70)
    print("                    FINAL SPEED SUMMARY")
    print(f"                    Speed Limit: {SPEED_LIMIT} km/h")
    print(f"                    Distance: {REAL_DISTANCE} m")
    print("=" * 70)

    total = 0
    overspeed = 0
    for tid, info in sorted(car_data.items()):
        if info["speed_kmh"] is not None:
            total += 1
            if info["is_over"]:
                overspeed += 1
            status = "⚠️  OVERSPEED!" if info["is_over"] else "✅ OK"
            print(f"  Car #{tid:>3}  |  "
                  f"Frames: {info['frame_B'] - info['frame_A']} | "
                  f"Time: {info['total_time']:.3f}s  |  "
                  f"Speed: {info['speed_kmh']:.2f} km/h  |  "
                  f"Company: {info['company']} | "
                  f"Model: {info['model']} | "
                  f"Color: {info['color']} | "
                  f"Plate: {info['no_plate']} | "
                  f"{status}")

    print("=" * 70)
    print(f"  Total Cars: {total}  |  Overspeed: {overspeed}")
    print("=" * 70)


if __name__ == "__main__":
    run()