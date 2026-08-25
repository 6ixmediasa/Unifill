import React from 'react';import {useLocalSearchParams} from 'expo-router';import {DocumentDetail} from '@/src/components/DocumentDetail';
export default function Screen(){const {id}=useLocalSearchParams<{id:string}>();return <DocumentDetail kind="estimate" id={id}/>}
