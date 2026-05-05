import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSession } from "@/hooks/useSession";
import { useProfile } from "@/hooks/useProfile";
import { resumeIndex } from "@workout/core";
import { colors } from "@/lib/theme";

export default function Index() {
  const router = useRouter();
  const { session, loading: loadingSession } = useSession();
  const { profile, loading: loadingProfile } = useProfile(session?.user.id);

  useEffect(() => {
    if (loadingSession) return;
    if (!session) {
      router.replace("/(auth)/sign-up");
      return;
    }
    if (loadingProfile || !profile) return;
    if (profile.onboarding_completed_at) {
      router.replace("/home");
    } else {
      router.replace(`/onboarding/${resumeIndex(profile)}`);
    }
  }, [session, loadingSession, profile, loadingProfile, router]);

  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
});
