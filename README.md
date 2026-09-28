🌾FarmMemory



An AI farm companion that remembers what happened in your fields, so every new conversation can start with farm history instead of zero.



FarmMemory is a voice-first agricultural AI companion designed around one simple idea:



Farm conversations should have memory.



A farmer can speak about a field, ask about previous events, record a new observation, and later ask about it again. FarmMemory uses Hindsight as its memory layer to retain and recall relevant farm history across conversations.



The current prototype focuses on a simple workflow:



Speak → Remember → Recall → Respond



## **🎯 The Problem**



A normal AI assistant can answer a farmer's question, but without persistent memory, every conversation can effectively start from zero.



For example:



A farmer says:



"Today I noticed small water pools near the rice plants."



Later, the farmer asks:



"What new thing did I notice today?"



Without farm memory, the assistant has no reliable record of what the farmer previously said.



FarmMemory addresses this by making farm history part of the conversation context.



## **💡 The Solution**



FarmMemory combines:



🎤 Voice interaction

🌾 Field-specific farm history

🧠 Hindsight memory

🤖 LLM-based reasoning

🗣️ Local-language responses



The farmer can speak naturally, while FarmMemory handles the memory workflow in the background.



Farmer

&#x20; │

&#x20; │ Voice

&#x20; ▼

FarmMemory Frontend

&#x20; │

&#x20; │ Telugu speech → text

&#x20; ▼

FastAPI Backend

&#x20; │

&#x20; ├──────────────► Hindsight

&#x20; │                 │

&#x20; │                 ├── Recall history

&#x20; │                 └── Retain new memories

&#x20; │

&#x20; ▼

Groq + LLM

&#x20; │

&#x20; ▼

FarmMemory Response

&#x20; │

&#x20; ▼

Telugu Voice Response





**🧠 Why Hindsight?**



FarmMemory needs more than a normal chat history.



The important information is not simply:



"What was the previous message?"



The important question is:



"What does FarmMemory know about this field that is relevant now?"



Hindsight provides the memory layer used by FarmMemory to:



retain durable farm information

recall relevant historical information

connect later conversations with previous farm events

provide memory context to the AI agent



Our backend uses Hindsight for both sides of the memory loop:



New farm information

&#x20;      ↓

&#x20;    Retain

&#x20;      ↓

&#x20;   Hindsight

&#x20;      ↓

&#x20;    Recall

&#x20;      ↓

Relevant farm history

&#x20;      ↓

&#x20;      LLM

&#x20;      ↓

History-aware answer



**🔄 How FarmMemory Learns**



FarmMemory has two important memory operations.



**1. Remember**



When a farmer provides new durable information, the backend extracts the useful farm information and stores it in Hindsight.



For example:



Farmer:



ఈరోజు F-02 లో వరి మొక్కల దగ్గర

చిన్న చిన్న నీటి గుంటలు కనిపించాయి.



FarmMemory extracts the observation:



**Field F-02:**

The farmer observed small water pools near the rice plants.



The memory is then retained in Hindsight.



2\. Recall



Later, the farmer can ask:



F-02 లో నేను ఈరోజు ఏ కొత్త విషయం గమనించాను?



FarmMemory recalls the relevant memory and uses it as context for the LLM.



The response can then focus on the actual recorded observation.



This creates the key behavior:



Conversation 1

&#x20;     ↓

Farmer teaches the agent

&#x20;     ↓

Hindsight retains memory

&#x20;     ↓

Conversation 2

&#x20;     ↓

Farmer asks about the past

&#x20;     ↓

Hindsight recalls memory

&#x20;     ↓

AI responds using history



**## System Architecture**



!\[FarmMemory System Architecture](docs/architecture.png)



FarmMemory follows a voice-first architecture where the farmer's message is processed by the FastAPI agent, relevant farm history is recalled from Hindsight, and the LLM generates a contextual response.



**## Hindsight Memory in Action**



FarmMemory is designed around a simple learning loop:



\*\*Recall → Learn → Recall Again\*\*



**### 1. Recalling Existing Farm History**



Before the new observation, FarmMemory can recall information already stored for the selected field.



!\[Hindsight Recall](docs/01-hindsight-recall.jpeg)



**### 2. Learning a New Farm Observation**



The farmer can provide a new observation using natural language. FarmMemory extracts the durable information and stores it for future conversations.



!\[New Memory Learned](docs/02-new-memory.jpeg)



**### 3. Recalling the Newly Learned Information**



Later, the farmer can ask about the new observation. FarmMemory retrieves the relevant memory instead of starting the conversation from zero.



!\[Hindsight Today Recall](docs/03-hindsight-today-recall.jpeg)



This demonstrates the core FarmMemory loop:



