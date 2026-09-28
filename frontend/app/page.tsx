"use client";

import { useRef, useState } from "react";

type SpeechRecognitionEvent = Event & {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
};

type SpeechRecognitionErrorEvent = Event & {
  error?: string;
};

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

type MemoryEvent = {
  date: string;
  icon: string;
  title: string;
  description: string;
};

type MemoryEventInternal = MemoryEvent & {
  priority: number;
  sortDate: number;
};

function cleanMemories(
  memories: { type: string; text: string }[]
): MemoryEvent[] {
  const events: MemoryEventInternal[] = [];
  const seen = new Map<string, number>();

  memories.forEach((memory) => {
    const originalText = memory.text?.trim();

    if (!originalText) {
      return;
    }

    const text = originalText.toLowerCase();

    // --------------------------------------------------
    // 1. Ignore invalid/generated memories
    // --------------------------------------------------

    if (
      text.includes("user noted a new observation") ||
      text.includes("the user noted") ||
      text.includes("యూజర్")
    ) {
      return;
    }

    // Ignore large AI-generated combined summaries.
    const observationCount =
      (text.match(/\bobserved\b/g) || []).length;

    if (
      observationCount >= 2 &&
      (
        text.includes(" and ") ||
        text.includes("on september")
      )
    ) {
      return;
    }

    // --------------------------------------------------
    // 2. Clean Hindsight metadata
    // --------------------------------------------------

    const description = originalText
      .replace(
        /\s*\|\s*When:\s*\d{4}-\d{2}-\d{2}(\s*to\s*\d{4}-\d{2}-\d{2})?/gi,
        ""
      )
      .replace(
        /\s*\|\s*Involving:.*$/i,
        ""
      )
      .replace(
        /\s*\|\s*involving:.*$/i,
        ""
      )
      .trim();

    if (description.length < 10) {
      return;
    }

    // --------------------------------------------------
    // 3. Extract date
    // --------------------------------------------------

    let date = "Farm history";
    let sortDate = 0;

    const isoDateMatch = originalText.match(
      /\b(\d{4})-(\d{2})-(\d{2})\b/
    );

    if (isoDateMatch) {
      const [, year, month, day] = isoDateMatch;

      const parsedDate = new Date(
        Number(year),
        Number(month) - 1,
        Number(day)
      );

      if (!Number.isNaN(parsedDate.getTime())) {
        date = parsedDate.toLocaleDateString(
          "en-US",
          {
            month: "long",
            day: "numeric",
            year: "numeric",
          }
        );

        sortDate = parsedDate.getTime();
      }
    }

    // --------------------------------------------------
    // 4. Detect event type
    // --------------------------------------------------

    let icon = "🌾";
    let title = "Farm history";
    let priority = 1;

    // Farm information
    if (
      text.includes("green valley farm") ||
      (
        text.includes("part of") &&
        text.includes("farm")
      )
    ) {
      icon = "🏡";
      title = "Farm information";
      priority = 1;
    }

    // Complete dry soil → irrigation → improvement
    else if (
      text.includes("dry soil") &&
      (
        text.includes("irrigation") ||
        text.includes("irrigated")
      )
    ) {
      icon = "💧";
      title = "Dry soil → Irrigation → Improvement";
      priority = 3;
    }

    // Irrigation
    else if (
      text.includes("irrigated") ||
      text.includes("irrigation")
    ) {
      icon = "💧";
      title = "Water / irrigation event";
      priority = 2;
    }

    // Planting
    else if (
      text.includes("rice was planted") ||
      text.includes("rice planted") ||
      text.includes("planting")
    ) {
      icon = "🌱";
      title = "Crop planting";
      priority = 2;
    }

    // Harvest
    else if (
      text.includes("harvest")
    ) {
      icon = "🌾";
      title = "Harvest event";
      priority = 2;
    }

    // Observation
    else if (
      text.includes("observed") ||
      text.includes("noticed")
    ) {
      icon = "🌱";
      title = "Farm observation";
      priority = 2;
    }

    // --------------------------------------------------
    // 5. Create semantic duplicate key
    // --------------------------------------------------

    let key = "";

    // Yellowing leaves
    if (
      text.includes("yellowing rice leaves") ||
      (
        text.includes("yellow") &&
        text.includes("rice") &&
        text.includes("leaves")
      )
    ) {
      key = "yellowing-rice-leaves";
    }

    // Water pools
    else if (
      text.includes("small water pools") ||
      (
        text.includes("water pools") &&
        text.includes("rice plants")
      )
    ) {
      key = "water-pools-rice";
    }

    // Wilted plants
    else if (
      text.includes("slightly wilted") ||
      text.includes("wilted rice plants")
    ) {
      key = "wilted-rice-plants";
    }

    // Complete dry soil + irrigation story
    else if (
      text.includes("dry soil") &&
      (
        text.includes("irrigation") ||
        text.includes("irrigated")
      )
    ) {
      key = "dry-soil-irrigation";
    }

    // Standalone irrigation that describes the same improvement
    else if (
      (
        text.includes("irrigated") ||
        text.includes("irrigation")
      ) &&
      (
        text.includes("improved the crop") ||
        text.includes("improvement")
      )
    ) {
      key = "dry-soil-irrigation";
    }

    // Rice planting
    else if (
      text.includes("rice was planted") ||
      text.includes("rice planted") ||
      text.includes("planting")
    ) {
      key = "rice-planting";
    }

    // Farm information
    else if (
      text.includes("green valley farm") ||
      (
        text.includes("part of") &&
        text.includes("farm")
      )
    ) {
      key = "farm-information";
    }

    // Unknown event
    else {
      key = text
        .replace(/\s+/g, " ")
        .trim();
    }

    // --------------------------------------------------
    // 6. Deduplicate
    // --------------------------------------------------

    const existingIndex = seen.get(key);

    if (existingIndex !== undefined) {
      const existing = events[existingIndex];

      // Keep the more useful/complete version.
      if (
        priority > existing.priority ||
        description.length > existing.description.length
      ) {
        events[existingIndex] = {
          date,
          icon,
          title,
          description,
          priority,
          sortDate,
        };
      }

      return;
    }

    seen.set(key, events.length);

    events.push({
      date,
      icon,
      title,
      description,
      priority,
      sortDate,
    });
  });

  // --------------------------------------------------
  // 7. Sort newest events first
  // --------------------------------------------------

  events.sort((a, b) => {
    // Dated events first
    if (a.sortDate !== 0 && b.sortDate !== 0) {
      return b.sortDate - a.sortDate;
    }

    if (a.sortDate !== 0) {
      return -1;
    }

    if (b.sortDate !== 0) {
      return 1;
    }

    return 0;
  });

  // --------------------------------------------------
  // 8. Remove internal fields
  // --------------------------------------------------

  return events.map(
    ({
      date,
      icon,
      title,
      description,
    }) => ({
      date,
      icon,
      title,
      description,
    })
  );
}

