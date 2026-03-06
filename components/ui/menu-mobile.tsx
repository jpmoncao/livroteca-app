import { Link } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/auth-context";
import { Colors } from "../../constants/theme";
import { useThemeColor } from "../../hooks/use-theme-color";
import { ThemedText } from "../themed-text";
import { IconSymbol } from "./icon-symbol";

export default function MenuMobile() {
    const { isLoggedIn } = useAuth();
    const insets = useSafeAreaInsets();
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
        paddingTop: insets.top + 12,
        paddingBottom: 12,
        paddingHorizontal: 16,
        backgroundColor: menuBackgroundColor,
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
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
                !isLoggedIn ?
                    (
                        <Link href="/login" asChild>
                            <Pressable style={buttonStyle}>
                                <ThemedText type="default">Login</ThemedText>
                            </Pressable>
                        </Link>
                    ) :
                    (
                        <Link href="/perfil" asChild>
                            <Pressable style={profileButtonStyle}>
                                <IconSymbol name="person.fill" size={24} color="white" />
                            </Pressable>
                        </Link>
                    )
            }
        </View >
    );
}