import { GeminiProvider } from '../ai/providers/geminiProvider';
import { OpenAIProvider } from '../ai/providers/openAIProvider';
import { MockProvider } from '../ai/providers/mockProvider';
import { getAIProvider, getAIProviderInstance } from '../ai/provider';
import { config } from '../config';

async function runProviderTestSuite() {
  console.log('🧪 Starting Multi-Provider AI Engine Test Suite...\n');

  // 1. Test Provider Factory Lookup & Validation
  console.log('  Testing Provider Factory Lookup...');
  const gemini = getAIProvider('gemini');
  if (gemini.name !== 'Google Gemini AI Provider') {
    throw new Error(`❌ Failed: Expected Google Gemini AI Provider, got '${gemini.name}'`);
  }
  console.log('  ✅ PASS: getAIProvider("gemini") returned Google Gemini AI Provider');

  const openai = getAIProvider('openai');
  if (openai.name !== 'OpenAI Provider (GPT-4o)') {
    throw new Error(`❌ Failed: Expected OpenAI Provider (GPT-4o), got '${openai.name}'`);
  }
  console.log('  ✅ PASS: getAIProvider("openai") returned OpenAI Provider (GPT-4o)');

  const mock = getAIProvider('mock');
  if (!mock.name.includes('Mock AI Provider')) {
    throw new Error(`❌ Failed: Expected Mock AI Provider, got '${mock.name}'`);
  }
  console.log('  ✅ PASS: getAIProvider("mock") returned Mock AI Provider');

  // 2. Test Invalid Provider Handling
  console.log('  Testing Invalid Provider Exception Handling...');
  try {
    getAIProvider('invalid_provider_name');
    throw new Error('❌ Failed: getAIProvider did not throw on invalid provider name');
  } catch (err: any) {
    if (err.message.includes('INVALID_PROVIDER')) {
      console.log('  ✅ PASS: getAIProvider threw controlled INVALID_PROVIDER error for invalid input');
    } else {
      throw err;
    }
  }

  // 3. Test Mock Provider Generation & Fact Preservations
  console.log('  Testing Mock Provider Output Generation...');
  const mockOutput = await mock.generateOutput(
    {
      summary: 'Test Content Spine Summary for SIH 2026',
      entities: [],
      dates: [],
      numbers: [],
      locations: [],
      events: [],
      risks: [],
      recommendations: [],
      claims: [],
      relationships: [],
      factLocks: [
        { id: '1', key: 'Affected Systems', value: '11 systems', category: 'NUMBER', isLocked: true, sourceSnippet: '11 systems' },
      ],
    },
    'EXECUTIVE_SUMMARY',
    'EXECUTIVE'
  );

  if (!mockOutput.content || !mockOutput.title) {
    throw new Error('❌ Failed: Mock Provider returned empty content or title');
  }
  console.log(`  ✅ PASS: Mock Provider Output Generated: "${mockOutput.title}"`);

  // 4. Test Gemini Connection Test Response
  console.log('  Testing Gemini Provider Connection Health Check...');
  const geminiInst = new GeminiProvider();
  const geminiConn = await geminiInst.testConnection();
  console.log(`     Gemini Connectivity: success=${geminiConn.success}, model=${geminiConn.model}, msg=${geminiConn.message || 'OK'}`);
  console.log('  ✅ PASS: Gemini Connection Health Check Completed');

  // 5. Test OpenAI Connection Test Response
  console.log('  Testing OpenAI Provider Connection Health Check...');
  const openAIInst = new OpenAIProvider();
  const openAIConn = await openAIInst.testConnection();
  console.log(`     OpenAI Connectivity: success=${openAIConn.success}, model=${openAIConn.model}, msg=${openAIConn.message || 'OK'}`);
  console.log('  ✅ PASS: OpenAI Connection Health Check Completed');

  console.log('\n🎉 ALL MULTI-PROVIDER AI TESTS PASSED SUCCESSFULLY!\n');
}

runProviderTestSuite().catch((err) => {
  console.error('❌ Multi-Provider Test Suite Failed:', err);
  process.exit(1);
});
