// Table of contents (function declaration line numbers)
// No named function declarations.

interface AdManager {
  _count: number;
  _threshold: number;
  _lastInsertedAt: number;
  maybeInsertAd(): void;
  insertAd(): void;
}

interface DiscordConfig {
  CLIENT_ID: string;
  REDIRECT_URI: string;
  SCOPES: string[];
  API_URL: string;
  AUTH_URL: string;
}

interface ChatPermissionSet {
  [permission: string]: boolean | undefined;
  read_messages?: boolean;
  send_messages?: boolean;
  delete_messages?: boolean;
  rename_channels?: boolean;
  create_channels?: boolean;
  manage_roles?: boolean;
  mute_users?: boolean;
  manage_messages?: boolean;
  manage_reports?: boolean;
  send_gifs?: boolean;
  send_links?: boolean;
  send_attachments?: boolean;
  mention_everyone?: boolean;
  bypass_word_filter?: boolean;
  create_invites?: boolean;
  use_custom_emojis?: boolean;
}

interface HTMLElement {
  value: string;
  disabled: boolean;
  checked: boolean;
  placeholder: string;
  files: FileList | null;
  selectionStart: number | null;
  selectionEnd: number | null;
  select(): void;
  setSelectionRange(start: number, end: number, direction?: "forward" | "backward" | "none"): void;
  src: string;
  href: string;
  target: string;
  rel: string;
  muted: boolean;
  volume: number;
  srcObject: MediaProvider | null;
  webkitTouchCallout: string;
  _lastThemeVarKeys?: string[];
}

interface Element {
  style: CSSStyleDeclaration;
  dataset: DOMStringMap;
  disabled: boolean;
  checked: boolean;
  value: string;
  placeholder: string;
  files: FileList | null;
  onclick: GlobalEventHandlers["onclick"];
  innerText: string;
  srcObject: MediaProvider | null;
  muted: boolean;
  volume: number;
  title: string;
  href: string;
  target: string;
  rel: string;
  focus(options?: FocusOptions): void;
  click(): void;
  getBoundingClientRect(): DOMRect;
  closest<K extends keyof HTMLElementTagNameMap>(selector: K): HTMLElementTagNameMap[K] | null;
  closest<E extends Element = Element>(selector: string): E | null;
}

