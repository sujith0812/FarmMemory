# 🌾 FarmMemory

### A Voice-First AI Farm Companion That Remembers Field History

FarmMemory is a voice-first agricultural AI companion that gives farmers something most conversational AI systems lack: **persistent memory of their farm and field history**.

Instead of starting every conversation from zero, FarmMemory remembers important field observations, actions, crops, and outcomes and uses that history when the farmer asks future questions.

> **FarmMemory remembers what happened in every field, so the next agricultural conversation starts with history instead of zero.**

---

## ✨ What Is FarmMemory?

FarmMemory is designed around a simple idea:

**Agricultural conversations become more useful when the AI remembers the field.**

A field is not a blank slate every time a farmer asks a question.

The field may have:

- Previous crops
- Irrigation events
- Soil conditions
- Farmer observations
- Actions taken
- Previous outcomes
- Seasonal history
- New observations

A normal chatbot mainly sees the current conversation.

FarmMemory adds a persistent memory layer using **Hindsight**, allowing the agent to retrieve relevant historical context and use it in future conversations.

---

# 🎯 The Problem

Agricultural decisions often depend on what happened previously in a particular field.

For example:

A farmer may remember that a field had low soil moisture several weeks ago, irrigation was applied, and the field condition later improved.

When the farmer talks to a new AI conversation later, that context may not be available.

The farmer may have to explain the same history again.

Important information may also be scattered across:

- Notebooks
- WhatsApp messages
- Personal memory
- Separate records
- Previous conversations

### The core problem

> **Agricultural context gets lost between conversations and seasons.**

FarmMemory addresses this by giving the AI agent persistent, queryable memory of field-level experiences.

---

# 💡 The Solution

FarmMemory creates a memory layer around the farmer's field.

The basic interaction is:

```text
                                                                 Farmer
                                                                   # 🌾 FarmMemory

### A Voice-First AI Farm Companion That Remembers Field History

FarmMemory is a voice-first agricultural AI companion that gives farmers something most conversational AI systems lack: **persistent memory of their farm and field history**.

Instead of starting every conversation from zero, FarmMemory remembers important field observations, actions, crops, and outcomes and uses that history when the farmer asks future questions.

> **FarmMemory remembers what happened in every field, so the next agricultural conversation starts with history instead of zero.**

---

## ✨ What Is FarmMemory?

FarmMemory is designed around a simple idea:

**Agricultural conversations become more useful when the AI remembers the field.**

A field is not a blank slate every time a farmer asks a question.

The field may have:

- Previous crops
- Irrigation events
- Soil conditions
- Farmer observations
- Actions taken
- Previous outcomes
- Seasonal history
- New observations

A normal chatbot mainly sees the current conversation.

FarmMemory adds a persistent memory layer using **Hindsight**, allowing the agent to retrieve relevant historical context and use it in future conversations.

---

# 🎯 The Problem

Agricultural decisions often depend on what happened previously in a particular field.

For example:

A farmer may remember that a field had low soil moisture several weeks ago, irrigation was applied, and the field condition later improved.

When the farmer talks to a new AI conversation later, that context may not be available.

The farmer may have to explain the same history again.

Important information may also be scattered across:

- Notebooks
- WhatsApp messages
- Personal memory
- Separate records
- Previous conversations

### The core problem

> **Agricultural context gets lost between conversations and seasons.**

FarmMemory addresses this by giving the AI agent persistent, queryable memory of field-level experiences.

---

# 💡 The Solution

FarmMemory creates a memory layer around the farmer's field.

The basic interaction is:

```text
                                                   Farmer
                                                     ↓
                                               Voice / Chat
                                                     ↓
                                            FarmMemory AI Agent
                                                     ↓
                                              Hindsight Memory
                                                     ↓
                                            Relevant Farm History
                                                     ↓
                                                 AI Reasoning
                                                     ↓
                                         Simple Local-Language Response
                                                     ↓
                                                   Farmer




       ┌──────────────────────┐
       │      FARMER                │
       └──────────┬───────────┘
                     ↓
           New observation
                     ↓
       ┌──────────────────────┐
       │   FARMMEMORY AGENT         │
       └──────────┬───────────┘
                      ↓
       ┌──────────────────────┐
       │  HINDSIGHT MEMORY           │
       │                             │
       │  Retain → Recall            │
       │       → Reflect             │
       └──────────┬───────────┘
                  ↓
          Context-aware answer
                  ↓
           Future interaction
                  │
                  └──────────────→ Memory



                                                    🧠 Why Hindsight Is Central

Hindsight is not being used as an extra feature around a chatbot.

It is the memory layer that makes FarmMemory different from a normal conversational AI system.



FarmMemory uses Hindsight to:

1. Retain

Important farm experiences and observations can be stored as long-term memory.

Example:

Field F-02:
The farmer observed small water pools near the rice plants.


2. Recall

When the farmer asks a future question, FarmMemory retrieves relevant memories for that field.

Example:

F-02 లో గతంలో ఏం జరిగింది?

The agent can retrieve relevant historical events instead of treating the question as a completely new conversation.



