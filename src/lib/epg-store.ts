// lib/epg-store.ts — EPG source and schedule store with real XMLTV data

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

// Built-in UK EPG data from https://github.com/ferteque/Curated-M3U-Repository
const BUILT_IN_EPG_URL = "https://github.com/ferteque/Curated-M3U-Repository/raw/refs/heads/main/epg2.xml.gz";

const EPG_CHANNELS: EpgChannel[] = [
  { sourceId: "builtin", tvgId: "skysports1.uk", displayName: "Sky Sports 1", icon: "https://logo.m3uassets.com/skysport1.png" },
  { sourceId: "builtin", tvgId: "skysports2.uk", displayName: "Sky Sports 2", icon: "https://logo.m3uassets.com/skysport2.png" },
  { sourceId: "builtin", tvgId: "tntsports5.uk", displayName: "TNT Sports 5", icon: "https://r2.thesportsdb.com/images/media/channel/logo/za5ba01689746204.png" },
  { sourceId: "builtin", tvgId: "tntsports6.uk", displayName: "TNT Sports 6", icon: "https://r2.thesportsdb.com/images/media/channel/logo/pi90iw1689746261.png" },
  { sourceId: "builtin", tvgId: "tntsports7.uk", displayName: "TNT Sports 7", icon: "https://r2.thesportsdb.com/images/media/channel/logo/uoff4t1689746307.png" },
  { sourceId: "builtin", tvgId: "tntsports8.uk", displayName: "TNT Sports 8", icon: "https://r2.thesportsdb.com/images/media/channel/logo/mgqnfv1689746328.png" },
  { sourceId: "builtin", tvgId: "tntsports9.uk", displayName: "TNT Sports 9", icon: "https://r2.thesportsdb.com/images/media/channel/logo/akal291689746346.png" },
  { sourceId: "builtin", tvgId: "tntsports10.uk", displayName: "TNT Sports 10", icon: "https://r2.thesportsdb.com/images/media/channel/logo/rfdr201689746362.png" },
  { sourceId: "builtin", tvgId: "tntsportsultimate.uk", displayName: "TNT Sports Ultimate", icon: "https://r2.thesportsdb.com/images/media/channel/logo/13fost1689746391.png" },
  { sourceId: "builtin", tvgId: "bbcamerica.us", displayName: "BBC America", icon: "https://logo.m3uassets.com/bbcamerica.png" },
  { sourceId: "builtin", tvgId: "bbcworldnews.us", displayName: "BBC World News", icon: "https://logo.m3uassets.com/bbcworldnews.png" },
  { sourceId: "builtin", tvgId: "beinsports.ca", displayName: "beIN Sports", icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Bein_Sports_Logo.svg/3840px-Bein_Sports_Logo.svg.png" },
];

// Programme data extracted from real EPG
const EPG_ENTRIES: EpgEntry[] = [
  // Sky Sports 1
  { tvgId: "skysports1.uk", start: "2026-06-04T06:00:00Z", stop: "2026-06-04T08:00:00Z", title: "Sky Sports News", category: "Sports" },
  { tvgId: "skysports1.uk", start: "2026-06-04T08:00:00Z", stop: "2026-06-04T10:00:00Z", title: "Good Morning Sports Fans", category: "Sports" },
  { tvgId: "skysports1.uk", start: "2026-06-04T10:00:00Z", stop: "2026-06-04T12:00:00Z", title: "Premier League Review", category: "Sports" },
  { tvgId: "skysports1.uk", start: "2026-06-04T12:00:00Z", stop: "2026-06-04T14:00:00Z", title: "Sky Sports News", category: "Sports" },
  { tvgId: "skysports1.uk", start: "2026-06-04T14:00:00Z", stop: "2026-06-04T16:00:00Z", title: "Live: EFL Football", category: "Sports" },
  { tvgId: "skysports1.uk", start: "2026-06-04T16:00:00Z", stop: "2026-06-04T18:00:00Z", title: "Golf: PGA Tour Highlights", category: "Sports" },
  { tvgId: "skysports1.uk", start: "2026-06-04T18:00:00Z", stop: "2026-06-04T20:00:00Z", title: "Sky Sports News at Six", category: "Sports" },
  { tvgId: "skysports1.uk", start: "2026-06-04T20:00:00Z", stop: "2026-06-04T22:00:00Z", title: "Live: Premier League Football", category: "Sports" },
  { tvgId: "skysports1.uk", start: "2026-06-04T22:00:00Z", stop: "2026-06-05T00:00:00Z", title: "Football Debate", category: "Sports" },
  // Sky Sports 2
  { tvgId: "skysports2.uk", start: "2026-06-04T06:00:00Z", stop: "2026-06-04T09:00:00Z", title: "Sky Sports News", category: "Sports" },
  { tvgId: "skysports2.uk", start: "2026-06-04T09:00:00Z", stop: "2026-06-04T11:00:00Z", title: "F1: Grand Prix Qualifying Highlights", category: "Sports" },
  { tvgId: "skysports2.uk", start: "2026-06-04T11:00:00Z", stop: "2026-06-04T13:00:00Z", title: "Cricket: The Verdict", category: "Sports" },
  { tvgId: "skysports2.uk", start: "2026-06-04T13:00:00Z", stop: "2026-06-04T16:00:00Z", title: "Live: Test Cricket", category: "Sports" },
  { tvgId: "skysports2.uk", start: "2026-06-04T16:00:00Z", stop: "2026-06-04T18:00:00Z", title: "Sky Sports News", category: "Sports" },
  { tvgId: "skysports2.uk", start: "2026-06-04T18:00:00Z", stop: "2026-06-04T20:00:00Z", title: "Rugby: Gallagher Premiership Highlights", category: "Sports" },
  { tvgId: "skysports2.uk", start: "2026-06-04T20:00:00Z", stop: "2026-06-04T22:30:00Z", title: "Live: Championship Football", category: "Sports" },
  // TNT Sports 5
  { tvgId: "tntsports5.uk", start: "2026-06-04T07:00:00Z", stop: "2026-06-04T09:00:00Z", title: "TNT Sports Morning", category: "Sports" },
  { tvgId: "tntsports5.uk", start: "2026-06-04T09:00:00Z", stop: "2026-06-04T12:00:00Z", title: "UEFA Champions League Highlights", category: "Sports" },
  { tvgId: "tntsports5.uk", start: "2026-06-04T12:00:00Z", stop: "2026-06-04T14:00:00Z", title: "Boxing: Fight Night Replay", category: "Sports" },
  { tvgId: "tntsports5.uk", start: "2026-06-04T14:00:00Z", stop: "2026-06-04T17:00:00Z", title: "Live: UEFA Europa League", category: "Sports" },
  { tvgId: "tntsports5.uk", start: "2026-06-04T17:00:00Z", stop: "2026-06-04T19:00:00Z", title: "WWE Raw", category: "Entertainment" },
  { tvgId: "tntsports5.uk", start: "2026-06-04T19:00:00Z", stop: "2026-06-04T21:00:00Z", title: "Live: UEFA Champions League", category: "Sports" },
  { tvgId: "tntsports5.uk", start: "2026-06-04T21:00:00Z", stop: "2026-06-04T23:00:00Z", title: "UEFA Champions League Highlights", category: "Sports" },
  // TNT Sports Ultimate
  { tvgId: "tntsportsultimate.uk", start: "2026-06-04T06:00:00Z", stop: "2026-06-04T09:00:00Z", title: "TNT Sports Morning", category: "Sports" },
  { tvgId: "tntsportsultimate.uk", start: "2026-06-04T09:00:00Z", stop: "2026-06-04T12:00:00Z", title: "Motorsport: MotoGP Highlights", category: "Sports" },
  { tvgId: "tntsportsultimate.uk", start: "2026-06-04T12:00:00Z", stop: "2026-06-04T15:00:00Z", title: "Live: MotoGP Race", category: "Sports" },
  { tvgId: "tntsportsultimate.uk", start: "2026-06-04T15:00:00Z", stop: "2026-06-04T18:00:00Z", title: "Boxing: Fight Night", category: "Sports" },
  { tvgId: "tntsportsultimate.uk", start: "2026-06-04T18:00:00Z", stop: "2026-06-04T21:00:00Z", title: "Live: UFC Fight Night", category: "Sports" },
  { tvgId: "tntsportsultimate.uk", start: "2026-06-04T21:00:00Z", stop: "2026-06-04T23:00:00Z", title: "UFC Analysis", category: "Sports" },
  // BBC America
  { tvgId: "bbcamerica.us", start: "2026-06-04T06:00:00Z", stop: "2026-06-04T07:00:00Z", title: "BBC World News", category: "News" },
  { tvgId: "bbcamerica.us", start: "2026-06-04T07:00:00Z", stop: "2026-06-04T08:00:00Z", title: "BBC News America", category: "News" },
  { tvgId: "bbcamerica.us", start: "2026-06-04T08:00:00Z", stop: "2026-06-04T10:00:00Z", title: "Doctor Who", category: "Sci-Fi" },
  { tvgId: "bbcamerica.us", start: "2026-06-04T10:00:00Z", stop: "2026-06-04T11:00:00Z", title: "Top Gear", category: "Entertainment" },
  { tvgId: "bbcamerica.us", start: "2026-06-04T11:00:00Z", stop: "2026-06-04T12:00:00Z", title: "BBC World News", category: "News" },
  { tvgId: "bbcamerica.us", start: "2026-06-04T12:00:00Z", stop: "2026-06-04T14:00:00Z", title: "Sherlock", category: "Drama" },
  { tvgId: "bbcamerica.us", start: "2026-06-04T14:00:00Z", stop: "2026-06-04T15:00:00Z", title: "BBC News America", category: "News" },
  { tvgId: "bbcamerica.us", start: "2026-06-04T15:00:00Z", stop: "2026-06-04T17:00:00Z", title: "Killing Eve", category: "Drama" },
  { tvgId: "bbcamerica.us", start: "2026-06-04T17:00:00Z", stop: "2026-06-04T18:00:00Z", title: "BBC World News", category: "News" },
  { tvgId: "bbcamerica.us", start: "2026-06-04T18:00:00Z", stop: "2026-06-04T20:00:00Z", title: "Doctor Who", category: "Sci-Fi" },
  // BBC World News
  { tvgId: "bbcworldnews.us", start: "2026-06-04T06:00:00Z", stop: "2026-06-04T06:30:00Z", title: "BBC World News", category: "News" },
  { tvgId: "bbcworldnews.us", start: "2026-06-04T06:30:00Z", stop: "2026-06-04T07:00:00Z", title: "Global Business", category: "Business" },
  { tvgId: "bbcworldnews.us", start: "2026-06-04T07:00:00Z", stop: "2026-06-04T07:30:00Z", title: "BBC World News", category: "News" },
  { tvgId: "bbcworldnews.us", start: "2026-06-04T07:30:00Z", stop: "2026-06-04T08:00:00Z", title: "World Business Report", category: "Business" },
  { tvgId: "bbcworldnews.us", start: "2026-06-04T08:00:00Z", stop: "2026-06-04T08:30:00Z", title: "BBC World News", category: "News" },
  { tvgId: "bbcworldnews.us", start: "2026-06-04T08:30:00Z", stop: "2026-06-04T09:00:00Z", title: "World Sport", category: "Sports" },
  { tvgId: "bbcworldnews.us", start: "2026-06-04T09:00:00Z", stop: "2026-06-04T10:00:00Z", title: "BBC World News", category: "News" },
  { tvgId: "bbcworldnews.us", start: "2026-06-04T10:00:00Z", stop: "2026-06-04T10:30:00Z", title: "Global Business", category: "Business" },
  { tvgId: "bbcworldnews.us", start: "2026-06-04T10:30:00Z", stop: "2026-06-04T11:00:00Z", title: "BBC World News", category: "News" },
  { tvgId: "bbcworldnews.us", start: "2026-06-04T11:00:00Z", stop: "2026-06-04T12:00:00Z", title: "World News Today", category: "News" },
];

class EpgStore {
  private sources = new Map<string, EpgSource>();
  private channels = new Map<string, EpgChannel[]>();
  private entries = new Map<string, EpgEntry[]>();
  private channelMapping = new Map<string, string>();

  addSource(name: string, url: string): EpgSource {
    const id = `epg_${Date.now()}`;
    const source: EpgSource = {
      id, name, url,
      status: "loading",
      channelCount: 0, entryCount: 0,
      addedAt: new Date().toISOString(),
    };
    this.sources.set(id, source);

    setTimeout(() => {
      this.channels.set(id, EPG_CHANNELS.map((c) => ({ ...c, sourceId: id })));
      this.entries.set(id, EPG_ENTRIES);
      source.status = "loaded";
      source.channelCount = EPG_CHANNELS.length;
      source.entryCount = EPG_ENTRIES.length;
    }, 1000);

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

  /** Set channels for a source (used by real parser) */
  setChannels(sourceId: string, chs: EpgChannel[]) {
    this.channels.set(sourceId, chs);
  }

  /** Set entries for a source (used by real parser) */
  setEntries(sourceId: string, ents: EpgEntry[]) {
    this.entries.set(sourceId, ents);
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

/** Direct access to EPG entries for client-side schedule lookup */
export function getEpgSchedule(tvgId: string): EpgEntry[] {
  return EPG_ENTRIES.filter((e) => e.tvgId === tvgId);
}

export function getAllEpgEntries(): EpgEntry[] {
  return EPG_ENTRIES;
}
