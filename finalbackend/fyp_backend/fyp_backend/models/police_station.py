from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class PoliceStation(Base):
    __tablename__ = "PoliceStation"

    station_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    place_id = Column(Integer, ForeignKey("Place.place_id"), nullable=True)  # station location
    created_at = Column(DateTime, default=func.now())

    places = relationship("PoliceStationPlace",   back_populates="station", cascade="all, delete")
    officers = relationship("PoliceStationOfficer", back_populates="station", cascade="all, delete")
    recoveries = relationship("Recovery", foreign_keys="Recovery.police_station_id", back_populates="police_station")
# PoliceStation model mein ye bhi add karo
    handovers = relationship("VehicleHandover", foreign_keys="VehicleHandover.police_station_id", back_populates="police_station")

class PoliceStationPlace(Base):
    __tablename__ = "PoliceStationPlace"
    __table_args__ = (UniqueConstraint("station_id", "place_id"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    station_id = Column(Integer, ForeignKey("PoliceStation.station_id", ondelete="CASCADE"), nullable=False)
    place_id = Column(Integer, ForeignKey("Place.place_id"), nullable=False)

    station = relationship("PoliceStation", back_populates="places")


class PoliceStationOfficer(Base):
    __tablename__ = "PoliceStationOfficer"
    __table_args__ = (UniqueConstraint("station_id", "user_id"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    station_id = Column(Integer, ForeignKey("PoliceStation.station_id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("User.user_id"), nullable=False)

    station = relationship("PoliceStation", back_populates="officers")