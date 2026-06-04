import type { Channel } from "@/components/ChannelCard";

export const mockMasterChannels: Channel[] = [
  { id: "ch-001", name: "HBO", group: "Entertainment", language: "en", streamUrl: "https://example.com/hbo.m3u8", logoUrl: "", nextProgram: { title: "The Last of Us", startTime: "2026-06-04T21:00:00Z" } },
  { id: "ch-002", name: "ESPN", group: "Sports", language: "en", streamUrl: "https://example.com/espn.m3u8", logoUrl: "", nextProgram: { title: "SportsCenter", startTime: "2026-06-04T19:30:00Z" } },
  { id: "ch-003", name: "CNN", group: "News", language: "en", streamUrl: "https://example.com/cnn.m3u8", logoUrl: "", nextProgram: { title: "Anderson Cooper 360", startTime: "2026-06-04T20:00:00Z" } },
  { id: "ch-004", name: "BBC One", group: "Entertainment", language: "en", streamUrl: "https://example.com/bbc1.m3u8", logoUrl: "", nextProgram: { title: "Doctor Who", startTime: "2026-06-04T20:30:00Z" } },
  { id: "ch-005", name: "Discovery Channel", group: "Documentary", language: "en", streamUrl: "https://example.com/discovery.m3u8", logoUrl: "", nextProgram: { title: "Shark Week", startTime: "2026-06-04T22:00:00Z" } },
  { id: "ch-006", name: "National Geographic", group: "Documentary", language: "en", streamUrl: "https://example.com/natgeo.m3u8", logoUrl: "", nextProgram: { title: "One Strange Rock", startTime: "2026-06-04T21:00:00Z" } },
  { id: "ch-007", name: "Cartoon Network", group: "Kids", language: "en", streamUrl: "https://example.com/cartoon.m3u8", logoUrl: "", nextProgram: { title: "Adventure Time", startTime: "2026-06-04T18:00:00Z" } },
  { id: "ch-008", name: "Fox News", group: "News", language: "en", streamUrl: "https://example.com/fox.m3u8", logoUrl: "", nextProgram: { title: "The Ingraham Angle", startTime: "2026-06-04T22:00:00Z" } },
  { id: "ch-009", name: "Nickelodeon", group: "Kids", language: "en", streamUrl: "https://example.com/nick.m3u8", logoUrl: "", nextProgram: { title: "SpongeBob SquarePants", startTime: "2026-06-04T17:30:00Z" } },
  { id: "ch-010", name: "Sky Sports", group: "Sports", language: "en", streamUrl: "https://example.com/skysports.m3u8", logoUrl: "", nextProgram: { title: "Premier League Live", startTime: "2026-06-04T20:00:00Z" } },
  { id: "ch-011", name: "ITV", group: "Entertainment", language: "en", streamUrl: "https://example.com/itv.m3u8", logoUrl: "", nextProgram: { title: "Love Island", startTime: "2026-06-04T21:00:00Z" } },
  { id: "ch-012", name: "Channel 4", group: "Entertainment", language: "en", streamUrl: "https://example.com/ch4.m3u8", logoUrl: "", nextProgram: { title: "Gogglebox", startTime: "2026-06-04T21:00:00Z" } },
  { id: "ch-013", name: "BBC News", group: "News", language: "en", streamUrl: "https://example.com/bbcnews.m3u8", logoUrl: "", nextProgram: { title: "BBC News at Ten", startTime: "2026-06-04T22:00:00Z" } },
  { id: "ch-014", name: "Eurosport", group: "Sports", language: "en", streamUrl: "https://example.com/eurosport.m3u8", logoUrl: "", nextProgram: { title: "Tour de France Highlights", startTime: "2026-06-04T19:00:00Z" } },
  { id: "ch-015", name: "Disney Channel", group: "Kids", language: "en", streamUrl: "https://example.com/disney.m3u8", logoUrl: "", nextProgram: { title: "Bluey", startTime: "2026-06-04T17:00:00Z" } },
];

export const mockMyChannels: Channel[] = [
  { id: "ch-001", name: "HBO", group: "Entertainment", language: "en", streamUrl: "https://example.com/hbo.m3u8", logoUrl: "", nextProgram: { title: "The Last of Us", startTime: "2026-06-04T21:00:00Z" } },
  { id: "ch-002", name: "ESPN", group: "Sports", language: "en", streamUrl: "https://example.com/espn.m3u8", logoUrl: "", nextProgram: { title: "SportsCenter", startTime: "2026-06-04T19:30:00Z" } },
  { id: "ch-003", name: "CNN", group: "News", language: "en", streamUrl: "https://example.com/cnn.m3u8", logoUrl: "", nextProgram: { title: "Anderson Cooper 360", startTime: "2026-06-04T20:00:00Z" } },
  { id: "ch-004", name: "BBC One", group: "Entertainment", language: "en", streamUrl: "https://example.com/bbc1.m3u8", logoUrl: "", nextProgram: { title: "Doctor Who", startTime: "2026-06-04T20:30:00Z" } },
  { id: "ch-005", name: "Discovery Channel", group: "Documentary", language: "en", streamUrl: "https://example.com/discovery.m3u8", logoUrl: "", nextProgram: { title: "Shark Week", startTime: "2026-06-04T22:00:00Z" } },
  { id: "ch-007", name: "Cartoon Network", group: "Kids", language: "en", streamUrl: "https://example.com/cartoon.m3u8", logoUrl: "", nextProgram: { title: "Adventure Time", startTime: "2026-06-04T18:00:00Z" } },
  { id: "ch-010", name: "Sky Sports", group: "Sports", language: "en", streamUrl: "https://example.com/skysports.m3u8", logoUrl: "", nextProgram: { title: "Premier League Live", startTime: "2026-06-04T20:00:00Z" } },
  { id: "ch-013", name: "BBC News", group: "News", language: "en", streamUrl: "https://example.com/bbcnews.m3u8", logoUrl: "", nextProgram: { title: "BBC News at Ten", startTime: "2026-06-04T22:00:00Z" } },
  { id: "ch-015", name: "Disney Channel", group: "Kids", language: "en", streamUrl: "https://example.com/disney.m3u8", logoUrl: "", nextProgram: { title: "Bluey", startTime: "2026-06-04T17:00:00Z" } },
];

export const mockAiConfidenceMap: Record<string, { confidence: number; autoApplied: boolean }> = {
  "ch-001": { confidence: 0.92, autoApplied: true },
  "ch-004": { confidence: 0.88, autoApplied: true },
  "ch-005": { confidence: 0.76, autoApplied: true },
  "ch-011": { confidence: 0.65, autoApplied: false },
  "ch-012": { confidence: 0.58, autoApplied: false },
};
