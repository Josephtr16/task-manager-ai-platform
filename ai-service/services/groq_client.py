import os, json
import re
from groq import Groq
from dotenv import load_dotenv
from fastapi import HTTPException
from groq import RateLimitError, APIError

load_dotenv()

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


def _clean_rate_limit_message(raw_message: str | None) -> str:
    if not raw_message:
        return "Daily AI usage limit reached. Please try again in a little while."

    match = re.search(r"try again in\s+([0-9]+m[0-9]+(?:\.[0-9]+)?s)", raw_message, re.IGNORECASE)
    if match:
        return f"Daily AI usage limit reached. Please try again in about {match.group(1)}."

    return "Daily AI usage limit reached. Please try again later."

def ask_groq(system_prompt: str, user_prompt: str, max_tokens: int = 1500, temperature: float = 0.3) -> dict:
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt}
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )
    except RateLimitError as exc:
        # Surface quota/rate-limit issues as 429 so the UI can show a clear retry message.
        detail = "Daily AI usage limit reached. Please try again later."
        try:
            err = getattr(exc, "body", None) or {}
            message = ((err.get("error") or {}).get("message") if isinstance(err, dict) else None)
            if isinstance(message, str) and message.strip():
                detail = _clean_rate_limit_message(message)
        except Exception:
            pass
        raise HTTPException(status_code=429, detail=detail)
    except APIError as exc:
        detail = str(exc) or "AI service request failed. Please try again."
        raise HTTPException(status_code=502, detail=detail)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unexpected AI client error: {str(exc)}")

    text = response.choices[0].message.content.strip()
    text = text.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail=f"AI returned invalid JSON. Raw output (first 300 chars): {text[:300]}"
        )