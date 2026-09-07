import { ConnectionRequest, UserProfile } from '@/types';
import { mockResearchers } from './researchers';

export const mockConnectionRequests: ConnectionRequest[] = [
  {
    id: 'req-001',
    senderId: 'res-mou-002',
    receiverId: 'user-anik-001',
    sender: mockResearchers[0],
    status: 'pending',
    createdAt: '10m ago',
  },
  {
    id: 'req-002',
    senderId: 'res-sarah-004',
    receiverId: 'user-anik-001',
    sender: mockResearchers[2],
    status: 'pending',
    createdAt: '1d ago',
  },
];

export const mockConnectedResearchers: UserProfile[] = [
  mockResearchers[4], // Nadia Ali
];
