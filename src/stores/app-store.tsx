import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Linking, Platform, Pressable, Text, View } from 'react-native';
import type { User } from '@supabase/supabase-js';
import type * as DocumentPicker from 'expo-document-picker';
import { documents as mockDocuments, mockModerationHistory, mockReports, mockUsers, mockUser, subjects as mockSubjects } from '@/data/catalog';
import { isSupabaseConfigured, requireSupabase, supabase } from '@/lib/supabase';
import type {
  AcademicDocument,
  AdminStats,
  AppNotification,
  AppUser,
  DocumentReport,
  ModerationAction,
  ReportReason,
  ReportStatus,
  Subject,
  UserProfile,
  ValidationStatus,
} from '@/types/models';

type DatabaseDocumentType = 'exam' | 'answer_key' | 'assignment' | 'course';

type DocumentRow = {
  id: string;
  title: string;
  description: string;
  file_name: string;
  mime_type: string;
  subject_id: string;
  level: string;
  academic_year: string;
  session: string;
  establishment: string;
  programme: string;
  contributor_display_name: string;
  created_at: string;
  page_count: number | null;
  download_count: number;
  type: DatabaseDocumentType;
  availability_status: 'available' | 'unavailable';
  validation_status: 'pending' | 'verified' | 'disputed' | 'rejected';
  subjects: { name: string }[] | { name: string } | null;
};

type ReportRow = {
  id: string;
  document_id: string;
  reporter_id: string;
  reason: ReportReason;
  comment: string;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  academic_documents: { title: string; subjects?: { name: string }[] | { name: string } | null } | null;
  profiles: { first_name: string; last_name: string } | null;
};

type ProfileRow = {
  id: string;
  first_name: string;
  last_name: string;
  university: string;
  programme: string;
  level: string;
  created_at: string;
};

type SignUpInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

type UploadDocumentInput = {
  file: DocumentPicker.DocumentPickerAsset;
  title: string;
  description: string;
  subjectId: string;
  level: string;
  academicYear: string;
  session: string;
  establishment: string;
  programme: string;
  type: AcademicDocument['type'];
};

type AppStore = {
  documents: AcademicDocument[];
  subjects: Subject[];
  favorites: AcademicDocument[];
  notifications: AppNotification[];
  user: AppUser;
  isAuthenticated: boolean;
  isConfigured: boolean;
  isLoading: boolean;
  error: string | null;
  // Admin state & functions
  isAdmin: boolean;
  setIsAdmin: (value: boolean) => void;
  toggleAdminMode: () => void;
  // Moderator state & functions
  isModerator: boolean;
  toggleModeratorMode: () => void;
  moderationHistory: ModerationAction[];
  addModerationAction: (action: ModerationAction) => void;
  reports: DocumentReport[];
  adminUsers: UserProfile[];
  adminStats: AdminStats;
  validateDocument: (id: string, status: ValidationStatus) => Promise<void>;
  toggleDocumentAvailability: (id: string) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  updateDocumentMetadata: (id: string, updates: Partial<AcademicDocument>) => Promise<void>;
  updateReportStatus: (reportId: string, status: ReportStatus) => Promise<void>;
  createSubject: (input: { name: string; description: string; iconKey: Subject['iconKey'] }) => Promise<void>;
  updateSubject: (id: string, input: { name: string; description: string; iconKey: Subject['iconKey'] }) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  loadAdminUsers: () => Promise<UserProfile[]>;
  sendSystemNotification: (input: { userId?: string; title: string; message: string; relatedDocumentId?: string }) => Promise<void>;
  refreshAdminData: () => Promise<void>;
  // Regular functions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: AppUser) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  uploadDocument: (input: UploadDocumentInput) => Promise<void>;
  submitReport: (documentId: string, reason: string, comment: string) => Promise<void>;
  getDocumentUrl: (documentId: string, trackDownload?: boolean) => Promise<string>;
  refresh: () => Promise<void>;
};

const emptyUser: AppUser = {
  firstName: '',
  lastName: '',
  email: '',
  university: '',
  programme: '',
  level: '',
  role: 'user',
  isAdmin: false,
  isModerator: false,
};

const documentTypes: Record<DocumentRow['type'], AcademicDocument['type']> = {
  exam: 'Examen',
  answer_key: 'Corrigé',
  assignment: 'Devoir',
  course: 'Cours',
};

