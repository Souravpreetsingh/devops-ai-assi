"use client"

import { useState, useRef, useCallback, useEffect } from "react"

type VoiceState = "idle" | "listening" | "processing" | "speaking"
type WakeWordMode = "off" | "always"

interface UseVoiceAssistantOptions {
  wakeWordMode?: WakeWordMode
  onTranscript?: (text: string) => void
  autoSubmit?: boolean
}

interface UseVoiceAssistantReturn {
  state: VoiceState
  isListening: boolean
  isSpeaking: boolean
  interimText: string
  finalText: string
  error: string | null
  isSupported: boolean
  wakeWordMode: WakeWordMode
  startListening: () => void
  stopListening: () => void
  speak: (text: string) => Promise<void>
  cancelSpeech: () => void
  toggleListening: () => void
  setWakeWordMode: (mode: WakeWordMode) => void
}

const WAKE_WORDS = ["hey devi", "hey devy", "he devi", "ey devi", "okay devi", "ok devi"]
const SILENCE_TIMEOUT = 1500

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim()
}

export function useVoiceAssistant(options: UseVoiceAssistantOptions = {}): UseVoiceAssistantReturn {
  const { onTranscript, autoSubmit = false, wakeWordMode: initialWakeWord = "off" } = options

  const [state, setState] = useState<VoiceState>("idle")
  const [interimText, setInterimText] = useState("")
  const [finalText, setFinalText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [wakeWordMode, setWakeWordMode] = useState<WakeWordMode>(initialWakeWord)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isSpeakingRef = useRef(false)

  const isSupported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)

  const getRecognition = useCallback((): SpeechRecognition | null => {
    if (!isSupported) return null
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) return null

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = wakeWordMode === "always"
    recognition.interimResults = true
    recognition.lang = "en-US"
    return recognition
  }, [isSupported, wakeWordMode])

  const handleResult = useCallback(
    (event: SpeechRecognitionEvent) => {
      let interim = ""
      let final = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result[0].transcript

        if (result.isFinal) {
          final += text
        } else {
          interim += text
        }
      }

      if (interim) setInterimText(interim)
      if (final) {
        setFinalText((prev) => prev + final)
        const normalized = normalize(final)

        if (wakeWordMode === "always") {
          const hasWakeWord = WAKE_WORDS.some((w) => normalized.includes(w))
          if (hasWakeWord) {
            const afterWake = WAKE_WORDS.reduce((acc, w) => acc.replace(w, ""), normalized).trim()
            if (afterWake && onTranscript) {
              onTranscript(afterWake)
            }
          }
        } else if (onTranscript) {
          onTranscript(final)
          if (autoSubmit) stopListening()
        }

        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = setTimeout(() => {
          if (wakeWordMode !== "always") stopListening()
        }, SILENCE_TIMEOUT)
      }
    },
    [wakeWordMode, onTranscript, autoSubmit],
  )

  const handleError = useCallback((event: SpeechRecognitionErrorEvent) => {
    setError(`Speech recognition error: ${event.error}`)
    setState("idle")
  }, [])

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError("Speech recognition is not supported in this browser")
      return
    }

    const recognition = getRecognition()
    if (!recognition) {
      setError("Failed to create speech recognition instance")
      return
    }

    recognition.onresult = handleResult
    recognition.onerror = handleError
    recognition.onend = () => {
      if (state !== "speaking") {
        setState("idle")
      }
    }

    try {
      recognition.start()
      recognitionRef.current = recognition
      setState("listening")
      setError(null)
      setInterimText("")
      setFinalText("")
    } catch (err) {
      setError(`Failed to start listening: ${(err as Error).message}`)
    }
  }, [isSupported, getRecognition, handleResult, handleError, state])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch { }
      recognitionRef.current = null
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    setState("idle")
    setInterimText("")
  }, [])

  const toggleListening = useCallback(() => {
    if (state === "listening") {
      stopListening()
    } else {
      startListening()
    }
  }, [state, startListening, stopListening])

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        resolve()
        return
      }

      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0

      const voices = window.speechSynthesis.getVoices()
      const preferredVoice = voices.find(
        (v) => v.lang.startsWith("en") && v.name.includes("Female") || v.name.includes("Samantha") || v.name.includes("Google UK"),
      )
      if (preferredVoice) utterance.voice = preferredVoice

      isSpeakingRef.current = true
      setState("speaking")

      utterance.onend = () => {
        isSpeakingRef.current = false
        setState("idle")
        resolve()
      }

      utterance.onerror = () => {
        isSpeakingRef.current = false
        setState("idle")
        resolve()
      }

      window.speechSynthesis.speak(utterance)
    })
  }, [])

  const cancelSpeech = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    isSpeakingRef.current = false
    setState("idle")
  }, [])

  useEffect(() => {
    return () => {
      cancelSpeech()
      stopListening()
    }
  }, [cancelSpeech, stopListening])

  return {
    state,
    isListening: state === "listening",
    isSpeaking: state === "speaking",
    interimText,
    finalText,
    error,
    isSupported,
    wakeWordMode,
    startListening,
    stopListening,
    speak,
    cancelSpeech,
    toggleListening,
    setWakeWordMode,
  }
}
