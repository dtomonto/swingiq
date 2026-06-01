'use client';

import { useState, useMemo } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';
import { X, ExternalLink, Search, User, Video } from 'lucide-react';
import {
  getProfessionalsByFilters,
  buildAthleteYouTubeSearchUrl,
  isPlaceholderVideo,
  type ProfessionalSwingReference,
  type ProfessionalReferenceFilters,
} from '@swingiq/core';
import type { SportId } from '@swingiq/core';

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

interface ReferenceBrowserProps {
  activeSport: SportId;
  selectedReference: ProfessionalSwingReference | null;
  onSelectReference: (ref: ProfessionalSwingReference) => void;
}

type SexFilter = 'all' | 'male' | 'female';
type HandednessFilter = 'any' | 'right' | 'left' | 'switch';

const MOVEMENT_TYPES_BY_SPORT: Record<SportId, string[]> = {
  golf: ['full_swing', 'driver', 'iron', 'wedge', 'putting'],
  tennis: ['forehand', 'backhand', 'serve', 'volley', 'drop_shot'],
  baseball: ['batting_swing', 'pitching'],
  softball_slow: ['batting_swing'],
  softball_fast: ['batting_swing', 'pitching'],
};

// ──────────────────────────────────────────────────────────────
// Status badge
// ──────────────────────────────────────────────────────────────

function ActiveStatusBadge({ status }: { status: ProfessionalSwingReference['activeStatus'] }) {
  if (status === 'current') return <Badge variant="success">Active</Badge>;
  if (status === 'recent') return <Badge variant="info">Recent</Badge>;
  if (status === 'retired') return <Badge variant="default">Retired</Badge>;
  return <Badge variant="default">Unknown</Badge>;
}

// ──────────────────────────────────────────────────────────────
// Video preview row inside the detail drawer
// ──────────────────────────────────────────────────────────────

