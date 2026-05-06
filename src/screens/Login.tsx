import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { type NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { colors } from "@/theme/colors";
import { spacing, fontSize, radius } from "@/theme/spacing";
import { useAuthStore } from "@/stores/authStore";
import authApi from "@/api/auth";
import { type AuthStackParamList } from "@/navigation/AuthStack";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

const DEFAULT_TENANT = process.env.EXPO_PUBLIC_TENANT_SLUG ?? "default";

// ─── Dev quick-login presets ─────────────────────────────────────────────────
interface DevUser {
  label: string;
  role: string;
  email: string;
  password: string;
  tenant: string;
  color: string;
}

const DEV_USERS: DevUser[] = [
  {
    label: "Super Admin",
    role: "super_admin",
    email: "admin@remitx.com",
    password: "Admin@RemitX2024!",
    tenant: "remitx",
    color: colors.primary,
  },
  {
    label: "Maker",
    role: "maker",
    email: "maker1@remitx.com",
    password: "Test@1234!",
    tenant: "remitx",
    color: colors.success,
  },
  {
    label: "Checker",
    role: "checker",
    email: "checker1@remitx.com",
    password: "Test@1234!",
    tenant: "remitx",
    color: colors.warning,
  },
  {
    label: "Client Admin",
    role: "client_admin",
    email: "cadmin@remitx.com",
    password: "Test@1234!",
    tenant: "remitx",
    color: colors.info,
  },
];
// ─────────────────────────────────────────────────────────────────────────────

export function Login({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantSlug, setTenantSlug] = useState(DEFAULT_TENANT);
  const [showTenant, setShowTenant] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeDevUser, setActiveDevUser] = useState<string | null>(null);

  const setAuth = useAuthStore((s) => s.setAuth);

  const applyDevUser = (u: DevUser) => {
    setEmail(u.email);
    setPassword(u.password);
    setTenantSlug(u.tenant);
    setActiveDevUser(u.role);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const { data: res } = await authApi.login({ email: email.trim(), password }, tenantSlug);
      const payload = res.data;

      if (payload.mfaRequired && payload.mfaChallengeToken) {
        navigation.navigate("MfaChallenge", {
          challengeToken: payload.mfaChallengeToken,
          tenantSlug,
        });
        return;
      }

      setAuth(payload.user, payload.accessToken, payload.refreshToken, tenantSlug);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
        "Invalid credentials. Please try again.";
      Alert.alert("Login failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo / Brand */}
          <View style={styles.brandRow}>
            <View style={styles.logoBox}>
              <Ionicons name="swap-horizontal" size={28} color={colors.primary} />
            </View>
            <Text style={styles.brand}>RemitX</Text>
          </View>

          {/* Heading */}
          <View style={styles.headingBlock}>
            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.subheading}>Sign in to your account</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Input
              label="Email address"
              value={email}
              onChangeText={setEmail}
              placeholder="you@company.com"
              keyboardType="email-address"
              leftIcon="mail-outline"
              autoComplete="email"
              textContentType="emailAddress"
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              leftIcon="lock-closed-outline"
              textContentType="password"
            />

            {/* Tenant slug toggle */}
            <TouchableOpacity style={styles.tenantToggle} onPress={() => setShowTenant((v) => !v)}>
              <Ionicons name={showTenant ? "chevron-up" : "chevron-down"} size={14} color={colors.textMuted} />
              <Text style={styles.tenantToggleLabel}>{showTenant ? "Hide" : "Show"} workspace</Text>
            </TouchableOpacity>

            {showTenant && (
              <Input
                label="Workspace"
                value={tenantSlug}
                onChangeText={setTenantSlug}
                placeholder="your-workspace"
                leftIcon="business-outline"
                autoCapitalize="none"
              />
            )}

            <Button label="Sign in" onPress={handleLogin} loading={loading} style={styles.loginBtn} />
          </View>

          {/* Footer */}
          <Text style={styles.footer}>Secured with end-to-end encryption</Text>
          <View style={styles.footerBadge}>
            <Ionicons name="shield-checkmark" size={13} color={colors.success} />
            <Text style={styles.footerBadgeText}>PCI-DSS compliant</Text>
          </View>

          {/* ── Dev quick-login — only in __DEV__ builds ── */}
          {__DEV__ && (
            <View style={styles.devPanel}>
              <View style={styles.devHeader}>
                <View style={styles.devBadge}>
                  <Text style={styles.devBadgeText}>DEV</Text>
                </View>
                <Text style={styles.devTitle}>Quick login</Text>
              </View>
              <View style={styles.devGrid}>
                {DEV_USERS.map((u) => {
                  const active = activeDevUser === u.role;
                  return (
                    <TouchableOpacity
                      key={u.role}
                      style={[styles.devChip, { borderColor: u.color }, active && { backgroundColor: u.color }]}
                      onPress={() => applyDevUser(u)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.devChipText, active && styles.devChipTextActive]}>{u.label}</Text>
                      <Text style={[styles.devChipEmail, active && styles.devChipEmailActive]}>{u.email}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["2xl"],
    paddingBottom: spacing["3xl"],
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing["2xl"],
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryFaded,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    fontSize: fontSize["2xl"],
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },

  headingBlock: { marginBottom: spacing["2xl"], gap: spacing.xs },
  heading: {
    fontSize: fontSize["3xl"],
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subheading: { fontSize: fontSize.md, color: colors.textMuted },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.base,
    marginBottom: spacing.xl,
  },

  tenantToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
  },
  tenantToggleLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  loginBtn: { marginTop: spacing.xs },

  footer: {
    textAlign: "center",
    fontSize: fontSize.xs,
    color: colors.textDisabled,
    marginBottom: spacing.xs,
  },
  footerBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  footerBadgeText: { fontSize: fontSize.xs, color: colors.success },

  // ── Dev panel ──
  devPanel: {
    marginTop: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.warning,
    borderStyle: "dashed",
    padding: spacing.base,
    gap: spacing.md,
  },
  devHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  devBadge: {
    backgroundColor: colors.warning,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  devBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.black,
    letterSpacing: 1,
  },
  devTitle: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.warning,
  },
  devGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  devChip: {
    flex: 1,
    minWidth: "45%",
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: 2,
  },
  devChipText: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  devChipTextActive: { color: colors.white },
  devChipEmail: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  devChipEmailActive: { color: "rgba(255,255,255,0.75)" },
});
