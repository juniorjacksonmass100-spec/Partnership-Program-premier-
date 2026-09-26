export type UserRole = 'partner' | 'admin';

export type PartnerCategory = 
  | 'Mshirika wa Dhahabu' 
  | 'Mshirika wa Fedha' 
  | 'Mshirika wa Shaba' 
  | 'Mshirika Mkuu' 
  | 'Mshirika wa Kawaida';

export type PledgeStatus = 'active' | 'completed' | 'cancelled';

export type PaymentMethod = 
  | 'M-Pesa' 
  | 'Tigo Pesa' 
  | 'Airtel Money' 
  | 'Benki (NMB / CRDB)' 
  | 'Taslimu (Cash)';

export type PledgeCategory = 
  | 'Ujenzi wa Hekalu la Ibada'
  | 'Uinjilisti & Misheni za Vijijini'
  | 'Vyombo vya Muziki na Sauti'
  | 'Huduma ya Jamii & Yatima'
  | 'Sadaka ya Ushirika wa Kila Mwezi'
  | 'Gari la Huduma / Usafiri'
  | 'Sadaka Maalum ya Shukrani'
  | 'Mengineyo';

export type ExpenseCategory = 
  | 'Uendeshaji wa Huduma'
  | 'Uinjilisti & Safari za Misheni'
  | 'Vifaa vya Sauti & Muziki'
  | 'Misaada ya Kijamii & Yatima'
  | 'Ujenzi & Ukarabati wa Kanisa'
  | 'Maji, Umeme & Pango'
  | 'Semina & Mikutano ya Injili'
  | 'Gharama za Utawala'
  | 'Mengineyo';

export interface Profile {
  id: string;
  full_name: string;
  phone_number?: string | null;
  fellowship_center?: string | null;
  partner_category?: PartnerCategory | string | null;
  role: UserRole;
  created_at: string;
  updated_at?: string;
  email?: string;
}

export interface Pledge {
  id: string;
  user_id: string;
  pledge_number: string;
  title: string;
  category?: string;
  target_amount: number;
  pledge_date: string;
  due_date: string;
  status: PledgeStatus;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
  // Joins & computed
  profiles?: Profile;
  total_paid?: number;
  remaining_amount?: number;
}

export interface Contribution {
  id: string;
  user_id: string;
  pledge_id?: string | null;
  receipt_number: string;
  amount: number;
  payment_method: PaymentMethod | string;
  transaction_reference?: string | null;
  contribution_date: string;
  category: string;
  notes?: string | null;
  recorded_by?: string | null;
  created_at: string;
  // Joins
  profiles?: Profile;
  pledges?: Pledge;
}

export interface Expense {
  id: string;
  expense_number: string;
  title: string;
  category: ExpenseCategory | string;
  amount: number;
  expense_date: string;
  receipt_ref?: string | null;
  description?: string | null;
  created_by?: string | null;
  created_at: string;
  profiles?: Profile;
}

export type TimeFilter = 'all' | 'week' | 'month' | 'year';

export interface DashboardStats {
  totalPartners: number;
  totalPledged: number;
  totalContributed: number;
  totalExpenses: number;
  netTreasury: number;
  activePledgesCount: number;
  completedPledgesCount: number;
}

export interface MinistryNews {
  id: string;
  title: string;
  content: string;
  category?: string;
  is_urgent?: boolean;
  is_active: boolean;
  created_at: string;
  created_by?: string | null;
}

export interface Testimonial {
  id: string;
  user_id: string;
  author_name: string;
  fellowship_center?: string | null;
  title: string;
  content: string;
  category?: string;
  is_approved: boolean;
  created_at: string;
}

