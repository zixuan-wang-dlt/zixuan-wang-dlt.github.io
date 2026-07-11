const sharedStyles = `
  :host {
    --ink: #173f3e;
    --muted: #687f7d;
    --paper: #fbfaf6;
    --line: rgba(23, 63, 62, .15);
    --teal: #168486;
    --blue: #4b95e7;
    --yellow: #efc64a;
    --green: #2f9255;
    --red: #d65d43;
    display: block;
    width: 100%;
    min-width: 0;
    margin: 1.8rem 0 .55rem;
    color: var(--ink);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  * { box-sizing: border-box; }

  .frame {
    position: relative;
    min-height: 390px;
    width: 100%;
    max-width: 100%;
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: linear-gradient(180deg, #fff 0%, var(--paper) 100%);
    box-shadow: 0 10px 30px rgba(23, 63, 62, .045);
  }

  .topline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 17px 21px;
    border-bottom: 1px solid var(--line);
    color: var(--muted);
    font-size: 12px;
    font-weight: 750;
    letter-spacing: .075em;
    text-transform: uppercase;
  }

  .topline strong { color: var(--teal); }
  .topline > * { min-width: 0; }
  .canvas { position: relative; min-height: 335px; padding: 32px; }
  .pill { padding: 10px 17px; border: 2px solid var(--teal); border-radius: 999px; background: #eef7f5; font-family: Georgia, serif; font-size: 20px; font-weight: 700; }
  .relation { color: var(--teal); font-size: 12px; font-weight: 800; letter-spacing: .055em; text-transform: uppercase; }
  .arrow { position: relative; height: 2px; min-width: 64px; background: var(--teal); }
  .arrow::after { position: absolute; top: -5px; right: -1px; content: ""; border-top: 6px solid transparent; border-bottom: 6px solid transparent; border-left: 10px solid var(--teal); }
  .hint { color: var(--muted); font-size: 13px; line-height: 1.5; }
  .legend { display: flex; align-items: center; justify-content: center; gap: 18px; color: var(--muted); font-size: 12px; }
  .math { font-family: Georgia, "Times New Roman", serif; font-style: italic; }
  .math sub, .math sup { position: relative; font-size: .68em; font-style: normal; line-height: 0; vertical-align: baseline; }
  .math sup { top: -.58em; }
  .math sub { bottom: -.16em; }
  .upright { font-style: normal; }
  .dot { display: inline-block; width: 8px; height: 8px; margin-right: 6px; border-radius: 50%; }
  .dot.blue { background: var(--blue); }
  .dot.yellow { border-radius: 2px; background: var(--yellow); }
  .dot.green { background: var(--green); }

  @media (max-width: 620px) {
    .frame { min-height: 350px; border-radius: 10px; }
    .topline { align-items: flex-start; gap: 8px; padding: 14px 15px; font-size: 10px; line-height: 1.35; }
    .topline span { text-align: right; }
    .canvas { min-height: 295px; padding: 24px 16px; }
    .pill { padding: 8px 12px; font-size: 17px; }
    .arrow { min-width: 34px; }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; }
  }
`;

class DiscoLoopAnimation extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `<style>${sharedStyles}${this.styles ?? ""}</style>${this.template}`;
    this.onReady?.(root);

    const frame = root.querySelector(".frame");
    if (!("IntersectionObserver" in window)) {
      frame.classList.add("is-visible");
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => frame.classList.toggle("is-visible", entry.isIntersecting));
    }, { threshold: .28 });
    this.observer.observe(this);
  }

  disconnectedCallback() {
    this.observer?.disconnect();
  }
}

