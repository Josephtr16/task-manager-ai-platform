import os, json, time, re
from groq import Groq
from dotenv import load_dotenv
from fastapi import HTTPException
from groq import RateLimitError, APIError

load_dotenv()

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


def _clean_rate_limit_message(raw_message: str | None) -> str:
    if not raw_message:
        return "Rate limit reached. Please wait a moment and try again."
    match = re.search(r"try again in\s+([0-9]+m[0-9]+(?:\.[0-9]+)?s)", raw_message, re.IGNORECASE)
    if match:
        return f"Rate limit reached. Please try again in about {match.group(1)}."
    return "Rate limit reached. Please wait a moment and try again."


def _parse_retry_seconds(exc: RateLimitError) -> float:
    """Extract wait time from Groq rate limit error headers or message."""
    try:
        # Groq often includes retry-after in the response headers
        headers = getattr(exc, "response", None)
        if headers is not None:
            retry_after = getattr(headers, "headers", {}).get("retry-after")
            if retry_after:
                return float(retry_after)
    except Exception:
        pass

    try:
        msg = str(exc)
        # e.g. "try again in 1m23.4s" or "try again in 5.2s"
        m = re.search(r"try again in\s+(?:(\d+)m)?(\d+(?:\.\d+)?)s", msg, re.IGNORECASE)
        if m:
            minutes = int(m.group(1) or 0)
            seconds = float(m.group(2) or 0)
            return minutes * 60 + seconds
    except Exception:
        pass

    return 0.0


def ask_groq(
    system_prompt: str,
    user_prompt: str,
    max_tokens: int = 1500,
    temperature: float = 0.3,
    _retries: int = 3,
) -> dict:
    last_exc = None

    for attempt in range(_retries):
        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user",   "content": user_prompt},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )

            text = response.choices[0].message.content.strip()
            text = (
                text.removeprefix("```json")
                    .removeprefix("```")
                    .removesuffix("```")
                    .strip()
            )
            try:
                return json.loads(text)
            except json.JSONDecodeError:
                raise HTTPException(
                    status_code=500,
                    detail=f"AI returned invalid JSON. Raw output (first 300 chars): {text[:300]}",
                )

        except RateLimitError as exc:
            last_exc = exc

            if attempt < _retries - 1:
                # Wait the time Groq tells us, or use exponential backoff
                wait = _parse_retry_seconds(exc)
                if wait <= 0 or wait > 120:
                    wait = 2 ** (attempt + 1)  # 2s, 4s, 8s

                # Cap wait to 30s during testing so it doesn't feel frozen
                wait = min(wait, 30)
                time.sleep(wait)
                continue

            # All retries exhausted — surface a clean 429
            detail = "Rate limit reached. Please wait a moment and try again."
            try:
                err = getattr(exc, "body", None) or {}
                message = (
                    (err.get("error") or {}).get("message")
                    if isinstance(err, dict)
                    else None
                )
                if isinstance(message, str) and message.strip():
                    detail = _clean_rate_limit_message(message)
            except Exception:
                pass
            raise HTTPException(status_code=429, detail=detail)

        except HTTPException:
            raise

        except APIError as exc:
            raise HTTPException(
                status_code=502,
                detail=str(exc) or "AI service request failed. Please try again.",
            )

        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Unexpected AI client error: {str(exc)}",
            )

    # Should never reach here
    raise HTTPException(status_code=429, detail="Rate limit reached after retries.")