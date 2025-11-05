from typing import List

import requests
from requests import RequestException

from config import OllamaConfig, OpenAiConfig

try:
    from openai import OpenAI  # type: ignore
except ImportError as import_error:  # pragma: no cover - optional dependency
    OpenAI = None  # type: ignore
    _OPENAI_IMPORT_ERROR = import_error
else:
    _OPENAI_IMPORT_ERROR = None

def summarize_with_ollama(query: str, passages: List[dict]) -> str:
    if not passages:
        return "(No passages available to summarize.)"

    blocks = [f"[{i}] {p['title']} ({p.get('year') or 'n.d.'}) :: {p['content'][:1200]}" for i, p in enumerate(passages, 1)]
    prompt = f"""You are an academic assistant. Synthesize a concise overview.

QUERY: {query}

Use ONLY these snippets. Cite with [1], [2], etc. End with a bullet list "Sources used" with titles and years. Return HTML format.

Sources:
{chr(10).join(blocks)}"""

    try:
        response = requests.post(
            f"{OllamaConfig.URL}/api/generate",
            json={"model": OllamaConfig.MODEL, "prompt": prompt, "stream": False},
            timeout=120,
        )
        response.raise_for_status()
        return response.json().get("response", "").strip()
    except RequestException as exc:  # pragma: no cover - requires Ollama runtime
        return f"(Ollama request failed: {exc})"


def summarize_with_openai(query: str, passages: List[dict]) -> str:
    if OpenAI is None:
        return "(OpenAI SDK missing: install the `openai` package or unset OPENAI_API_KEY to use the Ollama fallback.)"

    try:
        client = OpenAI(api_key=OpenAiConfig.OPENAI_KEY)
        context = "\n".join([f"[{i+1}] {p['title']} :: {p['content'][:1200]}" for i,p in enumerate(passages)])
        chat = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role":"system","content":"You synthesize with [#] citations only from provided snippets."},
                {"role":"user","content": f"Topic: {query}\n\nSources:\n{context}"}
            ]
        )
        return chat.choices[0].message.content.strip()
    except Exception as e:  # pragma: no cover - depends on external service
        return f"(OpenAI fallback error: {e})"