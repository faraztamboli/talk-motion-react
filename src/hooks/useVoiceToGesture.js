import { useState, useRef, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import JS2Py from "../remotepyjs";
import { addConversationEntry } from "../app/features/conversationSlice";
import useLocalStorage from "./useLocalStorage";
import useWhisperVoice from "./useWhisperVoice";

// Lazy initialization of SpeechRecognition to avoid module load errors
let SpeechRecognition = null;

function getSpeechRecognition() {
  if (typeof window === "undefined") {
    return null;
  }
  if (!SpeechRecognition) {
    SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
  }
  return SpeechRecognition;
}

function createMic() {
  const SpeechRecognitionClass = getSpeechRecognition();
  if (!SpeechRecognitionClass) {
    console.warn("SpeechRecognition is not available in this browser");
    return null;
  }
  try {
    const mic = new SpeechRecognitionClass();
    mic.continuous = true;
    mic.interimResults = true;
    mic.lang = "en-US";
    return mic;
  } catch (error) {
    console.error("Failed to initialize SpeechRecognition:", error);
    return null;
  }
}

/**
 * Voice -> sign-video translation.
 *
 * Speech is transcribed in the browser; final transcripts are sent to
 * TalkMotionServer.translateWordsToGestures, which resolves phrases to video
 * URLs (including fingerspelling fallback) and returns an ordered playlist.
 * Videos play sequentially from an explicit FIFO queue driven by the video
 * element's `ended` event.
 */
function useVoiceToGesture({ playbackRate = 1.5, onGloss = null } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const videoRef = useRef(null);
  const micRef = useRef(null);

  // Play queue and per-model video dictionary live in refs: they are consumed
  // by event handlers (video.onended, mic.onresult) where stale-closure state
  // would drop or replay words.
  const queueRef = useRef([]); // words/phrases waiting to play, in order
  const dictionaryRef = useRef({}); // word -> { remote_url, ... } for current model
  const isPlayingRef = useRef(false);
  const playbackRateRef = useRef(playbackRate);
  playbackRateRef.current = playbackRate;

  const { modelId } = useSelector((state) => state.model);
  const modelIdRef = useRef(modelId);
  const dispatch = useDispatch();
  const [token] = useLocalStorage("token");
  const tokenRef = useRef(token);
  tokenRef.current = token;
  // When set, gloss sequences go to this callback (e.g. the signing avatar)
  // instead of the sign-video play queue.
  const onGlossRef = useRef(onGloss);
  onGlossRef.current = onGloss;

  // Reset cached dictionary and pending queue when the model changes.
  useEffect(() => {
    if (modelIdRef.current !== modelId) {
      modelIdRef.current = modelId;
      dictionaryRef.current = {};
      queueRef.current = [];
      isPlayingRef.current = false;
    }
  }, [modelId]);

  const playNext = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      isPlayingRef.current = false;
      return;
    }
    // Skip queue entries with no video (unresolvable words/letters).
    let word;
    while (queueRef.current.length > 0) {
      const candidate = queueRef.current.shift();
      if (candidate && dictionaryRef.current[candidate]) {
        word = candidate;
        break;
      }
    }
    if (!word) {
      isPlayingRef.current = false;
      return;
    }
    isPlayingRef.current = true;
    // (Re)assign here rather than in an effect: the video element may not be
    // mounted yet when the hook first runs (fullscreen remount, lazy render).
    video.onended = () => playNext();
    video.onerror = () => playNext(); // a broken URL must not stall the queue
    video.classList.remove("bg-black");
    video.src = dictionaryRef.current[word].remote_url;
    video.playbackRate = playbackRateRef.current;
    video.load();
    const promise = video.play();
    if (promise !== undefined) {
      promise.catch(() => {
        // Autoplay blocked: retry muted so the sequence keeps flowing.
        video.muted = true;
        video.play().catch(() => {
          isPlayingRef.current = false;
        });
      });
    }
  }, []);

  // One path for final transcripts regardless of which engine produced them.
  const handleFinalTranscript = useCallback(
    (finalTranscript) => {
      setTranscript(finalTranscript);
      if (!finalTranscript) return;
      dispatch(addConversationEntry({ source: "voice", text: finalTranscript }));
      // Translate English to ASL gloss order first (LLM on the server, with
      // server- and client-side fallbacks to a plain word split), so playback
      // signs ASL rather than word-for-word English.
      try {
        JS2Py.PythonFunctions.TalkMotionServer.englishToGloss(
          tokenRef.current,
          finalTranscript,
          function (res) {
            const gloss =
              res && Array.isArray(res.gloss) && res.gloss.length > 0
                ? res.gloss
                : finalTranscript.split(" ");
            if (onGlossRef.current) {
              onGlossRef.current(gloss);
            } else {
              translateAndEnqueueRef.current(gloss);
            }
          }
        );
      } catch (err) {
        console.error("englishToGloss failed, using raw words:", err);
        const gloss = finalTranscript.split(" ");
        if (onGlossRef.current) {
          onGlossRef.current(gloss);
        } else {
          translateAndEnqueueRef.current(gloss);
        }
      }
    },
    [dispatch]
  );

  // Whisper engine (server-side transcription): accurate and cross-browser.
  const whisper = useWhisperVoice({ onTranscript: handleFinalTranscript });
  // 'whisper' | 'webspeech' — decided once per session from server capability
  // + browser support; Web Speech is the fallback.
  const engineRef = useRef(null);

  const translateAndEnqueueRef = useRef(() => {});
  const translateAndEnqueue = useCallback(
    (words) => {
      const micLang = micRef.current ? micRef.current.lang : "en-US";
      JS2Py.PythonFunctions.TalkMotionServer.translateWordsToGestures(
        modelIdRef.current,
        words,
        micLang,
        function (result) {
          if (!result) return;
          const wordDictionary = result[0] || {};
          const playlist = result[1] || [];
          Object.keys(wordDictionary).forEach((key) => {
            dictionaryRef.current[key] = wordDictionary[key];
          });
          queueRef.current.push(...playlist);
          if (!isPlayingRef.current) {
            playNext();
          }
        }
      );
    },
    [playNext]
  );
  translateAndEnqueueRef.current = translateAndEnqueue;

  // Create the Web Speech mic once (fallback engine) and wire its handlers.
  useEffect(() => {
    micRef.current = createMic();
    const mic = micRef.current;
    if (!mic) return undefined;

    mic.onstart = () => setIsListening(true);
    mic.onend = () => setIsListening(false);
    mic.onerror = (event) => console.error("SpeechRecognition error:", event.error);
    mic.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          handleFinalTranscript(text.trimStart().toLowerCase());
        } else {
          setTranscript(text);
        }
      }
    };

    return () => {
      try {
        mic.stop();
      } catch (e) {
        // Ignore errors on cleanup
      }
    };
  }, [handleFinalTranscript]);

  // Pick the engine once: Whisper needs the server to have an API key and
  // the browser to have MediaRecorder; otherwise Web Speech (Chrome/Edge).
  async function resolveEngine() {
    if (engineRef.current) return engineRef.current;
    const mediaOk =
      typeof MediaRecorder !== "undefined" &&
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia;
    const serverWhisper = await new Promise((resolve) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getSpeechCapabilities(
          tokenRef.current,
          function (res) {
            resolve(Boolean(res && res.whisper));
          }
        );
      } catch (e) {
        resolve(false);
      }
    });
    engineRef.current = serverWhisper && mediaOk ? "whisper" : "webspeech";
    console.log(`Speech engine: ${engineRef.current}`);
    return engineRef.current;
  }

  async function startListening() {
    const engine = await resolveEngine();
    if (engine === "whisper") {
      setIsListening(true);
      try {
        await whisper.start();
        return;
      } catch (error) {
        // mic denied or recorder failure: try the fallback engine
        console.warn("Whisper capture failed, falling back to Web Speech:", error);
        engineRef.current = "webspeech";
      }
    }
    if (!micRef.current) {
      console.error("No speech engine available in this browser");
      setIsListening(false);
      return;
    }
    setIsListening(true);
    try {
      micRef.current.start();
    } catch (error) {
      console.error("Failed to start listening:", error);
      setIsListening(false);
    }
  }

  function stopListening() {
    setIsListening(false);
    whisper.stop();
    if (micRef.current) {
      try {
        micRef.current.stop();
      } catch (error) {
        console.error("Failed to stop listening:", error);
      }
    }
  }

  return {
    startListening,
    stopListening,
    isListening: isListening || whisper.isListening,
    isTranscribing: whisper.isTranscribing,
    videoRef,
    transcript,
  };
}

export default useVoiceToGesture;
