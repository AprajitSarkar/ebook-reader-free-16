
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Volume2, Moon, Info, BookOpen, Shield, FileText, ExternalLink, Play } from "lucide-react";
import { useUserSettings } from "@/contexts/UserSettingsContext";
import { VoiceOption, speechService } from "@/services/speechService";
import { toast } from "@/lib/toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Capacitor } from '@capacitor/core';

const Settings = () => {
  const navigate = useNavigate();
  const { settings, updateVoice, toggleOfflineMode, testVoice } = useUserSettings();
  const [allVoices, setAllVoices] = useState<VoiceOption[]>([]);
  const [showClearDataDialog, setShowClearDataDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial voice loading with error handling
    try {
      const initialVoices = speechService.getVoices();
      setAllVoices(initialVoices);
      console.log("Initial voices loaded:", initialVoices.length);
    } catch (error) {
      console.error("Error loading initial voices:", error);
    } finally {
      // Always mark as loaded to prevent infinite loading
      setTimeout(() => setIsLoading(false), 500);
    }
    
    const checkForVoices = () => {
      try {
        const voices = speechService.getVoices();
        if (voices.length > allVoices.length) {
          console.log(`Voice count changed from ${allVoices.length} to ${voices.length}`);
          setAllVoices(voices);
        }
      } catch (error) {
        console.error("Error checking for voices:", error);
      }
    };
    
    const intervalId = setInterval(checkForVoices, 1000);
    
    // Voice initialization workaround for Android
    if (Capacitor.isNativePlatform() || /Android/i.test(navigator.userAgent)) {
      try {
        const dummyUtterance = new SpeechSynthesisUtterance("");
        window.speechSynthesis.speak(dummyUtterance);
        window.speechSynthesis.cancel();
        
        // Give more time for Android to initialize voices
        setTimeout(checkForVoices, 1000);
      } catch (error) {
        console.error("Error initializing speech synthesis:", error);
      }
    }
    
    return () => clearInterval(intervalId);
  }, [allVoices.length]);

  const handleVoiceChange = (voiceId: string) => {
    try {
      if (voiceId === "default") {
        updateVoice(null);
        toast.success("Voice updated to System Default");
      } else {
        const selectedVoice = allVoices.find(voice => voice.id === voiceId) || null;
        updateVoice(selectedVoice);
        toast.success(`Voice updated to ${selectedVoice?.name || "Default"}`);
      }
    } catch (error) {
      console.error("Error changing voice:", error);
      toast.error("Failed to update voice");
    }
  };

  const handleOfflineToggle = (enabled: boolean) => {
    try {
      toggleOfflineMode(enabled);
      toast.success(`Offline mode ${enabled ? "enabled" : "disabled"}`);
    } catch (error) {
      console.error("Error toggling offline mode:", error);
      toast.error("Failed to toggle offline mode");
    }
  };

  const handleTestVoice = () => {
    try {
      console.log("Testing voice with settings:", settings);
      testVoice();
      toast.info("Testing voice...");
    } catch (error) {
      console.error("Error testing voice:", error);
      toast.error("Failed to test voice");
    }
  };

  const clearAllUserData = () => {
    try {
      localStorage.removeItem("likedPoems");
      localStorage.removeItem("likedBooks");
      localStorage.removeItem("searchHistory");
      
      toast.success("All user data cleared successfully");
      setShowClearDataDialog(false);
    } catch (error) {
      console.error("Error clearing user data:", error);
      toast.error("Failed to clear user data");
    }
  };

  // Filter voices if available
  const offlineVoices = allVoices.filter(voice => !voice.isOnlineOnly);
  const onlineVoices = allVoices.filter(voice => voice.isOnlineOnly);
  
  // Display a loading message while initializing
  if (isLoading) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-5 pb-28">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Settings</h1>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="flex items-center justify-center h-40">
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-3xl mx-auto px-4 py-5 pb-28">
      <div className="sticky top-0 z-10 bg-background pt-2 pb-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Settings</h1>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>
      
      <div className="space-y-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-primary" />
              Voice Settings
            </CardTitle>
            <CardDescription>
              Configure text-to-speech preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="voice-selection">Voice Selection</Label>
              <Select 
                value={settings.preferredVoice?.id || "default"} 
                onValueChange={handleVoiceChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">System Default</SelectItem>
                  
                  {offlineVoices.length > 0 && (
                    <>
                      <Separator className="my-1" />
                      <div className="px-2 py-1 text-xs text-muted-foreground">Offline Voices</div>
                      {offlineVoices.map(voice => (
                        <SelectItem 
                          key={voice.id} 
                          value={voice.id}
                        >
                          {voice.name} ({voice.gender === "female" ? "F" : "M"})
                        </SelectItem>
                      ))}
                    </>
                  )}
                  
                  {onlineVoices.length > 0 && (
                    <>
                      <Separator className="my-1" />
                      <div className="px-2 py-1 text-xs text-muted-foreground">Online Voices</div>
                      {onlineVoices.map(voice => (
                        <SelectItem 
                          key={voice.id} 
                          value={voice.id}
                        >
                          {voice.name} ({voice.gender === "female" ? "F" : "M"})
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
              
              <div className="text-xs text-muted-foreground mt-1">
                Selected: {settings.preferredVoice?.name || "System Default"}
                {allVoices.length === 0 && " (No voices detected)"}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={handleTestVoice}
              >
                <Play className="h-4 w-4 mr-2" />
                Test Voice
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="offline-mode" className="block mb-1">Offline Voice Mode</Label>
                <span className="text-xs text-muted-foreground">
                  Use device voices that work offline
                </span>
              </div>
              <Switch 
                id="offline-mode" 
                checked={settings.useOfflineVoice}
                onCheckedChange={handleOfflineToggle}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              About
            </CardTitle>
            <CardDescription>
              App information and legal documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate("/privacy")}
            >
              <Shield className="h-4 w-4 mr-2" />
              Privacy Policy
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate("/terms")}
            >
              <FileText className="h-4 w-4 mr-2" />
              Terms & Conditions
            </Button>

            <div className="pt-2">
              <h4 className="text-sm font-medium mb-2">API Credits</h4>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-1 text-xs">
                  <BookOpen className="h-3 w-3" />
                  Books provided by:
                  <a 
                    href="https://gutendex.com/" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-primary flex items-center"
                  >
                    Gutendex API
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </p>
                <p className="flex items-center gap-1 text-xs">
                  <FileText className="h-3 w-3" />
                  Poems provided by:
                  <a 
                    href="https://poetrydb.org/" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-primary flex items-center"
                  >
                    PoetryDB
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Moon className="h-5 w-5" />
              User Data
            </CardTitle>
            <CardDescription>
              Manage your saved data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={() => setShowClearDataDialog(true)}
            >
              Clear All User Data
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              This will remove all your liked poems, books, and search history.
            </p>
          </CardContent>
        </Card>
        
        <div className="text-center text-xs text-muted-foreground py-6">
          <p>eBook Library</p>
          <p>Version 1.1.0</p>
          <p>© 2024 Aprajit Sarkar</p>
        </div>
      </div>

      <AlertDialog open={showClearDataDialog} onOpenChange={setShowClearDataDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear user data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all your saved books, poems, and search history.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={clearAllUserData}>
              Clear Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
