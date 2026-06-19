# import cv2
# import numpy as np
# import easyocr
# import re
# from ultralytics import YOLO
#
# # ══════════════════════════════════════════════════════════════
# #  CONFIG — model paths
# # ══════════════════════════════════════════════════════════════
#
# # Car detection model (for multiple cars)
# CAR_DETECTION_MODEL_PATH = "best.pt"
#
# COMPANY_MODEL_PATH = "company.pt"
# HONDA_MODEL_PATH = "honda.pt"
# SUZUKI_MODEL_PATH = "suzuki.pt"
# TOYOTA_MODEL_PATH = "toyota.pt"
#
# COLOR_MODEL_PATH = "model-weights-spectrico-car-colors-recognition-mobilenet_v3-224x224-180420.pb"
# COLOR_LABELS_PATH = "labels.txt"
# COLOR_OUTPUT_LAYER = "Predictions/Softmax/Softmax"
# COLOR_INPUT_SIZE = (224, 224)
#
#
# # ══════════════════════════════════════════════════════════════
# #  HELPER FUNCTION — Format model name (for ALL models)
# # ══════════════════════════════════════════════════════════════
#
# def format_model_name(model_name: str) -> str:
#     """
#     Convert model names to formatted display names:
#
#     Honda:
#         city5 → City (5th Generation)
#         city6 → City (6th Generation)
#         civic8 → Civic (8th Generation)
#         civic10 → Civic (10th Generation)
#
#     Toyota:
#         corolla9 → Corolla (9th Generation)
#         corolla10 → Corolla (10th Generation)
#         corolla11 → Corolla (11th Generation)
#         yaris1 → Yaris (1st Generation)
#
#     Suzuki:
#         alto2 → Alto (2nd Generation)
#         alto8 → Alto (8th Generation)
#         cultus2 → Cultus (2nd Generation)
#         cultus3 → Cultus (3rd Generation)
#     """
#     if not model_name or model_name == "Unknown":
#         return model_name
#
#     model_name_lower = model_name.lower()
#
#     # Complete mapping for all models
#     patterns = {
#         # Honda models
#         "city": "City",
#         "civic": "Civic",
#         # Toyota models
#         "corolla": "Corolla",
#         "yaris": "Yaris",
#         # Suzuki models
#         "alto": "Alto",
#         "cultus": "Cultus",
#     }
#
#     for key, display_name in patterns.items():
#         if key in model_name_lower:
#             # Extract generation number from model name
#             numbers = re.findall(r'\d+', model_name)
#             if numbers:
#                 num = int(numbers[0])
#                 # Convert number to proper suffix
#                 if num == 1:
#                     suffix = "1st"
#                 elif num == 2:
#                     suffix = "2nd"
#                 elif num == 3:
#                     suffix = "3rd"
#                 else:
#                     suffix = f"{num}th"
#                 return f"{display_name} ({suffix} Generation)"
#             else:
#                 return display_name
#
#     # If no pattern matches, return capitalized original
#     return model_name.capitalize()
#
#
# # ══════════════════════════════════════════════════════════════
# #  MODEL LOADER CLASS
# # ══════════════════════════════════════════════════════════════
#
# class CarPipeline:
#     def __init__(self):
#         print("[INFO] Loading models — please wait...")
#
#         # 0. Car detection model (for multiple cars)
#         self.car_detector = YOLO(CAR_DETECTION_MODEL_PATH)
#         print("[OK] Car detector loaded (best.pt)")
#
#         # 1. Company model
#         self.company_model = YOLO(COMPANY_MODEL_PATH)
#         print("[OK] Company model loaded")
#
#         # 2. Sub-models
#         self.sub_models = {
#             "honda": YOLO(HONDA_MODEL_PATH),
#             "suzuki": YOLO(SUZUKI_MODEL_PATH),
#             "toyota": YOLO(TOYOTA_MODEL_PATH),
#         }
#         print("[OK] Sub-models loaded (honda, suzuki, toyota)")
#
#         # 3. EasyOCR
#         self.ocr_reader = easyocr.Reader(['en'], gpu=False)
#         print("[OK] EasyOCR ready")
#
#         # 4. Color model
#         self.color_net = cv2.dnn.readNetFromTensorflow(COLOR_MODEL_PATH)
#         self.color_labels = self._load_labels(COLOR_LABELS_PATH)
#         print("[OK] Color model loaded")
#
#         print("[INFO] All models ready!\n")
#
#     @staticmethod
#     def _load_labels(path):
#         with open(path, "r") as f:
#             return [line.strip() for line in f.readlines()]
#
#
# # ══════════════════════════════════════════════════════════════
# #  STEP 0 — Detect multiple cars in image
# # ══════════════════════════════════════════════════════════════
#
# def detect_all_cars(pipeline: CarPipeline, image: np.ndarray):
#     """
#     Detect all cars in the image using best.pt
#     Returns list of (cropped_image, bbox)
#     """
#     results = pipeline.car_detector(image, verbose=False, conf=0.25, imgsz=640)
#
#     car_crops = []
#     for result in results:
#         if result.boxes:
#             for box in result.boxes.xyxy:
#                 x1, y1, x2, y2 = map(int, box)
#                 # Add some padding
#                 padding = 10
#                 x1 = max(0, x1 - padding)
#                 y1 = max(0, y1 - padding)
#                 x2 = min(image.shape[1], x2 + padding)
#                 y2 = min(image.shape[0], y2 + padding)
#
#                 crop = image[y1:y2, x1:x2]
#                 if crop.size > 0:
#                     car_crops.append((crop, (x1, y1, x2, y2)))
#
#     return car_crops
#
#
# # ══════════════════════════════════════════════════════════════
# #  STEP 1 — Company detect karo
# # ══════════════════════════════════════════════════════════════
#
# def detect_company(pipeline: CarPipeline, image: np.ndarray) -> str:
#     try:
#         results = pipeline.company_model(image, verbose=False, conf=0.01, imgsz=320)
#         for result in results:
#             if result.boxes and len(result.boxes) > 0:
#                 confidences = result.boxes.conf.tolist()
#                 best_idx = int(np.argmax(confidences))
#                 class_id = int(result.boxes.cls[best_idx])
#                 class_name = result.names[class_id].lower()
#                 print(f"     Company: {class_name} (conf: {confidences[best_idx]:.2f})")
#                 return class_name
#         return "Unknown"
#     except Exception as e:
#         print(f"     Company ERROR: {e}")
#         return "Unknown"
#
#
# # ══════════════════════════════════════════════════════════════
# #  STEP 2 — Car model detect karo (UPDATED: formatted name in console)
# # ══════════════════════════════════════════════════════════════
#
# def detect_car_model(pipeline: CarPipeline, image: np.ndarray, company: str) -> str:
#     company = company.lower()
#     if company not in pipeline.sub_models:
#         return "Unknown"
#
#     try:
#         sub_model = pipeline.sub_models[company]
#         results = sub_model(image, verbose=False, conf=0.01, imgsz=320)
#
#         for result in results:
#             if result.boxes and len(result.boxes) > 0:
#                 confidences = result.boxes.conf.tolist()
#                 best_idx = int(np.argmax(confidences))
#                 class_id = int(result.boxes.cls[best_idx])
#                 class_name = result.names[class_id]
#
#                 # ✅ FORMATTED NAME in processing time
#                 formatted_name = format_model_name(class_name)
#                 print(f"     Model: {formatted_name} (conf: {confidences[best_idx]:.2f})")
#                 return class_name  # Return raw name for further formatting
#
#         return "Unknown"
#     except Exception as e:
#         print(f"     Model ERROR: {e}")
#         return "Unknown"
#
#
# # ══════════════════════════════════════════════════════════════
# #  STEP 3 — Number plate detection
# # ══════════════════════════════════════════════════════════════
#
# def detect_plate(pipeline: CarPipeline, image: np.ndarray) -> str:
#     try:
#         gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
#         h, w = gray.shape
#
#         # Strategy 1: Different scales
#         for scale in [1.5, 2.0, 2.5]:
#             resized = cv2.resize(gray, None, fx=scale, fy=scale)
#             kernel_sharpen = np.array([[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]])
#             sharpened = cv2.filter2D(resized, -1, kernel_sharpen)
#
#             for thresh_val in [120, 140, 160, 180]:
#                 _, thresh = cv2.threshold(sharpened, thresh_val, 255, cv2.THRESH_BINARY)
#                 results = pipeline.ocr_reader.readtext(
#                     thresh, detail=0,
#                     allowlist='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-',
#                     paragraph=False
#                 )
#                 for text in results:
#                     text = text.strip().replace(" ", "")
#                     if len(text) >= 6 and any(c.isalpha() for c in text) and any(c.isdigit() for c in text):
#                         print(f"     Plate: {text}")
#                         return text
#
#         # Strategy 2: Lower half
#         roi = gray[h * 2 // 3:h, :]
#         if roi.shape[0] > 20 and roi.shape[1] > 100:
#             clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
#             roi = clahe.apply(roi)
#             roi = cv2.bilateralFilter(roi, 9, 75, 75)
#             kernel = np.ones((2, 2), np.uint8)
#             roi = cv2.morphologyEx(roi, cv2.MORPH_CLOSE, kernel)
#             _, roi = cv2.threshold(roi, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
#
#             results = pipeline.ocr_reader.readtext(
#                 roi, detail=0,
#                 allowlist='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
#                 paragraph=False
#             )
#             for text in results:
#                 text = text.strip().replace(" ", "")
#                 if len(text) >= 5:
#                     print(f"     Plate: {text}")
#                     return text
#
#         return "Not Found"
#     except Exception as e:
#         print(f"     Plate ERROR: {e}")
#         return "Not Found"
#
#
# # ══════════════════════════════════════════════════════════════
# #  STEP 4 — Color detect karo
# # ══════════════════════════════════════════════════════════════
#
# def detect_color(pipeline: CarPipeline, image: np.ndarray) -> str:
#     try:
#         blob = cv2.dnn.blobFromImage(
#             image,
#             scalefactor=1.0 / 255.0,
#             size=COLOR_INPUT_SIZE,
#             mean=(0, 0, 0),
#             swapRB=True,
#             crop=False
#         )
#         pipeline.color_net.setInput(blob)
#         predictions = pipeline.color_net.forward(COLOR_OUTPUT_LAYER)
#         scores = predictions[0]
#         top_idx = int(np.argmax(scores))
#         color = pipeline.color_labels[top_idx]
#         confidence = scores[top_idx] * 100
#         print(f"     Color: {color} (conf: {confidence:.1f}%)")
#         return color
#     except Exception as e:
#         print(f"     Color ERROR: {e}")
#         return "Unknown"
#
#
# # ══════════════════════════════════════════════════════════════
# #  PROCESS SINGLE CAR CROP
# # ══════════════════════════════════════════════════════════════
#
# def process_single_car(pipeline: CarPipeline, car_crop: np.ndarray, car_id: int) -> dict:
#     """
#     Process one cropped car image
#     """
#     print(f"\n  ┌─ Car {car_id} ─────────────────────────┐")
#
#     # Company
#     company = detect_company(pipeline, car_crop)
#     company = company.capitalize() if company != "Unknown" else "Unknown"
#
#     # Car Model
#     if company.lower() in ["honda", "suzuki", "toyota"]:
#         car_model_raw = detect_car_model(pipeline, car_crop, company)
#         # ✅ Format model name for final output
#         car_model = format_model_name(car_model_raw)
#     else:
#         car_model = "Unknown"
#         print(f"     Model: Unknown (company unknown)")
#
#     # Plate
#     plate = detect_plate(pipeline, car_crop)
#
#     # Color
#     color = detect_color(pipeline, car_crop)
#     color = color.capitalize() if color != "Unknown" else "Unknown"
#
#     print(f"  └────────────────────────────────────────┘")
#
#     return {
#         "Car_ID": car_id,
#         "Company": company,
#         "Model": car_model,
#         "Plate Number": plate,
#         "Color": color
#     }
#
#
# # ══════════════════════════════════════════════════════════════
# #  DRAW RESULTS ON IMAGE
# # ══════════════════════════════════════════════════════════════
#
# def draw_results_on_image(image: np.ndarray, all_results: list, output_path: str = "annotated3_output.jpg"):
#     """
#     Draw bounding boxes and results on the image
#     """
#     img_copy = image.copy()
#
#     for result in all_results:
#         if "Bounding Box" in result:
#             x1, y1, x2, y2 = result["Bounding Box"]
#         else:
#             continue
#
#         # Draw bounding box
#         cv2.rectangle(img_copy, (x1, y1), (x2, y2), (0, 255, 0), 3)
#
#         # Prepare text (already formatted)
#         company = result["Company"]
#         model = result["Model"]
#         plate = result["Plate Number"]
#         color = result["Color"]
#
#         # Line 1: Company | Model
#         line1 = f"{company} | {model}"
#         # Line 2: Plate | Color
#         line2 = f"{plate} | {color}"
#
#         # Font settings
#         font = cv2.FONT_HERSHEY_SIMPLEX
#         font_scale = 0.55
#         thickness = 2
#
#         # Get text size for background rectangle
#         (text1_w, text1_h), _ = cv2.getTextSize(line1, font, font_scale, thickness)
#         (text2_w, text2_h), _ = cv2.getTextSize(line2, font, font_scale, thickness)
#
#         max_text_w = max(text1_w, text2_w)
#         total_text_h = text1_h + text2_h + 10
#
#         # Draw background rectangle for text (above the car)
#         text_bg_x1 = x1
#         text_bg_y1 = y1 - total_text_h - 10
#         text_bg_x2 = x1 + max_text_w + 20
#         text_bg_y2 = y1 - 5
#
#         # If text would go above image, put it inside the box at the top
#         if text_bg_y1 < 0:
#             text_bg_y1 = y1 + 10
#             text_bg_y2 = y1 + total_text_h + 15
#             cv2.rectangle(img_copy, (text_bg_x1, text_bg_y1), (text_bg_x2, text_bg_y2), (0, 0, 0), -1)
#             text_y1 = text_bg_y1 + text1_h + 5
#             text_y2 = text_bg_y1 + text1_h + text2_h + 10
#         else:
#             cv2.rectangle(img_copy, (text_bg_x1, text_bg_y1), (text_bg_x2, text_bg_y2), (0, 0, 0), -1)
#             text_y1 = text_bg_y1 + text1_h + 5
#             text_y2 = text_bg_y1 + text1_h + text2_h + 10
#
#         # Draw text
#         cv2.putText(img_copy, line1, (x1 + 10, text_y1), font, font_scale, (255, 255, 255), thickness)
#         cv2.putText(img_copy, line2, (x1 + 10, text_y2), font, font_scale, (255, 255, 255), thickness)
#
#         # Draw Car ID
#         car_id_text = f"Car #{result['Car_ID']}"
#         cv2.putText(img_copy, car_id_text, (x1 + 10, y1 - 10), font, 0.5, (255, 255, 0), 1)
#
#     # Save image
#     cv2.imwrite(output_path, img_copy)
#     print(f"[OK] Annotated image saved as: {output_path}")
#
#     return img_copy
#
#
# # ══════════════════════════════════════════════════════════════
# #  MAIN INFERENCE FUNCTION (Multiple Cars)
# # ══════════════════════════════════════════════════════════════
#
# def run_pipeline_multicars(pipeline: CarPipeline, image_path: str, save_annotated: bool = True,
#                            output_path: str = "annotated_output.jpg") -> list:
#     """
#     Complete pipeline for multiple cars in one image.
#     Returns list of results for each car.
#     """
#     # Load image
#     image = cv2.imread(image_path)
#     if image is None:
#         print(f"[ERROR] Image load nahi hui: {image_path}")
#         return []
#
#     print(f"\n{'=' * 60}")
#     print(f"  Processing: {image_path}")
#     print(f"{'=' * 60}")
#
#     # Step 0: Detect all cars
#     print("\n[Step 0] Detecting all cars in image...")
#     car_crops = detect_all_cars(pipeline, image)
#
#     if len(car_crops) == 0:
#         print("[WARNING] No cars detected in image!")
#         return []
#
#     print(f"[INFO] Found {len(car_crops)} car(s)\n")
#
#     # Process each car
#     all_results = []
#     for idx, (car_crop, bbox) in enumerate(car_crops, start=1):
#         print(f"\n{'=' * 50}")
#         print(f"  Processing Car #{idx}")
#         print(f"{'=' * 50}")
#
#         result = process_single_car(pipeline, car_crop, idx)
#         result["Bounding Box"] = bbox
#         all_results.append(result)
#
#     # Draw results on image if requested
#     if save_annotated:
#         print("\n[Step] Drawing results on image...")
#         draw_results_on_image(image, all_results, output_path)
#
#     # Print summary
#     print(f"\n{'=' * 60}")
#     print(f"  FINAL SUMMARY — Total Cars: {len(all_results)}")
#     print(f"{'=' * 60}")
#     for res in all_results:
#         print(f"\n  Car {res['Car_ID']}:")
#         print(f"    Company      : {res['Company']}")
#         print(f"    Model        : {res['Model']}")
#         print(f"    Plate Number : {res['Plate Number']}")
#         print(f"    Color        : {res['Color']}")
#
#     return all_results
#
#
# # ══════════════════════════════════════════════════════════════
# #  RUN
# # ══════════════════════════════════════════════════════════════
#
# if __name__ == "__main__":
#     pipeline = CarPipeline()
#
#     # 👇 APNI IMAGE KA NAAM YAHAN LIKHO
#     image_path = "2983_png.rf.4810b2413b48a3d071db0a2f134feaab.jpg"  # Change to your image with multiple cars
#
#     results = run_pipeline_multicars(pipeline, image_path, save_annotated=True, output_path="annotated3_output.jpg")
#
#     print("\n\n[RAW OUTPUT - List of Dictionaries]:")
#     for res in results:
#         print(res)
#
#
#
#
#
#
#
#
#
#
#
#
#
#
#
#
#
#
#
#
#
#
#
#
#
#
#
#
#
#
#
#
#


