"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import {
  generateRandomPoint,
  getSvRadius,
  DIFFICULTY_META,
  type Difficulty,
  type Location,
} from "@/lib/locations";

// ════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════

const ROUNDS_PER_GAME = 5;
const MAX_SCORE = 5000;
const TOTAL_MAX = ROUNDS_PER_GAME * MAX_SCORE;
const MAX_SV_ATTEMPTS = 15;

const TILE_LIGHT =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

// ════════════════════════════════════════════
// Types
// ════════════════════════════════════════════

type Phase = "start" | "playing" | "result" | "summary";

interface RoundResult {
  location: Location;
  guess: Location;
  distance: number;
  score: number;
}

// ════════════════════════════════════════════
// Utility functions
// ════════════════════════════════════════════

function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcScore(km: number): number {
  if (km < 0.15) return MAX_SCORE;
  return Math.max(0, Math.round(MAX_SCORE * Math.exp(-km / 1492.7)));
}

function fmtDist(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 100) return `${km.toFixed(1)} km`;
  return `${Math.round(km).toLocaleString()} km`;
}

function scoreColor(s: number): string {
  if (s >= 4500) return "#fbbf24";
  if (s >= 3000) return "#34d399";
  if (s >= 1500) return "#fb923c";
  return "#f87171";
}