class FactCompositionAnimation extends DiscoLoopAnimation {
  get template() {
    return `
      <div class="frame">
        <div class="topline"><strong>Atomic facts → unseen composition</strong><span>implicit two-hop reasoning</span></div>
        <div class="canvas">
          <div class="facts">
            <div class="fact"><span class="pill">Alice</span><span class="edge"><span class="relation">spouse</span><span class="arrow"></span></span><span class="pill bridge">Bob</span></div>
            <div class="fact"><span class="pill">Bob</span><span class="edge"><span class="relation">works in</span><span class="arrow"></span></span><span class="pill answer">San Francisco</span></div>
          </div>
          <div class="query">
            <span>Where does Alice's spouse work?</span>
            <strong>San Francisco</strong>
          </div>
          <div class="implicit">Bob must be recovered and used internally, but is never emitted.</div>
        </div>
      </div>`;
  }

  get styles() {
    return `
      .facts { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; align-items: center; margin-top: 18px; }
      .fact { display: flex; align-items: center; justify-content: center; gap: 12px; min-width: 0; }
      .edge { display: grid; gap: 8px; place-items: center; }
      .bridge { border-color: #d6a71c; background: #fff8dc; }
      .answer { border-color: #7759ca; background: #f1ecff; }
      .query { display: flex; align-items: center; justify-content: space-between; gap: 20px; max-width: 720px; margin: 64px auto 0; padding: 18px 21px; border: 1px solid var(--line); border-radius: 10px; background: rgba(255,255,255,.82); font-family: Georgia, serif; font-size: 19px; }
      .query strong { color: #7759ca; opacity: 0; transform: translateY(6px); }
      .implicit { margin-top: 18px; color: var(--muted); font-size: 13px; line-height: 1.45; text-align: center; opacity: 0; }
      .fact, .query { opacity: .25; }
      .is-visible .fact:first-child { animation: reveal .55s .15s forwards; }
      .is-visible .fact:nth-child(2) { animation: reveal .55s .65s forwards; }
      .is-visible .query { animation: reveal .55s 1.15s forwards; }
      .is-visible .query strong { animation: answer-in .5s 1.8s forwards; }
      .is-visible .implicit { animation: reveal .5s 2.15s forwards; }
      @keyframes reveal { to { opacity: 1; } }
      @keyframes answer-in { to { opacity: 1; transform: translateY(0); } }
      @media (max-width: 620px) {
        .facts { grid-template-columns: 1fr; gap: 24px; margin-top: 3px; }
        .query { flex-direction: column; align-items: flex-start; margin-top: 30px; font-size: 15px; }
        .query strong { align-self: flex-end; }
        .answer { font-size: 15px; }
      }
    `;
  }
}

class DepthMemoryAnimation extends DiscoLoopAnimation {
  get template() {
    return `
      <div class="frame">
        <div class="topline"><strong>Why composition fails OOD</strong><span>depth-local parametric memory</span></div>
        <div class="canvas memory-canvas">
          <div class="depth-axis"><span>shallow</span><i></i><span>deep</span></div>
          <div class="layer shallow">
            <span class="layer-name">Lower layers</span>
            <span class="memory id">Alice → Bob</span>
            <span class="memory ood">Dana → Eli</span>
            <span class="layer-note">all atomic facts can be recalled here</span>
          </div>
          <div class="layer deep">
            <span class="layer-name">Upper layers</span>
            <span class="memory id">Bob → Carol</span>
            <span class="memory missing">Eli → ?</span>
            <span class="layer-note">only facts trained as second hops are stored here</span>
          </div>
          <div class="bridge-token">Eli</div>
          <div class="failure-note">The bridge arrives, but its OOD second-hop fact is absent at this depth.</div>
        </div>
      </div>`;
  }

