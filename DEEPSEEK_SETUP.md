/**
 * Deepseek v4 Flash Setup Guide for easyepg
 */

# Deepseek v4 Flash Integration

## Quick Setup

### 1. Get Your API Key
- Sign up at [deepseek.com](https://deepseek.com)
- Generate an API key in your account dashboard

### 2. Configure Environment
Create `.env.local` in your project root:
```bash
DEEPSEEK_API_KEY=your_api_key_here
```

**Never commit `.env.local` to git** — add to `.gitignore`

### 3. Test the Integration
```bash
# Start dev server
npm run dev

# Test channel mapping (single)
curl -X POST http://localhost:3000/api/ai/channel-mapping \
  -H "Content-Type: application/json" \
  -d '{"channelName": "BBC News"}'

# Test batch enrichment
curl -X POST http://localhost:3000/api/ai/enrich-channels \
  -H "Content-Type: application/json" \
  -d '{
    "channels": [
      {"id": "1", "name": "BBC News"},
      {"id": "2", "name": "Sky Sports", "logo": "Premier League"},
      {"id": "3", "name": "Netflix"}
    ],
    "maxConcurrent": 3
  }'
```

## Available Functions

### `src/lib/deepseek.ts`
- `callDeepseek(messages, options)` — Generic API call
- `suggestChannelMapping(channelName)` — Single channel categorization
- `evaluateLogoMatch(channelName, logoDescription)` — Logo confidence scoring

### `src/lib/epg-enrichment.ts`
- `enrichChannel(name, logo)` — Single channel enrichment
- `batchEnrichChannels(channels)` — Batch processing
- `mergeEPGEntries(entries)` — EPG deduplication

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai/channel-mapping` | POST | Categorize single channel |
| `/api/ai/enrich-channels` | POST | Batch enrich channels |

## Pricing (Deepseek v4 Flash)
- ~80% cheaper than GPT-4
- Good for:
  - EPG merging & cleanup
  - Channel categorization
  - Logo matching confidence scoring
  - Batch processing

## Best Practices

1. **Rate Limiting**: Use `maxConcurrent` in batch requests (default: 3)
2. **Error Handling**: Always wrap API calls in try/catch
3. **Caching**: Consider caching enrichment results to avoid duplicate API calls
4. **Temperature**: Use low temperature (0.2-0.3) for deterministic results

## Example: Integrating with EPG Source Parser

```typescript
import { enrichChannel } from '@/lib/epg-enrichment';
import { parseXMLTV } from '@/lib/xmltv-parser';

export async function importEPGWithEnrichment(xmlContent: string) {
  const channels = parseXMLTV(xmlContent);
  
  const enriched = await Promise.all(
    channels.map(async (channel) => ({
      ...channel,
      enrichment: await enrichChannel(channel.name, channel.icon),
    }))
  );
  
  return enriched;
}
```

## Troubleshooting

**"API key not found"** — Check `.env.local` exists and `DEEPSEEK_API_KEY` is set

**"Too many requests"** — Reduce `maxConcurrent` or add delays between batches

**"Invalid JSON response"** — Deepseek v4 Flash sometimes returns text; fallback logic in enrichment functions handles this

## Next Steps

1. Integrate with your EPG parser (`src/lib/xmltv-parser.ts`)
2. Add to your Cloudflare Worker queue for async processing
3. Cache results in D1 database
4. Add confidence thresholds before accepting AI suggestions
