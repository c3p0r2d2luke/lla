type HelperResult = Record<string, unknown>;

const llaHelperDefinitions = {
  core: [
    "llaHelp",
    "llaState",
    "llaDomCheck",
    "llaStorageCheck",
    "llaHealthCheck"
  ],
  auth: [
    "llaAuthSession",
    "llaAuthUser",
    "llaAuthProfile",
    "llaAuthStorage",
    "llaAuthCheck"
  ],
  servers: [
    "llaServerList",
    "llaServerCheck",
    "llaChannelList",
    "llaChannelCheck",
    "llaServerOrderCheck"
  ],
  realtime: [
    "llaRealtimeChannels",
    "llaRealtimeProbe",
    "llaRealtimeVoiceProbe",
    "llaRealtimeServer",
    "llaRealtimeCheck"
  ],
  messages: [
    "llaMessageState",
    "llaMessageFetch",
    "llaMessageRealtime",
    "llaMessageSearch",
    "llaMessageRenderCheck"
  ],
  members: [
    "llaMemberState",
    "llaMemberFetch",
    "llaPresenceFetch",
    "llaPresenceCheck",
    "llaMemberSubscriptions"
  ],
  directMessages: [
    "llaDmState",
    "llaDmMemberships",
    "llaDmFetch",
    "llaDmRealtime",
    "llaDmCheck"
  ],
  voice: [
    "testVoiceChat",
    "quickVoiceCheck",
    "testAudioPlayback",
    "testAudioRouting",
    "testPeerAudioFlow",
    "startAudioLevelMonitoring",
    "testAudioDeviceSwitching",
    "runVoiceAudioTests",
    "silentAudioAnalyzerTest",
    "simulatePerson",
    "monitorNetworkAudio",
    "testRemoteAudioLevel",
    "llaVoiceState",
    "llaVoiceDevices",
    "llaVoiceConnections",
    "llaVoiceParticipants",
    "llaVoiceRealtime",
    "llaVoiceStats",
    "llaVoiceMicLevel",
    "llaVoiceStopMonitors"
  ],
  integrations: [
    "llaSpotifyCheck",
    "llaDiscordCheck",
    "llaNotificationCheck",
    "llaThemeCheck",
    "llaNetworkCheck"
  ]
};

function helperClient() {
  if (typeof supabaseClient === "undefined" || !supabaseClient) {
    throw new Error("Supabase client is not initialized");
  }
  return supabaseClient;
}

function helperError(error: unknown) {
  if (!error) return null;
  const value = error as { message?: string; code?: string; details?: string; hint?: string };
  return {
    message: value.message || String(error),
    code: value.code || null,
    details: value.details || null,
    hint: value.hint || null
  };
}

function helperLog(label: string, result: unknown) {
  console.group(`[LLA helper] ${label}`);
  console.log(result);
  console.groupEnd();
  return result;
}

function getHelperTable(table: string, allowedTables: string[]) {
  if (!allowedTables.includes(table)) {
    throw new Error(`Unsupported diagnostic table "${table}". Allowed: ${allowedTables.join(", ")}`);
  }
  return table;
}

function getVoiceAudioContext(): typeof AudioContext {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) throw new Error("AudioContext is not supported by this browser");
  return AudioContextClass;
}

async function getVoiceDevices() {
  if (!navigator.mediaDevices?.enumerateDevices) {
    throw new Error("Media device enumeration is not supported");
  }
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices
    .filter((device) => device.kind === "audioinput" || device.kind === "audiooutput")
    .map((device, index) => ({
      index,
      kind: device.kind,
      label: device.label || "(label hidden until microphone permission is granted)",
      deviceIdAvailable: Boolean(device.deviceId)
    }));
}

async function getVoiceConnectionStats() {
  const connections = currentPeerConnections instanceof Map
    ? Array.from(currentPeerConnections.entries())
    : [];
  const results = [];
  for (const [peer, connection] of connections) {
    const stats = await connection.getStats();
    const audio = [];
    stats.forEach((report) => {
      if (report.type === "inbound-rtp" || report.type === "outbound-rtp") {
        if (report.kind === "audio" || report.mediaType === "audio") {
          audio.push({
            type: report.type,
            state: report.kind || report.mediaType,
            bytesReceived: report.bytesReceived || 0,
            bytesSent: report.bytesSent || 0,
            packetsReceived: report.packetsReceived || 0,
            packetsSent: report.packetsSent || 0,
            packetsLost: report.packetsLost || 0
          });
        }
      }
    });
    results.push({
      peer,
      connectionState: connection.connectionState,
      iceConnectionState: connection.iceConnectionState,
      signalingState: connection.signalingState,
      audio
    });
  }
  return results;
}

