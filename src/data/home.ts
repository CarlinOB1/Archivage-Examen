export type Subject = {
  id: string;
  name: string;
  documentCount: number;
  icon: 'network' | 'code' | 'database' | 'math' | 'book';
};

export type RecentResource = {
  id: string;
  title: string;
  subject: string;
  level: string;
  year: string;
  type: 'Examen' | 'Corrigé' | 'Devoir' | 'Cours';
  downloads: number;
};

export const popularSubjects: Subject[] = [
  { id: 'reseaux', name: 'Réseaux', documentCount: 24, icon: 'network' },
  { id: 'programmation', name: 'Programmation', documentCount: 32, icon: 'code' },
  { id: 'bases-de-donnees', name: 'Bases de données', documentCount: 18, icon: 'database' },
  { id: 'mathematiques', name: 'Mathématiques', documentCount: 16, icon: 'math' },
];

export const recentResources: RecentResource[] = [
  {
    id: 'examen-reseaux-l3-2025',
    title: 'Examen Réseaux informatiques',
    subject: 'Réseaux',
    level: 'Licence 3',
    year: '2025',
    type: 'Examen',
    downloads: 184,
  },
  {
    id: 'corrige-algorithmique-l2-2024',
    title: 'Corrigé Algorithmique',
    subject: 'Programmation',
    level: 'Licence 2',
    year: '2024',
    type: 'Corrigé',
    downloads: 126,
  },
];
