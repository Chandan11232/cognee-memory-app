import os
import asyncio
import uuid
import json
import logging
from typing import Optional
from urllib.request import Request, urlopen

import cognee
from cognee.exceptions import CogneeApiError
from dotenv import load_dotenv

load_dotenv()

llm_api_key = os.getenv("LLM_API_KEY", "")
llm_endpoint = os.getenv("LLM_ENDPOINT", "https://generativelanguage.googleapis.com/v1beta/openai")
llm_model = os.getenv("LLM_MODEL", "gemini-1.5-flash")
embedding_api_key = os.getenv("EMBEDDING_API_KEY", llm_api_key)

logging.basicConfig(level=os.getenv("COGNEE_LOG_LEVEL", "ERROR"))
logger = logging.getLogger(__name__)

os.environ.setdefault("ENABLE_BACKEND_ACCESS_CONTROL", "false")


class CogneeClient:
    def __init__(self):
        os.environ["LLM_PROVIDER"] = "custom"
        os.environ["LLM_MODEL"] = llm_model
        os.environ["LLM_API_KEY"] = llm_api_key
        os.environ["LLM_ENDPOINT"] = llm_endpoint
        os.environ["EMBEDDING_PROVIDER"] = "gemini"
        os.environ["EMBEDDING_MODEL"] = "gemini/gemini-embedding-001"
        os.environ["EMBEDDING_API_KEY"] = embedding_api_key
        os.environ["EMBEDDING_DIMENSIONS"] = "768"

    async def _call_llm(self, system_prompt: str, user_prompt: str) -> tuple[Optional[str], Optional[str]]:
        max_retries = 3
        for attempt in range(max_retries):
            try:
                full_model = os.environ["LLM_MODEL"]
                api_model = full_model.removeprefix("openrouter/").removeprefix("openai/").removeprefix("gemini/").removeprefix("ollama/")
                body = json.dumps({
                    "model": api_model,
                    "messages": [{"role": "user", "content": f"{system_prompt}\n\n{user_prompt}"}],
                    "temperature": 0.3,
                    "max_tokens": 150,
                }).encode()
                req = Request(
                    f"{os.environ['LLM_ENDPOINT']}/chat/completions",
                    data=body,
                    headers={
                        "Authorization": f"Bearer {os.environ['LLM_API_KEY']}",
                        "Content-Type": "application/json",
                    },
                )
                resp = await asyncio.get_event_loop().run_in_executor(None, lambda: urlopen(req))
                data = json.loads(resp.read())
                return data["choices"][0]["message"]["content"].strip(), None
            except Exception as e:
                detail = str(e)
                if hasattr(e, "read"):
                    try:
                        detail += " | " + e.read().decode()
                    except Exception:
                        pass
                if "429" in detail and attempt < max_retries - 1:
                    wait = 2 ** (attempt + 1)
                    logger.warning(f"Rate limited, retrying in {wait}s (attempt {attempt + 1}/{max_retries})")
                    await asyncio.sleep(wait)
                    continue
                logger.error(f"LLM API call failed: {detail}")
                return None, detail

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
                run_in_background=False,
                self_improvement=False,
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
            context_chunks = []
            source = None

            if session_id:
                try:
                    results = await cognee.recall(
                        query_text=query,
                        top_k=top_k,
                        session_id=session_id,
                    )
                    if results:
                        for r in results:
                            src = getattr(r, "source", None)
                            if src == "qa":
                                t = getattr(r, "answer", str(r))
                            else:
                                t = getattr(r, "content", getattr(r, "text", str(r)))
                            if t.strip():
                                context_chunks.append(t)
                        if context_chunks:
                            source = "session"
                except Exception:
                    pass

            if not context_chunks:
                return {
                    "status": "empty",
                    "answer": "No data found. Use Remember first to store some information.",
                    "count": 0,
                    "source": None,
                }

            context = "\n\n".join(context_chunks[:top_k])

            sys_prompt = (
                "You are a precise AI assistant with access to stored memories. "
                "Answer based ONLY on the provided context. "
                "Answer in one sentence. Use at most 30 words. "
                "If the context doesn't contain the answer, say "
                "'I couldn't find that information.' "
                "Never repeat the question. Never add disclaimers."
            )
            user_prompt = f"Context:\n{context}\n\nQuestion: {query}\n\nAnswer:"

            answer, err = await self._call_llm(sys_prompt, user_prompt)

            if answer:
                return {
                    "status": "success",
                    "answer": answer,
                    "count": len(context_chunks),
                    "source": source,
                }

            return {
                "status": "error",
                "answer": "Could not generate an answer.",
                "detail": err,
                "source": source,
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
