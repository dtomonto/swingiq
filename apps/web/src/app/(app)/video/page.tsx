// ============================================================
// /video — retired route, now folded into Motion Lab
// ------------------------------------------------------------
// Motion Lab is the single, canonical swing-analysis tool: it runs the
// on-device 3D reconstruction AND the cloud AI vision review (the
// capability this page used to own) on the same clip. Old links and
// bookmarks land users in the right place via a permanent redirect.
// The former analyzer components (VideoAnalyzerContent /
// SportVideoAnalyzerContent / VideoPageRouter) are kept dormant; their
// unique AI-vision tech now lives in Motion Lab's AI Vision tab.
// ============================================================

import { permanentRedirect } from 'next/navigation';

export default function VideoPage() {
  permanentRedirect('/motion-lab');
}
