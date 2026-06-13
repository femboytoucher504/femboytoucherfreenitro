({
    onLoad: () => {
        const api = typeof revenge !== 'undefined' ? revenge : (typeof vendetta !== 'undefined' ? vendetta : null);
        if (!api) return;

        try {
            const EmojiUtils = api.metro.findByProps("canUseEmojis") || api.metro.findByProps("getEmojiUnavailableReason");
            if (EmojiUtils) {
                if (EmojiUtils.canUseEmojis) EmojiUtils.canUseEmojis = () => true;
                if (EmojiUtils.canUseAnimatedEmojis) EmojiUtils.canUseAnimatedEmojis = () => true;
            }
        } catch (e) {}
    },
    onUnload: () => {}
})
