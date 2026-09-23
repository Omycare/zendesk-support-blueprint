import { env } from 'cloudflare:workers';
export function database(){if(!env.DB)throw new Error('Database unavailable');return env.DB;}
export function runtimeSecrets(){return env as unknown as Record<string,string|undefined>;}
