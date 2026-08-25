import { AIProviderManager } from '../ai/providerManager';
import { BedrockProvider } from '../ai/providers/bedrockProvider';

async function runBedrockTest() {
  console.log('======================================================');
  console.log('🧪 AWS BEDROCK AI PROVIDER TEST SUITE');
  console.log('======================================================\n');

  const provider = new BedrockProvider();
  
  // Test 1: Provider Metadata
  console.log(`[Test 1] Testing Bedrock metadata...`);
  if (provider.type === 'BEDROCK' && provider.name.includes('AWS Bedrock')) {
    console.log(`  ✓ PASS: Provider Metadata (${provider.name})`);
  } else {
    throw new Error('FAIL: Invalid provider metadata');
  }

  // Test 2: Connection Health
  console.log(`[Test 2] Testing Bedrock connection health...`);
  const conn = await provider.testConnection();
  if (conn.success) {
    console.log(`  ✓ PASS: Connection Test (${conn.model})`);
  } else {
    throw new Error(`FAIL: Connection test failed: ${conn.message}`);
  }

  // Test 3: Content Spine Extraction via Bedrock
  console.log(`[Test 3] Testing Content Spine extraction via Bedrock...`);
  const spineResult = await AIProviderManager.extractContentSpine(
    'Incident Report: System milestone reached on 2026-08-24. High threat severity detected.',
    'THREAT_INTEL',
    'BEDROCK'
  );
  if (spineResult.spine && spineResult.spine.summary) {
    console.log(`  ✓ PASS: Content Spine Extraction (Provider: ${spineResult.provider})`);
  } else {
    throw new Error('FAIL: Content Spine extraction returned empty result');
  }

  // Test 4: Output Generation via Bedrock
  console.log(`[Test 4] Testing Output Generation via Bedrock...`);
  const outputResult = await AIProviderManager.generateOutput(
    spineResult.spine,
    'EXECUTIVE_SUMMARY',
    'EXECUTIVE',
    'BEDROCK'
  );
  if (outputResult.success && outputResult.content) {
    console.log(`  ✓ PASS: Deliverable Output Generation (Provider: ${outputResult.provider})`);
  } else {
    throw new Error('FAIL: Deliverable output generation failed');
  }

  console.log('\n======================================================');
  console.log('SUMMARY: 4 PASSED | 0 FAILED');
  console.log('======================================================\n');
}

runBedrockTest().catch((err) => {
  console.error('❌ BEDROCK TEST FAILED:', err);
  process.exit(1);
});
