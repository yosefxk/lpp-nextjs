from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
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
    try:
        # lp_search is a sync function utilizing ThreadPoolExecutor under the hood
        results = lp_search(license_plate)
        if not results:
            raise HTTPException(status_code=404, detail="License plate not found")
        return results
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
