import type { SwingVantageSlice, SwingVantageStore, LocalVideoAnalysis } from '../types';
import { newId } from '../types';

export const createVideoSlice: SwingVantageSlice<
  Pick<SwingVantageStore, 'video_analyses' | 'addVideoAnalysis'>
> = (set) => ({
  video_analyses: [],

  addVideoAnalysis: (analysis) => {
    const newAnalysis: LocalVideoAnalysis = {
      ...analysis,
      id: newId('video'),
      created_at: new Date().toISOString(),
    };
    set((s) => ({ video_analyses: [newAnalysis, ...s.video_analyses] }));
  },
});
