# Chat source map

Files are grouped by their existing feature area. Named function declarations are listed alphabetically under the file where they are defined; the TypeScript source files are emitted as classic browser scripts and share globals, so their loading order is preserved in `../public/index.html`.

## Feature files

| File | Category |
| --- | --- |
| [`ad.ts`](ad.ts) | Ad integration |
| [`admin_debug.ts`](admin_debug.ts) | Admin tools, diagnostics, and tutorials |
| [`auth.ts`](auth.ts) | Authentication, profiles, and identity |
| [`browser-globals.d.ts`](browser-globals.d.ts) | Shared browser globals and client-side types |
| [`chat-config.d.ts`](chat-config.d.ts) | Runtime chat configuration types |
| [`chat-redirect.ts`](chat-redirect.ts) | Chat redirect entry point |
| [`chat.ts`](chat.ts) | Chat UI, channels, members, and message interactions |
| [`commands.ts`](commands.ts) | Voice, message, and channel-permission commands |
| [`constants.ts`](constants.ts) | Shared UI helpers, constants, and context menus |
| [`discord-config.ts`](discord-config.ts) | Discord integration configuration types |
| [`discord.ts`](discord.ts) | Discord account linking, import, and synchronization |
| [`realtime.ts`](realtime.ts) | Realtime subscriptions, direct messages, and reactions |
| [`server.ts`](server.ts) | Server navigation, settings, roles, and account UI |
| [`spotify-callback.ts`](spotify-callback.ts) | Spotify OAuth callback page logic |
| [`spotify.ts`](spotify.ts) | Spotify linking, presence, and playback status |
| [`sw.ts`](sw.ts) | Service worker and offline behavior |
| [`ui-dialogs.ts`](ui-dialogs.ts) | Shared dialog and confirmation helpers |

## [`ad.ts`](ad.ts) — Ad integration

`createAdElement`, `ensureStyles`, `randThreshold`

## [`admin_debug.ts`](admin_debug.ts) — Admin tools, diagnostics, and tutorials

`advanceStep`, `advanceTutorial`, `appendLine`, `applyFirstAutocomplete`, `buildExpandableTree`, `checkConnection`, `clearConsole`, `closeDragElement`, `dragMouseDown`, `elementDrag`, `endTutorial`, `fixPlainGifUrls`, `formatArg`, `formatConsoleArgs`, `getDynamicSuggestions`, `hideAutocomplete`, `initAdminDebugPanel`, `interceptConsole`, `interceptFetch`, `logToAdminConsole`, `makeElementDraggable`, `makeToolbarBtn`, `overrideConsoleMethods`, `positionTutorialStep`, `removeLocalStorageKey`, `runCommand`, `serializeValue`, `shortenUrl`, `startMobileTutorial`, `startTutorial`, `toggleFilter`, `toggleMobileSimulation`, `typeColor`, `typeTextColor`, `updateAutocomplete`, `updateCoachMark`

## [`auth.ts`](auth.ts) — Authentication, profiles, and identity

`applyMentionSuggestion`, `applyMessageSearchFilter`, `bootstrapAuth`, `buildAvatarElement`, `bustAvatarUrl`, `canManageServerOptions`, `canMentionEveryone`, `canPostImagesInChannel`, `canUseRestrictedCustomEmojis`, `canViewMembers`, `changeMyAvatar`, `deriveDefaultUsername`, `doSignIn`, `doSignUp`, `editMyServerProfile`, `ensureUserProfileRow`, `escapeHTML`, `escapeRegExp`, `getAuthRedirectUrl`, `getAvatarUrl`, `getChannelCheckpointKey`, `getChannelMentionCount`, `getChannelUnreadCount`, `getCurrentServerMemberUsernames`, `getDamerauLevenshteinDistance`, `getDisplayName`, `getEffectiveAvatarUrl`, `getEffectiveDisplayName`, `getEffectiveServerSettings`, `getEffectiveServerWordFilters`, `getEmojiContext`, `getFilterSkeleton`, `getInitials`, `getMentionCandidates`, `getMentionContext`, `getMentionReadStorageKey`, `getMessageSearchText`, `getSafeUrl`, `getServerCheckpoint`, `getServerCheckpointKey`, `getServerMentionCount`, `getServerProfileData`, `getServerProfileKey`, `handleAuthRedirectIfNeeded`, `handleAuthSuccess`, `hideAuthGate`, `hideMentionSuggestions`, `invokeSendPush`, `isServerOwner`, `loadAvatarMapForUsernames`, `loadChannelServerMap`, `loadServerSettings`, `loadUserPermissions`, `markServerMentionsRead`, `markServerMessagesRead`, `messageMentionsUser`, `normalizeFilterToken`, `normalizeSearchValue`, `normalizeUsernameInput`, `notifyMentionClientSide`, `readChannelCheckpointMap`, `readMentionReadMap`, `readServerCheckpointMap`, `refreshUnreadMentionCounts`, `renderMentionSuggestions`, `sendMagicLink`, `sendPushToUsers`, `setAvatarUrl`, `setChannelCheckpoint`, `setInlineAuthNotice`, `setMemberListVisibility`, `setSearchInputVisibility`, `setServerCheckpoint`, `setServerProfileData`, `showAuthGate`, `showLocalTestNotification`, `signInWithOAuthProvider`, `stopMemberRealtime`, `subscribeToGlobalMentions`, `tokenMatchesFilteredWord`, `updateMentionSuggestions`, `updateMessageLock`, `updateProfileButton`, `uploadAvatarAsset`, `uploadAvatarFile`, `uploadServerProfileAvatar`, `validateUsername`, `waitForGlobalFunction`, `wireSearchToggle`, `writeChannelCheckpointMap`, `writeMentionReadMap`, `writeServerCheckpointMap`

