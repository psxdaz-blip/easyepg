// lib/store.ts — Simple in-memory data store for MVP (swap to D1/Postgres later)

export interface User {
  id: string;
  email: string;
  language: string;
  region: string;
  timezone: string;
  aiThreshold: number;
  aiAutoApply: boolean;
}

export interface Playlist {
  id: string;
  userId: string;
  name: string;
  slug: string;
  channelIds: string[];
  createdAt: string;
}

export interface AuthCode {
  email: string;
  code: string;
  expiresAt: number;
}

class Store {
  private users = new Map<string, User>();
  private emails = new Map<string, string>(); // email → userId
  private authCodes = new Map<string, AuthCode>(); // email → code
  private playlists = new Map<string, Playlist>();
  private sessions = new Map<string, string>(); // token → userId

  // Auth
  createAuthCode(email: string): { code: string } {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.authCodes.set(email, {
      email,
      code,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 min
    });
    return { code };
  }

  verifyAuthCode(email: string, code: string): User | null {
    const record = this.authCodes.get(email);
    if (!record || record.code !== code || Date.now() > record.expiresAt) {
      return null;
    }
    this.authCodes.delete(email);

    // Auto-create user if first time
    let userId = this.emails.get(email);
    if (!userId) {
      userId = `user_${Date.now()}`;
      const user: User = {
        id: userId,
        email,
        language: "en",
        region: "US",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        aiThreshold: 0.75,
        aiAutoApply: true,
      };
      this.users.set(userId, user);
      this.emails.set(email, userId);
    }

    return this.users.get(userId)!;
  }

  getUser(id: string): User | null {
    return this.users.get(id) ?? null;
  }

  getUserByEmail(email: string): User | null {
    const id = this.emails.get(email);
    return id ? this.users.get(id) ?? null : null;
  }

  createSession(userId: string): string {
    const token = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    this.sessions.set(token, userId);
    return token;
  }

  getUserIdFromSession(token: string): string | null {
    return this.sessions.get(token) ?? null;
  }

  // Playlists
  createPlaylist(userId: string, name: string): Playlist {
    const slug = Math.random().toString(36).substring(2, 10);
    const playlist: Playlist = {
      id: `pl_${Date.now()}`,
      userId,
      name,
      slug,
      channelIds: [],
      createdAt: new Date().toISOString(),
    };
    this.playlists.set(playlist.id, playlist);
    return playlist;
  }

  getUserPlaylists(userId: string): Playlist[] {
    return Array.from(this.playlists.values()).filter(
      (p) => p.userId === userId
    );
  }

  getPlaylist(id: string): Playlist | null {
    return this.playlists.get(id) ?? null;
  }

  updatePlaylistChannels(
    playlistId: string,
    channelIds: string[]
  ): Playlist | null {
    const pl = this.playlists.get(playlistId);
    if (!pl) return null;
    pl.channelIds = channelIds;
    return pl;
  }

  // Onboarding
  updateUserPreferences(
    userId: string,
    prefs: Partial<Pick<User, "language" | "region" | "aiThreshold" | "aiAutoApply">>
  ): User | null {
    const user = this.users.get(userId);
    if (!user) return null;
    Object.assign(user, prefs);
    return user;
  }
}

export const store = new Store();
