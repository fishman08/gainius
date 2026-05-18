import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../providers/AuthProvider';
import { useAppTheme } from '../../providers/ThemeProvider';
import { setCoachingNotes } from '../../store/slices/syncSlice';
import type { RootState, AppDispatch } from '../../store';

export default function CoachingNotesCard() {
  const { theme } = useAppTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { user, supabase } = useAuth();
  const coachingNotes = useSelector((state: RootState) => state.sync.coachingNotes);

  async function handleReset() {
    if (!supabase || !user?.id) return;
    await supabase.from('profiles').update({ coaching_notes: null }).eq('user_id', user.id);
    dispatch(setCoachingNotes(null));
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.surfaceBorder,
          borderRadius: theme.borderRadius.md,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Coaching insights</Text>
        {coachingNotes && (
          <IconButton
            icon="close"
            size={18}
            iconColor={theme.colors.textSecondary}
            onPress={handleReset}
            style={{ margin: 0 }}
          />
        )}
      </View>
      <Text
        style={[
          styles.body,
          { color: coachingNotes ? theme.colors.text : theme.colors.textSecondary },
        ]}
      >
        {coachingNotes ?? 'No insights yet. Chat more to build personalized coaching notes.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, padding: 14, marginBottom: 16, marginHorizontal: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: { fontFamily: 'RethinkSans_600SemiBold', fontSize: 15 },
  body: { fontFamily: 'RethinkSans_400Regular', fontSize: 14, lineHeight: 20 },
});
