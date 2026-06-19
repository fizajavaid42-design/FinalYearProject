from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from database import Base


class VehicleHandover(Base):
    __tablename__ = "VehicleHandover"

    handover_id       = Column(Integer, primary_key=True, index=True)
    recovery_id       = Column(Integer, ForeignKey("Recovery.recovery_id"), nullable=False)
    police_station_id = Column(Integer, ForeignKey("PoliceStation.station_id"), nullable=False)
    owner_cnic        = Column(String(50), nullable=False)
    document_paths    = Column(String(500), nullable=True)  # comma separated paths
    handover_date     = Column(DateTime, default=func.now())
    status            = Column(String(50), default="Pending")

    # Relationships
    recovery       = relationship("Recovery", back_populates="handover")
    police_station = relationship("PoliceStation", foreign_keys=[police_station_id])