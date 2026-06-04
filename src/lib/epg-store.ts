// lib/epg-store.ts — In-memory EPG source and schedule store

export interface EpgSource {
  id: string;
  name: string;
  url: string;
  status: "loading" | "loaded" | "error";
  channelCount: number;
  entryCount: number;
  addedAt: string;
  errorMessage?: string;
}

export interface EpgChannel {
  sourceId: string;
  tvgId: string;
  displayName: string;
  icon?: string;
}

export interface EpgEntry {
  tvgId: string;
  start: string;
  stop: string;
  title: string;
  subtitle?: string;
  description?: string;
  category?: string;
}

class EpgStore {
  private sources = new Map<string, EpgSource>();
  private channels = new Map<string, EpgChannel[]>();
  private entries = new Map<string, EpgEntry[]>();
  private channelMapping = new Map<string, string>(); // channelId → tvgId

  addSource(name: string, url: string): EpgSource {
    const id = `epg_${Date.now()}`;
    const source: EpgSource = {
      id,
      name,
      url,
      status: "loading",
      channelCount: 0,
      entryCount: 0,
      addedAt: new Date().toISOString(),
    };
    this.sources.set(id, source);

    // Simulate parsing — in production, fetch and parse XMLTV here
    setTimeout(() => {
      const mockChannels: EpgChannel[] = [
        { sourceId: id, tvgId: "bbc1.uk", displayName: "BBC One" },
        { sourceId: id, tvgId: "bbc2.uk", displayName: "BBC Two" },
        { sourceId: id, tvgId: "itv1.uk", displayName: "ITV 1" },
        { sourceId: id, tvgId: "channel4.uk", displayName: "Channel 4" },
        { sourceId: id, tvgId: "skysportsfootball.uk", displayName: "Sky Sports Football" },
        { sourceId: id, tvgId: "skysportscricket.uk", displayName: "Sky Sports Cricket" },
        { sourceId: id, tvgId: "beinsports1.uk", displayName: "beIN Sports 1" },
      ];
      const mockEntries: EpgEntry[] = [];
      const now = new Date();
      for (const ch of mockChannels) {
        for (let h = -2; h < 8; h++) {
          const start = new Date(now);
          start.setHours(start.getHours() + h, 0, 0, 0);
          const stop = new Date(start);
          stop.setHours(stop.getHours() + 1);
          mockEntries.push({
            tvgId: ch.tvgId,
            start: start.toISOString(),
            stop: stop.toISOString(),
            title: `${ch.displayName} - Program at ${start.getHours()}:00`,
            category: "General",
          });
        }
      }

      this.channels.set(id, mockChannels);
      this.entries.set(id, mockEntries);
      source.status = "loaded";
      source.channelCount = mockChannels.length;
      source.entryCount = mockEntries.length;
    }, 1500);

    return source;
  }

  getSources(): EpgSource[] {
    return Array.from(this.sources.values());
  }

  getSource(id: string): EpgSource | undefined {
    return this.sources.get(id);
  }

  getChannels(sourceId: string): EpgChannel[] {
    return this.channels.get(sourceId) || [];
  }

  getEntries(sourceId: string, tvgId?: string): EpgEntry[] {
    const all = this.entries.get(sourceId) || [];
    return tvgId ? all.filter((e) => e.tvgId === tvgId) : all;
  }

  removeSource(id: string) {
    this.sources.delete(id);
    this.channels.delete(id);
    this.entries.delete(id);
  }

  // Channel-to-EPG mapping
  setMapping(channelId: string, tvgId: string) {
    this.channelMapping.set(channelId, tvgId);
  }

  removeMapping(channelId: string) {
    this.channelMapping.delete(channelId);
  }

  getMapping(channelId: string): string | undefined {
    return this.channelMapping.get(channelId);
  }

  getAllMappings(): Map<string, string> {
    return new Map(this.channelMapping);
  }

  getMappedEntries(channelId: string, sourceId: string): EpgEntry[] {
    const tvgId = this.channelMapping.get(channelId);
    if (!tvgId) return [];
    return this.getEntries(sourceId, tvgId);
  }
}

export const epgStore = new EpgStore();
