from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base

class CameraGraph(Base):
    __tablename__ = "CameraGraph"
    __table_args__ = (UniqueConstraint('from_camera_id', 'to_camera_id', name='unique_camera_link'),)

    graph_id = Column(Integer, primary_key=True)
    from_camera_id = Column(Integer, ForeignKey("CCTVCamera.camera_id"), nullable=False)
    to_camera_id = Column(Integer, ForeignKey("CCTVCamera.camera_id"), nullable=False)

    # Relationships to cameras
    from_camera = relationship("CCTVCamera", foreign_keys=[from_camera_id])
    to_camera = relationship("CCTVCamera", foreign_keys=[to_camera_id])
