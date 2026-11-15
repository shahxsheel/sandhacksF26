"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, Trash2, Upload, AlertCircle, Check } from "lucide-react";

interface AudioRecorderProps {
  onAudioReady: (audioBlob: Blob | null, fileName?: string) => void;
  maxSeconds?: number;
}

export function AudioRecorder({ onAudioReady, maxSeconds = 45 }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [micSupported, setMicSupported] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)) {
      setMicSupported(false);
    }
  }, []);

  const startRecording = async () => {
    setErrorMsg(null);
    audioChunksRef.current = [];
    setRecordingSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        onAudioReady(audioBlob, "recording.webm");
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200); // 200ms slice
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev + 1 >= maxSeconds) {
            stopRecording();
            return maxSeconds;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: unknown) {
      console.warn("Microphone access denied or unavailable:", err);
      setErrorMsg("Microphone permission was denied. You may upload an audio file below.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  };

  const clearAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setIsPlaying(false);
    setRecordingSeconds(0);
    onAudioReady(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      setErrorMsg("Audio file exceeds the 4 MB limit.");
      return;
    }

    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setErrorMsg(null);
    onAudioReady(file, file.name);
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div style={{ background: "var(--cream-muted)", padding: "16px", borderRadius: "2px", border: "1px solid var(--cream-hairline)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--spruce-main)", display: "flex", alignItems: "center", gap: "6px" }}>
          <Mic size={15} /> Short Voice Note (Optional)
        </span>
        <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
          Max {maxSeconds} seconds
        </span>
      </div>

      {errorMsg && (
        <div style={{ fontSize: "0.8125rem", color: "var(--danger-text)", background: "var(--danger-bg)", padding: "6px 10px", borderRadius: "2px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
          <AlertCircle size={14} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Recording in progress */}
      {isRecording && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#ffffff", padding: "12px 16px", borderRadius: "2px", border: "1px solid var(--danger-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="pulse-dot-red" />
            <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--danger-text)" }}>
              Recording: 0:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds} / 0:{maxSeconds}
            </span>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="btn btn-sm btn-danger-outline"
            aria-label="Stop recording audio"
          >
            <Square size={13} fill="currentColor" />
            <span>Stop Recording</span>
          </button>
        </div>
      )}

      {/* Recorded Audio Preview */}
      {!isRecording && audioUrl && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#ffffff", padding: "10px 14px", borderRadius: "2px", border: "1px solid var(--cream-hairline)", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              onClick={togglePlayback}
              className="btn btn-sm btn-dark"
              style={{ padding: "4px 10px" }}
              aria-label={isPlaying ? "Pause audio preview" : "Play audio preview"}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            </button>
            <span style={{ fontSize: "0.8125rem", color: "var(--spruce-main)" }}>
              Audio clip ready ({recordingSeconds ? `${recordingSeconds}s` : "File attached"})
            </span>
          </div>

          <audio
            ref={audioPlayerRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            style={{ display: "none" }}
          />

          <button
            type="button"
            onClick={clearAudio}
            className="btn btn-sm btn-outline-dark"
            style={{ padding: "4px 10px", fontSize: "0.75rem" }}
            aria-label="Delete audio recording"
          >
            <Trash2 size={13} />
            <span>Remove</span>
          </button>
        </div>
      )}

      {/* Initial state: Record or Upload options */}
      {!isRecording && !audioUrl && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {micSupported && (
              <button
                type="button"
                onClick={startRecording}
                className="btn btn-sm btn-outline-dark"
                aria-label="Record microphone voice memo"
              >
                <Mic size={14} />
                <span>Record with Microphone</span>
              </button>
            )}

            <label
              className="btn btn-sm btn-outline-dark"
              style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Upload size={14} />
              <span>Upload Audio File</span>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
            </label>
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
            Bystander audio is transcribed automatically to add context to the coordinator brief.
          </span>
        </div>
      )}
    </div>
  );
}