async function voiceAudioLevel(stream: MediaStream, durationMs = 1500) {
  const Context = getVoiceAudioContext();
  const context = new Context();
  const source = context.createMediaStreamSource(stream);
  const analyser = context.createAnalyser();
  const silentGain = context.createGain();
  analyser.fftSize = 1024;
  source.connect(analyser);
  silentGain.gain.value = 0;
  analyser.connect(silentGain);
  silentGain.connect(context.destination);
  const samples: number[] = [];
  const buffer = new Float32Array(analyser.fftSize);
  const stopAt = performance.now() + Math.max(300, Math.min(5000, durationMs));
  try {
    while (performance.now() < stopAt) {
      analyser.getFloatTimeDomainData(buffer);
      const sum = buffer.reduce((total, value) => total + value * value, 0);
      samples.push(Math.sqrt(sum / buffer.length));
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  } finally {
    source.disconnect();
    analyser.disconnect();
    silentGain.disconnect();
    await context.close();
  }
  return {
    samples: samples.length,
    averageRms: samples.reduce((sum, value) => sum + value, 0) / Math.max(1, samples.length),
    peakRms: Math.max(0, ...samples)
  };
}

async function voiceRealtimeProbe(table: string, timeoutMs = 5000) {
  const allowedTables = [
    "channels", "categories", "messages", "server_members", "channel_presence",
    "voice_room_participants", "voice_signaling"
  ];
  const safeTable = getHelperTable(table, allowedTables);
  const client = helperClient();
  const channelName = `lla-diagnostic-${safeTable}-${Date.now()}`;
  const result = { table: safeTable, status: "WAITING", error: null as unknown, elapsedMs: 0 };
  const startedAt = performance.now();
  const channel = client
    .channel(channelName)
    .on("postgres_changes", { event: "*", schema: "public", table: safeTable }, () => {})
    .subscribe((status, error) => {
      result.status = status;
      result.error = helperError(error);
    });
  const deadline = Date.now() + Math.max(1000, Math.min(15000, timeoutMs));
  try {
    while (result.status === "WAITING" && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  } finally {
    result.elapsedMs = Math.round(performance.now() - startedAt);
    await client.removeChannel(channel);
  }
  return helperLog(`Realtime probe: ${safeTable}`, result);
}

async function probeMicrophone(durationMs = 1200) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Microphone capture is not supported by this browser");
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  try {
    const tracks = stream.getAudioTracks().map((track) => ({
      label: track.label,
      enabled: track.enabled,
      muted: track.muted,
      readyState: track.readyState,
      settings: track.getSettings()
    }));
    const levels = await voiceAudioLevel(stream, durationMs);
    return { tracks, levels };
  } finally {
    stream.getTracks().forEach((track) => track.stop());
  }
}

async function voicePlaybackTone(durationMs = 600, frequency = 440) {
  const Context = getVoiceAudioContext();
  const context = new Context();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = Math.max(100, Math.min(1000, frequency));
  gain.gain.value = 0.04;
  oscillator.connect(gain);
  gain.connect(context.destination);
  try {
    await context.resume();
    oscillator.start();
    await new Promise((resolve) => setTimeout(resolve, Math.max(100, Math.min(1500, durationMs))));
  } finally {
    oscillator.stop();
    oscillator.disconnect();
    gain.disconnect();
    await context.close();
  }
  return { success: true, frequency: oscillator.frequency.value };
}

function stopVoiceMonitoring() {
  if (window.__llaVoiceMonitorFrame) {
    cancelAnimationFrame(window.__llaVoiceMonitorFrame);
    window.__llaVoiceMonitorFrame = 0;
  }
  if (window.__llaVoiceMonitorContext) {
    void window.__llaVoiceMonitorContext.close();
    window.__llaVoiceMonitorContext = null;
  }
  return { stopped: true };
}

const llaHelpers = {
  async llaHelp() {
    return helperLog("Available helpers", llaHelperDefinitions);
  },

  llaState() {
    return helperLog("Application state", {
      username,
      systemRole: currentSystemRole,
      role: currentRole,
      serverId: currentServerId,
      channelId: currentChannelId,
      servers: servers?.length ?? 0,
      channels: channels?.length ?? 0,
      members: serverMembers?.length ?? 0,
      conversations: directConversations?.length ?? 0,
      messageCacheEntries: messagesMap?.size ?? 0,
      voiceChannelId: currentVoiceChannelId
    });
  },

  llaDomCheck() {
    const required = ["appContent", "serverList", "channelList", "messages", "messageInput"];
    return helperLog("Required UI elements", Object.fromEntries(
      required.map((id) => [id, Boolean(document.getElementById(id))])
    ));
  },

  llaStorageCheck() {
    const keys = ["chatUsername", "chatRole", "chatSysAdmin", "chatSysManager"];
    return helperLog("Local storage state", Object.fromEntries(
      keys.map((key) => [key, localStorage.getItem(key)])
    ));
  },

  async llaHealthCheck() {
    const state = llaHelpers.llaState();
    const dom = llaHelpers.llaDomCheck();
    const session = await llaHelpers.llaAuthSession();
    const realtime = llaHelpers.llaRealtimeChannels();
    return helperLog("Application health", { state, dom, session, realtime });
  },

  async llaAuthSession() {
    const { data, error } = await helperClient().auth.getSession();
    return helperLog("Auth session", {
      hasSession: Boolean(data.session),
      userId: data.session?.user?.id || null,
      expiresAt: data.session?.expires_at || null,
      error: helperError(error)
    });
  },

  async llaAuthUser() {
    const { data, error } = await helperClient().auth.getUser();
    return helperLog("Authenticated user", {
      id: data.user?.id || null,
      emailConfirmedAt: data.user?.email_confirmed_at || null,
      lastSignInAt: data.user?.last_sign_in_at || null,
      error: helperError(error)
    });
  },

  async llaAuthProfile() {
    const { data, error } = await helperClient()
      .from("users")
      .select("username, auth_id, system_role, blocked, muted_until")
      .eq("username", username)
      .maybeSingle();
    return helperLog("User profile row", { data, error: helperError(error) });
  },

  llaAuthStorage() {
    return helperLog("Stored auth keys", Object.keys(localStorage)
      .filter((key) => key.startsWith("sb-") || key.startsWith("chat"))
      .map((key) => ({ key, present: true })));
  },

  async llaAuthCheck() {
    const [session, user, profile] = await Promise.all([
      llaHelpers.llaAuthSession(), llaHelpers.llaAuthUser(), llaHelpers.llaAuthProfile()
    ]);
    return helperLog("Auth diagnostic", { session, user, profile });
  },

  llaServerList() {
    return helperLog("Loaded servers", (servers || []).map((server) => ({
      id: server.id, name: server.name, slug: server.slug
    })));
  },

  async llaServerCheck(serverId = currentServerId) {
    if (!serverId) return helperLog("Server check", { error: "No server selected" });
    const [server, membership] = await Promise.all([
      helperClient().from("servers").select("id, name, slug").eq("id", serverId).maybeSingle(),
      helperClient().from("server_members").select("id, role").eq("server_id", serverId).eq("username", username).maybeSingle()
    ]);
    return helperLog("Server check", {
      server: server.data, serverError: helperError(server.error),
      membership: membership.data, membershipError: helperError(membership.error)
    });
  },

  llaChannelList(serverId = currentServerId) {
    return helperLog("Loaded channels", (channels || [])
      .filter((channel) => !serverId || channel.server_id === serverId)
      .map((channel) => ({
        id: channel.id, name: channel.name, type: channel.channel_type, categoryId: channel.category_id
      })));
  },

  async llaChannelCheck(channelId = currentChannelId) {
    if (!channelId) return helperLog("Channel check", { error: "No channel selected" });
    const { data, error } = await helperClient()
      .from("channels").select("id, name, channel_type, server_id, category_id")
      .eq("id", channelId).maybeSingle();
    return helperLog("Channel check", { data, error: helperError(error) });
  },

  async llaServerOrderCheck() {
    const { data, error } = await helperClient()
      .from("user_server_order").select("server_id, sort_order")
      .eq("username", username).order("sort_order", { ascending: true });
    return helperLog("Persisted server ordering", {
      rows: data || [], local: localStorage.getItem(`serverOrder:${username}`),
      error: helperError(error)
    });
  },

  llaRealtimeChannels() {
    const channelsNow = helperClient().getChannels();
    return helperLog("Realtime channel registry", channelsNow.map((channel) => ({
      topic: channel.topic,
      state: channel.state,
      bindingCount: channel.bindings?.length || 0
    })));
  },

  async llaRealtimeProbe(table = "messages", timeoutMs = 5000) {
    return voiceRealtimeProbe(table, timeoutMs);
  },

  async llaRealtimeVoiceProbe(timeoutMs = 5000) {
    const [room, signaling] = await Promise.all([
      voiceRealtimeProbe("voice_room_participants", timeoutMs),
      voiceRealtimeProbe("voice_signaling", timeoutMs)
    ]);
    return helperLog("Voice Realtime probes", { room, signaling });
  },

  llaRealtimeServer() {
    const url = window.CHAT_CONFIG?.SUPABASE_URL;
    const websocketUrl = url
      ? new URL(url, window.location.origin).toString().replace(/^http/, "ws") + "/realtime/v1/websocket"
      : null;
    return helperLog("Realtime endpoint", {
      configuredBaseUrl: url || null,
      websocketUrl,
      online: navigator.onLine,
      secureContext: window.isSecureContext
    });
  },

  async llaRealtimeCheck() {
    const channelsNow = llaHelpers.llaRealtimeChannels();
    const probe = await voiceRealtimeProbe("messages", 5000);
    return helperLog("Realtime check", { channels: channelsNow, probe });
  },

  llaMessageState() {
    const cached = messagesMap?.get?.(currentChannelId) || [];
    return helperLog("Message state", {
      channelId: currentChannelId,
      cachedMessages: cached.length,
      renderedMessages: document.querySelectorAll("#messages .message").length,
      lastMessageId: cached.at?.(-1)?.id || null
    });
  },

  async llaMessageFetch(channelId = currentChannelId, limit = 10) {
    if (!channelId) return helperLog("Message fetch", { error: "No channel selected" });
    const { data, error, count } = await helperClient()
      .from("messages")
      .select("id, username, channel_id, inserted_at, content", { count: "exact" })
      .eq("channel_id", channelId)
      .order("inserted_at", { ascending: false })
      .limit(Math.max(1, Math.min(100, Math.floor(Number(limit) || 10))));
    return helperLog("Recent channel messages", {
      count, rows: data || [], error: helperError(error)
    });
  },

  async llaMessageRealtime(timeoutMs = 5000) {
    return voiceRealtimeProbe("messages", timeoutMs);
  },

  async llaMessageSearch(query = "") {
    const term = String(query).trim();
    if (!term) return helperLog("Message search", { error: "Pass a non-empty search term" });
    const { data, error } = await helperClient()
      .from("messages").select("id, username, channel_id, inserted_at, content")
      .eq("channel_id", currentChannelId).ilike("content", `%${term}%`).limit(20);
    return helperLog("Message search", { rows: data || [], error: helperError(error) });
  },

  llaMessageRenderCheck() {
    const list = document.getElementById("messages");
    return helperLog("Message renderer", {
      elementPresent: Boolean(list),
      display: list?.style.display || null,
      children: list?.children.length || 0,
      channelId: currentChannelId,
      voiceViewActive: Boolean(currentVoiceChannelId)
    });
  },

  llaMemberState() {
    return helperLog("Member state", {
      serverId: currentServerId,
      memberCount: serverMembers?.length || 0,
      presenceCount: memberPresence?.length || 0,
      canViewMembers: typeof canViewMembers === "function" ? canViewMembers() : null
    });
  },

  async llaMemberFetch(serverId = currentServerId, limit = 100) {
    if (!serverId) return helperLog("Member fetch", { error: "No server selected" });
    const { data, error, count } = await helperClient()
      .from("server_members").select("id, username, role, joined_at", { count: "exact" })
      .eq("server_id", serverId).order("username").limit(Math.min(100, Math.max(1, limit)));
    return helperLog("Server members", { count, rows: data || [], error: helperError(error) });
  },

  async llaPresenceFetch(serverId = currentServerId) {
    if (!serverId) return helperLog("Presence fetch", { error: "No server selected" });
    const { data, error } = await helperClient()
      .from("channel_presence").select("username, channel_id, updated_at")
      .eq("server_id", serverId).order("updated_at", { ascending: false }).limit(100);
    return helperLog("Server presence", { rows: data || [], error: helperError(error) });
  },

  async llaPresenceCheck() {
    const [members, presence] = await Promise.all([
      llaHelpers.llaMemberFetch(), llaHelpers.llaPresenceFetch()
    ]);
    return helperLog("Presence diagnostic", { members, presence });
  },

  llaMemberSubscriptions() {
    return helperLog("Member realtime subscriptions", helperClient().getChannels()
      .filter((channel) => channel.topic.includes("members-realtime") || channel.topic.includes("server-memberships"))
      .map((channel) => ({ topic: channel.topic, state: channel.state })));
  },

  llaDmState() {
    return helperLog("Direct message state", {
      conversationCount: directConversations?.length || 0,
      conversationId: currentDmConversationId,
      conversationType: currentConversationType,
      activeDmMessages: document.querySelectorAll("#messages .message").length
    });
  },

  async llaDmMemberships() {
    const { data, error } = await helperClient()
      .from("direct_conversation_members").select("conversation_id, joined_at")
      .eq("username", username).order("joined_at", { ascending: false }).limit(50);
    return helperLog("Direct message memberships", { rows: data || [], error: helperError(error) });
  },

  async llaDmFetch(conversationId = currentDmConversationId, limit = 20) {
    if (!conversationId) return helperLog("Direct message fetch", { error: "No conversation selected" });
    const { data, error } = await helperClient()
      .from("dm_messages")
      .select("id, conversation_id, username, inserted_at, content")
      .eq("conversation_id", conversationId)
      .order("inserted_at", { ascending: false }).limit(Math.min(100, Math.max(1, limit)));
    return helperLog("Direct messages", { rows: data || [], error: helperError(error) });
  },

  llaDmRealtime() {
    return helperLog("DM realtime subscriptions", helperClient().getChannels()
      .filter((channel) => channel.topic.includes("dm-"))
      .map((channel) => ({ topic: channel.topic, state: channel.state })));
  },

  async llaDmCheck() {
    const memberships = await llaHelpers.llaDmMemberships();
    const state = llaHelpers.llaDmState();
    return helperLog("Direct message diagnostic", { memberships, state });
  },

  async testVoiceChat() {
    const browserSupport = {
      getUserMedia: Boolean(navigator.mediaDevices?.getUserMedia),
      enumerateDevices: Boolean(navigator.mediaDevices?.enumerateDevices),
      RTCPeerConnection: Boolean(window.RTCPeerConnection || window.webkitRTCPeerConnection),
      AudioContext: Boolean(window.AudioContext || window.webkitAudioContext),
      secureContext: window.isSecureContext
    };
    let permissions: HelperResult = { microphone: "not-tested" };
    let devices: unknown[] = [];
    let database: HelperResult = {};
    let micLevels: HelperResult | null = null;
    try {
      if (navigator.permissions?.query) {
        const permission = await navigator.permissions.query({ name: "microphone" as PermissionName });
        permissions = { microphone: permission.state };
      }
    } catch (error) {
      permissions = { error: helperError(error) };
    }
    try { devices = await getVoiceDevices(); }
    catch (error) { devices = [{ error: helperError(error) }]; }
    try { micLevels = await probeMicrophone(); permissions = { ...permissions, capture: "granted" }; }
    catch (error) { permissions = { ...permissions, captureError: helperError(error) }; }
    try {
      const result = await helperClient().from("voice_room_participants")
        .select("id", { count: "exact", head: true }).limit(1);
      database = { reachable: !result.error, error: helperError(result.error) };
    } catch (error) { database = { reachable: false, error: helperError(error) }; }
    const voiceState = llaHelpers.llaVoiceState();
    const webrtc = llaHelpers.llaVoiceConnections();
    const summary = [
      ...Object.entries(browserSupport).filter(([, supported]) => supported === false).map(([name]) => `Unsupported: ${name}`),
      ...(!currentVoiceChannelId ? ["Not currently joined to a voice channel"] : []),
      ...(helperError((database as HelperResult).error) ? ["Voice participant table query failed"] : [])
    ];
    return helperLog("Voice diagnostic", { browserSupport, permissions, devices, micLevels, database, voiceState, webrtc, summary });
  },

  quickVoiceCheck() {
    const state = llaHelpers.llaVoiceState();
    const connections = llaHelpers.llaVoiceConnections();
    const issues = [];
    if (!navigator.mediaDevices?.getUserMedia) issues.push("Microphone capture unsupported");
    if (!window.RTCPeerConnection && !window.webkitRTCPeerConnection) issues.push("WebRTC unsupported");
    if (!currentVoiceChannelId) issues.push("Not in a voice channel");
    if (currentVoiceChannelId && !localStream) issues.push("Joined state has no local stream");
    if (localStream?.getAudioTracks().some((track) => track.readyState !== "live")) issues.push("A microphone track is not live");
    return helperLog("Quick voice check", { issues, state, connections });
  },

  async testAudioPlayback(durationMs = 600) {
    return helperLog("Local audio output test", await voicePlaybackTone(durationMs));
  },

  async testAudioRouting() {
    const result = await probeMicrophone(1500);
    return helperLog("Microphone capture/level test (no speaker loopback)", result);
  },

  async testPeerAudioFlow() {
    const state = llaHelpers.llaVoiceState();
    const stats = await getVoiceConnectionStats();
    return helperLog("Live peer audio flow (read-only stats)", { state, peers: stats });
  },

  startAudioLevelMonitoring() {
    stopVoiceMonitoring();
    if (!localStream) return helperLog("Audio monitor", { error: "Join a voice channel first" });
    const Context = getVoiceAudioContext();
    const context = new Context();
    const source = context.createMediaStreamSource(localStream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    const values = new Float32Array(analyser.fftSize);
    const monitor = () => {
      if (!localStream || context.state === "closed") {
        stopVoiceMonitoring();
        return;
      }
      analyser.getFloatTimeDomainData(values);
      const rms = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0) / values.length);
      const tile = document.querySelector(".voice-participant.is-self .voice-participant-avatar");
      tile?.classList.toggle("speaking", rms > 0.01);
      window.__llaVoiceMonitorFrame = requestAnimationFrame(monitor);
    };
    window.__llaVoiceMonitorContext = context;
    window.__llaVoiceMonitorFrame = requestAnimationFrame(monitor);
    return helperLog("Audio monitor started", { stopCommand: "llaVoiceStopMonitors()", contextState: context.state });
  },

  async testAudioDeviceSwitching() {
    return helperLog("Audio device inventory (no live device switching)", await getVoiceDevices());
  },

  async runVoiceAudioTests() {
    const support = llaHelpers.quickVoiceCheck();
    const devices = await llaHelpers.testAudioDeviceSwitching();
    const peerFlow = await llaHelpers.testPeerAudioFlow();
    return helperLog("Voice tests (safe, no test call created)", { support, devices, peerFlow });
  },

  async silentAudioAnalyzerTest() {
    const Context = getVoiceAudioContext();
    const context = new Context();
    try {
      const analyser = context.createAnalyser();
      const values = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(values);
      return helperLog("Silent analyser capability test", {
        contextState: context.state,
        analyserCreated: true,
        averageLevel: values.reduce((sum, value) => sum + value, 0) / values.length,
        note: "This checks the analyser graph only; it cannot detect system audio."
      });
    } finally {
      await context.close();
    }
  },

  async simulatePerson() {
    return helperLog("Local voice test tone", await voicePlaybackTone(1200, 440));
  },

  async monitorNetworkAudio() {
    return llaHelpers.llaVoiceStats();
  },

  async testRemoteAudioLevel(targetUsername: string, durationMs = 1500) {
    if (!targetUsername) return helperLog("Remote audio test", { error: "Pass a participant username" });
    const audio = document.getElementById(`audio-${targetUsername}`);
    if (!(audio instanceof HTMLAudioElement) || !(audio.srcObject instanceof MediaStream)) {
      return helperLog("Remote audio test", { username: targetUsername, error: "No remote audio stream element found" });
    }
    return helperLog(`Remote audio level: ${targetUsername}`, await voiceAudioLevel(audio.srcObject, durationMs));
  },

  llaVoiceState() {
    const tracks = localStream?.getAudioTracks().map((track) => ({
      enabled: track.enabled, muted: track.muted, state: track.readyState, label: track.label
    })) || [];
    return helperLog("Voice state", {
      channelId: currentVoiceChannelId,
      localStream: Boolean(localStream),
      tracks,
      selfMuted,
      selfDeafened,
      participants: voiceParticipantState instanceof Map ? Array.from(voiceParticipantState.entries()) : []
    });
  },

  async llaVoiceDevices() {
    return helperLog("Audio devices", await getVoiceDevices());
  },

  llaVoiceConnections() {
    return helperLog("Peer connections", currentPeerConnections instanceof Map
      ? Array.from(currentPeerConnections.entries()).map(([peer, connection]) => ({
        peer, connectionState: connection.connectionState,
        iceConnectionState: connection.iceConnectionState, signalingState: connection.signalingState
      }))
      : []);
  },

  llaVoiceParticipants(channelId = currentVoiceChannelId) {
    if (!channelId) return helperLog("Voice participants", { error: "Join or select a voice channel" });
    return helperClient().from("voice_room_participants")
      .select("username, joined_at, is_muted, is_deafened, is_admin_muted, is_admin_deafened")
      .eq("channel_id", channelId)
      .then(({ data, error }) => helperLog("Voice participants", {
        rows: data || [], error: helperError(error)
      }));
  },

  async llaVoiceRealtime(timeoutMs = 5000) {
    return llaHelpers.llaRealtimeVoiceProbe(timeoutMs);
  },

  async llaVoiceStats() {
    return helperLog("WebRTC audio stats", await getVoiceConnectionStats());
  },

  async llaVoiceMicLevel(durationMs = 1500) {
    if (!localStream) return helperLog("Microphone level", await probeMicrophone(durationMs));
    return helperLog("Current microphone level", await voiceAudioLevel(localStream, durationMs));
  },

  llaVoiceStopMonitors() {
    return helperLog("Voice monitors", stopVoiceMonitoring());
  },

  async llaSpotifyCheck() {
    const { data, error } = await helperClient().from("users")
      .select("spotify_track, spotify_artist, spotify_album_art, spotify_is_playing")
      .eq("username", username).maybeSingle();
    return helperLog("Spotify profile presence", { data, error: helperError(error) });
  },

  async llaDiscordCheck() {
    const { data, error } = await helperClient().from("discord_accounts")
      .select("discord_user_id, discord_username, token_expires_at")
      .eq("username", username).maybeSingle();
    return helperLog("Discord linked account", { data, error: helperError(error) });
  },

  async llaNotificationCheck() {
    const registration = await navigator.serviceWorker?.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    return helperLog("Push notification state", {
      supported: "Notification" in window && "serviceWorker" in navigator,
      permission: "Notification" in window ? Notification.permission : "unsupported",
      serviceWorker: Boolean(registration),
      subscribed: Boolean(subscription)
    });
  },

  llaThemeCheck() {
    return helperLog("Theme state", {
      themeId: currentThemeId || null,
      availableThemes: availableThemes?.length || 0,
      themeStylesheets: Array.from(document.querySelectorAll("style")).filter((style) => style.dataset.theme).length,
      cssVariables: {
        background: getComputedStyle(document.documentElement).getPropertyValue("--bg-primary").trim(),
        text: getComputedStyle(document.documentElement).getPropertyValue("--text-main").trim()
      }
    });
  },

  async llaNetworkCheck() {
    const probe = await fetch(`${window.CHAT_CONFIG.SUPABASE_URL}/rest/v1/`, { method: "HEAD" });
    return helperLog("Network reachability", {
      online: navigator.onLine,
      origin: location.origin,
      supabaseProxy: window.CHAT_CONFIG.SUPABASE_URL,
      restStatus: probe.status,
      restReachable: probe.status < 500
    });
  }
};

Object.assign(window, llaHelpers, { llaHelpers, llaHelperDefinitions });
console.info("LLA console helpers ready. Run llaHelp() to list all diagnostic commands.");