const databaseDocumentTypes: Record<AcademicDocument['type'], DatabaseDocumentType> = {
  Examen: 'exam',
  'Corrigé': 'answer_key',
  Devoir: 'assignment',
  Cours: 'course',
};

const validationStatuses: Record<DocumentRow['validation_status'], AcademicDocument['validationStatus']> = {
  pending: 'En attente',
  verified: 'Vérifié',
  disputed: 'Contesté',
  rejected: 'Rejeté',
};

const databaseValidationStatuses: Record<AcademicDocument['validationStatus'], DocumentRow['validation_status']> = {
  'En attente': 'pending',
  'Vérifié': 'verified',
  'Contesté': 'disputed',
  'Rejeté': 'rejected',
};

const reportReasonLabels: Record<ReportReason, string> = {
  incorrect_document: 'Document incorrect',
  unreadable_content: 'Contenu illisible',
  wrong_format: 'Format erroné',
  wrong_answer_key: 'Corrigé erroné',
  other: 'Autre motif',
};

const AppStoreContext = createContext<AppStore | null>(null);

function toMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Une erreur inattendue est survenue.';
}

function mapDocument(row: DocumentRow): AcademicDocument {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    fileName: row.file_name,
    fileType: row.mime_type === 'application/pdf' ? 'PDF' : row.mime_type.split('/').pop() ?? 'Fichier',
    subjectId: row.subject_id,
    subjectName: Array.isArray(row.subjects) ? row.subjects[0]?.name ?? '' : row.subjects?.name ?? '',
    level: row.level,
    academicYear: row.academic_year,
    session: row.session,
    establishment: row.establishment,
    programme: row.programme,
    contributorName: row.contributor_display_name,
    createdAt: new Date(row.created_at).toLocaleDateString('fr-FR'),
    pageCount: row.page_count ?? 0,
    downloadCount: row.download_count,
    type: documentTypes[row.type],
    isFavorite: false,
    availabilityStatus: row.availability_status === 'available' ? 'Disponible' : 'Indisponible',
    validationStatus: validationStatuses[row.validation_status],
  };
}

function mapReportReason(reason: string): ReportReason {
  const reasons: Record<string, ReportReason> = {
    'Document incorrect': 'incorrect_document',
    'Contenu illisible': 'unreadable_content',
    'Format erroné': 'wrong_format',
    'Corrigé erroné': 'wrong_answer_key',
    Autre: 'other',
  };
  return reasons[reason] ?? 'other';
}

