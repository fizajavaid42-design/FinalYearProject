from sqlalchemy import Column, Integer, String, Date, ForeignKey
from database import Base

class VehicleUser(Base):
    __tablename__ = "VehicleUser"

    vehicle_user_id = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_id = Column(Integer, ForeignKey("Vehicle.vehicle_id"))
    new_user_id = Column(Integer, ForeignKey("User.user_id"))
    date_of_purchase = Column(Date)
    status = Column(String(50))


