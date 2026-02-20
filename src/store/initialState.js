import T from '../constants/colors.js';
import { AI_MODELS, AI_PERSONAS } from '../constants/data.js';

export const INITIAL_STATE = {
  auth: null,
  user: {
    id: 'u1',
    name: '@seewhy_creator',
    displayName: 'Joyce 🦋',
    initials: 'JO',
    bio: 'World Builder. Live Creator. Community First.',
    avatar: T.sig,
    followers: 2412,
    following: 186,
    earned: 1240.50,
    streams: 47,
    views: 8200,
    subscribers: 312,
    tier: 'PRO',
    payments: { paypal: false, cashapp: false, venmo: true, zelle: false, chime: false },
    schedule: [
      { id: 's1', title: 'Friday Night World Build', date: 'Feb 21', time: '8:00 PM', category: 'CULTURE', color: T.sig },
      { id: 's2', title: 'Saturday Tech Tastings', date: 'Feb 22', time: '3:00 PM', category: 'TECH', color: T.cyan },
      { id: 's3', title: 'AI Music Biz Talk', date: 'Feb 24', time: '7:00 PM', category: 'MUSIC', color: '#ff6b35' },
    ],
  },
  notifications: [
    { id: 'n1', type: 'payment', icon: '💸', msg: 'SwanyThree sent you $25 via Venmo', time: '2m ago', read: false, color: T.green },
    { id: 'n2', type: 'follow', icon: '👤', msg: 'The Domino Killa started following you', time: '8m ago', read: false, color: T.vb },
    { id: 'n3', type: 'live', icon: '🔴', msg: 'Chatter HQ went live: Beta Townhall', time: '12m ago', read: false, color: T.sig },
    { id: 'n4', type: 'payment', icon: '💸', msg: 'Obi Knowledge sent you $10 via CashApp', time: '1h ago', read: false, color: T.green },
    { id: 'n5', type: 'comment', icon: '💬', msg: "Shorty Rock: 'Amazing room! Love the energy'", time: '2h ago', read: true, color: T.vb },
    { id: 'n6', type: 'subscribe', icon: '⭐', msg: 'Earl Williams subscribed — $9.99/mo', time: '3h ago', read: true, color: T.gold },
    { id: 'n7', type: 'clip', icon: '✂️', msg: 'Your clip hit 500 views', time: '5h ago', read: true, color: T.acid },
    { id: 'n8', type: 'payment', icon: '💸', msg: 'Hansje sent you $50 via Zelle', time: '6h ago', read: true, color: T.green },
  ],
  earnings: [
    { id: 'e1', type: 'stream', label: 'Friday World Build Live', amount: 87.50, via: 'Venmo', from: 'SwanyThree', date: 'Feb 18', color: T.sig },
    { id: 'e2', type: 'subscribe', label: 'Earl Williams — Monthly Sub', amount: 9.99, via: 'PayPal', from: 'Earl Williams', date: 'Feb 18', color: T.gold },
    { id: 'e3', type: 'tip', label: 'Tech Tastings Tip', amount: 25.00, via: 'CashApp', from: 'Obi Knowledge', date: 'Feb 17', color: T.cyan },
    { id: 'e4', type: 'paywall', label: 'Masterclass Unlock', amount: 15.00, via: 'Zelle', from: 'Hansje', date: 'Feb 17', color: T.v },
    { id: 'e5', type: 'subscribe', label: 'Stacy Braiuca — Monthly Sub', amount: 9.99, via: 'Venmo', from: 'Stacy', date: 'Feb 16', color: T.gold },
    { id: 'e6', type: 'tip', label: 'Watch Party Tip', amount: 10.00, via: 'Chime', from: 'Valerio', date: 'Feb 16', color: T.green },
    { id: 'e7', type: 'stream', label: 'Domino Ent. Collab', amount: 42.00, via: 'CashApp', from: 'The Domino Killa', date: 'Feb 15', color: T.gold },
    { id: 'e8', type: 'paywall', label: 'Music Biz Talk Unlock', amount: 3.00, via: 'Venmo', from: 'Merrick', date: 'Feb 15', color: T.vb },
    { id: 'e9', type: 'tip', label: 'Late Night Chat Tip', amount: 15.00, via: 'CashApp', from: 'Claudio', date: 'Feb 14', color: T.cyan },
    { id: 'e10', type: 'stream', label: 'Saturday World Build', amount: 55.00, via: 'Venmo', from: 'Multiple', date: 'Feb 14', color: T.sig },
  ],
  subscribers: [
    { id: 'sub1', name: 'Earl Williams', initials: 'EW', color: '#1e40af', tier: '$9.99/mo', since: 'Jan 2026', active: true },
    { id: 'sub2', name: 'Stacy Braiuca', initials: 'SB', color: '#065f46', tier: '$9.99/mo', since: 'Jan 2026', active: true },
    { id: 'sub3', name: 'Valerio', initials: 'VA', color: T.muted, tier: '$4.99/mo', since: 'Feb 2026', active: true },
    { id: 'sub4', name: 'Hansje', initials: 'HA', color: '#2d5a27', tier: '$19.99/mo', since: 'Dec 2025', active: true },
    { id: 'sub5', name: 'Merrick', initials: 'ME', color: '#1e40af', tier: '$9.99/mo', since: 'Feb 2026', active: false },
    { id: 'sub6', name: 'Claudio', initials: 'CL', color: '#1e3a5f', tier: '$4.99/mo', since: 'Nov 2025', active: true },
    { id: 'sub7', name: 'Isis G.', initials: 'IG', color: '#be185d', tier: '$9.99/mo', since: 'Jan 2026', active: true },
  ],
  dms: [
    {
      id: 'dm1', with: 'SwanyThree', initials: 'SW', color: T.gold, lastMsg: 'You still on for Friday?', time: 'now', unread: 2,
      messages: [
        { id: 1, me: false, text: 'Yo what\'s good! Great stream last night 🔥', t: '8:42 PM' },
        { id: 2, me: true, text: 'Thank you! Had so much energy in the room', t: '8:44 PM' },
        { id: 3, me: false, text: 'Can we do a collab next week?', t: '8:45 PM' },
        { id: 4, me: true, text: '100% — let\'s schedule something', t: '8:47 PM' },
        { id: 5, me: false, text: 'You still on for Friday?', t: '9:02 PM' },
      ],
    },
    {
      id: 'dm2', with: 'Obi Knowledge', initials: 'OK', color: T.vb, lastMsg: 'Sent you $10 for last night!', time: '1h', unread: 1,
      messages: [
        { id: 1, me: false, text: 'Amazing AI breakdown tonight', t: '6:12 PM' },
        { id: 2, me: false, text: 'Sent you $10 for last night!', t: '6:13 PM' },
      ],
    },
    {
      id: 'dm3', with: 'Chatter HQ', initials: 'CH', color: T.acid, lastMsg: 'Can you be a guest Thursday?', time: '2h', unread: 0,
      messages: [
        { id: 1, me: false, text: 'Hey! Townhall Thursday evening', t: '4:00 PM' },
        { id: 2, me: false, text: 'Can you be a guest Thursday?', t: '4:01 PM' },
        { id: 3, me: true, text: "I'll be there! What time?", t: '4:20 PM' },
      ],
    },
    {
      id: 'dm4', with: 'The Domino Killa', initials: 'DK', color: T.muted, lastMsg: 'Sent a collab request', time: '5h', unread: 0,
      messages: [
        { id: 1, me: false, text: 'Sent a collab request', t: '11:00 AM' },
      ],
    },
  ],
  clips: [
    { id: 'c1', title: 'World Build Highlights', duration: '2:34', views: 512, color: T.sig, from: 'World Building Expo', date: 'Feb 18' },
    { id: 'c2', title: 'AI Ancient Tech Moment', duration: '1:12', views: 891, color: T.vb, from: 'Tech Tastings', date: 'Feb 17' },
    { id: 'c3', title: 'Domino Collab Best Bits', duration: '3:01', views: 234, color: T.gold, from: 'Domino Ent.', date: 'Feb 15' },
    { id: 'c4', title: 'Watch Party Reaction', duration: '0:48', views: 1204, color: T.acid, from: 'Chatter Townhall', date: 'Feb 14' },
  ],
  analytics: {
    daily: [42, 67, 31, 89, 124, 98, 156],
    weekly: [312, 445, 289, 567, 634, 712, 823],
    earningsDaily: [12, 28, 5, 47, 31, 89, 74],
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    topStreams: [
      { title: 'World Build Expo', views: 340, earned: 87.50 },
      { title: 'Tech Tastings', views: 280, earned: 42.00 },
      { title: 'AI Music Talk', views: 210, earned: 28.00 },
      { title: 'Domino Collab', views: 178, earned: 42.00 },
    ],
  },
  // AI Chat state
  aiChat: {
    messages: [],
    model: AI_MODELS[0].id,
    persona: AI_PERSONAS[0].id,
    customSystem: '',
    apiKey: '',
    tokenUsage: { prompt: 0, completion: 0, total: 0 },
    streaming: false,
  },
  // Infrastructure state
  infrastructure: {
    autoScale: { minNodes: 2, maxNodes: 20, targetCPU: 70 },
  },
};

export default INITIAL_STATE;
