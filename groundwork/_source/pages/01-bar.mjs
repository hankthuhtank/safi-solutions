// The bar: an espresso machine you operate, step by step.
const scene = `
<svg id="scene" viewBox="0 0 1200 720" role="img" aria-labelledby="scene-t">
<title id="scene-t">A café counter: a grinder, a tamping mat, a red espresso machine with a pressure gauge, shot timer, steam wand and drip-tray scale.</title>
<defs>
  <linearGradient id="g-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3eadb"/><stop offset="1" stop-color="#e6d8c1"/></linearGradient>
  <radialGradient id="g-glow" cx="740" cy="110" r="560" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffd896" stop-opacity=".55"/><stop offset=".55" stop-color="#ffd896" stop-opacity=".12"/><stop offset="1" stop-color="#ffd896" stop-opacity="0"/></radialGradient>
  <linearGradient id="g-enamel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c94634"/><stop offset=".25" stop-color="#b8392d"/><stop offset=".8" stop-color="#a83126"/><stop offset="1" stop-color="#8f271f"/></linearGradient>
  <linearGradient id="g-enamel-top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <linearGradient id="g-steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1f3f4"/><stop offset=".45" stop-color="#c6cacd"/><stop offset=".55" stop-color="#a3a9ae"/><stop offset="1" stop-color="#dfe2e4"/></linearGradient>
  <linearGradient id="g-chrome" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8d949a"/><stop offset=".28" stop-color="#f5f7f8"/><stop offset=".6" stop-color="#b2b8bd"/><stop offset=".85" stop-color="#eceef0"/><stop offset="1" stop-color="#9aa1a6"/></linearGradient>
  <linearGradient id="g-walnut" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5634"/><stop offset="1" stop-color="#5a3420"/></linearGradient>
  <linearGradient id="g-counter" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d2a575"/><stop offset="1" stop-color="#b98a5c"/></linearGradient>
  <linearGradient id="g-front" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5d3823"/><stop offset="1" stop-color="#3f2416"/></linearGradient>
  <linearGradient id="g-matte" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3b2a21"/><stop offset=".4" stop-color="#2b1e17"/><stop offset="1" stop-color="#1f1510"/></linearGradient>
  <linearGradient id="g-shot" x1="0" y1="0" x2="0" y2="1"><stop id="shot-top" offset="0" stop-color="#c88a4c"/><stop id="shot-crema" offset=".2" stop-color="#9a5a2c"/><stop offset=".26" stop-color="#3a1d10"/><stop offset="1" stop-color="#1e0d07"/></linearGradient>
  <linearGradient id="g-stream" x1="0" y1="0" x2="0" y2="1"><stop id="st-a" offset="0" stop-color="#3a1a0d"/><stop id="st-b" offset="1" stop-color="#6a3416"/></linearGradient>
  <pattern id="p-tiles" width="64" height="32" patternUnits="userSpaceOnUse"><rect width="64" height="32" fill="#efe4d1"/><path d="M0 .5H64M32 16.5H0M64 16.5H32M.5 0V16M32.5 16V32" stroke="#ddcdb3" stroke-width="1.4"/></pattern>
  <pattern id="p-grill" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#bfc4c7"/><rect x="2" y="2" width="8" height="8" rx="1.5" fill="#4b4f53"/></pattern>
  <pattern id="p-grain" width="90" height="18" patternUnits="userSpaceOnUse"><path d="M0 6q22 -4 45 0t45 0M0 14q30 3 60 -1t30 1" fill="none" stroke="#2f1a0f" stroke-opacity=".28" stroke-width="1.2"/></pattern>
  <pattern id="p-tiger" width="10" height="6" patternUnits="userSpaceOnUse"><ellipse cx="3" cy="3" rx="2.6" ry="1" fill="#6b3718" opacity=".55"/><ellipse cx="8" cy="1.4" rx="1.3" ry=".6" fill="#f3c98e" opacity=".5"/></pattern>
  <filter id="f-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
  <clipPath id="c-hopper"><path d="M84 96H216L182 234H118Z"/></clipPath>
  <clipPath id="c-cup"><path d="M714.5 505H765.5L762 560Q761.6 563 758.6 563H721.4Q718.4 563 718 560Z"/></clipPath>
  <clipPath id="c-mug"><path d="M575 509H625V560Q625 563 622 563H578Q575 563 575 560Z"/></clipPath>
  <clipPath id="c-pitcher"><path d="M-27 -84H27L29 -10Q29 -6 25 -6H-25Q-29 -6 -29 -10Z"/></clipPath>
</defs>

<!-- room -->
<rect width="1200" height="600" fill="url(#g-wall)"/>
<rect y="292" width="1200" height="308" fill="url(#p-tiles)" opacity=".85"/>
<rect y="288" width="1200" height="6" fill="#d7c5a6"/>
<rect width="1200" height="600" fill="url(#g-glow)"/>

<!-- pendant lamp -->
<g aria-hidden="true">
  <path d="M740 0V56" stroke="#2a1a12" stroke-width="2"/>
  <path d="M718 56H762L786 100H694Z" fill="#b3362b" stroke="#2a1a12" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="M700 94H780" stroke="#fff" stroke-opacity=".25" stroke-width="3"/>
  <ellipse cx="740" cy="103" rx="16" ry="5" fill="#ffe7b5"/>
</g>

<!-- bean of the day board -->
<g id="beanBoard" aria-hidden="true">
  <path d="M290 30L286 92M410 30L414 92" stroke="#2a1a12" stroke-width="1.6"/>
  <circle cx="290" cy="28" r="3" fill="#2a1a12"/><circle cx="410" cy="28" r="3" fill="#2a1a12"/>
  <rect x="262" y="90" width="176" height="122" rx="6" fill="#6b4428"/>
  <rect x="269" y="97" width="162" height="108" rx="3" fill="#24170f"/>
  <text x="350" y="122" text-anchor="middle" font-family="Martian Mono, monospace" font-size="9" letter-spacing="2" fill="#c58a4e">ON THE GRINDER</text>
  <text id="bb-name" x="350" y="152" text-anchor="middle" font-family="Young Serif, Georgia, serif" font-size="19" fill="#f5eee2">Huila</text>
  <text id="bb-country" x="350" y="172" text-anchor="middle" font-family="Young Serif, Georgia, serif" font-size="13" fill="#e9d3ae">Colombia</text>
  <text id="bb-meta" x="350" y="194" text-anchor="middle" font-family="Martian Mono, monospace" font-size="8.5" fill="#c58a4e">WASHED · MEDIUM</text>
</g>

<!-- shelf -->
<g aria-hidden="true">
  <rect x="1004" y="208" width="190" height="10" rx="2" fill="url(#g-walnut)"/>
  <path d="M1020 218v18h10M1176 218v18h-10" fill="none" stroke="#2a1a12" stroke-width="3"/>
  <g><path d="M1018 208V138L1024 130H1066L1072 138V208Z" fill="#d6bc94" stroke="#2a1a12" stroke-width="2"/><rect x="1026" y="160" width="38" height="30" rx="2" fill="#f5eee2"/><path d="M1032 170h26M1032 177h18M1032 184h22" stroke="#2a1a12" stroke-width="1.6"/><circle cx="1045" cy="148" r="4" fill="none" stroke="#2a1a12" stroke-width="1.4"/></g>
  <g><path d="M1080 208V150L1085 143H1123L1128 150V208Z" fill="#2a1a12"/><rect x="1088" y="166" width="32" height="26" rx="2" fill="#b3362b"/><path d="M1093 175h22M1093 182h14" stroke="#f5eee2" stroke-width="1.6"/></g>
  <g><rect x="1140" y="166" width="38" height="42" rx="6" fill="#fff" fill-opacity=".45" stroke="#2a1a12" stroke-width="2"/><rect x="1138" y="160" width="42" height="9" rx="3" fill="#7a4a2b" stroke="#2a1a12" stroke-width="1.6"/><g fill="#4a2c1d"><ellipse cx="1150" cy="196" rx="4" ry="3"/><ellipse cx="1160" cy="200" rx="4" ry="3"/><ellipse cx="1168" cy="193" rx="4" ry="3"/><ellipse cx="1155" cy="186" rx="4" ry="3"/><ellipse cx="1166" cy="182" rx="4" ry="3"/><ellipse cx="1150" cy="203" rx="4" ry="3"/></g></g>
</g>

<!-- counter -->
<rect y="600" width="1200" height="16" fill="url(#g-counter)"/>
<rect y="616" width="1200" height="104" fill="url(#g-front)"/>
<rect y="616" width="1200" height="104" fill="url(#p-grain)"/>
<rect y="600" width="1200" height="3" fill="#fff" fill-opacity=".35"/>

<!-- knock box -->
<g id="knockbox">
  <rect x="1100" y="530" width="84" height="70" rx="10" fill="url(#g-matte)" stroke="#120b08" stroke-width="2"/>
  <rect x="1094" y="524" width="96" height="11" rx="5.5" fill="#55504c" stroke="#120b08" stroke-width="2"/>
  <g id="pucks" fill="#3b2418" stroke="#120b08" stroke-width="1.4"></g>
  <text x="1142" y="575" text-anchor="middle" font-family="Martian Mono, monospace" font-size="8" fill="#c58a4e" letter-spacing="1.5">KNOCK</text>
</g>

<!-- grinder -->
<g id="grinder">
  <rect x="96" y="556" width="108" height="44" rx="8" fill="url(#g-matte)" stroke="#120b08" stroke-width="2"/>
  <rect x="92" y="258" width="116" height="214" rx="16" fill="url(#g-matte)" stroke="#120b08" stroke-width="2"/>
  <path d="M100 270V460" stroke="#fff" stroke-opacity=".12" stroke-width="5" stroke-linecap="round"/>
  <rect x="116" y="236" width="68" height="24" rx="3" fill="url(#g-chrome)" stroke="#2a1a12" stroke-width="1.6"/>
  <g clip-path="url(#c-hopper)"><g id="hopperBeans"></g></g>
  <path d="M84 96H216L182 234H118Z" fill="#fff" fill-opacity=".22" stroke="#2a1a12" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="M96 104L124 226" stroke="#fff" stroke-opacity=".6" stroke-width="4" stroke-linecap="round"/>
  <rect x="78" y="84" width="144" height="14" rx="6" fill="#2b1e17" stroke="#120b08" stroke-width="2"/>
  <g id="grindDial">
    <circle cx="150" cy="320" r="35" fill="url(#g-chrome)" stroke="#2a1a12" stroke-width="2"/>
    <g id="dialTicks" stroke="#2a1a12" stroke-width="1.5"></g>
    <circle cx="150" cy="320" r="13" fill="#2b1e17"/>
    <path id="dialMark" d="M150 290V302" stroke="#b3362b" stroke-width="3.5" stroke-linecap="round"/>
  </g>
  <path d="M150 279l-5 -8h10z" fill="#e9d3ae"/>
  <rect x="116" y="368" width="68" height="30" rx="4" fill="#120b08"/>
  <g id="doseSeg" transform="translate(122 374)"></g>
  <g id="grindBtn" class="hot" tabindex="-1" role="presentation"><circle cx="150" cy="426" r="13" fill="#b3362b" stroke="#120b08" stroke-width="2"/><circle cx="146" cy="422" r="4" fill="#fff" fill-opacity=".35"/></g>
  <path d="M137 472H163L159 494H141Z" fill="url(#g-chrome)" stroke="#2a1a12" stroke-width="1.6"/>
  <rect x="104" y="500" width="10" height="20" rx="3" fill="#55504c"/><rect x="186" y="500" width="10" height="20" rx="3" fill="#55504c"/>
  <g id="groundsFall"></g>
</g>

<!-- tamp mat -->
<rect x="294" y="586" width="112" height="14" rx="4" fill="#3a2a22" stroke="#120b08" stroke-width="1.6"/>
<path d="M300 592H400" stroke="#fff" stroke-opacity=".1" stroke-width="2"/>

<!-- machine body -->
<g id="machine">
  <path d="M496 236V212H984V236" fill="none" stroke="url(#g-steel)" stroke-width="5" stroke-linejoin="round"/>
  <path d="M520 236V212M600 236V212M680 236V212M800 236V212M880 236V212M960 236V212" stroke="#a3a9ae" stroke-width="3"/>
  <g aria-hidden="true">
    <path d="M524 236L528 214H556L560 236Z" fill="#f5eee2" stroke="#2a1a12" stroke-width="1.8"/>
    <path d="M572 236L576 214H604L608 236Z" fill="#2a1a12" stroke="#120b08" stroke-width="1.8"/>
    <path d="M884 236L888 216H912L916 236Z" fill="#f5eee2" stroke="#2a1a12" stroke-width="1.8"/>
    <path d="M922 236L926 216H950L954 236Z" fill="#f5eee2" stroke="#2a1a12" stroke-width="1.8"/>
  </g>
  <rect x="490" y="246" width="500" height="354" rx="20" fill="url(#g-enamel)" stroke="#2a1a12" stroke-width="2.4"/>
  <rect x="490" y="246" width="500" height="354" rx="20" fill="url(#g-enamel-top)"/>
  <rect x="482" y="234" width="516" height="16" rx="5" fill="url(#g-steel)" stroke="#2a1a12" stroke-width="2"/>
  <path d="M506 262V585" stroke="#fff" stroke-opacity=".14" stroke-width="6" stroke-linecap="round"/>
  <!-- brand plate -->
  <rect x="706" y="362" width="68" height="15" rx="4" fill="url(#g-chrome)" stroke="#2a1a12" stroke-width="1.2"/>
  <text x="740" y="373" text-anchor="middle" font-family="Young Serif, Georgia, serif" font-size="9.5" fill="#2a1a12">Groundwork</text>

  <!-- gauge -->
  <g id="gauge">
    <circle cx="585" cy="330" r="50" fill="url(#g-chrome)" stroke="#2a1a12" stroke-width="2"/>
    <circle cx="585" cy="330" r="42" fill="#fbf7ef" stroke="#2a1a12" stroke-width="1.4"/>
    <path id="gaugeZone" fill="none" stroke="#5e6b45" stroke-width="6" opacity=".7"/>
    <g id="gaugeTicks" stroke="#2a1a12"></g>
    <text x="585" y="352" text-anchor="middle" font-family="Martian Mono, monospace" font-size="7.5" fill="#6b5546" letter-spacing="1">BAR</text>
    <g id="needle" transform="rotate(-135 585 330)"><path d="M585 334V294" stroke="#b3362b" stroke-width="2.6" stroke-linecap="round"/></g>
    <circle cx="585" cy="330" r="5" fill="#2a1a12"/>
  </g>

  <!-- shot timer -->
  <rect x="660" y="306" width="160" height="52" rx="8" fill="#140d09" stroke="#2a1a12" stroke-width="2"/>
  <g id="timerSeg" transform="translate(674 314)"></g>
  <text x="806" y="350" text-anchor="end" font-family="Martian Mono, monospace" font-size="7" fill="#c58a4e" letter-spacing="1">SEC</text>

  <!-- steam knob -->
  <g id="steamKnob" class="hot" tabindex="-1" role="presentation">
    <circle cx="920" cy="330" r="28" fill="url(#g-chrome)" stroke="#2a1a12" stroke-width="2"/>
    <g id="steamKnobRot"><rect x="914" y="304" width="12" height="52" rx="5" fill="#2b1e17"/><circle cx="920" cy="310" r="2.5" fill="#e9d3ae"/></g>
  </g>
  <text x="920" y="378" text-anchor="middle" font-family="Martian Mono, monospace" font-size="7.5" fill="#f5eee2" letter-spacing="1.5">STEAM</text>

  <!-- hot water -->
  <g id="waterKnob" class="hot" tabindex="-1" role="presentation"><circle cx="600" cy="404" r="15" fill="url(#g-chrome)" stroke="#2a1a12" stroke-width="2"/><rect id="waterKnobRot" x="597" y="391" width="6" height="26" rx="3" fill="#2b1e17"/></g>
  <path d="M600 418V452Q600 470 600 474" fill="none" stroke="url(#g-chrome)" stroke-width="9" stroke-linecap="round"/>
  <path d="M600 418V474" fill="none" stroke="#2a1a12" stroke-width="1.2" opacity=".5"/>
  <text x="578" y="406" text-anchor="end" font-family="Martian Mono, monospace" font-size="7" fill="#f5eee2" letter-spacing="1.5">WATER</text>

  <!-- group head -->
  <rect x="710" y="380" width="60" height="34" fill="url(#g-chrome)" stroke="#2a1a12" stroke-width="2"/>
  <rect x="688" y="410" width="104" height="28" rx="9" fill="url(#g-chrome)" stroke="#2a1a12" stroke-width="2"/>
  <path d="M694 436H786" stroke="#2a1a12" stroke-width="2"/>
  <g id="flush" opacity="0"><path d="M700 438V500M712 438V520M724 438V505M736 438V525M748 438V510M760 438V522M772 438V502M780 438V515" stroke="#cfe2e7" stroke-width="2.4" stroke-dasharray="6 7"><animate attributeName="stroke-dashoffset" from="26" to="0" dur=".35s" repeatCount="indefinite"/></path></g>

  <!-- paddle -->
  <g id="paddleHit" class="hot" tabindex="-1" role="presentation">
    <rect x="712" y="190" width="56" height="50" fill="transparent"/>
    <g id="paddle" transform="translate(740 236) rotate(-38)"><rect x="-7" y="-40" width="14" height="40" rx="6" fill="url(#g-walnut)" stroke="#2a1a12" stroke-width="2"/><circle r="9" fill="url(#g-chrome)" stroke="#2a1a12" stroke-width="2"/></g>
  </g>

  <!-- steam wand -->
  <path d="M990 380H1006" stroke="url(#g-chrome)" stroke-width="12" stroke-linecap="round"/>
  <circle cx="1009" cy="383" r="9" fill="url(#g-chrome)" stroke="#2a1a12" stroke-width="2"/>
  <path d="M1010 388L1036 536" stroke="#2a1a12" stroke-width="11" stroke-linecap="round"/>
  <path d="M1010 388L1036 536" stroke="url(#g-chrome)" stroke-width="7.5" stroke-linecap="round"/>
  <circle cx="1036.5" cy="539" r="5" fill="#55504c" stroke="#2a1a12" stroke-width="1.6"/>
  <g id="puffs" filter="url(#f-soft)" opacity="0"></g>

  <!-- drip tray + scale -->
  <rect x="556" y="564" width="374" height="14" rx="2" fill="url(#p-grill)" stroke="#2a1a12" stroke-width="1.8"/>
  <rect x="552" y="577" width="382" height="23" rx="5" fill="url(#g-steel)" stroke="#2a1a12" stroke-width="2"/>
  <rect x="694" y="580" width="92" height="17" rx="3" fill="#140d09"/>
  <g id="scaleSeg" transform="translate(700 582.5)"></g>
</g>

<!-- americano mug -->
<g id="mug" opacity="0">
  <g clip-path="url(#c-mug)"><rect id="mugLiquid" x="570" y="563" width="60" height="0" fill="#4b2b19"/><rect id="mugWater" x="570" y="563" width="60" height="0" fill="#cfe1e6" opacity=".9"/></g>
  <path d="M572 506H628V561Q628 566 623 566H577Q572 566 572 561Z" fill="#fff" fill-opacity=".25" stroke="#2a1a12" stroke-width="2.2"/>
  <path d="M628 518Q644 518 644 534Q644 550 628 550" fill="none" stroke="#2a1a12" stroke-width="2.2"/>
  <path d="M579 512V552" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>
</g>
<path id="waterStream" d="M600 474V560" stroke="#cfe1e6" stroke-width="0" stroke-linecap="round"/>

<!-- shot glass on the scale -->
<g id="cup" opacity="0">
  <g clip-path="url(#c-cup)"><rect id="shotLiquid" x="712" y="563" width="56" height="0" fill="url(#g-shot)"/><rect id="shotTiger" x="712" y="563" width="56" height="0" fill="url(#p-tiger)"/></g>
  <path d="M712 502H768L764 561Q763.5 566 758.5 566H721.5Q716.5 566 716 561Z" fill="#fff" fill-opacity=".22" stroke="#2a1a12" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="M719 509L722 552" stroke="#fff" stroke-opacity=".75" stroke-width="3" stroke-linecap="round"/>
</g>
<g id="streams">
  <path id="streamL" d="M733 486V562" stroke="url(#g-stream)" stroke-width="0" stroke-linecap="round"/>
  <path id="streamR" d="M747 486V562" stroke="url(#g-stream)" stroke-width="0" stroke-linecap="round"/>
  <g id="drips"></g>
</g>

<!-- milk pitcher (cutaway window shows the milk) -->
<g id="pitcher" transform="translate(1300 600)">
  <path d="M-38 0L-33 -88Q-36 -92 -46 -98L-30 -94H32L34 -88L38 0Z" fill="url(#g-steel)" stroke="#2a1a12" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="M34 -78Q56 -74 54 -50Q52 -28 36 -24" fill="none" stroke="#2a1a12" stroke-width="7" stroke-linecap="round"/>
  <path d="M34 -78Q56 -74 54 -50Q52 -28 36 -24" fill="none" stroke="#c6cacd" stroke-width="3.6" stroke-linecap="round"/>
  <g clip-path="url(#c-pitcher)">
    <rect x="-32" y="-90" width="64" height="90" fill="#efe8dc"/>
    <rect id="milkBody" x="-32" y="-40" width="64" height="40" fill="#f2e8d8"/>
    <rect id="milkFoam" x="-32" y="-44" width="64" height="4" fill="#fbf6ee"/>
    <g id="milkBubbles" fill="#fff" stroke="#d9c6a6" stroke-width=".6"></g>
    <path id="swirl" d="M-18 -30Q0 -38 18 -30Q0 -22 -18 -30Z" fill="none" stroke="#d8c4a2" stroke-width="1.6" opacity="0"/>
  </g>
  <path d="M-27 -84H27L29 -10Q29 -6 25 -6H-25Q-29 -6 -29 -10Z" fill="none" stroke="#2a1a12" stroke-width="1.4" stroke-dasharray="4 3" opacity=".7"/>
  <!-- thermometer clipped to the rim -->
  <g id="thermo"><path d="M18 -100V-24" stroke="#8d949a" stroke-width="2.4"/><circle cx="18" cy="-108" r="11" fill="#fbf7ef" stroke="#2a1a12" stroke-width="1.8"/><path id="thermoNeedle" d="M18 -108L18 -116" stroke="#b3362b" stroke-width="1.8" stroke-linecap="round"/></g>
</g>

<!-- portafilter (moves between grinder, mat, group, knock box) -->
<g id="pf" transform="translate(150 504)">
  <g id="pfSpouts"><path d="M-14 30H14L12 40H-12Z" fill="url(#g-chrome)" stroke="#2a1a12" stroke-width="1.6"/><path d="M-10 40V47M10 40V47" stroke="#2a1a12" stroke-width="4" stroke-linecap="round"/><path d="M-10 40V47M10 40V47" stroke="#c6cacd" stroke-width="2" stroke-linecap="round"/></g>
  <path d="M-46 2H46L40 26Q0 36 -40 26Z" fill="url(#g-chrome)" stroke="#2a1a12" stroke-width="2"/>
  <path id="mound" d="M-42 0Q0 0 42 0Z" fill="#4a2c1d"/>
  <g id="moundTex" fill="#2a1a12" opacity=".5"></g>
  <rect id="puckTop" x="-42" y="1" width="84" height="4" fill="#3b2418" opacity="0"/>
  <rect x="-50" y="-3" width="100" height="7" rx="3" fill="url(#g-steel)" stroke="#2a1a12" stroke-width="1.8"/>
  <path d="M46 6L74 10V20L44 18Z" fill="url(#g-chrome)" stroke="#2a1a12" stroke-width="1.6"/>
  <path d="M72 8Q130 12 150 26Q154 33 146 36Q122 30 72 21Z" fill="url(#g-walnut)" stroke="#2a1a12" stroke-width="2" stroke-linejoin="round"/>
  <path d="M84 14Q118 18 138 27" stroke="#fff" stroke-opacity=".22" stroke-width="2" fill="none"/>
</g>

<!-- tamper -->
<g id="tamper" transform="translate(446 600)">
  <path d="M-36 -12H36V-2Q36 0 34 0H-34Q-36 0 -36 -2Z" fill="url(#g-steel)" stroke="#2a1a12" stroke-width="2"/>
  <rect x="-7" y="-36" width="14" height="25" fill="url(#g-chrome)" stroke="#2a1a12" stroke-width="1.6"/>
  <path d="M-20 -36Q-26 -60 -14 -80Q0 -94 14 -80Q26 -60 20 -36Z" fill="url(#g-walnut)" stroke="#2a1a12" stroke-width="2" stroke-linejoin="round"/>
  <path d="M-10 -44Q-15 -62 -6 -76" stroke="#fff" stroke-opacity=".3" stroke-width="3" fill="none" stroke-linecap="round"/>
</g>
<g id="tamperHit" class="hot" tabindex="-1" role="presentation"><rect x="300" y="420" width="190" height="180" fill="transparent"/></g>

<g id="fx" pointer-events="none"></g>
</svg>`;