  get styles() {
    return `
      .memory-canvas { display: grid; grid-template-columns: 72px 1fr; gap: 18px; align-content: center; }
      .depth-axis { grid-row: 1 / 3; display: grid; grid-template-rows: auto 1fr auto; justify-items: center; color: var(--muted); font-size: 11px; font-weight: 800; letter-spacing: .075em; text-transform: uppercase; }
      .depth-axis i { width: 2px; min-height: 130px; margin: 8px 0; background: linear-gradient(var(--blue), var(--red)); }
      .layer { position: relative; display: grid; grid-template-columns: 120px 135px 135px 1fr; gap: 13px; align-items: center; min-height: 96px; padding: 15px 18px; border: 1px solid var(--line); border-radius: 10px; background: rgba(255,255,255,.78); }
      .layer-name { font-family: Georgia, serif; font-size: 16px; font-weight: 700; }
      .memory { padding: 10px; border-radius: 7px; background: #e6f2f0; font-size: 14px; font-weight: 700; text-align: center; }
      .memory.ood { background: #e7effb; }
      .memory.missing { border: 1px dashed var(--red); color: var(--red); background: #fff0ec; }
      .layer-note { color: var(--muted); font-size: 12px; line-height: 1.4; }
      .bridge-token { position: absolute; left: 51%; top: 44%; z-index: 2; width: 52px; height: 52px; display: grid; place-items: center; border: 2px solid var(--blue); border-radius: 50%; background: #e0edff; box-shadow: 0 4px 14px rgba(35,110,174,.14); font-family: Georgia, serif; font-size: 16px; font-weight: 700; opacity: 0; }
      .failure-note { grid-column: 2; margin-top: 15px; color: var(--red); font-size: 13px; font-weight: 700; line-height: 1.4; text-align: center; opacity: 0; }
      .is-visible .bridge-token { animation: bridge-up 2.1s .4s ease-in-out forwards; }
      .is-visible .memory.missing { animation: warn 1.2s 1.8s ease-in-out 2; }
      .is-visible .failure-note { animation: show .45s 2.2s forwards; }
      @keyframes bridge-up { 0% { top: 56%; opacity: 0; } 18% { opacity: 1; } 75%,100% { top: 25%; opacity: 1; } }
      @keyframes warn { 50% { transform: scale(1.04); box-shadow: 0 0 0 5px rgba(214,93,67,.1); } }
      @keyframes show { to { opacity: 1; } }
      @media (max-width: 620px) {
        .memory-canvas { grid-template-columns: 1fr; gap: 12px; }
        .depth-axis { display: none; }
        .layer { grid-template-columns: 1fr 1fr; padding: 11px; }
        .layer-name, .layer-note { grid-column: 1 / -1; }
        .memory, .layer-note { min-width: 0; overflow-wrap: anywhere; }
        .bridge-token { left: calc(50% - 26px); }
        .failure-note { grid-column: 1; }
      }
    `;
  }
}

class LoopHandoffAnimation extends DiscoLoopAnimation {
  get template() {
    return `
      <div class="frame">
        <div class="topline"><strong>Looping fixes order, but not the handoff</strong><span>same weights · two passes</span></div>
        <div class="canvas handoff-canvas">
          <div class="backbone"><span>Shared Transformer</span><small class="math">f<sub>θ</sub></small></div>
          <div class="loop loop-one"><b>Loop 1</b><span>retrieve bridge</span></div>
          <div class="loop loop-two"><b>Loop 2</b><span>use bridge</span></div>
          <div class="hidden"><span class="math">h<sup>(1)</sup></span></div>
          <div class="logit"><small>logit lens</small><strong>Bob</strong><b>P = 1.000</b></div>
          <div class="cosine"><small>geometry</small><strong>cos = 0.266</strong><span>OOD</span></div>
          <div class="handoff-arrow"></div>
          <div class="mismatch">decoded as Bob <b>≠</b> shaped like <span class="math">W</span>[Bob]</div>
        </div>
      </div>`;
  }

