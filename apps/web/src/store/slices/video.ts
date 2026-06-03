import type { SwingIQSlice, SwingIQStore, LocalVideoAnalysis } from '../types';
import { newId } from '../types';

export const createVideoSlice: SwingIQSlice<
  Pick<SwingIQStore, 'video_analyses' | 'addVideoAnalysis'>
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
