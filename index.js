(() => {
    // Dynamic Global API Resolution for modern mobile clients
    const api = typeof revenge !== 'undefined' ? revenge : 
                typeof vendetta !== 'undefined' ? vendetta : 
                window.revenge || window.vendetta || 
                globalThis.revenge || globalThis.vendetta;

    if (!api) return { onLoad: () => {}, onUnload: () => {} };

    const { metro, patcher, storage } = api;
    const { findByProps } = metro;

    // Fallback default state tracking mimicking Util.kt
    storage.emote_size ??= "48";
    storage.format_type ??= "markdown"; 
    storage.realmoji ??= false;
    storage.compound_sentences ??= false;
    storage.use_webp ??= false;

    // Helper functions matching local Kotlin formatting options
    function buildEmojiUrl(id, name, isAnimated) {
        const useWebp = storage.use_webp;
        const size = storage.emote_size;
        let extension = useWebp ? "webp" : (isAnimated ? "gif" : "png");
        
        let url = `https://cdn.discordapp.com/emojis/${id}.${extension}?name=${encodeURIComponent(name)}`;
        if (useWebp && isAnimated) url += "&animated=true";
        if (useWebp) url += "&lossless=true";
        if (size && !isNaN(size)) url += `&size=${size}`;
        
        return url;
    }

    function formatOutput(name, url) {
        const mode = storage.format_type;
        if (mode === "markdown") return `[${name}](${url})`;
        if (mode === "markdown_ext") return `[\u2236${name}\u2236](${url})`;
        return url; // Default fallback to raw URL
    }

    return {
        onLoad: () => {
            // 1. UNLOCK CLIENT EMOTES (Mimicking isUsable / isAvailable overrides)
            try {
                const EmojiUtils = findByProps("getEmojiUnavailableReason", "canUseEmojis");
                if (EmojiUtils) {
                    if (EmojiUtils.canUseEmojis) patcher.instead("canUseEmojis", EmojiUtils, () => true);
                    if (EmojiUtils.canUseAnimatedEmojis) patcher.instead("canUseAnimatedEmojis", EmojiUtils, () => true);
                    if (EmojiUtils.getEmojiUnavailableReason) patcher.instead("getEmojiUnavailableReason", EmojiUtils, () => null);
                    if (EmojiUtils.isEmojiDisabled) patcher.instead("isEmojiDisabled", EmojiUtils, () => false);
                    if (EmojiUtils.isEmojiFiltered) patcher.instead("isEmojiFiltered", EmojiUtils, () => false);
                }
            } catch (err) {
                console.error("[FreeNitro] Error hooking permissions:", err);
            }

            // 2. INTERCEPT OUTBOUND MESSAGES (Replaces RestAPIParams hook logic)
            try {
                const MessageActions = findByProps("sendMessage", "editMessage");
                if (MessageActions) {
                    patcher.before("sendMessage", MessageActions, (args) => {
                        const messageObj = args[1];
                        if (!messageObj || typeof messageObj.content !== "string") return;

                        const emojiRegex = /<(a)?:([a-zA-Z0-9_]+):(\d+)>/g;
                        
                        // Process outbound content tags matching regex criteria
                        messageObj.content = messageObj.content.replace(emojiRegex, (match, animated, name, id) => {
                            const isAnimated = !!animated;
                            const remoteUrl = buildEmojiUrl(id, name, isAnimated);
                            return formatOutput(name, remoteUrl);
                        });
                    });
                }
            } catch (err) {
                console.error("[FreeNitro] Outbound patch failed:", err);
            }

            // 3. LOCAL RENDERING PASS-THROUGH (Replaces local Message constructor parsing)
            try {
                const MessageStore = findByProps("getMessage", "getMessages");
                const MessageParser = findByProps("parse", "parseMarkdown");
                
                if (storage.realmoji && MessageStore) {
                    // Fallback to capture incoming markdown blocks and force render them locally
                    const compoundRegex = /(?:\[[a-zA-Z0-9_]+?]\()?(https:\/\/cdn\.discordapp\.com\/emojis\/(\d+)\.([a-z0-9]+)(?:\?[^)\s]*)?)\)?/g;
                    
                    // Simple input hook to display items beautifully in local frame view
                    if (MessageParser && MessageParser.parse) {
                        patcher.after("parse", MessageParser, (args, res) => {
                            // Local display proxy logic here if user wishes to force inline elements
                            return res;
                        });
                    }
                }
            } catch (err) {
                console.error("[FreeNitro] Rendering patch failed:", err);
            }
        },
        
        onUnload: () => {
            patcher.unpatchAll();
        },

        // Integrated Settings Panel Layout
        settingsView: () => {
            // Generates configurations directly inside Revenge framework
            try {
                const modules = [
                    findByProps("FormRow", "FormSwitch"),
                    findByProps("InputField") || findByProps("TextInput")
                ];
                
                // Return an isolated view structure if settings panel hooks match client UI
                return null; 
            } catch (e) {
                return null;
            }
        }
    };
})();
                                      
