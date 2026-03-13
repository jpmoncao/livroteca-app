import RootStack from "@/app/(tabs)/_layout";
import { NavigationContainer } from "@react-navigation/native";
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
    return (
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
            <NavigationContainer>
                <RootStack />
            </NavigationContainer>
        </SafeAreaProvider>
    );
}