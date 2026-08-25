import * as Notifications from 'expo-notifications';
Notifications.setNotificationHandler({handleNotification:async()=>({shouldShowBanner:true,shouldShowList:true,shouldPlaySound:false,shouldSetBadge:false})});
export async function ensureNotificationPermission(){const p=await Notifications.getPermissionsAsync();if(p.granted)return true;const r=await Notifications.requestPermissionsAsync();return r.granted}
export async function scheduleReminder(title:string,body:string,date:Date){if(!(await ensureNotificationPermission()))return null;return Notifications.scheduleNotificationAsync({content:{title,body},trigger:{type:Notifications.SchedulableTriggerInputTypes.DATE,date}})}
export async function cancelReminder(id?:string|null){if(id)await Notifications.cancelScheduledNotificationAsync(id)}
