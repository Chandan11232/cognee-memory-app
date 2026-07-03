import os
import uuid
import logging
from typing import Optional

import cognee
from cognee.api.v1.recall.recall import SearchType
from cognee.exceptions import CogneeApiError
from dotenv import load_dotenv
import google.generativeai as genai

genai.configure(api_key=os.getenv("LLM_API_KEY"))
llm = genai.GenerativeModel("gemini-2.0-flash")

load_dotenv()

logging.basicConfig(level=os.getenv("COGNEE_LOG_LEVEL", "ERROR"))
logger = logging.getLogger(__name__)


class CogneeClient:
    async def list_datasets(self) -> dict:
        try:
            datasets = await cognee.datasets.list_datasets()
            return {
                "status": "success",
                "datasets": [
                    {"name": ds.name, "id": str(ds.id)}
                    for ds in (datasets or [])
                ],
            }
        except Exception as e:
            return {"status": "success", "datasets": []}

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
            from_source = None

            try:
                results = await cognee.recall(
                    query_text=query,
                    query_type=SearchType.RAG_COMPLETION,
                    top_k=top_k,
                    datasets=[dataset_name],
                )
                from_source = "graph"
            except Exception:
                results = None

            if not results and session_id:
                try:
                    results = await cognee.recall(
                        query_text=query,
                        top_k=top_k,
                        session_id=session_id,
                    )
                    from_source = "session"
                except Exception:
                    results = None

            if from_source == "graph":
                answer = " ".join(
                    getattr(r, "text", str(r)) for r in (results or [])
                ).strip()
                return {
                    "status": "success",
                    "answer": answer or "No relevant information found.",
                    "count": len(results) if results else 0,
                    "source": "graph",
                }

            context_parts = []
            for r in (results or []):
                src = getattr(r, "source", None)
                if src == "session":
                    context_parts.append(getattr(r, "content", str(r)))
                elif src == "qa":
                    context_parts.append(getattr(r, "answer", str(r)))
                else:
                    context_parts.append(str(r))

            context = "\n\n".join(context_parts).strip()

            if not context:
                return {
                    "status": "empty",
                    "answer": "No data found. Use Remember first to store some information.",
                    "count": 0,
                    "source": None,
                }

            prompt = f"""Based on the following context, answer the user's question concisely.

Context:
{context}

Question: {query}

Answer:"""
            try:
                response = await llm.generate_content_async(prompt)
                answer = response.text.strip()
            except Exception:
                answer = None

            if answer:
                return {
                    "status": "success",
                    "answer": answer,
                    "count": len(context_parts),
                    "source": "session",
                }

            return {
                "status": "success",
                "answer": "Here is the relevant information from your stored data:",
                "count": len(context_parts),
                "source": "session_context",
                "context": context,
            }
        except CogneeApiError as e:
            if "prerequisites not met" in str(e).lower():
                return {
                    "status": "empty",
                    "answer": "No data found. Use Remember first to store some information.",
                    "count": 0,
                    "source": None,
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
