from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class CCTVCamera(Base):
    __tablename__ = "CCTVCamera"

    camera_id = Column(Integer, primary_key=True)

    place_id = Column(Integer, ForeignKey("Place.place_id"), nullable=False)

    direction = Column(String, nullable=False)

    status = Column(String, default="Active")

    # Relationships
    place = relationship("Place", back_populates="cameras")

    detections = relationship("VehicleDetection",back_populates="camera")

    alerts = relationship("AIAlert",back_populates="camera")
    # ✅ Add this line:
    speed_detections = relationship("SpeedDetection", back_populates="camera")