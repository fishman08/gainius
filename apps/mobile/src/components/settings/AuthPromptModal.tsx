import React, { useState, useCallback } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Modal, Portal, Text, TextInput, Button } from 'react-native-paper';
import { useAuth } from '../../providers/AuthProvider';
import { useAppTheme } from '../../providers/ThemeProvider';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export default function AuthPromptModal({ visible, onDismiss }: Props) {
  const { theme } = useAppTheme();
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !isSubmitting;

  const handleSignIn = useCallback(async () => {
    setError('');
    setIsSubmitting(true);
    const { error: err } = await signIn(email.trim(), password);
    setIsSubmitting(false);
    if (err) {
      setError(err);
    }
  }, [email, password, signIn]);

  const handleSignUp = useCallback(async () => {
    setError('');
    setIsSubmitting(true);
    const { error: err } = await signUp(email.trim(), password);
    setIsSubmitting(false);
    if (err) setError(err);
  }, [email, password, signUp]);

  const s = {
    container: {
      backgroundColor: theme.colors.surface,
      margin: 20,
      borderRadius: theme.borderRadius.lg,
      overflow: 'hidden' as const,
    },
    title: {
      fontFamily: theme.typography.headline.fontFamily,
      fontSize: theme.typography.headline.fontSize,
      fontWeight: theme.typography.headline.fontWeight as unknown as '600',
      color: theme.colors.text,
      marginBottom: 6,
    },
    subtitle: {
      fontFamily: theme.typography.body.fontFamily,
      fontSize: theme.typography.body.fontSize,
      color: theme.colors.textSecondary,
      marginBottom: 20,
    },
    error: {
      fontFamily: theme.typography.caption.fontFamily,
      fontSize: theme.typography.caption.fontSize,
      color: theme.colors.error,
      marginBottom: 12,
    },
    skip: {
      fontFamily: theme.typography.label.fontFamily,
      fontSize: theme.typography.label.fontSize,
      color: theme.colors.textSecondary,
      textAlign: 'center' as const,
      marginTop: 12,
      paddingVertical: 4,
    },
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={s.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
          >
            <Text style={s.title}>Save your progress</Text>
            <Text style={s.subtitle}>
              Create a free account so your workouts sync to the cloud and are never lost.
            </Text>

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.input}
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              mode="outlined"
              autoComplete="password"
              style={styles.input}
            />

            {error ? <Text style={s.error}>{error}</Text> : null}

            <Button
              mode="contained"
              onPress={handleSignUp}
              loading={isSubmitting}
              disabled={!canSubmit}
              buttonColor={theme.colors.primary}
              style={styles.primaryBtn}
            >
              Create account
            </Button>
            <Button
              mode="outlined"
              onPress={handleSignIn}
              loading={isSubmitting}
              disabled={!canSubmit}
              style={styles.secondaryBtn}
            >
              Sign in
            </Button>

            <Text style={s.skip} onPress={onDismiss}>
              Not now
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 24 },
  input: { marginBottom: 12 },
  primaryBtn: { marginTop: 4 },
  secondaryBtn: { marginTop: 10 },
});
