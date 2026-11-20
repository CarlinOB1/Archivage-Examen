import React, { useState } from 'react';
import {
  Modal,
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
import { ConfirmDialog } from '@/components/ui/states';
import type { Subject } from '@/types/models';

const ICON_CHOICES: { key: Subject['iconKey']; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: 'network', label: 'Réseaux', icon: 'hub' },
  { key: 'code', label: 'Code & Algorithmique', icon: 'code' },
  { key: 'database', label: 'Bases de données', icon: 'storage' },
  { key: 'math', label: 'Mathématiques', icon: 'functions' },
  { key: 'book', label: 'Général / Cours', icon: 'menu-book' },
];

export default function AdminSubjectsScreen() {
  const theme = useTheme();
  const responsive = useResponsive();
  const store = useAppStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconKey, setIconKey] = useState<Subject['iconKey']>('code');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const openCreateModal = () => {
    setEditingSubject(null);
    setName('');
    setDescription('');
    setIconKey('code');
    setErrorMsg('');
    setModalVisible(true);
  };

  const openEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setName(subject.name);
    setDescription(subject.description);
    setIconKey(subject.iconKey);
    setErrorMsg('');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMsg('Le nom de la matière est obligatoire.');
      return;
    }
    setIsSaving(true);
    setErrorMsg('');
    try {
      if (editingSubject) {
        await store.updateSubject(editingSubject.id, {
          name: name.trim(),
          description: description.trim(),
          iconKey,
        });
      } else {
        await store.createSubject({
          name: name.trim(),
          description: description.trim(),
          iconKey,
        });
      }
      setModalVisible(false);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Une erreur est survenue.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await store.deleteSubject(deleteId);
      setDeleteId(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Impossible de supprimer cette matière.');
      setDeleteId(null);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {deleteId ? (
        <ConfirmDialog
          title="Supprimer cette matière ?"
          message="Cette action supprimera la matière du catalogue si aucun document n’y est rattaché."
          confirmLabel="Supprimer"
          onCancel={() => setDeleteId(null)}
          onConfirm={() => void handleDelete()}
        />
      ) : null}

      {/* Modal d'ajout / modification de matière */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingSubject ? 'Modifier la matière' : 'Nouvelle matière'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ gap: 14 }}>
              <AppTextField
                label="Nom de la matière"
                value={name}
                onChangeText={setName}
                placeholder="ex. Intelligence Artificielle"
                error={errorMsg}
              />

              <AppTextField
                label="Description"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                placeholder="Objectifs et domaines couverts par la matière..."
              />

              <View>
                <Text style={[styles.label, { color: theme.text }]}>Icône représentative</Text>
                <View style={styles.iconGrid}>
                  {ICON_CHOICES.map((item) => {
                    const isSelected = iconKey === item.key;
                    return (
                      <Pressable
                        key={item.key}
                        onPress={() => setIconKey(item.key)}
                        style={[
                          styles.iconChoice,
                          {
                            backgroundColor: isSelected
                              ? `${theme.primaryBright}20`
                              : theme.backgroundSelected,
                            borderColor: isSelected ? theme.primaryBright : theme.border,
                          },
                        ]}>
                        <MaterialIcons
                          name={item.icon}
                          size={22}
                          color={isSelected ? theme.primaryBright : theme.textSecondary}
                        />
                        <Text
                          style={[
                            styles.iconChoiceLabel,
                            { color: isSelected ? theme.primaryBright : theme.text },
                          ]}>
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.modalActions}>
                <View style={{ flex: 1 }}>
                  <AppButton
                    label="Annuler"
                    variant="secondary"
                    onPress={() => setModalVisible(false)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppButton
                    label={editingSubject ? 'Enregistrer' : 'Créer'}
                    loading={isSaving}
                    onPress={() => void handleSave()}
                  />
                </View>
              </View>
            </ScrollView>
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
          title="Catalogue des Matières"
          subtitle="Structurez les disciplines et les catégories de cours"
          badge={`${store.subjects.length} matières`}
          rightAction={
            <Pressable
              onPress={openCreateModal}
              style={[styles.addBtn, { backgroundColor: theme.primary }]}>
              <MaterialIcons name="add" size={20} color="#fff" />
              <Text style={styles.addBtnText}>Ajouter</Text>
            </Pressable>
          }
        />

        <View style={styles.subjectsList}>
          {store.subjects.map((subj) => {
            const docCount = store.documents.filter((d) => d.subjectId === subj.id).length;
            const iconObj = ICON_CHOICES.find((i) => i.key === subj.iconKey) || ICON_CHOICES[4];

            return (
              <View
                key={subj.id}
                style={[
                  styles.subjCard,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}>
                <View style={[styles.subjIconBox, { backgroundColor: `${theme.primaryBright}15` }]}>
                  <MaterialIcons name={iconObj.icon} size={26} color={theme.primaryBright} />
                </View>

                <View style={{ flex: 1, gap: 4 }}>
                  <View style={styles.subjTitleRow}>
                    <Text style={[styles.subjName, { color: theme.text }]}>{subj.name}</Text>
                    <View
                      style={[
                        styles.docCountTag,
                        { backgroundColor: `${theme.primaryBright}15` },
                      ]}>
                      <MaterialIcons name="folder-open" size={14} color={theme.primaryBright} />
                      <Text style={[styles.docCountText, { color: theme.primaryBright }]}>
                        {docCount} doc{docCount > 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>

                  {subj.description ? (
                    <Text
                      numberOfLines={2}
                      style={[styles.subjDesc, { color: theme.textSecondary }]}>
                      {subj.description}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.cardActions}>
                  <Pressable
                    onPress={() => openEditModal(subj)}
                    style={[styles.iconActionBtn, { borderColor: theme.border }]}>
                    <MaterialIcons name="edit" size={18} color={theme.text} />
                  </Pressable>

                  <Pressable
                    onPress={() => setDeleteId(subj.id)}
                    style={[
                      styles.iconActionBtn,
                      {
                        borderColor: docCount > 0 ? theme.border : '#FEE2E2',
                        backgroundColor: docCount > 0 ? theme.backgroundSelected : '#FEF2F2',
                      },
                    ]}>
                    <MaterialIcons
                      name="delete-outline"
                      size={18}
                      color={docCount > 0 ? theme.textSecondary : '#DC2626'}
                    />
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 12,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  subjectsList: {
    gap: 12,
  },
  subjCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  subjIconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  subjName: {
    fontSize: 16,
    fontWeight: '800',
  },
  docCountTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  docCountText: {
    fontSize: 12,
    fontWeight: '800',
  },
  subjDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 18,
    fontWeight: '800',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  iconChoiceLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
});