## [`chat.ts`](chat.ts) — Chat UI, channels, members, and message interactions

`addCustomEmoji`, `addMemberToAnotherServer`, `addReaction`, `applyMuteBlockUI`, `attachHoverControls`, `attemptSpotifyInit`, `blockUser`, `buildEmojiPicker`, `buildLinkPreview`, `clearReply`, `closeCreateChannelModal`, `closeInlineRow`, `closeLightbox`, `closeServerSidebar`, `closeSidebar`, `containsPlainTextUrl`, `createDiscordEmbedElement`, `createMessageElement`, `deleteCustomEmoji`, `deleteKeyword`, `deleteMessage`, `deleteUser`, `displayName`, `editMessage`, `enablePush`, `ensureGeneralCategoryAndFixOrphans`, `executeScripts`, `exportChat`, `filterEmojis`, `forceLogout`, `formatMessageContent`, `getAllReactionEmojiChoices`, `getCustomEmojiCategory`, `getEmojiSuggestionItems`, `getFileType`, `getRecentEmojis`, `handleForcedLogout`, `handleMentionReadScroll`, `handleRealtimeDmMessage`, `handleRealtimeMessage`, `insertMessageInOrder`, `isEmojiOnlyMessage`, `isGlobalMuteActive`, `isServerMuteActive`, `isUserBlockedOrMutedSync`, `kickMemberFromCurrentServer`, `loadCustomEmojis`, `loadDefaultChannel`, `loadMessages`, `loadOlderMessagesAtTop`, `loadUser`, `loadUserInternal`, `markMentionMessagesReadThrough`, `muteReason`, `muteUser`, `openCreateChannelModal`, `openEmojiPicker`, `openInlineRow`, `openLightbox`, `performCreateCategory`, `performCreateChannel`, `performDeleteCategory`, `performDeleteChannel`, `performRenameCategory`, `performRenameChannel`, `pinMessage`, `populateCategories`, `processMentions`, `promote`, `rebuildCustomGrid`, `reconcileCurrentChannelMessages`, `refreshOwnServerMemberStatus`, `renderEmojiGrid`, `renderEmojiSuggestionPreview`, `renderMentionToken`, `renderMessage`, `renderReactions`, `renderReply`, `replaceCustomEmojiShortcodes`, `reportMessage`, `resolveAssetUrl`, `resolveDiscordRoleMentions`, `saveName`, `saveRecentEmoji`, `scrollToBottom`, `sendMessage`, `sendReply`, `setMemberServerRole`, `showCategory`, `showCategoryContextMenu`, `showContextMenu`, `showInlineDelete`, `showInlineDeleteCategory`, `showMentionToast`, `startGlobalMuteCountdownUI`, `startMuteCountdownUI`, `startReply`, `stopMuteCountdownUI`, `subscribeToOwnServerStatus`, `subscribeToUserStatus`, `switchChannel`, `switchChannelInternal`, `syncDiscordMessageChange`, `toggleSelfMute`, `transferOwnership`, `unblockUser`, `updateMentionReadBar`, `updateMuteUI`, `updateSelfMuteBadge`, `updateTypingUI`, `uploadCustomEmojiFile`, `userInfo`, `waitForImagesBeforeScroll`, `watchForceLogout`

## [`commands.ts`](commands.ts) — Voice, message, and channel-permission commands

