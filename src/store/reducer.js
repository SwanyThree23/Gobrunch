export function reducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, auth: action.payload };

    case 'LOGOUT':
      return { ...state, auth: null };

    case 'READ_NOTIF':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.id ? { ...n, read: true } : n
        ),
      };

    case 'READ_ALL_NOTIFS':
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, read: true })),
      };

    case 'SEND_DM':
      return {
        ...state,
        dms: state.dms.map(d =>
          d.id === action.dmId
            ? {
                ...d,
                lastMsg: action.text,
                time: 'now',
                unread: 0,
                messages: [
                  ...d.messages,
                  {
                    id: Date.now(),
                    me: true,
                    text: action.text,
                    t: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  },
                ],
              }
            : d
        ),
      };

    case 'MARK_DM_READ':
      return {
        ...state,
        dms: state.dms.map(d => (d.id === action.id ? { ...d, unread: 0 } : d)),
      };

    case 'ADD_SCHEDULE':
      return {
        ...state,
        user: {
          ...state.user,
          schedule: [...state.user.schedule, action.item],
        },
      };

    case 'REMOVE_SCHEDULE':
      return {
        ...state,
        user: {
          ...state.user,
          schedule: state.user.schedule.filter(s => s.id !== action.id),
        },
      };

    case 'EARN_TIP':
      return {
        ...state,
        user: { ...state.user, earned: state.user.earned + action.amount },
        earnings: [
          {
            id: 'e' + Date.now(),
            type: 'tip',
            label: action.label || 'Tip received',
            amount: action.amount,
            via: action.via || 'Direct',
            from: action.from || 'Viewer',
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            color: '#00e676',
          },
          ...state.earnings,
        ],
      };

    case 'CONNECT_PAYMENT':
      return {
        ...state,
        user: {
          ...state.user,
          payments: { ...state.user.payments, [action.paymentId]: true },
        },
      };

    case 'SET_AI_KEY':
      return {
        ...state,
        aiChat: { ...state.aiChat, apiKey: action.key },
      };

    case 'SET_AI_MODEL':
      return {
        ...state,
        aiChat: { ...state.aiChat, model: action.model },
      };

    case 'SET_AI_PERSONA':
      return {
        ...state,
        aiChat: { ...state.aiChat, persona: action.persona },
      };

    case 'SET_CUSTOM_SYSTEM':
      return {
        ...state,
        aiChat: { ...state.aiChat, customSystem: action.system },
      };

    case 'AI_SEND_MSG':
      return {
        ...state,
        aiChat: {
          ...state.aiChat,
          messages: [
            ...state.aiChat.messages,
            { id: Date.now(), role: 'user', content: action.content },
          ],
          streaming: true,
        },
      };

    case 'AI_START_RESPONSE':
      return {
        ...state,
        aiChat: {
          ...state.aiChat,
          messages: [
            ...state.aiChat.messages,
            { id: action.id, role: 'assistant', content: '' },
          ],
        },
      };

    case 'AI_APPEND_RESPONSE':
      return {
        ...state,
        aiChat: {
          ...state.aiChat,
          messages: state.aiChat.messages.map(m =>
            m.id === action.id ? { ...m, content: m.content + action.chunk } : m
          ),
        },
      };

    case 'AI_DONE':
      return {
        ...state,
        aiChat: {
          ...state.aiChat,
          streaming: false,
          tokenUsage: {
            prompt: state.aiChat.tokenUsage.prompt + (action.promptTokens || 0),
            completion: state.aiChat.tokenUsage.completion + (action.completionTokens || 0),
            total: state.aiChat.tokenUsage.total + (action.promptTokens || 0) + (action.completionTokens || 0),
          },
        },
      };

    case 'AI_CLEAR':
      return {
        ...state,
        aiChat: {
          ...state.aiChat,
          messages: [],
          tokenUsage: { prompt: 0, completion: 0, total: 0 },
        },
      };

    case 'SET_AUTOSCALE':
      return {
        ...state,
        infrastructure: {
          ...state.infrastructure,
          autoScale: { ...state.infrastructure.autoScale, ...action.config },
        },
      };

    default:
      return state;
  }
}

export default reducer;
