
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { UserSettingsProvider } from "@/contexts/UserSettingsContext";
import { adService } from "@/services/adService";
import { Capacitor } from '@capacitor/core';
import { toast } from "@/lib/toast";

// Pages
import Poems from "./pages/Poems";
import Search from "./pages/Search";
import PoemDetails from "./pages/PoemDetails";
import LikedPoems from "./pages/LikedPoems";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Books from "./pages/Books";
import BookDetails from "./pages/BookDetails";
import LikedBooks from "./pages/LikedBooks";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";

// Components
import Navbar from "./components/Navbar";
import SplashScreen from "./components/SplashScreen";
import OfflineNotice from "./components/OfflineNotice";
import FirstTimeModal from "./components/FirstTimeModal";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// RouteTracker component to track navigation and show ads
const RouteTracker = () => {
  const location = useLocation();
  
  useEffect(() => {
    console.log("Route changed to:", location.pathname);
    
    // Check if the current route is a content detail page (poem or book details)
    if (location.pathname.includes('poem-details') || location.pathname.includes('book-details')) {
      console.log("Content detail page detected, tracking for ads");
      // Track content open for ad frequency
      adService.trackContentOpen().catch(error => {
        console.error("Error tracking content open for ads:", error);
      });
    }
  }, [location.pathname]);
  
  return null;
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);
  const [showFirstTimeModal, setShowFirstTimeModal] = useState(false);
  const [adsInitialized, setAdsInitialized] = useState(false);
  const [lastActiveTime, setLastActiveTime] = useState(Date.now());

  const hideSplash = () => {
    console.log("Splash screen completed, showing main app");
    setShowSplash(false);
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineNotice(false);
      toast.success("You're back online");
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("You're offline. Some features may be limited.");
      
      if (!showSplash) {
        setTimeout(() => {
          if (!navigator.onLine) {
            setShowOfflineNotice(true);
          }
        }, 2000);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showSplash]);

  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem("hasVisitedBefore");
    if (!hasVisitedBefore && !window.location.pathname.includes("privacy")) {
      setShowFirstTimeModal(true);
    }
    
    document.documentElement.classList.add('dark');
    
    setIsLoaded(true);
    console.log("App component mounted");
    
    const initAds = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          console.log("Initializing ads");
          await adService.initialize();
          setAdsInitialized(true);
          // Show banner ad after initialization
          await adService.showBanner();
          console.log("Ads initialized successfully");
        } catch (error) {
          console.error('Error initializing ads:', error);
          // Retry ad initialization after a delay
          setTimeout(async () => {
            try {
              console.log("Retrying ad initialization...");
              await adService.initialize();
              setAdsInitialized(true);
              await adService.showBanner();
              console.log("Ads initialized successfully on retry");
            } catch (retryError) {
              console.error('Error on retry of ad initialization:', retryError);
            }
          }, 3000);
        }
      } else {
        console.log("Not a native platform, skipping ad initialization");
      }
    };
    
    if (!showSplash) {
      initAds();
    }

    // Handle page visibility changes for App Open ads
    const handleVisibilityChange = () => {
      if (Capacitor.isNativePlatform() && adsInitialized) {
        if (document.visibilityState === 'visible') {
          const now = Date.now();
          // Only show App Open ad if the app was in background for at least 30 seconds
          if (now - lastActiveTime > 30000) {
            console.log("App became visible after being hidden, showing App Open ad");
            adService.showAppOpenAd().catch(console.error);
          }
        } else {
          // App going to background, update last active time
          setLastActiveTime(Date.now());
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (Capacitor.isNativePlatform()) {
        adService.removeBanner().catch(console.error);
      }
    };
  }, [showSplash, adsInitialized, lastActiveTime]);

  const handleOfflineRetry = () => {
    if (navigator.onLine) {
      setShowOfflineNotice(false);
      queryClient.invalidateQueries();
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <UserSettingsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {showSplash && !window.location.pathname.includes("privacy") && !window.location.pathname.includes("terms") && (
            <SplashScreen onComplete={hideSplash} />
          )}
          {!showSplash && (
            <>
              {showOfflineNotice ? (
                <div className="h-screen">
                  <OfflineNotice onRetry={handleOfflineRetry} />
                </div>
              ) : (
                <>
                  <div className="pb-20">
                    <Routes>
                      <Route path="/" element={<Navigate to="/books" replace />} />
                      <Route path="/poems" element={<Poems />} />
                      <Route path="/search" element={<Search />} />
                      <Route path="/poem-details" element={<PoemDetails />} />
                      <Route path="/liked-poems" element={<LikedPoems />} />
                      <Route path="/liked-books" element={<LikedBooks />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/books" element={<Books />} />
                      <Route path="/book-details" element={<BookDetails />} />
                      <Route path="/privacy" element={<PrivacyPolicy />} />
                      <Route path="/terms" element={<TermsConditions />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                    {/* Add RouteTracker to monitor route changes and show ads */}
                    <RouteTracker />
                  </div>
                  {!window.location.pathname.includes("privacy") && !window.location.pathname.includes("terms") && (
                    <>
                      {/* Add padding to ensure space for both the ad and navbar */}
                      <div id="ad-container" className="mb-20"></div>
                      <Navbar />
                    </>
                  )}
                </>
              )}
            </>
          )}
          
          {showFirstTimeModal && (
            <FirstTimeModal 
              onAccept={() => {
                localStorage.setItem("hasVisitedBefore", "true");
                setShowFirstTimeModal(false);
              }}
              onClose={() => setShowFirstTimeModal(false)}
            />
          )}
        </TooltipProvider>
      </UserSettingsProvider>
    </QueryClientProvider>
  );
};

export default App;