`_bestContrast`, `_expandThemeVariables`, `_hexToRgb`, `_isLight`, `_luminance`, `_mix`, `_normalizeThemeVars`, `_rgbToHex`, `_shadeColor`, `addParticipantToGrid`, `applyAdminVoiceAction`, `applyChannelVisibilityFilter`, `applyFallbackStyle`, `applyLocalDeafenState`, `applyLocalMicState`, `applyOverride`, `applyThemeVariables`, `buildCpRowEl`, `censorContent`, `checkSpeaking`, `closeChannelPermsModal`, `closeUserSettings`, `closeVoiceParticipantMenu`, `connectToExistingUsers`, `cpSwitchTab`, `fetchKlipy`, `getEffectiveChannelPermission`, `getMemberPermissions`, `getProviderHandleFromIdentity`, `getVoiceParticipantBadges`, `globalMuteUser`, `globalUnmuteUser`, `handleInput`, `init`, `initiateConnection`, `joinVoiceChannel`, `leaveVoiceChannel`, `loadChannelPermissionsForServer`, `loadThemesAndApply`, `logIpEdge`, `markCurrentChannelAsRead`, `openChannelPermsModal`, `openUserSettings`, `openVoiceParticipantMenu`, `populateCpAddSelects`, `populateSettingsAccountTab`, `populateSettingsNotificationsTab`, `populateSettingsProfileTab`, `populateSettingsStatusTab`, `populateSettingsVoiceTab`, `refreshSettingsConnections`, `refreshVoiceControlButtons`, `removeVoiceParticipant`, `renderCpRows`, `renderResults`, `renderThemeList`, `renderVoiceParticipant`, `resolveGifEdge`, `saveChannelPermsModal`, `saveNotificationChanges`, `saveProfileChanges`, `selectTheme`, `sendGif`, `setPresenceStatus`, `setState`, `subscribeToVoiceRoom`, `subscribeToVoiceSignaling`, `switchSettingsTab`, `toggleVoiceDeafen`, `toggleVoiceMute`, `triStateHTML`, `updatePresenceDot`

## [`constants.ts`](constants.ts) — Shared UI helpers, constants, and context menus

`attachMessageLongPress`, `buildItem`, `buildSection`, `closeAllContextMenus`, `closeEverything`, `closeSub`, `dismissSheet`, `getMessageMenuSections`, `getPreviewCache`, `hideLoader`, `isMobileContextMenuMode`, `normalizeServerRole`, `openMessageContextMenu`, `openSub`, `positionSubmenu`, `setPreviewCache`, `showDesktopMessageMenu`, `showLoader`, `showMobileMessageMenu`, `unlockAudioContext`

## [`discord.ts`](discord.ts) — Discord account linking, import, and synchronization

`disconnectDiscordAccount`, `fetchDiscordGuilds`, `getDiscordSessionAccount`, `handleDiscordOAuthCallback`, `importSelectedDiscordGuilds`, `initializeDiscordIntegration`, `initiateDiscordOAuth`, `isChannelSyncedToDiscord`, `isDiscordServerMapped`, `linkDiscordSessionAccount`, `loadDiscordAccount`, `loadDiscordImportGuilds`, `renderDiscordConnectionUI`, `selectDiscordGuild`, `showDiscordImportUI`, `startDiscordMessageSync`, `syncDiscordStructure`, `syncMessagesFromDiscord`, `syncMessageToDiscord`

## [`realtime.ts`](realtime.ts) — Realtime subscriptions, direct messages, and reactions

`applyStoredServerOrder`, `buildChannelItem`, `clearReactionCacheForMessage`, `clearReactionCaches`, `deleteDirectConversation`, `ensureDirectConversation`, `ensureReactionContainer`, `findMyReactionIds`, `getCurrentConversationLabel`, `getPendingReactionKey`, `getServerOrderStorageKey`, `initRealtime`, `initSortables`, `loadCategories`, `loadChannels`, `loadDirectConversations`, `loadDirectMessages`, `loadPersistedServerOrder`, `openDirectConversation`, `promptForDirectMessage`, `removeReactionRecordById`, `renderChannelList`, `renderDmList`, `saveServerOrder`, `setReactionSnapshot`, `shouldSuppressClick`, `sortDirectConversations`, `subscribeToCurrentChannel`, `subscribeToCurrentDmConversation`, `subscribeToDirectMessages`, `updateConversationHeaderAndInput`, `upsertReactionRecord`

## [`server.ts`](server.ts) — Server navigation, settings, roles, and account UI

