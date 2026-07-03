import os
import uuid
import logging
from typing import Optional

import cognee
from cognee.api.v1.recall.recall import SearchType
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
            results = None

            try:
                results = await cognee.recall(
                    query_text=query,
                    query_type=SearchType.RAG_COMPLETION,
                    top_k=top_k,
                    datasets=[dataset_name],
                )
            except Exception:
                results = None

            if not results and session_id:
                try:
                    results = await cognee.recall(
                        query_text=query,
                        query_type=SearchType.RAG_COMPLETION,
                        top_k=top_k,
                        session_id=session_id,
                    )
                except Exception:
                    results = None

            if not results:
                session_kwargs = {"query_text": query, "top_k": top_k}
                if session_id:
                    session_kwargs["session_id"] = session_id

                results = await cognee.recall(**session_kwargs)

            extracted = []
            for r in (results or []):
                source = getattr(r, "source", None)
                if source == "graph":
                    content = getattr(r, "text", None)
                    score = float(getattr(r, "score", 0))
                elif source == "qa":
                    content = getattr(r, "answer", None)
                    score = 1.0
                elif source == "session":
                    content = getattr(r, "content", None)
                    score = 0.0
                else:
                    content = None
                    score = float(getattr(r, "score", 0))

                extracted.append({
                    "text": content or str(r),
                    "score": score,
                })

            return {
                "status": "success",
                "results": extracted,
                "count": len(extracted),
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