```text

Farmer observation

&#x20;      ↓

Memory extraction

&#x20;      ↓

Hindsight retain

&#x20;      ↓

Future conversation

&#x20;      ↓

Hindsight recall

&#x20;      ↓

Context-aware response





**🎬 Working Demo**



The current prototype demonstrates three interactions.



1\. Recall existing farm history



The farmer asks:



F-02 లో గతంలో ఏం జరిగింది?



FarmMemory retrieves relevant historical information associated with field F-02.



The interface displays the recalled Hindsight memories.



2\. Teach FarmMemory something new



The farmer says:



ఈరోజు F-02 లో వరి మొక్కల దగ్గర

చిన్న చిన్న నీటి గుంటలు కనిపించాయి.



**The system:**



Farmer observation

&#x20;       ↓

Memory extraction

&#x20;       ↓

Hindsight retain

&#x20;       ↓

Memory saved



The interface then displays:



FarmMemory learned something new



along with the newly stored farm memory.



3\. Recall the new observation later



The farmer asks:



F-02 లో నేను ఈరోజు ఏ కొత్త విషయం గమనించాను?



FarmMemory retrieves the relevant recent observation and responds with the water-pool observation.



This demonstrates the core memory behavior:



The agent remembers something the farmer told it earlier and uses that memory in a later conversation.



**🧠 Hindsight Memory Evidence**



The application exposes the memory process directly in the interface.



**The current UI shows:**



**🌾 Farm History**



Remembers past events.



**🧠 Hindsight**



Recalls relevant history.



**💾 Learns**



Saves new observations.



When memories are recalled, the interface also displays a FarmMemory remembered section containing the relevant historical memories.



When a new memory is successfully stored, the interface shows:



FarmMemory learned something new



Saved for future conversations



**New farm memory:**

Field F-02: The farmer observed small water pools

near the rice plants.

**🏗️ Architecture**

&#x20;                   ┌──────────────────────┐

&#x20;                   │       Farmer                │

&#x20;                   │   🎤 Telugu Voice          │

&#x20;                   └──────────┬───────────┘

&#x20;                              │

&#x20;                              ▼

&#x20;                   ┌──────────────────────┐

&#x20;                   │   Next.js Frontend          │

&#x20;                   │      React + TS             │

&#x20;                   └──────────┬───────────┘

&#x20;                              │

&#x20;                        HTTP / JSON

&#x20;                              │

&#x20;                              ▼

&#x20;                   ┌──────────────────────┐

&#x20;                   │    FastAPI Backend          │

&#x20;                   │    FarmMemory Agent         │

&#x20;                   └──────┬─────────┬─────┘

&#x20;                          │         │

&#x20;                   Recall │         │ Retain

&#x20;                          ▼         ▼

&#x20;                   ┌──────────────────────┐

&#x20;                   │      Hindsight              │

&#x20;                   │    Farm Memory              │

&#x20;                   └──────────┬───────────┘

&#x20;                              │

&#x20;                        Relevant Memory

&#x20;                              │

&#x20;                              ▼

&#x20;                   ┌──────────────────────┐

&#x20;                   │     Groq + LLM             │

&#x20;                   │  openai/gpt-oss-20b        │

&#x20;                   └──────────┬───────────┘

&#x20;                              │

&#x20;                              ▼

&#x20;                   ┌──────────────────────┐

&#x20;                   │  Telugu Response           │

&#x20;                   │      🔊 Voice              │

&#x20;                   └──────────────────────┘

**🛠️ Tech Stack**

Layer	               Technology

Frontend	         Next.js

UI	                 React + TypeScript + Tailwind CSS

Backend	                 Python + FastAPI

Memory	                 Hindsight

LLM	                  Groq

Model                  	openai/gpt-oss-20b

Voice Input	        Web Speech API

Voice Language	        Telugu (te-IN)

API Communication	HTTP / JSON







**📁 Project Structure**

FarmMemory/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── ai_client.py
│   │   ├── hindsight_client.py
│   │   ├── memory_extractor.py
│   │   └── routes/
│   │       ├── memory.py
│   │       └── chat.py
│   │
│   ├── .env.example
│   ├── .gitignore
│   └── test_hindsight.py
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── package.json
│   └── ...
│
├── docs/
│   ├── architecture.png
│   ├── 01-hindsight-recall.png.jpeg
│   ├── 02-new-memory.png.jpeg
│   └── 03-hindsight-today-recall.png.jpeg
│
└── README.md






**🔌 Backend API**

Health Check

GET /health



Response:



{

&#x20; "status": "healthy"

}

Chat

POST /api/chat



Example request:



{

&#x20; "field\_id": "F-02",

&#x20; "language": "te",

&#x20; "message": "ఈరోజు F-02 లో ఏం గమనించాను?"

}



**The chat endpoint:**



receives the farmer's message

creates a field-aware memory query

recalls memories from Hindsight

filters them for the requested field

provides relevant memory to the LLM

generates the response

extracts durable information from the farmer's message

retains new information when appropriate

Remember

POST /api/memory/remember



Used to explicitly store farm information in Hindsight.



Recall

POST /api/memory/recall



Used to retrieve relevant farm memories.



**🧩 Memory Extraction**



A separate memory extraction component determines whether a farmer's message contains durable farm information.



The extractor is instructed to use only the farmer's message.



It must not extract information from the AI response.



For example:



Farmer:

Today I noticed small water pools near the rice plants.



Can become:



Field F-02:

The farmer observed small water pools near the rice plants.



But a question such as:



What happened previously in F-02?



should not become a new memory.



This distinction prevents normal questions from polluting the farm memory.







**🔐 Safety \& Limitations**



FarmMemory is designed as an information and memory assistant, not as a replacement for agricultural professionals.



The current AI instructions explicitly prevent the system from:



inventing farm events

inventing dates

inventing crop actions

treating historical events as guaranteed causes

diagnosing crop diseases with certainty

guaranteeing agricultural outcomes

prescribing pesticide or chemical quantities

inventing fertilizer doses

presenting unsupported agricultural measurements as facts



When a crop problem is uncertain or potentially serious, the system is instructed to recommend checking with a local agricultural expert.



Farm memories are treated as historical records, not proof that the same event or cause will occur again.









**🌱 Real-World Use Case**



FarmMemory is designed around a simple interaction model:



"I told you this before."

&#x20;         ↓

"Remember my field."

&#x20;         ↓

"What happened there previously?"

&#x20;         ↓

"What's new today?"



Instead of forcing the farmer to repeatedly explain the same field history, the agent can use the information already recorded in its memory.



The current prototype focuses on a single field-oriented workflow rather than attempting to solve every agricultural problem.







**🔮 Future Scope**



The current implementation is intentionally focused.



Potential future development includes:



persistent farmer profiles

multiple farms and fields

richer crop histories

planting and harvest records

weather and field-condition integrations

additional Indian languages

improved speech recognition

agricultural expert verification workflows

mobile application support

structured farm analytics

longer-term field trends



These are future directions, not claims about the current implementation.







**🚀 Running Locally**

Backend



Open PowerShell:



cd D:\\FarmMemory\\backend



Activate the virtual environment:



.\\.venv\\Scripts\\Activate.ps1



**Start FastAPI:**



python -m uvicorn app.main:app --reload



**Backend:**



http://127.0.0.1:8000



Swagger API documentation:



http://127.0.0.1:8000/docs

Frontend



Open another terminal:



cd D:\\FarmMemory\\frontend



Start Next.js:



npm run dev



**Frontend:**



http://localhost:3000

## 🔑 Environment Variables

Create a `.env` file inside the `backend/` directory.

Required variables:

```env
HINDSIGHT_API_URL=https://api.hindsight.vectorize.io
HINDSIGHT_API_KEY=your_hindsight_api_key_here
HINDSIGHT_BANK_ID=farm-memory-demo
GROQ_API_KEY=your_groq_api_key_here



