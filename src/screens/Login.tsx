import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { type NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useColors, type Colors } from "@/hooks/useColors";
import { spacing, fontSize, radius } from "@/theme/spacing";
import { useAuthStore } from "@/stores/authStore";
import { useBrandStore } from "@/stores/brandStore";
import authApi from "@/api/auth";
import tenantsApi from "@/api/tenants";
import { getApiError } from '@/utils/apiError'
import { useAlert } from '@/hooks/useAlert'
import { type AuthStackParamList } from "@/navigation/AuthStack";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

const DEFAULT_TENANT = process.env.EXPO_PUBLIC_TENANT_SLUG ?? "default";

// ─── Dev quick-login presets ─────────────────────────────────────────────────

interface DevUser {
  label: string;
  detail: string;
  email: string;
  password: string;
  tenant: string;
  color: string;
}

interface DevGroup {
  label: string;
  slug: string;
  isolated: boolean;
  users: DevUser[];
}

const DEV_GROUPS: DevGroup[] = [
  {
    label: 'RemitX', slug: 'remitx', isolated: false,
    users: [
      { label: 'Super Admin',  detail: 'super_admin',  email: 'admin@remitx.com',    password: 'Admin@RemitX2024!', tenant: 'remitx', color: '#6366F1' },
      { label: 'Client Admin', detail: 'client_admin', email: 'cadmin@remitx.com',   password: 'Test@1234!',        tenant: 'remitx', color: '#3B82F6' },
      { label: 'Maker',        detail: 'maker',        email: 'maker1@remitx.com',   password: 'Test@1234!',        tenant: 'remitx', color: '#10B981' },
      { label: 'Checker',      detail: 'checker',      email: 'checker1@remitx.com', password: 'Test@1234!',        tenant: 'remitx', color: '#F59E0B' },
    ],
  },
  {
    label: 'Acme Corp', slug: 'acme-corp', isolated: true,
    users: [
      { label: 'Client Admin', detail: 'manages org',       email: 'admin@acme.com',   password: 'Test@1234!', tenant: 'acme-corp', color: '#EF4444' },
      { label: 'Maker',        detail: 'creates payments',  email: 'maker@acme.com',   password: 'Test@1234!', tenant: 'acme-corp', color: '#EF4444' },
      { label: 'Checker',      detail: 'approves payments', email: 'checker@acme.com', password: 'Test@1234!', tenant: 'acme-corp', color: '#EF4444' },
    ],
  },
  {
    label: 'GlobalPay', slug: 'globalpay', isolated: true,
    users: [
      { label: 'Client Admin', detail: 'manages org',      email: 'admin@globalpay.com', password: 'Test@1234!', tenant: 'globalpay', color: '#3B82F6' },
      { label: 'Maker',        detail: 'creates payments', email: 'maker@globalpay.com', password: 'Test@1234!', tenant: 'globalpay', color: '#3B82F6' },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────

export function Login({ navigation }: Props) {
  const { showAlert } = useAlert()
  const colors = useColors()
  const s = useMemo(() => createStyles(colors), [colors])
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantSlug, setTenantSlug] = useState(DEFAULT_TENANT);
  const [showTenant, setShowTenant] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const setAuth = useAuthStore((state) => state.setAuth);
  const setBrand = useBrandStore((s) => s.setBrand);

  const applyDevUser = (u: DevUser) => {
    setEmail(u.email);
    setPassword(u.password);
    setTenantSlug(u.tenant);
    setActiveKey(u.email);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showAlert("Missing fields", "Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const { data: res } = await authApi.login({ email: email.trim(), password }, tenantSlug);
      const payload = res.data;

      if (payload.mfaRequired && payload.tempToken) {
        navigation.navigate("MfaChallenge", {
          challengeToken: payload.tempToken,
          tenantSlug,
        });
        return;
      }

      setAuth(payload.user, payload.accessToken, payload.refreshToken, tenantSlug);

      // Fetch and apply tenant branding immediately — non-fatal if it fails
      try {
        const themeRes = await tenantsApi.theme();
        const t = themeRes.data.data;
        setBrand({ primaryColor: t.primaryColor, tenantName: t.tenantName, logoUrl: t.logoUrl ?? null });
      } catch { /* non-fatal — palette defaults remain */ }

    } catch (err: unknown) {
      showAlert("Login failed", getApiError(err, "Invalid credentials. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.flex}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View style={s.brandRow}>
            <View style={s.logoBox}>
              <Ionicons name="swap-horizontal" size={28} color={colors.primary} />
            </View>
            <Text style={s.brand}>RemitX</Text>
          </View>

          <View style={s.headingBlock}>
            <Text style={s.heading}>Welcome back</Text>
            <Text style={s.subheading}>Sign in to your account</Text>
          </View>

          {/* Form card */}
          <View style={s.card}>
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

            <TouchableOpacity style={s.tenantToggle} onPress={() => setShowTenant((v) => !v)}>
              <Ionicons name={showTenant ? "chevron-up" : "chevron-down"} size={14} color={colors.textMuted} />
              <Text style={s.tenantToggleLabel}>{showTenant ? "Hide" : "Show"} workspace</Text>
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

            <Button label="Sign in" onPress={handleLogin} loading={loading} style={s.loginBtn} />
          </View>

          <Text style={s.footer}>Secured with end-to-end encryption</Text>
          <View style={s.footerBadge}>
            <Ionicons name="shield-checkmark" size={13} color={colors.success} />
            <Text style={s.footerBadgeText}>PCI-DSS compliant</Text>
          </View>

          {/* ─── Dev quick-login ─────────────────────────────────────────── */}
          {__DEV__ && (
            <View style={s.devPanel}>
              <View style={s.devHeader}>
                <View style={s.devBadge}>
                  <Text style={s.devBadgeText}>DEV</Text>
                </View>
                <Text style={s.devTitle}>Quick login</Text>
              </View>

              {DEV_GROUPS.map((group) => (
                <View key={group.slug} style={s.devGroup}>
                  {/* Group header */}
                  <View style={s.devGroupHeader}>
                    <Text style={s.devGroupLabel}>{group.label}</Text>
                    <View style={s.devSlugBadge}>
                      <Text style={s.devSlugText}>{group.slug}</Text>
                    </View>
                    {group.isolated && (
                      <View style={s.devIsolatedBadge}>
                        <Ionicons name="shield" size={9} color={colors.warning} />
                        <Text style={s.devIsolatedText}>isolated</Text>
                      </View>
                    )}
                  </View>

                  {/* User chips */}
                  <View style={s.devGrid}>
                    {group.users.map((u) => {
                      const active = activeKey === u.email;
                      return (
                        <TouchableOpacity
                          key={u.email}
                          style={[s.devChip, { borderColor: u.color }, active && { backgroundColor: u.color }]}
                          onPress={() => applyDevUser(u)}
                          activeOpacity={0.75}
                        >
                          <Text style={[s.devChipLabel, active && s.devChipLabelActive]}>{u.label}</Text>
                          <Text style={[s.devChipDetail, active && s.devChipDetailActive]}>{u.detail}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (c: Colors) => StyleSheet.create({
  safe:   { flex: 1, backgroundColor: c.bg },
  flex:   { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: spacing["2xl"], paddingBottom: spacing["3xl"] },

  brandRow:  { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing["2xl"] },
  logoBox:   { width: 44, height: 44, borderRadius: radius.md, backgroundColor: c.primaryFaded, alignItems: "center", justifyContent: "center" },
  brand:     { fontSize: fontSize["2xl"], fontWeight: "800", color: c.textPrimary, letterSpacing: -0.5 },

  headingBlock: { marginBottom: spacing["2xl"], gap: spacing.xs },
  heading:      { fontSize: fontSize["3xl"], fontWeight: "700", color: c.textPrimary, letterSpacing: -0.5 },
  subheading:   { fontSize: fontSize.md, color: c.textMuted },

  card: { backgroundColor: c.card, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border, padding: spacing.xl, gap: spacing.base, marginBottom: spacing.xl },

  tenantToggle:      { flexDirection: "row", alignItems: "center", gap: spacing.xs, alignSelf: "flex-start", paddingVertical: spacing.xs },
  tenantToggleLabel: { fontSize: fontSize.sm, color: c.textMuted },
  loginBtn:          { marginTop: spacing.xs },

  footer:           { textAlign: "center", fontSize: fontSize.xs, color: c.textDisabled, marginBottom: spacing.xs },
  footerBadge:      { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs },
  footerBadgeText:  { fontSize: fontSize.xs, color: c.success },

  // ── Dev panel ───────────────────────────────────────────────────────────────
  devPanel:  { marginTop: spacing.xl, borderRadius: radius.lg, borderWidth: 1, borderColor: c.warning, borderStyle: "dashed", padding: spacing.base, gap: spacing.lg },
  devHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  devBadge:  { backgroundColor: c.warning, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  devBadgeText: { fontSize: fontSize.xs, fontWeight: "700", color: c.black, letterSpacing: 1 },
  devTitle:  { fontSize: fontSize.sm, fontWeight: "600", color: c.warning },

  devGroup:  { gap: spacing.sm },

  devGroupHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  devGroupLabel:  { fontSize: fontSize.sm, fontWeight: "700", color: c.textPrimary },
  devSlugBadge:   { backgroundColor: c.surface, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  devSlugText:    { fontSize: 10, fontWeight: "600", color: c.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  devIsolatedBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: c.warningFaded, borderRadius: radius.sm, paddingHorizontal: spacing.xs, paddingVertical: 2 },
  devIsolatedText:  { fontSize: 9, fontWeight: "700", color: c.warning },

  devGrid:     { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  devChip:     { flex: 1, minWidth: "45%", borderRadius: radius.md, borderWidth: 1.5, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, gap: 2 },
  devChipLabel:       { fontSize: fontSize.sm, fontWeight: "700", color: c.textPrimary },
  devChipLabelActive: { color: c.white },
  devChipDetail:       { fontSize: fontSize.xs, color: c.textMuted },
  devChipDetailActive: { color: "rgba(255,255,255,0.75)" },
});
