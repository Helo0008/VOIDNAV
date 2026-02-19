from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Void Navigator API")
api_router = APIRouter(prefix="/api")

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


class StatusCheckCreate(BaseModel):
    client_name: str


class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserProgressIn(BaseModel):
    session_id: str
    total_points: int = 0
    unlocked_orbits: List[str] = []
    completed_lessons: List[str] = []
    quiz_scores: Dict[str, int] = {}
    achievements: List[str] = []


@api_router.get("/")
async def root():
    return {"message": "Void Navigator API — Space Orbit Lab"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    obj = StatusCheck(**input.model_dump())
    doc = obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.status_checks.insert_one(doc)
    return obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for c in checks:
        if isinstance(c['timestamp'], str):
            c['timestamp'] = datetime.fromisoformat(c['timestamp'])
    return checks


@api_router.get("/orbits")
async def get_orbits():
    """Return list of all orbit type IDs and names"""
    orbits = [
        {"id": "leo", "name": "Low Earth Orbit", "shortName": "LEO", "unlockPoints": 0},
        {"id": "polar", "name": "Polar Orbit", "shortName": "Polar", "unlockPoints": 0},
        {"id": "geo", "name": "Geostationary Orbit", "shortName": "GEO", "unlockPoints": 0},
        {"id": "sso", "name": "Sun-Synchronous Orbit", "shortName": "SSO", "unlockPoints": 100},
        {"id": "meo", "name": "Medium Earth Orbit", "shortName": "MEO", "unlockPoints": 100},
        {"id": "heo", "name": "Highly Elliptical Orbit", "shortName": "HEO", "unlockPoints": 250},
        {"id": "molniya", "name": "Molniya Orbit", "shortName": "Molniya", "unlockPoints": 250},
        {"id": "tundra", "name": "Tundra Orbit", "shortName": "Tundra", "unlockPoints": 450},
        {"id": "graveyard", "name": "Graveyard Orbit", "shortName": "Graveyard", "unlockPoints": 450},
        {"id": "hohmann", "name": "Hohmann Transfer", "shortName": "Hohmann", "unlockPoints": 700},
        {"id": "lagrange", "name": "Lagrange Points", "shortName": "L-Points", "unlockPoints": 1000},
    ]
    return {"orbits": orbits, "total": len(orbits)}


@api_router.post("/progress")
async def save_progress(data: UserProgressIn):
    """Save user progress by session ID"""
    now = datetime.now(timezone.utc).isoformat()
    doc = data.model_dump()
    doc['updated_at'] = now
    await db.user_progress.update_one(
        {"session_id": data.session_id},
        {"$set": doc},
        upsert=True
    )
    return {"status": "saved", "session_id": data.session_id}


@api_router.get("/progress/{session_id}")
async def get_progress(session_id: str):
    """Get user progress by session ID"""
    doc = await db.user_progress.find_one({"session_id": session_id}, {"_id": 0})
    if not doc:
        return {"session_id": session_id, "total_points": 0, "unlocked_orbits": ["leo", "polar", "geo"],
                "completed_lessons": [], "quiz_scores": {}, "achievements": []}
    return doc


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