  get styles() {
    return `
      .handoff-canvas { display: grid; grid-template-columns: minmax(175px,1fr) 120px 100px minmax(180px,1fr); grid-template-rows: 1fr 1fr auto; gap: 14px 18px; align-items: center; }
      .backbone { grid-row: 1 / 3; display: grid; place-items: center; min-height: 178px; border: 2px solid var(--teal); border-radius: 12px; background: white; font-family: Georgia, serif; font-size: 22px; font-weight: 700; text-align: center; }
      .backbone small { color: var(--muted); font-size: 19px; }
      .loop { padding: 14px 10px; border-left: 2px solid var(--teal); }
      .loop b, .loop span { display: block; }
      .loop b { font-size: 14px; }
      .loop span { margin-top: 4px; color: var(--muted); font-size: 12px; }
      .hidden { grid-row: 1 / 3; display: grid; width: 82px; height: 82px; place-items: center; justify-self: center; border: 3px solid #236eae; border-radius: 50%; background: #dcecff; box-shadow: 0 4px 16px rgba(35,110,174,.14); }
      .hidden span { font-size: 25px; }
      .logit, .cosine { padding: 14px 16px; border: 1px solid var(--line); border-radius: 9px; background: rgba(255,255,255,.84); }
      .logit small, .cosine small { display: block; color: var(--muted); font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
      .logit strong, .cosine strong { display: block; margin-top: 6px; font-family: Georgia, serif; font-size: 21px; }
      .logit b { color: var(--green); font-size: 13px; }
      .cosine span { color: var(--red); font-size: 12px; font-weight: 800; }
      .handoff-arrow { display: none; }
      .mismatch { grid-column: 3 / 5; color: var(--red); font-size: 13px; font-weight: 700; text-align: center; opacity: 0; }
      .is-visible .hidden { animation: noisy 1.1s .4s ease-in-out 2; }
      .is-visible .logit { animation: lift .5s 1.2s both; }
      .is-visible .cosine { animation: lift .5s 1.65s both; }
      .is-visible .mismatch { animation: lift .45s 2.05s forwards; }
      @keyframes noisy { 50% { transform: translate(2px,-2px) rotate(3deg); } }
      @keyframes lift { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      @media (max-width: 620px) {
        .handoff-canvas { grid-template-columns: 1fr 76px 1fr; grid-template-rows: auto auto; gap: 12px 8px; }
        .backbone { grid-row: auto; min-height: 75px; font-size: 17px; }
        .loop { display: none; }
        .hidden { grid-row: auto; width: 62px; height: 62px; }
        .logit, .cosine { padding: 10px; }
        .mismatch { grid-column: 1 / -1; font-size: 12px; }
      }
    `;
  }
}

class AlignmentAnimation extends DiscoLoopAnimation {
  get template() {
    return `
      <div class="frame">
        <div class="topline"><strong>Training-free alignment intervention</strong><span>drag α</span></div>
        <div class="canvas align-canvas">
          <div class="plane">
            <div class="direction"></div>
            <div class="clean"><span><i class="math">W</i>[Bob]</span></div>
            <div class="state"><span class="math">h<sup>(1)</sup></span></div>
          </div>
          <div class="controls">
            <div class="alpha-row"><label>Intervention strength α</label><output>0.00</output></div>
            <input type="range" min="0" max="1" value="0" step="0.01" aria-label="Intervention strength alpha">
            <div class="formula"><span class="math">h̃<sup>(1)</sup> = (1 − α)h<sup>(1)</sup> + α · <span class="upright">Norm</span>(W[Bob])</span></div>
            <div class="metrics">
              <div><small>cosine</small><strong class="cosine-value">0.266</strong></div>
              <div><small>OOD accuracy</small><strong class="accuracy-value">8.3%</strong></div>
            </div>
          </div>
        </div>
      </div>`;
  }

