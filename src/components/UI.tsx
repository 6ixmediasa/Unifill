import React from 'react';
import {ActivityIndicator, Pressable, Text, TextInput, View, ViewStyle, TextStyle, StyleProp} from 'react-native';
import * as Haptics from 'expo-haptics';
import {Ionicons} from '@expo/vector-icons';
import {useTheme} from '@/src/context/ThemeContext';
import {radii} from '@/src/lib/theme';

export function Screen({children,style}:{children:React.ReactNode;style?:StyleProp<ViewStyle>}){const {theme}=useTheme();return <View style={[s.screen,{backgroundColor:theme.bg},style]}>{children}</View>}
export function Card({children,style}:{children:React.ReactNode;style?:StyleProp<ViewStyle>}){const {theme}=useTheme();return <View style={[s.card,{backgroundColor:theme.surface,borderColor:theme.border,shadowColor:theme.shadow},style]}>{children}</View>}
export function H1({children}:{children:React.ReactNode}){const {theme}=useTheme();return <Text style={[s.h1,{color:theme.text}]}>{children}</Text>}
export function H2({children}:{children:React.ReactNode}){const {theme}=useTheme();return <Text style={[s.h2,{color:theme.text}]}>{children}</Text>}
export function Muted({children}:{children:React.ReactNode}){const {theme}=useTheme();return <Text style={[s.muted,{color:theme.muted}]}>{children}</Text>}
export function Button({title,onPress,variant='primary',icon,disabled=false}:{title:string;onPress:()=>void;variant?:'primary'|'secondary'|'danger';icon?:keyof typeof Ionicons.glyphMap;disabled?:boolean}){const {theme}=useTheme();const bg=variant==='primary'?theme.primary:variant==='danger'?theme.danger:theme.surfaceAlt;const fg=variant==='secondary'?theme.text:'#fff';return <Pressable disabled={disabled} onPress={()=>{Haptics.selectionAsync().catch(()=>{});onPress();}} style={({pressed})=>[s.button,{backgroundColor:bg,opacity:disabled?.5:pressed?.82:1,transform:[{scale:pressed?.985:1}]}]}>{icon&&<Ionicons name={icon} size={18} color={fg}/>}<Text style={{color:fg,fontWeight:'800'}}>{title}</Text></Pressable>}
export function Field({label,value,onChangeText,placeholder,keyboardType='default',multiline=false}:{label:string;value:string;onChangeText:(v:string)=>void;placeholder?:string;keyboardType?:any;multiline?:boolean}){const {theme}=useTheme();return <View style={{gap:6}}><Text style={{color:theme.muted,fontSize:12,fontWeight:'700'}}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={theme.muted} keyboardType={keyboardType} multiline={multiline} style={[s.input,{color:theme.text,backgroundColor:theme.surface,borderColor:theme.border,minHeight:multiline?92:48,textAlignVertical:multiline?'top':'center'}]}/></View>}
export function Empty({icon='file-tray-outline',title,body}:{icon?:keyof typeof Ionicons.glyphMap;title:string;body:string}){const {theme}=useTheme();return <View style={s.empty}><Ionicons name={icon} size={42} color={theme.primary}/><H2>{title}</H2><Muted>{body}</Muted></View>}
export function Loading(){const {theme}=useTheme();return <View style={s.empty}><ActivityIndicator color={theme.primary}/></View>}

const s:{screen:ViewStyle;card:ViewStyle;h1:TextStyle;h2:TextStyle;muted:TextStyle;button:ViewStyle;input:TextStyle;empty:ViewStyle}={
  screen:{flex:1},
  card:{borderWidth:1,borderRadius:radii.md,padding:16,shadowOpacity:.05,shadowRadius:14,shadowOffset:{width:0,height:5},elevation:2},
  h1:{fontSize:30,fontWeight:'900',letterSpacing:-.8},
  h2:{fontSize:18,fontWeight:'800'},
  muted:{fontSize:14,lineHeight:20},
  button:{height:48,borderRadius:14,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8,paddingHorizontal:16},
  input:{borderWidth:1,borderRadius:14,paddingHorizontal:14,paddingVertical:12,fontSize:15},
  empty:{padding:32,alignItems:'center',justifyContent:'center',gap:10}
};
