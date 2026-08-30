import { supabase } from './supabase-client';
import { createClient } from '@supabase/supabase-js';

async function testQuery() {
  console.log('🔍 Iniciando diagnóstico da tabela top_scorers...');

  // 1. Testar com a Service Role Key (Client padrão do sync-supabase)
  console.log('\n--- Testando com Service Role Key ---');
  try {
    const { data: dataSR, error: errSR } = await supabase
      .from('top_scorers')
      .select('*')
      .limit(5);

    if (errSR) {
      console.error('❌ Erro com Service Role Key:', errSR.message);
    } else {
      console.log(`✅ Sucesso! Retornou ${dataSR?.length} registro(s).`);
      console.log('Amostra de dados:', dataSR);
    }
  } catch (e: any) {
    console.error('❌ Exceção com Service Role Key:', e.message);
  }

  // 2. Testar com a Anon Key (que o admin_portal usa por padrão)
  console.log('\n--- Testando com Anon Key ---');
  const anonUrl = process.env.SUPABASE_URL;
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';
  
  if (anonUrl) {
    try {
      const anonClient = createClient(anonUrl, anonKey);
      const { data: dataAnon, error: errAnon } = await anonClient
        .from('top_scorers')
        .select('*')
        .limit(5);

      if (errAnon) {
        console.error('❌ Erro com Anon Key:', errAnon.message);
      } else {
        console.log(`✅ Sucesso com Anon Key! Retornou ${dataAnon?.length} registro(s).`);
        console.log('Amostra de dados Anon:', dataAnon);
      }
    } catch (e: any) {
      console.error('❌ Exceção com Anon Key:', e.message);
    }
  } else {
    console.warn('⚠️ URL do Supabase não configurada no env para teste Anon.');
  }
}

testQuery().catch(console.error);
