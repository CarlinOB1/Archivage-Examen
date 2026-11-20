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
  iconKey: 'network' | 'code' | 'database' | 'math';
  documentCount: number;
};

export type AppUser = {
  firstName: string;
  lastName: string;
  email: string;
  university: string;
  programme: string;
  level: string;
};

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
};
