import { useEffect } from 'react';

// D-ID's hosted agent widget — fully client-side, no backend involved. The
// client key is domain-restricted (tqtb-olmazor.uz) on D-ID's side, which is
// why it's safe to ship in frontend code the way D-ID's own embed snippet
// does, unlike SIMLI_API_KEY/DEEPSEEK_API_KEY which must stay server-side.
const DID_AGENT_ID = 'v2_agt_S-I1KRRQ';
const DID_CLIENT_KEY = 'ck_Bb3-FeLA8GD44ucuyfG9Z';

function DidAgentWidget() {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://agent.d-id.com/v2/index.js';
    script.dataset.mode = 'fabio';
    script.dataset.clientKey = DID_CLIENT_KEY;
    script.dataset.agentId = DID_AGENT_ID;
    script.dataset.name = 'did-agent';
    script.dataset.monitor = 'true';
    script.dataset.orientation = 'horizontal';
    script.dataset.position = 'right';
    script.dataset.openMode = 'expanded';
    document.body.appendChild(script);

    return () => {
      script.remove();
      // The widget script mounts its own floating UI outside React's tree —
      // remove whatever it added so it doesn't linger after navigating away.
      document.querySelectorAll('[data-name="did-agent"], #did-container, did-agent').forEach(el => el.remove());
    };
  }, []);

  return null;
}

export default DidAgentWidget;
