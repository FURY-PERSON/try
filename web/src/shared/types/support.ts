export type SupportTicket = {
  id: string;
  email: string;
  description: string;
  status: 'open' | 'closed';
  createdAt: string;
  updatedAt: string;
};
