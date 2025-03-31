
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
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

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);
  const [showFirstTimeModal, setShowFirstTimeModal] = useState(false);
  const [adsInitialized, setAdsInitialized] = useState(false);

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
      if (Capacitor.getPlatform() === 'android') {
        try {
          console.log("Initializing ads");
          await adService.initialize();
          setAdsInitialized(true);
          console.log("Ads initialized successfully");
        } catch (error) {
          console.error('Error initializing ads:', error);
        }
      }
    };
    
    if (!showSplash) {
      initAds();
    }
    
    return () => {
      if (Capacitor.getPlatform() === 'android') {
        adService.removeBanner().catch(console.error);
      }
    };
  }, [showSplash]);

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
                  </div>
                  {!window.location.pathname.includes("privacy") && !window.location.pathname.includes("terms") && (
                    <>
                      <div id="ad-container" className="mb-16"></div>
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
