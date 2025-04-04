
import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, AdOptions, AdLoadInfo, InterstitialAdPluginEvents } from '@capacitor-community/admob';

const APP_ID = {
  android: 'ca-app-pub-3279473081670891~9908825517',
  ios: 'ca-app-pub-3279473081670891~9908825517', // Using the same ID for iOS for now
};

const BANNER_ID = {
  android: 'ca-app-pub-3279473081670891/1003101920',
  ios: 'ca-app-pub-3279473081670891/1003101920', // Using the same ID for iOS for now
};

const INTERSTITIAL_ID = {
  android: 'ca-app-pub-3279473081670891/4073916578', // Updated interstitial ID
  ios: 'ca-app-pub-3279473081670891/4073916578', // Using the same ID for iOS for now
};

const APP_OPEN_ID = {
  android: 'ca-app-pub-3279473081670891/2827582812',
  ios: 'ca-app-pub-3279473081670891/2827582812', // Using the same ID for iOS for now
};

// Track content opens for interstitial ads
let contentOpenCount = 0;
const INTERSTITIAL_FREQUENCY = 2; // Show interstitial every X content opens
let isInterstitialLoaded = false;
let isAppOpenAdLoaded = false;

interface AdMobService {
  initialize: () => Promise<void>;
  showBanner: () => Promise<void>;
  removeBanner: () => Promise<void>;
  prepareInterstitial: () => Promise<void>;
  showInterstitial: () => Promise<void>;
  trackContentOpen: () => Promise<void>;
  prepareAppOpenAd: () => Promise<void>;
  showAppOpenAd: () => Promise<void>;
}

