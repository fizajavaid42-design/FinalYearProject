from sqlalchemy import Column, Integer, DateTime, ForeignKey, String, func
from sqlalchemy.orm import relationship
from database import Base


class ForwardedAlert(Base):
    __tablename__ = "ForwardedAlert"

    forward_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    alert_id = Column(Integer, ForeignKey("AIAlert.alert_id"), nullable=True)
    from_checkpoint_id = Column(Integer, ForeignKey("CheckPoint.checkpoint_id"), nullable=True)
    to_checkpoint_id = Column(Integer, ForeignKey("CheckPoint.checkpoint_id"), nullable=True)
    forwarded_by = Column(Integer, ForeignKey("User.user_id"), nullable=True)
    depth = Column(Integer, nullable=True)
    forwarded_at = Column(DateTime, default=func.now())
    status = Column(String(50), default="Pending")

    # Relationships
    alert = relationship("AIAlert", foreign_keys=[alert_id])
    from_checkpoint = relationship("CheckPoint", foreign_keys=[from_checkpoint_id])
    to_checkpoint = relationship("CheckPoint", foreign_keys=[to_checkpoint_id])
    forwarded_by_user = relationship("User", foreign_keys=[forwarded_by])