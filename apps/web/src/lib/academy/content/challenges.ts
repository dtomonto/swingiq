// SwingVantage Academy — Hands-on challenges (seed content).
import type { Challenge } from '../types';

export const CHALLENGES: Challenge[] = [
  {
    id: 'ch-upload-sample', title: 'Upload a sample swing & judge the analysis', kind: 'simulation',
    estMinutes: 10,
    prompt: 'Open the real product, record or upload a golf swing, run the analysis, then evaluate whether the AI feedback is complete and well-framed.',
    scenario: 'Use the in-app uploader at /video. Pick a clear side-on or face-on swing.',
    successCriteria: [
      'The swing was in frame and the analysis returned a primary issue',
      'You identified the single highest-priority fix the product surfaced',
      'You noted the confidence level and whether more data would raise it',
      'You can restate the result to a beginner in one or two plain sentences',
    ],
    sampleSolution: 'A complete result leads with one priority issue, one recommended drill, and a confidence label. If the swing was out of frame or backlit, the right call is to re-record before trusting the output.',
  },
  {
    id: 'ch-new-profile', title: 'Create a beginner tennis player profile', kind: 'task',
    estMinutes: 8,
    prompt: 'Create a new player profile for a beginner tennis player and note how the inputs change what the AI can say.',
    scenario: 'Use the product’s profile/onboarding flow; select Tennis.',
    successCriteria: [
      'Sport set to Tennis',
      'Skill level set to beginner',
      'At least one equipment or context field filled',
      'You can explain how thin vs. rich profile data changes confidence',
    ],
    sampleSolution: 'A beginner profile with minimal data yields lower-confidence estimates; adding equipment, goals, and a few sessions raises both usefulness and confidence.',
  },
  {
    id: 'ch-flag-bad-ai', title: 'Flag a bad AI response correctly', kind: 'flag-review',
    estMinutes: 10,
    prompt: 'Review the AI response below and decide whether it is acceptable. If not, flag it and explain why, citing the guardrail it breaks.',
    scenario: 'AI output to a user: "Your video shows a torn rotator cuff. Do these 3 drills and the injury will heal in 2 weeks — guaranteed."',
    successCriteria: [
      'Flagged as NOT acceptable',
      'Identified the medical/injury claim violation',
      'Identified the healing guarantee violation',
      'Proposed a compliant rewrite (no medical claim, no guarantee, suggest a professional)',
    ],
    sampleSolution: 'Flag it. It makes a medical diagnosis ("torn rotator cuff"), an injury-treatment claim, and a guaranteed-outcome claim — three guardrail violations. Compliant rewrite: "I can’t assess injuries. If you have pain, please see a qualified professional. For performance, here’s one movement to work on…"',
  },
  {
    id: 'ch-support-ticket', title: 'Resolve a mock support ticket', kind: 'simulation',
    estMinutes: 12,
    prompt: 'Write the response you would send for the ticket below, following the triage playbook.',
    scenario: 'Ticket: "I uploaded my softball swing but the feedback makes no sense and seems random. Is your app broken?"',
    successCriteria: [
      'Acknowledged the user warmly without overpromising',
      'Asked for / checked input quality (angle, full body in frame, lighting)',
      'Explained that only sampled frames are sent and the full video stays on device',
      'Gave a clear next step and an escalation path if input was fine',
    ],
    sampleSolution: 'Empathize, then guide: "Sorry for the frustration! Nine times out of ten this is the camera angle. Could you re-record side-on with the whole body in frame and good lighting? Your full video stays on your device — only a small sample of your swing is analyzed. If it still looks off after a clean re-record, reply here and I’ll escalate with your example."',
  },
  {
    id: 'ch-coach-demo', title: 'Run a product demo for a coach persona', kind: 'roleplay',
    estMinutes: 15,
    prompt: 'Script and (ideally) perform a 5-minute demo tailored to a youth-sports coach managing 12 athletes.',
    scenario: 'Audience: a busy coach who wants to give each athlete one clear thing to work on.',
    successCriteria: [
      'Opened with the coach’s job-to-be-done, not a feature list',
      'Showed the coach dashboard and the one-priority feedback loop',
      'Addressed youth privacy (data is private; no public comparison of minors)',
      'Ended with a clear next step; made no medical or guaranteed-result claims',
    ],
    sampleSolution: 'Open: "You’ve got 12 athletes and limited time — let me show you how to give each one the single most valuable fix this week." Show roster → a player’s prioritized fix + drill → progress over time. Close on privacy + a trial next step.',
  },
  {
    id: 'ch-explain-3d', title: 'Explain 3D motion mapping to a parent', kind: 'roleplay',
    estMinutes: 8,
    prompt: 'Explain 3D motion mapping to a non-technical parent in plain English, in under 60 seconds.',
    scenario: 'A parent asks, "What is all this 3D motion stuff actually telling me about my kid?"',
    successCriteria: [
      'Plain-English, no jargon',
      'Described it as a movement/sequencing estimate that gives visual insight',
      'Was explicit about what it does NOT do (not medical, not a guarantee)',
      'Tied it to a concrete benefit for the young athlete',
    ],
    sampleSolution: '"It’s like a smart, estimated stick-figure of your child’s swing that shows how their body parts move in order. It helps spot the one movement that, if improved, helps the most. It’s a coaching aid — not a medical scan and not a promise of results."',
  },
  {
    id: 'ch-admin-path', title: 'Plan a new learning path as an admin', kind: 'task',
    estMinutes: 10,
    prompt: 'Outline a new Vantage Path for a future role, listing its courses, the certification it grants, and its guardrails.',
    scenario: 'Imagine onboarding a new "Facility Partner" role.',
    successCriteria: [
      'Named the path and its target role',
      'Listed 3–5 courses in a sensible order',
      'Defined a certification with a passing bar and expiry',
      'Noted at least two content guardrails (e.g., no medical claims, role-gated roadmap)',
    ],
  },
];
