from fastapi import APIRouter

from app.api.v1.endpoints import ai, characters, homebrew, party, resources

api_router = APIRouter()
api_router.include_router(characters.router, prefix="/characters", tags=["characters"])
api_router.include_router(resources.router, prefix="/resources", tags=["resources"])
api_router.include_router(party.router, prefix="/party", tags=["party"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(homebrew.router, prefix="/homebrew", tags=["homebrew"])
