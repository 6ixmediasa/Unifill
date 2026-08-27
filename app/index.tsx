import React,{useEffect} from 'react';
import {router} from 'expo-router';
import {Loading,Screen} from '@/src/components/UI';

export default function Index(){
  useEffect(()=>{
    const timer=setTimeout(()=>router.replace('/onboarding'),150);
    return ()=>clearTimeout(timer);
  },[]);
  return <Screen><Loading/></Screen>;
}
