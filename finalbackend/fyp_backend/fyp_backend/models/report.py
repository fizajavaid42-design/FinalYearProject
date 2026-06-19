from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class UserReport(Base):
    __tablename__ = "UserReport"

    user_report_id = Column(Integer, primary_key=True, index=True)
    description = Column(String)
    status = Column(String(50), default="Pending")
    contact = Column(String(50))
    incident_type = Column(String(20))  # 'Theft' | 'Accident' | 'Other'
    place_id = Column(Integer, ForeignKey("Place.place_id"), nullable=True)
    vehicle_id = Column(Integer, ForeignKey("Vehicle.vehicle_id"), nullable=True)
    date = Column(DateTime, default=func.now())

    # ✅ ADD THIS - Police Station ID
    police_station_id = Column(Integer, ForeignKey("PoliceStation.station_id"), nullable=True)

    vehicle = relationship("Vehicle", foreign_keys=[vehicle_id])
    place = relationship("Place", foreign_keys=[place_id])
    recoveries = relationship("Recovery", foreign_keys="Recovery.report_id", back_populates="report")

    # ✅ ADD THIS - Police Station Relationship
    police_station = relationship("PoliceStation", foreign_keys=[police_station_id])


class WitnessReport(Base):
    __tablename__ = "WitnessReport"

    witness_report_id = Column(Integer, primary_key=True, index=True)
    car_image_path = Column(String(255), nullable=True)
    no_plate = Column(String(50), nullable=True)
    color = Column(String(50), nullable=True)
    company = Column(String(120), nullable=True)
    model = Column(String(100), nullable=True)
    description = Column(String, nullable=True)
    vehicle_type = Column(String(50), nullable=True)  # ✅ NAYA COLUMN
    generation = Column(String(50), nullable=True)  # ✅ NAYA COLUMN
    place_id = Column(Integer, ForeignKey("Place.place_id"), nullable=True)
    user_id = Column(Integer, ForeignKey("User.user_id"), nullable=True)
    date = Column(DateTime, default=datetime.now)
    status = Column(String(50), default="Pending")

    # ✅ ADD THIS - Police Station ID
    police_station_id = Column(Integer, ForeignKey("PoliceStation.station_id"), nullable=True)

    place = relationship("Place", foreign_keys=[place_id])
    user = relationship("User", foreign_keys=[user_id])

    # ✅ ADD THIS - Police Station Relationship
    police_station = relationship("PoliceStation", foreign_keys=[police_station_id])