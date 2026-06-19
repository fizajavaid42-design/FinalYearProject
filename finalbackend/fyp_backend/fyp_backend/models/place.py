from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from database import Base

class Place(Base):
    __tablename__ = "Place"

    place_id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    city = Column(String, nullable=True)
    latitude = Column(String, nullable=True)
    longitude = Column(String, nullable=True)

    # Relationship to cameras
    cameras = relationship("CCTVCamera", back_populates="place")
