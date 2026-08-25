'use client';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_VERIFYX_SUPABASE_URL || 'https://nfqlgzvsnxnruuozkjdw.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_VERIFYX_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_wxOlf5vFNtowp4G0pP4GAg_9G_cqu18';

export const vx = createClient(supabaseUrl, supabaseKey);
export const VX_BUCKET = 'verifyx-v2';
