import type { SwingVantageSlice, SwingVantageStore } from '../types';
import { DEFAULT_AGENT_STATE } from '../types';

export const createAgentSlice: SwingVantageSlice<
  Pick<
    SwingVantageStore,
    'agent' | 'dismissAgentInsight' | 'setWelcomeBackDismissed' | 'resetAgentDismissals'
  >
> = (set) => ({
  agent: DEFAULT_AGENT_STATE,

  dismissAgentInsight: (key) =>
    set((s) =>
      s.agent.dismissedKeys.includes(key)
        ? s
        : { agent: { ...s.agent, dismissedKeys: [...s.agent.dismissedKeys, key].slice(-100) } },
    ),
  setWelcomeBackDismissed: (hash) =>
    set((s) => ({ agent: { ...s.agent, welcomeBackDismissedHash: hash } })),
  resetAgentDismissals: () => set({ agent: DEFAULT_AGENT_STATE }),
});
