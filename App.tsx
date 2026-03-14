import RootStack from "@/app/(tabs)/_layout";
import { AuthProvider } from "@/contexts/auth-context";
import { NavigationContainer } from "@react-navigation/native";
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
    return (
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
            <AuthProvider>
                <NavigationContainer>
                    <RootStack />
                </NavigationContainer>
            </AuthProvider>
        </SafeAreaProvider>
    );
}