import React,{createContext,useContext,useEffect,useMemo,useState} from 'react';
import {useColorScheme} from 'react-native';
import {dark, light} from '@/src/lib/theme';
import {setting} from '@/src/db/database';
type Mode='system'|'light'|'dark';
const Ctx=createContext({theme:light,mode:'system' as Mode,setMode:(_m:Mode)=>{}});
export function ThemeProvider({children}:{children:React.ReactNode}){
  const system=useColorScheme(); const [mode,setMode]=useState<Mode>('system');
  useEffect(()=>{setting('appearance','system').then(v=>{if(v==='light'||v==='dark'||v==='system')setMode(v) }).catch(()=>{})},[]);
  const resolved=mode==='system'?system:mode; const theme=resolved==='dark'?dark:light;
  return <Ctx.Provider value={useMemo(()=>({theme,mode,setMode}),[theme,mode])}>{children}</Ctx.Provider>;
}
export const useTheme=()=>useContext(Ctx);
