import { Pressable, View } from "react-native";

import { PlatformPressable } from "@react-navigation/elements";
import { Colors } from "../../constants/theme";
import { useThemeColor } from "../../hooks/use-theme-color";
import { ThemedText } from "../themed-text";
import { IconSymbol } from "./icon-symbol";

const IS_LOGGED_IN = false;

export default function MenuMobile() {
    const menuBackgroundColor = useThemeColor({
        light: Colors.light.menuBackground,
        dark: Colors.dark.menuBackground
    }, 'menuBackground');

    const buttonBackgroundColor = useThemeColor({
        light: Colors.light.background,
        dark: Colors.dark.background
    }, 'background');

    const menuStyle = {
        width: '100%' as const,
        height: 64,
        backgroundColor: menuBackgroundColor,
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        paddingHorizontal: 12,
    };

    const buttonStyle = {
        padding: 8,
        borderRadius: 8,
        backgroundColor: buttonBackgroundColor,
        width: 100,
        height: 40,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
    };

    const profileButtonStyle = {
        padding: 8,
        borderRadius: "50%" as const,
        backgroundColor: buttonBackgroundColor,
        width: 40,
        height: 40,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
    };

    return (
        <View style={menuStyle}>
            <Pressable>
                <ThemedText type="subtitle">Livroteca</ThemedText>
            </Pressable>
            {
                !IS_LOGGED_IN ?
                    (
                        <PlatformPressable href="/login" style={buttonStyle}>
                            <ThemedText type="default">Login</ThemedText>
                        </PlatformPressable>
                    ) :
                    (
                        <PlatformPressable href="/perfil" style={profileButtonStyle}>
                            <IconSymbol name="person.fill" size={24} color="white" />
                        </PlatformPressable>
                    )
            }
        </View >
    );
}