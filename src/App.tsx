// BrightMap AI - Premium Google Maps Clone with MapLibre

// =====================================================

// 🗺️ 100% Google Maps Features

// 🤖 Agentic AI Voice System

// 🎨 Premium UI/UX Design

// � MapLibre GL JS (No API Keys Needed)

// � Complete Single File Solution

// 💎 MVP Ready - Unlimited Usage

// =====================================================

import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";

// Global Type Declarations

declare global {
  interface Window {
    maplibregl: any;

    webkitSpeechRecognition: any;

    SpeechRecognition: any;

    speechSynthesis: SpeechSynthesis;
  }
}

// Mistral API Key (Only for AI Voice)

const MISTRAL_API_KEY = "yAk4Lzjaqk6rXG3R81XH1nTvMZxndhGd";

const MAPTILER_KEY = "MIeHBcGOojepfmcgLps6";

// Type Definitions

interface Location {
  id: string;

  name: string;

  address?: string;

  position: [number, number];

  type?: string;

  rating?: number;

  phone?: string;

  website?: string;

  hours?: string;

  distance?: number;

  isOpen?: boolean;
}

interface Marker {
  id: number;

  position: [number, number];

  name: string;

  address?: string;

  type?: string;
}

interface ConversationItem {
  type: "user" | "ai";

  message: string;

  timestamp: Date;
}

interface Route {
  id: string | number;

  distance: number;

  duration: number;

  trafficDelay: number;

  summary?: any;

  legs?: any[];

  geometry?: any;

  instructions?: string[];
}

interface SavedPlace {
  id: string;

  name: string;

  position: [number, number];

  address: string;

  type: "home" | "work" | "favorite";

  icon: string;
}

// Main BrightMap AI Component

