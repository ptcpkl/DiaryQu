export type AgendaStatus = 'scheduled' | 'postponed' | 'completed';

export type AgendaCategory = 'work' | 'business' | 'islamic';

export type AgendaEntry = {
  id: string;
  familyId: string;
  createdBy: string;
  title: string;
  category: AgendaCategory;
  notes: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  reminderEnabled: boolean;
  reminderAt: string | null;
  status: AgendaStatus;
  createdAt: string;
  updatedAt: string;
};

export type AgendaDraft = {
  title: string;
  category?: AgendaCategory;
  notes?: string | null;
  location?: string | null;
  startsAt: string;
  endsAt?: string | null;
  reminderEnabled: boolean;
  reminderAt?: string | null;
  status?: AgendaStatus;
};
