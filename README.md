# 🚗 Vehicles: Car Model Recognizer

> **AI-Powered Smart City Surveillance & Vehicle Recognition System**
> 
## 📌 Project Overview

Traditional vehicle recognition systems rely solely on **number plates**. If a plate is fake, stolen, or missing, the system fails. 

Our project **"Vehicles: Car Model Recognizer"** solves this problem by recognizing vehicles through their **physical features**—including **shape, color, model, generation, and number plate**—using **YOLOv8** deep learning model.

This is a **complete Smart City Ecosystem** where:
- ✅ Citizens can **register vehicles** and **report theft/accidents**.
- ✅ AI-powered **CCTV cameras** detect and recognize vehicles in real-time.
- ✅ **Police receive instant alerts** on their dashboard.
- ✅ **Checkpoints** are connected via a **graph network** to track stolen vehicles.
- ✅ **Admin** manages users, vehicles, cameras, and checkpoints.

---

## ✨ Key Features

### 🧠 AI-Powered Vehicle Detection
- **YOLOv8** model trained on **Honda, Toyota, and Suzuki** models & generations.
- Detects: **Company, Model, Color, Generation, Number Plate**.
- Matches detected vehicles with **reported theft/accident records**.

### 👥 Multi-Role Dashboard
| Role | Capabilities |
|------|--------------|
| **Citizen** | Register vehicles, Report theft/accidents, Check report status, Apply for vehicle handover |
| **Police** | View AI alerts, Manage reports, Approve handovers, Track vehicles via checkpoints |
| **Admin** | Approve users/vehicles, Manage cameras & checkpoints, View analytics |

### 📷 Real-Time Surveillance
- CCTV cameras connected via **camera graph network**.
- **Speed detection** from video feeds.
- **AI Testing Screen** for manual image uploads to test detection.

### 🔔 Alert & Forwarding System
- AI generates alerts when a detected vehicle matches a reported theft/accident.
- Alerts are **forwarded** to the **nearest police checkpoint** via graph network.
- Police can mark alerts as **Received** or **Action Taken**.

### 📊 Graph Network
- **Checkpoint Graph**: Connects checkpoints for route-based alert forwarding.
- **Camera Graph**: Connects cameras for vehicle tracking across the city.

### 🛠️ Admin Management
- Approve/reject citizen registrations & vehicle registrations.
- Add/update cameras, checkpoints, police stations.
- System-wide analytics and monitoring.

---

## 🛠️ Technologies Used

| Layer | Technology |
|-------|------------|
| **Frontend (Web)** | Next.js, React.js, CSS Modules |
| **Frontend (Mobile)** | Flutter |
| **Backend** | FastAPI (Python) |
| **AI Model** | YOLOv8 (Trained on RoboFlow) |
| **Database** | PostgreSQL / SQLAlchemy |
| **Graph Network** | Custom Graph-Based Routing |
| **Mapping** | Leaflet.js |

---

## 👥 Team Members

| Name | Role | Technology |
|------|------|------------|
| **Fiza Javaid** | Frontend Developer | Next.js, React.js |
| **Mariam Zubair** | Frontend Developer | React.js |
| **Syed Abdul Moiz** | Mobile Developer | Flutter |
| **Aliyan Shahid** | Mobile Developer | React Native |


## 🚀 How to Run the Project

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- PostgreSQL

### Backend Setup
```bash
# Clone the repository
git clone https://github.com/your-username/vehicles-car-model-recognizer.git
cd vehicles-car-model-recognizer/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start backend server
uvicorn main:app --reload


--Frontend Setup (Next.js)
bash
cd ../frontend

# Install dependencies
npm install

# Run development server
npm run dev

🎯 Project Objectives
AI-Based Vehicle Recognition using YOLOv8 to detect cars by physical features.

Multi-Platform Support – Web (Next.js) + Mobile (Flutter/React Native).

Real-Time Alert System for police with graph-based checkpoint forwarding.

Citizen Empowerment – Report thefts/accidents & track recovery status.

Admin Oversight – Manage users, vehicles, cameras, and checkpoints.

Scalable Architecture – Built with modern frameworks and modular design.

📄 License
This project is developed as part of Bachelor of Science in Computer Science (Artificial Intelligence) - BSAI-8A at Barani Institute
 of Information Technology.

🙏 Acknowledgments
Supervisor: Mr.Shahid Jamil

University: BIIT

Dataset: RoboFlow for annotation & training.

Open-Source Libraries: YOLOv8, FastAPI, Next.js, Flutter.

📧 Contact:
For any queries, feel free to reach out:

Fiza Javaid – fizajavaid42@gmail.com


# Start backend server
uvicorn main:app --reload