function VideoPreviewRow({
  video,
  athleteName,
}: {
  video: ProfessionalSwingReference['referenceVideos'][number];
  athleteName: string;
}) {
  const isPlaceholder = isPlaceholderVideo(video);
  const searchUrl = buildAthleteYouTubeSearchUrl(athleteName, video.movementType);

  return (
    <div className="border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">{video.title}</p>
          <p className="text-xs text-muted-foreground capitalize mt-0.5">
            {video.movementType.replace(/_/g, ' ')} &middot; {video.cameraAngle.replace(/_/g, ' ')}
          </p>
        </div>
        <Video size={16} className="text-muted-foreground shrink-0 mt-0.5" />
      </div>

      {isPlaceholder ? (
        <div className="bg-warning/10 border border-warning/30 rounded-sm p-2.5">
          <p className="text-xs text-warning font-medium mb-1">
            Video Pending Admin Verification
          </p>
          <p className="text-xs text-warning mb-2">
            Search for <span className="font-semibold">{athleteName} {video.movementType.replace(/_/g, ' ')}</span> on YouTube
          </p>
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-warning hover:text-foreground underline"
          >
            <Search size={11} />
            Search on YouTube
            <ExternalLink size={10} />
          </a>
        </div>
      ) : (
        <div className="aspect-video bg-muted rounded-sm overflow-hidden">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeVideoId}`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Detail drawer / modal
// ──────────────────────────────────────────────────────────────

function ReferenceDetailDrawer({
  reference,
  onClose,
  onSelect,
  isSelected,
}: {
  reference: ProfessionalSwingReference;
  onClose: () => void;
  onSelect: (ref: ProfessionalSwingReference) => void;
  isSelected: boolean;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-card z-50 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-border">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-foreground">{reference.athleteName}</h2>
              <ActiveStatusBadge status={reference.activeStatus} />
              {reference.requiresVerification && (
                <Badge variant="warning">Pending Verification</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">
              {reference.sport.replace(/_/g, ' ')} &middot; {reference.sex}
              {reference.handedness && reference.handedness !== 'unknown'
                ? ` &middot; ${reference.handedness}-handed`
                : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-2 p-1.5 rounded-sm hover:bg-muted text-muted-foreground"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Bio */}
          <div>
            <p className="text-sm text-foreground leading-relaxed">{reference.bio}</p>
          </div>

          {/* Style tags */}
          {reference.styleTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {reference.styleTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full"
                >
                  {tag.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}

          {/* Movement types */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Movement Types
            </p>
            <div className="flex flex-wrap gap-1.5">
              {reference.movementTypes.map((mt) => (
                <Badge key={mt} variant="info">
                  {mt.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>

          {/* Videos */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Reference Videos ({reference.referenceVideos.length})
            </p>
            <div className="space-y-3">
              {reference.referenceVideos.map((video) => (
                <VideoPreviewRow
                  key={video.id}
                  video={video}
                  athleteName={reference.athleteName}
                />
              ))}
            </div>
          </div>

          {/* Admin notes (shown as informational) */}
          {reference.adminNotes && (
            <div className="bg-muted border border-border rounded-sm p-3">
              <p className="text-xs text-muted-foreground italic">{reference.adminNotes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button
            className="w-full"
            variant={isSelected ? 'secondary' : 'primary'}
            onClick={() => {
              onSelect(reference);
              track(ANALYTICS_EVENTS.PROFESSIONAL_REFERENCE_SELECTED, {
                athlete: reference.athleteName,
                sport: reference.sport,
              });
            }}
          >
            {isSelected ? 'Reference Selected' : 'Select for Comparison'}
          </Button>
        </div>
      </div>
    </>
  );
}

// ──────────────────────────────────────────────────────────────
// Reference Card
// ──────────────────────────────────────────────────────────────

function ReferenceCard({
  reference,
  isSelected,
  onClick,
}: {
  reference: ProfessionalSwingReference;
  isSelected: boolean;
  onClick: () => void;
}) {
  const verifiedVideoCount = reference.referenceVideos.filter((v) => v.verified).length;
  const totalVideos = reference.referenceVideos.length;
  const isTBD = reference.athleteName.startsWith('TBD');

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative w-full text-left rounded-xl border-2 p-4 transition-all cursor-pointer',
        'hover:shadow-md hover:border-accent-secondary/40',
        isSelected
          ? 'border-accent-secondary bg-accent-secondary/10 shadow-md'
          : 'border-border bg-card',
      )}
    >
      {/* Pending verification overlay */}
      {reference.requiresVerification && !isTBD && (
        <div className="absolute top-2 right-2">
          <Badge variant="warning" className="text-[10px]">Pending</Badge>
        </div>
      )}

      {/* TBD overlay */}
      {isTBD && (
        <div className="absolute inset-0 bg-muted/80 rounded-xl flex items-center justify-center">
          <span className="text-xs font-medium text-muted-foreground">Pending Verification</span>
        </div>
      )}

      {/* Avatar placeholder */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
          <User size={20} className="text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">
            {reference.athleteName}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <ActiveStatusBadge status={reference.activeStatus} />
            <span className="text-xs text-muted-foreground">
              {reference.sex === 'male' ? 'M' : 'F'}
              {reference.handedness && reference.handedness !== 'unknown'
                ? ` · ${reference.handedness[0]?.toUpperCase()}H`
                : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Style tags */}
      {reference.styleTags.length > 0 && !isTBD && (
        <div className="flex flex-wrap gap-1 mt-3">
          {reference.styleTags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full"
            >
              {tag.replace(/_/g, ' ')}
            </span>
          ))}
          {reference.styleTags.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{reference.styleTags.length - 3}</span>
          )}
        </div>
      )}

      {/* Video count */}
      <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
        <Video size={12} />
        <span>
          {verifiedVideoCount > 0
            ? `${verifiedVideoCount}/${totalVideos} verified`
            : `${totalVideos} video${totalVideos !== 1 ? 's' : ''} (pending)`}
        </span>
      </div>
    </button>
  );
}

// ──────────────────────────────────────────────────────────────
// Main ReferenceBrowser component
// ──────────────────────────────────────────────────────────────

export function ReferenceBrowser({
  activeSport,
  selectedReference,
  onSelectReference,
}: ReferenceBrowserProps) {
  const [sexFilter, setSexFilter] = useState<SexFilter>('all');
  const [movementFilter, setMovementFilter] = useState<string>('');
  const [handednessFilter, setHandednessFilter] = useState<HandednessFilter>('any');
  const [previewRef, setPreviewRef] = useState<ProfessionalSwingReference | null>(null);

  const movementOptions = MOVEMENT_TYPES_BY_SPORT[activeSport] ?? [];

  const filters: ProfessionalReferenceFilters = {
    sport: activeSport,
    sex: sexFilter === 'all' ? undefined : sexFilter,
    movementType: movementFilter || undefined,
    handedness: handednessFilter === 'any' ? undefined : handednessFilter,
  };

  const references = useMemo(
    () => getProfessionalsByFilters(filters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeSport, sexFilter, movementFilter, handednessFilter],
  );

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Athletes</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-3">
            {/* Sex filter */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Gender</label>
              <select
                value={sexFilter}
                onChange={(e) => setSexFilter(e.target.value as SexFilter)}
                className="border border-border rounded-lg px-2.5 py-1.5 text-sm bg-card focus:ring-2 focus:ring-ring outline-hidden"
              >
                <option value="all">All</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            {/* Movement type */}
            {movementOptions.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Movement</label>
                <select
                  value={movementFilter}
                  onChange={(e) => setMovementFilter(e.target.value)}
                  className="border border-border rounded-lg px-2.5 py-1.5 text-sm bg-card focus:ring-2 focus:ring-ring outline-hidden"
                >
                  <option value="">All</option>
                  {movementOptions.map((m) => (
                    <option key={m} value={m}>
                      {m.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Handedness */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Handedness</label>
              <select
                value={handednessFilter}
                onChange={(e) => setHandednessFilter(e.target.value as HandednessFilter)}
                className="border border-border rounded-lg px-2.5 py-1.5 text-sm bg-card focus:ring-2 focus:ring-ring outline-hidden"
              >
                <option value="any">Any</option>
                <option value="right">Right</option>
                <option value="left">Left</option>
                <option value="switch">Switch</option>
              </select>
            </div>

            {/* Result count */}
            <div className="flex items-end">
              <span className="text-xs text-muted-foreground pb-1.5">
                {references.length} athlete{references.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Grid */}
      {references.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <User size={36} className="mx-auto mb-3" />
          <p className="font-medium">No athletes match these filters.</p>
          <p className="text-sm mt-1">Try clearing some filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {references.map((ref) => (
            <ReferenceCard
              key={ref.id}
              reference={ref}
              isSelected={selectedReference?.id === ref.id}
              onClick={() => {
                setPreviewRef(ref);
                track(ANALYTICS_EVENTS.PROFESSIONAL_REFERENCE_PREVIEWED, {
                  athlete: ref.athleteName,
                  sport: ref.sport,
                });
              }}
            />
          ))}
        </div>
      )}

      {/* Detail drawer */}
      {previewRef && (
        <ReferenceDetailDrawer
          reference={previewRef}
          onClose={() => setPreviewRef(null)}
          onSelect={(ref) => {
            onSelectReference(ref);
            setPreviewRef(null);
          }}
          isSelected={selectedReference?.id === previewRef.id}
        />
      )}
    </div>
  );
}
