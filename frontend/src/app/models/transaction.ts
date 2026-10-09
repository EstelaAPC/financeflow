export type TransactionType = 'Income' | 'Expense';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  type: TransactionType;
  source?: string | null;
}

export interface CreateTransactionRequest {
  description: string;
  amount: number;
  date: string;
  category: string;
  type: TransactionType;
  source?: string | null;
}
