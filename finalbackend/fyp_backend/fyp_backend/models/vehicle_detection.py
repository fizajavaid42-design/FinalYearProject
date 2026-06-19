from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from database import Base


class VehicleDetection(Base):
    __tablename__ = "VehicleDetections"

    detection_id = Column(Integer, primary_key=True, index=True)

    camera_id   = Column(Integer, ForeignKey("CCTVCamera.camera_id"), nullable=True)

    company     = Column(String(120), nullable=True)
    model       = Column(String(100), nullable=True)
    generation  = Column(String(50), nullable=True)
    color       = Column(String(50), nullable=True)
    no_plate    = Column(String(50), nullable=True)
    Province=Column(String(50), nullable=True)
    detected_at = Column(DateTime, default=func.now())
    image_path  = Column(String(255), nullable=True)

    # Relationships
    camera = relationship("CCTVCamera", back_populates="detections")

    alerts = relationship("AIAlert", back_populates="detection")
    # ✅ Add this line:
    speed_detections = relationship("SpeedDetection", back_populates="detection")