function mapDocumentType(type: AcademicDocument['type']): DatabaseDocumentType {
  return databaseDocumentTypes[type];
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<AcademicDocument[]>(mockDocuments);
  const [subjects, setSubjects] = useState<Subject[]>(mockSubjects);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [user, setUser] = useState<AppUser>(mockUser);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true); // default true for seamless admin experience & testing
  const [isModerator, setIsModerator] = useState(true); // default true for demo/testing
  const [moderationHistory, setModerationHistory] = useState<ModerationAction[]>(mockModerationHistory);
  const [reports, setReports] = useState<DocumentReport[]>(mockReports);
  const [adminUsers, setAdminUsers] = useState<UserProfile[]>(mockUsers);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  const adminStats = useMemo<AdminStats>(() => ({
    totalDocuments: documents.length,
    pendingDocuments: documents.filter((d) => d.validationStatus === 'En attente').length,
    verifiedDocuments: documents.filter((d) => d.validationStatus === 'Vérifié').length,
    disputedDocuments: documents.filter((d) => d.validationStatus === 'Contesté').length,
    rejectedDocuments: documents.filter((d) => d.validationStatus === 'Rejeté').length,
    totalReports: reports.length,
    openReports: reports.filter((r) => r.status === 'open' || r.status === 'reviewing').length,
    totalUsers: adminUsers.length,
    totalSubjects: subjects.length,
    totalDownloads: documents.reduce((sum, d) => sum + (d.downloadCount || 0), 0),
  }), [documents, reports, adminUsers, subjects]);

  const loadReportsFromDb = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error: repError } = await supabase
        .from('document_reports')
        .select('id,document_id,reporter_id,reason,comment,status,reviewed_by,reviewed_at,created_at,academic_documents(title,subjects(name)),profiles!reporter_id(first_name,last_name)')
        .order('created_at', { ascending: false });

      if (repError) {
        console.warn('Impossible de charger les signalements Supabase :', repError);
        return;
      }
      if (data && data.length > 0) {
        const mappedReports: DocumentReport[] = (data as unknown as ReportRow[]).map((row) => ({
          id: row.id,
          documentId: row.document_id,
          documentTitle: row.academic_documents?.title ?? 'Document',
          documentSubject: Array.isArray(row.academic_documents?.subjects)
            ? row.academic_documents?.subjects[0]?.name
            : row.academic_documents?.subjects?.name,
          reporterId: row.reporter_id,
          reporterName: row.profiles
            ? `${row.profiles.first_name} ${row.profiles.last_name}`.trim()
            : 'Utilisateur',
          reason: row.reason,
          reasonLabel: reportReasonLabels[row.reason] ?? 'Signalement',
          comment: row.comment,
          status: row.status,
          reviewedBy: row.reviewed_by ?? undefined,
          reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toLocaleDateString('fr-FR') : undefined,
          createdAt: new Date(row.created_at).toLocaleDateString('fr-FR'),
        }));
        setReports(mappedReports);
      }
    } catch (e) {
      console.warn('Erreur lors du chargement des signalements :', e);
    }
  }, []);

  const loadUsersFromDb = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error: userError } = await supabase
        .from('profiles')
        .select('id,first_name,last_name,university,programme,level,created_at')
        .order('created_at', { ascending: false });

      if (userError) {
        console.warn('Impossible de charger les profils utilisateurs Supabase :', userError);
        return;
      }
      if (data && data.length > 0) {
        const mappedUsers: UserProfile[] = (data as ProfileRow[]).map((p) => ({
          id: p.id,
          firstName: p.first_name,
          lastName: p.last_name,
          email: `${p.first_name.toLowerCase()}.${p.last_name.toLowerCase()}@etu.cg`.replace(/\s+/g, ''),
          university: p.university || 'Université Marien Ngouabi',
          programme: p.programme || 'Informatique',
          level: p.level || 'Licence',
          createdAt: new Date(p.created_at).toLocaleDateString('fr-FR'),
          documentCount: documents.filter((d) => d.contributorName.includes(p.last_name) || d.contributorName.includes(p.first_name)).length,
          role: 'user',
        }));
        setAdminUsers(mappedUsers);
      }
    } catch (e) {
      console.warn('Erreur lors du chargement des utilisateurs :', e);
    }
  }, [documents]);

  const loadData = useCallback(async (currentUser: User | null) => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [subjectResult, documentResult] = await Promise.all([
        supabase.from('subjects').select('id,name,description,icon_key').order('name'),
        supabase.from('academic_documents')
          .select('id,title,description,file_name,mime_type,subject_id,level,academic_year,session,establishment,programme,contributor_display_name,created_at,page_count,download_count,type,availability_status,validation_status,subjects(name)')
          .order('created_at', { ascending: false }),
      ]);
      if (subjectResult.error) throw subjectResult.error;
      if (documentResult.error) throw documentResult.error;

      const documentRows = documentResult.data as DocumentRow[];
      const mappedDocuments = documentRows.map(mapDocument);
      const mappedSubjects = subjectResult.data.map((subject) => ({
        id: subject.id,
        name: subject.name,
        description: subject.description,
        iconKey: subject.icon_key as Subject['iconKey'],
        documentCount: mappedDocuments.filter((document) => document.subjectId === subject.id).length,
      }));
      setSubjects(mappedSubjects.length > 0 ? mappedSubjects : mockSubjects);

      if (!currentUser) {
        setDocuments(mappedDocuments.length > 0 ? mappedDocuments : mockDocuments);
        setUserId(null);
        setIsAuthenticated(false);
        setUser(mockUser);
        setNotifications([]);
        return;
      }

      setUserId(currentUser.id);
      setIsAuthenticated(true);
      const isRoleAdmin =
        currentUser.app_metadata?.role === 'admin' ||
        (currentUser.user_metadata as any)?.role === 'admin' ||
        currentUser.email?.toLowerCase().includes('admin');
      if (isRoleAdmin) {
        setIsAdmin(true);
      }
      const isRoleMod =
        isRoleAdmin ||
        currentUser.app_metadata?.role === 'moderator' ||
        (currentUser.user_metadata as any)?.role === 'moderator' ||
        currentUser.email?.toLowerCase().includes('mod');
      if (isRoleMod) {
        setIsModerator(true);
      }

      const [profileResult, notificationResult, favoriteResult] = await Promise.all([
        supabase.from('profiles').select('first_name,last_name,university,programme,level').eq('id', currentUser.id).maybeSingle(),
        supabase.from('app_notifications').select('id,title,message,created_at,read_at').eq('user_id', currentUser.id).order('created_at', { ascending: false }),
        supabase.from('document_favorites').select('document_id').eq('user_id', currentUser.id),
      ]);
      if (profileResult.error) throw profileResult.error;
      if (notificationResult.error) throw notificationResult.error;
      if (favoriteResult.error) throw favoriteResult.error;
      const favoriteIds = new Set(favoriteResult.data.map((favorite) => favorite.document_id));
      setDocuments((mappedDocuments.length > 0 ? mappedDocuments : mockDocuments).map((document) => ({
        ...document,
        isFavorite: favoriteIds.has(document.id),
      })));

      const profile = profileResult.data as {
        first_name: string;
        last_name: string;
        university: string;
        programme: string;
        level: string;
      } | null;
      setUser({
        firstName: profile?.first_name || mockUser.firstName,
        lastName: profile?.last_name || mockUser.lastName,
        email: currentUser.email || mockUser.email,
        university: profile?.university || mockUser.university,
        programme: profile?.programme || mockUser.programme,
        level: profile?.level || mockUser.level,
        role: isRoleAdmin ? 'admin' : isRoleMod ? 'moderator' : 'user',
        isAdmin: isRoleAdmin,
        isModerator: isRoleMod,
      });
      setNotifications(notificationResult.data.map((notification) => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        createdAt: new Date(notification.created_at).toLocaleString('fr-FR'),
        isRead: notification.read_at !== null,
      })));

      void loadReportsFromDb();
      void loadUsersFromDb();
    } catch (loadError) {
      const message = toMessage(loadError);
      console.error('Échec du chargement des données Supabase :', loadError);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [loadReportsFromDb, loadUsersFromDb]);

  const handleAuthUrl = useCallback(async (url: string) => {
    const parsedUrl = new URL(url);
    const authCode = parsedUrl.searchParams.get('code');
    if (authCode && supabase) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode);
      if (exchangeError) throw exchangeError;
      return;
    }

    const tokenString = parsedUrl.hash.slice(1) || parsedUrl.search.slice(1);
    if (!tokenString) return;
    const params = new URLSearchParams(tokenString);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (!accessToken || !refreshToken || !supabase) return;

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (sessionError) throw sessionError;
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      setIsAuthenticated(Boolean(session?.user));
      void loadData(session?.user ?? null);
    });
    const deepLinkSubscription = Platform.OS === 'web' ? null : Linking.addEventListener('url', ({ url }) => {
      void handleAuthUrl(url).catch((linkError) => {
        console.error('Échec du traitement du lien Supabase :', linkError);
        setError(toMessage(linkError));
      });
    });
    if (Platform.OS !== 'web') {
      void Linking.getInitialURL().then((url) => {
        if (url) return handleAuthUrl(url);
        return undefined;
      }).catch((linkError: unknown) => {
        console.error('Échec de la lecture du lien initial Supabase :', linkError);
        setError(toMessage(linkError));
      });
    }

    return () => {
      subscription.unsubscribe();
      deepLinkSubscription?.remove();
    };
  }, [handleAuthUrl, loadData]);

  const withError = useCallback(async <T,>(operation: () => Promise<T>): Promise<T> => {
    setError(null);
    try {
      return await operation();
    } catch (operationError) {
      const message = toMessage(operationError);
      console.error('Échec d’une opération Supabase :', operationError);
      setError(message);
      throw operationError;
    }
  }, []);

  const toggleAdminMode = useCallback(() => {
    setIsAdmin((current) => !current);
  }, []);

  const toggleModeratorMode = useCallback(() => {
    setIsModerator((current) => !current);
  }, []);

  const addModerationAction = useCallback((action: ModerationAction) => {
    setModerationHistory((current) => [action, ...current]);
  }, []);

  // Admin: Moderation functions
  const validateDocument = useCallback(async (id: string, status: ValidationStatus) => withError(async () => {
    const dbStatus = databaseValidationStatuses[status];
    const updatePayload: Record<string, unknown> = {
      validation_status: dbStatus,
    };
    if (status === 'Vérifié') {
      updatePayload.validated_at = new Date().toISOString();
      if (userId) updatePayload.validated_by = userId;
    } else if (status === 'En attente') {
      updatePayload.validated_at = null;
      updatePayload.validated_by = null;
    }

    if (supabase) {
      const client = requireSupabase();
      const { error: updateErr } = await client.from('academic_documents').update(updatePayload).eq('id', id);
      if (updateErr) throw updateErr;
    }

    setDocuments((current) =>
      current.map((doc) =>
        doc.id === id ? { ...doc, validationStatus: status } : doc
      )
    );
  }), [userId, withError]);

  const toggleDocumentAvailability = useCallback(async (id: string) => withError(async () => {
    const doc = documents.find((d) => d.id === id);
    if (!doc) return;
    const newStatus: AcademicDocument['availabilityStatus'] = doc.availabilityStatus === 'Disponible' ? 'Indisponible' : 'Disponible';
    const dbStatus = newStatus === 'Disponible' ? 'available' : 'unavailable';

    if (supabase) {
      const client = requireSupabase();
      const { error: updateErr } = await client.from('academic_documents').update({
        availability_status: dbStatus,
      }).eq('id', id);
      if (updateErr) throw updateErr;
    }

    setDocuments((current) =>
      current.map((d) => (d.id === id ? { ...d, availabilityStatus: newStatus } : d))
    );
  }), [documents, withError]);

  const deleteDocument = useCallback(async (id: string) => withError(async () => {
    if (supabase) {
      const client = requireSupabase();
      const { error: delError } = await client.from('academic_documents').delete().eq('id', id);
      if (delError) throw delError;
    }
    setDocuments((current) => current.filter((d) => d.id !== id));
  }), [withError]);

  const updateDocumentMetadata = useCallback(async (id: string, updates: Partial<AcademicDocument>) => withError(async () => {
    if (supabase) {
      const client = requireSupabase();
      const dbUpdates: Record<string, unknown> = {};
      if (updates.title) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.level) dbUpdates.level = updates.level;
      if (updates.academicYear) dbUpdates.academic_year = updates.academicYear;
      if (updates.session) dbUpdates.session = updates.session;
      if (updates.establishment) dbUpdates.establishment = updates.establishment;
      if (updates.programme) dbUpdates.programme = updates.programme;
      if (updates.subjectId) dbUpdates.subject_id = updates.subjectId;
      if (updates.type) dbUpdates.type = mapDocumentType(updates.type);

      const { error: updateErr } = await client.from('academic_documents').update(dbUpdates).eq('id', id);
      if (updateErr) throw updateErr;
    }

    setDocuments((current) =>
      current.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
  }), [withError]);

  const updateReportStatus = useCallback(async (reportId: string, status: ReportStatus) => withError(async () => {
    if (supabase) {
      const client = requireSupabase();
      const { error: reportErr } = await client.from('document_reports').update({
        status,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      }).eq('id', reportId);
      if (reportErr) throw reportErr;
    }

    setReports((current) =>
      current.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status,
              reviewedBy: userId ?? 'admin',
              reviewedAt: new Date().toLocaleDateString('fr-FR'),
            }
          : r
      )
    );
  }), [userId, withError]);

  const createSubject = useCallback(async (input: { name: string; description: string; iconKey: Subject['iconKey'] }) => withError(async () => {
    let newId = `subj-${Date.now()}`;
    if (supabase) {
      const client = requireSupabase();
      const { data, error: insertErr } = await client.from('subjects').insert({
        name: input.name.trim(),
        description: input.description.trim(),
        icon_key: input.iconKey,
      }).select('id').single();
      if (insertErr) throw insertErr;
      if (data?.id) newId = data.id;
    }

    const newSubject: Subject = {
      id: newId,
      name: input.name.trim(),
      description: input.description.trim(),
      iconKey: input.iconKey,
      documentCount: 0,
    };
    setSubjects((current) => [...current, newSubject]);
  }), [withError]);

  const updateSubject = useCallback(async (id: string, input: { name: string; description: string; iconKey: Subject['iconKey'] }) => withError(async () => {
    if (supabase) {
      const client = requireSupabase();
      const { error: updateErr } = await client.from('subjects').update({
        name: input.name.trim(),
        description: input.description.trim(),
        icon_key: input.iconKey,
      }).eq('id', id);
      if (updateErr) throw updateErr;
    }

    setSubjects((current) =>
      current.map((s) =>
        s.id === id
          ? { ...s, name: input.name.trim(), description: input.description.trim(), iconKey: input.iconKey }
          : s
      )
    );
  }), [withError]);

  const deleteSubject = useCallback(async (id: string) => withError(async () => {
    const hasDocs = documents.some((d) => d.subjectId === id);
    if (hasDocs) {
      throw new Error('Impossible de supprimer une matière contenant des documents archivés.');
    }

    if (supabase) {
      const client = requireSupabase();
      const { error: delErr } = await client.from('subjects').delete().eq('id', id);
      if (delErr) throw delErr;
    }

    setSubjects((current) => current.filter((s) => s.id !== id));
  }), [documents, withError]);

  const loadAdminUsers = useCallback(async () => {
    await loadUsersFromDb();
    return adminUsers;
  }, [adminUsers, loadUsersFromDb]);

  const sendSystemNotification = useCallback(async (input: { userId?: string; title: string; message: string; relatedDocumentId?: string }) => withError(async () => {
    if (supabase) {
      const client = requireSupabase();
      if (input.userId) {
        const { error: notifErr } = await client.from('app_notifications').insert({
          user_id: input.userId,
          title: input.title.trim(),
          message: input.message.trim(),
          related_document_id: input.relatedDocumentId || null,
        });
        if (notifErr) throw notifErr;
      } else {
        const { data: allProfiles } = await client.from('profiles').select('id');
        if (allProfiles && allProfiles.length > 0) {
          const rows = allProfiles.map((p) => ({
            user_id: p.id,
            title: input.title.trim(),
            message: input.message.trim(),
            related_document_id: input.relatedDocumentId || null,
          }));
          const { error: batchErr } = await client.from('app_notifications').insert(rows);
          if (batchErr) throw batchErr;
        }
      }
    }

    const newNotification: AppNotification = {
      id: `notif-${Date.now()}`,
      title: input.title.trim(),
      message: input.message.trim(),
      createdAt: 'À l’instant',
      isRead: false,
      relatedDocumentId: input.relatedDocumentId,
    };
    setNotifications((current) => [newNotification, ...current]);
  }), [withError]);

  const refreshAdminData = useCallback(async () => {
    await Promise.all([loadReportsFromDb(), loadUsersFromDb()]);
  }, [loadReportsFromDb, loadUsersFromDb]);

  // Auth & General functions
  const signIn = useCallback((email: string, password: string) => withError(async () => {
    const client = requireSupabase();
    const { error: signInError } = await client.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) throw signInError;
  }), [withError]);

  const signUp = useCallback((input: SignUpInput) => withError(async () => {
    const client = requireSupabase();
    const { data, error: signUpError } = await client.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: {
        data: { first_name: input.firstName.trim(), last_name: input.lastName.trim() },
        emailRedirectTo: 'archivageexamen://auth/callback',
      },
    });
    if (signUpError) throw signUpError;
    if (data.session && data.user) {
      const { error: profileError } = await client.from('profiles').update({
        first_name: input.firstName.trim(),
        last_name: input.lastName.trim(),
      }).eq('id', data.user.id);
      if (profileError) throw profileError;
    }
    return !data.session;
  }), [withError]);

  const resetPassword = useCallback((email: string) => withError(async () => {
    const client = requireSupabase();
    const { error: resetError } = await client.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'archivageexamen://auth/reset-password',
    });
    if (resetError) throw resetError;
  }), [withError]);

  const updatePassword = useCallback((password: string) => withError(async () => {
    const client = requireSupabase();
    const { error: passwordError } = await client.auth.updateUser({ password });
    if (passwordError) throw passwordError;
  }), [withError]);

  const logout = useCallback(() => withError(async () => {
    if (supabase) {
      const client = requireSupabase();
      const { error: signOutError } = await client.auth.signOut();
      if (signOutError) throw signOutError;
    }
    setUser(emptyUser);
    setIsAuthenticated(false);
    setUserId(null);
  }), [withError]);

  const updateUser = useCallback((updatedUser: AppUser) => withError(async () => {
    const client = requireSupabase();
    if (!userId) throw new Error('Vous devez être connecté pour modifier votre profil.');

    if (updatedUser.email.trim() !== user.email) {
      const { error: emailError } = await client.auth.updateUser({ email: updatedUser.email.trim() });
      if (emailError) throw emailError;
    }

    const { error: profileError } = await client.from('profiles').update({
      first_name: updatedUser.firstName.trim(),
      last_name: updatedUser.lastName.trim(),
      university: updatedUser.university.trim(),
      programme: updatedUser.programme.trim(),
      level: updatedUser.level.trim(),
    }).eq('id', userId);
    if (profileError) throw profileError;
    setUser(updatedUser);
  }), [userId, user.email, withError]);

  const toggleFavorite = useCallback((id: string) => withError(async () => {
    if (!userId && supabase) throw new Error('Connectez-vous pour enregistrer des favoris.');
    const currentDocument = documents.find((document) => document.id === id);
    if (!currentDocument) throw new Error('Document introuvable.');

    if (supabase && userId) {
      const client = requireSupabase();
      const query = currentDocument.isFavorite
        ? client.from('document_favorites').delete().eq('user_id', userId).eq('document_id', id)
        : client.from('document_favorites').insert({ user_id: userId, document_id: id });
      const { error: favoriteError } = await query;
      if (favoriteError) throw favoriteError;
    }

    setDocuments((current) => current.map((document) => document.id === id
      ? { ...document, isFavorite: !document.isFavorite }
      : document));
  }), [documents, userId, withError]);

  const markNotificationRead = useCallback((id: string) => withError(async () => {
    if (supabase && userId) {
      const client = requireSupabase();
      const { error: updateError } = await client.from('app_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId);
      if (updateError) throw updateError;
    }
    setNotifications((current) => current.map((notification) => notification.id === id
      ? { ...notification, isRead: true }
      : notification));
  }), [userId, withError]);

  const markAllNotificationsRead = useCallback(() => withError(async () => {
    if (supabase && userId) {
      const client = requireSupabase();
      const { error: updateError } = await client.from('app_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null);
      if (updateError) throw updateError;
    }
    setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
  }), [userId, withError]);

  const uploadDocument = useCallback((input: UploadDocumentInput) => withError(async () => {
    const client = requireSupabase();
    if (!userId) throw new Error('Connectez-vous pour déposer un document.');
    const subject = subjects.find((item) => item.id === input.subjectId);
    if (!subject) throw new Error('Sélectionnez une matière valide.');

    const safeFileName = input.file.name.replace(/[^\w.-]/g, '_');
    const filePath = `${userId}/${Date.now()}-${safeFileName}`;
    const fileResponse = await fetch(input.file.uri);
    if (!fileResponse.ok) throw new Error('Impossible de lire le fichier sélectionné.');
    const fileBody = await fileResponse.arrayBuffer();
    const fileSize = input.file.size ?? fileBody.byteLength;
    if (fileSize <= 0 || fileSize > 10 * 1024 * 1024) {
      throw new Error('Le fichier doit peser plus de 0 et au maximum 10 Mo.');
    }
    const contentType = input.file.mimeType ?? 'application/octet-stream';

    const { error: storageError } = await client.storage.from('academic-documents')
      .upload(filePath, fileBody, { contentType, upsert: false });
    if (storageError) throw storageError;

    const { error: documentError } = await client.from('academic_documents').insert({
      title: input.title.trim(),
      description: input.description.trim(),
      file_name: input.file.name,
      file_path: filePath,
      mime_type: contentType,
      file_size_bytes: fileSize,
      subject_id: subject.id,
      level: input.level.trim(),
      academic_year: input.academicYear.trim(),
      session: input.session,
      establishment: input.establishment.trim(),
      programme: input.programme.trim(),
      contributor_id: userId,
      contributor_display_name: `${user.firstName} ${user.lastName}`.trim() || user.email,
      type: mapDocumentType(input.type),
      validation_status: 'pending',
    });
    if (documentError) {
      const { error: cleanupError } = await client.storage.from('academic-documents').remove([filePath]);
      if (cleanupError) {
        console.error('Échec de suppression du fichier après échec du dépôt :', cleanupError);
      }
      throw documentError;
    }
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw sessionError;
    await loadData(sessionData.session?.user ?? null);
  }), [loadData, subjects, user, userId, withError]);

  const submitReport = useCallback((documentId: string, reason: string, comment: string) => withError(async () => {
    if (supabase && userId) {
      const client = requireSupabase();
      const { error: reportError } = await client.from('document_reports').insert({
        document_id: documentId,
        reporter_id: userId,
        reason: mapReportReason(reason),
        comment: comment.trim(),
      });
      if (reportError) throw reportError;
    }

    const doc = documents.find((d) => d.id === documentId);
    const newRep: DocumentReport = {
      id: `rep-${Date.now()}`,
      documentId,
      documentTitle: doc?.title ?? 'Document',
      documentSubject: doc?.subjectName,
      reporterId: userId ?? 'local-user',
      reporterName: `${user.firstName} ${user.lastName}`.trim() || 'Étudiant',
      reason: mapReportReason(reason),
      reasonLabel: reason,
      comment: comment.trim(),
      status: 'open',
      createdAt: 'À l’instant',
    };
    setReports((current) => [newRep, ...current]);
  }), [documents, user, userId, withError]);

  const getDocumentUrl = useCallback((documentId: string, trackDownload = true) => withError(async () => {
    if (!supabase) {
      return 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    }
    const client = requireSupabase();
    const { data: document, error: documentError } = await client.from('academic_documents')
      .select('file_path')
      .eq('id', documentId)
      .single();
    if (documentError) throw documentError;

    const { data, error: urlError } = await client.storage.from('academic-documents')
      .createSignedUrl(document.file_path, 60 * 10);
    if (urlError) throw urlError;

    if (userId && trackDownload) {
      const { error: downloadError } = await client.from('download_events').insert({
        document_id: documentId,
        user_id: userId,
      });
      if (downloadError) throw downloadError;
      setDocuments((current) => current.map((item) => item.id === documentId
        ? { ...item, downloadCount: item.downloadCount + 1 }
        : item));
    }
    return data.signedUrl;
  }), [userId, withError]);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    const { data: sessionData } = await supabase.auth.getSession();
    await loadData(sessionData.session?.user ?? null);
  }, [loadData]);

  const value = useMemo<AppStore>(() => ({
    documents,
    subjects,
    favorites: documents.filter((document) => document.isFavorite),
    notifications,
    user,
    isAuthenticated,
    isConfigured: isSupabaseConfigured,
    isLoading,
    error,
    isAdmin,
    setIsAdmin,
    toggleAdminMode,
    isModerator,
    toggleModeratorMode,
    moderationHistory,
    addModerationAction,
    reports,
    adminUsers,
    adminStats,
    validateDocument,
    toggleDocumentAvailability,
    deleteDocument,
    updateDocumentMetadata,
    updateReportStatus,
    createSubject,
    updateSubject,
    deleteSubject,
    loadAdminUsers,
    sendSystemNotification,
    refreshAdminData,
    signIn,
    signUp,
    resetPassword,
    updatePassword,
    logout,
    updateUser,
    toggleFavorite,
    markNotificationRead,
    markAllNotificationsRead,
    uploadDocument,
    submitReport,
    getDocumentUrl,
    refresh,
  }), [
    documents, subjects, notifications, user, isAuthenticated, isLoading, error,
    isAdmin, toggleAdminMode, isModerator, toggleModeratorMode, moderationHistory, addModerationAction,
    reports, adminUsers, adminStats, validateDocument,
    toggleDocumentAvailability, deleteDocument, updateDocumentMetadata, updateReportStatus,
    createSubject, updateSubject, deleteSubject, loadAdminUsers, sendSystemNotification,
    refreshAdminData, signIn, signUp, resetPassword, updatePassword, logout, updateUser,
    toggleFavorite, markNotificationRead, markAllNotificationsRead, uploadDocument,
    submitReport, getDocumentUrl, refresh,
  ]);

  return (
    <AppStoreContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
        {error ? (
          <View
            accessibilityRole="alert"
            style={{
              position: 'absolute',
              left: 16,
              right: 16,
              bottom: 20,
              padding: 14,
              borderRadius: 12,
              backgroundColor: '#B42318',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              zIndex: 999,
            }}>
            <Text style={{ color: '#fff', flex: 1 }}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={() => setError(null)}>
              <Text style={{ color: '#fff', fontWeight: '800' }}>Fermer</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </AppStoreContext.Provider>
  );
}

export function useAppStore() {
  const store = useContext(AppStoreContext);
  if (!store) throw new Error('useAppStore must be used inside AppStoreProvider');
  return store;
}
