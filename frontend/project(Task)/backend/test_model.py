# from ultralytics import YOLO

# model = YOLO("model/car.pt")
# print("Model loaded successfully")
import torch
print(torch.version.cuda)
print(torch.cuda.is_available())
