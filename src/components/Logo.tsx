import React from 'react';
import {Image, ViewStyle} from 'react-native';
export function Logo({height=42,style}:{height?:number;style?:ViewStyle}){return <Image source={require('@/assets/logo-horizontal.png')} resizeMode="contain" style={[{height,width:height*2.3},style]}/>}
