'use client';

import { useState, useRef } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';
import { Upload, X, Search, ExternalLink, Info, ChevronRight, Video } from 'lucide-react';
import { useSwingVantageStore } from '@/store';
import { isPlaceholderVideo, buildAthleteYouTubeSearchUrl, getSportConfig } from '@swingiq/core';
import type { ProfessionalSwingReference } from '@swingiq/core';

// ──────────────────────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────────────────────

interface SwingComparisonProps {
  selectedReference: ProfessionalSwingReference | null;
  onClearReference: () => void;
  onBrowseReferences: () => void;
}

// ──────────────────────────────────────────────────────────────
// Phase checklist (from sport config)
// ──────────────────────────────────────────────────────────────

function PhaseChecklist({ sportId }: { sportId: string }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  if (sportId === 'golf') {
    // Golf phases live in a separate module — provide a generic checklist
    const golfPhases = [
      'Setup & Address',
      'Takeaway',
      'Backswing',
      'Top of Swing',
      'Downswing',
      'Impact',
      'Follow-Through',
      'Finish',
    ];

    return (
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Golf Swing Phases — Visual Checklist
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {golfPhases.map((phase) => (
            <label key={phase} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!checked[phase]}
                onChange={() => setChecked((prev) => ({ ...prev, [phase]: !prev[phase] }))}
                className="accent-green-600"
              />
              <span className="text-xs text-foreground">{phase}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  const config = getSportConfig(sportId as Parameters<typeof getSportConfig>[0]);
  if (!config) return null;

  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        {config.name} Phases — Visual Checklist
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {config.phase_sequence.map((phaseKey) => {
          const phase = config.phases[phaseKey];
          const label = phase?.short_label ?? phaseKey;
          return (
            <label key={phaseKey} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!checked[phaseKey]}
                onChange={() => setChecked((prev) => ({ ...prev, [phaseKey]: !prev[phaseKey] }))}
                className="accent-green-600"
              />
              <span className="text-xs text-foreground">{label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Left panel: user's swing
// ──────────────────────────────────────────────────────────────

function UserSwingPanel() {
  const { video_analyses } = useSwingVantageStore();
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>('');
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);
  const [localVideoName, setLocalVideoName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('video/')) return;
    const url = URL.createObjectURL(file);
    // URL.createObjectURL always returns a blob: URL; this guard satisfies
    // static analysis tools that track user-controlled URLs to DOM sinks.
    if (!url.startsWith('blob:')) return;
    setLocalVideoUrl(url);
    setLocalVideoName(file.name);
    setSelectedAnalysisId('');
    track(ANALYTICS_EVENTS.VIDEO_UPLOAD_STARTED, { context: 'swing_comparison' });
  };

  const handleClear = () => {
    if (localVideoUrl) URL.revokeObjectURL(localVideoUrl);
    setLocalVideoUrl(null);
    setLocalVideoName(null);
    setSelectedAnalysisId('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Your Swing</CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">
        {/* Select from past analyses */}
        {video_analyses.length > 0 && (
          <div>
            <label htmlFor="compare-saved-analysis" className="block text-xs font-medium text-muted-foreground mb-1">
              Select from saved analyses
            </label>
            <select
              id="compare-saved-analysis"
              value={selectedAnalysisId}
              onChange={(e) => {
                setSelectedAnalysisId(e.target.value);
                if (e.target.value) {
                  if (localVideoUrl) URL.revokeObjectURL(localVideoUrl);
                  setLocalVideoUrl(null);
                  setLocalVideoName(null);
                }
              }}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card focus:ring-2 focus:ring-ring outline-hidden"
            >
              <option value="">— choose a saved analysis —</option>
              {video_analyses.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.file_name} · {new Date(v.created_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Or upload a new video */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            {video_analyses.length > 0 ? 'Or upload a video' : 'Upload your swing video'}
          </label>
          <div
            className={cn(
              'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
              localVideoUrl
                ? 'border-primary/40 bg-primary/10'
                : 'border-border hover:border-accent-secondary/50 hover:bg-accent-secondary/10',
            )}
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
            role="button"
            tabIndex={0}
          >
            {localVideoUrl ? (
              <div className="space-y-2">
                <Video size={28} className="mx-auto text-primary" />
                <p className="text-sm font-medium text-primary">{localVideoName}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); handleClear(); }}
                >
                  <X size={14} /> Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload size={28} className="mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload <span className="font-medium">your swing video</span>
                </p>
                <p className="text-xs text-muted-foreground">MP4, MOV, AVI, or WEBM</p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Video player */}
        {localVideoUrl && (
          <div className="aspect-video bg-black rounded-xl overflow-hidden">
            <video
              src={localVideoUrl}
              controls
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {/* Selected analysis info */}
        {selectedAnalysisId && (() => {
          const analysis = video_analyses.find((v) => v.id === selectedAnalysisId);
          if (!analysis) return null;
          return (
            <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
              <p className="font-medium text-foreground">{analysis.file_name}</p>
              <p className="text-xs text-muted-foreground">
                Sport: {analysis.sport} &middot; Angle: {analysis.camera_angle} &middot;
                Score: {analysis.overall_score}
              </p>
              {analysis.primary_issue && (
                <Badge variant="warning">{analysis.primary_issue}</Badge>
              )}
              <p className="text-xs text-muted-foreground italic mt-1">
                Note: Video playback is not available for saved analyses. Upload the original file above for side-by-side viewing.
              </p>
            </div>
          );
        })()}
      </CardBody>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────────
// Right panel: professional reference
// ──────────────────────────────────────────────────────────────

function ProfessionalReferencePanel({
  reference,
  onClear,
  onBrowse,
}: {
  reference: ProfessionalSwingReference | null;
  onClear: () => void;
  onBrowse: () => void;
}) {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  if (!reference) {
    return (
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Professional Reference</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col items-center justify-center min-h-[280px] text-center gap-4">
          <div className="space-y-2">
            <Search size={36} className="mx-auto text-muted-foreground" />
            <p className="font-medium text-muted-foreground">No reference selected</p>
            <p className="text-sm text-muted-foreground">
              Browse the professional library and select an athlete to compare against.
            </p>
          </div>
          <Button onClick={onBrowse}>
            Browse References <ChevronRight size={16} />
          </Button>
        </CardBody>
      </Card>
    );
  }

  const activeVideo = reference.referenceVideos[activeVideoIndex];
  const isPlaceholder = activeVideo ? isPlaceholderVideo(activeVideo) : true;
  const rawSearchUrl = activeVideo
    ? buildAthleteYouTubeSearchUrl(reference.athleteName, activeVideo.movementType)
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(reference.athleteName)}`;
  const searchUrl = rawSearchUrl.startsWith('https://www.youtube.com/') ? rawSearchUrl : '#';

  return (
    <Card className="flex-1">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>{reference.athleteName}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">
              {reference.sport.replace(/_/g, ' ')} &middot; {reference.sex}
            </p>
          </div>
          <button
            onClick={onClear}
            className="p-1 rounded-sm hover:bg-muted text-muted-foreground"
            aria-label="Clear reference"
          >
            <X size={16} />
          </button>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        {/* Video selector tabs */}
        {reference.referenceVideos.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {reference.referenceVideos.map((v, i) => (
              <button
                key={v.id}
                onClick={() => setActiveVideoIndex(i)}
                className={cn(
                  'text-xs px-2.5 py-1 rounded-full border transition-colors',
                  i === activeVideoIndex
                    ? 'border-accent-secondary bg-accent-secondary/10 text-accent-secondary'
                    : 'border-border text-muted-foreground hover:bg-muted',
                )}
              >
                {v.movementType.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        )}

        {/* Video area */}
        {activeVideo && (
          <>
            {isPlaceholder ? (
              <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-warning">
                  Video Pending Admin Verification
                </p>
                <p className="text-sm text-warning">
                  Search for{' '}
                  <span className="font-semibold">
                    {reference.athleteName} {activeVideo.movementType.replace(/_/g, ' ')}
                  </span>{' '}
                  on YouTube while the admin verifies video sources.
                </p>
                <a
                  href={searchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-warning underline hover:text-foreground"
                >
                  <Search size={14} />
                  Search on YouTube
                  <ExternalLink size={12} />
                </a>
              </div>
            ) : (
              <div className="aspect-video bg-black rounded-xl overflow-hidden">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${activeVideo.youtubeVideoId}`}
                  title={activeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
            )}
          </>
        )}

        {/* Bio */}
        <p className="text-sm text-muted-foreground">{reference.bio}</p>

        {/* Style tags */}
        <div className="flex flex-wrap gap-1.5">
          {reference.styleTags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full"
            >
              {tag.replace(/_/g, ' ')}
            </span>
          ))}
        </div>

        {/* Change reference */}
        <Button variant="outline" size="sm" className="w-full" onClick={onBrowse}>
          Change Reference
        </Button>
      </CardBody>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────────
// Main SwingComparison component
// ──────────────────────────────────────────────────────────────

export function SwingComparison({
  selectedReference,
  onClearReference,
  onBrowseReferences,
}: SwingComparisonProps) {
  const sportId = selectedReference?.sport ?? 'golf';

  // Fire analytics when a reference is first selected
  const prevRef = useRef<string | null>(null);
  if (selectedReference && selectedReference.id !== prevRef.current) {
    prevRef.current = selectedReference.id;
    track(ANALYTICS_EVENTS.SWING_COMPARISON_STARTED, {
      athlete: selectedReference.athleteName,
      sport: selectedReference.sport,
    });
  }

  return (
    <div className="space-y-6">
      {/* Limitation notice */}
      <div className="flex items-start gap-3 bg-accent-secondary/10 border border-accent-secondary/25 rounded-xl p-4">
        <Info size={18} className="text-accent-secondary shrink-0 mt-0.5" />
        <p className="text-sm text-accent-secondary">
          <span className="font-semibold">Visual comparison only.</span> This tool lets you watch your swing and a professional reference side by side. SwingVantage has not analyzed the professional video frames — AI analysis applies only to videos you upload.
        </p>
      </div>

      {/* Side-by-side panels */}
      <div className="flex flex-col lg:flex-row gap-4">
        <UserSwingPanel />
        <ProfessionalReferencePanel
          reference={selectedReference}
          onClear={onClearReference}
          onBrowse={onBrowseReferences}
        />
      </div>

      {/* Phase checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Phase-by-Phase Checklist</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-xs text-muted-foreground mb-3">
            Use this checklist to visually compare phases while watching both videos.
          </p>
          <PhaseChecklist sportId={sportId} />
        </CardBody>
      </Card>
    </div>
  );
}
