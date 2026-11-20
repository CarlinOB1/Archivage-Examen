import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { router } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useAppStore } from '@/stores/app-store';
import { AdminHeader } from './components/admin-header';
import { AdminBadge } from './components/admin-badge';
import { AppButton } from '@/components/ui/app-button';
import { AppTextField } from '@/components/ui/app-text-field';
import { ConfirmDialog } from '@/components/ui/states';
import type { AcademicDocument, ValidationStatus } from '@/types/models';

type FilterStatus = 'ALL' | ValidationStatus;

export default function AdminDocumentsScreen() {
  const theme = useTheme();
  const responsive = useResponsive();
  const store = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('ALL');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');

  // Actions states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [deleteConfirmDocId, setDeleteConfirmDocId] = useState<string | null>(null);
  const [editingDoc, setEditingDoc] = useState<AcademicDocument | null>(null);

  // Edit form states
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLevel, setEditLevel] = useState('');
  const [editAcademicYear, setEditAcademicYear] = useState('');
  const [editSession, setEditSession] = useState('');
  const [editSubjectId, setEditSubjectId] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const pendingCount = store.documents.filter((d) => d.validationStatus === 'En attente').length;

  const filteredDocuments = useMemo(() => {
    return store.documents.filter((doc) => {
      // Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        doc.title.toLowerCase().includes(q) ||
        doc.subjectName.toLowerCase().includes(q) ||
        doc.contributorName.toLowerCase().includes(q) ||
        doc.level.toLowerCase().includes(q) ||
        doc.establishment.toLowerCase().includes(q);

      // Status filter
      const matchStatus =
        selectedStatus === 'ALL' || doc.validationStatus === selectedStatus;

      // Subject filter
      const matchSubject =
        selectedSubjectId === 'ALL' || doc.subjectId === selectedSubjectId;

      return matchQuery && matchStatus && matchSubject;
    });
  }, [store.documents, searchQuery, selectedStatus, selectedSubjectId]);

  const handleValidate = async (id: string, status: ValidationStatus) => {
    setActionLoadingId(id);
    try {
      await store.validateDocument(id, status);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleAvailability = async (id: string) => {
    setActionLoadingId(id);
    try {
      await store.toggleDocumentAvailability(id);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmDocId) return;
    setActionLoadingId(deleteConfirmDocId);
    try {
      await store.deleteDocument(deleteConfirmDocId);
    } finally {
      setActionLoadingId(null);
      setDeleteConfirmDocId(null);
    }
  };

  const openEditModal = (doc: AcademicDocument) => {
    setEditingDoc(doc);
    setEditTitle(doc.title);
    setEditDescription(doc.description);
    setEditLevel(doc.level);
    setEditAcademicYear(doc.academicYear);
    setEditSession(doc.session);
    setEditSubjectId(doc.subjectId);
  };

  const handleSaveEdit = async () => {
    if (!editingDoc) return;
    setIsSavingEdit(true);
    try {
      const selectedSubj = store.subjects.find((s) => s.id === editSubjectId);
      await store.updateDocumentMetadata(editingDoc.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        level: editLevel.trim(),
        academicYear: editAcademicYear.trim(),
        session: editSession.trim(),
        subjectId: editSubjectId,
        subjectName: selectedSubj?.name || editingDoc.subjectName,
      });
      setEditingDoc(null);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const statusTabs: { key: FilterStatus; label: string; badge?: number }[] = [
    { key: 'ALL', label: 'Tous', badge: store.documents.length },
    { key: 'En attente', label: 'En attente', badge: pendingCount },
    { key: 'Vérifié', label: 'Vérifié' },
    { key: 'Contesté', label: 'Contesté' },
    { key: 'Rejeté', label: 'Rejeté' },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {deleteConfirmDocId ? (
        <ConfirmDialog
          title="Supprimer définitivement ce document ?"
          message="Cette action supprimera le document ainsi que ses métadonnées de la base de données. L’action est irréversible."
          confirmLabel="Supprimer"
          onCancel={() => setDeleteConfirmDocId(null)}
          onConfirm={() => void handleDelete()}
        />
      ) : null}

      {/* Modal d'édition des métadonnées */}
      <Modal visible={Boolean(editingDoc)} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Modifier le document
              </Text>
              <Pressable onPress={() => setEditingDoc(null)}>
                <MaterialIcons name="close" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ gap: 14 }}>
              <AppTextField
                label="Titre du document"
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="ex. Examen Algorithmique"
              />

              <AppTextField
                label="Description"
                value={editDescription}
                onChangeText={setEditDescription}
                multiline
                numberOfLines={3}
                placeholder="Description du document..."
              />

              <View>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Matière</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 6 }}>
                  {store.subjects.map((subj) => {
                    const isSelected = editSubjectId === subj.id;
                    return (
                      <Pressable
                        key={subj.id}
                        onPress={() => setEditSubjectId(subj.id)}
                        style={[
                          styles.subjectChip,
                          {
                            backgroundColor: isSelected ? theme.primaryBright : theme.backgroundSelected,
                            borderColor: theme.border,
                          },
                        ]}>
                        <Text style={{ color: isSelected ? '#fff' : theme.text, fontSize: 13, fontWeight: '700' }}>
                          {subj.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <AppTextField
                label="Niveau d’études"
                value={editLevel}
                onChangeText={setEditLevel}
                placeholder="ex. Licence 3"
              />

              <AppTextField
                label="Année académique"
                value={editAcademicYear}
                onChangeText={setEditAcademicYear}
                placeholder="ex. 2024-2025"
              />

              <AppTextField
                label="Session"
                value={editSession}
                onChangeText={setEditSession}
                placeholder="ex. Session normale"
              />

              <View style={styles.modalActions}>
                <View style={{ flex: 1 }}>
                  <AppButton
                    label="Annuler"
                    variant="secondary"
                    onPress={() => setEditingDoc(null)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppButton
                    label="Enregistrer"
                    loading={isSavingEdit}
                    onPress={() => void handleSaveEdit()}
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
          title="Modération des Documents"
          subtitle="Validez, modifiez, classez ou supprimez les ressources académiques"
          badge={`${store.documents.length} docs`}
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
            placeholder="Rechercher par titre, matière, auteur, établissement..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.text }]}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={20} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        {/* Onglets de Statuts */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusTabs}>
          {statusTabs.map((tab) => {
            const isSelected = selectedStatus === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setSelectedStatus(tab.key)}
                style={[
                  styles.tabChip,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}>
                <Text
                  style={[
                    styles.tabChipText,
                    { color: isSelected ? '#FFFFFF' : theme.text },
                  ]}>
                  {tab.label}
                </Text>
                {tab.badge !== undefined && tab.badge > 0 ? (
                  <View
                    style={[
                      styles.tabBadge,
                      {
                        backgroundColor: isSelected
                          ? 'rgba(255,255,255,0.25)'
                          : tab.key === 'En attente'
                            ? '#D97706'
                            : theme.primaryBright,
                      },
                    ]}>
                    <Text style={styles.tabBadgeText}>{tab.badge}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Filtre par Matière */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subjectFilterList}>
          <Pressable
            onPress={() => setSelectedSubjectId('ALL')}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedSubjectId === 'ALL' ? theme.primaryBright : theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}>
            <Text
              style={[
                styles.filterChipText,
                { color: selectedSubjectId === 'ALL' ? '#FFFFFF' : theme.text },
              ]}>
              Toutes les matières
            </Text>
          </Pressable>
          {store.subjects.map((subj) => {
            const isSelected = selectedSubjectId === subj.id;
            return (
              <Pressable
                key={subj.id}
                onPress={() => setSelectedSubjectId(subj.id)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? theme.primaryBright : theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}>
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isSelected ? '#FFFFFF' : theme.text },
                  ]}>
                  {subj.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Liste des documents */}
        <View style={styles.docCountRow}>
          <Text style={[styles.docCountText, { color: theme.textSecondary }]}>
            {filteredDocuments.length} document{filteredDocuments.length > 1 ? 's' : ''} trouvé{filteredDocuments.length > 1 ? 's' : ''}
          </Text>
        </View>

        {filteredDocuments.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <MaterialIcons name="search-off" size={42} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Aucun document trouvé</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Modifiez vos critères de recherche ou réinitialisez les filtres.
            </Text>
          </View>
        ) : (
          filteredDocuments.map((doc) => {
            const isLoading = actionLoadingId === doc.id;
            return (
              <View
                key={doc.id}
                style={[
                  styles.docCard,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}>
                {/* En-tête de la carte */}
                <View style={styles.docCardHeader}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={styles.badgeRow}>
                      <View
                        style={[
                          styles.typeTag,
                          { backgroundColor: `${theme.primaryBright}15` },
                        ]}>
                        <Text style={[styles.typeTagText, { color: theme.primaryBright }]}>
                          {doc.type}
                        </Text>
                      </View>
                      <AdminBadge type="validation" value={doc.validationStatus} />
                      <AdminBadge type="availability" value={doc.availabilityStatus} />
                    </View>

                    <Text style={[styles.docTitle, { color: theme.text }]}>{doc.title}</Text>
                  </View>
                </View>

                {doc.description ? (
                  <Text numberOfLines={2} style={[styles.docDesc, { color: theme.textSecondary }]}>
                    {doc.description}
                  </Text>
                ) : null}

                {/* Métadonnées académiques */}
                <View style={[styles.metaGrid, { backgroundColor: theme.backgroundSelected }]}>
                  <View style={styles.metaItem}>
                    <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Matière</Text>
                    <Text style={[styles.metaVal, { color: theme.text }]}>{doc.subjectName}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Niveau</Text>
                    <Text style={[styles.metaVal, { color: theme.text }]}>{doc.level}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Année</Text>
                    <Text style={[styles.metaVal, { color: theme.text }]}>{doc.academicYear}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Déposé par</Text>
                    <Text style={[styles.metaVal, { color: theme.text }]} numberOfLines={1}>
                      {doc.contributorName}
                    </Text>
                  </View>
                </View>

                {/* Barre d'actions d'administration */}
                <View style={styles.actionToolbar}>
                  {/* Valider si non vérifié */}
                  {doc.validationStatus !== 'Vérifié' ? (
                    <Pressable
                      disabled={isLoading}
                      onPress={() => void handleValidate(doc.id, 'Vérifié')}
                      style={[styles.toolBtn, styles.validateBtn]}>
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <MaterialIcons name="check" size={16} color="#fff" />
                          <Text style={[styles.toolBtnText, { color: '#fff' }]}>Valider</Text>
                        </>
                      )}
                    </Pressable>
                  ) : (
                    <Pressable
                      disabled={isLoading}
                      onPress={() => void handleValidate(doc.id, 'Contesté')}
                      style={[styles.toolBtn, styles.disputeBtn]}>
                      <MaterialIcons name="warning" size={16} color="#EA580C" />
                      <Text style={[styles.toolBtnText, { color: '#EA580C' }]}>Contester</Text>
                    </Pressable>
                  )}

                  {/* Rejeter */}
                  {doc.validationStatus !== 'Rejeté' ? (
                    <Pressable
                      disabled={isLoading}
                      onPress={() => void handleValidate(doc.id, 'Rejeté')}
                      style={[styles.toolBtn, styles.rejectBtn]}>
                      <MaterialIcons name="cancel" size={16} color="#DC2626" />
                      <Text style={[styles.toolBtnText, { color: '#DC2626' }]}>Rejeter</Text>
                    </Pressable>
                  ) : null}

                  {/* Masquer / Rendre visible */}
                  <Pressable
                    disabled={isLoading}
                    onPress={() => void handleToggleAvailability(doc.id)}
                    style={[
                      styles.iconBtn,
                      {
                        backgroundColor:
                          doc.availabilityStatus === 'Disponible'
                            ? theme.backgroundSelected
                            : '#FEF3C7',
                        borderColor: theme.border,
                      },
                    ]}>
                    <MaterialIcons
                      name={doc.availabilityStatus === 'Disponible' ? 'visibility-off' : 'visibility'}
                      size={18}
                      color={doc.availabilityStatus === 'Disponible' ? theme.textSecondary : '#D97706'}
                    />
                  </Pressable>

                  {/* Modifier métadonnées */}
                  <Pressable
                    onPress={() => openEditModal(doc)}
                    style={[styles.iconBtn, { borderColor: theme.border }]}>
                    <MaterialIcons name="edit" size={18} color={theme.text} />
                  </Pressable>

                  {/* Consulter le document */}
                  <Pressable
                    onPress={() => router.push(`/documents/${doc.id}`)}
                    style={[styles.iconBtn, { borderColor: theme.border }]}>
                    <MaterialIcons name="launch" size={18} color={theme.primaryBright} />
                  </Pressable>

                  {/* Supprimer */}
                  <Pressable
                    onPress={() => setDeleteConfirmDocId(doc.id)}
                    style={[styles.iconBtn, styles.deleteBtn]}>
                    <MaterialIcons name="delete-outline" size={18} color="#DC2626" />
                  </Pressable>
                </View>
              </View>
            );
          })
        )}

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
  statusTabs: {
    gap: 8,
    marginBottom: 10,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  subjectFilterList: {
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  docCountRow: {
    marginBottom: 12,
  },
  docCountText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  docCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    gap: 12,
  },
  docCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeTagText: {
    fontSize: 11,
    fontWeight: '800',
  },
  docTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  docDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  metaGrid: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 10,
    justifyContent: 'space-between',
  },
  metaItem: {
    flex: 1,
    gap: 2,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 6,
  },
  toolBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  validateBtn: {
    backgroundColor: '#16A34A',
  },
  disputeBtn: {
    backgroundColor: '#FFEDD5',
  },
  rejectBtn: {
    backgroundColor: '#FEE2E2',
  },
  toolBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
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
    maxWidth: 520,
    maxHeight: '90%',
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
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  subjectChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
});
