import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/use-theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useAppStore } from '@/stores/app-store';
import { AdminHeader } from './components/admin-header';
import { AppButton } from '@/components/ui/app-button';
import { AppTextField } from '@/components/ui/app-text-field';

export default function AdminNotificationsScreen() {
  const theme = useTheme();
  const responsive = useResponsive();
  const store = useAppStore();

  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleBroadcast = async () => {
    if (!title.trim() || !message.trim()) {
      setFeedbackMsg({ text: 'Veuillez saisir un titre et un message.', type: 'error' });
      return;
    }
    if (targetType === 'specific' && !selectedUserId) {
      setFeedbackMsg({ text: 'Veuillez sélectionner un destinataire.', type: 'error' });
      return;
    }

    setIsSending(true);
    setFeedbackMsg(null);
    try {
      await store.sendSystemNotification({
        userId: targetType === 'specific' ? selectedUserId : undefined,
        title: title.trim(),
        message: message.trim(),
        relatedDocumentId: selectedDocId || undefined,
      });
      setFeedbackMsg({
        text: targetType === 'all'
          ? 'Annonce diffusée à l’ensemble des utilisateurs !'
          : 'Notification envoyée à l’utilisateur sélectionné.',
        type: 'success',
      });
      setTitle('');
      setMessage('');
      setSelectedDocId('');
    } catch (e) {
      setFeedbackMsg({
        text: e instanceof Error ? e.message : 'Erreur lors de l’envoi.',
        type: 'error',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            maxWidth: responsive.contentMaxWidth,
            paddingHorizontal: responsive.horizontalPadding,
          },
        ]}>
        <AdminHeader
          title="Diffusion des Notifications"
          subtitle="Communiquez avec les étudiants, annoncez des publications et mises à jour"
          badge="Broadcast"
        />

        {/* Formulaire de diffusion */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            Nouvelle Annonce Système
          </Text>

          {/* Cible de la notification */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Audience cible</Text>
            <View style={styles.targetRow}>
              <Pressable
                onPress={() => setTargetType('all')}
                style={[
                  styles.targetChoice,
                  {
                    backgroundColor:
                      targetType === 'all' ? theme.primary : theme.backgroundSelected,
                    borderColor: theme.border,
                  },
                ]}>
                <MaterialIcons
                  name="campaign"
                  size={18}
                  color={targetType === 'all' ? '#fff' : theme.text}
                />
                <Text
                  style={[
                    styles.targetChoiceText,
                    { color: targetType === 'all' ? '#fff' : theme.text },
                  ]}>
                  Tous les étudiants ({store.adminUsers.length})
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setTargetType('specific')}
                style={[
                  styles.targetChoice,
                  {
                    backgroundColor:
                      targetType === 'specific' ? theme.primary : theme.backgroundSelected,
                    borderColor: theme.border,
                  },
                ]}>
                <MaterialIcons
                  name="person"
                  size={18}
                  color={targetType === 'specific' ? '#fff' : theme.text}
                />
                <Text
                  style={[
                    styles.targetChoiceText,
                    { color: targetType === 'specific' ? '#fff' : theme.text },
                  ]}>
                  Utilisateur ciblé
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Sélection de l'utilisateur si spécifique */}
          {targetType === 'specific' ? (
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Sélectionner l’utilisateur</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}>
                {store.adminUsers.map((u) => {
                  const isSelected = selectedUserId === u.id;
                  return (
                    <Pressable
                      key={u.id}
                      onPress={() => setSelectedUserId(u.id)}
                      style={[
                        styles.userChip,
                        {
                          backgroundColor: isSelected ? theme.primaryBright : theme.backgroundSelected,
                          borderColor: theme.border,
                        },
                      ]}>
                      <Text
                        style={{
                          color: isSelected ? '#fff' : theme.text,
                          fontWeight: '700',
                          fontSize: 12,
                        }}>
                        {u.firstName} {u.lastName}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {/* Champs titre et message */}
          <AppTextField
            label="Titre de la notification"
            value={title}
            onChangeText={setTitle}
            placeholder="ex. Nouveaux corrigés disponibles pour la session 2025"
          />

          <AppTextField
            label="Message détaillé"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            placeholder="Rédigez l’information claire à destination des étudiants..."
          />

          {/* Document lié facultatif */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.text }]}>
              Lier un document (facultatif)
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}>
              <Pressable
                onPress={() => setSelectedDocId('')}
                style={[
                  styles.userChip,
                  {
                    backgroundColor: !selectedDocId ? theme.primaryBright : theme.backgroundSelected,
                    borderColor: theme.border,
                  },
                ]}>
                <Text
                  style={{
                    color: !selectedDocId ? '#fff' : theme.text,
                    fontWeight: '700',
                    fontSize: 12,
                  }}>
                  Aucun document
                </Text>
              </Pressable>
              {store.documents.slice(0, 8).map((doc) => {
                const isSelected = selectedDocId === doc.id;
                return (
                  <Pressable
                    key={doc.id}
                    onPress={() => setSelectedDocId(doc.id)}
                    style={[
                      styles.userChip,
                      {
                        backgroundColor: isSelected ? theme.primaryBright : theme.backgroundSelected,
                        borderColor: theme.border,
                      },
                    ]}>
                    <Text
                      style={{
                        color: isSelected ? '#fff' : theme.text,
                        fontWeight: '700',
                        fontSize: 12,
                      }}>
                      {doc.title}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Message de feedback */}
          {feedbackMsg ? (
            <View
              style={[
                styles.feedbackBox,
                {
                  backgroundColor:
                    feedbackMsg.type === 'success' ? '#DCFCE7' : '#FEE2E2',
                  borderColor:
                    feedbackMsg.type === 'success' ? '#16A34A' : '#DC2626',
                },
              ]}>
              <MaterialIcons
                name={feedbackMsg.type === 'success' ? 'check-circle' : 'error'}
                size={18}
                color={feedbackMsg.type === 'success' ? '#16A34A' : '#DC2626'}
              />
              <Text
                style={{
                  color: feedbackMsg.type === 'success' ? '#16A34A' : '#DC2626',
                  fontSize: 13,
                  fontWeight: '700',
                  flex: 1,
                }}>
                {feedbackMsg.text}
              </Text>
            </View>
          ) : null}

          {/* Bouton d'action */}
          <View style={{ marginTop: 8 }}>
            <AppButton
              label={targetType === 'all' ? 'Diffuser l’annonce générale' : 'Envoyer la notification'}
              loading={isSending}
              onPress={() => void handleBroadcast()}
            />
          </View>
        </View>

        {/* Historique des notifications */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>
          Historique des Notifications Récentes
        </Text>

        <View style={styles.historyList}>
          {store.notifications.map((item) => (
            <View
              key={item.id}
              style={[
                styles.notifCard,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
              <View style={[styles.notifIcon, { backgroundColor: `${theme.primaryBright}15` }]}>
                <MaterialIcons name="notifications" size={20} color={theme.primaryBright} />
              </View>

              <View style={{ flex: 1, gap: 2 }}>
                <View style={styles.notifHeader}>
                  <Text style={[styles.notifTitle, { color: theme.text }]}>{item.title}</Text>
                  <Text style={[styles.notifDate, { color: theme.textSecondary }]}>
                    {item.createdAt}
                  </Text>
                </View>
                <Text style={[styles.notifMsg, { color: theme.textSecondary }]}>
                  {item.message}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { width: '100%', alignSelf: 'center', padding: 20 },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    gap: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  targetRow: {
    flexDirection: 'row',
    gap: 10,
  },
  targetChoice: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  targetChoiceText: {
    fontSize: 12,
    fontWeight: '700',
  },
  userChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  feedbackBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
  },
  historyList: {
    gap: 10,
  },
  notifCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notifIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  notifDate: {
    fontSize: 11,
  },
  notifMsg: {
    fontSize: 12,
    lineHeight: 17,
  },
});