  get styles() {
    return `
      .align-canvas { display: grid; grid-template-columns: 1.15fr .85fr; gap: 26px; align-items: center; }
      .plane { position: relative; min-height: 235px; border: 1px solid var(--line); border-radius: 10px; background: linear-gradient(rgba(23,63,62,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(23,63,62,.05) 1px, transparent 1px), #eaf1ef; background-size: 42px 42px; }
      .direction { position: absolute; left: 14%; bottom: 15%; width: 72%; height: 2px; transform: rotate(-29deg); transform-origin: left; border-top: 2px dashed rgba(47,146,85,.55); }
      .clean, .state { position: absolute; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 750; }
      .clean i { margin-right: 2px; }
      .clean { right: 12%; top: 15%; width: 72px; height: 72px; border: 2px solid var(--yellow); border-radius: 12px; background: #fff6cf; }
      .state { left: 18%; bottom: 18%; width: 70px; height: 70px; border: 3px solid #236eae; border-radius: 50%; background: #dcecff; transition: left .08s linear, bottom .08s linear, box-shadow .08s linear; }
      .controls { min-width: 0; }
      .alpha-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 14px; font-weight: 700; }
      output { color: var(--teal); font-size: 24px; font-weight: 850; font-variant-numeric: tabular-nums; }
      input { width: 100%; margin: 18px 0; accent-color: var(--teal); }
      .formula { overflow-x: auto; padding: 14px; border-radius: 7px; background: #f1efe8; font-size: 15px; text-align: center; white-space: nowrap; }
      .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 16px; }
      .metrics div { padding: 13px; border-top: 2px solid var(--teal); background: rgba(255,255,255,.72); }
      .metrics small, .metrics strong { display: block; }
      .metrics small { color: var(--muted); font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
      .metrics strong { margin-top: 6px; font-family: Georgia, serif; font-size: 21px; font-variant-numeric: tabular-nums; }
      @media (max-width: 620px) { .align-canvas { grid-template-columns: 1fr; } .plane { min-height: 190px; } }
    `;
  }

  onReady(root) {
    const slider = root.querySelector("input");
    const output = root.querySelector("output");
    const state = root.querySelector(".state");
    const cosine = root.querySelector(".cosine-value");
    const accuracy = root.querySelector(".accuracy-value");
    const points = [[0,8.3],[.1,25.9],[.2,46],[.3,69],[.4,86],[.5,96.5],[.6,98.5],[.8,99.1],[1,97]];

    const interpolate = (alpha) => {
      for (let index = 1; index < points.length; index += 1) {
        if (alpha <= points[index][0]) {
          const [x0, y0] = points[index - 1];
          const [x1, y1] = points[index];
          return y0 + (y1 - y0) * ((alpha - x0) / (x1 - x0));
        }
      }
      return points.at(-1)[1];
    };

    slider.addEventListener("input", () => {
      const alpha = Number(slider.value);
      const eased = 1 - Math.pow(1 - alpha, 1.25);
      output.value = alpha.toFixed(2);
      state.style.left = `${18 + 58 * eased}%`;
      state.style.bottom = `${18 + 55 * eased}%`;
      state.style.boxShadow = `0 0 0 ${Math.round(12 * eased)}px rgba(239,198,74,.12)`;
      cosine.textContent = (0.266 + 0.734 * eased).toFixed(3);
      accuracy.textContent = `${interpolate(alpha).toFixed(1)}%`;
    });
  }
}

class DiscoLoopArchitectureAnimation extends DiscoLoopAnimation {
  get template() {
    return `
      <div class="frame">
        <div class="topline"><strong>DiscoLoop</strong><span>continuous state + discrete embedding</span></div>
        <div class="canvas architecture-canvas">
          <div class="block input"><span class="math">h<sup>(k)</sup></span><small>continuous input</small></div>
          <div class="flow blue"></div>
          <div class="block transformer"><span class="math">f<sub>θ</sub></span><small>shared transformer</small></div>
          <div class="split">
            <div class="channel continuous"><i></i><span class="math">h<sup>(k+1)</sup></span><small>keep rich context</small></div>
            <div class="channel discrete"><i></i><span class="math">Φ(h<sup>(k+1)</sup>)</span><small>soft decode → encode</small><b class="gate math"><span>α<sup>(k)</sup></span></b></div>
          </div>
          <div class="plus">+</div>
          <div class="block output"><span class="math">h̃<sup>(k+1)</sup></span><small>next loop input</small></div>
          <div class="success">clean identity signal, without exposing a CoT token</div>
        </div>
      </div>`;
  }