export default function Home() {
  const [field, setField] = useState("F-02");

  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");

  const [memoryUsed, setMemoryUsed] = useState<MemoryEvent[]>(
    []
  );

  const [memorySaved, setMemorySaved] = useState(false);
  const [newMemory, setNewMemory] = useState("");

  const [error, setError] = useState("");

  const recognitionRef =
    useRef<SpeechRecognitionInstance | null>(null);

  // ----------------------------------------
  // Speak AI response
  // ----------------------------------------

  const speakResponse = (text: string) => {
    if (!("speechSynthesis" in window)) {
      setError(
        "Voice output is not supported in this browser."
      );
      return;
    }

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(text);

    utterance.lang = "te-IN";
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setError(
        "Could not speak the AI response."
      );
    };

    window.speechSynthesis.speak(
      utterance
    );
  };

  // ----------------------------------------
  // Stop AI voice
  // ----------------------------------------

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // ----------------------------------------
  // Send message to FarmMemory backend
  // ----------------------------------------

  const sendToAI = async (message: string) => {
    setIsThinking(true);
    setError("");
    setAiResponse("");
    setMemoryUsed([]);
    setMemorySaved(false);
    setNewMemory("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/chat",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            field_id: field,
            language: "te",
            message: message,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Backend returned ${response.status}`
        );
      }

      const data = await response.json();

      console.log(
        "FarmMemory backend response:",
        data
      );

      if (!data.response) {
        throw new Error(
          "AI response was empty."
        );
      }

      setAiResponse(data.response);

      // Clean and deduplicate Hindsight memories.
      const cleanedMemories =
        cleanMemories(
          data.memory_used || []
        );

      setMemoryUsed(
        cleanedMemories
      );

      setMemorySaved(
        Boolean(data.memory_saved)
      );

      setNewMemory(
        data.new_memory || ""
      );

      // Automatically speak the AI response.
      speakResponse(
        data.response
      );

    } catch (error) {
      console.error(
        "AI request error:",
        error
      );

      // Show the real error in the browser console
      // while keeping a simple user-friendly message.
      setError(
        "FarmMemory could not connect to the AI. Please make sure the backend is running."
      );
    } finally {
      setIsThinking(false);
    }
  };

  // ----------------------------------------
  // Start / Stop microphone
  // ----------------------------------------

  const startListening = () => {
    setError("");

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Speech recognition is not supported. Please use Google Chrome."
      );
      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.lang = "te-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const spokenText =
        event.results[0][0].transcript;

      setTranscript(
        spokenText
      );

      // Send farmer's voice text to AI.
      sendToAI(
        spokenText
      );
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error(
        "Speech recognition error:",
        event.error,
        event
      );

      setIsListening(false);

      if (
        event.error ===
        "not-allowed"
      ) {
        setError(
          "Microphone permission was denied. Please allow microphone access."
        );
      } else if (
        event.error ===
        "no-speech"
      ) {
        setError(
          "No speech detected. Please try speaking again."
        );
      } else {
        setError(
          "Could not understand the voice. Please try again."
        );
      }
    };

    recognitionRef.current =
      recognition;

    setTranscript("");
    setAiResponse("");

    setIsListening(true);

    recognition.start();
  };

  return (
    <main className="min-h-screen bg-green-50 text-gray-900">

      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-8">

        {/* Header */}

        <header className="mb-8 text-center">

          <div className="mb-2 text-5xl">
            🌾
          </div>

          <h1 className="text-3xl font-bold">
            FarmMemory
          </h1>

          <p className="mt-2 text-gray-600">
            Your farm remembers what happened.
          </p>

        </header>

        {/* Field Selector */}

        <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm">

          <label className="mb-2 block text-sm font-medium text-gray-600">
            Select Field
          </label>

          <select
            value={field}
            onChange={(event) =>
              setField(
                event.target.value
              )
            }
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-lg outline-none focus:border-green-500"
          >

            <option value="F-01">
              Field F-01
            </option>

            <option value="F-02">
              Field F-02
            </option>

          </select>

        </section>

        {/* Voice Section */}

        <section className="flex flex-1 flex-col items-center justify-center rounded-3xl bg-white p-8 shadow-sm">

          <p className="mb-6 text-center text-gray-600">
            మీ పొలం గురించి మాట్లాడండి
          </p>

          {/* Microphone */}

          <button
            type="button"
            onClick={
              startListening
            }
            disabled={
              isThinking
            }
            aria-label={
              isListening
                ? "Stop listening"
                : "Start listening"
            }
            className={`flex h-32 w-32 items-center justify-center rounded-full text-5xl shadow-lg transition-all ${
              isListening
                ? "scale-105 bg-red-500"
                : "bg-green-600 hover:bg-green-700"
            } ${
              isThinking
                ? "cursor-not-allowed opacity-50"
                : ""
            }`}
          >

            {isListening
              ? "⏹️"
              : "🎤"}

          </button>

          {/* Status */}

          <p className="mt-5 text-lg font-semibold">

            {isListening
              ? "వింటున్నాను..."

              : isThinking
              ? "ఆలోచిస్తున్నాను..."

              : isSpeaking
              ? "సమాధానం చెబుతున్నాను..."

              : "మాట్లాడటానికి నొక్కండి"}

          </p>

          {/* Stop Speaking */}

          {isSpeaking && (

            <button
              type="button"
              onClick={
                stopSpeaking
              }
              className="mt-4 rounded-xl bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              🔇 Stop Voice
            </button>

          )}

          {/* Farmer Transcript */}

          {transcript && (

            <div className="mt-8 w-full rounded-2xl bg-green-50 p-5">

              <p className="mb-2 text-sm font-medium text-green-700">
                మీరు చెప్పింది
              </p>

              <p className="text-lg leading-8">
                {transcript}
              </p>

            </div>

          )}

          {/* AI Response */}

          {aiResponse && (

            <div className="mt-5 w-full rounded-2xl bg-blue-50 p-5">

              <div className="mb-2 flex items-center gap-2">

                <span className="text-xl">
                  🤖
                </span>

                <p className="text-sm font-medium text-blue-700">
                  FarmMemory
                </p>

              </div>

              <p className="text-lg leading-8">
                {aiResponse}
              </p>

            </div>

          )}

          {/* Error */}

          {error && (

            <div className="mt-4 w-full rounded-2xl bg-red-50 p-4 text-center text-sm text-red-700">
              {error}
            </div>

          )}

        </section>

        {/* Hindsight Status */}

        <section className="mb-6 rounded-2xl border border-green-100 bg-white p-5 shadow-sm">

          <div className="flex items-start gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100 text-2xl">
              🧠
            </div>

            <div className="flex-1">

              <div className="flex items-center justify-between gap-3">

                <div>

                  <h2 className="font-bold text-gray-900">
                    FarmMemory
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    Hindsight memory is active
                  </p>

                </div>

                <div className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1">

                  <span className="h-2 w-2 rounded-full bg-green-500" />

                  <span className="text-xs font-medium text-green-700">
                    Connected
                  </span>

                </div>

              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">

                <div className="rounded-xl bg-gray-50 p-3">

                  <p className="text-lg">
                    🌾
                  </p>

                  <p className="mt-1 text-xs font-semibold text-gray-800">
                    Farm History
                  </p>

                  <p className="text-xs text-gray-500">
                    Remembers past events
                  </p>

                </div>

                <div className="rounded-xl bg-gray-50 p-3">

                  <p className="text-lg">
                    🧠
                  </p>

                  <p className="mt-1 text-xs font-semibold text-gray-800">
                    Hindsight
                  </p>

                  <p className="text-xs text-gray-500">
                    Recalls relevant history
                  </p>

                </div>

                <div className="rounded-xl bg-gray-50 p-3">

                  <p className="text-lg">
                    💾
                  </p>

                  <p className="mt-1 text-xs font-semibold text-gray-800">
                    Learns
                  </p>

                  <p className="text-xs text-gray-500">
                    Saves new observations
                  </p>

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* How FarmMemory Learns */}

        <section className="mb-6 rounded-2xl border border-green-100 bg-white p-5 shadow-sm">

          <div className="text-center">

            <p className="text-xs font-semibold uppercase tracking-wider text-green-600">
              How FarmMemory learns
            </p>

            <h2 className="mt-1 text-lg font-bold text-gray-900">
              Every conversation can become farm memory
            </h2>

          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">

            <div className="rounded-xl bg-green-50 px-4 py-3 text-center">

              <div className="text-2xl">
                🎤
              </div>

              <p className="mt-1 text-xs font-semibold text-gray-800">
                Speak
              </p>

            </div>

            <span className="text-lg text-gray-400">
              →
            </span>

            <div className="rounded-xl bg-green-50 px-4 py-3 text-center">

              <div className="text-2xl">
                🧠
              </div>

              <p className="mt-1 text-xs font-semibold text-gray-800">
                Remember
              </p>

            </div>

            <span className="text-lg text-gray-400">
              →
            </span>

            <div className="rounded-xl bg-green-50 px-4 py-3 text-center">

              <div className="text-2xl">
                🤖
              </div>

              <p className="mt-1 text-xs font-semibold text-gray-800">
                Understand
              </p>

            </div>

            <span className="text-lg text-gray-400">
              →
            </span>

            <div className="rounded-xl bg-green-50 px-4 py-3 text-center">

              <div className="text-2xl">
                💾
              </div>

              <p className="mt-1 text-xs font-semibold text-gray-800">
                Learn
              </p>

            </div>

          </div>

          <p className="mt-4 text-center text-xs leading-5 text-gray-500">
            FarmMemory uses past conversations to make future conversations more useful.
          </p>

        </section>

        {/* New Memory Learned */}

        {memorySaved && newMemory && (

          <section className="mb-6 overflow-hidden rounded-2xl border border-green-200 bg-white shadow-sm">

            <div className="bg-green-600 px-5 py-4 text-white">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-2xl">
                  💾
                </div>

                <div>

                  <h2 className="font-bold">
                    FarmMemory learned something new
                  </h2>

                  <p className="mt-0.5 text-xs text-green-100">
                    Saved for future conversations
                  </p>

                </div>

              </div>

            </div>

            <div className="p-5">

              <div className="rounded-xl border border-green-100 bg-green-50 p-4">

                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-green-700">
                  New farm memory
                </p>

                <p className="text-base leading-7 text-gray-800">
                  {newMemory}
                </p>

              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-gray-500">

                <span>
                  🎤 Farmer
                </span>

                <span>
                  →
                </span>

                <span>
                  🧠 Hindsight
                </span>

                <span>
                  →
                </span>

                <span>
                  💾 Remembered
                </span>

              </div>

            </div>

          </section>

        )}

        {/* Hindsight Memory Evidence */}

        {memoryUsed.length > 0 && (

          <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">

            <div className="mb-6 flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-2xl">
                🧠
              </div>

              <div>

                <h2 className="text-lg font-bold text-gray-900">
                  FarmMemory remembered
                </h2>

                <p className="text-xs text-gray-500">
                  Important history recalled by Hindsight
                </p>

              </div>

            </div>

            <div className="relative">

              <div className="absolute left-5 top-2 bottom-2 w-px bg-green-200" />

              <div className="space-y-6">

                {memoryUsed.map(
                  (event, index) => (

                    <div
                      key={`${event.date}-${event.title}-${index}`}
                      className="relative flex gap-4"
                    >

                      <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-white bg-green-100 text-lg shadow-sm">
                        {event.icon}
                      </div>

                      <div className="flex-1 rounded-xl border border-green-100 bg-green-50 p-4">

                        <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                          {event.date}
                        </p>

                        <h3 className="mt-1 font-semibold text-gray-900">
                          {event.title}
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-gray-700">
                          {event.description}
                        </p>

                      </div>

                    </div>

                  )
                )}

              </div>

            </div>

            <div className="mt-6 rounded-xl bg-gray-50 p-4 text-center">

              <p className="text-xs text-gray-500">
                🧠 {memoryUsed.length} important farm events recalled
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Hindsight memory helped FarmMemory understand the farmer&apos;s history.
              </p>

            </div>

          </section>

        )}

        {/* Footer */}

        <footer className="mt-6 text-center text-xs text-gray-500">
          FarmMemory • AI that learns from farm history
        </footer>

      </div>

    </main>
  );
}