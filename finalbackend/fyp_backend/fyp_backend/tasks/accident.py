import cv2
import numpy as np
import os
from collections import defaultdict, deque


VIDEO_PATH         = "testVideo.mp4"
FRAMES_DIR         = "frames"
YOLO_MODEL         = "best.pt"
EXTRACT_EVERY      = 4     # har 2nd frame extract karo
CONF_THRESHOLD     = 0.40    # YOLO confidence

# Accident thresholds - in teeno ka milna zaroori hai
DISTANCE_THRESHOLD = 120     # pixels - cars centers ke darmiyan
SPEED_DROP_MIN     = 15      # pixels/frame - kitni speed drop ho
APPROACH_FRAMES    = 5       # kitne frames tak cars paas aati rahen
ACCIDENT_FRAMES    = 4       # kitne consecutive frames mein ho to confirm
# ─────────────────────────────────────────────


def iou(boxA, boxB):
    xA = max(boxA[0], boxB[0]);  yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2]);  yB = min(boxA[3], boxB[3])
    inter = max(0, xB - xA) * max(0, yB - yA)
    if inter == 0:
        return 0.0
    areaA = (boxA[2]-boxA[0]) * (boxA[3]-boxA[1])
    areaB = (boxB[2]-boxB[0]) * (boxB[3]-boxB[1])
    return inter / float(areaA + areaB - inter)


def dist(c1, c2):
    return np.sqrt((c1[0]-c2[0])**2 + (c1[1]-c2[1])**2)