const cuptop = `
<svg id="cuptop" viewBox="0 0 600 360" aria-hidden="true">
  <defs>
    <radialGradient id="ct-crema" cx="50%" cy="46%" r="60%"><stop offset="0" stop-color="#c88f55"/><stop offset=".65" stop-color="#a8652f"/><stop offset="1" stop-color="#6e3918"/></radialGradient>
    <radialGradient id="ct-espresso" cx="48%" cy="44%" r="62%"><stop offset="0" stop-color="#d39a5f"/><stop offset=".55" stop-color="#b06c34"/><stop offset=".9" stop-color="#7a3e1b"/><stop offset="1" stop-color="#4a2210"/></radialGradient>
    <pattern id="ct-tiger" width="18" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(-20)"><ellipse cx="6" cy="6" rx="5" ry="1.6" fill="#6b3718" opacity=".45"/><ellipse cx="14" cy="2" rx="2.4" ry=".8" fill="#f3c98e" opacity=".5"/></pattern>
    <radialGradient id="ct-milk" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="#fffaf1"/><stop offset="1" stop-color="#f1e4cf"/></radialGradient>
    <clipPath id="ct-clip"><circle id="ct-clipc" cx="300" cy="180" r="98"/></clipPath>
    <filter id="ct-soft"><feGaussianBlur stdDeviation="1.2"/></filter>
    <filter id="ct-blob"><feGaussianBlur stdDeviation="2.4"/></filter>
  </defs>
  <g id="ct-g">
  <ellipse cx="306" cy="190" rx="168" ry="164" fill="#000" opacity=".08"/>
  <circle cx="300" cy="180" r="160" fill="#efe6d8" stroke="#2a1a12" stroke-width="2.4"/>
  <circle cx="300" cy="180" r="138" fill="none" stroke="#2a1a12" stroke-opacity=".18" stroke-width="2"/>
  <path id="ct-handle" d="M402 162H448Q462 162 462 180Q462 198 448 198H402Z" fill="#f7f1e6" stroke="#2a1a12" stroke-width="2.4"/>
  <circle id="ct-cup" cx="300" cy="180" r="112" fill="#f7f1e6" stroke="#2a1a12" stroke-width="2.4"/>
  <circle cx="300" cy="180" r="100" fill="#efe5d4"/>
  <g clip-path="url(#ct-clip)">
    <circle id="ct-liquid" cx="300" cy="180" r="98" fill="url(#ct-espresso)"/>
    <circle id="ct-tigerc" cx="300" cy="180" r="98" fill="url(#ct-tiger)" opacity=".8"/>
    <circle id="ct-mixed" cx="300" cy="180" r="98" fill="#b98457" opacity="0"/>
    <g id="ct-art" filter="url(#ct-soft)"></g>
    <g id="ct-specks"></g>
  </g>
  <circle cx="300" cy="180" r="100" fill="none" stroke="#2a1a12" stroke-opacity=".25" stroke-width="2"/>
  <path d="M232 110Q262 88 300 86" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="5" stroke-linecap="round"/>
  <g id="ct-spill" fill="#b98457"></g>
  </g>
  <g id="ct-pour" opacity="0"><circle id="ct-pp" cx="300" cy="210" r="6" fill="#fffaf1"/><circle id="ct-ring" cx="300" cy="210" r="10" fill="none" stroke="#fffaf1" stroke-opacity=".6" stroke-width="2"/></g>
  <g id="ct-steam" fill="none" stroke="#7a4a2b" stroke-opacity=".25" stroke-width="5" stroke-linecap="round" opacity="0"><path d="M270 70q-12 -16 0 -32q12 -16 0 -32"/><path d="M320 64q-12 -16 0 -32q12 -16 0 -32"/></g>
</svg>`;

