export type BookStatus = 'Available' | 'Ordered' | 'Issued';
export type TransactionStatus = 'Reserved' | 'Issued' | 'Returned' | 'Expired';
export type UserRole = 'student' | 'admin';

export interface Book {
  book_id: string;
  title: string;
  author: string;
  category: string;
  shelf_loc?: string;
  status: BookStatus;
  total_copies: number;
  created_at: string;
}

export interface Student {
  id: string;
  name: string;
  whatsapp_number: string;
  role: UserRole;
  created_at: string;
}

export interface Transaction {
  transaction_id: string;
  student_id: string;
  book_id: string;
  order_date: string;
  issue_date?: string;
  return_deadline?: string;
  returned_at?: string;
  reminder_sent: boolean;
  status: TransactionStatus;
  created_at: string;
  books?: Book;
  students?: Student;
}
