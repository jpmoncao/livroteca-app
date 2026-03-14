import { Link } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/auth-context";
import { useThemeColor } from "../../hooks/use-theme-color";
import { ThemedText } from "../themed-text";
import { IconSymbol } from "./icon-symbol";

export default function MenuMobile() {
    const { isLoggedIn } = useAuth();
    const insets = useSafeAreaInsets();
    const menuBackgroundColor = useThemeColor({}, 'menuBackground');
    const buttonBackgroundColor = useThemeColor({}, 'background');
    const iconColor = useThemeColor({}, 'tint');

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
                                <IconSymbol name="person.fill" size={24} color={iconColor} />
                            </Pressable>
                        </Link>
                    )
            }
        </View >
    );
}