export default {
  id: 'bar',
  url: '/groundwork/',
  title: 'The bar',
  desc: 'Make a coffee start to finish on an espresso machine you can operate: grind, tamp, pull a shot, steam milk and pour latte art, then explore every kind of coffee and 80+ recipes.',
  script: 'bar.js',
  body: `
<div class="wrap">
  <section class="intro bar-intro" aria-labelledby="bar-h">
    <div>
      <p class="eyebrow">The bar · Hands on</p>
      <h1 class="h-xl" id="bar-h">Pull a shot.<br>Pour a coffee.</h1>
    </div>
    <p class="lede">Grind, tamp, pull, steam, pour. The machine reacts to every choice, so you can taste the difference.</p>
  </section>

  <ol class="rail" id="rail" aria-label="Steps"></ol>

  <section class="station" aria-label="Espresso machine">
    <div class="scene-wrap" id="sceneWrap">
      ${scene}
      ${cuptop}
      <div class="scene-cap" id="sceneCap" aria-hidden="true"></div>
      <div class="cam-btns"><button type="button" id="camWide" aria-label="Zoom out to see the whole bar"><svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button></div>
    </div>
    <article class="ticket panel" id="panel" aria-live="polite"></article>
  </section>

  <section class="sec" aria-labelledby="num-h">
    <div class="sec-head"><div><p class="eyebrow">Four numbers</p><h2 class="h-lg" id="num-h">The whole shot, in four numbers.</h2></div><span class="sec-num" aria-hidden="true">01</span></div>
    <div class="facts">
      <div class="fact rv"><b>18<sup>g</sup></b><p>Coffee in. A standard double <button type="button" class="term" data-term="dose">dose</button>.</p></div>
      <div class="fact rv"><b>1:2</b><p>The <button type="button" class="term" data-term="ratio">ratio</button>: 36 g of espresso out of 18 g of coffee.</p></div>
      <div class="fact rv"><b>9<sup>bar</sup></b><p>Pressure, in <button type="button" class="term" data-term="bar">bar</button>. About nine times the air around you.</p></div>
      <div class="fact rv"><b>25–30<sup>s</sup></b><p>From pump on to pump off, at 90–96 °C.</p><cite>SCA espresso definition; Clive Coffee</cite></div>
    </div>
  </section>

  <section class="sec" aria-labelledby="now-h">
    <div class="sec-head"><div><p class="eyebrow">Coffee right now</p><h2 class="h-lg" id="now-h">2026, by the cup.</h2></div><span class="sec-num" aria-hidden="true">02</span></div>
    <div class="facts">
      <div class="fact rv"><b>47<sup>%</sup></b><p>of U.S. adults had an espresso drink in the past week. A record.</p><cite>NCA National Coffee Data Trends, Fall 2026</cite></div>
      <div class="fact rv"><b>189.7<sup>M</sup></b><p>60-kg bags: the record world crop forecast for 2026/27.</p><cite>USDA FAS, July 2026</cite></div>
      <div class="fact rv"><b>$4.38</b><p>per pound: arabica's all-time high, Oct 2025. It fell 38% by June.</p><cite>ICE futures via Barchart</cite></div>
      <div class="fact rv"><b>21<sup>%</sup></b><p>of coffee drinkers had it cold yesterday, up from 16% in 2022.</p><cite>NCA, June 2026 survey</cite></div>
    </div>
  </section>

  <section class="sec" aria-labelledby="more-h">
    <div class="sec-head"><div><p class="eyebrow">Keep going</p><h2 class="h-lg" id="more-h">The rest of the shop.</h2></div><span class="sec-num" aria-hidden="true">03</span></div>
    <div class="next-up">
      <a class="door rv" href="/groundwork/menu/"><div><b>Menu</b><p>Every espresso drink is one cup and a slider.</p></div><span class="go">Kinds of coffee →</span><svg viewBox="0 0 120 120" aria-hidden="true"><path d="M30 60h56v14a26 26 0 0 1-26 26h-4a26 26 0 0 1-26-26z" fill="#f6efe3" stroke="#2a1a12" stroke-width="3"/><path d="M33 64h50" stroke="#c58a4e" stroke-width="7"/><path d="M86 66h6a10 10 0 0 1 0 20h-8" fill="none" stroke="#2a1a12" stroke-width="3"/></svg></a>
      <a class="door rv" href="/groundwork/beans/"><div><b>Beans</b><p>Species, roast, process and where it grows.</p></div><span class="go">From the farm →</span><svg viewBox="0 0 120 120" aria-hidden="true"><ellipse cx="68" cy="70" rx="26" ry="36" transform="rotate(35 68 70)" fill="#7a4a2b" stroke="#2a1a12" stroke-width="3"/><path d="M52 96c14-10 6-30 32-48" fill="none" stroke="#2a1a12" stroke-width="3"/></svg></a>
      <a class="door rv" href="/groundwork/brew/"><div><b>Brew</b><p>Pour-over, press, moka, cold brew. With a timer.</p></div><span class="go">No machine needed →</span><svg viewBox="0 0 120 120" aria-hidden="true"><path d="M30 46h60L72 82H48z" fill="#f6efe3" stroke="#2a1a12" stroke-width="3" stroke-linejoin="round"/><path d="M52 82v8h16v-8" fill="none" stroke="#2a1a12" stroke-width="3"/><path d="M40 52h40" stroke="#b3362b" stroke-width="5"/></svg></a>
      <a class="door rv" href="/groundwork/recipes/"><div><b>Recipes</b><p>80+ drinks from Hanoi to Vienna to your kitchen.</p></div><span class="go">The pass →</span><svg viewBox="0 0 120 120" aria-hidden="true"><path d="M38 30h48v66l-8-5-8 5-8-5-8 5-8-5-8 5z" fill="#fbf7ef" stroke="#2a1a12" stroke-width="3" stroke-linejoin="round"/><path d="M48 48h28M48 60h28M48 72h16" stroke="#2a1a12" stroke-width="3"/></svg></a>
    </div>
  </section>
</div>`,
};
