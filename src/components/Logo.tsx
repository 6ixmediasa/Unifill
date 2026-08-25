import React from 'react';
import {Image, ImageStyle, StyleProp} from 'react-native';
export function Logo({height=42,style}:{height?:number;style?:StyleProp<ImageStyle>}){return <Image source={require('@/assets/logo-horizontal.png')} resizeMode="contain" style={[{height,width:height*2.3},style]}/>}
