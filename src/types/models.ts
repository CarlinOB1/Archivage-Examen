export type DocumentType = 'Examen' | 'Corrigé' | 'Devoir' | 'Cours';
export type ValidationStatus = 'En attente' | 'Vérifié' | 'Contesté' | 'Rejeté';

export type AcademicDocument = {
  id: string;
  title: string;
  description: string;
  fileName: string;
  fileType: string;
  subjectId: string;
  subjectName: string;
  level: string;
  academicYear: string;
  session: string;
  establishment: string;
  programme: string;
  contributorName: string;
  createdAt: string;
  pageCount: number;
  downloadCount: number;
  type: DocumentType;
  isFavorite: boolean;
  availabilityStatus: 'Disponible' | 'Indisponible';
  validationStatus: ValidationStatus;
};

export type Subject = {
  id: string;
  name: string;
  description: string;
  iconKey: 'network' | 'code' | 'database' | 'math' | 'book';
  documentCount: number;
};

export type AppUser = {
  firstName: string;
  lastName: string;
  email: string;
  university: string;
  programme: string;
  level: string;
  role?: 'admin' | 'moderator' | 'user';
  isAdmin?: boolean;
  isModerator?: boolean;
};

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  relatedDocumentId?: string;
  userId?: string;
};

export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

export type ReportReason =
  | 'incorrect_document'
  | 'unreadable_content'
  | 'wrong_format'
  | 'wrong_answer_key'
  | 'other';

export type DocumentReport = {
  id: string;
  documentId: string;
  documentTitle: string;
  documentSubject?: string;
  reporterId: string;
  reporterName: string;
  reason: ReportReason;
  reasonLabel: string;
  comment: string;
  status: ReportStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
};

export type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  university: string;
  programme: string;
  level: string;
  createdAt: string;
  documentCount: number;
  role: 'admin' | 'user';
};

export type AdminStats = {
  totalDocuments: number;
  pendingDocuments: number;
  verifiedDocuments: number;
  disputedDocuments: number;
  rejectedDocuments: number;
  totalReports: number;
  openReports: number;
  totalUsers: number;
  totalSubjects: number;
  totalDownloads: number;
};

export type ModerationAction = {
  id: string;
  documentId: string;
  documentTitle: string;
  moderatorName: string;
  decision: ValidationStatus;
  reason?: string;
  createdAt: string;
};

export type RejectionReason =
  | 'unreadable'
  | 'duplicate'
  | 'wrong_session_year'
  | 'wrong_subject'
  | 'personal_data'
  | 'incomplete'
  | 'other';

export type ModerationStats = {
  pendingCount: number;
  verifiedCount: number;
  rejectedCount: number;
  disputedCount: number;
  openReportsCount: number;
};