3. Use Memory in the Conversation

The retrieved context is provided to the AI agent so the response can be grounded in the farm's history.

The result is a conversation that can become increasingly field-specific and context-aware.





                                                   🔄 Before vs After
              
                 Without FarmMemory
                                               Farmer
                                                 ↓
                                         New conversation
                                                  ↓
                                     AI sees the current context
                                                 ↓
                                    Farmer explains field history again
                                                 ↓
                                    Generic/context-limited response


                 With FarmMemory
                                               
                                                Farmer
                                                  ↓
                                            New conversation
                                                  ↓
                                     Hindsight recalls relevant field history
                                                   ↓
                                  FarmMemory combines history + current observation
                                                  ↓
                                        Context-aware response


The difference:-

Without memory, the conversation starts from the current message.

With FarmMemory, the conversation can start with relevant farm history.


🎙️ Voice-First Experience

FarmMemory is designed around simple farmer interaction rather than complex dashboards.

The interface supports:

Voice input
Telugu interaction
Telugu speech output
Simple field selection
Conversational interaction
Visible memory evidence

The current demo uses the browser's Web Speech API for Telugu voice interaction.




🛠️ Technology Stack

Frontend

1. Next.js
2. React
3. TypeScript
4. Tailwind CSS
5. Lucide React
6. Web Speech API



Backend


1. Python
2. FastAPI
3. Pydantic
4. Python-dotenv


AI

1. Groq
2. OpenAI GPT OSS 20B


Memory

1. Hindsight Cloud


Development

1. Git
2. GitHub
3. VS Code
4. Swagger / OpenAPI




PROJECT STRUTURE:


FarmMemory/
│
├── backend/
│   │
│   ├── app/
│   │   ├── main.py
│   │   ├── ai_client.py
│   │   ├── hindsight_client.py
│   │   ├── memory_extractor.py
│   │   │
│   │   └── routes/
│   │       ├── chat.py
│   │       └── memory.py
│   │
│   ├── .env.example
│   ├── requirements.txt
│   └── test_hindsight.py
│
├── frontend/
│   │
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   ├── package.json
│   └── package-lock.json
│
├── docs/
│   ├── 01-hindsight-recall.jpeg
│   ├── 02-new-memory.jpeg
│   ├── 03-hindsight-today-recall.jpeg
│   └── architecture.png
│
├── README.md
└── .gitignore



🧠 Memory Extraction



FarmMemory does not blindly save every message.

A separate memory extraction step determines whether the farmer's message contains durable information worth remembering.


For example:

1. Stored

->The farmer observed small water pools near the rice plants.


2. Not stored
Hello
Thank you
What happened previously?
What is new today?

The extractor is intentionally designed to avoid turning normal questions or casual conversation into farm memories.


                                                🚀 Local Setup
1. Clone the repository

git clone https://github.com/sujith0812/FarmMemory.git
cd FarmMemory

 
                                               ⚙️ Backend Setup

Open a terminal:

cd backend

Create a Python virtual environment:

py -m venv .venv

Activate it:

.\.venv\Scripts\Activate.ps1

Install dependencies:

pip install --upgrade pip
pip install hindsight-client python-dotenv
pip install fastapi uvicorn
pip install groq

Create:

backend/.env

Add the required environment variables.

Start the backend:

python -m uvicorn app.main:app --reload

The API will be available at:

http://127.0.0.1:8000

Swagger documentation:

http://127.0.0.1:8000/docs

Health check:

http://127.0.0.1:8000/health

Expected response:

{
  "status": "healthy"
}
                                           
                                                 💻 Frontend Setup


Open another terminal:

cd frontend

Install dependencies:

npm install

Start the development server:

npm run dev

Open:

http://localhost:3000



                                              🧪 Testing the Demo


Test 1 — Historical Recall

F-02 లో గతంలో ఏం జరిగింది?

Expected behavior:

FarmMemory retrieves relevant historical field memories.



Test 2 — New Memory
ఈరోజు F-02 లో వరి మొక్కల దగ్గర చిన్న చిన్న నీటి గుంటలు కనిపించాయి.

Expected behavior:

FarmMemory learns something new.
The observation is stored for future conversations.



Test 3 — Future Recall
F-02 లో నేను ఈరోజు ఏ కొత్త విషయం గమనించాను?

Expected behavior:

FarmMemory recalls the newly stored observation.



   The important sequence is:

RECALL 
  |
  -→ RETAIN 
        |
        -→ RECALL


📈 Future Scope

The current MVP focuses on proving the memory workflow.

Future versions can expand the same foundation into:

Farm History
Multi-season field timelines
More detailed crop history
Field-level event tracking
Historical outcomes
Voice
More Indian regional languages
Improved speech recognition
Better speech synthesis
Voice-first navigation
Memory
More sophisticated memory organization
Long-term farm preferences
Cross-season context
Better temporal reasoning
Farm Intelligence
More structured field data
Weather context
Soil information
Sensor integrations
Agricultural knowledge sources
Platform
Multiple farms
Multiple fields
User authentication
Farm-level memory isolation
Mobile-first experience