def center(box):
    return ((box[0]+box[2])//2, (box[1]+box[3])//2)


def draw_alert(frame, message):
    h, w = frame.shape[:2]
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, h//2-60), (w, h//2+60), (0,0,180), -1)
    cv2.addWeighted(overlay, 0.65, frame, 0.35, 0, frame)
    cv2.putText(frame, message,
                (w//2 - 260, h//2 + 15),
                cv2.FONT_HERSHEY_DUPLEX, 1.2, (255,255,255), 3)


# ══════════════════════════════════════════════
#  PHASE 1: FRAMES EXTRACT
# ══════════════════════════════════════════════
def extract_frames(video_path, output_dir, every_n=1):
    print("\n" + "="*50)
    print("  PHASE 1: FRAMES EXTRACT HO RAHE HAIN...")
    print("="*50)

    os.makedirs(output_dir, exist_ok=True)
    cap = cv2.VideoCapture(video_path)
    # if not cap.isOpened():
    #     print(f" Video nahi khuli: {video_path}")
    #     return [], 0

    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    # print(f" Video: {w}x{h} @ {fps:.1f}fps | Total frames: {total_frames}")

    saved, frame_num, count = [], 0, 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame_num += 1
        if frame_num % every_n == 0:
            fname = os.path.join(output_dir, f"frame_{frame_num:06d}.jpg")
            cv2.imwrite(fname, frame)
            saved.append({"path": fname, "frame_num": frame_num,
                          "timestamp": frame_num/fps, "frame": frame})
            count += 1
            if count % 50 == 0:
                print(f"   {count} frames... ({frame_num}/{total_frames})")

    cap.release()
    print(f"\nPhase 1 Complete! {count} frames save ho gaye\n")
    return saved, fps


# ══════════════════════════════════════════════
#  PHASE 2: ANALYZE FRAMES
# ══════════════════════════════════════════════
def analyze_frames(frames_data, fps):
    print("="*50)
    print("  PHASE 2: FRAMES ANALYZE HO RAHE HAIN...")
    print("="*50)

    from ultralytics import YOLO
    model = YOLO(YOLO_MODEL)
    print(f"YOLO load: {YOLO_MODEL}\n")

    track_history = defaultdict(lambda: deque(maxlen=20))
    speed_history = defaultdict(lambda: deque(maxlen=20))
    dist_history  = defaultdict(lambda: deque(maxlen=20))  # pair distance history

    collision_count = 0
    accident_time   = None
    total_accidents = 0
    accident_log    = []
    total           = len(frames_data)

    for idx, fdata in enumerate(frames_data):
        frame     = fdata["frame"].copy()
        frame_num = fdata["frame_num"]
        timestamp = fdata["timestamp"]

        # ── YOLO detect ──
        results = model.track(
            frame, persist=True,
            classes=[0],
            conf=CONF_THRESHOLD,
            verbose=False
        )

        boxes = []
        if results[0].boxes is not None and results[0].boxes.id is not None:
            for box, tid in zip(results[0].boxes.xyxy.cpu().numpy(),
                                results[0].boxes.id.cpu().numpy()):
                x1, y1, x2, y2 = map(int, box)
                tid = int(tid)
                cx, cy = center((x1, y1, x2, y2))

                hist = track_history[tid]
                spd  = dist((cx,cy), hist[-1]) if hist else 0.0
                # speed = distance between centers of two frames
                hist.append((cx, cy))
                speed_history[tid].append(spd)
                boxes.append((tid, x1, y1, x2, y2, cx, cy, spd))

                # Draw car
                avg_spd = np.mean(speed_history[tid])
                cv2.rectangle(frame, (x1,y1), (x2,y2), (0,220,0), 2)
                cv2.circle(frame, (cx,cy), 5, (0,255,255), -1)
                cv2.putText(frame, f"Car#{tid} spd:{avg_spd:.1f}",
                            (x1, y1-8), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,220,0), 2)
                # Trail
                pts = list(hist)
                for k in range(1, len(pts)):
                    cv2.line(frame, pts[k-1], pts[k], (0,180,255), 1)

        # ── Pair-wise collision check ──
        collision_detected = False
        min_dist_val  = float('inf')
        collision_reason   = ""

        for i in range(len(boxes)):
            for j in range(i+1, len(boxes)):
                tidA, x1A,y1A,x2A,y2A, cxA,cyA, spdA = boxes[i]
                tidB, x1B,y1B,x2B,y2B, cxB,cyB, spdB = boxes[j]

                current_dist = dist((cxA,cyA), (cxB,cyB))
                min_dist_val = min(min_dist_val, current_dist)
                overlap      = iou((x1A,y1A,x2A,y2A), (x1B,y1B,x2B,y2B))

                pair_key = f"{min(tidA,tidB)}_{max(tidA,tidB)}"
                dist_history[pair_key].append(current_dist)
                d_list = list(dist_history[pair_key])

                # ── 3 STRICT CONDITIONS ──

                # 1. Cars approaching thi? (distance kam ho rahi thi)
                approaching = False
                if len(d_list) >= APPROACH_FRAMES:
                    # Last N frames mein distance consistently kam hui?
                    diffs = [d_list[k] - d_list[k+1] for k in range(len(d_list)-1)]
                    positive_diffs = sum(1 for d in diffs[-APPROACH_FRAMES:] if d > 0)
                    approaching = positive_diffs >= (APPROACH_FRAMES // 2)

                # 2. Abhi bahut paas hain?
                very_close = current_dist < DISTANCE_THRESHOLD

                # 3. Speed drop hua? (koi ek car ruk gayi ya slow hui)
                hA      = list(speed_history[tidA])
                hB      = list(speed_history[tidB])
                max_A   = max(hA[:-3], default=0) if len(hA) > 3 else 0
                max_B   = max(hB[:-3], default=0) if len(hB) > 3 else 0
                drop_A  = max_A - spdA
                drop_B  = max_B - spdB
                speed_dropped = drop_A > SPEED_DROP_MIN or drop_B > SPEED_DROP_MIN

                # Distance line color
                if very_close:
                    line_color = (0, 0, 255)    # red = danger
                elif current_dist < DISTANCE_THRESHOLD * 1.5:
                    line_color = (0, 165, 255)  # orange = caution
                else:
                    line_color = (0, 255, 0)    # green = safe

                mid = ((cxA+cxB)//2, (cyA+cyB)//2)
                cv2.line(frame, (cxA,cyA), (cxB,cyB), line_color, 1)
                cv2.putText(frame, f"{current_dist:.0f}px",
                            mid, cv2.FONT_HERSHEY_SIMPLEX, 0.45, line_color, 1)

                # ── ACCIDENT: TEENO CONDITIONS SAATH ──
                if approaching and very_close and speed_dropped:
                    collision_detected = True
                    collision_reason   = (
                        f"COLLISION! dist:{current_dist:.0f}px | "
                        f"drop:{max(drop_A,drop_B):.0f}px/f | "
                        f"IoU:{overlap:.2f}"
                    )
                    # Impact zone highlight
                    if overlap > 0:
                        ix1 = max(x1A,x1B); iy1 = max(y1A,y1B)
                        ix2 = min(x2A,x2B); iy2 = min(y2A,y2B)
                        if ix2 > ix1 and iy2 > iy1:
                            ov = frame.copy()
                            cv2.rectangle(ov, (ix1,iy1), (ix2,iy2), (0,0,255), -1)
                            cv2.addWeighted(ov, 0.5, frame, 0.5, 0, frame)
                    cv2.putText(frame, "IMPACT!",
                                (mid[0]-30, mid[1]-15),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,0,255), 2)

        # ── Consecutive frames confirm ──
        if collision_detected:
            collision_count += 1
        else:
            collision_count = max(0, collision_count - 1)

        if collision_count >= ACCIDENT_FRAMES:
            if accident_time is None:
                accident_time   = timestamp
                total_accidents += 1
                m, s = int(accident_time//60), accident_time % 60
                log_entry = {
                    "accident_num": total_accidents,
                    "time"        : f"{m:02d}:{s:05.2f}",
                    "frame"       : frame_num,
                    "reason"      : collision_reason,
                    "distance"    : f"{min_dist_val:.1f}px"
                }
                accident_log.append(log_entry)
                print(f"  🚨 ACCIDENT #{total_accidents} | Frame:{frame_num} | "
                      f"Time:{m:02d}:{s:05.2f}")
                print(f"       {collision_reason}")
            draw_alert(frame, f"ACCIDENT DETECTED! #{total_accidents}")
        else:
            accident_time = None

        # Danger zone (paas hain lekin accident nahi hua)
        if min_dist_val < DISTANCE_THRESHOLD and not collision_detected and len(boxes) >= 2:
            cv2.putText(frame, f"DANGER ZONE! {min_dist_val:.0f}px",
                        (10, 55), cv2.FONT_HERSHEY_SIMPLEX,
                        0.7, (0,165,255), 2)

        # ── Info panel ──
        cv2.rectangle(frame, (0,0), (600,30), (0,0,0), -1)
        m, s = int(timestamp//60), timestamp % 60
        cv2.putText(frame,
                    f"Frame:{frame_num} | Time:{m:02d}:{s:05.2f} | "
                    f"Cars:{len(boxes)} | Accidents:{total_accidents}",
                    (6, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (200,200,200), 1)

        if (idx+1) % 30 == 0:
            print(f"  📊 {idx+1}/{total} | Cars:{len(boxes)} | Accidents:{total_accidents}")

        # ── Display ──
        display = cv2.resize(frame, (1280, 720))
        cv2.imshow("Car Accident Detector | Q=Quit", display)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            print("⛔ Band kar diya.")
            break
    #
    # # ── Final Report ──
    # print("\n" + "="*50)
    # print("  FINAL REPORT")
    # print("="*50)
    # print(f"   Frames analyzed : {total}")
    # print(f"  🚨 Accidents       : {total_accidents}")
    # if accident_log:
    #     print("\n  📋 Accident Details:")
    #     for a in accident_log:
    #         print(f"     #{a['accident_num']} | Time:{a['time']} | Frame:{a['frame']}")
    #         print(f"          {a['reason']}")
    #         print(f"          Min Distance: {a['distance']}")
    # else:
    #     print("\n  ✅ Koi accident detect nahi hua!")
    # print("="*50)
    #
    # print("\n⏸  Q dabao window band karne ke liye...")
    cv2.waitKey(0)
    cv2.destroyAllWindows()


# ══════════════════════════════════════════════
#  MAIN
# ══════════════════════════════════════════════
if __name__ == "__main__":
    print("\n CAR ACCIDENT DETECTION SYSTEM")
    print("="*50)

    frames_data, fps = extract_frames(VIDEO_PATH, FRAMES_DIR, every_n=EXTRACT_EVERY)

    if not frames_data:
        print(" Koi frames nahi mila! Video path check karein.")
        exit()

    analyze_frames(frames_data, fps)