(function () {
    const SETTINGS = {
        emote_size: "48",          
        format_type: "markdown",    
        use_webp: false,            
        realmoji: true,             
        compound_sentences: true    
    };

    const api = typeof revenge !== 'undefined' ? revenge : (typeof vendetta !== 'undefined' ? vendetta : null);
    if (!api) return;

    const { metro, patcher } = api;
    const { findByProps } = metro;

    function wrapEmoji(emoji) {
        if (!emoji || typeof emoji !== "object") return emoji;
        return new Proxy(emoji, {
            get(target, prop) {
                if (prop === "available" || prop === "isUsable") return true;
                return Reflect.get(target, prop);
            }
        });
    }

    // 1. EARLY PROFILE HOOK
    try {
        const UserStore = findByProps("getCurrentUser");
        if (UserStore && UserStore.getCurrentUser) {
            const originalGetCurrentUser = UserStore.getCurrentUser;
            UserStore.getCurrentUser = function () {
                const user = originalGetCurrentUser.apply(this, arguments);
                if (user) {
                    return new Proxy(user, {
                        get(target, prop) {
                            if (prop === "premiumType") return 2;
                            return Reflect.get(target, prop);
                        },
                        getOwnPropertyDescriptor(target, prop) {
                            if (prop === "premiumType") {
                                return { value: 2, enumerable: true, configurable: true, writable: false };
                            }
                            return Reflect.getOwnPropertyDescriptor(target, prop);
                        }
                    });
                }
                return user;
            };
        }
    } catch (e) {}

    // 2. EARLY EMOJI DATA HOOK
    try {
        const EmojiStore = findByProps("getCustomEmoji", "getEmojis") || findByProps("getGuildEmoji");
        if (EmojiStore) {
            Object.keys(EmojiStore).forEach(key => {
                if (typeof EmojiStore[key] === "function") {
                    const originalMethod = EmojiStore[key];
                    EmojiStore[key] = function (...args) {
                        const result = originalMethod.apply(this, args);
                        if (!result) return result;
                        if (Array.isArray(result)) return result.map(wrapEmoji);
                        if (typeof result === "object" && (result.id || result.name)) return wrapEmoji(result);
                        return result;
                    };
                }
            });
        }
    } catch (e) {}

    // 3. GLOBAL PERMISSIONS OVERRIDE
    try {
        const EmojiUtils = findByProps("getEmojiUnavailableReason", "isEmojiFiltered") || findByProps("canUseEmojis");
        if (EmojiUtils) {
            if (EmojiUtils.canUseEmojis) EmojiUtils.canUseEmojis = () => true;
            if (EmojiUtils.canUseAnimatedEmojis) EmojiUtils.canUseAnimatedEmojis = () => true;
            if (EmojiUtils.getEmojiUnavailableReason) EmojiUtils.getEmojiUnavailableReason = () => null;
            if (EmojiUtils.isEmojiDisabled) EmojiUtils.isEmojiDisabled = () => false;
        }
    } catch (e) {}

    // 4. OUTBOUND MESSAGE PARSER
    try {
        const MessageActions = findByProps("sendMessage", "editMessage");
        if (MessageActions && patcher) {
            patcher.before("sendMessage", MessageActions, (args) => {
                const messageObj = args[1];
                if (!messageObj || typeof messageObj.content !== "string") return;

                const EMOJI_REGEX = /<(a)?:([a-zA-Z0-9_]+):(\d+)>/g;
                messageObj.content = messageObj.content.replace(EMOJI_REGEX, (match, animated, name, id) => {
                    let extension = SETTINGS.use_webp ? "webp" : (animated ? "gif" : "png");
                    let cdnUrl = `https://cdn.discordapp.com/emojis/${id}.${extension}?name=${name}`;
                    if (SETTINGS.emote_size) cdnUrl += `&size=${SETTINGS.emote_size}`;
                    if (SETTINGS.use_webp && animated) cdnUrl += `&animated=true`;

                    if (SETTINGS.format_type === "markdown") return `[${name}](${cdnUrl})`;
                    if (SETTINGS.format_type === "markdown_ext") return `[\u2236${name}\u2236](${cdnUrl})`;
                    return cdnUrl;
                });
            });
        }
    } catch (e) {}
})();
                      
