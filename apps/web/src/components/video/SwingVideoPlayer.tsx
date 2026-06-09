'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/video-metadata';

const PLAYBACK_SPEEDS = [1, 0.5, 0.25, 0.1] as const;
type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

interface SwingVideoPlayerProps {
  objectUrl: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onReady?: (videoEl: HTMLVideoElement) => void;
  className?: string;
}

export function SwingVideoPlayer({
  objectUrl,
  onTimeUpdate,
  onReady,
  className,
}: SwingVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [isDragging, setIsDragging] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const seekBarRef = useRef<HTMLDivElement>(null);

  const seek = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const clamped = Math.max(0, Math.min(duration, time));
    video.currentTime = clamped;
    setCurrentTime(clamped);
  }, [duration]);

  const stepFrame = (direction: 1 | -1) => {
    seek(currentTime + direction * (1 / 30)); // assume 30 fps
  };

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const setSpeed = (speed: PlaybackSpeed) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  };

  // Scrubber interaction
  const seekFromPointer = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
      const bar = seekBarRef.current;
      if (!bar || !duration) return;
      const rect = bar.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      seek(pct * duration);
    },
    [duration, seek],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => { if (isDragging) seekFromPointer(e); };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, seekFromPointer]);

  return (
    <div className={cn('bg-black rounded-xl overflow-hidden select-none', className)}>
      {/* Video element */}
      <div className="relative aspect-video bg-black">
        {/* User-recorded swing clip — silent footage with no narration, so there
            is no caption/subtitle track to provide. */}
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          src={objectUrl}
          className="w-full h-full object-contain"
          playsInline
          preload="auto"
          onLoadedMetadata={() => {
            const v = videoRef.current;
            if (!v) return;
            setDuration(v.duration);
            onReady?.(v);
          }}
          onTimeUpdate={() => {
            const v = videoRef.current;
            if (!v || isDragging) return;
            setCurrentTime(v.currentTime);
            onTimeUpdate?.(v.currentTime, v.duration);
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => { setIsPlaying(false); }}
        />
      </div>

      {/* Controls bar */}
      <div className="bg-gray-900 px-4 py-3 space-y-2">
        {/* Seek bar */}
        <div
          ref={seekBarRef}
          className="relative h-2 bg-gray-700 rounded-full cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          onMouseDown={(e) => { setIsDragging(true); seekFromPointer(e); }}
          onClick={seekFromPointer}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') { e.preventDefault(); seek(currentTime - 1); }
            else if (e.key === 'ArrowRight') { e.preventDefault(); seek(currentTime + 1); }
            else if (e.key === 'Home') { e.preventDefault(); seek(0); }
            else if (e.key === 'End') { e.preventDefault(); seek(duration); }
          }}
          role="slider"
          tabIndex={0}
          aria-label="Video progress"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(currentTime)}
        >
          {/* Progress fill */}
          <div
            className="absolute left-0 top-0 h-full bg-green-500 rounded-full transition-[width] duration-75"
            style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
          />
          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: duration > 0 ? `calc(${(currentTime / duration) * 100}% - 7px)` : '0' }}
          />
        </div>

        {/* Button row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {/* Step back */}
            <button
              onClick={() => stepFrame(-1)}
              className="text-gray-300 hover:text-white p-1.5 rounded-sm hover:bg-gray-700 transition-colors"
              title="Previous frame"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlayback}
              className="w-9 h-9 rounded-full bg-green-600 hover:bg-green-500 text-white flex items-center justify-center transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying
                ? <Pause className="w-4 h-4 fill-white" />
                : <Play className="w-4 h-4 fill-white ml-0.5" />
              }
            </button>

            {/* Step forward */}
            <button
              onClick={() => stepFrame(1)}
              className="text-gray-300 hover:text-white p-1.5 rounded-sm hover:bg-gray-700 transition-colors"
              title="Next frame"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Timestamp */}
          <span className="text-xs text-gray-400 font-mono tabular-nums">
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </span>

          {/* Speed selector */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 px-2.5 py-1.5 rounded-lg transition-colors"
              title="Playback speed"
            >
              <Gauge className="w-3.5 h-3.5" />
              {playbackSpeed === 1 ? '1×' : `${playbackSpeed}×`}
            </button>

            {showSpeedMenu && (
              <div className="absolute bottom-full mb-1 right-0 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-10 min-w-[80px]">
                {PLAYBACK_SPEEDS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-xs transition-colors',
                      s === playbackSpeed
                        ? 'text-green-400 bg-gray-700 font-semibold'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                    )}
                  >
                    {s === 1 ? '1× (Normal)' : `${s}× Slow`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
