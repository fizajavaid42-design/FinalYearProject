from sqlalchemy.orm import Session
from models.place import Place


def create_place(db: Session, name: str, city: str, latitude: str, longitude: str):
    place = Place(
        name=name,
        city=city,
        latitude=latitude,
        longitude=longitude
    )
    db.add(place)
    db.commit()
    db.refresh(place)
    return place


def get_all_places(db: Session):
    return db.query(Place).all()
