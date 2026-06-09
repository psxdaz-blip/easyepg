#!/usr/bin/env node

/**
 * CLI test utility for Deepseek integration
 * Usage: npx ts-node scripts/test-deepseek.ts
 */

import { callDeepseek, suggestChannelMapping } from '../src/lib/deepseek';
import { enrichChannel, batchEnrichChannels } from '../src/lib/epg-enrichment';

async function runTests() {
  console.log('🚀 Testing Deepseek v4 Flash Integration\n');

  if (!process.env.DEEPSEEK_API_KEY) {
    console.error(
      '❌ DEEPSEEK_API_KEY not set. Add it to .env.local\n' +
        'Example: DEEPSEEK_API_KEY=sk_live_...'
    );
    process.exit(1);
  }

  try {
    // Test 1: Basic API call
    console.log('Test 1: Basic API Call');
    console.log('─'.repeat(40));
    const response1 = await callDeepseek(
      [{ role: 'user', content: 'Say "Deepseek works!" in 5 words or less.' }],
      { temperature: 0.3, maxTokens: 50 }
    );
    console.log(`✓ Response: ${response1}\n`);

    // Test 2: Channel mapping
    console.log('Test 2: Single Channel Mapping');
    console.log('─'.repeat(40));
    const category = await suggestChannelMapping('SKY SPORTS PREMIERE LEAGUE');
    console.log(`✓ Suggested category: ${category}\n`);

    // Test 3: Channel enrichment
    console.log('Test 3: Channel Enrichment');
    console.log('─'.repeat(40));
    const enriched = await enrichChannel('BBC Two HD', 'BBC logo');
    console.log('✓ Enrichment result:');
    console.log(`  - Original: ${enriched.originalName}`);
    console.log(`  - Suggested: ${enriched.suggestedName}`);
    console.log(`  - Category: ${enriched.category}`);
    console.log(`  - Confidence: ${enriched.confidence}%\n`);

    // Test 4: Batch enrichment
    console.log('Test 4: Batch Channel Enrichment');
    console.log('─'.repeat(40));
    const testChannels = [
      { id: '1', name: 'BBC News' },
      { id: '2', name: 'ITV 1 HD', logo: 'ITV commercial logo' },
      { id: '3', name: 'Channel 4' },
    ];

    const batchResults = await batchEnrichChannels(testChannels, 2);
    console.log(`✓ Enriched ${batchResults.size} channels:`);
    batchResults.forEach((result, id) => {
      console.log(
        `  - [${id}] ${result.originalName} → ${result.suggestedName} (${result.confidence}%)`
      );
    });
    console.log();

    console.log('✅ All tests passed!');
    console.log('\nIntegration is working correctly.');
    console.log('Check DEEPSEEK_SETUP.md for API endpoint documentation.');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();
