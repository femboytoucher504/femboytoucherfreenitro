export default {
    onLoad: () => {
        const api = window.revenge || window.vendetta;
        if (!api) return;
        try {
            const EmojiUtils = api.metro.findByProps("canUseEmojis") || api.metro.findByProps("getEmojiUnavailableReason");
            if (EmojiUtils) {
                if (EmojiUtils.canUseEmojis) EmojiUtils.canUseEmojis = () => true;
                if (EmojiUtils.canUseAnimatedEmojis) EmojiUtils.canUseAnimatedEmojis = () => true;
            }
        } catch (e) {
            console.error(e);
        }
    },
    onUnload: () => {}
};