`changeAccountEmail`, `changeAccountPassword`, `changeName`, `checkInviteOnLoad`, `checkLinkedIdentities`, `closeModal`, `closeServerOptionsModal`, `closeServerRolesModal`, `closeUserProfile`, `collectRolePermissionsFromUI`, `createInlineGifElement`, `createServer`, `deleteCurrentRole`, `deleteInvite`, `deleteMyAccount`, `deleteServer`, `editInvite`, `editServerIcon`, `editServerSetting`, `enableBioEdit`, `ensureSysAdminInServer`, `ensureSysManagerInServer`, `ensureSystemUserInAllServers`, `fetchUserProfile`, `forceAttachAccountLinkListeners`, `generateInvite`, `getChannelContext`, `getDiscordRolePermissions`, `getProfileData`, `giveCustomRole`, `handleInlineConfirm`, `initServerModals`, `isLikelyGifPageUrl`, `joinServer`, `leaveServer`, `linkGithubAccount`, `linkGoogleAccount`, `linkOAuthIdentity`, `loadMemberPresence`, `loadServerMembers`, `loadServerMembersInternal`, `loadServerRolesForEditor`, `loadServers`, `manageServerOptions`, `normalizeHexColor`, `openManageInvitesModal`, `openModal`, `openRoleEditor`, `openServerOptionsModal`, `openServerRolesModal`, `openUserProfile`, `performLogout`, `refreshServerRole`, `reloadChannelsRealtime`, `renderMemberList`, `renderRolePermissionToggles`, `renderServerList`, `renderServerRolesList`, `resolveGifPageUrlAsync`, `resolveGifUrl`, `saveCurrentRole`, `saveServerOptionsModal`, `sendTyping`, `setServerOptionsError`, `setServerRolesError`, `setSidebarForDmMode`, `setupAccountLinkListeners`, `showLinkStatus`, `showNoServerScreen`, `showServerContextMenu`, `startNewRole`, `subscribeToPresence`, `subscribeToServerMemberships`, `subscribeToServerRealtime`, `subscribeToTyping`, `switchServer`, `syncDiscordGuildSetting`, `syncDiscordRole`, `toggleServerDmPanel`, `unlinkOAuthIdentity`, `updateAccountLinkButtons`, `updateChannelPresence`, `updateProfileAuthButtons`, `updateRoleUI`, `updateServerSettingValues`

## [`spotify-callback.ts`](spotify-callback.ts) — Spotify OAuth callback page logic

`handleSpotifyCallback`, `postSpotifyMessage`

## [`spotify.ts`](spotify.ts) — Spotify linking, presence, and playback status

`base64UrlEncode`, `ensureSpotifyClient`, `escapeHtml`, `fetchNowPlaying`, `generateCodeChallenge`, `generateCodeVerifier`, `handleSpotifyCallbackMessage`, `initSpotifyPresence`, `linkSpotify`, `loadSpotifyUsers`, `markSpotifyAsLinked`, `openPopup`, `scheduleUpdateAccountLinkButtons`, `sha256`, `startSpotifyPolling`, `stopSpotifyPolling`, `toggleSpotifyButtons`, `unlinkSpotify`, `updateSpotifyPresence`, `wireUpButtons`

## [`ui-dialogs.ts`](ui-dialogs.ts) — Shared dialog and confirmation helpers

`closeDialog`, `escapeDialogText`, `showDialog`

## Websites and developer accounts

These are the main sites needed to maintain the chat and its integrations. The
GitHub, Supabase, and production-hosting accounts are needed for core
development and deployment; Discord and Spotify are only needed when changing
those integrations.

| Website | What you use it for |
| --- | --- |
| [GitHub repository](https://github.com/c3p0r2d2luke/letslearnalgebra) | Source code, history, and issues. |
| [Supabase Dashboard](https://supabase.com/dashboard) · [Documentation](https://supabase.com/docs) | Database, authentication, storage, realtime, Edge Functions, project settings, and logs. |
| [Discord Developer Portal](https://discord.com/developers/applications) · [Developer documentation](https://discord.dev) | Discord app credentials, OAuth redirect URLs, and integration settings. |
| [Spotify for Developers](https://developer.spotify.com/dashboard) · [Documentation](https://developer.spotify.com/documentation/web-api) | Spotify app credentials, OAuth redirect URLs, and Web API reference. |
| [Production chat site](https://lla.ipv64.net/s/chat/) | Check the deployed site. The source references this hostname, but does not identify the hosting provider or its dashboard; retain access to the existing server/proxy and DNS accounts. |
| [Node.js](https://nodejs.org/en) · [TypeScript](https://www.typescriptlang.org/docs/) | Runtime and language documentation for local development and builds. |

Keep account passwords, OAuth client secrets, bot tokens, service-role keys,
and private push-notification keys in a password manager or the appropriate
server-side secret store; never add them to this source index or commit them.
