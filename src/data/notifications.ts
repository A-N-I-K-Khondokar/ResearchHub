import { AppNotification } from '@/types';
import { mockResearchers } from './researchers';

export const mockNotifications: AppNotification[] = [
  {
    id: 'notif-001',
    userId: 'user-anik-001',
    type: 'connection_request',
    title: 'Connection Request',
    message: 'Mou Tusi sent you a research connection request.',
    read: false,
    createdAt: '10m ago',
    sender: mockResearchers[0],
    targetId: 'res-mou-002',
  },
  {
    id: 'notif-002',
    userId: 'user-anik-001',
    type: 'topic_activity',
    title: 'Bangla NLP Activity',
    message: 'New current work posted in Bangla NLP: "Optimizing LLMs for Low-Resource Bengali Dialects"',
    read: false,
    createdAt: '2h ago',
    targetId: 'work-001',
  },
  {
    id: 'notif-003',
    userId: 'user-anik-001',
    type: 'connection_accepted',
    title: 'Connection Accepted',
    message: 'Nadia Ali accepted your connection request.',
    read: true,
    createdAt: '1d ago',
    sender: mockResearchers[4],
    targetId: 'res-nadia-006',
  },
];
