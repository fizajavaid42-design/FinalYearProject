from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class CheckPoint(Base):
    __tablename__ = "CheckPoint"

    checkpoint_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name          = Column(String(150), nullable=False)
    place_id      = Column(Integer, ForeignKey("Place.place_id"), nullable=True)
    created_at    = Column(DateTime, default=func.now())

    cameras  = relationship("CheckPointCamera",  back_populates="checkpoint", cascade="all, delete")
    officers = relationship("CheckPointOfficer", back_populates="checkpoint", cascade="all, delete")

    # Graph — is checkpoint se kahan ja sakte hain
    outgoing_edges = relationship(
        "CheckPointGraph",
        foreign_keys="CheckPointGraph.from_checkpoint_id",
        back_populates="from_checkpoint",
        cascade="all, delete"
    )

    incoming_edges = relationship(
        "CheckPointGraph",
        foreign_keys="CheckPointGraph.to_checkpoint_id",
        back_populates="to_checkpoint",
        cascade="all, delete"
    )


class CheckPointCamera(Base):
    __tablename__ = "CheckPointCamera"

    __table_args__ = (
        UniqueConstraint("checkpoint_id", "camera_id"),
    )

    id            = Column(Integer, primary_key=True, autoincrement=True)

    checkpoint_id = Column(
        Integer,
        ForeignKey("CheckPoint.checkpoint_id", ondelete="CASCADE"),
        nullable=False
    )

    camera_id = Column(
        Integer,
        ForeignKey("CCTVCamera.camera_id"),
        nullable=False
    )

    checkpoint = relationship(
        "CheckPoint",
        back_populates="cameras"
    )


class CheckPointOfficer(Base):
    __tablename__ = "CheckPointOfficer"

    __table_args__ = (
        UniqueConstraint("checkpoint_id", "user_id"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)

    checkpoint_id = Column(
        Integer,
        ForeignKey("CheckPoint.checkpoint_id", ondelete="CASCADE"),
        nullable=False
    )

    user_id = Column(
        Integer,
        ForeignKey("User.user_id"),
        nullable=False
    )

    checkpoint = relationship(
        "CheckPoint",
        back_populates="officers"
    )


class CheckPointGraph(Base):
    __tablename__ = "CheckPointGraph"

    __table_args__ = (
        UniqueConstraint("from_checkpoint_id", "to_checkpoint_id"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)

    from_checkpoint_id = Column(
        Integer,
        ForeignKey("CheckPoint.checkpoint_id", ondelete="CASCADE"),
        nullable=False
    )

    to_checkpoint_id = Column(
        Integer,
        ForeignKey("CheckPoint.checkpoint_id", ondelete="CASCADE"),
        nullable=False
    )

    order = Column(Integer, default=1)  # 1=next, 2=2nd next, 3=3rd next

    from_checkpoint = relationship(
        "CheckPoint",
        foreign_keys=[from_checkpoint_id],
        back_populates="outgoing_edges"
    )

    to_checkpoint = relationship(
        "CheckPoint",
        foreign_keys=[to_checkpoint_id],
        back_populates="incoming_edges"
    )