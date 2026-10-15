export interface GameState {
  isDownloading: boolean;
  downloadProgress: number;
  downloadStatus: string;
  isGameLoaded: boolean;
  source: 'online' | 'local' | null;
  fileName: string | null;
  fileSizeMB: number | null;
  cachedInBrowser: boolean;
}

export interface GamepadStatus {
  connected: boolean;
  name: string;
  buttons: boolean[];
  axes: number[];
}

export interface AudioSettings {
  volume: number;
  muted: boolean;
}
