import io
import json
from typing import Literal

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from facade import DocFacade
from modules.overlay import OverlayItem

app = FastAPI(title="Doc Toolkit")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

facade = DocFacade()


@app.post("/api/scan")
async def scan(image: UploadFile = File(...)):
    image_bytes = await image.read()
    result = facade.scan_to_pdf(image_bytes)

    if not result.success:
        raise HTTPException(status_code=422, detail=result.error)

    return StreamingResponse(
        io.BytesIO(result.data),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=scan.pdf"},
    )


class OverlayItemIn(BaseModel):
    page: int
    x: float
    y: float
    kind: Literal["text", "image"]
    content: str
    font_size: float = 14
    width: float | None = None
    height: float | None = None


@app.post("/api/pdf/preview")
async def pdf_preview(pdf: UploadFile = File(...)):
    pdf_bytes = await pdf.read()
    result = facade.render_pdf_pages(pdf_bytes)

    if not result.success:
        raise HTTPException(status_code=422, detail=result.error)

    return JSONResponse({"pages": result.pages})


@app.post("/api/pdf/overlay")
async def pdf_overlay(pdf: UploadFile = File(...), items: str = Form(...)):
    try:
        parsed = [OverlayItemIn(**item) for item in json.loads(items)]
    except (json.JSONDecodeError, TypeError, ValueError) as e:
        raise HTTPException(status_code=422, detail=f"Geçersiz items verisi: {e}")

    pdf_bytes = await pdf.read()
    overlay_items = [OverlayItem(**item.model_dump()) for item in parsed]
    result = facade.apply_overlay(pdf_bytes, overlay_items)

    if not result.success:
        raise HTTPException(status_code=422, detail=result.error)

    return StreamingResponse(
        io.BytesIO(result.data),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=duzenlenmis.pdf"},
    )


class ExperienceIn(BaseModel):
    role: str
    company: str
    dates: str = ""
    description: str = ""


class EducationIn(BaseModel):
    school: str
    degree: str = ""
    dates: str = ""


class CVIn(BaseModel):
    full_name: str
    headline: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    summary: str = ""
    experience: list[ExperienceIn] = []
    education: list[EducationIn] = []
    skills: list[str] = []


@app.post("/api/cv")
async def cv(data: CVIn):
    result = facade.generate_cv(data.model_dump())

    if not result.success:
        raise HTTPException(status_code=422, detail=result.error)

    return StreamingResponse(
        io.BytesIO(result.data),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=cv.pdf"},
    )


app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")
