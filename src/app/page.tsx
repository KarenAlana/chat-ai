"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TutorLanguage, TutorMode } from "@/types/tutor";

type Message = { role: "user" | "assistant"; content: string };
type Explained = {
  corrected: string;
  translation: string;
  explanation: string;
  naturalSuggestion: string;
  score: number;
};

type InformalResponse = {
  informal: string;
  alreadyCorrect: boolean;
  translation: string;
};

const LANG_OPTIONS: { value: TutorLanguage; label: string }[] = [
  { value: "en", label: "Inglês" },
  { value: "de", label: "Alemão" },
];

const MODE_OPTIONS: { value: TutorMode; label: string }[] = [
  { value: "translate", label: "Só traduzir" },
  { value: "explain", label: "Com explicações" },
  { value: "correct", label: "Apenas corrigir (inglês)" },
  { value: "informal", label: "Inglês casual (corrige + traduz)" },
];

const SUGGESTIONS = [
  "Como se diz 'obrigado' em inglês?",
  "Qual a diferença entre 'good' e 'well'?",
  "Me ajude a praticar o passado",
  "Corrija isto: 'I go to school yesterday'",
];

function parseExplained(content: string): Explained | null {
  const raw = content.replace(/```json?\s*|\s*```/g, "").trim();
  try {
    const o = JSON.parse(raw) as unknown;
    if (
      o &&
      typeof o === "object" &&
      "corrected" in o &&
      "explanation" in o &&
      "naturalSuggestion" in o &&
      "score" in o
    ) {
      return {
        corrected: String((o as Explained).corrected ?? ""),
        translation: String((o as Explained).translation ?? ""),
        explanation: String((o as Explained).explanation ?? ""),
        naturalSuggestion: String((o as Explained).naturalSuggestion ?? ""),
        score: Number((o as Explained).score) ?? 0,
      };
    }
  } catch {
    // ignore
  }
  return null;
}

function parseInformal(content: string): InformalResponse | null {
  const raw = content.replace(/```json?\s*|\s*```/g, "").trim();
  try {
    const o = JSON.parse(raw) as unknown;
    if (
      o &&
      typeof o === "object" &&
      "informal" in o &&
      "alreadyCorrect" in o &&
      "translation" in o
    ) {
      return {
        informal: String((o as InformalResponse).informal ?? ""),
        alreadyCorrect: Boolean((o as InformalResponse).alreadyCorrect),
        translation: String((o as InformalResponse).translation ?? ""),
      };
    }
  } catch {
    // ignore
  }
  return null;
}

function useSpeechRecognition() {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const start = useCallback((onResult: (text: string) => void) => {
    setError(null);
    const SpeechRecognitionAPI =
      (typeof window !== "undefined" &&
        (window.SpeechRecognition ||
          (window as unknown as { webkitSpeechRecognition?: SpeechRecognition })
            .webkitSpeechRecognition)) ||
      null;
    if (!SpeechRecognitionAPI) {
      setError("Reconhecimento de voz não suportado neste navegador.");
      return;
    }
    const rec = new SpeechRecognitionAPI() as SpeechRecognition;
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "pt-BR";
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const text = e.results[0]?.[0]?.transcript ?? "";
      onResult(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }, []);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setListening(false);
  }, []);

  return { start, stop, listening, error };
}

function useTTS() {
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const load = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback((text: string, lang: string) => {
    if (typeof window === "undefined" || !text.trim()) return;
    const langCode = lang === "de" ? "de-DE" : "en-US";
    const langPrefix = lang === "de" ? "de" : "en";
    const voices = voicesRef.current.length
      ? voicesRef.current
      : window.speechSynthesis.getVoices();
    const naturalKeywords =
      /google|natural|premium|samantha|daniel|karen|moira|luciana|cloud|online/i;
    const match = (v: SpeechSynthesisVoice) =>
      v.lang.replace(/_/g, "-").toLowerCase().startsWith(langPrefix);
    const byLang = voices.filter((v) => match(v));
    const preferred = byLang.find((v) => naturalKeywords.test(v.name));
    const voice = preferred ?? byLang[0] ?? null;

    const u = new SpeechSynthesisUtterance(text.trim());
    u.lang = langCode;
    u.rate = 0.92;
    u.pitch = 1;
    if (voice) u.voice = voice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }, []);
  return { speak };
}

const IconGraduation = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-8 h-8 md:w-10 md:h-10"
    aria-hidden
  >
    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
    <path d="M22 10v6" />
    <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
  </svg>
);

const IconGlobe = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4"
    aria-hidden
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </svg>
);

const IconChevronDown = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4"
    aria-hidden
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const IconHome = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4"
    aria-hidden
  >
    <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
    <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
);

const IconMic = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3z" />
    <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.92V21H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-3.08A7 7 0 0 0 19 11z" />
  </svg>
);

const IconSend = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
    aria-hidden
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const IconVolume = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="inline-block mr-1"
    aria-hidden
  >
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

