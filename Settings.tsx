import { React, storage } from "@vendetta";
import { General, Forms } from "@vendetta/ui/components";

const { ScrollView } = General;
const { FormRow, FormSwitch, FormInput, FormRadioRow } = Forms;

export default function Settings() {
    const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

    const formatOptions = [
        { label: "URL", value: "url" },
        { label: "Extended markdown [∶name∶](url)", value: "markdown_ext" },
        { label: "Markdown [name](url)", value: "markdown" }
    ];

    return (
        <ScrollView style={{ flex: 1 }}>
            <FormInput
                label="Fallback emote size (48 is the default)"
                placeholder="48"
                value={storage.emote_size}
                keyboardType="numeric"
                onChange={(val: string) => {
                    storage.emote_size = val;
                    forceUpdate();
                }}
            />

            <FormRow label="Format Type" />
            {formatOptions.map((opt) => (
                <FormRadioRow
                    key={opt.value}
                    label={opt.label}
                    selected={storage.format_type === opt.value}
                    onPress={() => {
                        storage.format_type = opt.value;
                        forceUpdate();
                    }}
                />
            ))}

            <FormSwitch
                label="Enable realmojis"
                subLabel="Makes your Discord client think freenitro emojis are nitro emojis"
                value={storage.realmoji}
                onValueChange={(val: boolean) => {
                    storage.realmoji = val;
                    forceUpdate();
                }}
            />

            <FormSwitch
                label="Enable realmojis in compound sentences"
                subLabel="Allows for messages like 'hello :sogged: meow' to display properly"
                value={storage.compound_sentences}
                onValueChange={(val: boolean) => {
                    storage.compound_sentences = val;
                    forceUpdate();
                }}
            />

            <FormSwitch
                label="Use WebP format"
                subLabel="Use WebP for all emojis instead of GIF for animated emojis and PNG for static emojis."
                value={storage.use_webp}
                onValueChange={(val: boolean) => {
                    storage.use_webp = val;
                    forceUpdate();
                }}
            />
        </ScrollView>
    );
}
