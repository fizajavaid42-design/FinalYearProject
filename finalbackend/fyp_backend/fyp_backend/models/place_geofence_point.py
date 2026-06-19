from sqlalchemy import Column, Integer, String, ForeignKey

from database import Base

class PlaceGeoFencePoint(Base):
    __tablename__ = "PlaceGeoFencePoint"

    point_id = Column(Integer, primary_key=True, autoincrement=True)
    place_id = Column(Integer, ForeignKey("Place.place_id"))
    latitude = Column(String(50))
    longitude = Column(String(50))
    point_order = Column(Integer)

