from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Registration(Base):
    __tablename__ = "Registration"

    reg_id   = Column(Integer, primary_key=True, index=True)
    user_id  = Column(Integer, ForeignKey("User.user_id"), nullable=False)
    no_plate = Column(String(50), unique=True, nullable=False)

    # Relationships
    user     = relationship("User")
    vehicles = relationship("Vehicle", back_populates="registration")


class Vehicle(Base):
    __tablename__ = "Vehicle"

    vehicle_id      = Column(Integer, primary_key=True, index=True)
    company         = Column(String(120))
    model           = Column(String(100))
    car_year        = Column(Integer)
    import_year     = Column(Integer, nullable=True)
    engine_no       = Column(String(100), unique=True, nullable=True)
    chassis_no      = Column(String(100), unique=True, nullable=True)
    color           = Column(String(50),  nullable=True)
    user_id         = Column(Integer, ForeignKey("User.user_id"))
    reg_id          = Column(Integer, ForeignKey("Registration.reg_id"), nullable=True)
    approval_status = Column(String(50), default="Approved")

    # Relationships
    user = relationship("User")
    registration = relationship("Registration", back_populates="vehicles")
    documents    = relationship("VehicleDocument", back_populates="vehicle")
    alerts = relationship("AIAlert", back_populates="vehicle")


class VehicleDocument(Base):
    __tablename__ = "VehicleDocument"

    vehicle_document_id = Column(Integer, primary_key=True, index=True)
    vehicle_id          = Column(Integer, ForeignKey("Vehicle.vehicle_id"))
    document_type       = Column(String(100), nullable=True)
    document_path       = Column(String(255))

    vehicle = relationship("Vehicle", back_populates="documents")