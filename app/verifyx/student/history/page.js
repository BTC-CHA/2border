'use client';

import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
export default function LegacyHistory(){const router=useRouter();useEffect(()=>{router.replace('/verifyx/student/results')},[router]);return <main className="vx-page"><div className="vx-wrap"><div className="vx-empty">กำลังไปหน้า Results...</div></div></main>}