Never commit .env or API keys to GitHub.



Add .env to .gitignore.



**Example:**



.env

.venv/

\_\_pycache\_\_/

node\_modules/

.next/


🧪 Example Memory Journey

First interaction

Farmer:

Today I noticed small water pools near the rice plants.

FarmMemory

Extract observation

&#x20;       ↓

Retain in Hindsight

Later interaction

Farmer:

What new thing did I notice today?

FarmMemory

Recall from Hindsight

&#x20;       ↓

Identify relevant recent memory

&#x20;       ↓

Generate response

Result



The farmer gets an answer based on the previously recorded observation.



**💭 The Core Idea**



Most AI conversations are designed around the current message.



FarmMemory is designed around:



Current conversation

&#x20;       +

Relevant farm history

&#x20;       +

New observations

&#x20;       ↓

Better context for the next conversation



The goal isn't simply to make an AI that can answer agricultural questions.



The goal is to make an AI that remembers the farmer's field over time.



📌 Project Status



Current status: Working MVP



**Implemented and tested:**



✅ Voice input

✅ Telugu speech recognition

✅ Field selection

✅ FastAPI backend

✅ Hindsight integration

✅ Farm memory retention

✅ Farm memory recall

✅ Field-specific memory filtering

✅ LLM response generation

✅ Telugu responses

✅ Text-to-speech response

✅ New-memory extraction

✅ Memory-learning UI

✅ Hindsight memory evidence UI

✅ Three-step hindsight demonstration

🔗 Resources

Hindsight: https://github.com/vectorize-io/hindsight

Hindsight Documentation: https://hindsight.vectorize.io/

Vectorize Agent Memory: https://vectorize.io/what-is-agent-memory

👥 Team



**FarmMemory**



Built for the Hindsight-powered agent experience.

