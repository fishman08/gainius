import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "@/hooks/useSession";
import { useProfile } from "@/hooks/useProfile";
import { colors, radius, spacing } from "@/lib/theme";

export default function Home() {
  const { session } = useSession();
  const { profile } = useProfile(session?.user.id);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>You're all set</Text>
        <Text style={styles.subtitle}>
          We've got everything we need. Your AI-curated plan is the next thing
          we'll build.
        </Text>
        <View style={styles.code}>
          <Text style={styles.codeText}>
            {JSON.stringify(profile, null, 2)}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.xl, gap: spacing.md },
  title: { color: colors.text, fontSize: 26, fontWeight: "600" },
  subtitle: { color: colors.muted, fontSize: 14 },
  code: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  codeText: { color: colors.text, fontFamily: "Menlo", fontSize: 12 },
});
