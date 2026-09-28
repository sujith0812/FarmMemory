import json

from app.ai_client import groq_client, MODEL


def extract_memory(field_id: str, message: str, answer: str):

    prompt = f"""
You are the memory extraction component of FarmMemory.

Your ONLY job is to extract durable factual information from the
FARMER'S MESSAGE.

Field ID:
{field_id}

FARMER'S MESSAGE:
{message}

AI ANSWER:
{answer}

IMPORTANT:
Use ONLY the farmer's message.
Do NOT extract information from the AI answer.
Do NOT invent facts.
Do NOT diagnose the crop.
Do NOT infer causes.

Return ONLY valid JSON:

{{
  "should_remember": true,
  "memory": "Field {field_id}: The farmer observed small water pools near the rice plants."
}}

If the farmer message contains no durable farm information:

{{
  "should_remember": false,
  "memory": ""
}}

Remember information such as:
- crop observations
- crop condition
- field conditions
- actions taken by the farmer
- planting information
- harvesting information
- important farm events

Do NOT remember:
- greetings
- thanks
- casual conversation
- questions with no new information
- requests asking what happened previously
- requests asking what was observed
- requests asking what is new today

Preserve the farmer's actual observation.

For example:

Farmer:
"Today I noticed small water pools near the rice plants."

Correct:
"The farmer observed small water pools near the rice plants."

Incorrect:
"The field has excess water."
"The crop has a drainage problem."
"The crop may develop disease."

Return JSON only.
"""

    # Ask Groq to extract durable farm information.
    response = groq_client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You extract durable farm memories from farmer messages. "
                    "Use ONLY the farmer's message. "
                    "Never invent facts. "
                    "Return valid JSON only."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        temperature=0,
        max_completion_tokens=200,
    )

    content = response.choices[0].message.content

    print("🧠 Memory extractor response:")
    print(content)

    # ============================================================
    # 1. Try to parse the AI JSON response
    # ============================================================

    try:

        cleaned = content.strip()

        if cleaned.startswith("```"):
            cleaned = cleaned.replace("```json", "", 1)
            cleaned = cleaned.replace("```", "")
            cleaned = cleaned.strip()

        result = json.loads(cleaned)

        should_remember = bool(
            result.get("should_remember", False)
        )

        memory = result.get("memory", "").strip()

        if should_remember and memory:
            return {
                "should_remember": True,
                "memory": memory,
            }

        return {
            "should_remember": False,
            "memory": "",
        }

    except (json.JSONDecodeError, TypeError, AttributeError):

        print("⚠️ Memory extractor returned invalid JSON:")
        print(content)

        # ========================================================
        # 2. Safe fallback
        # ========================================================

        lower_message = message.lower().strip()

        # English question indicators
        question_words = [
            "?",
            "what",
            "why",
            "how",
            "when",
            "where",
            "which",
            "who",
            "did i",
            "do i",
            "can i",
            "should i",
            "tell me",
            "show me",
            "what did",
            "what is",
            "what was",
        ]

        # Telugu question indicators
        telugu_question_words = [
            "ఏమి",
            "ఏంటి",
            "ఏమిటి",
            "ఎందుకు",
            "ఎలా",
            "ఎప్పుడు",
            "ఎక్కడ",
            "ఏది",
            "ఏమైంది",
            "ఏం జరిగింది",
            "ఏం గమనించాను",
            "ఏమి గమనించాను",
            "ఏ కొత్త విషయం",
            "ఏం కొత్తగా",
            "గతంలో ఏం",
            "గతంలో ఏమి",
            "చెప్పు",
            "చూపించు",
            "నాకు చెప్పు",
            "నాకు చూపించు",
        ]

        # Check English questions.
        is_question = any(
            word in lower_message
            for word in question_words
        )

        # Check Telugu questions.
        if any(
            word in message
            for word in telugu_question_words
        ):
            is_question = True

        # ========================================================
        # Extra protection for common voice-transcribed
        # Telugu questions.
        # ========================================================

        telugu_question_patterns = [
            "లో గతంలో",
            "లో నేను",
            "ఏం",
            "ఏది",
            "ఏమి",
            "ఎందుకు",
            "ఎలా",
            "ఎప్పుడు",
            "ఎక్కడ",
            "చెప్పు",
            "చూపించు",
            "గమనించాను",
            "జరిగింది",
        ]

        if any(
            pattern in message
            for pattern in telugu_question_patterns
        ):
            is_question = True

        # ========================================================
        # Never save a question as farm memory.
        # ========================================================

        if is_question:
            return {
                "should_remember": False,
                "memory": "",
            }

        # ========================================================
        # Save only reasonably long non-question statements.
        # ========================================================

        if len(message.strip()) > 10:
            return {
                "should_remember": True,
                "memory": f"Field {field_id}: {message.strip()}",
            }

        return {
            "should_remember": False,
            "memory": "",
        }