export const adService: AdMobService = {
  initialize: async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        console.log("Initializing AdMob...");
        // Remove requestTrackingAuthorization and initializeForTesting
        await AdMob.initialize({});
        
        // Set up event listeners for interstitial ads
        AdMob.addListener(InterstitialAdPluginEvents.Loaded, (info: AdLoadInfo) => {
          console.log("Interstitial loaded with info:", info);
          isInterstitialLoaded = true;
        });

        AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
          console.log("Interstitial dismissed");
          isInterstitialLoaded = false;
          // Prepare the next interstitial
          adService.prepareInterstitial().catch(console.error);
        });
        
        // Prepare interstitial and app open ad on initialization
        await adService.prepareInterstitial();
        await adService.prepareAppOpenAd();
        
        console.log("AdMob initialized successfully");
        return Promise.resolve();
      } catch (error) {
        console.error("Error initializing AdMob:", error);
        return Promise.reject(error);
      }
    }
    return Promise.resolve();
  },

  showBanner: async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const platform = Capacitor.getPlatform();
        console.log(`Showing banner ad for platform: ${platform}`);
        
        // Configure banner options - Position adjusted to appear above the navbar
        const options: BannerAdOptions = {
          adId: platform === 'android' ? BANNER_ID.android : BANNER_ID.ios,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 60, // Increased margin to position well above the navbar for better visibility
        };
        
        // Show the banner
        await AdMob.showBanner(options);
        console.log("AdMob banner shown with options:", options);
        return Promise.resolve();
      } catch (error) {
        console.error("Error showing banner ad:", error);
        return Promise.reject(error);
      }
    }
    return Promise.resolve();
  },

  removeBanner: async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await AdMob.removeBanner();
        console.log("AdMob banner removed");
        return Promise.resolve();
      } catch (error) {
        console.error("Error removing banner ad:", error);
        return Promise.reject(error);
      }
    }
    return Promise.resolve();
  },

  prepareInterstitial: async () => {
    if (Capacitor.isNativePlatform() && !isInterstitialLoaded) {
      try {
        const platform = Capacitor.getPlatform();
        console.log(`Preparing interstitial ad for platform: ${platform}`);
        
        const options: AdOptions = {
          adId: platform === 'android' ? INTERSTITIAL_ID.android : INTERSTITIAL_ID.ios,
        };
        
        // Prepare the interstitial
        await AdMob.prepareInterstitial(options);
        console.log("Interstitial ad prepared with ID:", options.adId);
        return Promise.resolve();
      } catch (error) {
        console.error("Error preparing interstitial ad:", error);
        isInterstitialLoaded = false;
        return Promise.reject(error);
      }
    }
    return Promise.resolve();
  },

  showInterstitial: async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        if (!isInterstitialLoaded) {
          console.log("Interstitial not loaded yet, preparing now...");
          await adService.prepareInterstitial();
          // Add a small delay to ensure the ad is ready
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log("Showing interstitial ad");
        const result = await AdMob.showInterstitial();
        console.log("AdMob interstitial shown with result:", result);
        isInterstitialLoaded = false;
        
        // Prepare the next interstitial in advance
        setTimeout(() => {
          adService.prepareInterstitial().catch(console.error);
        }, 1000);
        
        return Promise.resolve();
      } catch (error) {
        console.error("Error showing interstitial ad:", error);
        isInterstitialLoaded = false;
        
        // Attempt to prepare again
        setTimeout(() => {
          adService.prepareInterstitial().catch(console.error);
        }, 2000);
        
        return Promise.reject(error);
      }
    }
    return Promise.resolve();
  },

  trackContentOpen: async () => {
    contentOpenCount += 1;
    console.log(`Content opened ${contentOpenCount} times`);
    
    // Show interstitial every INTERSTITIAL_FREQUENCY content opens
    if (contentOpenCount % INTERSTITIAL_FREQUENCY === 0) {
      console.log(`Frequency threshold reached (${INTERSTITIAL_FREQUENCY}), showing interstitial ad`);
      try {
        await adService.showInterstitial();
      } catch (error) {
        console.error("Error showing frequency-based interstitial:", error);
        // If showing fails, prepare for next time
        setTimeout(() => {
          adService.prepareInterstitial().catch(console.error);
        }, 2000);
      }
    } else if (!isInterstitialLoaded) {
      // Ensure we always have an interstitial ready
      adService.prepareInterstitial().catch(console.error);
    }
    return Promise.resolve();
  },

  prepareAppOpenAd: async () => {
    if (Capacitor.isNativePlatform() && !isAppOpenAdLoaded) {
      try {
        const platform = Capacitor.getPlatform();
        console.log(`Preparing App Open ad for platform: ${platform}`);
        
        // Use the existing AdOptions interface with App Open ad ID
        const options: AdOptions = {
          adId: platform === 'android' ? APP_OPEN_ID.android : APP_OPEN_ID.ios,
        };
        
        // Use prepareInterstitial method but with App Open ad ID
        // since the API is similar
        await AdMob.prepareInterstitial(options);
        console.log("App Open ad prepared with ID:", options.adId);
        isAppOpenAdLoaded = true;
        return Promise.resolve();
      } catch (error) {
        console.error("Error preparing App Open ad:", error);
        isAppOpenAdLoaded = false;
        return Promise.reject(error);
      }
    }
    return Promise.resolve();
  },

  showAppOpenAd: async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        if (!isAppOpenAdLoaded) {
          console.log("App Open ad not loaded yet, preparing now...");
          await adService.prepareAppOpenAd();
          // Add a small delay to ensure the ad is ready
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log("Showing App Open ad");
        // Use showInterstitial method since they function similarly
        const result = await AdMob.showInterstitial();
        console.log("AdMob App Open ad shown with result:", result);
        isAppOpenAdLoaded = false;
        
        // Prepare the next App Open ad in advance
        setTimeout(() => {
          adService.prepareAppOpenAd().catch(console.error);
        }, 1000);
        
        return Promise.resolve();
      } catch (error) {
        console.error("Error showing App Open ad:", error);
        isAppOpenAdLoaded = false;
        
        // Attempt to prepare again
        setTimeout(() => {
          adService.prepareAppOpenAd().catch(console.error);
        }, 2000);
        
        return Promise.reject(error);
      }
    }
    return Promise.resolve();
  }
};