function markerIcon(color: string, label?: string): L.DivIcon {
  return L.divIcon({
    html: `<div style="
      background:${color};width:24px;height:24px;border-radius:50%;
      border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.5);
      display:flex;align-items:center;justify-content:center;
      color:white;font-size:11px;font-weight:700;
    ">${label ?? ""}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    className: "",
  });
}

// ════════════════════════════════════════════
// Component
// ════════════════════════════════════════════

export default function Game() {
  // ── State ────────────────────────────────
  const [phase, setPhase] = useState<Phase>("start");
  const [apiKey, setApiKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapsError, setMapsError] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>(2);

  const [actualLocs, setActualLocs] = useState<Location[]>([]);
  const [round, setRound] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [guessPos, setGuessPos] = useState<L.LatLng | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [svLoading, setSvLoading] = useState(false);
  const [svAttempts, setSvAttempts] = useState(0);
  const [animatedScore, setAnimatedScore] = useState(0);

  // ── Refs ─────────────────────────────────
  const svDivRef = useRef<HTMLDivElement>(null);
  const panoRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const guessDivRef = useRef<HTMLDivElement>(null);
  const guessMap = useRef<L.Map | null>(null);
  const guessMkr = useRef<L.Marker | null>(null);
  const resultDivRef = useRef<HTMLDivElement>(null);
  const resultMap = useRef<L.Map | null>(null);
  const summaryDivRef = useRef<HTMLDivElement>(null);
  const summaryMap = useRef<L.Map | null>(null);

  // ── Derived ──────────────────────────────
  const totalScore = results.reduce((s, r) => s + r.score, 0);

  // ── Load API key from env / localStorage ─
  useEffect(() => {
    const env = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const stored = localStorage.getItem("vg_key");
    if (env && env !== "your_api_key_here") setApiKey(env);
    else if (stored) setApiKey(stored);
  }, []);

  // ── Load Google Maps script ──────────────
  useEffect(() => {
    if (!apiKey) return;
    if (window.google?.maps) {
      setMapsLoaded(true);
      return;
    }
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    s.async = true;
    s.defer = true;
    s.onload = () => {
      setMapsLoaded(true);
      setMapsError(false);
    };
    s.onerror = () => {
      setMapsError(true);
      setApiKey("");
      localStorage.removeItem("vg_key");
    };
    document.head.appendChild(s);
  }, [apiKey]);

  // ── Start game ───────────────────────────
  const startGame = useCallback(() => {
    setActualLocs([]);
    setRound(0);
    setResults([]);
    setGuessPos(null);
    setMapExpanded(false);
    setPhase("playing");
  }, []);

  // ── Find a Street View panorama dynamically ──
  useEffect(() => {
    if (phase !== "playing" || !mapsLoaded || !svDivRef.current) return;

    setSvLoading(true);
    setSvAttempts(0);
    let cancelled = false;

    const svc = new google.maps.StreetViewService();
    const radius = getSvRadius(difficulty);

    const tryFindPanorama = (attempt: number) => {
      if (cancelled) return;
      if (attempt >= MAX_SV_ATTEMPTS) {
        // Exhausted retries — try with max radius as fallback
        const fallback = generateRandomPoint(1); // easy = likely to hit
        svc.getPanorama(
          {
            location: { lat: fallback.lat, lng: fallback.lng },
            radius: 100_000,
            preference: google.maps.StreetViewPreference.NEAREST,
            source: google.maps.StreetViewSource.OUTDOOR,
          },
          (data, status) => {
            if (cancelled) return;
            if (status === "OK" && data?.location?.latLng) {
              placePanorama(
                data.location.latLng.lat(),
                data.location.latLng.lng()
              );
            }
            setSvLoading(false);
          }
        );
        return;
      }

      setSvAttempts(attempt + 1);
      const candidate = generateRandomPoint(difficulty);

      svc.getPanorama(
        {
          location: { lat: candidate.lat, lng: candidate.lng },
          radius,
          preference: google.maps.StreetViewPreference.NEAREST,
          source: google.maps.StreetViewSource.OUTDOOR,
        },
        (data, status) => {
          if (cancelled) return;
          if (status === "OK" && data?.location?.latLng) {
            placePanorama(
              data.location.latLng.lat(),
              data.location.latLng.lng()
            );
            setSvLoading(false);
          } else {
            // No coverage at this point — try another
            tryFindPanorama(attempt + 1);
          }
        }
      );
    };

    const placePanorama = (lat: number, lng: number) => {
      setActualLocs((prev) => {
        const u = [...prev];
        u[round] = { lat, lng };
        return u;
      });

      if (!panoRef.current) {
        panoRef.current = new google.maps.StreetViewPanorama(
          svDivRef.current!,
          {
            position: { lat, lng },
            pov: { heading: Math.random() * 360, pitch: 0 },
            addressControl: false,
            showRoadLabels: false,
            fullscreenControl: false,
            motionTracking: false,
            motionTrackingControl: false,
            enableCloseButton: false,
            linksControl: true,
            panControl: false,
            zoomControl: true,
            visible: true,
          }
        );
      } else {
        panoRef.current.setPosition({ lat, lng });
        panoRef.current.setPov({
          heading: Math.random() * 360,
          pitch: 0,
        });
        panoRef.current.setVisible(true);
      }
    };

    tryFindPanorama(0);

    return () => {
      cancelled = true;
    };
  }, [phase, mapsLoaded, round, difficulty]);

  // ── Init / destroy guess map ─────────────
  useEffect(() => {
    if (phase !== "playing") return;

    const t = setTimeout(() => {
      if (!guessDivRef.current || guessMap.current) return;

      const map = L.map(guessDivRef.current, {
        center: [20, 0],
        zoom: 2,
        zoomControl: true,
        attributionControl: false,
        worldCopyJump: true,
      });
      L.tileLayer(TILE_LIGHT).addTo(map);

      map.on("click", (e: L.LeafletMouseEvent) => {
        const ll = e.latlng;
        setGuessPos(L.latLng(ll.lat, ll.lng));
        if (guessMkr.current) {
          guessMkr.current.setLatLng(ll);
        } else {
          guessMkr.current = L.marker(ll, {
            icon: markerIcon("#ef4444"),
          }).addTo(map);
        }
      });

      guessMap.current = map;
      setTimeout(() => map.invalidateSize(), 200);
    }, 150);

    return () => {
      clearTimeout(t);
      guessMap.current?.remove();
      guessMap.current = null;
      guessMkr.current = null;
    };
  }, [phase]);

  // ── Reset guess marker between rounds ────
  useEffect(() => {
    if (phase !== "playing") return;
    setGuessPos(null);
    if (guessMkr.current && guessMap.current) {
      guessMap.current.removeLayer(guessMkr.current);
      guessMkr.current = null;
    }
  }, [round, phase]);

  // ── Invalidate guess map on expand ───────
  useEffect(() => {
    const t = setTimeout(() => guessMap.current?.invalidateSize(), 350);
    return () => clearTimeout(t);
  }, [mapExpanded]);

  // ── Submit guess ─────────────────────────
  const submitGuess = useCallback(() => {
    if (!guessPos || !actualLocs[round]) return;
    const actual = actualLocs[round];
    const dist = haversine(actual.lat, actual.lng, guessPos.lat, guessPos.lng);
    const sc = calcScore(dist);
    const rr: RoundResult = {
      location: actual,
      guess: { lat: guessPos.lat, lng: guessPos.lng },
      distance: dist,
      score: sc,
    };
    setResults((prev) => [...prev, rr]);
    setPhase("result");

    setAnimatedScore(0);
    let current = 0;
    const step = Math.max(1, Math.floor(sc / 40));
    const iv = setInterval(() => {
      current = Math.min(current + step, sc);
      setAnimatedScore(current);
      if (current >= sc) clearInterval(iv);
    }, 20);
  }, [guessPos, actualLocs, round]);

  // ── Init result map ──────────────────────
  useEffect(() => {
    if (phase !== "result") return;
    const latest = results[results.length - 1];
    if (!latest) return;

    const t = setTimeout(() => {
      if (!resultDivRef.current) return;
      resultMap.current?.remove();

      const map = L.map(resultDivRef.current, {
        zoomControl: true,
        attributionControl: false,
        worldCopyJump: true,
      });
      L.tileLayer(TILE_LIGHT).addTo(map);

      const aLL = L.latLng(latest.location.lat, latest.location.lng);
      const gLL = L.latLng(latest.guess.lat, latest.guess.lng);

      L.marker(aLL, { icon: markerIcon("#22c55e") })
        .addTo(map)
        .bindPopup("Actual location")
        .openPopup();
      L.marker(gLL, { icon: markerIcon("#ef4444") })
        .addTo(map)
        .bindPopup("Your guess");

      L.polyline([aLL, gLL], {
        color: "#fbbf24",
        weight: 3,
        dashArray: "8, 12",
        opacity: 0.8,
      }).addTo(map);

      map.fitBounds(L.latLngBounds([aLL, gLL]), {
        padding: [60, 60],
        maxZoom: 12,
      });

      resultMap.current = map;
    }, 150);

    return () => {
      clearTimeout(t);
      resultMap.current?.remove();
      resultMap.current = null;
    };
  }, [phase, results]);

  // ── Next round / summary ─────────────────
  const nextRound = useCallback(() => {
    if (round + 1 >= ROUNDS_PER_GAME) {
      setPhase("summary");
    } else {
      setRound((r) => r + 1);
      setGuessPos(null);
      setMapExpanded(false);
      setPhase("playing");
    }
  }, [round]);

  // ── Init summary map ─────────────────────
  useEffect(() => {
    if (phase !== "summary") return;

    const t = setTimeout(() => {
      if (!summaryDivRef.current) return;
      summaryMap.current?.remove();

      const map = L.map(summaryDivRef.current, {
        zoomControl: true,
        attributionControl: false,
        worldCopyJump: true,
      });
      L.tileLayer(TILE_LIGHT).addTo(map);

      const allPoints: L.LatLng[] = [];

      results.forEach((r, i) => {
        const aLL = L.latLng(r.location.lat, r.location.lng);
        const gLL = L.latLng(r.guess.lat, r.guess.lng);
        allPoints.push(aLL, gLL);

        L.marker(aLL, { icon: markerIcon("#22c55e", String(i + 1)) }).addTo(
          map
        );
        L.marker(gLL, { icon: markerIcon("#ef4444", String(i + 1)) }).addTo(
          map
        );
        L.polyline([aLL, gLL], {
          color: "#fbbf24",
          weight: 2,
          dashArray: "6, 10",
          opacity: 0.6,
        }).addTo(map);
      });

      if (allPoints.length > 0) {
        map.fitBounds(L.latLngBounds(allPoints), {
          padding: [40, 40],
          maxZoom: 8,
        });
      }

      summaryMap.current = map;
    }, 150);

    return () => {
      clearTimeout(t);
      summaryMap.current?.remove();
      summaryMap.current = null;
    };
  }, [phase, results]);

  // ── Play again ───────────────────────────
  const playAgain = useCallback(() => {
    panoRef.current = null;
    setPhase("start");
  }, []);

  // ── Save API key ─────────────────────────
  const saveKey = useCallback(() => {
    const k = keyInput.trim();
    if (k) {
      localStorage.setItem("vg_key", k);
      setApiKey(k);
      setMapsError(false);
    }
  }, [keyInput]);

  // ════════════════════════════════════════════
  // Render
  // ════════════════════════════════════════════

  const canStart = apiKey && mapsLoaded;

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-slate-900">
      {/* ── Street View (persists behind overlays) ── */}
      <div
        ref={svDivRef}
        className="absolute inset-0"
        style={{
          display: phase === "playing" ? "block" : "none",
          zIndex: 1,
          isolation: "isolate",
        }}
      />

      {/* ── Loading overlay for Street View ── */}
      {phase === "playing" && svLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-slate-900/90"
          style={{ zIndex: 9999 }}
        >
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-300 text-lg mb-1">
              Exploring the globe...
            </p>
            {svAttempts > 3 && (
              <p className="text-slate-500 text-sm">
                Searching for coverage... ({svAttempts}/{MAX_SV_ATTEMPTS})
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Start Screen ── */}
      {phase === "start" && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
          <div className="text-center max-w-lg mx-auto px-6 animate-fade-in">
            <h1 className="text-6xl font-black mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
              VibeGuessr
            </h1>
            <p className="text-slate-400 text-lg mb-8">
              Explore the world. Guess your location.
            </p>

            {/* API key input */}
            {!apiKey && (
              <div className="mb-8 text-left">
                <label className="block text-sm text-slate-400 mb-2">
                  Google Maps API Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveKey()}
                    placeholder="Paste your API key..."
                    className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                  />
                  <button
                    onClick={saveKey}
                    className="px-5 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-semibold transition-colors"
                  >
                    Save
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Needs Maps JavaScript API enabled.{" "}
                  <a
                    href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 underline"
                  >
                    Get a key
                  </a>
                </p>
                {mapsError && (
                  <p className="text-red-400 text-sm mt-2">
                    Failed to load Google Maps. Check your API key.
                  </p>
                )}
              </div>
            )}

            {apiKey && !mapsLoaded && (
              <div className="mb-8 flex items-center justify-center gap-3 text-slate-400">
                <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                Loading Google Maps...
              </div>
            )}

            {/* Difficulty selector */}
            <div className="mb-8">
              <p className="text-sm text-slate-400 mb-3">Difficulty</p>
              <div className="flex gap-2 justify-center">
                {([1, 2, 3, 4] as Difficulty[]).map((d) => {
                  const meta = DIFFICULTY_META[d];
                  const active = difficulty === d;
                  return (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className="flex-1 py-3 px-2 rounded-xl text-center transition-all"
                      style={{
                        background: active
                          ? "linear-gradient(135deg, #7c3aed, #db2777)"
                          : "#1e293b",
                        border: active
                          ? "2px solid #a855f7"
                          : "2px solid #334155",
                        transform: active ? "scale(1.05)" : "scale(1)",
                      }}
                    >
                      <div
                        className="font-bold text-sm"
                        style={{
                          color: active ? "white" : "#94a3b8",
                        }}
                      >
                        {meta.label}
                      </div>
                      <div
                        className="text-xs mt-0.5"
                        style={{
                          color: active ? "#e2e8f0" : "#64748b",
                        }}
                      >
                        {meta.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Game info */}
            <div className="flex justify-center gap-6 mb-8 text-sm text-slate-500">
              <span>{ROUNDS_PER_GAME} rounds</span>
              <span>World map</span>
              <span>{TOTAL_MAX.toLocaleString()} max pts</span>
            </div>

            <button
              onClick={startGame}
              disabled={!canStart}
              className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 rounded-xl text-lg font-bold transition-all transform hover:scale-105 active:scale-95 disabled:hover:scale-100 shadow-lg shadow-purple-900/50"
            >
              Start Game
            </button>

            {apiKey && (
              <button
                onClick={() => {
                  localStorage.removeItem("vg_key");
                  setApiKey("");
                  setMapsLoaded(false);
                }}
                className="block mx-auto mt-4 text-xs text-slate-600 hover:text-slate-400 transition-colors"
              >
                Change API key
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── HUD (during playing) ── */}
      {phase === "playing" && !svLoading && (
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{ zIndex: 9999 }}
        >
          <div className="flex justify-between items-center px-5 py-3">
            <div className="pointer-events-auto bg-slate-900/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-slate-700/50">
              <span className="text-sm text-slate-400">Round </span>
              <span className="text-lg font-bold text-white">
                {round + 1}
              </span>
              <span className="text-sm text-slate-400">
                {" "}
                / {ROUNDS_PER_GAME}
              </span>
            </div>
            <div className="pointer-events-auto bg-slate-900/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-slate-700/50 flex items-center gap-3">
              <span className="text-xs text-slate-500 border-r border-slate-600 pr-3">
                {DIFFICULTY_META[difficulty].label}
              </span>
              <div>
                <span className="text-sm text-slate-400">Score </span>
                <span className="text-lg font-bold text-amber-400">
                  {totalScore.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Guess Map (during playing) ── */}
      {phase === "playing" && !svLoading && (
        <div
          className="guess-map-wrapper absolute"
          style={{
            zIndex: 9999,
            bottom: "24px",
            right: "24px",
            width: mapExpanded ? "min(560px, 80vw)" : "min(320px, 45vw)",
            height: mapExpanded ? "min(420px, 55vh)" : "min(220px, 30vh)",
            opacity: mapExpanded ? 1 : 0.85,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          onMouseEnter={() => setMapExpanded(true)}
          onMouseLeave={() => {
            if (!guessPos) setMapExpanded(false);
          }}
        >
          <div className="relative w-full h-full rounded-xl overflow-hidden border-2 border-slate-600/50 shadow-2xl shadow-black/50">
            <div
              ref={guessDivRef}
              className="w-full h-full"
              style={{ cursor: "crosshair" }}
            />
            {!mapExpanded && !guessPos && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="bg-slate-900/70 text-slate-300 text-xs px-3 py-1.5 rounded-full">
                  Hover to expand, click to guess
                </span>
              </div>
            )}
          </div>

          <button
            onClick={submitGuess}
            disabled={!guessPos}
            className="w-full mt-2 py-3 rounded-xl font-bold text-base transition-all transform active:scale-95 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: guessPos
                ? "linear-gradient(to right, #7c3aed, #db2777)"
                : "#334155",
              color: guessPos ? "white" : "#94a3b8",
            }}
          >
            {guessPos ? "Guess!" : "Place a pin on the map"}
          </button>
        </div>
      )}

      {/* ── Result Screen ── */}
      {phase === "result" && results.length > 0 && (
        <div className="absolute inset-0 z-30 bg-slate-900 flex flex-col">
          <div className="flex-1 relative">
            <div ref={resultDivRef} className="w-full h-full" />
          </div>

          <div className="bg-slate-800 border-t border-slate-700 px-6 py-5 animate-slide-up">
            <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 text-center sm:text-left">
                <p className="text-slate-400 text-sm mb-1">Distance</p>
                <p className="text-2xl font-bold text-white">
                  {fmtDist(results[results.length - 1].distance)}
                </p>
              </div>

              <div className="flex-[2] w-full">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Score</span>
                  <span
                    className="font-bold text-lg"
                    style={{
                      color: scoreColor(results[results.length - 1].score),
                    }}
                  >
                    {animatedScore.toLocaleString()} /{" "}
                    {MAX_SCORE.toLocaleString()}
                  </span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${(results[results.length - 1].score / MAX_SCORE) * 100}%`,
                      background: `linear-gradient(to right, ${scoreColor(results[results.length - 1].score)}, ${scoreColor(results[results.length - 1].score)}dd)`,
                    }}
                  />
                </div>
              </div>

              <div className="flex-1 flex justify-center sm:justify-end">
                <button
                  onClick={nextRound}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                >
                  {round + 1 >= ROUNDS_PER_GAME
                    ? "See Results"
                    : "Next Round"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Summary Screen ── */}
      {phase === "summary" && (
        <div className="absolute inset-0 z-30 bg-gradient-to-br from-slate-900 via-purple-950/50 to-slate-900 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-8 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-4xl font-black mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Game Complete!
              </h2>
              <div className="flex items-center justify-center gap-3">
                <span
                  className="text-5xl font-black"
                  style={{ color: scoreColor(totalScore / ROUNDS_PER_GAME) }}
                >
                  {totalScore.toLocaleString()}
                </span>
                <span className="text-xl text-slate-500">
                  / {TOTAL_MAX.toLocaleString()}
                </span>
              </div>
              <div className="max-w-md mx-auto mt-3">
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${(totalScore / TOTAL_MAX) * 100}%`,
                      background:
                        "linear-gradient(to right, #7c3aed, #db2777, #fbbf24)",
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-700/50 shadow-2xl mb-6">
              <div
                ref={summaryDivRef}
                className="w-full"
                style={{ height: "350px" }}
              />
            </div>

            <div className="space-y-3 mb-8">
              {results.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 bg-slate-800/60 border border-slate-700/40 rounded-xl px-5 py-3"
                  style={{
                    animationDelay: `${i * 100}ms`,
                    animation: "slideUp 0.4s ease-out both",
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-300">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-400">
                      {fmtDist(r.distance)} away
                    </p>
                  </div>
                  <div
                    className="text-lg font-bold"
                    style={{ color: scoreColor(r.score) }}
                  >
                    {r.score.toLocaleString()}
                    <span className="text-slate-600 text-sm font-normal">
                      {" "}
                      pts
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center pb-8">
              <button
                onClick={playAgain}
                className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl text-lg font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-purple-900/50"
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
