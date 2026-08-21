import React from 'react';
import { CloseIcon } from './Icons';
import DidAgentWidget from './DidAgentWidget';

// Full-width D-ID hosted agent (fully client-side — see DidAgentWidget for
// why the key is safe to ship in frontend code). Replaces the earlier
// DeepSeek+Silero+Simli experiment on this route.
function AvatarDemo({ onBack }) {
  return (
    <div className="fixed inset-0 bg-neutral-950">
      <DidAgentWidget className="absolute inset-0 w-full h-full" />

      <button
        type="button"
        onClick={onBack}
        className="absolute top-3 left-3 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
        title="Orqaga"
      >
        <CloseIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

export default AvatarDemo;
