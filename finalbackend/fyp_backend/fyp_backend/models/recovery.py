from sqlalchemy import Column, Integer, DateTime, ForeignKey, func, String
from sqlalchemy.orm import relationship
from database import Base


class Recovery(Base):
    __tablename__ = "Recovery"

    recovery_id       = Column(Integer, primary_key=True, index=True)
    report_id         = Column(Integer, ForeignKey("UserReport.user_report_id"), nullable=True)  # ✅ NULLABLE KARO
    witness_report_id = Column(Integer, ForeignKey("WitnessReport.witness_report_id"), nullable=True)  # ✅ ADD KARO
    user_id           = Column(Integer, ForeignKey("User.user_id"), nullable=False)
    police_station_id = Column(Integer, ForeignKey("PoliceStation.station_id"), nullable=True)
    checkpoint_id     = Column(Integer, ForeignKey("CheckPoint.checkpoint_id"), nullable=True)
    recovery_date     = Column(DateTime, default=func.now())

    # Relationships
    report         = relationship("UserReport", foreign_keys=[report_id])
    witness_report = relationship("WitnessReport", foreign_keys=[witness_report_id])  # ✅ ADD KARO
    user           = relationship("User", foreign_keys=[user_id])
    police_station = relationship("PoliceStation", foreign_keys=[police_station_id])
    handover       = relationship("VehicleHandover", back_populates="recovery", uselist=False)