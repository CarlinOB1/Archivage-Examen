import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/use-theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useAppStore } from '@/stores/app-store';
import { AdminHeader } from './components/admin-header';
import { AdminBadge } from './components/admin-badge';
import { AppButton } from '@/components/ui/app-button';
import { AppTextField } from '@/components/ui/app-text-field';
import type { UserProfile } from '@/types/models';

export default function AdminUsersScreen() {
  const theme = useTheme();
  const responsive = useResponsive();
  const store = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'admin' | 'user'>('ALL');

  // Direct notification modal
  const [notifyUser, setNotifyUser] = useState<UserProfile | null>(null);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const filteredUsers = useMemo(() => {
    return store.adminUsers.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.university.toLowerCase().includes(q) ||
        u.programme.toLowerCase().includes(q);

      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;

      return matchQuery && matchRole;
    });
  }, [store.adminUsers, searchQuery, roleFilter]);

  const handleSendToUser = async () => {
    if (!notifyUser || !notifTitle.trim() || !notifMessage.trim()) return;
    setIsSending(true);
    try {
      await store.sendSystemNotification({
        userId: notifyUser.id,
        title: notifTitle.trim(),
        message: notifMessage.trim(),
      });
      setSendSuccess(true);
      setTimeout(() => {
        setSendSuccess(false);
        setNotifyUser(null);
        setNotifTitle('');
        setNotifMessage('');
      }, 1200);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* Modal d'envoi de notification ciblée */}
      <Modal visible={Boolean(notifyUser)} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Notifier {notifyUser?.firstName} {notifyUser?.lastName}
              </Text>
              <Pressable onPress={() => setNotifyUser(null)}>
                <MaterialIcons name="close" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            {sendSuccess ? (
              <View style={styles.successBox}>
                <MaterialIcons name="check-circle" size={40} color="#16A34A" />
                <Text style={[styles.successText, { color: theme.text }]}>
                  Notification envoyée avec succès !
                </Text>
              </View>
            ) : (
              <View style={{ gap: 14 }}>
                <AppTextField
                  label="Titre du message"
                  value={notifTitle}
                  onChangeText={setNotifTitle}
                  placeholder="ex. Précision sur votre dépôt"
                />

                <AppTextField
                  label="Corps de la notification"
                  value={notifMessage}
                  onChangeText={setNotifMessage}
                  multiline
                  numberOfLines={4}
                  placeholder="Écrivez le message destiné à cet étudiant..."
                />

                <View style={styles.modalActions}>
                  <View style={{ flex: 1 }}>
                    <AppButton
                      label="Annuler"
                      variant="secondary"
                      onPress={() => setNotifyUser(null)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppButton
                      label="Envoyer"
                      loading={isSending}
                      onPress={() => void handleSendToUser()}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            maxWidth: responsive.contentMaxWidth,
            paddingHorizontal: responsive.horizontalPadding,
          },
        ]}>
        <AdminHeader
          title="Annuaire des Utilisateurs"
          subtitle="Profils enregistrés, rôles et contributions académiques"
          badge={`${store.adminUsers.length} comptes`}
        />

        {/* Barre de recherche */}
        <View
          style={[
            styles.searchBar,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <MaterialIcons name="search" size={22} color={theme.textSecondary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Rechercher par nom, email, université, filière..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.text }]}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={20} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        {/* Filtres de rôle */}
        <View style={styles.roleFilterRow}>
          {(['ALL', 'admin', 'user'] as const).map((r) => {
            const isSelected = roleFilter === r;
            const label = r === 'ALL' ? 'Tous' : r === 'admin' ? 'Modérateurs / Admin' : 'Étudiants';
            return (
              <Pressable
                key={r}
                onPress={() => setRoleFilter(r)}
                style={[
                  styles.filterBtn,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}>
                <Text
                  style={[
                    styles.filterBtnText,
                    { color: isSelected ? '#fff' : theme.text },
                  ]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Liste des utilisateurs */}
        <Text style={[styles.countLabel, { color: theme.textSecondary }]}>
          {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}
        </Text>

        <View style={styles.userList}>
          {filteredUsers.map((u) => {
            const initials = `${u.firstName?.[0] || 'U'}${u.lastName?.[0] || ''}`.toUpperCase();
            const docsUploaded = store.documents.filter(
              (d) =>
                d.contributorName.toLowerCase().includes(u.lastName.toLowerCase()) ||
                d.contributorName.toLowerCase().includes(u.firstName.toLowerCase())
            ).length;

            return (
              <View
                key={u.id}
                style={[
                  styles.userCard,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}>
                <View style={styles.userTopRow}>
                  <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRoleRow}>
                      <Text style={[styles.userName, { color: theme.text }]}>
                        {u.firstName} {u.lastName}
                      </Text>
                      <AdminBadge type="role" value={u.role} />
                    </View>
                    <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
                      {u.email}
                    </Text>
                  </View>
                </View>

                {/* Métadonnées académiques */}
                <View style={[styles.academicBox, { backgroundColor: theme.backgroundSelected }]}>
                  <View style={styles.academicRow}>
                    <MaterialIcons name="account-balance" size={15} color={theme.textSecondary} />
                    <Text style={[styles.academicVal, { color: theme.text }]}>
                      {u.university}
                    </Text>
                  </View>
                  <View style={styles.academicRow}>
                    <MaterialIcons name="menu-book" size={15} color={theme.textSecondary} />
                    <Text style={[styles.academicVal, { color: theme.text }]}>
                      {u.programme} · {u.level}
                    </Text>
                  </View>
                </View>

                {/* Pied de carte avec statistiques et action */}
                <View style={styles.userFooter}>
                  <View style={styles.statsRow}>
                    <MaterialIcons name="cloud-upload" size={16} color={theme.primaryBright} />
                    <Text style={[styles.statText, { color: theme.textSecondary }]}>
                      <Text style={{ fontWeight: '800', color: theme.text }}>
                        {docsUploaded}
                      </Text>{' '}
                      dépôt{docsUploaded > 1 ? 's' : ''}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => {
                      setNotifyUser(u);
                      setNotifTitle('');
                      setNotifMessage('');
                    }}
                    style={[
                      styles.notifyBtn,
                      { backgroundColor: `${theme.primaryBright}15`, borderColor: theme.border },
                    ]}>
                    <MaterialIcons name="mail-outline" size={16} color={theme.primaryBright} />
                    <Text style={[styles.notifyBtnText, { color: theme.primaryBright }]}>
                      Envoyer un message
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { width: '100%', alignSelf: 'center', padding: 20 },
  searchBar: {
    height: 50,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  roleFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  countLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  userList: {
    gap: 12,
  },
  userCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  userTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  nameRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  academicBox: {
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  academicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  academicVal: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  userFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
  },
  notifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  notifyBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  successBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  successText: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
});