##########NOPLATE WALA DAL K##
import cv2
import numpy as np
import easyocr
import re
from ultralytics import YOLO

# ══════════════════════════════════════════════════════════════
#  CONFIG — model paths
# ══════════════════════════════════════════════════════════════

# Car detection model (for multiple cars)
CAR_DETECTION_MODEL_PATH = "../best.pt"

# License plate detection model (YOLO .pt file)
PLATE_MODEL_PATH = "../license_plate_detector.pt"

COMPANY_MODEL_PATH = "../company.pt"
HONDA_MODEL_PATH = "../honda.pt"
SUZUKI_MODEL_PATH = "../suzuki.pt"
TOYOTA_MODEL_PATH = "../toyota.pt"

COLOR_MODEL_PATH = "model-weights-spectrico-car-colors-recognition-mobilenet_v3-224x224-180420.pb"
COLOR_LABELS_PATH = "labels.txt"
COLOR_OUTPUT_LAYER = "Predictions/Softmax/Softmax"
COLOR_INPUT_SIZE = (224, 224)


# ══════════════════════════════════════════════════════════════
#  HELPER FUNCTION — Format model name (for ALL models)
# ══════════════════════════════════════════════════════════════

def format_model_name(model_name: str) -> str:
    """
    Convert model names to formatted display names:

    Honda:
        city5 → City (5th Generation)
        city6 → City (6th Generation)
        civic8 → Civic (8th Generation)
        civic10 → Civic (10th Generation)

    Toyota:
        corolla9 → Corolla (9th Generation)
        corolla10 → Corolla (10th Generation)
        corolla11 → Corolla (11th Generation)
        yaris1 → Yaris (1st Generation)

    Suzuki:
        alto2 → Alto (2nd Generation)
        alto8 → Alto (8th Generation)
        cultus2 → Cultus (2nd Generation)
        cultus3 → Cultus (3rd Generation)
    """
    if not model_name or model_name == "Unknown":
        return model_name

    model_name_lower = model_name.lower()

    # Complete mapping for all models
    patterns = {
        # Honda models
        "city": "City",
        "civic": "Civic",
        # Toyota models
        "corolla": "Corolla",
        "yaris": "Yaris",
        # Suzuki models
        "alto": "Alto",
        "cultus": "Cultus",
    }

    for key, display_name in patterns.items():
        if key in model_name_lower:
            # Extract generation number from model name
            numbers = re.findall(r'\d+', model_name)
            if numbers:
                num = int(numbers[0])
                # Convert number to proper suffix
                if num == 1:
                    suffix = "1st"
                elif num == 2:
                    suffix = "2nd"
                elif num == 3:
                    suffix = "3rd"
                else:
                    suffix = f"{num}th"
                return f"{display_name} ({suffix} Generation)"
            else:
                return display_name

    # If no pattern matches, return capitalized original
    return model_name.capitalize()


