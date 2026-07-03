import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from cognee_client import CogneeClient

load_dotenv()

client = CogneeClient()


class RememberRequest(BaseModel):
    text: str = Field(min_length=1, max_length=100000)
    dataset_name: str = "main_dataset"
    session_id: str | None = None
    run_in_background: bool = False


class RecallRequest(BaseModel):
    query: str = Field(min_length=1, max_length=10000)
    dataset_name: str = "main_dataset"
    session_id: str | None = None
    top_k: int = 5


class MemifyRequest(BaseModel):
    dataset_name: str = "main_dataset"
    run_in_background: bool = True


class ForgetRequest(BaseModel):
    dataset_name: str = "main_dataset"


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Cognee Memory API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/remember")
async def remember(req: RememberRequest):
    return await client.remember(
        text=req.text,
        dataset_name=req.dataset_name,
        session_id=req.session_id,
        run_in_background=req.run_in_background,
    )


@app.post("/recall")
async def recall(req: RecallRequest):
    return await client.recall(
        query=req.query,
        dataset_name=req.dataset_name,
        session_id=req.session_id,
        top_k=req.top_k,
    )


@app.post("/memify")
async def memify(req: MemifyRequest):
    return await client.memify(
        dataset_name=req.dataset_name,
        run_in_background=req.run_in_background,
    )


@app.post("/forget")
async def forget(req: ForgetRequest):
    return await client.forget(dataset_name=req.dataset_name)


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
