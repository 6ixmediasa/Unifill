import React from 'react';import {useLocalSearchParams} from 'expo-router';import {DocumentEditor} from '@/src/components/DocumentEditor';
export default function Screen(){const {id}=useLocalSearchParams<{id?:string}>();return <DocumentEditor kind="invoice" id={id}/>}