# ══════════════════════════════════════════════════════════════
#  MODEL LOADER CLASS
# ══════════════════════════════════════════════════════════════

class CarPipeline:
    def __init__(self):
        print("[INFO] Loading models — please wait...")

        # 0. Car detection model (for multiple cars)
        self.car_detector = YOLO(CAR_DETECTION_MODEL_PATH)
        print("[OK] Car detector loaded (best.pt)")

        # 1. License plate detection model (YOLO)
        self.plate_model = YOLO(PLATE_MODEL_PATH)
        print("[OK] License plate detector loaded")

        # 2. Company model
        self.company_model = YOLO(COMPANY_MODEL_PATH)
        print("[OK] Company model loaded")

        # 3. Sub-models
        self.sub_models = {
            "honda": YOLO(HONDA_MODEL_PATH),
            "suzuki": YOLO(SUZUKI_MODEL_PATH),
            "toyota": YOLO(TOYOTA_MODEL_PATH),
        }
        print("[OK] Sub-models loaded (honda, suzuki, toyota)")

        # 4. EasyOCR (fallback if YOLO doesn't detect)
        self.ocr_reader = easyocr.Reader(['en'], gpu=False)
        print("[OK] EasyOCR ready")

        # 5. Color model
        self.color_net = cv2.dnn.readNetFromTensorflow(COLOR_MODEL_PATH)
        self.color_labels = self._load_labels(COLOR_LABELS_PATH)
        print("[OK] Color model loaded")

        print("[INFO] All models ready!\n")

    @staticmethod
    def _load_labels(path):
        with open(path, "r") as f:
            return [line.strip() for line in f.readlines()]