export default function Home() {
  const [language, setLanguage] = useState<TutorLanguage>("en");
  const [mode, setMode] = useState<TutorMode>("explain");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const {
    start: startVoice,
    stop: stopVoice,
    listening,
    error: voiceError,
  } = useSpeechRecognition();
  const { speak } = useTTS();
  const bottomRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);

  const goToHome = useCallback(() => {
    setMessages([]);
    setInput("");
    contentScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!langOpen && !modeOpen) return;
    const close = () => {
      setLangOpen(false);
      setModeOpen(false);
    };
    const t = setTimeout(() => document.addEventListener("click", close), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("click", close);
    };
  }, [langOpen, modeOpen]);

  const send = useCallback(
    async (textToSend?: string) => {
      const text = (textToSend ?? input).trim();
      if (!text || loading) return;
      if (!textToSend) setInput("");
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setLoading(true);
      try {
        const res = await fetch("/api/tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language,
            mode,
            messages: [...messages, { role: "user", content: text }],
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro na resposta");
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.content ?? "" },
        ]);
      } catch (e) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Erro: ${e instanceof Error ? e.message : "Erro desconhecido"}`,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, language, mode, messages],
  );

  const onVoiceResult = useCallback((text: string) => {
    setInput((prev) => (prev ? `${prev} ${text}` : text));
  }, []);

  const langLabel =
    LANG_OPTIONS.find((o) => o.value === language)?.label ?? "Inglês";
  const modeLabel =
    MODE_OPTIONS.find((o) => o.value === mode)?.label ?? "Com explicações";
  const titleLang = language === "de" ? "Deutsch" : "English";

  return (
    <div
      className="relative z-10 h-dvh overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, rgba(148, 163, 184, 0.15), rgba(203, 213, 225, 0.12), rgba(148, 163, 184, 0.15))",
        boxShadow:
          "0 0 20px rgba(148, 163, 184, 0.1), inset 0 0 20px rgba(203, 213, 225, 0.05)",
      }}
    >
      <div className="relative h-full bg-slate-950/50 backdrop-blur-xl overflow-hidden">
        <div className="relative z-10 flex flex-col h-full">
          {/* Header - responsivo para mobile */}
          <header className="flex flex-col gap-3 p-3 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top))] border-b border-slate-500/10 bg-slate-950/30 shrink-0">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 text-white">
                  <IconGraduation />
                </span>
                <span className="text-white font-semibold text-base sm:text-lg truncate">
                  Tutor de idiomas
                </span>
              </div>
              <button
                type="button"
                onClick={goToHome}
                className="shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 rounded-xl text-sm font-medium transition-all duration-300 bg-slate-800/40 text-slate-300 border border-slate-400/20 hover:border-blue-400/60 hover:bg-slate-800/60"
                title="Voltar ao início"
              >
                <IconHome />
                <span className="hidden sm:inline">Início</span>
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setModeOpen(false);
                    setLangOpen(!langOpen);
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 bg-slate-800/40 text-slate-300 border border-slate-400/20 hover:border-blue-400/60 hover:bg-slate-800/60"
                >
                  <IconGlobe />
                  <span className="max-w-[72px] sm:max-w-none truncate">
                    {langLabel}
                  </span>
                  <IconChevronDown />
                </button>
                {langOpen && (
                  <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1 py-1 rounded-xl bg-slate-800/95 border border-slate-400/20 shadow-xl z-20 min-w-[140px] w-max max-w-[calc(100vw-1.5rem)]">
                    {LANG_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLanguage(o.value);
                          setLangOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-slate-700/50 hover:text-white"
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLangOpen(false);
                    setModeOpen(!modeOpen);
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 bg-slate-800/40 text-slate-300 border border-slate-400/20 hover:border-blue-400/60 hover:bg-slate-800/60"
                >
                  <span className="max-w-[100px] sm:max-w-[160px] truncate">
                    {modeLabel}
                  </span>
                  <IconChevronDown />
                </button>
                {modeOpen && (
                  <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1 py-1 rounded-xl bg-slate-800/95 border border-slate-400/20 shadow-xl z-20 min-w-[180px] sm:min-w-[200px] w-max max-w-[calc(100vw-1.5rem)]">
                    {MODE_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMode(o.value);
                          setModeOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-slate-700/50 hover:text-white"
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Content */}
          <div
            ref={contentScrollRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 scrollbar-transparent min-h-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at center, #5e1a3e 0%, #121b29 70%, #000000 100%)",
            }}
          >
            {messages.length === 0 ? (
              <div className="flex items-center justify-center min-h-[40vh]">
                <div className="text-center space-y-8 max-w-lg">
                  <div className="space-y-3">
                    <h1 className="text-3xl md:text-4xl font-bold text-white text-balance flex items-center justify-center gap-3">
                      <IconGraduation />
                      {titleLang} Tutor
                    </h1>
                    <p className="text-slate-300 text-sm md:text-base">
                      Seu tutor de {langLabel.toLowerCase()} pessoal com IA —
                      Aprenda conversando!
                    </p>
                  </div>
                  <div className="space-y-4 pt-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Sugestões
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setInput(s)}
                          className="group px-4 py-2 rounded-full text-sm text-slate-200 border border-slate-400/30 hover:border-blue-400/60 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:text-white"
                          style={{
                            background:
                              "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((m, i) =>
                  m.role === "user" ? (
                    <div
                      key={i}
                      className="ml-auto max-w-[85%] rounded-2xl rounded-br-md px-4 py-2 bg-slate-800/60 border border-slate-400/20 text-slate-100"
                    >
                      {m.content}
                    </div>
                  ) : (
                    <AssistantMessage
                      key={i}
                      content={m.content}
                      mode={mode}
                      lang={language}
                      onSpeak={speak}
                    />
                  ),
                )}
                {loading && (
                  <div className="rounded-2xl rounded-bl-md px-4 py-2 w-fit bg-slate-800/40 border border-slate-400/20">
                    <span className="animate-pulse text-slate-400">...</span>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {voiceError && (
            <p className="px-6 text-amber-400 text-sm">{voiceError}</p>
          )}

          {/* Footer input */}
          <div className="relative border-t border-slate-500/10 p-3 sm:p-6 md:p-8 bg-black pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="flex gap-2 sm:gap-3 items-end w-full justify-center max-w-3xl mx-auto">
              <div className="relative flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    listening ? stopVoice() : startVoice(onVoiceResult)
                  }
                  className="p-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "rgba(51, 65, 85, 0.4)",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                  }}
                  title={listening ? "Parar gravação" : "Falar"}
                >
                  <span className={listening ? "text-red-400" : "text-white"}>
                    <IconMic />
                  </span>
                </button>
              </div>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Digite em português ou no idioma alvo... (ou use o microfone)"
                className="flex-1 px-4 py-3 rounded-xl bg-slate-800/40 border border-slate-400/20 text-white placeholder-slate-400 focus:outline-none focus:border-blue-400/60 focus:shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all duration-300 backdrop-blur-sm disabled:opacity-50"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="p-3 rounded-xl bg-linear-to-br from-blue-500 to-purple-600 text-white hover:from-blue-400 hover:to-purple-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]"
                style={{ boxShadow: "0 0 20px rgba(59, 130, 246, 0.4)" }}
              >
                <IconSend />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssistantMessage({
  content,
  mode,
  lang,
  onSpeak,
}: {
  content: string;
  mode: TutorMode;
  lang: string;
  onSpeak: (text: string, lang: string) => void;
}) {
  const explained = mode === "explain" ? parseExplained(content) : null;
  const informal = mode === "informal" ? parseInformal(content) : null;
  const ttsText = explained
    ? explained.naturalSuggestion || explained.corrected
    : informal
      ? informal.informal
      : content;

  return (
    <div className="max-w-[85%] rounded-2xl rounded-bl-md px-4 py-3 bg-slate-800/40 border border-slate-400/20 text-slate-200">
      {explained ? (
        <div className="space-y-2 text-sm">
          {explained.translation && (
            <p>
              <span className="font-medium text-slate-400">Tradução: </span>
              {explained.translation}
            </p>
          )}
          <p>
            <span className="font-medium text-slate-400">Corrigido: </span>
            {explained.corrected}
          </p>
          <p>
            <span className="font-medium text-slate-400">Explicação: </span>
            {explained.explanation}
          </p>
          {explained.naturalSuggestion && (
            <p>
              <span className="font-medium text-slate-400">Mais natural: </span>
              {explained.naturalSuggestion}
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded font-medium text-white ${
                explained.score >= 7
                  ? "bg-emerald-600/60"
                  : explained.score >= 5
                    ? "bg-amber-600/60"
                    : "bg-red-600/60"
              }`}
            >
              Nota: {explained.score}/10
            </span>
            {ttsText && (
              <button
                type="button"
                onClick={() => onSpeak(ttsText, lang)}
                className="inline-flex items-center text-blue-400 hover:text-blue-300 text-xs transition-colors"
              >
                <IconVolume />
                Ouvir resposta
              </button>
            )}
          </div>
        </div>
      ) : informal ? (
        <div className="space-y-2 text-sm">
          {informal.alreadyCorrect && (
            <p className="text-emerald-400 font-medium">
              ✓ Sua frase já está correta e natural.
            </p>
          )}
          <p>
            <span className="font-medium text-slate-400">Inglês casual: </span>
            <span className="text-slate-100">{informal.informal}</span>
          </p>
          <p>
            <span className="font-medium text-slate-400">Tradução: </span>
            {informal.translation}
          </p>
          {informal.informal && (
            <button
              type="button"
              onClick={() => onSpeak(informal.informal, "en")}
              className="inline-flex items-center text-blue-400 hover:text-blue-300 text-xs transition-colors pt-1"
            >
              <IconVolume />
              Ouvir em inglês
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm whitespace-pre-wrap text-slate-100">
            {content}
          </p>
          {content && (
            <button
              type="button"
              onClick={() => onSpeak(content, lang)}
              className="shrink-0 inline-flex items-center text-blue-400 hover:text-blue-300 text-xs"
            >
              <IconVolume />
              Ouvir
            </button>
          )}
        </div>
      )}
    </div>
  );
}
