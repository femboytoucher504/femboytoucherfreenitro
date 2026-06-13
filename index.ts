import { Patcher, metro, storage } from "@vendetta";
import Settings from "./Settings";

storage.emote_size ??= "48";
storage.format_type ??= "markdown";
storage.realmoji ??= false;
storage.compound_sentences ??= false;
storage.use_webp ??= false;

let patches = [];

const emojiRegex = /<(a)?:([a-zA-Z0-9_]+):(\d+)>/g;
const markdownRegexCompound = /(?:\[[a-zA-Z0-9_~]+?]\()?(https:\/\/cdn\.discordapp\.com\/emojis\/(\d+)\.([a-z]{3,4})(?:\?[^)\s]*)?)\)?/g;
const markdownRegexSingle = /^(?:\[[a-zA-Z0-9_~]+?]\()?(https:\/\/cdn\.discordapp\.com\/emojis\/(\d+)\.([a-z]{3,4})(?:\?[^)\s]*)?)\)?$/g;

export default {
    onLoad: () => {
        const PremiumInfo = metro.findByProps("canUseEmojisEverywhere", "canUseAnimatedEmojis");
        const EmojiUtils = metro.findByProps("isEmojiDisabled", "isEmojiFiltered");

        if (PremiumInfo) {
            patches.push(Patcher.instead(PremiumInfo, "canUseEmojisEverywhere", () => true));
            patches.push(Patcher.instead(PremiumInfo, "canUseAnimatedEmojis", () => true));
        }
        if (EmojiUtils) {
            if (EmojiUtils.isEmojiDisabled) patches.push(Patcher.instead(EmojiUtils, "isEmojiDisabled", () => false));
            if (EmojiUtils.isEmojiFiltered) patches.push(Patcher.instead(EmojiUtils, "isEmojiFiltered", () => false));
        }

        const EmojiStore = metro.findByStoreName("EmojiStore");
        const UserStore = metro.findByStoreName("UserStore");
        const ChannelStore = metro.findByStoreName("ChannelStore");
        const SelectedChannelStore = metro.findByStoreName("SelectedChannelStore");

        function requiresTransformation(emojiId: string, isAnimated: boolean) {
            const currentUser = UserStore?.getCurrentUser();
            if (currentUser?.premiumType === 1 || currentUser?.premiumType === 2) return false;
            if (isAnimated) return true;

            const emoji = EmojiStore?.getCustomEmojiById?.(emojiId);
            if (!emoji) return true;

            const currentChannel = ChannelStore?.getChannel?.(SelectedChannelStore?.getChannelId?.());
            if (emoji.guildId && emoji.guildId === currentChannel?.guild_id) return false;

            return true;
        }

        const MessageActions = metro.findByProps("sendMessage", "editMessage");
        if (MessageActions) {
            patches.push(Patcher.before(MessageActions, "sendMessage", (args) => {
                const message = args[1];
                if (!message || !message.content) return;

                message.content = message.content.replace(emojiRegex, (match, animated, name, id) => {
                    if (!requiresTransformation(id, !!animated)) return match;

                    const isAnimated = !!animated;
                    const useWebp = storage.use_webp;
                    const emoteSize = parseInt(storage.emote_size) || 48;
                    
                    let url = `https://cdn.discordapp.com/emojis/${id}`;
                    if (useWebp) {
                        url += `.webp?name=${name}&lossless=true`;
                        if (isAnimated) url += `&animated=true`;
                    } else {
                        url += isAnimated ? `.gif` : `.png`;
                        url += `?name=${name}`;
                    }
                    if (emoteSize) url += `&size=${emoteSize}`;

                    if (storage.format_type === "markdown_ext") {
                        return `[\u2236${name}\u2236](${url})`;
                    } else if (storage.format_type === "markdown") {
                        return `[${name}](${url})`;
                    } else {
                        return url;
                    }
                });
            }));
        }

        const MessageStore = metro.findByProps("createMessageRecord");
        if (MessageStore) {
            patches.push(Patcher.before(MessageStore, "createMessageRecord", (args) => {
                const msg = args[0];
                if (!storage.realmoji || !msg || !msg.content) return;

                const targetRegex = storage.compound_sentences ? markdownRegexCompound : markdownRegexSingle;
                
                msg.content = msg.content.replace(targetRegex, (match, url, emojiId, extension) => {
                    let animated = extension === "gif" ? "a" : "";
                    let emojiName = "UNKNOWN_FAKE_EMOJI";

                    const queryString = url.split("?")[1];
                    if (queryString) {
                        const pairs = queryString.split("&");
                        for (const pair of pairs) {
                            const [key, val] = pair.split("=");
                            if (extension === "webp" && key === "animated" && val === "true") {
                                animated = "a";
                            }
                            if (key === "name" && val) {
                                emojiName = val.replace(/[^a-zA-Z0-9_]/g, "") || emojiName;
                            }
                        }
                    }
                    return `<${animated}:${emojiName}:${emojiId}>`;
                });
            }));
        }
    },
    onUnload: () => {
        for (const unpatch of patches) unpatch();
        patches = [];
    },
    settings: Settings,
};
              
