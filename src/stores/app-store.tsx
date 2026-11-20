import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Linking, Platform, Pressable, Text, View } from 'react-native';
import type { User } from '@supabase/supabase-js';
import type * as DocumentPicker from 'expo-document-picker';
import { isSupabaseConfigured, requireSupabase, supabase } from '@/lib/supabase';
import type { AcademicDocument, AppNotification, AppUser, Subject } from '@/types/models';

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
};

const emptyUser: AppUser = {
  firstName: '',
  lastName: '',
  email: '',
  university: '',
  programme: '',
  level: '',
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

function mapReportReason(reason: string) {
  const reasons: Record<string, string> = {
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
  const [documents, setDocuments] = useState<AcademicDocument[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [user, setUser] = useState<AppUser>(emptyUser);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

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
      setSubjects(mappedSubjects);

      if (!currentUser) {
        setDocuments(mappedDocuments);
        setUserId(null);
        setIsAuthenticated(false);
        setUser(emptyUser);
        setNotifications([]);
        return;
      }

      setUserId(currentUser.id);
      setIsAuthenticated(true);
      const [profileResult, notificationResult, favoriteResult] = await Promise.all([
        supabase.from('profiles').select('first_name,last_name,university,programme,level').eq('id', currentUser.id).maybeSingle(),
        supabase.from('app_notifications').select('id,title,message,created_at,read_at').eq('user_id', currentUser.id).order('created_at', { ascending: false }),
        supabase.from('document_favorites').select('document_id').eq('user_id', currentUser.id),
      ]);
      if (profileResult.error) throw profileResult.error;
      if (notificationResult.error) throw notificationResult.error;
      if (favoriteResult.error) throw favoriteResult.error;
      const favoriteIds = new Set(favoriteResult.data.map((favorite) => favorite.document_id));
      setDocuments(mappedDocuments.map((document) => ({
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
        firstName: profile?.first_name ?? '',
        lastName: profile?.last_name ?? '',
        email: currentUser.email ?? '',
        university: profile?.university ?? '',
        programme: profile?.programme ?? '',
        level: profile?.level ?? '',
      });
      setNotifications(notificationResult.data.map((notification) => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        createdAt: new Date(notification.created_at).toLocaleString('fr-FR'),
        isRead: notification.read_at !== null,
      })));
    } catch (loadError) {
      const message = toMessage(loadError);
      console.error('Échec du chargement des données Supabase :', loadError);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    const client = requireSupabase();
    const { error: signOutError } = await client.auth.signOut();
    if (signOutError) throw signOutError;
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
    const client = requireSupabase();
    if (!userId) throw new Error('Connectez-vous pour enregistrer des favoris.');
    const currentDocument = documents.find((document) => document.id === id);
    if (!currentDocument) throw new Error('Document introuvable.');

    const query = currentDocument.isFavorite
      ? client.from('document_favorites').delete().eq('user_id', userId).eq('document_id', id)
      : client.from('document_favorites').insert({ user_id: userId, document_id: id });
    const { error: favoriteError } = await query;
    if (favoriteError) throw favoriteError;
    setDocuments((current) => current.map((document) => document.id === id
      ? { ...document, isFavorite: !document.isFavorite }
      : document));
  }), [documents, userId, withError]);

  const markNotificationRead = useCallback((id: string) => withError(async () => {
    const client = requireSupabase();
    if (!userId) throw new Error('Connectez-vous pour accéder aux notifications.');
    const { error: updateError } = await client.from('app_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);
    if (updateError) throw updateError;
    setNotifications((current) => current.map((notification) => notification.id === id
      ? { ...notification, isRead: true }
      : notification));
  }), [userId, withError]);

  const markAllNotificationsRead = useCallback(() => withError(async () => {
    const client = requireSupabase();
    if (!userId) throw new Error('Connectez-vous pour accéder aux notifications.');
    const { error: updateError } = await client.from('app_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null);
    if (updateError) throw updateError;
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
    const client = requireSupabase();
    if (!userId) throw new Error('Connectez-vous pour signaler un document.');
    const { error: reportError } = await client.from('document_reports').insert({
      document_id: documentId,
      reporter_id: userId,
      reason: mapReportReason(reason),
      comment: comment.trim(),
    });
    if (reportError) throw reportError;
  }), [userId, withError]);

  const getDocumentUrl = useCallback((documentId: string, trackDownload = true) => withError(async () => {
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
  }), [
    documents, subjects, notifications, user, isAuthenticated, isLoading, error,
    signIn, signUp, resetPassword, updatePassword, logout, updateUser, toggleFavorite,
    markNotificationRead, markAllNotificationsRead, uploadDocument, submitReport, getDocumentUrl,
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