# ══════════════════════════════════════════════════════════════
#  STEP 0 — Detect multiple cars in image
# ══════════════════════════════════════════════════════════════

def detect_all_cars(pipeline: CarPipeline, image: np.ndarray):
    """
    Detect all cars in the image using best.pt
    Returns list of (cropped_image, bbox)
    """
    results = pipeline.car_detector(image, verbose=False, conf=0.25, imgsz=640)

    car_crops = []
    for result in results:
        if result.boxes:
            for box in result.boxes.xyxy:
                x1, y1, x2, y2 = map(int, box)
                # Add some padding
                padding = 10
                x1 = max(0, x1 - padding)
                y1 = max(0, y1 - padding)
                x2 = min(image.shape[1], x2 + padding)
                y2 = min(image.shape[0], y2 + padding)

                crop = image[y1:y2, x1:x2]
                if crop.size > 0:
                    car_crops.append((crop, (x1, y1, x2, y2)))

    return car_crops


# ══════════════════════════════════════════════════════════════
#  STEP 1 — Company detect karo
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
                print(f"     Company: {class_name} (conf: {confidences[best_idx]:.2f})")
                return class_name
        return "Unknown"
    except Exception as e:
        print(f"     Company ERROR: {e}")
        return "Unknown"


# ══════════════════════════════════════════════════════════════
#  STEP 2 — Car model detect karo
# ══════════════════════════════════════════════════════════════

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

                # ✅ FORMATTED NAME in processing time
                formatted_name = format_model_name(class_name)
                print(f"     Model: {formatted_name} (conf: {confidences[best_idx]:.2f})")
                return class_name

        return "Unknown"
    except Exception as e:
        print(f"     Model ERROR: {e}")
        return "Unknown"


