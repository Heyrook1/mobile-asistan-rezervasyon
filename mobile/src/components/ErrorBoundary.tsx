import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { captureException } from "../lib/monitoring";
import { colors, radius, spacing } from "../theme";

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    captureException(error, { componentStack: info.componentStack ?? undefined });
  }

  private retry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <View style={styles.wrap}>
          <View style={styles.iconWrap}>
            <Ionicons name="warning-outline" size={36} color={colors.warning} />
          </View>
          <Text style={styles.title}>Bir şeyler ters gitti</Text>
          <Text style={styles.msg}>
            Uygulama beklenmedik bir hatayla karşılaştı. Lütfen tekrar deneyin.
          </Text>
          {__DEV__ ? (
            <Text style={styles.devMsg} numberOfLines={4}>
              {this.state.error.message}
            </Text>
          ) : null}
          <TouchableOpacity style={styles.btn} onPress={this.retry} activeOpacity={0.9}>
            <Ionicons name="refresh" size={18} color={colors.white} />
            <Text style={styles.btnText}>Tekrar dene</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.bg,
    gap: spacing.md,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontSize: 20, fontWeight: "800", color: colors.text, textAlign: "center" },
  msg: { fontSize: 14, color: colors.muted, textAlign: "center", lineHeight: 21, maxWidth: 300 },
  devMsg: { fontSize: 11, color: colors.muted, fontFamily: "monospace" },
  btn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  btnText: { color: colors.white, fontWeight: "800", fontSize: 15 },
});
