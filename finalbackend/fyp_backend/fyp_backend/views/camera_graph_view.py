from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from controllers.camera_graph_controller import (
    create_camera_link,
    get_all_camera_links,
    delete_camera_link,
)

router = APIRouter()


# -------------------- ADD LINK --------------------
@router.post("/camera-graph", status_code=201)
def add_camera_link(from_camera_id: int, to_camera_id: int, db: Session = Depends(get_db)):
    try:
        link = create_camera_link(db, from_camera_id, to_camera_id)
        return {
            "link_id": link.graph_id,
            "from_camera": {
                "id": link.from_camera.camera_id,
                "place": link.from_camera.place.name if link.from_camera.place else "Unknown",
                "direction": link.from_camera.direction
            },
            "to_camera": {
                "id": link.to_camera.camera_id,
                "place": link.to_camera.place.name if link.to_camera.place else "Unknown",
                "direction": link.to_camera.direction
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# -------------------- GET ALL LINKS --------------------
@router.get("/camera-graph")
def fetch_all_links(db: Session = Depends(get_db)):
    links = get_all_camera_links(db)
    result = []
    for link in links:
        result.append({
            "link_id": link.graph_id,
            "from_camera": {
                "id": link.from_camera.camera_id,
                "place": link.from_camera.place.name if link.from_camera.place else "Unknown",
                "direction": link.from_camera.direction
            },
            "to_camera": {
                "id": link.to_camera.camera_id,
                "place": link.to_camera.place.name if link.to_camera.place else "Unknown",
                "direction": link.to_camera.direction
            }
        })
    return result


# -------------------- DELETE LINK --------------------
@router.delete("/camera-graph/{link_id}")
def delete_camera_link_route(link_id: int, db: Session = Depends(get_db)):
    try:
        delete_camera_link(db, link_id)
        return {"message": f"Link {link_id} deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")