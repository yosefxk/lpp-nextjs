from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import asyncio
import re
import os
from api import lp_search

app = FastAPI(title="LPP AI API")

# Add CORS middleware to allow Next.js frontend to communicate securely
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all origins for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/search/{license_plate}")
async def search_license_plate(license_plate: str):
    clean_lp = str(license_plate).strip()
    if not re.fullmatch(r"\d{5,8}", clean_lp):
        raise HTTPException(status_code=400, detail="Invalid license plate: must be 5 to 8 digits")
    try:
        # Run non-blocking on threadpool to avoid freezing asyncio event loop
        results = await asyncio.to_thread(lp_search, clean_lp)
        if not results:
            raise HTTPException(status_code=404, detail="License plate not found")
        return results
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    reload = os.getenv("UVICORN_RELOAD", "false").lower() in ("true", "1")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=reload)
