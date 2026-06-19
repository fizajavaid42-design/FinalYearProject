from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from views import (user_view,  report_view, place_view,
                   cctv_camera_view, checkpoint_view, camera_graph_view, police_station_view)
from views import registration_vehicle_view
from views import recovery_view
from views import admin_view
from views import vehicle_detection_view
from views import ai_alert_view
from views import checkpoint_view
from views import forwarded_alert_route
from views import car_tracking_route
from tasks import accidentTask
from database import Base, engine


# Create tables if not exist
Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS Middleware - Flutter web ke liye zaroori
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_view.router)
app.include_router(place_view.router)
app.include_router(report_view.router)
app.include_router(cctv_camera_view.router)
app.include_router(checkpoint_view.router)
app.include_router(camera_graph_view.router)
app.include_router(police_station_view.router)
app.include_router(accidentTask.router)
app.include_router(recovery_view.router)
app.include_router(admin_view.router)
app.include_router(registration_vehicle_view.router)
app.include_router(vehicle_detection_view.router)
app.include_router(ai_alert_view.router)
app.include_router(checkpoint_view.router)
app.include_router(forwarded_alert_route.router)
app.include_router(car_tracking_route.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
    # uvicorn.run(app, host="192.168.18.128", port=8005)
    # uvicorn.run(app, host="0.0.0.0", port=8005)

