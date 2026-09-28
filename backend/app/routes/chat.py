from fastapi import APIRouter
from pydantic import BaseModel

from app.hindsight_client import client, BANK_ID
from app.ai_client import groq_client, MODEL
from app.memory_extractor import extract_memory


router = APIRouter(
    prefix="/api/chat",
    tags=["AI Agent"]
)


class ChatRequest(BaseModel):
    field_id: str
    language: str = "en"
    message: str


@router.post("")
def chat(request: ChatRequest):

    # ============================================================
    # 1. Create a field-aware memory query
    # ============================================================

    recall_query = f"""
Field: {request.field_id}

Farmer question:
{request.message}

Retrieve memories specifically related to {request.field_id}.
Prioritize memories that directly mention {request.field_id}.
"""

    # ============================================================
    # 2. Recall farm history from Hindsight
    # ============================================================

    memory_result = client.recall(
        bank_id=BANK_ID,
        query=recall_query,
    )

    # ============================================================
    # 3. Keep only memories relevant to requested field
    # ============================================================

    field_memories = []

    field_id_lower = request.field_id.lower()

    for memory in memory_result.results:

        memory_text = memory.text

        if field_id_lower in memory_text.lower():

            field_memories.append({
                "type": memory.type,
                "text": memory_text,
            })

    # ============================================================
    # 4. Detect whether farmer asks about a NEW observation
    # ============================================================

    message_lower = request.message.lower().strip()

    new_observation_keywords = [
        "what is new today",
        "what did i notice today",
        "what new thing did i observe",
        "new observation",
        "what did i observe today",
        "ఈరోజు ఏం కొత్తగా గమనించాను",
        "ఈరోజు ఏ కొత్త విషయం గమనించాను",
        "ఈరోజు ఏం గమనించాను",
        "ఈరోజు నేను ఏం గమనించాను",
        "ఈరోజు ఏ కొత్త విషయం",
    ]

    is_new_observation_question = any(
        keyword in message_lower
        for keyword in new_observation_keywords
    )

    # ============================================================
    # 5. Build memory context
    # ============================================================

    if field_memories:

        if is_new_observation_question:

            # For "what is new today?" questions,
            # prioritize memories containing today's date.

            latest_memories = []

            for memory in field_memories:

                text_lower = memory["text"].lower()

                if (
                    "2026-09-28" in text_lower
                    or "september 28, 2026" in text_lower
                    or "september 28" in text_lower
                ):
                    latest_memories.append(memory)

            # If dated memories exist, use only those.
            if latest_memories:

                memory_context = "\n".join(
                    f"- {memory['text']}"
                    for memory in latest_memories
                )

            else:

                # If the new memory does not contain a date,
                # keep the full context so the LLM can still answer.
                memory_context = "\n".join(
                    f"- {memory['text']}"
                    for memory in field_memories
                )

        else:

            # Normal questions use all relevant field memories.

            memory_context = "\n".join(
                f"- {memory['text']}"
                for memory in field_memories
            )

    else:

        memory_context = (
            "No recorded history was found for this field."
        )

    # ============================================================
    # 6. Select response language
    # ============================================================

    if request.language.lower() in ["te", "telugu"]:
        response_language = "Telugu"
    else:
        response_language = "English"

    # ============================================================
    # 7. FarmMemory system instructions
    # ============================================================

    system_prompt = f"""
You are FarmMemory, a voice-first AI farm companion.

The farmer's requested response language is: {response_language}

Your job is to help the farmer understand their farm history
using relevant memories retrieved from FarmMemory.

IMPORTANT RULES:

1. USE FARM HISTORY

- Use the supplied memories when they are relevant.
- Treat recorded farm history as historical evidence.
- Never invent events, dates, crops, actions, or outcomes.
- Never claim something happened if it is not present in the supplied memories.

2. KEEP ANSWERS SHORT

- This is a voice-first application.
- The farmer will listen to your answer.
- Keep normal answers to 2-5 short sentences.
- Avoid long explanations.
- Avoid unnecessary numbered lists.
- Avoid repeating the same fact multiple times.

3. SPEAK LIKE A FARM COMPANION

- Use simple, natural language.
- Give the most important information first.
- Avoid technical jargon unless the farmer specifically asks for it.
- Make the response easy to understand when heard aloud.

4. HISTORY VS GENERAL KNOWLEDGE

- Clearly distinguish recorded farm history from general agricultural knowledge.
- If the farmer asks about a previous event, answer from the recorded history.
- If the history does not contain enough information, say that clearly.

5. AGRICULTURAL SAFETY

- Do not diagnose crop diseases with certainty.
- Do not guarantee crop outcomes.
- Do not prescribe pesticides, chemicals, fertilizers, or treatment quantities.
- Do not provide highly specific chemical application instructions.
- Do not invent fertilizer doses, N-P-K quantities, pesticide doses, or pH targets.
- If a crop problem could have multiple causes, explain that briefly.
- For serious or uncertain crop problems, recommend checking with a local agricultural expert.

6. FIELD FOCUS

- Answer only about the requested field: {request.field_id}
- Never mention memories belonging to another field.

7. LANGUAGE

- Respond entirely in {response_language}.
- If responding in Telugu, use simple natural Telugu that a farmer can easily understand.
- Do not mix unnecessary English technical terms into Telugu.

8. VOICE FRIENDLY

- Write sentences that sound natural when spoken aloud.
- Do not use markdown tables.
- Avoid excessive symbols or formatting.
- Avoid very long sentences.

9. MEMORY LIMITATION

- Memories are records of what happened in the past.
- A previous event does NOT automatically mean the same cause is responsible for a new problem.
- Never say that a previous treatment will definitely solve a current problem.

10. NEW OBSERVATION QUESTIONS

When the farmer asks specifically:

- What is new today?
- What did I notice today?
- What new thing did I observe?
- What did I observe today?
- ఈరోజు ఏం కొత్తగా గమనించాను?
- ఈరోజు ఏ కొత్త విషయం గమనించాను?
- ఈరోజు ఏం గమనించాను?

you MUST:

- Answer only the newest relevant observation.
- Do not combine unrelated observations.
- Do not list older observations.
- Do not include older yellowing leaves if they were already recorded.
- Do not include older wilted plants if they were already recorded.
- Do not include older dry soil or irrigation events.
- Do not turn an observation into a diagnosis.
- Do not invent a cause.

For example:

If the relevant new memory is:

"Field F-02: The farmer observed small water pools near the rice plants."

The answer should be:

"ఈరోజు F-02లో వరి మొక్కల దగ్గర చిన్న చిన్న నీటి గుంటలు కనిపించాయని మీరు గమనించారు."

Do NOT answer:

"ఈరోజు F-02లో మొక్కలు వాలిపోయాయి, ఆకులు పసుపుగా ఉన్నాయి, నీటి గుంటలు కనిపించాయి."

That answer incorrectly combines previous observations with the new observation.

Your final answer should be concise, practical, history-aware, and safe.
"""

    # ============================================================
    # 8. Create user prompt
    # ============================================================

    user_prompt = f"""
Field: {request.field_id}

Farmer's question:
{request.message}

Relevant recorded history for {request.field_id}:

{memory_context}

Answer the farmer's question using the relevant recorded history.

IMPORTANT:

If this is a normal history question:
- Explain the relevant historical events.
- You may mention multiple relevant events.
- Keep the answer concise.

If this is a "what is new today?" question:
- Return ONLY the newest relevant observation.
- Do NOT combine it with older observations.
- Do NOT list multiple old events.
- Do NOT diagnose the observation.

If the history does not clearly identify the requested information,
say that the recorded history is insufficient.

Respond entirely in {response_language}.
"""

    # ============================================================
    # 9. Ask Groq to reason over farm history
    # ============================================================

    response = groq_client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": user_prompt,
            },
        ],
        temperature=0.3,
        max_completion_tokens=800,
    )

    answer = response.choices[0].message.content

    # ============================================================
    # 10. Extract durable information from farmer message
    # ============================================================

    extracted_memory = extract_memory(
        field_id=request.field_id,
        message=request.message,
        answer=answer,
    )

    # ============================================================
    # 11. Store new durable experience in Hindsight
    # ============================================================

    memory_saved = False

    if (
        extracted_memory.get("should_remember")
        and extracted_memory.get("memory")
    ):

        client.retain(
            bank_id=BANK_ID,
            content=extracted_memory["memory"],
        )

        memory_saved = True

    # ============================================================
    # 12. Return response
    # ============================================================

    return {
        "success": True,
        "response": answer,
        "language": response_language,
        "memory_used": field_memories,
        "memory_saved": memory_saved,
        "new_memory": extracted_memory.get("memory", ""),
    }