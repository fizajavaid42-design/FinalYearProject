from sqlalchemy import Column, Integer, String
from database import Base


class LegalVehicle(Base):
    __tablename__ = "Legal_Vehicles"

    legal_vehicle_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    no_plate = Column(String(50), unique=True, nullable=True)
    company = Column(String(120), nullable=True)
    model = Column(String(100), nullable=True)
    generation = Column(String(50), nullable=True)
    car_year = Column(Integer, nullable=True)
    color = Column(String(50), nullable=True)