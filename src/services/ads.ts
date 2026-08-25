import AsyncStorage from '@react-native-async-storage/async-storage';
import mobileAds, {AdsConsent, AdEventType, InterstitialAd} from 'react-native-google-mobile-ads';import Constants from 'expo-constants';

const production=Constants.expoConfig?.extra?.appEnv==='production';
export const adIds={
  banner: !production?'ca-app-pub-3940256099942544/9214589741':'ca-app-pub-4506776618810594/5514409454',
  interstitial: !production?'ca-app-pub-3940256099942544/1033173712':'ca-app-pub-4506776618810594/5319073539'
};
let started=false;
export async function initializeAds(){try{await AdsConsent.requestInfoUpdate();const info=await AdsConsent.loadAndShowConsentFormIfRequired();if(info.canRequestAds&&!started){started=true;await mobileAds().initialize();return true;}const prior=await AdsConsent.getConsentInfo();if(prior.canRequestAds&&!started){started=true;await mobileAds().initialize();return true;}return prior.canRequestAds;}catch{if(!started){try{started=true;await mobileAds().initialize();return true}catch{}}return false}}
export async function showPrivacyOptions(){try{await AdsConsent.showPrivacyOptionsForm();return true}catch{return false}}
export async function maybeShowInterstitial(){try{const now=Date.now();const raw=await AsyncStorage.getItem('ad_frequency');const s=raw?JSON.parse(raw):{last:0,actions:0};s.actions=(s.actions||0)+1;const eligible=now-(s.last||0)>8*60*1000&&s.actions>=4;if(!eligible){await AsyncStorage.setItem('ad_frequency',JSON.stringify(s));return false}const ad=InterstitialAd.createForAdRequest(adIds.interstitial);return await new Promise<boolean>(resolve=>{let done=false;const finish=(v:boolean)=>{if(done)return;done=true;resolve(v)};const unLoad=ad.addAdEventListener(AdEventType.LOADED,()=>ad.show());const unClose=ad.addAdEventListener(AdEventType.CLOSED,async()=>{s.last=Date.now();s.actions=0;await AsyncStorage.setItem('ad_frequency',JSON.stringify(s));unLoad();unClose();unErr();finish(true)});const unErr=ad.addAdEventListener(AdEventType.ERROR,()=>{unLoad();unClose();unErr();finish(false)});ad.load();setTimeout(()=>finish(false),4500)});}catch{return false}}
