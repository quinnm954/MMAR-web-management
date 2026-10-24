import { mock } from 'bun:test';

// Deno npm specifiers are unavailable in Bun; tests inject clients and never use this factory.
mock.module('npm:@supabase/supabase-js@2', () => ({ createClient: () => { throw new Error('Unexpected live Cloud client in unit test'); } }));