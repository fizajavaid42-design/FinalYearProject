from sqlalchemy import Column, Integer, DateTime, ForeignKey, String, func
from sqlalchemy.orm import relationship
from database import Base


class AIAlert(Base):
    __tablename__ = "AIAlert"

    alert_id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("Vehicle.vehicle_id"), nullable=True)
    camera_id = Column(Integer, ForeignKey("CCTVCamera.camera_id"), nullable=True)
    detection_id = Column(Integer, ForeignKey("VehicleDetections.detection_id"), nullable=True)
    alert_time = Column(DateTime, default=func.now())
    matched_on = Column(String(50), nullable=True)
    report_type = Column(String(50), nullable=True)  # 'witness' or 'user'
    report_id = Column(Integer, nullable=True)  # witness_report_id or user_report_id

    # Relationships
    vehicle = relationship("Vehicle", back_populates="alerts")
    camera = relationship("CCTVCamera", back_populates="alerts")
    detection = relationship("VehicleDetection", back_populates="alerts")
    # ✅ Add this line:
    speed_detections = relationship("SpeedDetection", back_populates="alert")