interface Window {
  adManager?: AdManager;
  DISCORD_CONFIG?: DiscordConfig;
  guiAlert(message: string, title?: string): Promise<string | boolean | null>;
  guiConfirm(message: string, title?: string, danger?: boolean): Promise<string | boolean | null>;
  guiPrompt(message: string, initialValue?: string, title?: string): Promise<string | boolean | null>;
  webkitAudioContext?: typeof AudioContext;
  webkitRTCPeerConnection?: typeof RTCPeerConnection;
  activeConnections?: Record<string, RTCPeerConnection>;
  _logIpUnavailable?: boolean;
  chatUsername?: string;
  discordAccount?: Record<string, unknown>;
  supabase?: {
    createClient(
      url: string,
      key: string,
      options?: import("@supabase/supabase-js").SupabaseClientOptions<"public">,
    ): import("@supabase/supabase-js").SupabaseClient;
  };
  supabaseClient?: import("@supabase/supabase-js").SupabaseClient;
  __llaLoadUserPromise?: Promise<unknown>;
  silentAudioAnalyzerTest?: (...args: unknown[]) => unknown;
  simulatePerson?: (...args: unknown[]) => unknown;
  monitorNetworkAudio?: (...args: unknown[]) => unknown;
  testRemoteAudioLevel?: (...args: unknown[]) => unknown;
  testVoiceChat?: (...args: unknown[]) => unknown;
  quickVoiceCheck?: (...args: unknown[]) => unknown;
  testAudioPlayback?: (...args: unknown[]) => unknown;
  testAudioRouting?: (...args: unknown[]) => unknown;
  testPeerAudioFlow?: (...args: unknown[]) => unknown;
  startAudioLevelMonitoring?: (...args: unknown[]) => unknown;
  testAudioDeviceSwitching?: (...args: unknown[]) => unknown;
  runVoiceAudioTests?: (...args: unknown[]) => unknown;
  llaHelpers?: Record<string, (...args: unknown[]) => unknown>;
  llaHelperDefinitions?: Record<string, string[]>;
  llaHelp?: (...args: unknown[]) => unknown;
  llaState?: (...args: unknown[]) => unknown;
  llaDomCheck?: (...args: unknown[]) => unknown;
  llaStorageCheck?: (...args: unknown[]) => unknown;
  llaHealthCheck?: (...args: unknown[]) => unknown;
  llaAuthSession?: (...args: unknown[]) => unknown;
  llaAuthUser?: (...args: unknown[]) => unknown;
  llaAuthProfile?: (...args: unknown[]) => unknown;
  llaAuthStorage?: (...args: unknown[]) => unknown;
  llaAuthCheck?: (...args: unknown[]) => unknown;
  llaServerList?: (...args: unknown[]) => unknown;
  llaServerCheck?: (...args: unknown[]) => unknown;
  llaChannelList?: (...args: unknown[]) => unknown;
  llaChannelCheck?: (...args: unknown[]) => unknown;
  llaServerOrderCheck?: (...args: unknown[]) => unknown;
  llaRealtimeChannels?: (...args: unknown[]) => unknown;
  llaRealtimeProbe?: (...args: unknown[]) => unknown;
  llaRealtimeVoiceProbe?: (...args: unknown[]) => unknown;
  llaRealtimeServer?: (...args: unknown[]) => unknown;
  llaRealtimeCheck?: (...args: unknown[]) => unknown;
  llaMessageState?: (...args: unknown[]) => unknown;
  llaMessageFetch?: (...args: unknown[]) => unknown;
  llaMessageRealtime?: (...args: unknown[]) => unknown;
  llaMessageSearch?: (...args: unknown[]) => unknown;
  llaMessageRenderCheck?: (...args: unknown[]) => unknown;
  llaMemberState?: (...args: unknown[]) => unknown;
  llaMemberFetch?: (...args: unknown[]) => unknown;
  llaPresenceFetch?: (...args: unknown[]) => unknown;
  llaPresenceCheck?: (...args: unknown[]) => unknown;
  llaMemberSubscriptions?: (...args: unknown[]) => unknown;
  llaDmState?: (...args: unknown[]) => unknown;
  llaDmMemberships?: (...args: unknown[]) => unknown;
  llaDmFetch?: (...args: unknown[]) => unknown;
  llaDmRealtime?: (...args: unknown[]) => unknown;
  llaDmCheck?: (...args: unknown[]) => unknown;
  llaVoiceState?: (...args: unknown[]) => unknown;
  llaVoiceDevices?: (...args: unknown[]) => unknown;
  llaVoiceConnections?: (...args: unknown[]) => unknown;
  llaVoiceParticipants?: (...args: unknown[]) => unknown;
  llaVoiceRealtime?: (...args: unknown[]) => unknown;
  llaVoiceStats?: (...args: unknown[]) => unknown;
  llaVoiceMicLevel?: (...args: unknown[]) => unknown;
  llaVoiceStopMonitors?: (...args: unknown[]) => unknown;
  llaSpotifyCheck?: (...args: unknown[]) => unknown;
  llaDiscordCheck?: (...args: unknown[]) => unknown;
  llaNotificationCheck?: (...args: unknown[]) => unknown;
  llaThemeCheck?: (...args: unknown[]) => unknown;
  llaNetworkCheck?: (...args: unknown[]) => unknown;
  __llaVoiceMonitorFrame?: number;
  __llaVoiceMonitorContext?: AudioContext | null;
  handleSlashCommand?: (content: string, channelId: number | null) => Promise<unknown>;
  updateVoiceMuteFromSelf?: () => void;
}

interface CSSStyleDeclaration {
  webkitTouchCallout: string;
}

declare const guiAlert: Window["guiAlert"];
declare const guiConfirm: Window["guiConfirm"];
declare const guiPrompt: Window["guiPrompt"];
declare const showToast: (message: string) => void;

declare const emailjs: { send: (...args: unknown[]) => Promise<unknown> };
declare const Sortable: {
  new (element: HTMLElement, options: Record<string, unknown>): SortableInstance;
  create(element: HTMLElement, options: Record<string, unknown>): SortableInstance;
  utils: {
    closest(element: Element, selector: string): Element | null;
  };
};

interface SortableInstance {
  destroy(): void;
  option(name: string, value: unknown): void;
}

interface NotificationOptions {
  vibrate?: number | number[];
}
