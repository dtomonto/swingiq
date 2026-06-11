'use client';

import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Camera, CameraOff, RefreshCw } from 'lucide-react';
import { PrivacyNotice } from './PrivacyNotice';
import type { CameraError } from '@/lib/record-assist/runtime/camera';

export interface CameraPermissionPanelProps {
  status: 'idle' | 'requesting' | 'error';
  error: CameraError | null;
  onRequest: () => void;
}

const ERROR_COPY: Record<CameraError, { title: string; body: string }> = {
  denied: {
    title: 'Camera access was blocked',
    body: 'Allow camera access in your browser’s site settings, then try again. We only use the camera while this screen is open.',
  },
  not_found: {
    title: 'No camera found',
    body: 'We couldn’t find a camera on this device. Connect one or switch to a phone, then try again.',
  },
  in_use: {
    title: 'Camera is in use',
    body: 'Another app or tab may be using the camera. Close it and try again.',
  },
  unsupported: {
    title: 'Camera not supported',
    body: 'This browser doesn’t support in-browser camera capture. You can still upload a clip instead.',
  },
  unknown: {
    title: 'Couldn’t start the camera',
    body: 'Something went wrong starting the camera. Please try again.',
  },
};

/** Camera permission request + clear, recoverable error states. */
export function CameraPermissionPanel({ status, error, onRequest }: CameraPermissionPanelProps) {
  const isError = status === 'error' && error;
  const copy = isError ? ERROR_COPY[error] : null;

  return (
    <Card>
      <CardBody className="space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          {isError ? <CameraOff className="h-7 w-7" aria-hidden /> : <Camera className="h-7 w-7" aria-hidden />}
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-foreground">
            {copy ? copy.title : 'We’ll help you get in frame'}
          </h2>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {copy
              ? copy.body
              : 'Place your phone on the floor or prop it up, then step back. We’ll guide your position with live visual and voice cues.'}
          </p>
        </div>

        <Button onClick={onRequest} loading={status === 'requesting'} size="lg" className="w-full sm:w-auto">
          {isError ? (
            <>
              <RefreshCw className="h-4 w-4" aria-hidden /> Try again
            </>
          ) : (
            <>
              <Camera className="h-4 w-4" aria-hidden /> Enable camera
            </>
          )}
        </Button>

        <PrivacyNotice compact className="justify-center" />
      </CardBody>
    </Card>
  );
}
