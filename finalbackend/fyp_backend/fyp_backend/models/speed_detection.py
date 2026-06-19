from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, DECIMAL, Boolean, func
from sqlalchemy.orm import relationship
from database import Base


class SpeedDetection(Base):
    __tablename__ = "SpeedDetection"

    speed_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    video_path = Column(String(255), nullable=True)
    car_id = Column(Integer, nullable=True)
    speed_kmh = Column(DECIMAL(8, 2), nullable=True)
    is_over_speed = Column(Boolean, default=False)
    time_A = Column(String(100), nullable=True)
    time_B = Column(String(100), nullable=True)
    time_diff_sec = Column(DECIMAL(8, 3), nullable=True)
    company = Column(String(120), nullable=True)
    model = Column(String(100), nullable=True)
    generation = Column(String(50), nullable=True)
    color = Column(String(50), nullable=True)
    no_plate = Column(String(50), nullable=True)
    camera_id = Column(Integer, ForeignKey("CCTVCamera.camera_id"), nullable=True)
    detection_id = Column(Integer, ForeignKey("VehicleDetections.detection_id"), nullable=True)
    alert_id = Column(Integer, ForeignKey("AIAlert.alert_id"), nullable=True)
    detected_at = Column(DateTime, default=func.now())

    # Relationships
    camera = relationship("CCTVCamera", foreign_keys=[camera_id])
    detection = relationship("VehicleDetection", foreign_keys=[detection_id])
    alert = relationship("AIAlert", foreign_keys=[alert_id])