  get styles() {
    return `
      .architecture-canvas { display: grid; grid-template-columns: 105px 48px 150px minmax(220px,1fr) 42px 125px; gap: 12px; align-items: center; }
      .block { display: grid; min-height: 86px; place-items: center; padding: 11px; border: 2px solid var(--teal); border-radius: 10px; background: white; text-align: center; }
      .block span { font-size: 23px; font-weight: 700; }
      .block small, .channel small { color: var(--muted); font-size: 12px; line-height: 1.35; }
      .transformer { min-height: 120px; }
      .flow { position: relative; height: 3px; background: var(--blue); }
      .flow::after { position: absolute; top: -5px; right: -1px; content: ""; border-top: 6px solid transparent; border-bottom: 6px solid transparent; border-left: 10px solid var(--blue); }
      .split { display: grid; gap: 14px; }
      .channel { position: relative; display: grid; grid-template-columns: 13px 1fr; gap: 4px 10px; align-items: center; min-height: 76px; padding: 13px 52px 13px 14px; border: 1px solid var(--line); border-radius: 9px; background: rgba(255,255,255,.76); }
      .channel i { grid-row: 1 / 3; width: 11px; height: 11px; border-radius: 50%; background: var(--blue); }
      .channel.discrete i { border-radius: 2px; background: var(--yellow); }
      .channel span { font-size: 18px; font-weight: 700; }
      .gate { position: absolute; right: 10px; display: flex; width: 42px; height: 42px; align-items: center; justify-content: center; border: 2px solid var(--green); border-radius: 50%; background: #edf7ef; font-size: 16px; }
      .plus { font-size: 30px; text-align: center; }
      .output { border-color: var(--green); }
      .success { position: absolute; right: 30px; bottom: 25px; color: var(--green); font-size: 13px; font-weight: 700; opacity: 0; }
      .is-visible .flow { animation: pulse-flow 1.25s ease-in-out infinite; }
      .is-visible .discrete { animation: discrete-pulse 1.4s .45s ease-in-out infinite; }
      .is-visible .output { animation: output-pulse 1.4s .85s ease-in-out infinite; }
      .is-visible .success { animation: appear .5s 1.4s forwards; }
      @keyframes pulse-flow { 50% { box-shadow: 0 0 0 5px rgba(75,149,231,.13); } }
      @keyframes discrete-pulse { 50% { border-color: var(--yellow); transform: translateX(3px); } }
      @keyframes output-pulse { 50% { box-shadow: 0 0 0 6px rgba(47,146,85,.12); } }
      @keyframes appear { to { opacity: 1; } }
      @media (max-width: 700px) {
        .architecture-canvas { grid-template-columns: 1fr; gap: 12px; padding: 22px 18px 20px; }
        .block { width: min(100%, 230px); min-width: 0; min-height: 72px; justify-self: center; padding: 8px; }
        .block span { font-size: 19px; }
        .block small { font-size: 11px; }
        .transformer { min-height: 86px; }
        .flow { width: 3px; height: 28px; justify-self: center; }
        .flow::after { top: auto; right: -5px; bottom: -1px; transform: rotate(90deg); }
        .split { width: 100%; max-width: 280px; justify-self: center; }
        .channel { min-width: 0; min-height: 64px; padding: 9px 50px 9px 10px; }
        .channel span { font-size: 16px; }
        .channel small { font-size: 11px; }
        .gate { display: flex; }
        .plus { font-size: 25px; }
        .success { position: static; text-align: center; }
      }
    `;
  }
}

customElements.define("discoloop-fact-composition", FactCompositionAnimation);
customElements.define("discoloop-depth-memory", DepthMemoryAnimation);
customElements.define("discoloop-loop-handoff", LoopHandoffAnimation);
customElements.define("discoloop-alignment", AlignmentAnimation);
customElements.define("discoloop-architecture", DiscoLoopArchitectureAnimation);
