"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  Brain,
  CheckCircle2,
  ChevronDown,
  Clock3,
  History,
  Leaf,
  Loader2,
  Mic,
  MicOff,
  MessageCircle,
  Pause,
  Radio,
  Sparkles,
  Sprout,
  Volume2,
  VolumeX,
  Waves,
  X,
} from "lucide-react";

type Language = "te" | "en";

type MemoryEvent = {
  id: string;
  fieldId: string;
  text: string;
  date: string;
  type?: string;
  isNew?: boolean;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  time: string;
  memoryUsed?: boolean;
};

type BackendResponse = {
  success?: boolean;
  response?: string;
  language?: string;
  memory_used?: unknown[];
  memory_saved?: boolean;
  new_memory?: string;
};

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onresult: ((event: {
    results: {
      [key: number]: {
        [key: number]: {
          transcript: string;
        };
      };
    };
  }) => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const API_URL = "http://127.0.0.1:8000";

const FIELD_ID = "F-02";

const initialMemories: MemoryEvent[] = [
  {
    id: "memory-1",
    fieldId: "F-02",
    text: "Field F-02: Rice was planted for the Kharif season.",
    date: "2026-06-18",
    type: "farm",
  },
  {
    id: "memory-2",
    fieldId: "F-02",
    text: "Field F-02: Soil moisture was low and irrigation was applied.",
    date: "2026-08-14",
    type: "observation",
  },
  {
    id: "memory-3",
    fieldId: "F-02",
    text: "Field F-02: The soil moisture condition improved after irrigation.",
    date: "2026-08-18",
    type: "outcome",
  },
];

function formatDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime() {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseMemoryDate(text: string): string {
  const patterns = [
    /(\d{4}-\d{2}-\d{2})/,
    /(\d{2}-\d{2}-\d{4})/,
    /(\d{2}\/\d{2}\/\d{4})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      const raw = match[1];

      if (raw.includes("-")) {
        const parts = raw.split("-");

        if (parts[0].length === 4) {
          return raw;
        }

        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }

      if (raw.includes("/")) {
        const parts = raw.split("/");
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
  }

  return new Date().toISOString().split("T")[0];
}

function cleanMemoryText(text: string) {
  return text
    .replace(/^Field\s+[A-Za-z0-9-]+:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getMemoryLabel(text: string) {
  const lower = text.toLowerCase();

  if (
    lower.includes("water pools") ||
    lower.includes("water near") ||
    lower.includes("నీటి") ||
    lower.includes("గుంట")
  ) {
    return "Observation";
  }

  if (
    lower.includes("irrigation") ||
    lower.includes("నీరు పెట్ట") ||
    lower.includes("నీటిపారుదల")
  ) {
    return "Action";
  }

  if (
    lower.includes("planted") ||
    lower.includes("planting") ||
    lower.includes("నాట")
  ) {
    return "Crop";
  }

  if (
    lower.includes("soil") ||
    lower.includes("మట్టి")
  ) {
    return "Field condition";
  }

  return "Farm memory";
}

function getMemoryIcon(text: string) {
  const lower = text.toLowerCase();

  if (
    lower.includes("water") ||
    lower.includes("నీటి") ||
    lower.includes("గుంట")
  ) {
    return "💧";
  }

  if (
    lower.includes("soil") ||
    lower.includes("మట్టి")
  ) {
    return "🌱";
  }

  if (
    lower.includes("irrigation") ||
    lower.includes("నీటిపారుదల")
  ) {
    return "🚿";
  }

  if (
    lower.includes("plant") ||
    lower.includes("rice") ||
    lower.includes("వరి")
  ) {
    return "🌾";
  }

  return "🧠";
}

function getInitialAssistantMessage(): ChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    text:
      "నమస్కారం! నేను FarmMemory. మీ పొలం గురించి మాట్లాడండి. గతంలో జరిగిన విషయాలను గుర్తుంచుకుని, కొత్త విషయాలను భవిష్యత్ సంభాషణల కోసం గుర్తుంచుకుంటాను.",
    time: formatTime(),
    memoryUsed: false,
  };
}

export default function Home() {
  const [selectedField] = useState(FIELD_ID);

  const [messages, setMessages] = useState<ChatMessage[]>([
    getInitialAssistantMessage(),
  ]);

  const [input, setInput] = useState("");

  const [isListening, setIsListening] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [voiceSupported, setVoiceSupported] = useState(true);

  const [memories, setMemories] =
    useState<MemoryEvent[]>(initialMemories);

  const [newMemory, setNewMemory] = useState<string | null>(null);

  const [lastMemoryCount, setLastMemoryCount] = useState(0);

  const [showMemoryPanel, setShowMemoryPanel] = useState(true);

  const [language] = useState<Language>("te");

  const [isBackendOnline, setIsBackendOnline] = useState(true);

  const recognitionRef =
    useRef<SpeechRecognitionInstance | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const Recognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!Recognition) {
      setVoiceSupported(false);
      return;
    }

    const recognition = new Recognition();

    recognition.lang = "te-IN";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      let transcript = "";

      for (let i = 0; i < Object.keys(event.results).length; i++) {
        const result = event.results[i];

        if (result?.[0]?.transcript) {
          transcript += result[0].transcript;
        }
      }

      setInput(transcript);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isSending]);

  useEffect(() => {
    if (!newMemory) return;

    const timeout = window.setTimeout(() => {
      setNewMemory(null);
    }, 9000);

    return () => window.clearTimeout(timeout);
  }, [newMemory]);

  const sortedMemories = useMemo(() => {
    return [...memories].sort((a, b) => {
      return (
        new Date(b.date).getTime() -
        new Date(a.date).getTime()
      );
    });
  }, [memories]);

  const latestMemory = sortedMemories[0];

  const todayMemories = useMemo(() => {
    const today = new Date()
      .toISOString()
      .split("T")[0];

    return sortedMemories.filter((memory) => {
      return memory.date === today;
    });
  }, [sortedMemories]);

  function startListening() {
    if (!recognitionRef.current || !voiceSupported) {
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      return;
    }

    try {
      recognitionRef.current.start();
    } catch {
      setIsListening(false);
    }
  }

  function stopSpeaking() {
    if (typeof window === "undefined") return;

    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }

  function speak(text: string) {
    if (typeof window === "undefined") return;

    if (!("speechSynthesis" in window)) {
      return;
    }

    stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);

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
    };

    window.speechSynthesis.speak(utterance);
  }

  function addMemoryToTimeline(memoryText: string) {
    const normalized = cleanMemoryText(memoryText);

    if (!normalized) {
      return;
    }

    const date = parseMemoryDate(memoryText);

    const duplicate = memories.some((memory) => {
      return (
        cleanMemoryText(memory.text).toLowerCase() ===
        normalized.toLowerCase()
      );
    });

    if (duplicate) {
      return;
    }

    const event: MemoryEvent = {
      id: `memory-${Date.now()}`,
      fieldId: selectedField,
      text: memoryText,
      date,
      type: "observation",
      isNew: true,
    };

    setMemories((current) => [
      event,
      ...current,
    ]);
  }

  async function sendToAI(messageOverride?: string) {
    const message = (messageOverride ?? input).trim();

    if (!message || isSending) {
      return;
    }

    setInput("");

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: message,
      time: formatTime(),
    };

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setIsSending(true);
    setNewMemory(null);

    try {
      const response = await fetch(
        `${API_URL}/api/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            field_id: selectedField,
            language,
            message,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `API error: ${response.status}`
        );
      }

      const data =
        (await response.json()) as BackendResponse;

      console.log(
        "🌾 FarmMemory response:",
        data
      );

      setIsBackendOnline(true);

      const assistantText =
        data.response ||
        "క్షమించండి, ప్రస్తుతం నాకు సమాధానం ఇవ్వడం సాధ్యం కాలేదు.";

      const memoryCount = Array.isArray(
        data.memory_used
      )
        ? data.memory_used.length
        : 0;

      setLastMemoryCount(memoryCount);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: assistantText,
        time: formatTime(),
        memoryUsed: memoryCount > 0,
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);

      if (
        data.memory_saved &&
        data.new_memory
      ) {
        setNewMemory(data.new_memory);

        addMemoryToTimeline(
          data.new_memory
        );
      }

      speak(assistantText);
    } catch (error) {
      console.error(
        "FarmMemory API error:",
        error
      );

      setIsBackendOnline(false);

      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        text:
          "FarmMemory AIకి కనెక్ట్ అవ్వలేకపోతున్నాను. Backend server running లో ఉందో check చేయండి.",
        time: formatTime(),
      };

      setMessages((current) => [
        ...current,
        errorMessage,
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();
    sendToAI();
  }

  function handleInputKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      sendToAI();
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7f3] text-[#17231a]">
      {/* --------------------------------------------------
          TOP NAVIGATION
      -------------------------------------------------- */}
      <header className="sticky top-0 z-50 border-b border-[#dfe6dd] bg-[#f8faf7]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1500px] items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#183d25] text-white shadow-sm">
              <Sprout
                size={21}
                strokeWidth={2.2}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[17px] font-semibold tracking-[-0.02em]">
                  FarmMemory
                </h1>

                <span className="hidden rounded-full border border-[#cfe0d0] bg-[#edf6ed] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#2d713c] sm:inline-flex">
                  AI Farm Companion
                </span>
              </div>

              <p className="text-[11px] text-[#718073]">
                Your farm remembers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium sm:flex ${
                isBackendOnline
                  ? "border-[#cfe0d0] bg-[#edf6ed] text-[#347241]"
                  : "border-[#efd0cc] bg-[#fff2f0] text-[#b94a3d]"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isBackendOnline
                    ? "bg-[#48a45a]"
                    : "bg-[#d45447]"
                }`}
              />

              {isBackendOnline
                ? "AI online"
                : "AI offline"}
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dce4da] bg-white text-sm font-semibold text-[#315c3b] shadow-sm">
              SG
            </div>
          </div>
        </div>
      </header>

      {/* --------------------------------------------------
          MAIN APPLICATION
      -------------------------------------------------- */}
      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-8 sm:py-7">
        <div className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)_300px]">
          {/* ------------------------------------------------
              LEFT SIDEBAR
          ------------------------------------------------ */}
          <aside className="hidden lg:block">
            <div className="sticky top-[95px] space-y-4">
              <section className="rounded-2xl border border-[#dfe6dd] bg-white p-4 shadow-[0_10px_35px_rgba(25,55,30,0.04)]">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#879286]">
                    Your farm
                  </p>

                  <ChevronDown
                    size={15}
                    className="text-[#8a9589]"
                  />
                </div>

                <div className="rounded-xl border border-[#dce7da] bg-[#f5f9f3] p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#dfeedd] text-[#3f7547]">
                      <Leaf size={19} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        Green Valley Farm
                      </p>

                      <p className="text-[11px] text-[#778277]">
                        Rice · Kharif 2026
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-[#dfe6dd] bg-white p-2 shadow-[0_10px_35px_rgba(25,55,30,0.04)]">
                <button className="flex w-full items-center gap-3 rounded-xl bg-[#edf5ec] px-3 py-2.5 text-left text-sm font-medium text-[#275e33]">
                  <MessageCircle size={17} />
                  Farm Assistant
                </button>

                <button
                  onClick={() =>
                    setShowMemoryPanel(
                      (value) => !value
                    )
                  }
                  className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-[#687368] transition hover:bg-[#f5f7f4]"
                >
                  <Brain size={17} />
                  Farm Memory
                </button>

                <button className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-[#687368] transition hover:bg-[#f5f7f4]">
                  <History size={17} />
                  Conversation History
                </button>
              </section>

              <section className="rounded-2xl border border-[#dfe6dd] bg-[#183d25] p-4 text-white shadow-[0_14px_40px_rgba(24,61,37,0.14)]">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                  <Sparkles size={17} />
                </div>

                <p className="text-xs font-semibold">
                  FarmMemory learns
                </p>

                <p className="mt-1.5 text-[11px] leading-5 text-white/65">
                  Every useful farm observation can
                  become context for a future
                  conversation.
                </p>

                <div className="mt-4 flex items-center gap-2 text-[10px] font-medium text-[#b8d8bc]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#82c98d]" />
                  Powered by Hindsight
                </div>
              </section>
            </div>
          </aside>

          {/* ------------------------------------------------
              CENTER CHAT
          ------------------------------------------------ */}
          <section className="min-w-0">
            {/* Field header */}
            <div className="mb-4 rounded-2xl border border-[#dfe6dd] bg-white px-4 py-4 shadow-[0_10px_35px_rgba(25,55,30,0.04)] sm:px-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e6f1e3] text-[#3c7545]">
                    <Leaf size={21} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold">
                        Field {selectedField}
                      </h2>

                      <span className="rounded-full bg-[#edf6ed] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#367442]">
                        Active
                      </span>
                    </div>

                    <p className="mt-0.5 text-xs text-[#778277]">
                      Rice field · Kharif 2026
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#9aa39a]">
                      Memories
                    </p>

                    <p className="mt-0.5 text-sm font-semibold">
                      {memories.length}
                    </p>
                  </div>

                  <div className="h-7 w-px bg-[#e3e8e1]" />

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#9aa39a]">
                      Language
                    </p>

                    <p className="mt-0.5 text-sm font-semibold">
                      తెలుగు
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat card */}
            <div className="overflow-hidden rounded-2xl border border-[#dfe6dd] bg-white shadow-[0_14px_45px_rgba(25,55,30,0.05)]">
              {/* Chat top bar */}
              <div className="flex items-center justify-between border-b border-[#edf0eb] px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf5ec] text-[#3c7545]">
                    <Brain size={16} />

                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-white bg-[#53a660]" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold">
                      FarmMemory AI
                    </p>

                    <p className="text-[10px] text-[#8a9489]">
                      Remembers your field history
                    </p>
                  </div>
                </div>

                {lastMemoryCount > 0 && (
                  <div className="flex items-center gap-1.5 rounded-full border border-[#d8e7d6] bg-[#f2f8f1] px-2.5 py-1 text-[10px] font-medium text-[#3c7444]">
                    <Brain size={12} />
                    {lastMemoryCount} memories used
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="min-h-[430px] max-h-[570px] overflow-y-auto bg-[#fcfdfb] px-4 py-5 sm:px-7 sm:py-7">
                <div className="mx-auto max-w-[760px] space-y-6">
                  {messages.map((message) => {
                    const isUser =
                      message.role === "user";

                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          isUser
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`flex max-w-[88%] gap-3 ${
                            isUser
                              ? "flex-row-reverse"
                              : "flex-row"
                          }`}
                        >
                          <div
                            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                              isUser
                                ? "bg-[#dcead9] text-[#386941]"
                                : "bg-[#183d25] text-white"
                            }`}
                          >
                            {isUser ? (
                              <span className="text-[10px] font-bold">
                                You
                              </span>
                            ) : (
                              <Brain size={14} />
                            )}
                          </div>

                          <div
                            className={`${
                              isUser
                                ? "items-end"
                                : "items-start"
                            } flex flex-col`}
                          >
                            <div
                              className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                                isUser
                                  ? "rounded-tr-md bg-[#e4f0e1] text-[#23452a]"
                                  : "rounded-tl-md border border-[#e3e9e0] bg-white text-[#344136] shadow-sm"
                              }`}
                            >
                              {message.text}
                            </div>

                            <div className="mt-1.5 flex items-center gap-2 px-1 text-[9px] text-[#9aa39a]">
                              <span>
                                {message.time}
                              </span>

                              {!isUser &&
                                message.memoryUsed && (
                                  <>
                                    <span>•</span>

                                    <span className="flex items-center gap-1 text-[#4d8254]">
                                      <Brain size={10} />
                                      Hindsight used
                                    </span>
                                  </>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {isSending && (
                    <div className="flex justify-start">
                      <div className="flex max-w-[88%] gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#183d25] text-white">
                          <Brain size={14} />
                        </div>

                        <div className="rounded-2xl rounded-tl-md border border-[#e3e9e0] bg-white px-4 py-3 shadow-sm">
                          <div className="flex items-center gap-2">
                            <Loader2
                              size={14}
                              className="animate-spin text-[#47764e]"
                            />

                            <span className="text-xs text-[#7d877d]">
                              FarmMemory is recalling...
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Voice mode indicator */}
              {isListening && (
                <div className="border-t border-[#dfe9dd] bg-[#f0f7ee] px-5 py-3">
                  <div className="mx-auto flex max-w-[760px] items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#dcebd9] text-[#3f7b48]">
                        <Mic size={15} />

                        <span className="absolute inset-0 animate-ping rounded-full border border-[#83b98a]" />
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-[#376640]">
                          Listening...
                        </p>

                        <p className="text-[10px] text-[#78907a]">
                          తెలుగు లో మాట్లాడండి
                        </p>
                      </div>
                    </div>

                    <Waves
                      size={20}
                      className="animate-pulse text-[#5d9665]"
                    />
                  </div>
                </div>
              )}

              {/* Composer */}
              <form
                onSubmit={handleSubmit}
                className="border-t border-[#e8ece6] bg-white p-4 sm:p-5"
              >
                <div className="mx-auto max-w-[760px]">
                  <div className="rounded-2xl border border-[#dce5da] bg-[#fafcf9] p-2 transition focus-within:border-[#91b995] focus-within:ring-4 focus-within:ring-[#dcebdc]/60">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(event) =>
                        setInput(
                          event.target.value
                        )
                      }
                      onKeyDown={
                        handleInputKeyDown
                      }
                      placeholder="Ask about your field or tell FarmMemory what you observed..."
                      rows={2}
                      className="w-full resize-none border-0 bg-transparent px-3 py-2 text-sm leading-6 text-[#25352a] outline-none placeholder:text-[#a0a9a0]"
                    />

                    <div className="flex items-center justify-between px-1 pb-1">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={startListening}
                          disabled={
                            !voiceSupported ||
                            isSending
                          }
                          title={
                            voiceSupported
                              ? "Speak"
                              : "Voice recognition is not supported"
                          }
                          className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                            isListening
                              ? "bg-[#dcebd9] text-[#347040]"
                              : "text-[#718072] hover:bg-[#edf4eb] hover:text-[#3e7047]"
                          }`}
                        >
                          {isListening ? (
                            <MicOff size={17} />
                          ) : (
                            <Mic size={17} />
                          )}
                        </button>

                        {isSpeaking && (
                          <button
                            type="button"
                            onClick={stopSpeaking}
                            title="Stop voice"
                            className="flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-[10px] font-medium text-[#54705a] transition hover:bg-[#edf4eb]"
                          >
                            <VolumeX size={14} />
                            Stop voice
                          </button>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={
                          !input.trim() ||
                          isSending
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#183d25] text-white shadow-sm transition hover:bg-[#245a33] disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        {isSending ? (
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />
                        ) : (
                          <ArrowUp size={17} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between px-1">
                    <p className="text-[9px] text-[#9ba49a]">
                      Press Enter to send · Shift + Enter
                      for new line
                    </p>

                    <div className="hidden items-center gap-1.5 text-[9px] text-[#8f998f] sm:flex">
                      <Radio size={10} />
                      Voice-first
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* New memory notification */}
            {newMemory && (
              <div className="mt-4 overflow-hidden rounded-2xl border border-[#cfe2cd] bg-white shadow-[0_12px_35px_rgba(44,92,50,0.08)]">
                <div className="flex items-center gap-3 border-b border-[#e7eee5] bg-[#f3f9f1] px-4 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dcebd9] text-[#3d7746]">
                    <Sparkles size={15} />
                  </div>

                  <div className="flex-1">
                    <p className="text-xs font-semibold text-[#2f6138]">
                      FarmMemory learned something new
                    </p>

                    <p className="text-[10px] text-[#77907b]">
                      Saved for future conversations
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setNewMemory(null)
                    }
                    className="text-[#8b968b] hover:text-[#4d5c4f]"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="px-4 py-4">
                  <div className="mb-2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.14em] text-[#879487]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#55a360]" />
                    New farm memory
                  </div>

                  <p className="text-sm leading-6 text-[#334337]">
                    {cleanMemoryText(
                      newMemory
                    )}
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-[10px] text-[#6d816f]">
                    <span>🎤 Farmer</span>
                    <span>→</span>
                    <span>🧠 Hindsight</span>
                    <span>→</span>
                    <span>💾 Remembered</span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ------------------------------------------------
              RIGHT MEMORY PANEL
          ------------------------------------------------ */}
          <aside className="lg:block">
            <div className="sticky top-[95px] space-y-4">
              <section className="overflow-hidden rounded-2xl border border-[#dfe6dd] bg-white shadow-[0_10px_35px_rgba(25,55,30,0.04)]">
                <div className="border-b border-[#e8ede6] px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f2e6] text-[#3f7748]">
                        <Brain size={16} />
                      </div>

                      <div>
                        <p className="text-xs font-semibold">
                          Farm Memory
                        </p>

                        <p className="text-[9px] text-[#8a958a]">
                          Hindsight
                        </p>
                      </div>
                    </div>

                    <span className="flex items-center gap-1.5 rounded-full bg-[#edf6ed] px-2 py-1 text-[9px] font-semibold text-[#3e7747]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#54a261]" />
                      Active
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="mb-4 rounded-xl bg-[#f5f8f4] p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#8a9589]">
                        Relevant memories
                      </p>

                      <Brain
                        size={13}
                        className="text-[#6c896f]"
                      />
                    </div>

                    <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#244b2d]">
                      {memories.length}
                    </p>

                    <p className="text-[10px] text-[#829082]">
                      stored for Field {selectedField}
                    </p>
                  </div>

                  <div className="space-y-1">
                    {sortedMemories.map(
                      (memory, index) => (
                        <div
                          key={memory.id}
                          className="group relative flex gap-3 rounded-xl px-2 py-3 transition hover:bg-[#f7f9f6]"
                        >
                          <div className="relative flex flex-col items-center">
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${
                                index === 0
                                  ? "bg-[#e3f0e0]"
                                  : "bg-[#f0f3ef]"
                              }`}
                            >
                              {getMemoryIcon(
                                memory.text
                              )}
                            </div>

                            {index <
                              sortedMemories.length -
                                1 && (
                              <div className="absolute top-9 h-[calc(100%+4px)] w-px bg-[#e1e7df]" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#809080]">
                                {getMemoryLabel(
                                  memory.text
                                )}
                              </span>

                              <span className="shrink-0 text-[9px] text-[#9ca69c]">
                                {formatDate(
                                  memory.date
                                )}
                              </span>
                            </div>

                            <p className="mt-1 text-[11px] leading-5 text-[#4b574c]">
                              {cleanMemoryText(
                                memory.text
                              )}
                            </p>

                            {memory.isNew && (
                              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#e8f5e7] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-[#3d7946]">
                                <Sparkles
                                  size={8}
                                />
                                New
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </section>

              {/* Latest observation */}
              <section className="rounded-2xl border border-[#dfe6dd] bg-white p-4 shadow-[0_10px_35px_rgba(25,55,30,0.04)]">
                <div className="mb-3 flex items-center gap-2">
                  <Clock3
                    size={14}
                    className="text-[#69816c]"
                  />

                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7d897e]">
                    Latest memory
                  </p>
                </div>

                {latestMemory ? (
                  <>
                    <p className="text-xs font-medium leading-5 text-[#3f4e42]">
                      {cleanMemoryText(
                        latestMemory.text
                      )}
                    </p>

                    <div className="mt-3 flex items-center gap-2 text-[9px] text-[#8b968b]">
                      <CheckCircle2
                        size={11}
                        className="text-[#55925e]"
                      />
                      Remembered by FarmMemory
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-[#8b958b]">
                    No recent observations.
                  </p>
                )}
              </section>

              {/* Memory explanation */}
              <section className="rounded-2xl border border-[#dfe6dd] bg-[#f9fbf8] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e7f0e5] text-[#46744d]">
                    <Sparkles size={15} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold">
                      Why memory matters
                    </p>

                    <p className="mt-1.5 text-[10px] leading-5 text-[#788379]">
                      FarmMemory uses past farm
                      context so a future
                      conversation does not always
                      have to start from zero.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </aside>
        </div>

        {/* --------------------------------------------------
            MOBILE MEMORY STRIP
        -------------------------------------------------- */}
        <div className="mt-5 lg:hidden">
          <button
            type="button"
            onClick={() =>
              setShowMemoryPanel(
                (value) => !value
              )
            }
            className="flex w-full items-center justify-between rounded-2xl border border-[#dfe6dd] bg-white px-4 py-3.5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e7f1e5] text-[#47784f]">
                <Brain size={17} />
              </div>

              <div className="text-left">
                <p className="text-xs font-semibold">
                  Farm Memory
                </p>

                <p className="text-[10px] text-[#8a948a]">
                  {memories.length} memories · Hindsight
                </p>
              </div>
            </div>

            <ChevronDown
              size={17}
              className={`text-[#879187] transition ${
                showMemoryPanel
                  ? "rotate-180"
                  : ""
              }`}
            />
          </button>

          {showMemoryPanel && (
            <div className="mt-3 rounded-2xl border border-[#dfe6dd] bg-white p-4 shadow-sm">
              <div className="space-y-3">
                {sortedMemories
                  .slice(0, 4)
                  .map((memory) => (
                    <div
                      key={memory.id}
                      className="flex gap-3 rounded-xl bg-[#f7f9f6] p-3"
                    >
                      <div className="text-base">
                        {getMemoryIcon(
                          memory.text
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#879187]">
                          {getMemoryLabel(
                            memory.text
                          )}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#485449]">
                          {cleanMemoryText(
                            memory.text
                          )}
                        </p>

                        <p className="mt-1 text-[9px] text-[#9aa49a]">
                          {formatDate(
                            memory.date
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* --------------------------------------------------
            FOOTER
        -------------------------------------------------- */}
        <footer className="mt-7 flex flex-col items-center justify-between gap-3 border-t border-[#dfe5dd] px-2 py-5 text-[10px] text-[#8b958b] sm:flex-row">
          <div className="flex items-center gap-2">
            <Sprout size={12} />
            <span>
              FarmMemory · Voice-first farm intelligence
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span>Hindsight memory</span>
            <span>•</span>
            <span>Telugu voice</span>
            <span>•</span>
            <span>AI assistance</span>
          </div>
        </footer>
      </div>
    </main>
  );
}