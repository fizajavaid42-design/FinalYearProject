from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "User"

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    password = Column(String(100), nullable=False)
    role = Column(String(50))
    designation = Column(String(100))
    approval_status = Column(String(50), default="Pending")
    contact = Column(String(20))


registrations = relationship("Registration", back_populates="user")
vehicles = relationship("Vehicle", back_populates="user")
recoveries = relationship("Recovery", foreign_keys="Recovery.user_id", back_populates="user")