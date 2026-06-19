from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from database import Base

class UserDocument(Base):
    __tablename__ = "UserDocument"

    document_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("User.user_id"))
    document_type = Column(String(100))
    document_path = Column(String(255))
    upload_date = Column(DateTime, default=func.now())