export default function BrightMapAI() {
  // Core State

  const [map, setMap] = useState<any>(null);

  const [markers, setMarkers] = useState<Marker[]>([]);

  const [searchResults, setSearchResults] = useState<Location[]>([]);

  const [query, setQuery] = useState("");

  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);

  const [navigationSteps, setNavigationSteps] = useState<any[]>([]);

  const [lastManeuverSpoken, setLastManeuverSpoken] = useState<string>("");

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );

  // Utility: Haversine Distance

  const getDistance = (p1: [number, number], p2: [number, number]) => {
    const R = 6371e3; // metres

    const φ1 = (p1[1] * Math.PI) / 180;

    const φ2 = (p2[1] * Math.PI) / 180;

    const Δφ = ((p2[1] - p1[1]) * Math.PI) / 180;

    const Δλ = ((p2[0] - p1[0]) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in meters
  };

  // [FIX] Proactive Navigation Guidance

  const checkNavigationProgress = (pos: [number, number]) => {
    if (!isNavigating || activeStepIndex < 0 || navigationSteps.length === 0)
      return;

    const currentStep = navigationSteps[activeStepIndex];

    if (!currentStep) return;

    const distToManeuver = getDistance(pos, currentStep.location);

    // [FIX] Clinical but clear TBT Voice alerts

    if (distToManeuver < 30 && activeStepIndex < navigationSteps.length - 1) {
      // Arrived at waypoint, move to next

      const nextStep = navigationSteps[activeStepIndex + 1];

      if (nextStep && lastManeuverSpoken !== nextStep.instruction) {
        speak(`Arrived. Now, ${nextStep.instruction}`);

        setLastManeuverSpoken(nextStep.instruction);

        setActiveStepIndex(activeStepIndex + 1);
      }
    } else if (distToManeuver < 55 && distToManeuver > 35) {
      if (lastManeuverSpoken !== `now_${currentStep.instruction}`) {
        speak(`Now, ${currentStep.instruction}`);

        setLastManeuverSpoken(`now_${currentStep.instruction}`);
      }
    } else if (distToManeuver < 110 && distToManeuver > 90) {
      if (lastManeuverSpoken !== `near_${currentStep.instruction}`) {
        speak(`In one hundred meters, ${currentStep.instruction}`);

        setLastManeuverSpoken(`near_${currentStep.instruction}`);
      }
    } else if (distToManeuver < 210 && distToManeuver > 190) {
      if (lastManeuverSpoken !== `mid_${currentStep.instruction}`) {
        speak(`In two hundred meters, ${currentStep.instruction}`);

        setLastManeuverSpoken(`mid_${currentStep.instruction}`);
      }
    } else if (distToManeuver < 510 && distToManeuver > 480) {
      if (lastManeuverSpoken !== `prep_${currentStep.instruction}`) {
        speak(`In five hundred meters, ${currentStep.instruction}`);

        setLastManeuverSpoken(`prep_${currentStep.instruction}`);
      }
    } else if (distToManeuver < 1050 && distToManeuver > 950) {
      if (lastManeuverSpoken !== `far_${currentStep.instruction}`) {
        speak(`In one kilometer, ${currentStep.instruction}`);

        setLastManeuverSpoken(`far_${currentStep.instruction}`);
      }
    }
  };

  // [FIX] Instruction Overlay Component - Top Status Bar Style

  const InstructionOverlay = () => {
    if (!isNavigating || activeStepIndex < 0 || navigationSteps.length === 0)
      return null;

    const currentStep = navigationSteps[activeStepIndex];

    if (!currentStep) return null;

    return (
      <div
        style={{
          position: "absolute",

          top: 0,

          left: 0,

          right: 0,

          zIndex: 1010,

          background: darkMode
            ? "rgba(45, 45, 45, 0.95)"
            : "rgba(255, 255, 255, 0.95)",

          padding: "12px 20px",

          backdropFilter: "blur(10px)",

          borderBottom: `1px solid ${
            darkMode ? "#444" : "rgba(255,255,255,0.2)"
          }`,

          display: "flex",

          alignItems: "center",

          justifyContent: "center",

          gap: "16px",

          minHeight: "60px",

          transition: "all 0.3s ease-out",

          willChange: "auto",
        }}
      >
        <div
          style={{
            display: "flex",

            alignItems: "center",

            gap: "16px",

            flex: 1,

            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "40px",

              height: "40px",

              borderRadius: "8px",

              background: "#4285F4",

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              fontSize: "20px",

              color: "white",

              flexShrink: 0,

              transition: "transform 0.3s ease",
            }}
          >
            {(currentStep?.instruction || "").toLowerCase().includes("left")
              ? "↖️"
              : (currentStep?.instruction || "").toLowerCase().includes("right")
              ? "↗️"
              : "⬆️"}
          </div>

          <div style={{ flex: 1, textAlign: "center" }}>
            <div
              style={{
                fontSize: "10px",

                color: "#666",

                fontWeight: 500,

                marginBottom: "4px",
              }}
            >
              Next Turn
            </div>

            <div
              style={{
                fontSize: "14px",

                color: darkMode ? "white" : "#333",

                fontWeight: 700,

                transition: "color 0.2s ease",
              }}
            >
              {currentStep.instruction || "Head straight"}
            </div>
          </div>
        </div>

        {showDetailedNav && selectedRoute && (
          <div
            style={{
              position: "absolute",

              top: "100%",

              left: 0,

              right: 0,

              background: darkMode
                ? "rgba(45, 45, 45, 0.95)"
                : "rgba(255, 255, 255, 0.95)",

              borderBottom: `1px solid ${
                darkMode ? "#444" : "rgba(255,255,255,0.2)"
              }`,

              padding: "8px 20px",

              display: "flex",

              justifyContent: "space-around",

              fontSize: "11px",

              color: darkMode ? "#ccc" : "#666",
            }}
          >
            <div
              style={{
                display: "flex",

                flexDirection: "column",

                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontWeight: 600,

                  color: darkMode ? "#aaa" : "#555",

                  marginBottom: "2px",
                }}
              >
                ETA
              </span>

              <span>{formatDuration(selectedRoute.duration)}</span>
            </div>

            <div
              style={{
                display: "flex",

                flexDirection: "column",

                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontWeight: 600,

                  color: darkMode ? "#aaa" : "#555",

                  marginBottom: "2px",
                }}
              >
                Remaining
              </span>

              <span>{formatDistance(selectedRoute.distance)}</span>
            </div>

            <div
              style={{
                display: "flex",

                flexDirection: "column",

                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontWeight: 600,

                  color: darkMode ? "#aaa" : "#555",

                  marginBottom: "2px",
                }}
              >
                Traffic
              </span>

              <span>{selectedRoute.trafficDelay > 0 ? "Heavy" : "None"}</span>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowDetailedNav(!showDetailedNav)}
          style={{
            background: "none",

            border: "none",

            cursor: "pointer",

            fontSize: "16px",

            color: darkMode ? "white" : "#666",

            padding: "4px",

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            transition: "transform 0.3s",

            transform: showDetailedNav ? "rotate(180deg)" : "rotate(0deg)",

            position: "absolute",

            right: "20px",
          }}
        >
          ⌄
        </button>
      </div>
    );
  };

  // [NEW] Cancel Navigation Button - Below Status Bar

  const CancelNavigationButton = () => {
    if (!isNavigating) return null;

    return (
      <button
        onClick={() => {
          // Cancel navigation

          setIsNavigating(false);

          setSelectedRoute(null);

          setNavigationSteps([]);

          setActiveStepIndex(-1);

          setDestinationQuery("");

          setDestinationPosition(null);

          setIsOffRoute(false);

          setLastRerouteTime(0);

          setEta(null);

          setShowDetailedNav(false);

          setCurrentPage("map"); // Return to map/home page

          // Clear route from map

          if (map && map.getLayer("route")) {
            map.removeLayer("route");

            map.removeSource("route");
          }

          speak("Navigation cancelled.");
        }}
        style={{
          position: "absolute",

          top: "70px", // Below the navigation status bar

          left: "20px",

          zIndex: 1005,

          width: "44px",

          height: "44px",

          borderRadius: "50%",

          background: darkMode ? "#333" : "white",

          border: `2px solid ${darkMode ? "#555" : "#ddd"}`,

          cursor: "pointer",

          display: "flex",

          alignItems: "center",

          justifyContent: "center",

          fontSize: "20px",

          color: darkMode ? "white" : "#333",

          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",

          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.05)";

          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";

          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
        }}
        title="Cancel Navigation"
      >
        ✕
      </button>
    );
  };

  // [NEW] Assistant Overlay Component (Voice-First UI)

  const AssistantOverlay = () => {
    if (assistantStatus === "idle" && !assistantMessage) return null;

    return (
      <div
        style={{
          position: "absolute",

          bottom: "100px",

          left: "50%",

          transform: "translateX(-50%)",

          zIndex: 2000,

          background: "rgba(0, 0, 0, 0.85)",

          color: "white",

          padding: "12px 24px",

          borderRadius: "30px",

          backdropFilter: "blur(10px)",

          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",

          display: "flex",

          alignItems: "center",

          gap: "15px",

          maxWidth: "80vw",

          animation: "slideUp 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28)",
        }}
      >
        <div style={{ position: "relative" }}>
          <div
            style={{
              width: "12px",

              height: "12px",

              background:
                assistantStatus === "listening" ? "#EA4335" : "#4285F4",

              borderRadius: "50%",

              animation:
                assistantStatus === "thinking"
                  ? "spin 1s linear infinite"
                  : "pulseDot 1.5s infinite",

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              fontSize: "6px",

              color: "white",

              fontWeight: "bold",
            }}
          >
            {assistantStatus === "listening" && "REC"}
          </div>
        </div>

        <div style={{ fontSize: "14px", fontWeight: 500 }}>
          {assistantStatus === "listening" &&
            (puterTranscript || "Listening...")}

          {assistantStatus === "thinking" && "Thinking..."}

          {assistantStatus === "idle" && assistantMessage}
        </div>

        {assistantStatus === "idle" && (
          <button
            onClick={() => setAssistantMessage("")}
            style={{
              background: "none",

              border: "none",

              color: "rgba(255,255,255,0.5)",

              cursor: "pointer",

              fontSize: "16px",

              marginLeft: "10px",
            }}
          >
            ✕
          </button>
        )}
      </div>
    );
  };

  const [routes, setRoutes] = useState<Route[]>([]);

  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  const [isNavigating, setIsNavigating] = useState(false);

  const [puterReady, setPuterReady] = useState(false);

  const [eta, setEta] = useState<string | number | null>(null);

  // UI State

  const [isLoading, setIsLoading] = useState(true);

  const [menuOpen, setMenuOpen] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [activeTab, setActiveTab] = useState<"saved" | "routes" | "history">(
    "saved"
  );

  const [chatOpen, setChatOpen] = useState(false);

  const [showTraffic, setShowTraffic] = useState(false);

  const [showSatellite, setShowSatellite] = useState(false);

  const [show3D, setShow3D] = useState(false);

  const [darkMode, setDarkMode] = useState(false);

  const [currentPage, setCurrentPage] = useState<"map" | "menu">("map");

  const [chatMode, setChatMode] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);

  const [isListening, setIsListening] = useState(false);

  const [chatInput, setChatInput] = useState("");

  // Camera & Photo Functions

  const [showCameraOptions, setShowCameraOptions] = useState(false);

  const handleCameraClick = () => {
    setShowCameraOptions(true);
  };

  const handlePhotoCapture = (source: "camera" | "gallery") => {
    setShowCameraOptions(false);

    if (source === "camera") {
      // Request camera permission and capture photo

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices

          .getUserMedia({
            video: { facingMode: "environment" },

            audio: false,
          })

          .then((stream) => {
            const video = document.createElement("video");

            video.srcObject = stream;

            video.autoplay = true;

            const canvas = document.createElement("canvas");

            const context = canvas.getContext("2d");

            video.onloadedmetadata = () => {
              canvas.width = video.videoWidth;

              canvas.height = video.videoHeight;

              // Capture photo

              context.drawImage(video, 0, 0, canvas.width, canvas.height);

              const imageData = canvas.toDataURL("image/jpeg");

              // Analyze the photo for location information

              const photoType = currentPosition ? "destination" : "current";

              analyzePhoto(imageData, photoType)
                .then((result) => {
                  if (result) {
                    setConversation((prev) => [
                      ...prev,

                      {
                        type: "ai",

                        message: result.message,
                        timestamp: new Date(),
                      },
                    ]);
                    speak(result.message);
                  } else {
                    speak(
                      "I couldn't detect a location in this photo. Please try again or upload a photo with a QR code or landmark."
                    );
                  }
                })
                .catch((error) => {
                  console.error("Photo analysis error:", error);
                  speak("Sorry, I had trouble analyzing this photo.");
                });

              // Stop camera stream
              stream.getTracks().forEach((track) => track.stop());
              video.remove();
              canvas.remove();
            };

            document.body.appendChild(video);

            video.style.display = "none";

            video.play();
          })

          .catch((err) => {
            console.error("Camera access denied:", err);

            speak("Camera access denied. Please allow camera to take photos.");

            setShowCameraOptions(false);
          });
      } else {
        speak("Camera not available on this device.");

        setShowCameraOptions(false);
      }
    } else if (source === "gallery") {
      // Open photo gallery/file picker

      const input = document.createElement("input");

      input.type = "file";

      input.accept = "image/*";

      input.capture = "environment";

      input.onchange = (e: any) => {
        const file = e.target.files?.[0];

        if (file) {
          const reader = new FileReader();

          reader.onload = (event) => {
            const imageData = event.target?.result as string;

            setConversation((prev) => [
              ...prev,
              {
                type: "user",
                message: `📷 Photo selected from gallery: ${file.name}`,
                timestamp: new Date(),
              },
            ]);

            // Analyze the photo for location information
            const photoType = currentPosition ? "destination" : "current";

            analyzePhoto(imageData, photoType)
              .then((result) => {
                if (result) {
                  setConversation((prev) => [
                    ...prev,
                    {
                      type: "ai",
                      message: result.message,
                      timestamp: new Date(),
                    },
                  ]);
                  speak(result.message);
                } else {
                  speak(
                    "I couldn't detect a location in this photo. Please try again or upload a photo with a QR code or landmark."
                  );
                }
              })
              .catch((error) => {
                console.error("Photo analysis error:", error);
                speak("Sorry, I had trouble analyzing this photo.");
              });
          };

          reader.readAsDataURL(file);
        }
      };

      input.click();
    }
  };

  // Photo Analysis Function

  const analyzePhoto = async (
    imageData: string,
    type: "current" | "destination"
  ): Promise<{
    message: string;
    location?: [number, number];
    placeName?: string;
    qrData?: string;
  } | null> => {
    // Mock photo analysis - in a real implementation, this would use Google Vision API or similar

    // First, try to detect QR codes (simulate QR scanning)

    try {
      // Simulate QR code detection by checking for common QR patterns

      // In a real app, you'd use a QR code library like qrcode-reader

      const hasQRCode = Math.random() > 0.7; // Simulate 30% chance of QR code

      if (hasQRCode) {
        // Mock QR code data - could contain location coordinates or place names

        const mockQRData = "geo:28.6139,77.2090?q=Delhi,India"; // Delhi coordinates

        const geoMatch = mockQRData.match(/geo:([-\d.]+),([-\d.]+)\??/);

        if (geoMatch) {
          const lat = parseFloat(geoMatch[1]);

          const lng = parseFloat(geoMatch[2]);

          const placeMatch = mockQRData.match(/q=([^&]+)/);

          const placeName = placeMatch
            ? decodeURIComponent(placeMatch[1])
            : `Location ${lat.toFixed(4)}, ${lng.toFixed(4)}`;

          if (type === "current") {
            setCurrentPosition([lng, lat]);

            return {
              message: `📍 QR Code detected! Set your current location to ${placeName}.`,

              location: [lng, lat],

              placeName,

              qrData: mockQRData,
            };
          } else {
            // For destination, ask for confirmation with override option

            setPendingPhotoDestination({
              location: [lng, lat],

              placeName,

              imageData,

              canOverride: true,
            });

            return {
              message: `📍 I found ${placeName} from the QR code. Would you like to navigate there from your current location, or search for a different location?`,

              location: [lng, lat],

              placeName,

              qrData: mockQRData,
            };
          }
        }
      }

      // Simulate landmark detection

      const landmarks = [
        { name: "Eiffel Tower", coords: [2.2945, 48.8584], city: "Paris" },

        { name: "Taj Mahal", coords: [78.0421, 27.1751], city: "Agra" },

        {
          name: "Statue of Liberty",
          coords: [-74.0445, 40.6892],
          city: "New York",
        },

        { name: "Times Square", coords: [-73.9855, 40.758], city: "New York" },

        { name: "Red Fort", coords: [77.241, 28.6562], city: "Delhi" },

        { name: "Gateway of India", coords: [72.8347, 18.922], city: "Mumbai" },

        { name: "India Gate", coords: [77.2295, 28.6129], city: "Delhi" },
      ];

      // Randomly "detect" a landmark (simulate AI vision)

      const detectedLandmark =
        landmarks[Math.floor(Math.random() * landmarks.length)];

      if (type === "current") {
        setCurrentPosition(detectedLandmark.coords);

        return {
          message: `📍 I recognize the ${detectedLandmark.name} in ${detectedLandmark.city}. I've set this as your current location.`,

          location: detectedLandmark.coords,

          placeName: detectedLandmark.name,
        };
      } else {
        // For destination, ask for confirmation with override option

        setPendingPhotoDestination({
          location: detectedLandmark.coords,

          placeName: detectedLandmark.name,

          imageData,

          canOverride: true,
        });

        return {
          message: `📍 I think this is the ${detectedLandmark.name} in ${detectedLandmark.city}. Would you like to navigate there from your current location, or search for a different location?`,

          location: detectedLandmark.coords,

          placeName: detectedLandmark.name,
        };
      }
    } catch (error) {
      console.error("Photo analysis error:", error);

      return null;
    }
  };

  const [isProcessing, setIsProcessing] = useState(false);

  const [conversation, setConversation] = useState<ConversationItem[]>([]);

  const [isMuted, setIsMuted] = useState(false);

  const [showDetailedNav, setShowDetailedNav] = useState(false);

  const [isPuterListening, setIsPuterListening] = useState(false);

  const [puterTranscript, setPuterTranscript] = useState("");

  const puterTranscriptRef = useRef("");

  const [assistantStatus, setAssistantStatus] = useState<
    "listening" | "thinking" | "idle"
  >("idle");

  const [assistantMessage, setAssistantMessage] = useState("");

  // Navigation State

  const [currentPosition, setCurrentPosition] = useState<
    [number, number] | null
  >(null);

  const [navigationStep, setNavigationStep] = useState(0);

  const [travelMode, setTravelMode] = useState<"car" | "bike" | "foot">("car");

  const [originQuery, setOriginQuery] = useState("");

  const [destinationQuery, setDestinationQuery] = useState("");

  const [isRoutingExpanded, setIsRoutingExpanded] = useState(false);

  const [isOffRoute, setIsOffRoute] = useState(false);

  const [lastRerouteTime, setLastRerouteTime] = useState(0);

  const [destinationPosition, setDestinationPosition] = useState<
    [number, number] | null
  >(null);

  const [navigationOriginName, setNavigationOriginName] = useState<string>("");

  const [navigationDestinationName, setNavigationDestinationName] =
    useState<string>("");

  const [isSimulating, setIsSimulating] = useState(false);

  // [NEW] Navigation Safety State

  const [pendingNavigation, setPendingNavigation] = useState<{
    destination: string;

    mode: string;

    coords?: any;
  } | null>(null);

  const [awaitingModeSelection, setAwaitingModeSelection] = useState(false);

  const [awaitingNavigationConfirmation, setAwaitingNavigationConfirmation] =
    useState(false);

  // [NEW] Pending Photo Destination State

  const [pendingPhotoDestination, setPendingPhotoDestination] = useState<{
    location: [number, number];

    placeName: string;

    imageData: any;
  } | null>(null);

  const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false);

  const [pendingAction, setPendingAction] = useState<any>(null);

  const [isChatVisible, setIsChatVisible] = useState(true);

  // User Data

  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([
    {
      id: "home",

      name: "Home",

      position: [0, 0],

      address: "Your home address",

      type: "home",

      icon: "🏠",
    },

    {
      id: "work",

      name: "Work",

      position: [0, 0],

      address: "Your work address",

      type: "work",

      icon: "🏢",
    },
  ]);

  // Refs

  const mapContainer = useRef<HTMLDivElement>(null);

  const recognition = useRef<any>(null);

  const synthesis = useRef<SpeechSynthesis | null>(null);

  const searchTimeout = useRef<NodeJS.Timeout>();

  const hasInitiallyCentered = useRef(false);

  const userMarkerRef = useRef<any>(null);

  // Initialize Application

  useEffect(() => {
    loadMapLibreSDK();

    initializeSpeechRecognition();

    getCurrentLocation();

    loadSavedPlaces();
  }, []);

  // [NEW] Update User Marker Position

  const updateUserMarker = (position: [number, number], bearing?: number) => {
    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat(position);

      // Rotate marker to face direction of travel

      if (bearing !== undefined) {
        const el = userMarkerRef.current.getElement();

        if (el) {
          el.style.transform = `rotate(${bearing}deg)`;
        }
      }
    }
  };

  // [NEW] Check if Off Route

  const checkIfOffRoute = (position: [number, number]) => {
    if (
      !isNavigating ||
      !selectedRoute ||
      !selectedRoute.geometry ||
      !selectedRoute.geometry.coordinates
    )
      return false;

    const coords = selectedRoute.geometry.coordinates;

    let minDistance = Infinity;

    // Find minimum distance to any point on the route

    for (const coord of coords) {
      const dist = getDistance(position, [coord[0], coord[1]]);

      if (dist < minDistance) {
        minDistance = dist;
      }
    }

    // If more than 50 meters off route, trigger rerouting

    const OFF_ROUTE_THRESHOLD = 50; // meters

    return minDistance > OFF_ROUTE_THRESHOLD;
  };

  // [NEW] Trigger Automatic Reroute

  const triggerReroute = async () => {
    if (!currentPosition || !destinationPosition) return;

    // Debounce: Don't reroute more than once every 10 seconds

    const now = Date.now();

    if (now - lastRerouteTime < 10000) return;

    setLastRerouteTime(now);

    setIsOffRoute(false);

    speak("You're going the wrong way. Rerouting to destination.");

    // Recalculate route from current position

    await calculateRoute(currentPosition, destinationPosition, travelMode);
  };

  // [NEW] Animate Along Route (Enhanced Google Maps Style)

  const animateAlongRoute = () => {
    if (
      !selectedRoute ||
      !selectedRoute.geometry ||
      !selectedRoute.geometry.coordinates ||
      !map
    )
      return;

    setIsSimulating(true);

    const coords = selectedRoute.geometry.coordinates;

    let index = 0;

    const animate = () => {
      if (index >= coords.length) {
        speak("Arrived at destination");

        setIsSimulating(false);

        return;
      }

      const currentCoord = coords[index];

      const position: [number, number] = [currentCoord[0], currentCoord[1]];

      // Calculate bearing for rotation

      if (index < coords.length - 1) {
        const nextCoord = coords[index + 1];

        const dx = nextCoord[0] - currentCoord[0];

        const dy = nextCoord[1] - currentCoord[1];

        const bearing = Math.atan2(dx, dy) * (180 / Math.PI);

        // Only update marker visually, don't trigger state changes

        if (userMarkerRef.current) {
          userMarkerRef.current.setLngLat(position);

          const el = userMarkerRef.current.getElement();

          if (el) {
            el.style.transform = `rotate(${bearing}deg)`;
          }
        }
      } else {
        if (userMarkerRef.current) {
          userMarkerRef.current.setLngLat(position);
        }
      }

      // Update position state only occasionally for voice alerts (every 10 steps)

      if (index % 10 === 0) {
        setCurrentPosition(position);
      }

      index++;

      if (index < coords.length) {
        setTimeout(animate, 100); // Smooth animation
      } else {
        setIsSimulating(false);

        setCurrentPosition(position); // Final position update
      }
    };

    animate();
  };

  // [FIX] Reactive Initial Centering (Fixed: Only centers ONCE)

  useEffect(() => {
    if (
      map &&
      currentPosition &&
      !isNavigating &&
      !hasInitiallyCentered.current
    ) {
      map.flyTo({ center: currentPosition, zoom: 15 });

      hasInitiallyCentered.current = true;
    }

    // [FIX] Trigger navigation check on every movement (but not during simulation)

    if (currentPosition && !isSimulating) {
      checkNavigationProgress(currentPosition);

      updateUserMarker(currentPosition);

      // [NEW] Check if off-route and trigger rerouting

      if (isNavigating && checkIfOffRoute(currentPosition)) {
        if (!isOffRoute) {
          setIsOffRoute(true);

          triggerReroute();
        }
      } else {
        setIsOffRoute(false);
      }
    }
  }, [currentPosition, map, isSimulating]);

  // [FIX] Resize map when returning to map page

  useLayoutEffect(() => {
    if (currentPage === "map" && map) {
      if (map.getContainer() !== mapContainer.current) {
        if (map.setContainer) map.setContainer(mapContainer.current);
      }

      map.resize();

      if (map.triggerRepaint) map.triggerRepaint();

      setSearchResults([]); // Clear menu search results when returning to map
    }

    if (currentPage === "menu") {
      setQuery(""); // Clear map query when going to menu
    }
  }, [currentPage]);

  // [FIX] Fly to selected location when on map page

  useEffect(() => {
    if (currentPage === "map" && map && selectedLocation) {
      setTimeout(() => {
        map.flyTo({
          center: selectedLocation.position,

          zoom: 17,

          duration: 1000,
        });
      }, 250);
    }
  }, [currentPage, map, selectedLocation]);

  // [FIX] Global Handlers for Popups

  useEffect(() => {
    (window as any).brightmap = {
      navigateHere: (lng: number, lat: number) => {
        if (currentPosition) {
          calculateRoute(currentPosition, [lng, lat]);
        } else {
          speak("Please enable GPS or select a starting point first.");
        }
      },

      savePlace: (name: string, lng: number, lat: number) => {
        const newPlace: SavedPlace = {
          id: Date.now().toString(),

          name: name,

          position: [lng, lat],

          address: "",

          type: "favorite",

          icon: "⭐",
        };

        savePlaces([...savedPlaces, newPlace]);

        speak(`Saved ${name} to your favorites.`);
      },
    };
  }, [currentPosition, savedPlaces]);

  // Load MapLibre SDK

  const loadMapLibreSDK = async () => {
    try {
      // Load MapLibre CSS

      const cssLink = document.createElement("link");

      cssLink.rel = "stylesheet";

      cssLink.href = "https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css";

      document.head.appendChild(cssLink);

      // Load JS

      const script = document.createElement("script");

      script.src = "https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js";

      script.async = true;

      script.onload = () => {
        initializeMap();
      };

      document.body.appendChild(script);
    } catch (error) {
      console.error("Error loading MapLibre SDK:", error);

      setIsLoading(false);
    }
  };

  // [NEW] Robust Puter.js Loading

  useEffect(() => {
    const scriptId = "puter-js-sdk";

    if (document.getElementById(scriptId)) return;

    const loadPuter = () => {
      const script = document.createElement("script");

      script.id = scriptId;

      script.src = "https://js.puter.com/v2/";

      script.async = true;

      script.onload = () => {
        console.log("Puter.js loaded successfully");

        setPuterReady(true);
      };

      script.onerror = () => {
        console.error("Puter.js failed to load");

        setPuterReady(false);
      };

      document.head.appendChild(script);
    };

    loadPuter();
  }, []);

  // Initialize Map with OpenStreetMap

  const initializeMap = () => {
    if (!mapContainer.current || !window.maplibregl) return;

    try {
      const mapInstance = new window.maplibregl.Map({
        container: mapContainer.current,

        style: {
          version: 8,

          sources: {
            osm: {
              type: "raster",

              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],

              tileSize: 256,

              attribution: "© OpenStreetMap contributors",
            },
          },

          layers: [
            {
              id: "osm",

              type: "raster",

              source: "osm",
            },
          ],
        },

        center: currentPosition || [-74.006, 40.7128], // Default: New York

        zoom: 14,

        pitch: 0,

        bearing: 0,
      });

      // Add Controls (without compass to avoid collision with chat)

      mapInstance.addControl(
        new window.maplibregl.NavigationControl({
          showCompass: false,

          showZoom: true,
        }),

        "top-right"
      );

      mapInstance.addControl(
        new window.maplibregl.ScaleControl({ position: "bottom-left" }),

        "bottom-left"
      );

      // Map Events

      mapInstance.on("click", (e: any) => {
        const { lng, lat } = e.lngLat;

        addMarker(
          [lng, lat],

          `📍 Location ${lat.toFixed(4)}, ${lng.toFixed(4)}`
        );
      });

      mapInstance.on("load", () => {
        setIsLoading(false);

        if (currentPosition) {
          mapInstance.flyTo({ center: currentPosition, zoom: 15 });
        }

        // [NEW] Create custom blue dot marker

        if (currentPosition) {
          const el = document.createElement("div");

          el.className = "user-location-marker";

          el.innerHTML = `

                <div style="

                  width: 20px;

                  height: 20px;

                  background: #4285F4;

                  border: 3px solid white;

                  border-radius: 50%;

                  box-shadow: 0 0 10px rgba(66, 133, 244, 0.5);

                  position: relative;

                  transition: transform 0.3s ease;

                ">

                  <div style="

                    position: absolute;

                    top: -8px;

                    left: 50%;

                    transform: translateX(-50%);

                    width: 0;

                    height: 0;

                    border-left: 6px solid transparent;

                    border-right: 6px solid transparent;

                    border-bottom: 10px solid #4285F4;

                  "></div>

                </div>

              `;

          userMarkerRef.current = new window.maplibregl.Marker({
            element: el,

            anchor: "center",
          })

            .setLngLat(currentPosition)

            .addTo(mapInstance);
        }
      });

      setMap(mapInstance);
    } catch (error) {
      console.error("Error initializing map:", error);

      setIsLoading(false);
    }
  };

  // Initialize Speech Recognition

  const initializeSpeechRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const speechSynthesis = window.speechSynthesis;

    if (!SpeechRecognition || !speechSynthesis) {
      console.warn("Speech API not supported in this browser");

      return;
    }

    recognition.current = new SpeechRecognition();

    recognition.current.continuous = false;

    recognition.current.interimResults = true;

    recognition.current.lang = "en-US";

    recognition.current.onstart = () => {
      setIsListening(true);
    };

    recognition.current.onend = () => {
      setIsListening(false);
    };

    recognition.current.onresult = (event: any) => {
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (isPuterListening) {
        puterTranscriptRef.current += finalTranscript;

        setPuterTranscript(puterTranscriptRef.current);
      } else if (event.results[0].isFinal) {
        handleVoiceCommand(event.results[0][0].transcript);
      }
    };

    recognition.current.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);

      setIsListening(false);

      speak("Sorry, I had trouble understanding. Please try again.");
    };

    synthesis.current = speechSynthesis;
  };

  // [FIX] Get Current Location (Improved Accuracy with Continuous Tracking)

  const getCurrentLocation = (isManual = false) => {
    if (isManual) hasInitiallyCentered.current = false;

    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,

        timeout: 10000,

        maximumAge: 0,
      };

      // Remove existing location source and layer if they exist

      const updateLocation = (lng: number, lat: number, accuracy: number) => {
        setCurrentPosition([lng, lat]);

        if (map) {
          // Remove existing source and layer if they exist

          if (map.getSource("user-location")) {
            if (map.getLayer("user-location-circle"))
              map.removeLayer("user-location-circle");

            if (map.getLayer("user-location-dot"))
              map.removeLayer("user-location-dot");

            map.removeSource("user-location");
          }

          // Add a new source and layer for the user's location

          map.addSource("user-location", {
            type: "geojson",

            data: {
              type: "Feature",

              geometry: {
                type: "Point",

                coordinates: [lng, lat],
              },

              properties: {},
            },
          });

          // Add a circle around the user's location

          map.addLayer({
            id: "user-location-circle",

            type: "circle",

            source: "user-location",

            paint: {
              "circle-radius": {
                base: 2,

                stops: [
                  [12, 20],

                  [22, 1000],
                ],
              },

              "circle-color": "#1a73e8",

              "circle-opacity": 0.15,

              "circle-stroke-width": 0,
            },
          });

          // Add a pulsing dot at the user's location

          map.addLayer({
            id: "user-location-dot",

            type: "circle",

            source: "user-location",

            paint: {
              "circle-radius": 8,

              "circle-color": "#1a73e8",

              "circle-stroke-color": "#ffffff",

              "circle-stroke-width": 2,

              "circle-opacity": 0.8,
            },
          });

          // Fly to the user's location

          map.flyTo({
            center: [lng, lat],

            zoom: 15,

            essential: true,
          });
        }
      };

      // Get initial position

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;

          updateLocation(longitude, latitude, accuracy);

          console.log("Location acquired:", latitude, longitude);
        },

        (error) => {
          console.warn("High accuracy failed, trying standard...", error);

          // Fallback for PCs without GPS hardware

          navigator.geolocation.getCurrentPosition(
            (pos) => {
              updateLocation(
                pos.coords.longitude,

                pos.coords.latitude,

                pos.coords.accuracy
              );

              console.log(
                "Fallback location:",

                pos.coords.latitude,

                pos.coords.longitude
              );
            },

            (err) => {
              console.error("Standard geolocation failed:", err);

              speak(
                "Unable to get your location. Please check your permissions."
              );
            },

            { enableHighAccuracy: false, timeout: 5000 }
          );
        },

        options
      );

      // [NEW] Watch position for continuous tracking

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { longitude, latitude, accuracy } = position.coords;

          updateLocation(longitude, latitude, accuracy);
        },

        (error) => {
          console.warn("Watch position error:", error);
        },

        {
          enableHighAccuracy: true,

          maximumAge: 5000,

          timeout: 10000,
        }
      );

      // Store watchId to clear later if needed

      return () => {
        if (watchId) {
          navigator.geolocation.clearWatch(watchId);
        }

        // Clean up layers when component unmounts

        if (map) {
          if (map.getSource("user-location")) {
            map.removeLayer("user-location-circle");

            map.removeLayer("user-location-dot");

            map.removeSource("user-location");
          }
        }
      };
    }
  };

  // Update Current Location

  const updateCurrentLocation = (center: any) => {
    if (center && center.lng && center.lat) {
      setCurrentPosition([center.lng, center.lat]);
    }
  };

  // Load Saved Places

  const loadSavedPlaces = () => {
    const saved = localStorage.getItem("brightmap_saved_places");

    if (saved) {
      setSavedPlaces(JSON.parse(saved));
    }
  };

  // Save Places

  const savePlaces = (places: SavedPlace[]) => {
    localStorage.setItem("brightmap_saved_places", JSON.stringify(places));

    setSavedPlaces(places);
  };

  // Add Marker

  const addMarker = (
    position: [number, number],

    name: string,

    address?: string,

    type?: string
  ) => {
    if (!map || !window.tt) return;

    const newMarker: Marker = {
      id: Date.now(),

      position,

      name,

      address,

      type,
    };

    setMarkers((prev) => [...prev, newMarker]);

    // Create Visual Marker using MapLibre

    if (!window.maplibregl) return;

    const marker = new window.maplibregl.Marker({
      color: "#4285F4",

      scale: 1.0,
    })

      .setLngLat(position)

      .addTo(map);

    // Create Popup

    const popup = new window.maplibregl.Popup({
      offset: [0, -30],

      closeButton: false,
    }).setHTML(`

          <div style="

            padding: 12px;

            min-width: 200px;

            font-family: inherit;

          ">

            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 16px; font-weight: 600;">

              ${name}

            </h3>

            ${
              address
                ? `<p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${address}</p>`
                : ""
            }

            <div style="display: flex; gap: 8px;">

              <button onclick="window.brightmap.navigateHere(${position[0]}, ${
      position[1]
    })" style="

                background: #4285F4;

                color: white;

                border: none;

                padding: 6px 12px;

                border-radius: 4px;

                cursor: pointer;

                font-size: 12px;

              ">🧭 Navigate</button>

              <button onclick="window.brightmap.savePlace('${name}', ${
      position[0]
    }, ${position[1]})" style="

                background: #34A853;

                color: white;

                border: none;

                padding: 6px 12px;

                border-radius: 4px;

                cursor: pointer;

                font-size: 12px;

              ">💾 Save</button>

            </div>

          </div>

        `);

    marker.setPopup(popup);

    marker.getElement().addEventListener("click", () => {
      marker.togglePopup();
    });
  };

  // Handle Search using MapTiler Geocoding API

  const handleSearch = useCallback(
    async (signal?: AbortSignal) => {
      if (!query.trim()) return;

      try {
        const proximity = currentPosition
          ? `&proximity=${currentPosition[0]},${currentPosition[1]}`
          : "";

        const bbox = currentPosition
          ? `&bbox=${currentPosition[0] - 0.5},${currentPosition[1] - 0.5},${
              currentPosition[0] + 0.5
            },${currentPosition[1] + 0.5}`
          : "";

        const response = await fetch(
          `https://api.maptiler.com/geocoding/${encodeURIComponent(
            query
          )}.json?key=${MAPTILER_KEY}${proximity}&country=IN${bbox}&language=en&types=address,poi,neighborhood,locality,place&limit=10`,

          { signal }
        );

        const data = await response.json();

        const results: Location[] = data.features.map((feature: any) => ({
          id: feature.id,

          name: feature.text,

          address: feature.place_name,

          position: feature.geometry.coordinates,

          type: feature.properties.category || "place",

          rating: 0,

          distance: 0,
        }));

        setSearchResults(results);
      } catch (error: any) {
        if (error.name === "AbortError") return;

        console.error("Search error:", error);

        speak("Sorry, I couldn't find that place. Please try again.");
      }
    },

    [query, currentPosition]
  );

  // Select Location

  const selectLocation = (location: Location) => {
    setSelectedLocation(location);

    setSearchResults([]);

    setQuery(location.name);
  };

  // Handle Voice Command (Fixed: ChatGPT Style with Confirmation)

  // [NEW] Enhanced Memory Context for AI

  const getConversationMemory = () => {
    const recentMessages = conversation.slice(-6); // Last 6 messages for context

    return recentMessages

      .map((msg) => `${msg.type}: ${msg.message}`)

      .join("; ");
  };

  const handleVoiceCommand = async (command: string) => {
    setIsProcessing(true);

    setConversation((prev) => [
      ...prev,

      { type: "user", message: command, timestamp: new Date() },
    ]);

    // [FIX] Check for confirmation and navigation safety protocol

    if (isAwaitingConfirmation) {
      const lower = command.toLowerCase();

      if (
        lower.includes("yes") ||
        lower.includes("confirm") ||
        lower.includes("go ahead") ||
        lower.includes("sure")
      ) {
        setIsAwaitingConfirmation(false);

        if (pendingAction) {
          // [FIX] Give immediate feedback before the heavy calculation/geocoding

          setConversation((prev) => [
            ...prev,

            {
              type: "ai",

              message: "Starting navigation now.",

              timestamp: new Date(),
            },
          ]);

          speak("Starting navigation now.");

          // [FIX] Snappy UI: Hide everything immediately

          setIsChatVisible(false);

          setSearchResults([]);

          setSelectedLocation(null);

          setIsRoutingExpanded(false);

          setSidebarOpen(false);

          await executeAICommand(pendingAction);
        }

        setIsProcessing(false);

        return;
      } else if (
        lower.includes("no") ||
        lower.includes("cancel") ||
        lower.includes("stop")
      ) {
        setIsAwaitingConfirmation(false);

        setPendingAction(null);

        setConversation((prev) => [
          ...prev,

          {
            type: "ai",

            message: "Okay, I've canceled the request.",

            timestamp: new Date(),
          },
        ]);

        speak("Okay, I've canceled the request.");

        setIsProcessing(false);

        return;
      }
    }

    // [NEW] Handle navigation safety protocol

    if (awaitingModeSelection) {
      const lower = command.toLowerCase();

      let selectedMode = "";

      if (lower.includes("car") || lower.includes("drive")) {
        selectedMode = "car";
      } else if (lower.includes("train") || lower.includes("rail")) {
        selectedMode = "train";
      } else if (
        lower.includes("bike") ||
        lower.includes("bicycle") ||
        lower.includes("cycle")
      ) {
        selectedMode = "bike";
      } else if (
        lower.includes("foot") ||
        lower.includes("walk") ||
        lower.includes("walking")
      ) {
        selectedMode = "foot";
      }

      if (selectedMode && pendingNavigation) {
        // Update pending navigation with selected mode

        setPendingNavigation({
          ...pendingNavigation,

          mode: selectedMode,
        });

        setAwaitingModeSelection(false);

        setAwaitingNavigationConfirmation(true);

        setConversation((prev) => [
          ...prev,

          {
            type: "ai",

            message: `Great! You want to go to ${pendingNavigation.destination} by ${selectedMode}. Please confirm or reject this navigation request.`,

            timestamp: new Date(),
          },
        ]);

        speak(
          `Great! You want to go to ${pendingNavigation.destination} by ${selectedMode}. Please confirm or reject this navigation request.`
        );

        setIsProcessing(false);

        return;
      }
    }

    // [NEW] Handle navigation confirmation - SKIP if buttons are shown

    if (awaitingNavigationConfirmation && pendingNavigation) {
      // Visual buttons handle this now - skip text processing

      setIsProcessing(false);

      return;
    }

    try {
      // 1. Prepare history for sliding window context (ChatGPT Style)

      const contextLimit = 20; // Increased from 10 to remember more conversation history

      const history = conversation.slice(-contextLimit).map((m) => ({
        role: m.type === "ai" ? "assistant" : "user",

        content: m.message,
      }));

      // 2. Get user location context

      const locationContext = currentPosition
        ? `User is currently at coordinates: [${currentPosition[1].toFixed(
            6
          )}, ${currentPosition[0].toFixed(6)}]. This appears to be in ${
            // Simple reverse geocoding approximation

            currentPosition[1] > 40 &&
            currentPosition[1] < 50 &&
            currentPosition[0] > -80 &&
            currentPosition[0] < -70
              ? "the northeastern United States"
              : currentPosition[1] > 20 &&
                currentPosition[1] < 30 &&
                currentPosition[0] > 70 &&
                currentPosition[0] < 90
              ? "India"
              : currentPosition[1] > 50 &&
                currentPosition[1] < 60 &&
                currentPosition[0] > -10 &&
                currentPosition[0] < 10
              ? "Western Europe"
              : "an unknown location"
          }.`
        : "User location is not available.";

      // 3. Add smart contextual awareness based on ENTIRE conversation session

      const conversationContext =
        conversation.length > 0
          ? `COMPLETE SESSION CONVERSATION HISTORY: ${conversation

              .map((m) => `${m.type}: ${m.message}`)

              .join(
                "; "
              )}. Remember EVERYTHING the user has said, thought, or mentioned in this entire chat session. Use this full context to provide relevant, personalized responses.`
          : "";

      // 4. Process with Mistral AI

      const response = await fetch(
        "https://api.mistral.ai/v1/chat/completions",

        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            Authorization: `Bearer ${MISTRAL_API_KEY}`,
          },

          body: JSON.stringify({
            model: "mistral-small-latest",

            messages: [
              {
                role: "system",

                content: `I am BrightMap AI, your General AI companion for seamless navigation, location discovery, and smart journey planning. I am designed to provide multi-language voice and photo automatic routing, making your journeys easier and more efficient.

I can assist you with various tasks such as:

* Providing turn-by-turn directions for driving, walking, or biking
* Suggesting nearby points of interest, restaurants, and hotels based on your location
* Offering real-time traffic updates and alternative routes
* Supporting multiple languages for voice and text interactions
* Integrating with your device's camera for photo-based navigation
* Remembering your conversation history to provide personalized responses

LOCATION AWARENESS: ${locationContext}
    

    CONVERSATION MEMORY: ${getConversationMemory()}

    Remember at least the last 6 user messages and respond contextually. If user mentioned wanting to go somewhere (like "I want to go to a restaurant"), remember this and suggest relevant nearby places based on their current location.

    

    CURRENT STATUS: ${
      isNavigating
        ? `User is currently navigating to ${destinationQuery}. Next instruction: ${
            navigationSteps[activeStepIndex]?.instruction || "Arriving soon"
          }.`
        : "User is not currently navigating."
    }

    

    NAVIGATION SAFETY PROTOCOL: When users request navigation (take me to, navigate to, go to, etc.), you MUST follow this exact safety flow:

    1. FIRST, ask for travel mode preference: "Would you like to go by car, train, bike, or foot?"

    2. Do NOT start navigation immediately

    3. Wait for user to specify travel mode (car/train/bike/foot)

    4. THEN ask for confirmation: "Please confirm or reject this navigation request"

    5. Only proceed with actual navigation after explicit confirmation

    

    CONFIRMATION REQUIRED: For ALL navigation requests, you must get explicit confirmation from the user before starting navigation. This prevents accidental navigation starts.

    

    SMART SUGGESTIONS: Based on user's location and previous requests, proactively suggest relevant nearby places. For example:

    - If user said "hungry" or "restaurant", suggest restaurants near their current location

    - If user said "coffee" or "cafe", suggest coffee shops

    - If user mentioned "hotel", suggest hotels

    - Always use their current GPS coordinates to make location-specific suggestions.

    

    CRITICAL INSTRUCTION: You MUST remember and reference the ENTIRE conversation history from this session. When the user says something like "by car", you MUST understand they are referring to a previous mention of travel (like "from Delhi to Chennai"). Always connect new requests to previous context in the conversation. If the user mentions a destination or travel method, remember it for future related queries.

    

    RESPONSE FORMAT: Respond ONLY with a JSON object:

    {

      "action": "search|navigate|suggest|ask_mode|confirm_navigation|none",

      "query": "place or destination to search/suggest",

      "mode": "car|train|bike|foot" (only for navigation requests),

      "response": "Conversational reply that acknowledges their location and previous context",

      "requiresConfirmation": true/false,

      "pendingNavigation": true/false (set to true when asking for confirmation)

    }`,
              },

              ...history,

              { role: "user", content: command },
            ],

            response_format: { type: "json_object" },
          }),
        }
      );

      const data = await response.json();

      const aiResponse = JSON.parse(data.choices[0].message.content);

      setConversation((prev) => [
        ...prev,

        { type: "ai", message: aiResponse.response, timestamp: new Date() },
      ]);

      speak(aiResponse.response);

      // [NEW] Handle navigation safety protocol actions

      if (aiResponse.action === "ask_mode") {
        setPendingNavigation({
          destination: aiResponse.query || command, // Fallback to original command if AI doesn't provide query

          mode: aiResponse.mode || "car",

          coords: aiResponse.coords,
        });

        setAwaitingModeSelection(true);
      } else if (aiResponse.action === "confirm_navigation") {
        setPendingNavigation({
          destination: aiResponse.query || command, // Fallback to original command if AI doesn't provide query

          mode: aiResponse.mode || "car",

          coords: aiResponse.coords,
        });

        setAwaitingNavigationConfirmation(true);
      } else if (aiResponse.requiresConfirmation) {
        // [FIX] Handle existing confirmation flow

        setIsAwaitingConfirmation(true);

        setPendingAction(aiResponse);
      } else {
        // Execute action immediately

        await executeAICommand(aiResponse);
      }
    } catch (error) {
      console.error("Voice processing error:", error);

      speak("I encountered an error processing your request.");
    } finally {
      setIsProcessing(false);
    }
  };

  // [NEW] Puter AI Assistant (Serverless & Journey Aware)

  const handlePuterAI = async () => {
    // [FIX] Wait for Puter to be ready instead of just failing

    if (!puterReady && !(window as any).puter) {
      speak("Puter AI is starting up. Just a second.");

      let attempts = 0;

      while (!(window as any).puter && attempts < 14) {
        await new Promise((r) => setTimeout(r, 500));

        attempts++;
      }

      if (!(window as any).puter) {
        speak(
          "I'm having trouble connecting to the AI assistant. Let me try reloading the service."
        );

        const oldScript = document.getElementById("puter-js-sdk");

        if (oldScript) oldScript.remove();

        const script = document.createElement("script");

        script.id = "puter-js-sdk";

        script.src = "https://js.puter.com/v2/";

        script.async = true;

        script.onload = () => setPuterReady(true);

        document.head.appendChild(script);

        return;
      } else {
        setPuterReady(true);
      }
    }

    if (isPuterListening) {
      // STOP and Process

      if (recognition.current) recognition.current.stop();

      setIsPuterListening(false);

      setAssistantStatus("thinking");

      // Give it a tiny moment to finish the last result

      setTimeout(() => {
        processPuterVoiceCommand(puterTranscriptRef.current);

        puterTranscriptRef.current = "";

        setPuterTranscript("");
      }, 500);
    } else {
      // START Listening

      setIsPuterListening(true);

      puterTranscriptRef.current = "";

      setPuterTranscript("");

      setAssistantStatus("listening");

      setAssistantMessage("");

      speak("I'm listening.");

      if (recognition.current) {
        recognition.current.continuous = true;

        try {
          recognition.current.start();
        } catch (e) {
          console.warn("Recognition already started");
        }
      }
    }
  };

  const processPuterVoiceCommand = async (command: string) => {
    setIsPuterListening(false);

    if (!command) {
      setAssistantStatus("idle");

      return;
    }

    setConversation((prev) => [
      ...prev,

      { type: "user", message: command, timestamp: new Date() },
    ]);

    // Direct identity question check - return exact script

    const lowerCommand = command.toLowerCase();

    const identityQuestions = [
      "what is your name",
      "who are you",
      "introduce yourself",

      "what is the help of you",
      "what things you can do",

      "what can you do",
      "help of you",
      "your name",

      "introduce",
      "who are",
      "what are you",
    ];

    if (identityQuestions.some((q) => lowerCommand.includes(q))) {
      const exactResponse =
        "Hello! I'm BrightMap AI, your General AI companion.\n\nMulti-language voice + photo navigation.\nText-based smart routing worldwide.\n\nHow can I help today?";

      setConversation((prev) => [
        ...prev,

        { type: "ai", message: exactResponse, timestamp: new Date() },
      ]);

      setAssistantMessage(exactResponse);

      setAssistantStatus("idle");

      speak(exactResponse);

      setIsProcessing(false);

      return;
    }

    const context = isNavigating
      ? `You are BrightMap AI's navigation co-pilot. The user is currently navigating and has full access to navigation context:



NAVIGATION CONTEXT:

- Current Location: ${
          currentPosition
            ? `${currentPosition[0].toFixed(6)}, ${currentPosition[1].toFixed(
                6
              )}`
            : "Unknown"
        }

- Navigation Journey: ${
          navigationOriginName && navigationDestinationName
            ? `From ${navigationOriginName} to ${navigationDestinationName}`
            : "Route information unavailable"
        }

- Navigation Origin: ${navigationOriginName || "Unknown starting point"}

- Navigation Destination: ${navigationDestinationName || "Unknown destination"}

- Travel Mode: ${travelMode}

- Current Navigation Step: ${activeStepIndex + 1} of ${navigationSteps.length}

- Next Instruction: ${
          navigationSteps[activeStepIndex]?.instruction || "Arriving soon"
        }

- Distance Remaining: ${
          selectedRoute
            ? formatDistance(
                selectedRoute.distance *
                  (1 - activeStepIndex / navigationSteps.length)
              )
            : "Unknown"
        }

- ETA: ${
          selectedRoute
            ? formatDuration(
                selectedRoute.duration *
                  (1 - activeStepIndex / navigationSteps.length)
              )
            : "Unknown"
        }

- Total Route Distance: ${
          selectedRoute ? formatDistance(selectedRoute.distance) : "Unknown"
        }

- Total Route Time: ${
          selectedRoute ? formatDuration(selectedRoute.duration) : "Unknown"
        }



INSTRUCTIONS: When the user asks for suggestions during navigation (like "best coffee shops" or "restaurants nearby"), provide location-specific recommendations based on their current position and route. Use the navigation context to give relevant suggestions along their route or near their current location. Always prioritize safety and convenience during travel.`
      : `You are BrightMap AI's travel assistant. The user is at ${
          currentPosition
            ? `${currentPosition[0].toFixed(6)}, ${currentPosition[1].toFixed(
                6
              )}`
            : "Unknown"
        }. No active navigation.`;

    try {
      const response = await (window as any).puter.ai.chat(
        `You are BrightMap AI, a General AI companion. ${context}.

IDENTITY RESPONSE - When users ask "what is your name", "who are you", "introduce yourself", "what is the help of you", "what things you can do", or similar identity questions, ALWAYS respond with exactly:
"Hello! I'm BrightMap AI, your General AI companion.

Multi-language voice + photo navigation.
Text-based smart routing worldwide.

How can I help today?"

RULES:
1. Be extremely concise but helpful.
2. Clinical, helpful tone focused on safety and journey awareness.
3. NEVER use units like 'meters', 'km', 'miles' - just use numbers.
4. If user asks for places during navigation, suggest locations based on their current position and route.
5. Always consider travel convenience and safety.
6. For identity questions, use the exact response specified above.

User Query: ${command}`
      );

      const aiMsg =
        typeof response === "string"
          ? response
          : response.message?.content || "I couldn't process that.";

      setConversation((prev) => [
        ...prev,

        { type: "ai", message: aiMsg, timestamp: new Date() },
      ]);

      setAssistantMessage(aiMsg);

      setAssistantStatus("idle");

      speak(aiMsg);
    } catch (error) {
      console.error("Puter AI error:", error);

      speak("I had trouble reaching the Puter AI service.");

      setAssistantStatus("idle");
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute AI Command

  const executeAICommand = async (command: any) => {
    switch (command.action) {
      case "search":
        setQuery(command.query);

        break;

      case "navigate":
        if (command.coords) {
          // [FIX] Efficiently use already-fetched coordinates from manual input

          await calculateRoute(
            command.coords.start,

            command.coords.end,

            command.mode || travelMode
          );
        } else {
          // [FIX] Parse route queries like "Delhi to Chennai" or "from Delhi to Chennai"

          const parseRouteQuery = (query: string) => {
            // Safety check for undefined query

            if (!query || typeof query !== "string") {
              return null;
            }

            // Handle various formats: "Delhi to Chennai", "from Delhi to Chennai", "Delhi-Chennai", etc.

            const normalized = query

              .toLowerCase()

              .replace(/from\s+/g, "")

              .replace(/-/g, " to ")

              .trim();

            // Look for "to" separator

            const toIndex = normalized.indexOf(" to ");

            if (toIndex !== -1) {
              const origin = normalized.substring(0, toIndex).trim();

              const destination = normalized.substring(toIndex + 4).trim();

              return { origin, destination };
            }

            // Fallback: try to split on common separators

            const separators = [" - ", " – ", " — ", ">", ">>"];

            for (const sep of separators) {
              if (normalized.includes(sep)) {
                const parts = normalized.split(sep);

                if (parts.length >= 2) {
                  return {
                    origin: parts[0].trim(),

                    destination: parts[1].trim(),
                  };
                }
              }
            }

            return null;
          };

          const route = parseRouteQuery(command.query);

          if (route) {
            try {
              // [FIX] Geocode origin and destination separately
              const [originResponse, destResponse] = await Promise.all([
                fetch(
                  `https://api.maptiler.com/geocoding/${encodeURIComponent(
                    route.origin
                  )}.json?key=${MAPTILER_KEY}&proximity=${
                    currentPosition
                      ? `${currentPosition[0]},${currentPosition[1]}`
                      : ""
                  }&country=IN&bbox=${
                    currentPosition
                      ? `${currentPosition[0] - 0.5},${
                          currentPosition[1] - 0.5
                        },${currentPosition[0] + 0.5},${
                          currentPosition[1] + 0.5
                        }`
                      : ""
                  }&language=en&types=address,poi,neighborhood,locality,place&limit=1`
                ),
                fetch(
                  `https://api.maptiler.com/geocoding/${encodeURIComponent(
                    route.destination
                  )}.json?key=${MAPTILER_KEY}&proximity=${
                    currentPosition
                      ? `${currentPosition[0]},${currentPosition[1]}`
                      : ""
                  }&country=IN&bbox=${
                    currentPosition
                      ? `${currentPosition[0] - 0.5},${
                          currentPosition[1] - 0.5
                        },${currentPosition[0] + 0.5},${
                          currentPosition[1] + 0.5
                        }`
                      : ""
                  }&language=en&types=address,poi,neighborhood,locality,place&limit=1`
                ),
              ]);

              const [originData, destData] = await Promise.all([
                originResponse.json(),
                destResponse.json(),
              ]);

              if (
                originData.features?.length > 0 &&
                destData.features?.length > 0
              ) {
                const originCoords =
                  originData.features[0].geometry.coordinates;
                const destCoords = destData.features[0].geometry.coordinates;

                // [FIX] Start navigation immediately without delay

                await calculateRoute(
                  [originCoords[0], originCoords[1]], // lng, lat

                  [destCoords[0], destCoords[1]], // lng, lat

                  command.mode || travelMode,

                  route.origin, // Pass origin name

                  route.destination // Pass destination name
                );

                setQuery(`${route.origin} to ${route.destination}`);

                setIsChatVisible(false);
              } else {
                speak(
                  `I couldn't find the locations ${route.origin} and ${route.destination}. Please try more specific place names.`
                );
              }
            } catch (error) {
              console.error("Geocoding error:", error);

              speak(
                "Sorry, there was an error finding those locations. Please try again."
              );
            }
          } else {
            // Single location geocoding (fallback for non-route queries)

            try {
              const response = await fetch(
                `https://api.maptiler.com/geocoding/${encodeURIComponent(
                  command.query
                )}.json?key=${MAPTILER_KEY}&limit=1`
              );

              const data = await response.json();

              if (data.features.length) {
                const coords = data.features[0].geometry.coordinates;

                await calculateRoute(
                  currentPosition || [-74.006, 40.7128],

                  coords,

                  command.mode || travelMode
                );

                setQuery(data.features[0].text || command.query);

                setIsChatVisible(false);
              } else {
                speak(
                  `I couldn't find ${command.query}. Please try a different place name.`
                );
              }
            } catch (err) {
              console.error("Single location geocoding error:", err);

              speak("Sorry, I couldn't find that location. Please try again.");
            }
          }
        }

        break;

      case "suggest":
        // Handle smart suggestions based on user context and location

        setQuery(command.query);

        // The AI will provide contextual suggestions based on location and previous conversation

        break;

      case "traffic":
        setShowTraffic(!showTraffic);

        break;

      case "satellite":
        setShowSatellite(!showSatellite);

        break;

      case "save":
        if (selectedLocation) {
          const newPlace: SavedPlace = {
            id: Date.now().toString(),

            name: selectedLocation.name,

            position: selectedLocation.position,

            address: selectedLocation.address || "",

            type: "favorite",

            icon: "⭐",
          };

          savePlaces([...savedPlaces, newPlace]);
        }

        break;
    }
  };

  // Local Command Processing (Fallback)

  const processCommandLocally = (command: string): string => {
    const lowerCommand = command.toLowerCase();

    if (
      lowerCommand.includes("hospital") ||
      lowerCommand.includes("emergency")
    ) {
      setQuery("hospital");

      setTimeout(() => handleSearch(), 500);

      return "Finding nearest hospitals near you...";
    }

    if (lowerCommand.includes("gas") || lowerCommand.includes("petrol")) {
      setQuery("gas station");

      setTimeout(() => handleSearch(), 500);

      return "Searching for gas stations nearby...";
    }

    if (lowerCommand.includes("restaurant") || lowerCommand.includes("food")) {
      setQuery("restaurant");

      setTimeout(() => handleSearch(), 500);

      return "Finding restaurants near you...";
    }

    if (lowerCommand.includes("coffee")) {
      setQuery("coffee shop");

      setTimeout(() => handleSearch(), 500);

      return "Searching for coffee shops nearby...";
    }

    if (lowerCommand.includes("home")) {
      const home = savedPlaces.find((p) => p.type === "home");

      if (home && currentPosition) {
        calculateRoute(currentPosition, home.position);

        return "Starting navigation to your home...";
      }
    }

    if (lowerCommand.includes("work")) {
      const work = savedPlaces.find((p) => p.type === "work");

      if (work && currentPosition) {
        calculateRoute(currentPosition, work.position);

        return "Starting navigation to your work...";
      }
    }

    if (lowerCommand.includes("traffic")) {
      setShowTraffic(!showTraffic);

      return showTraffic
        ? "Traffic layer hidden"
        : "Showing traffic conditions...";
    }

    if (lowerCommand.includes("satellite")) {
      setShowSatellite(!showSatellite);

      return showSatellite
        ? "Switching to map view"
        : "Switching to satellite view...";
    }

    return `I understand you want: ${command}. I can help you find places, get directions, or change map views.`;
  };

  // [FIX] Calculate Route using OSRM (Multi-modal)

  const calculateRoute = async (
    start: [number, number],

    end: [number, number],

    mode: "car" | "bike" | "foot" = travelMode,

    originName?: string,

    destinationName?: string
  ) => {
    if (!map) return;

    const profile =
      mode === "bike" ? "bicycle" : mode === "foot" ? "foot" : "car";

    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/${profile}/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson&steps=true`
      );
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const osrmRoute = data.routes[0];
        const calculatedRoute: Route = {
          id: Date.now(),
          distance: osrmRoute.distance,
          duration: osrmRoute.duration,
          trafficDelay: 0,
          geometry: osrmRoute.geometry,
        };

        const steps = osrmRoute.legs[0].steps.map((s: any) => ({
          instruction:
            s.maneuver.instruction ||
            s.name ||
            `${s.maneuver.type || "Proceed"} ${
              s.maneuver.modifier || ""
            }`.trim(),
          location: s.maneuver.location,
          distance: s.distance,
        }));

        setNavigationSteps(steps);
        setActiveStepIndex(0); // Start at first step

        setRoutes([calculatedRoute]);
        setSelectedRoute(calculatedRoute);
        displayRoute(calculatedRoute);
        setIsNavigating(true);

        if (originName) setNavigationOriginName(originName);
        if (destinationName) setNavigationDestinationName(destinationName);

        setNavigationOrigin(start);

        setDestinationPosition(end);

        const initialInstruction = steps[0]?.instruction || "Head straight";
        speak(
          `Navigation started to ${destinationQuery}. ${initialInstruction}.`
        );
      }
    } catch (error) {
      console.error("Route calculation error:", error);
      speak("Sorry, I couldn't calculate the route. Please try again.");
    }
  };

  // Display Route using MapLibre Source

  const displayRoute = (route: Route) => {
    if (!map || !route.geometry) return;

    // Clear existing route

    if (map.getLayer("route")) {
      map.removeLayer("route");
    }

    if (map.getSource("route")) {
      map.removeSource("route");
    }

    // Add route source and layer

    map.addSource("route", {
      type: "geojson",

      data: {
        type: "Feature",

        properties: {},

        geometry: route.geometry,
      },
    });

    map.addLayer({
      id: "route",

      type: "line",

      source: "route",

      paint: {
        "line-color": "#4285F4",

        "line-width": 6,

        "line-opacity": 0.8,
      },
    });

    // Fit map to route bounds

    if (window.maplibregl) {
      const bounds = new window.maplibregl.LngLatBounds();

      route.geometry.coordinates.forEach((coord: any) => bounds.extend(coord));

      map.fitBounds(bounds, { padding: 50 });
    }
  };

  // Text-to-Speech

  const speak = (text: string) => {
    if (!synthesis.current || isMuted) return;

    synthesis.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.rate = 0.9;

    utterance.pitch = 1.0;

    utterance.volume = 1.0;

    utterance.lang = "en-US";

    const voices = synthesis.current.getVoices();

    // Priority list of good female voices
    const preferredFemaleVoices = [
      "Google US English Female",
      "Microsoft Zira",
      "Microsoft Zira Desktop",
      "Samantha",
      "Karen",
      "Susan",
      "Tessa",
      "Veena",
    ];
    // Check for identity questions first
    const identityPatterns = [
      /who are you/i,
      /what is your name/i,
      /what are you/i,
      /introduce yourself/i,
      /tell me about yourself/i,
      /what's your name/i,
      /who r u/i,
      /who is brightmap/i,
      /what is brightmap/i,
      /who am i talking to/i,
      /what's your identity/i,
      /who are you\?/i,
      /what are you called/i,
      /can you introduce yourself/i,
      /what do you do/i,
      /who created you/i,
    ];
    // Find preferred female voice first
    let selectedVoice = null;
    for (const preferredName of preferredFemaleVoices) {
      selectedVoice = voices.find(
        (voice) =>
          voice.name.includes(preferredName) && voice.lang.startsWith("en")
      );
      if (selectedVoice) break;
    }

    // Fallback to any female voice
    if (!selectedVoice) {
      selectedVoice = voices.find(
        (voice) =>
          (voice.name.toLowerCase().includes("female") ||
            voice.name.includes("Samantha") ||
            voice.name.includes("Karen") ||
            voice.name.includes("Susan") ||
            voice.name.includes("Tessa") ||
            voice.name.includes("Veena")) &&
          voice.lang.startsWith("en")
      );
    }

    // Final fallback to any English voice
    if (!selectedVoice) {
      selectedVoice = voices.find((voice) => voice.lang.startsWith("en"));
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    synthesis.current.speak(utterance);
  };

  // Toggle Voice Listening (Unified)

  const toggleVoiceListening = () => {
    if (!recognition.current || isProcessing) return;

    // [FIX] Unified Microphone: Use Puter AI Co-pilot during navigation

    if (isNavigating) {
      handlePuterAI();

      return;
    }

    if (isListening) {
      recognition.current.stop();
    } else {
      try {
        recognition.current.start();
      } catch (error) {
        console.error("Error starting recognition:", error);
      }
    }
  };

  // Format Distance (Simplified Units per User Feedback)

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}`; // Removed 'km' for clinical look
    }

    return `${meters}`; // Removed 'm'
  };

  // Format Duration (Clinical Medical Style: 00:00:00 or just 00:00)

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);

    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}`;
    }

    return `${minutes}`;
  };

  // Clear All

  const clearAll = () => {
    setSearchResults([]);

    setQuery("");

    setSelectedLocation(null);

    setRoutes([]);

    setSelectedRoute(null);

    setNavigationOrigin(null); // Clear navigation origin coordinates

    setNavigationOriginName(""); // Clear navigation origin name

    setNavigationDestinationName(""); // Clear navigation destination name

    if (map && map.getLayer("route")) {
      map.removeLayer("route");

      map.removeSource("route");
    }
  };

  // Global Functions for Popup Buttons

  useEffect(() => {
    (window as any).brightmap = {
      navigateHere: (lng: number, lat: number) => {
        if (currentPosition) {
          calculateRoute(currentPosition, [lng, lat]);
        }
      },

      savePlace: (name: string, lng: number, lat: number) => {
        const newPlace: SavedPlace = {
          id: Date.now().toString(),

          name,

          position: [lng, lat],

          address: "",

          type: "favorite",

          icon: "⭐",
        };

        savePlaces([...savedPlaces, newPlace]);

        speak(`${name} has been saved to your places.`);
      },
    };
  }, [currentPosition, savedPlaces]);

  // Update Map Style (OpenStreetMap only)

  const updateMapStyle = () => {
    // OpenStreetMap doesn't support style switching - keeping 2D view

    if (!map) return;

    // Always use OpenStreetMap 2D view

    map.setStyle({
      version: 8,

      sources: {
        osm: {
          type: "raster",

          tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],

          tileSize: 256,

          attribution: "© OpenStreetMap contributors",
        },
      },

      layers: [
        {
          id: "osm",

          type: "raster",

          source: "osm",
        },
      ],
    });
  };

  // Update Map Pitch

  useEffect(() => {
    if (map) {
      map.setPitch(show3D ? 45 : 0);
    }
  }, [show3D, map]);

  // [FIX] Search with Debounce & AbortController (Fixed Race Condition)

  useEffect(() => {
    const controller = new AbortController();

    if (query.trim()) {
      handleSearch(controller.signal);
    } else {
      setSearchResults([]);
    }

    return () => {
      controller.abort();
    };
  }, [query, handleSearch]);

  // Main Render

  const renderPage = () => {
    if (currentPage === "map") {
      return (
        <>
          <AssistantOverlay />

          <InstructionOverlay />

          {/* Header (Hidden during navigation for clinical UI) */}

          {!isNavigating && (
            <div
              style={{
                position: "absolute",

                top: 0,

                left: 0,

                right: 0,

                height: "70px",

                background: darkMode ? "#2d2d2d" : "white",

                borderBottom: `1px solid ${darkMode ? "#444" : "#e0e0e0"}`,

                zIndex: 1000,

                display: "flex",

                alignItems: "center",

                padding: "0 20px",

                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  background: "none",

                  border: "none",

                  fontSize: "24px",

                  cursor: "pointer",

                  color: darkMode ? "white" : "#666",

                  marginRight: "15px",

                  display: "flex",

                  alignItems: "center",

                  justifyContent: "center",
                }}
                title="Open Menu"
              >
                ☰
              </button>

              <button
                onClick={() => {
                  setIsRoutingExpanded(false);

                  setSearchOpen(true);
                }}
                style={{
                  background: "none",

                  border: "none",

                  fontSize: "18px",

                  cursor: "pointer",

                  color: darkMode ? "white" : "#333",

                  marginRight: "10px",
                }}
                title="Search Places"
              >
                🔍
              </button>

              <h1
                style={{
                  margin: 0,

                  fontSize: "22px",

                  fontWeight: "bold",

                  background:
                    "linear-gradient(45deg, #4285F4, #34A853, #FBBC04, #EA4335)",

                  WebkitBackgroundClip: "text",

                  WebkitTextFillColor: "transparent",

                  backgroundClip: "text",

                  display: "flex",

                  alignItems: "center",

                  gap: "8px",

                  whiteSpace: "nowrap",
                }}
              >
                BrightMap AI
              </h1>

              <div
                style={{
                  display: "flex",

                  alignItems: "center",

                  gap: "10px",

                  marginLeft: "auto",
                }}
              >
                <button
                  onClick={toggleVoiceListening}
                  style={{
                    background: isListening
                      ? "#EA4335"
                      : isProcessing
                      ? "#3b82f6"
                      : "#34A853",

                    color: "white",

                    border: "none",

                    borderRadius: "50%",

                    width: "45px",

                    height: "45px",

                    cursor: "pointer",

                    fontSize: "20px",

                    transition: "all 0.3s",

                    boxShadow: isListening
                      ? "0 0 20px rgba(234, 67, 53, 0.5)"
                      : "0 2px 8px rgba(0,0,0,0.2)",

                    display: "flex",

                    alignItems: "center",

                    justifyContent: "center",
                  }}
                >
                  {isProcessing ? "⚙️" : isListening ? "🔴" : "🎤"}
                </button>

                <button
                  onClick={() => setDarkMode(!darkMode)}
                  style={{
                    background: darkMode ? "#444" : "#f0f0f0",

                    color: darkMode ? "white" : "#666",

                    border: "none",

                    borderRadius: "50%",

                    width: "40px",

                    height: "40px",

                    cursor: "pointer",

                    fontSize: "16px",
                  }}
                >
                  {darkMode ? "🌙" : "☀️"}
                </button>
              </div>
            </div>
          )}

          {searchOpen && (
            <div
              style={{
                position: "absolute",

                top: "80px",

                left: "20px",

                right: "20px",

                background: "transparent",

                borderRadius: "12px",

                zIndex: 1001,
              }}
              onClick={() => setSearchOpen(false)}
            >
              <div
                style={{
                  padding: "15px",

                  borderBottom: `1px solid ${darkMode ? "#444" : "#eee"}`,

                  display: "flex",

                  justifyContent: "space-between",

                  alignItems: "center",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);

                    if (e.target.value.trim() === "") setSearchResults([]);
                  }}
                  placeholder="Search places, addresses..."
                  style={{
                    flex: 1,

                    padding: "10px",

                    border: "none",

                    borderRadius: "8px",

                    fontSize: "16px",

                    background: darkMode ? "#3d3d3d" : "#f5f5f5",

                    color: darkMode ? "white" : "#333",
                  }}
                />

                <button
                  onClick={() => setSearchOpen(false)}
                  style={{
                    background: "none",

                    border: "none",

                    fontSize: "18px",

                    cursor: "pointer",

                    color: darkMode ? "white" : "#666",

                    marginLeft: "10px",
                  }}
                >
                  ✕
                </button>
              </div>

              {searchResults.length > 0 && (
                <div
                  style={{ maxHeight: "300px", overflow: "auto" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        selectLocation(result);

                        setSearchOpen(false);
                      }}
                      style={{
                        padding: "15px",

                        borderBottom: `1px solid ${darkMode ? "#444" : "#eee"}`,

                        cursor: "pointer",

                        color: darkMode ? "white" : "#333",
                      }}
                    >
                      <div style={{ fontWeight: "bold" }}>{result.name}</div>

                      <div
                        style={{
                          fontSize: "14px",

                          color: darkMode ? "#ccc" : "#666",
                        }}
                      >
                        {result.address}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {menuOpen && (
            <div
              style={{
                position: "absolute",

                top: 0,

                left: 0,

                width: "100%",

                height: "100%",

                background: "rgba(0,0,0,0.5)",

                zIndex: 15,

                display: "flex",

                justifyContent: "center",

                alignItems: "center",
              }}
              onClick={() => setMenuOpen(false)}
            >
              <div
                style={{
                  background: darkMode ? "#1a1a1a" : "white",

                  width: "90%",

                  height: "auto",

                  maxHeight: "500px",

                  borderRadius: "12px",

                  padding: "20px",

                  overflow: "auto",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Menu Header */}

                <div
                  style={{
                    height: "70px",

                    background: darkMode ? "#2d2d2d" : "white",

                    borderBottom: `1px solid ${darkMode ? "#444" : "#e0e0e0"}`,

                    display: "flex",

                    alignItems: "center",

                    padding: "0 20px",

                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                >
                  <button
                    onClick={() => setMenuOpen(false)}
                    style={{
                      background: "none",

                      border: "none",

                      fontSize: "24px",

                      cursor: "pointer",

                      color: darkMode ? "white" : "#666",

                      marginRight: "15px",

                      display: "flex",

                      alignItems: "center",

                      justifyContent: "center",
                    }}
                    title="Close Menu"
                  >
                    ✕
                  </button>

                  <h1
                    style={{
                      margin: 0,

                      fontSize: "22px",

                      fontWeight: "bold",

                      background:
                        "linear-gradient(45deg, #4285F4, #34A853, #FBBC04, #EA4335)",

                      WebkitBackgroundClip: "text",

                      WebkitTextFillColor: "transparent",

                      backgroundClip: "text",

                      display: "flex",

                      alignItems: "center",

                      gap: "8px",

                      whiteSpace: "nowrap",
                    }}
                  >
                    📋 BrightMap Menu
                  </h1>
                </div>

                {/* Left Side Zoom Controls - Below Menu Bar */}

                {!menuOpen && (
                  <div
                    style={{
                      position: "absolute",

                      top: "100px",

                      left: "20px",

                      display: "flex",

                      flexDirection: "column",

                      gap: "15px",

                      zIndex: 999,
                    }}
                  >
                    <button
                      onClick={() => {
                        if (map && map.getZoom() < 18) {
                          map.zoomIn();
                        }
                      }}
                      style={{
                        width: "44px",

                        height: "44px",

                        background: darkMode ? "#444" : "white",

                        color: darkMode ? "white" : "#666",

                        border: `1px solid ${darkMode ? "#555" : "#ddd"}`,

                        borderRadius: "8px",

                        cursor: "pointer",

                        fontSize: "18px",

                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",

                        display: "flex",

                        alignItems: "center",

                        justifyContent: "center",
                      }}
                      title="Zoom In"
                    >
                      +
                    </button>

                    <button
                      onClick={() => {
                        if (map && map.getZoom() > 10) {
                          map.zoomOut();
                        }
                      }}
                      style={{
                        width: "44px",

                        height: "44px",

                        background: darkMode ? "#444" : "white",

                        color: darkMode ? "white" : "#666",

                        border: `1px solid ${darkMode ? "#555" : "#ddd"}`,

                        borderRadius: "8px",

                        cursor: "pointer",

                        fontSize: "18px",

                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",

                        display: "flex",

                        alignItems: "center",

                        justifyContent: "center",
                      }}
                      title="Zoom Out"
                    >
                      -
                    </button>
                  </div>
                )}

                {/* Menu Content */}

                <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
                  <h1
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: darkMode ? "white" : "#333",
                      textAlign: "center",
                      margin: "0 0 20px 0",
                      padding: "16px",
                      background: darkMode ? "#3d3d3d" : "#f8f9fa",
                      borderRadius: "12px",
                      border: `1px solid ${darkMode ? "#444" : "#e0e0e0"}`,
                    }}
                  >
                    BrightMap AI - World First Pioneering Multi-Language Voice +
                    Photo Automatic Routing
                  </h1>

                  {/* Tabs */}

                  <div
                    style={{
                      display: "flex",

                      marginBottom: "20px",

                      borderBottom: `1px solid ${
                        darkMode ? "#444" : "#e0e0e0"
                      }`,
                    }}
                  >
                    {[
                      { id: "saved", label: "Saved", icon: "⭐" },

                      { id: "routes", label: "Routes", icon: "🧭" },

                      { id: "history", label: "History", icon: "📊" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        style={{
                          flex: 1,

                          padding: "16px 12px",

                          background:
                            activeTab === tab.id
                              ? darkMode
                                ? "#3d3d3d"
                                : "#f8f9fa"
                              : "transparent",

                          border: "none",

                          borderBottom:
                            activeTab === tab.id ? "3px solid #4285F4" : "none",

                          cursor: "pointer",

                          fontSize: "14px",

                          color:
                            activeTab === tab.id
                              ? "#4285F4"
                              : darkMode
                              ? "#ccc"
                              : "#666",

                          display: "flex",

                          flexDirection: "column",

                          alignItems: "center",

                          gap: "6px",

                          fontWeight: activeTab === tab.id ? "600" : "400",
                        }}
                      >
                        <span style={{ fontSize: "20px" }}>{tab.icon}</span>

                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}

                  <div style={{ padding: "0 10px" }}>
                    {activeTab === "saved" && (
                      <div>
                        <h3
                          style={{
                            margin: "0 0 20px 0",

                            color: darkMode ? "white" : "#333",

                            fontSize: "20px",
                          }}
                        >
                          ⭐ Saved Places
                        </h3>

                        {savedPlaces.length === 0 ? (
                          <div
                            style={{
                              textAlign: "center",

                              color: darkMode ? "#ccc" : "#666",

                              fontSize: "16px",

                              marginTop: "50px",
                            }}
                          >
                            No saved places yet. Save places from the map to see
                            them here.
                          </div>
                        ) : (
                          savedPlaces.map((place) => (
                            <div
                              key={place.id}
                              style={{
                                padding: "16px",

                                background: darkMode ? "#3d3d3d" : "#f8f9fa",

                                borderRadius: "12px",

                                marginBottom: "12px",

                                cursor: "pointer",

                                border: `1px solid ${
                                  darkMode ? "#444" : "#e0e0e0"
                                }`,

                                transition: "transform 0.2s",
                              }}
                              onClick={() => {
                                setCurrentPage("map");

                                if (currentPosition) {
                                  calculateRoute(
                                    currentPosition,

                                    place.position
                                  );
                                }

                                setMenuOpen(false);
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",

                                  alignItems: "center",

                                  gap: "12px",
                                }}
                              >
                                <span style={{ fontSize: "24px" }}>
                                  {place.icon}
                                </span>

                                <div style={{ flex: 1 }}>
                                  <div
                                    style={{
                                      fontWeight: "600",

                                      color: darkMode ? "white" : "#333",

                                      fontSize: "16px",

                                      marginBottom: "4px",
                                    }}
                                  >
                                    {place.name}
                                  </div>

                                  <div
                                    style={{
                                      fontSize: "14px",

                                      color: darkMode ? "#ccc" : "#666",
                                    }}
                                  >
                                    {place.address}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {activeTab === "routes" && (
                      <div>
                        <h3
                          style={{
                            margin: "0 0 20px 0",

                            color: darkMode ? "white" : "#333",

                            fontSize: "20px",
                          }}
                        >
                          🧭 Recent Routes
                        </h3>

                        <div
                          style={{
                            textAlign: "center",

                            color: darkMode ? "#ccc" : "#666",

                            fontSize: "16px",

                            marginTop: "50px",
                          }}
                        >
                          Your recent routes will appear here...
                        </div>
                      </div>
                    )}

                    {activeTab === "history" && (
                      <div>
                        <h3
                          style={{
                            margin: "0 0 20px 0",

                            color: darkMode ? "white" : "#333",

                            fontSize: "20px",
                          }}
                        >
                          📊 Location History
                        </h3>

                        <div
                          style={{
                            textAlign: "center",

                            color: darkMode ? "#ccc" : "#666",

                            fontSize: "16px",

                            marginTop: "50px",
                          }}
                        >
                          Your location history will appear here...
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* [NEW] Advanced Directions Panel */}

          <div
            style={{
              position: "absolute",

              top: "80px",

              left: "20px",

              width: "360px",

              background: darkMode ? "#2d2d2d" : "white",

              borderRadius: "12px",

              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",

              zIndex: 1000,

              padding: "15px",

              border: `1px solid ${darkMode ? "#444" : "#e0e0e0"}`,

              display: isRoutingExpanded ? "block" : "none",
            }}
          >
            <div
              style={{
                display: "flex",

                justifyContent: "space-between",

                marginBottom: "15px",
              }}
            >
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setTravelMode("car")}
                  style={{
                    padding: "8px",

                    border: "none",

                    borderRadius: "50%",

                    background:
                      travelMode === "car" ? "#4285F4" : "transparent",

                    cursor: "pointer",

                    fontSize: "18px",
                  }}
                  title="Drive"
                >
                  🚗
                </button>

                <button
                  onClick={() => setTravelMode("bike")}
                  style={{
                    padding: "8px",

                    border: "none",

                    borderRadius: "50%",

                    background:
                      travelMode === "bike" ? "#4285F4" : "transparent",

                    cursor: "pointer",

                    fontSize: "18px",
                  }}
                  title="Bicycle"
                >
                  🚲
                </button>

                <button
                  onClick={() => setTravelMode("foot")}
                  style={{
                    padding: "8px",

                    border: "none",

                    borderRadius: "50%",

                    background:
                      travelMode === "foot" ? "#4285F4" : "transparent",

                    cursor: "pointer",

                    fontSize: "18px",
                  }}
                  title="Walk"
                >
                  🏃
                </button>
              </div>

              <button
                onClick={() => {
                  const tempO = originQuery;

                  const tempD = destinationQuery;

                  setOriginQuery(tempD);

                  setDestinationQuery(tempO);
                }}
                style={{
                  padding: "8px",

                  border: "none",

                  borderRadius: "4px",

                  background: darkMode ? "#444" : "#f0f0f0",

                  cursor: "pointer",

                  fontSize: "16px",
                }}
                title="Swap"
              >
                ⇅
              </button>

              <button
                onClick={() => setIsRoutingExpanded(false)}
                style={{
                  background: "none",

                  border: "none",

                  fontSize: "14px",

                  cursor: "pointer",

                  color: darkMode ? "white" : "#666",
                }}
              >
                ✖
              </button>
            </div>

            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={originQuery}
                onChange={(e) => setOriginQuery(e.target.value)}
                placeholder="Choose start point..."
                style={{
                  width: "100%",

                  padding: "10px",

                  marginBottom: "10px",

                  borderRadius: "8px",

                  border: `1px solid ${darkMode ? "#444" : "#ddd"}`,

                  background: darkMode ? "#3d3d3d" : "white",

                  color: darkMode ? "white" : "black",
                }}
              />

              <input
                type="text"
                value={destinationQuery}
                onChange={(e) => setDestinationQuery(e.target.value)}
                placeholder="Choose destination..."
                style={{
                  width: "100%",

                  padding: "10px",

                  borderRadius: "8px",

                  border: `1px solid ${darkMode ? "#444" : "#ddd"}`,

                  background: darkMode ? "#3d3d3d" : "white",

                  color: darkMode ? "white" : "black",
                }}
              />
            </div>

            <button
              onClick={async () => {
                if (!destinationQuery) return;

                setIsProcessing(true);

                try {
                  let start: [number, number] | null = currentPosition;

                  let startName = "Your Location";

                  if (originQuery && originQuery !== "Your Location") {
                    const proximity = currentPosition
                      ? `&proximity=${currentPosition[0]},${currentPosition[1]}`
                      : "";

                    const res = await fetch(
                      `https://api.maptiler.com/geocoding/${encodeURIComponent(
                        originQuery
                      )}.json?key=${MAPTILER_KEY}${proximity}&limit=1`
                    );

                    const data = await res.json();

                    if (data.features.length) {
                      start = data.features[0].geometry.coordinates;

                      startName = data.features[0].text || originQuery;
                    }
                  }

                  const proximityD = currentPosition
                    ? `&proximity=${currentPosition[0]},${currentPosition[1]}`
                    : "";

                  const resD = await fetch(
                    `https://api.maptiler.com/geocoding/${encodeURIComponent(
                      destinationQuery
                    )}.json?key=${MAPTILER_KEY}${proximityD}&limit=1`
                  );

                  const dataD = await resD.json();

                  if (dataD.features.length) {
                    const end = dataD.features[0].geometry.coordinates;

                    const destName = dataD.features[0].text || destinationQuery;

                    if (start) {
                      // [FIX] Integrate with AI Voice/Logic

                      const aiMsg = `I've found a ${travelMode} route from ${startName} to ${destName}. Shall I start the navigation?`;

                      setConversation((prev) => [
                        ...prev,

                        {
                          type: "user",

                          message: `Directions from ${startName} to ${destName} via ${travelMode}`,

                          timestamp: new Date(),
                        },

                        { type: "ai", message: aiMsg, timestamp: new Date() },
                      ]);

                      speak(aiMsg);

                      setIsAwaitingConfirmation(true);

                      setPendingAction({
                        action: "navigate",

                        query: destName,

                        mode: travelMode,

                        origin: startName,

                        coords: { start, end },
                      });

                      setIsRoutingExpanded(false);
                    }
                  }
                } catch (err) {
                  console.error(err);

                  speak(
                    "I had trouble finding those locations. Please try again."
                  );
                } finally {
                  setIsProcessing(false);
                }
              }}
              style={{
                width: "100%",

                padding: "12px",

                marginTop: "15px",

                background: "#4285F4",

                color: "white",

                border: "none",

                borderRadius: "8px",

                fontWeight: "bold",

                cursor: "pointer",
              }}
            >
              Get Directions
            </button>
          </div>

          {/* Chat Overlay */}

          {chatOpen && (
            <div
              style={{
                position: "absolute",

                top: 0,

                left: 0,

                width: "100vw",

                height: "100vh",

                zIndex: 1100,

                background: darkMode ? "#1a1a1a" : "#f5f5f5",

                display: "flex",

                flexDirection: "column",
              }}
            >
              {/* Chat Header */}

              <div
                style={{
                  height: "70px",

                  background: darkMode ? "#2d2d2d" : "white",

                  borderBottom: `1px solid ${darkMode ? "#444" : "#e0e0e0"}`,

                  display: "flex",

                  alignItems: "center",

                  padding: "0 20px",
                }}
              >
                <button
                  onClick={() => setChatOpen(false)}
                  style={{
                    background: "none",

                    border: "none",

                    fontSize: "24px",

                    cursor: "pointer",

                    marginRight: "15px",
                  }}
                >
                  ←
                </button>

                <h2 style={{ margin: 0, color: darkMode ? "white" : "#333" }}>
                  BrightMap AI Chat
                </h2>

                <span
                  style={{
                    marginLeft: "16px",

                    fontSize: "14px",

                    color: "#FF6B35",

                    fontWeight: "600",

                    background: "linear-gradient(45deg, #FF6B35, #F7931E)",

                    WebkitBackgroundClip: "text",

                    WebkitTextFillColor: "transparent",

                    backgroundClip: "text",
                  }}
                >
                  🌟 World's First General AI Voice Navigation (130+ Languages)
                </span>
              </div>

              {/* Chat Messages */}

              <div
                style={{
                  flex: 1,

                  overflow: "auto",

                  padding: "20px",

                  display: "flex",

                  flexDirection: "column",

                  gap: "15px",
                }}
              >
                {conversation.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      alignSelf:
                        item.type === "user" ? "flex-end" : "flex-start",

                      maxWidth: "70%",

                      padding: "12px 16px",

                      borderRadius: "20px",

                      background:
                        item.type === "user"
                          ? "#4285F4"
                          : darkMode
                          ? "#333"
                          : "#f1f1f1",

                      color:
                        item.type === "user"
                          ? "white"
                          : darkMode
                          ? "white"
                          : "#333",
                    }}
                  >
                    {item.message}
                  </div>
                ))}

                {/* Navigation Confirmation Buttons */}

                {awaitingNavigationConfirmation &&
                  pendingNavigation &&
                  pendingNavigation.destination && (
                    <div
                      style={{
                        display: "flex",

                        gap: "12px",

                        marginTop: "16px",

                        justifyContent: "center",

                        padding: "16px",

                        background: darkMode ? "#2d2d2d" : "#f8f9fa",

                        borderRadius: "12px",

                        border: `1px solid ${darkMode ? "#444" : "#e0e0e0"}`,
                      }}
                    >
                      <button
                        onClick={async () => {
                          // Confirm navigation

                          setAwaitingNavigationConfirmation(false);

                          if (
                            !pendingNavigation ||
                            !pendingNavigation.destination
                          ) {
                            speak(
                              "Sorry, there was an error with the navigation request. Please try again."
                            );

                            setPendingNavigation(null);

                            return;
                          }

                          const navigationAction = {
                            action: "navigate",

                            query: pendingNavigation.destination,

                            mode: pendingNavigation.mode,

                            coords: pendingNavigation.coords,

                            requiresConfirmation: false,
                          };

                          setConversation((prev) => [
                            ...prev,

                            {
                              type: "ai",

                              message: `Confirmed! Starting navigation to ${pendingNavigation.destination} by ${pendingNavigation.mode}.`,

                              timestamp: new Date(),
                            },
                          ]);

                          speak(
                            `Confirmed! Starting navigation to ${pendingNavigation.destination} by ${pendingNavigation.mode}.`
                          );

                          // Execute navigation

                          await executeAICommand(navigationAction);

                          setPendingNavigation(null);
                        }}
                        style={{
                          padding: "12px 24px",

                          background: "#34A853",

                          color: "white",

                          border: "none",

                          borderRadius: "8px",

                          cursor: "pointer",

                          fontSize: "16px",

                          fontWeight: "600",

                          display: "flex",

                          alignItems: "center",

                          gap: "8px",

                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "scale(1.05)";

                          e.currentTarget.style.boxShadow =
                            "0 4px 12px rgba(52, 168, 83, 0.3)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1)";

                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        ✅ Confirm Navigation
                      </button>

                      <button
                        onClick={() => {
                          // Reject navigation

                          setAwaitingNavigationConfirmation(false);

                          setPendingNavigation(null);

                          setConversation((prev) => [
                            ...prev,

                            {
                              type: "ai",

                              message: "Navigation cancelled.",

                              timestamp: new Date(),
                            },
                          ]);

                          speak("Navigation cancelled.");
                        }}
                        style={{
                          padding: "12px 24px",

                          background: "#EA4335",

                          color: "white",

                          border: "none",

                          borderRadius: "8px",

                          cursor: "pointer",

                          fontSize: "16px",

                          fontWeight: "600",

                          display: "flex",

                          alignItems: "center",

                          gap: "8px",

                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "scale(1.05)";

                          e.currentTarget.style.boxShadow =
                            "0 4px 12px rgba(234, 67, 53, 0.3)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1)";

                          e.currentTarget.style.boxShadow = "none";
                        }}
                      ></button>
                    </div>
                  )}

                {/* Photo Destination Confirmation Buttons */}

                {pendingPhotoDestination && (
                  <div
                    style={{
                      display: "flex",

                      gap: "12px",

                      marginTop: "16px",

                      justifyContent: "center",

                      padding: "16px",

                      background: darkMode ? "#2d2d2d" : "#f8f9fa",

                      borderRadius: "12px",

                      border: `1px solid ${darkMode ? "#444" : "#e0e0e0"}`,
                    }}
                  >
                    <button
                      onClick={async () => {
                        // Confirm photo destination navigation

                        if (!currentPosition) {
                          speak("Please set your current location first.");

                          return;
                        }

                        const destination = pendingPhotoDestination.location;

                        const placeName = pendingPhotoDestination.placeName;

                        // Start navigation to photo-detected destination

                        await calculateRoute(
                          currentPosition,

                          destination,

                          travelMode,

                          `Current Location`,

                          placeName
                        );

                        setPendingPhotoDestination(null);
                      }}
                      style={{
                        padding: "12px 24px",

                        background: "#4285F4",

                        color: "white",

                        border: "none",

                        borderRadius: "8px",

                        cursor: "pointer",

                        fontSize: "16px",

                        fontWeight: "600",

                        display: "flex",

                        alignItems: "center",

                        gap: "8px",

                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.05)";

                        e.currentTarget.style.boxShadow =
                          "0 4px 12px rgba(66, 133, 244, 0.3)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";

                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      🧭 Navigate to {pendingPhotoDestination.placeName}
                    </button>

                    {pendingPhotoDestination.canOverride && (
                      <button
                        onClick={() => {
                          // Allow user to search for different location

                          setPendingPhotoDestination(null);

                          setConversation((prev) => [
                            ...prev,

                            {
                              type: "ai",

                              message:
                                "Please tell me the correct destination you'd like to navigate to.",

                              timestamp: new Date(),
                            },
                          ]);

                          speak(
                            "Please tell me the correct destination you'd like to navigate to."
                          );

                          // Open search mode

                          setSearchOpen(true);
                        }}
                        style={{
                          padding: "12px 24px",

                          background: "#FBBC04",

                          color: "#333",

                          border: "none",

                          borderRadius: "8px",

                          cursor: "pointer",

                          fontSize: "16px",

                          fontWeight: "600",

                          display: "flex",

                          alignItems: "center",

                          gap: "8px",

                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "scale(1.05)";

                          e.currentTarget.style.boxShadow =
                            "0 4px 12px rgba(251, 188, 4, 0.3)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1)";

                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        🔍 Search Different Location
                      </button>
                    )}

                    <button
                      onClick={() => {
                        // Reject photo destination

                        setPendingPhotoDestination(null);

                        setConversation((prev) => [
                          ...prev,

                          {
                            type: "ai",

                            message: "Photo destination navigation cancelled.",

                            timestamp: new Date(),
                          },
                        ]);

                        speak("Photo destination navigation cancelled.");
                      }}
                      style={{
                        padding: "12px 24px",

                        background: "#EA4335",

                        color: "white",

                        border: "none",

                        borderRadius: "8px",

                        cursor: "pointer",

                        fontSize: "16px",

                        fontWeight: "600",

                        display: "flex",

                        alignItems: "center",

                        gap: "8px",

                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.05)";

                        e.currentTarget.style.boxShadow =
                          "0 4px 12px rgba(234, 67, 53, 0.3)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";

                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      ❌ Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Chat Input */}

              <form
                onSubmit={(e) => {
                  e.preventDefault();

                  if (chatInput.trim()) {
                    handleVoiceCommand(chatInput);

                    setChatInput("");
                  }
                }}
              >
                <div
                  style={{
                    padding: "20px",

                    borderTop: `1px solid ${darkMode ? "#444" : "#e0e0e0"}`,

                    background: darkMode ? "#2d2d2d" : "white",
                  }}
                >
                  <div
                    style={{
                      display: "flex",

                      gap: "12px",

                      alignItems: "center",
                    }}
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask me anything about navigation..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();

                          if (chatInput.trim()) {
                            handleVoiceCommand(chatInput);

                            setChatInput("");
                          }
                        }
                      }}
                      style={{
                        flex: 1,

                        padding: "12px",

                        borderRadius: "25px",

                        border: `1px solid ${darkMode ? "#444" : "#ddd"}`,

                        background: darkMode ? "#333" : "white",

                        color: darkMode ? "white" : "#333",
                      }}
                    />

                    <button
                      type="submit"
                      disabled={!chatInput.trim()}
                      style={{
                        padding: "12px 20px",

                        borderRadius: "25px",

                        border: "none",

                        background: "#4285F4",

                        color: "white",

                        cursor: "pointer",
                      }}
                    >
                      Send
                    </button>

                    <button
                      onClick={handleCameraClick}
                      style={{
                        padding: "12px",

                        borderRadius: "50%",

                        border: "none",

                        background: "#34A853",

                        color: "white",

                        cursor: "pointer",

                        fontSize: "20px",
                      }}
                      title="Add Photo"
                    >
                      📷
                    </button>
                  </div>

                  {/* Camera Options Popup */}

                  {showCameraOptions && (
                    <div
                      style={{
                        position: "absolute",

                        bottom: "100px",

                        left: "50%",

                        transform: "translateX(-50%)",

                        background: darkMode ? "#2d2d2d" : "white",

                        borderRadius: "12px 12px 0 0",

                        padding: "20px",

                        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",

                        zIndex: 1000,

                        minWidth: "280px",
                      }}
                    >
                      <div
                        style={{
                          marginBottom: "15px",

                          color: darkMode ? "white" : "#333",

                          fontSize: "16px",

                          fontWeight: "600",
                        }}
                      >
                        Add Photo
                      </div>

                      <button
                        onClick={() => handlePhotoCapture("camera")}
                        style={{
                          width: "100%",

                          padding: "12px",

                          marginBottom: "10px",

                          background: "#4285F4",

                          color: "white",

                          border: "none",

                          borderRadius: "8px",

                          cursor: "pointer",

                          fontSize: "14px",
                        }}
                      >
                        📸 Take Photo
                      </button>

                      <button
                        onClick={() => handlePhotoCapture("gallery")}
                        style={{
                          width: "100%",

                          padding: "12px",

                          background: darkMode ? "#333" : "#f0f0f0",

                          color: darkMode ? "white" : "#333",

                          border: `1px solid ${darkMode ? "#444" : "#ddd"}`,

                          borderRadius: "8px",

                          cursor: "pointer",

                          fontSize: "14px",
                        }}
                      >
                        🖼️ Choose from Gallery
                      </button>

                      <button
                        onClick={() => setShowCameraOptions(false)}
                        style={{
                          width: "100%",

                          padding: "12px",

                          marginTop: "10px",

                          background: darkMode ? "#444" : "#f0f0f0",

                          color: darkMode ? "white" : "#666",

                          border: "none",

                          borderRadius: "8px",

                          cursor: "pointer",

                          fontSize: "14px",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Map Container */}

          <div
            ref={mapContainer}
            style={{
              width: "100%",

              height: "100%",

              paddingTop: "70px",

              background: darkMode ? "#1a1a1a" : "#f0f0f0",
            }}
          />

          {/* Loading Indicator */}

          {isLoading && (
            <div
              style={{
                position: "absolute",

                top: "50%",

                left: "50%",

                transform: "translate(-50%, -50%)",

                textAlign: "center",

                zIndex: 1001,
              }}
            >
              <div
                style={{
                  width: "60px",

                  height: "60px",

                  border: "4px solid #f3f3f3",

                  borderTop: "4px solid #4285F4",

                  borderRadius: "50%",

                  animation: "spin 1s linear infinite",

                  margin: "0 auto 20px",
                }}
              ></div>

              <div
                style={{
                  fontSize: "18px",

                  color: darkMode ? "white" : "#666",

                  fontWeight: "500",
                }}
              >
                Loading BrightMap AI...
              </div>
            </div>
          )}

          {/* Selected Location Panel */}

          {selectedLocation && !isNavigating && (
            <div
              style={{
                position: "absolute",

                bottom: "20px",

                left: "20px",

                right: "20px",

                maxWidth: "400px",

                margin: "0 auto",

                background: darkMode ? "#2d2d2d" : "white",

                borderRadius: "12px",

                boxShadow: "0 8px 32px rgba(0,0,0,0.15)",

                zIndex: 999,

                border: `1px solid ${darkMode ? "#444" : "#e0e0e0"}`,
              }}
            >
              <div
                style={{
                  padding: "15px",

                  borderBottom: `1px solid ${darkMode ? "#444" : "#eee"}`,

                  fontWeight: "bold",

                  background: darkMode ? "#3d3d3d" : "#f8f9fa",

                  borderRadius: "12px 12px 0 0",

                  color: darkMode ? "white" : "#333",
                }}
              >
                📍 {selectedLocation.name}
              </div>

              <div style={{ padding: "15px" }}>
                <div
                  style={{
                    fontSize: "13px",

                    color: darkMode ? "#ccc" : "#666",

                    marginBottom: "15px",
                  }}
                >
                  {selectedLocation.address}
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => {
                      if (currentPosition) {
                        calculateRoute(
                          currentPosition,

                          selectedLocation.position
                        );

                        setSelectedLocation(null);
                      }
                    }}
                    style={{
                      flex: 1,

                      padding: "10px",

                      background: "#4285F4",

                      color: "white",

                      border: "none",

                      borderRadius: "8px",

                      cursor: "pointer",

                      fontSize: "14px",

                      fontWeight: "500",
                    }}
                  >
                    🧭 Navigate
                  </button>

                  <button
                    onClick={() => {
                      const newPlace: SavedPlace = {
                        id: Date.now().toString(),

                        name: selectedLocation.name,

                        position: selectedLocation.position,

                        address: selectedLocation.address || "",

                        type: "favorite",

                        icon: "⭐",
                      };

                      savePlaces([...savedPlaces, newPlace]);

                      setSelectedLocation(null);

                      speak(
                        `${selectedLocation.name} has been saved to your places.`
                      );
                    }}
                    style={{
                      flex: 1,

                      padding: "10px",

                      background: "#34A853",

                      color: "white",

                      border: "none",

                      borderRadius: "8px",

                      cursor: "pointer",

                      fontSize: "14px",

                      fontWeight: "500",
                    }}
                  >
                    💾 Save
                  </button>

                  <button
                    onClick={() => setSelectedLocation(null)}
                    style={{
                      padding: "10px 16px",

                      background: darkMode ? "#444" : "#f0f0f0",

                      color: darkMode ? "white" : "#666",

                      border: "none",

                      borderRadius: "8px",

                      cursor: "pointer",

                      fontSize: "14px",
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Route Panel */}

          {/* Route Panel (Hidden by default, details moved to InstructionOverlay toggle) */}

          {selectedRoute && !isNavigating && false && (
            <div
              style={{
                position: "absolute",

                bottom: "20px",

                left: "20px",

                right: "20px",

                maxWidth: "500px",

                margin: "0 auto",

                background: darkMode ? "#2d2d2d" : "white",

                borderRadius: "12px",

                boxShadow: "0 8px 32px rgba(0,0,0,0.15)",

                zIndex: 999,

                border: `1px solid ${darkMode ? "#444" : "#e0e0e0"}`,
              }}
            >
              <div
                style={{
                  padding: "15px",

                  borderBottom: `1px solid ${darkMode ? "#444" : "#eee"}`,

                  fontWeight: "bold",

                  background: darkMode ? "#3d3d3d" : "#f8f9fa",

                  borderRadius: "12px 12px 0 0",

                  color: darkMode ? "white" : "#333",

                  display: "flex",

                  justifyContent: "space-between",

                  alignItems: "center",
                }}
              >
                <span>🧭 Route Details</span>

                <button
                  onClick={() => {
                    setSelectedRoute(null);

                    setIsNavigating(false);

                    if (map && map.getLayer("route")) {
                      map.removeLayer("route");

                      map.removeSource("route");
                    }
                  }}
                  style={{
                    background: "none",

                    border: "none",

                    fontSize: "18px",

                    cursor: "pointer",

                    color: darkMode ? "white" : "#666",
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: "15px" }}>
                <div
                  style={{
                    display: "grid",

                    gridTemplateColumns: "repeat(3, 1fr)",

                    gap: "15px",

                    marginBottom: "15px",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "24px",

                        fontWeight: "bold",

                        color: "#4285F4",
                      }}
                    >
                      {formatDistance(selectedRoute.distance)}
                    </div>

                    <div
                      style={{
                        fontSize: "12px",

                        color: darkMode ? "#ccc" : "#666",
                      }}
                    >
                      Distance
                    </div>
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "24px",

                        fontWeight: "bold",

                        color: "#34A853",
                      }}
                    >
                      {formatDuration(selectedRoute.duration)}
                    </div>

                    <div
                      style={{
                        fontSize: "12px",

                        color: darkMode ? "#ccc" : "#666",
                      }}
                    >
                      Duration
                    </div>
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "24px",

                        fontWeight: "bold",

                        color:
                          selectedRoute.trafficDelay > 300
                            ? "#EA4335"
                            : "#FBBC04",
                      }}
                    >
                      {formatDuration(selectedRoute.trafficDelay)}
                    </div>

                    <div
                      style={{
                        fontSize: "12px",

                        color: darkMode ? "#ccc" : "#666",
                      }}
                    >
                      Traffic
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => {
                      setIsNavigating(true);

                      speak(
                        `Starting navigation. Estimated arrival time is ${formatDuration(
                          selectedRoute.duration
                        )}`
                      );
                    }}
                    style={{
                      flex: 1,

                      padding: "12px",

                      background: "#4285F4",

                      color: "white",

                      border: "none",

                      borderRadius: "8px",

                      cursor: "pointer",

                      fontSize: "14px",

                      fontWeight: "500",
                    }}
                  >
                    🚀 Start Navigation
                  </button>

                  <button
                    onClick={() => {
                      setSelectedRoute(null);

                      setIsNavigating(false);

                      if (map && map.getLayer("route")) {
                        map.removeLayer("route");

                        map.removeSource("route");
                      }
                    }}
                    style={{
                      padding: "12px 16px",

                      background: darkMode ? "#444" : "#f0f0f0",

                      color: darkMode ? "white" : "#666",

                      border: "none",

                      borderRadius: "8px",

                      cursor: "pointer",

                      fontSize: "14px",
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Map Controls - Right Side */}

          <div
            style={{
              position: "absolute",

              top: "80px", // Positioned below the header

              right: "20px",

              display: "flex",

              flexDirection: "column",

              gap: "12px",

              zIndex: 1000,

              pointerEvents: "auto",
            }}
          >
            {/* Chat Button - Top */}

            <button
              onClick={() => setChatOpen(!chatOpen)}
              style={{
                width: "44px",

                height: "44px",

                background: chatOpen ? "#4285F4" : darkMode ? "#444" : "white",

                color: darkMode ? "white" : "#666",

                border: `1px solid ${darkMode ? "#555" : "#ddd"}`,

                borderRadius: "8px",

                cursor: "pointer",

                fontSize: "20px",

                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",

                display: "flex",

                alignItems: "center",

                justifyContent: "center",

                padding: 0,

                zIndex: 1002,
              }}
              title={chatOpen ? "Close Chat" : "Open Chat"}
            >
              {chatOpen ? "✕" : "💬"}
            </button>

            {/* Zoom Controls - Middle */}

            <div
              style={{
                display: "flex",

                flexDirection: "column",

                background: darkMode ? "#1a1a1a" : "white",

                borderRadius: "8px",

                overflow: "hidden",

                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",

                border: `1px solid ${darkMode ? "#333" : "#ddd"}`,

                zIndex: 1001,
              }}
            >
              <button
                onClick={() => map && map.zoomIn()}
                style={{
                  width: "44px",

                  height: "40px",

                  background: darkMode ? "#2a2a2a" : "white",

                  color: darkMode ? "#fff" : "#333",

                  border: "none",

                  borderBottom: `1px solid ${darkMode ? "#333" : "#eee"}`,

                  cursor: "pointer",

                  fontSize: "22px",

                  display: "flex",

                  alignItems: "center",

                  justifyContent: "center",

                  padding: 0,

                  lineHeight: 1,
                }}
                title="Zoom in"
              >
                +
              </button>

              <button
                onClick={() => map && map.zoomOut()}
                style={{
                  width: "44px",

                  height: "40px",

                  background: darkMode ? "#2a2a2a" : "white",

                  color: darkMode ? "#fff" : "#333",

                  border: "none",

                  cursor: "pointer",

                  fontSize: "22px",

                  display: "flex",

                  alignItems: "center",

                  justifyContent: "center",

                  padding: 0,

                  lineHeight: 1,
                }}
                title="Zoom out"
              >
                −
              </button>
            </div>

            {/* Location Button - Google Maps Style */}

            <div
              style={{
                width: "44px",

                height: "44px",

                borderRadius: "50%",

                background: "white",

                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",

                display: "flex",

                alignItems: "center",

                justifyContent: "center",

                cursor: "pointer",

                position: "relative",

                overflow: "visible",

                zIndex: 1000,

                border: "none",

                padding: 0,
              }}
            >
              <button
                onClick={getCurrentLocation}
                style={{
                  width: "36px",

                  height: "36px",

                  borderRadius: "50%",

                  background: "white",

                  border: "none",

                  cursor: "pointer",

                  display: "flex",

                  alignItems: "center",

                  justifyContent: "center",

                  position: "relative",

                  zIndex: 2,

                  padding: 0,

                  boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                }}
                title="My Location"
              >
                <div
                  style={{
                    width: "18px",

                    height: "18px",

                    borderRadius: "50%",

                    background: "#1a73e8",

                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",

                      top: "-2px",

                      left: "-2px",

                      right: "-2px",

                      bottom: "-2px",

                      borderRadius: "50%",

                      border: "2px solid #1a73e8",

                      opacity: 0,

                      animation: "pulse 2s infinite",
                    }}
                  ></div>
                </div>
              </button>

              <style>
                {
                  "@keyframes pulse { 0% { transform: scale(0.8); opacity: 0.7; } 70% { transform: scale(1.3); opacity: 0; } 100% { transform: scale(0.8); opacity: 0; } }"
                }
              </style>
            </div>

            {/* Compass Button - Google Maps Style */}

            <div
              style={{
                width: "44px",

                height: "44px",

                background: "white",

                borderRadius: "50%",

                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",

                display: "flex",

                alignItems: "center",

                justifyContent: "center",

                cursor: "pointer",

                position: "relative",

                overflow: "visible",

                zIndex: 1000,

                border: "none",

                padding: 0,
              }}
            >
              <button
                onClick={() => {
                  if (map) {
                    map.easeTo({
                      bearing: 0,

                      pitch: 0,

                      duration: 500,
                    });
                  }
                }}
                style={{
                  width: "36px",

                  height: "36px",

                  borderRadius: "50%",

                  background: "white",

                  border: "none",

                  cursor: "pointer",

                  display: "flex",

                  alignItems: "center",

                  justifyContent: "center",

                  position: "relative",

                  zIndex: 2,

                  padding: 0,

                  boxShadow: "0 1px 4px rgba(0,0,0,0.2)",

                  transform: map
                    ? `rotate(${map.getBearing() * -1}deg)`
                    : "rotate(0deg)",

                  transition: "transform 0.2s",
                }}
                title="Reset North"
              >
                <div
                  style={{
                    width: "18px",

                    height: "18px",

                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'%3E%3C/circle%3E%3Cpolygon points='16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76'%3E%3C/polygon%3E%3C/svg%3E")`,

                    backgroundSize: "contain",

                    backgroundRepeat: "no-repeat",

                    backgroundPosition: "center",
                  }}
                />
              </button>
            </div>
          </div>

          {/* [NEW] Puter AI Assistant FAB (Bottom Left) - Adjusted position and z-index */}

          {isNavigating && (
            <button
              onClick={handlePuterAI}
              style={{
                position: "fixed",

                bottom: "30px",

                left: "20px",

                width: "56px",

                height: "56px",

                background: isPuterListening ? "#EA4335" : "#4285F4",

                color: "white",

                border: "none",

                borderRadius: "50% 50% 50% 0", // Triangle-like shape

                cursor: "pointer",

                fontSize: "24px",

                boxShadow: isPuterListening
                  ? "0 0 20px rgba(234, 67, 53, 0.6)"
                  : "0 4px 12px rgba(0, 0, 0, 0.3)",

                display: "flex",

                alignItems: "center",

                justifyContent: "center",

                zIndex: 999, // Slightly lower than map controls

                transition: "all 0.3s",

                transform: `rotate(-45deg) ${
                  isPuterListening ? "scale(1.1)" : "scale(1)"
                }`,

                animation: isPuterListening ? "pulse 1.5s infinite" : "none",
              }}
            ></button>
          )}

          {/* Cancel Navigation Button */}

          <CancelNavigationButton />
        </>
      );
    } else if (currentPage === "menu") {
      return menuPage;
    } else {
      return null;
    }
  };

  return (
    <div
      style={{
        width: "100vw",

        height: "100vh",

        position: "relative",

        fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",

        overflow: "hidden",

        background: darkMode ? "#1a1a1a" : "#f5f5f5",
      }}
    >
      {renderPage()}
    </div>
  );
}
