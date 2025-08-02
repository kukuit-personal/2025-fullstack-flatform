'use client';

import { Loader2 } from 'lucide-react';
import React from 'react';

export default function PageLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        {/* <p className="text-sm text-muted-foreground">Checking access permissions...</p> */}
      </div>
    </div>
  );
}
