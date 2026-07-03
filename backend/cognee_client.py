import os
import uuid
import logging
from typing import Optional

import cognee
from cognee.exceptions import CogneeApiError
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=os.getenv("COGNEE_LOG_LEVEL", "ERROR"))
logger = logging.getLogger(__name__)


class CogneeClient:
    async def remember(
        self,
        text: str,
        dataset_name: str = "main_dataset",
        session_id: Optional[str] = None,
        run_in_background: bool = False,
        chunk_size: int = 2048,
    ) -> dict:
        sid = session_id or str(uuid.uuid4())

        try:
            result = await cognee.remember(
                data=text,
                dataset_name=dataset_name,
                session_id=sid,
                chunk_size=chunk_size,
                run_in_background=run_in_background,
                self_improvement=not run_in_background,
            )

            return {
                "status": "stored",
                "session_id": sid,
                "dataset_name": dataset_name,
                "message": "Memory stored successfully",
                "raw": str(result),
            }
        except CogneeApiError as e:
            return {"status": "error", "message": str(e)}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    async def recall(
        self,
        query: str,
        dataset_name: str = "main_dataset",
        session_id: Optional[str] = None,
        top_k: int = 5,
    ) -> dict:
        try:
            kwargs = {
                "query_text": query,
                "top_k": top_k,
            }
            if session_id:
                kwargs["session_id"] = session_id

            results = await cognee.recall(**kwargs)

            return {
                "status": "success",
                "results": [
                    {
                        "text": str(r.text) if hasattr(r, "text") else str(r),
                        "score": float(getattr(r, "score", 0)),
                    }
                    for r in (results or [])
                ],
                "count": len(results) if results else 0,
            }
        except CogneeApiError as e:
            if "prerequisites not met" in str(e).lower():
                return {
                    "status": "empty",
                    "results": [],
                    "count": 0,
                    "message": "No data ingested yet. Use Remember first.",
                }
            return {"status": "error", "message": str(e)}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    async def memify(
        self,
        dataset_name: str = "main_dataset",
        run_in_background: bool = True,
    ) -> dict:
        try:
            result = await cognee.memify(
                dataset=dataset_name,
                run_in_background=run_in_background,
            )
            return {
                "status": "started" if run_in_background else "completed",
                "message": "Knowledge graph enrichment started",
                "dataset_name": dataset_name,
                "raw": str(result),
            }
        except CogneeApiError as e:
            return {"status": "error", "message": str(e)}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    async def forget(
        self,
        dataset_name: str = "main_dataset",
    ) -> dict:
        try:
            await cognee.forget(dataset=dataset_name)
            await cognee.prune.prune_system(graph=False, vector=False, cache=True)
            return {
                "status": "deleted",
                "message": f"Dataset '{dataset_name}' forgotten successfully (including session cache)",
            }
        except CogneeApiError as e:
            return {"status": "error", "message": str(e)}
        except Exception as e:
            return {"status": "error", "message": str(e)}