# ══════════════════════════════════════════════════════════════
#  STEP 3 — Number plate detection (YOLO + OCR fallback)
# ══════════════════════════════════════════════════════════════

def preprocess_plate_crop(crop: np.ndarray):
    """Preprocess plate crop for OCR"""
    try:
        crop = cv2.resize(crop, (400, 100))
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (3, 3), 0)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        gray = cv2.dilate(gray, kernel, iterations=1)
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        return thresh
    except Exception as e:
        print(f"     Preprocess ERROR: {e}")
        return None


def detect_plate(pipeline: CarPipeline, image: np.ndarray) -> str:
    """
    Detect license plate using YOLO model + OCR
    """
    try:
        # Strategy 1: Use YOLO plate model
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
                        preprocessed,
                        detail=0,
                        allowlist='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-',
                        paragraph=False
                    )

                    for text in ocr_results:
                        text = text.strip().replace(" ", "")
                        if len(text) >= 5 and any(c.isalpha() for c in text) and any(c.isdigit() for c in text):
                            print(f"     Plate: {text} (YOLO detected)")
                            return text

        # Strategy 2: Fallback to direct OCR if YOLO doesn't detect
        print("     YOLO plate detection failed, trying OCR fallback...")
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        h, w = gray.shape

        for scale in [1.5, 2.0, 2.5]:
            resized = cv2.resize(gray, None, fx=scale, fy=scale)
            kernel_sharpen = np.array([[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]])
            sharpened = cv2.filter2D(resized, -1, kernel_sharpen)

            for thresh_val in [120, 140, 160, 180]:
                _, thresh = cv2.threshold(sharpened, thresh_val, 255, cv2.THRESH_BINARY)
                results = pipeline.ocr_reader.readtext(
                    thresh, detail=0,
                    allowlist='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-',
                    paragraph=False
                )
                for text in results:
                    text = text.strip().replace(" ", "")
                    if len(text) >= 6 and any(c.isalpha() for c in text) and any(c.isdigit() for c in text):
                        print(f"     Plate: {text} (OCR fallback)")
                        return text

        # Strategy 3: Lower half
        roi = gray[h * 2 // 3:h, :]
        if roi.shape[0] > 20 and roi.shape[1] > 100:
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
            roi = clahe.apply(roi)
            _, roi = cv2.threshold(roi, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            results = pipeline.ocr_reader.readtext(
                roi, detail=0,
                allowlist='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
                paragraph=False
            )
            for text in results:
                text = text.strip().replace(" ", "")
                if len(text) >= 5:
                    print(f"     Plate: {text} (OCR fallback - lower half)")
                    return text

        return "Not Found"

    except Exception as e:
        print(f"     Plate ERROR: {e}")
        return "Not Found"


# ══════════════════════════════════════════════════════════════
#  STEP 4 — Color detect karo
# ══════════════════════════════════════════════════════════════

def detect_color(pipeline: CarPipeline, image: np.ndarray) -> str:
    try:
        blob = cv2.dnn.blobFromImage(
            image,
            scalefactor=1.0 / 255.0,
            size=COLOR_INPUT_SIZE,
            mean=(0, 0, 0),
            swapRB=True,
            crop=False
        )
        pipeline.color_net.setInput(blob)
        predictions = pipeline.color_net.forward(COLOR_OUTPUT_LAYER)
        scores = predictions[0]
        top_idx = int(np.argmax(scores))
        color = pipeline.color_labels[top_idx]
        confidence = scores[top_idx] * 100
        print(f"     Color: {color} (conf: {confidence:.1f}%)")
        return color
    except Exception as e:
        print(f"     Color ERROR: {e}")
        return "Unknown"


# ══════════════════════════════════════════════════════════════
#  PROCESS SINGLE CAR CROP
# ══════════════════════════════════════════════════════════════

def process_single_car(pipeline: CarPipeline, car_crop: np.ndarray, car_id: int) -> dict:
    """
    Process one cropped car image
    """
    print(f"\n  ┌─ Car {car_id} ─────────────────────────┐")

    # Company
    company = detect_company(pipeline, car_crop)
    company = company.capitalize() if company != "Unknown" else "Unknown"

    # Car Model
    if company.lower() in ["honda", "suzuki", "toyota"]:
        car_model_raw = detect_car_model(pipeline, car_crop, company)
        car_model = format_model_name(car_model_raw)
    else:
        car_model = "Unknown"
        print(f"     Model: Unknown (company unknown)")

    # Plate (using YOLO + OCR fallback)
    plate = detect_plate(pipeline, car_crop)

    # Color
    color = detect_color(pipeline, car_crop)
    color = color.capitalize() if color != "Unknown" else "Unknown"

    print(f"  └────────────────────────────────────────┘")

    return {
        "Car_ID": car_id,
        "Company": company,
        "Model": car_model,
        "Plate Number": plate,
        "Color": color
    }


# ══════════════════════════════════════════════════════════════
#  DRAW RESULTS ON IMAGE
# ══════════════════════════════════════════════════════════════

def draw_results_on_image(image: np.ndarray, all_results: list, output_path: str = "annotated_output.jpg"):
    """
    Draw bounding boxes and results on the image
    """
    img_copy = image.copy()

    for result in all_results:
        if "Bounding Box" in result:
            x1, y1, x2, y2 = result["Bounding Box"]
        else:
            continue

        # Draw bounding box
        cv2.rectangle(img_copy, (x1, y1), (x2, y2), (0, 255, 0), 3)

        # Prepare text
        company = result["Company"]
        model = result["Model"]
        plate = result["Plate Number"]
        color = result["Color"]

        line1 = f"{company} | {model}"
        line2 = f"{plate} | {color}"

        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.55
        thickness = 2

        (text1_w, text1_h), _ = cv2.getTextSize(line1, font, font_scale, thickness)
        (text2_w, text2_h), _ = cv2.getTextSize(line2, font, font_scale, thickness)

        max_text_w = max(text1_w, text2_w)
        total_text_h = text1_h + text2_h + 10

        text_bg_x1 = x1
        text_bg_y1 = y1 - total_text_h - 10
        text_bg_x2 = x1 + max_text_w + 20
        text_bg_y2 = y1 - 5

        if text_bg_y1 < 0:
            text_bg_y1 = y1 + 10
            text_bg_y2 = y1 + total_text_h + 15
            cv2.rectangle(img_copy, (text_bg_x1, text_bg_y1), (text_bg_x2, text_bg_y2), (0, 0, 0), -1)
            text_y1 = text_bg_y1 + text1_h + 5
            text_y2 = text_bg_y1 + text1_h + text2_h + 10
        else:
            cv2.rectangle(img_copy, (text_bg_x1, text_bg_y1), (text_bg_x2, text_bg_y2), (0, 0, 0), -1)
            text_y1 = text_bg_y1 + text1_h + 5
            text_y2 = text_bg_y1 + text1_h + text2_h + 10

        cv2.putText(img_copy, line1, (x1 + 10, text_y1), font, font_scale, (255, 255, 255), thickness)
        cv2.putText(img_copy, line2, (x1 + 10, text_y2), font, font_scale, (255, 255, 255), thickness)

        car_id_text = f"Car #{result['Car_ID']}"
        cv2.putText(img_copy, car_id_text, (x1 + 10, y1 - 10), font, 0.5, (255, 255, 0), 1)

    cv2.imwrite(output_path, img_copy)
    print(f"[OK] Annotated image saved as: {output_path}")

    return img_copy


# ══════════════════════════════════════════════════════════════
#  MAIN INFERENCE FUNCTION (Multiple Cars)
# ══════════════════════════════════════════════════════════════

def run_pipeline_multicars(pipeline: CarPipeline, image_path: str, save_annotated: bool = True,
                           output_path: str = "annotated_output.jpg") -> list:
    """
    Complete pipeline for multiple cars in one image.
    Returns list of results for each car.
    """
    image = cv2.imread(image_path)
    if image is None:
        print(f"[ERROR] Image load nahi hui: {image_path}")
        return []

    print(f"\n{'=' * 60}")
    print(f"  Processing: {image_path}")
    print(f"{'=' * 60}")

    print("\n[Step 0] Detecting all cars in image...")
    car_crops = detect_all_cars(pipeline, image)

    if len(car_crops) == 0:
        print("[WARNING] No cars detected in image!")
        return []

    print(f"[INFO] Found {len(car_crops)} car(s)\n")

    all_results = []
    for idx, (car_crop, bbox) in enumerate(car_crops, start=1):
        print(f"\n{'=' * 50}")
        print(f"  Processing Car #{idx}")
        print(f"{'=' * 50}")

        result = process_single_car(pipeline, car_crop, idx)
        result["Bounding Box"] = bbox
        all_results.append(result)

    if save_annotated:
        print("\n[Step] Drawing results on image...")
        draw_results_on_image(image, all_results, output_path)

    print(f"\n{'=' * 60}")
    print(f"  FINAL SUMMARY — Total Cars: {len(all_results)}")
    print(f"{'=' * 60}")
    for res in all_results:
        print(f"\n  Car {res['Car_ID']}:")
        print(f"    Company      : {res['Company']}")
        print(f"    Model        : {res['Model']}")
        print(f"    Plate Number : {res['Plate Number']}")
        print(f"    Color        : {res['Color']}")

    return all_results


# ══════════════════════════════════════════════════════════════
#  RUN
# ══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    pipeline = CarPipeline()

    # 👇 APNI IMAGE KA NAAM YAHAN LIKHO
    image_path = "2.jpg"  # Change to your image

    results = run_pipeline_multicars(pipeline, image_path, save_annotated=True, output_path="annotated1000_output.jpg")

    print("\n\n[RAW OUTPUT - List of Dictionaries]:")
    for res in results:
        print(res)