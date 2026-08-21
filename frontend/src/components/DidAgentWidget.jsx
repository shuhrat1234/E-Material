import { useEffect } from 'react';

// D-ID's hosted agent widget — fully client-side, no backend involved. The
// client key is domain-restricted (tqtb-olmazor.uz) on D-ID's side, which is
// why it's safe to ship in frontend code the way D-ID's own embed snippet
// does, unlike SIMLI_API_KEY/DEEPSEEK_API_KEY which must stay server-side.
// "full" mode renders into the given target div instead of a floating bubble.
const DID_AGENT_ID = 'v2_agt_S-I1KRRQ';
const DID_CLIENT_KEY = 'ck_Bb3-FeLA8GD44ucuyfG9Z';
const DID_TARGET_ID = 'did-agent-target';

function DidAgentWidget({ className = '' }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://agent.d-id.com/v2/index.js';
    script.dataset.mode = 'full';
    script.dataset.clientKey = DID_CLIENT_KEY;
    script.dataset.agentId = DID_AGENT_ID;
    script.dataset.name = 'did-agent';
    script.dataset.monitor = 'true';
    script.dataset.targetId = DID_TARGET_ID;
    document.body.appendChild(script);

    return () => {
      script.remove();
      const target = document.getElementById(DID_TARGET_ID);
      if (target) target.innerHTML = '';
    };
  }, []);

  return <div id={DID_TARGET_ID} className={className} />;
}

export default DidAgentWidget;
