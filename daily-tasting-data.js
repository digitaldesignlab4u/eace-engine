/**
 * EACE.ai — "The Daily Audit Tasting" — content data
 *
 * Two globals, index-aligned 1:1 (same order, same length — 40):
 *   michelinMenu[i]      → { title, meta, alba, kai, action }
 *   waveBridgeLines[i]   → plain-language "what this means for you" string
 *
 * RULE: Wave never shares a card with Alba and Kai — it renders only on
 * explicit "what does this mean for me?" interaction. See daily-tasting.js.
 *
 * Legal source: Regulation (EU) 2024/1689 (EU AI Act), as amended by
 * Regulation (EU) 2026/1744 (Digital Omnibus on AI, OJ 24.7.2026, in force
 * 27.7.2026). Verified against the consolidated EUR-Lex text (CELEX
 * 32026R1744) prior to implementation — see PR description for the
 * verification note. Reordering or resizing either array breaks the other's
 * index alignment.
 */

const michelinMenu = [

  // ============ LEVEL 1 — TERRITORIAL SCOPE (4) ============
  {
    title: "The House Policy (Territorial Scope)",
    meta: "EU AI Act // Article 2(1)",
    alba: "My maître d' does not ask where you flew in from. He asks one question: does the dish land on a table inside this house? If your output reaches a guest in the Union, you follow house rules the moment it crosses the threshold.",
    kai: "Article 2(1) establishes extraterritorial scope — it binds providers placing a system on the Union market regardless of establishment, deployers located in the Union, and third-country providers/deployers whose output is used in the Union.",
    action: "Map every AI system by output-consumption geography, not by legal-entity headquarters."
  },
  {
    title: "The Diplomatic Kitchen (Military & Defence Exclusion)",
    meta: "EU AI Act // Article 2(3)",
    alba: "Some kitchens answer to a different authority entirely. Military service is not on my menu, and I don't pretend to inspect it.",
    kai: "Article 2(3) excludes AI systems developed or used exclusively for military, defence, or national-security purposes from the Regulation's scope, regardless of which actor carries out the activity.",
    action: "Confirm exclusive military/defence purpose is documented before relying on this carve-out — mixed civilian/defence use does not qualify."
  },
  {
    title: "The Test Kitchen (Research Exclusion)",
    meta: "EU AI Act // Article 2(6), Article 2(8)",
    alba: "A test kitchen that never serves a paying guest doesn't need a health inspection — but the day you plate it for someone real, the exemption ends at the door.",
    kai: "Article 2(6) excludes systems developed and put into service solely for scientific research and development. Article 2(8) excludes research/testing/development activity prior to placing on the market — but real-world testing on actual subjects removes this exclusion.",
    action: "Log the exact moment a research system moves to real-world testing on people; that is when obligations begin."
  },
  {
    title: "The Home Kitchen (Personal Use Exemption)",
    meta: "EU AI Act // Article 2(10)",
    alba: "What you cook for yourself at home is your own business. Nobody's inspecting a family dinner.",
    kai: "Article 2(10) exempts natural persons using AI systems in a purely personal, non-professional capacity from deployer obligations.",
    action: "This exemption attaches to the deployer's capacity, not the system — the same system used professionally by someone else remains fully in scope."
  },

  // ============ LEVEL 2 — PROHIBITED PRACTICES (9) ============
  {
    title: "The Forbidden Emulsion",
    meta: "EU AI Act // Article 5(1)(a)",
    alba: "If a system secretly manipulates a guest through subliminal technique, that isn't cuisine — it's poisoning the table and calling it a tasting menu.",
    kai: "Article 5(1)(a) prohibits subliminal or purposefully manipulative/deceptive techniques that materially distort behaviour and are reasonably likely to cause significant harm.",
    action: "Audit input vectors and optimisation objectives for these patterns before any other classification step runs."
  },
  {
    title: "The Predator's Ladle",
    meta: "EU AI Act // Article 5(1)(b)",
    alba: "Exploiting a hungry guest's desperation isn't hospitality — it's the oldest trick in a bad kitchen's book.",
    kai: "Article 5(1)(b) prohibits exploiting vulnerabilities tied to age, disability, or a specific social or economic situation, with the objective or effect of materially distorting behaviour causing significant harm.",
    action: "Review targeting logic for correlation with protected vulnerability signals, not just demographic proxies."
  },
  {
    title: "The Social Scoreboard",
    meta: "EU AI Act // Article 5(1)(c)",
    alba: "A restaurant that blacklists you for something you did in a different city, in a different context, has stopped serving food and started keeping a ledger of sins.",
    kai: "Article 5(1)(c) prohibits social scoring — evaluating people by social behaviour or personal traits leading to detrimental treatment unrelated or disproportionate to the original context.",
    action: "Flag any scoring system whose output crosses context boundaries."
  },
  {
    title: "The Minority Report",
    meta: "EU AI Act // Article 5(1)(d)",
    alba: "Judging someone for a crime they haven't committed, based on nothing but their profile, is a dish this kitchen refuses to plate. Ever.",
    kai: "Article 5(1)(d) prohibits risk assessments predicting criminal offending based solely on profiling or personality traits — except supporting a human assessment already grounded in objective, verifiable facts.",
    action: "Confirm any risk-scoring tool augments a documented human fact-based assessment; it cannot stand alone."
  },
  {
    title: "The Untargeted Harvest",
    meta: "EU AI Act // Article 5(1)(e)",
    alba: "Harvesting a guest's likeness without them ever walking through the door isn't sourcing ingredients. It's theft with a search engine.",
    kai: "Article 5(1)(e) prohibits creating or expanding facial recognition databases through untargeted scraping of facial images from the internet or CCTV.",
    action: "Confirm no training or reference dataset was built by untargeted image collection."
  },
  {
    title: "The Reading Room",
    meta: "EU AI Act // Article 5(1)(f)",
    alba: "A chef who reads a diner's face to sell them dessert is charming. A chef who reads an employee's face to decide who gets fired is something else entirely.",
    kai: "Article 5(1)(f) prohibits AI emotion-inference systems in the workplace and educational institutions, except for medical or safety reasons.",
    action: "Disable emotion-detection features in HR or classroom tooling unless a documented medical/safety basis exists."
  },
  {
    title: "The Sensitive Palate",
    meta: "EU AI Act // Article 5(1)(g)",
    alba: "What a guest believes, worships, or votes for is not an ingredient I'm permitted to taste for.",
    kai: "Article 5(1)(g) prohibits biometric categorisation systems inferring race, political opinion, trade union membership, religious belief, sex life, or sexual orientation — narrow exceptions exist for labelling lawfully acquired datasets and for law enforcement.",
    action: "Verify any biometric-categorisation feature does not infer these attribute classes, even as a by-product."
  },
  {
    title: "The Watching Street",
    meta: "EU AI Act // Article 5(1)(h)",
    alba: "A street under permanent, silent surveillance is not a dining room. It's an interrogation, and this kitchen won't run one without a warrant-grade reason.",
    kai: "Article 5(1)(h) prohibits real-time remote biometric identification in publicly accessible spaces for law enforcement, subject to narrow exceptions — targeted search for specific victims, prevention of a specific and substantial imminent threat, or locating a suspect of specified serious crimes, under strict authorisation.",
    action: "Confirm any live-RBI deployment has documented, case-specific authorisation before activation, not a standing policy."
  },
  {
    title: "The Counterfeit Guest",
    meta: "EU AI Act // Article 5(1)(ba) — inserted by Regulation (EU) 2026/1744",
    alba: "Serving a guest a face that was never given to us, in a way they never agreed to, is the single worst thing that can leave this kitchen. There is no recipe that makes that acceptable, and as of this winter, there is no legal grey area left either.",
    kai: "Regulation (EU) 2026/1744, Article 1(7), inserts new point (ba) — and a parallel CSAM point (bb) — into Article 5(1), prohibiting AI systems that generate or manipulate realistic intimate imagery of an identifiable person without freely-given, specific, informed, unambiguous and explicit consent. Liability attaches where such output is the system's intended purpose, or a reasonably foreseeable, easily reproducible outcome absent adequate safeguards. Effective 2 December 2026.",
    action: "Review generative image/video/audio features for this exposure now, and document refusal training and content filtering as safe-harbour evidence."
  },

  // ============ LEVEL 3 — HIGH-RISK SYSTEMS (8) ============
  {
    title: "The High-Risk Soufflé (Biometrics)",
    meta: "EU AI Act // Annex III(1)",
    alba: "Biometric identification is a soufflé under pressure. One structural error and the whole thing collapses in front of the inspector.",
    kai: "Annex III(1) covers remote biometric identification (excluding pure 1:1 verification), biometric categorisation by sensitive attribute, and emotion recognition outside the Article 5 workplace/education ban.",
    action: "Confirm whether the system performs 1:many identification or categorisation, not verification — that distinction decides Annex III applicability."
  },
  {
    title: "The Grid Under Pressure (Critical Infrastructure)",
    meta: "EU AI Act // Annex III(2)",
    alba: "A kitchen with no water pressure and no gas line doesn't serve dinner. It serves an incident report.",
    kai: "Annex III(2) covers AI used as a safety component in critical digital infrastructure, road traffic, or water/gas/heating/electricity supply.",
    action: "Verify whether the system is a genuine safety component versus a monitoring/analytics layer with no control authority."
  },
  {
    title: "The Admissions Table (Education)",
    meta: "EU AI Act // Annex III(3)",
    alba: "Deciding who gets a seat at the table, and who is quietly turned away, is the single most consequential decision a host can make.",
    kai: "Annex III(3) covers systems used for admission decisions, evaluating learning outcomes, assessing appropriate education level, or monitoring prohibited exam behaviour.",
    action: "Map every admissions, grading, and proctoring tool against these four sub-categories individually."
  },
  {
    title: "The Interview Table (Employment)",
    meta: "EU AI Act // Annex III(4)",
    alba: "Deciding who gets hired, promoted, or let go on the strength of an algorithm's judgment is a decision made in someone's kitchen, about someone's livelihood.",
    kai: "Annex III(4) covers recruitment/selection, decisions on work-related terms, promotion/termination, task allocation, and performance monitoring.",
    action: "Treat CV-screening, ranking, and workplace-monitoring tools as presumptively in scope pending an Article 6(3) exception review."
  },
  {
    title: "The Waiting List (Essential Services)",
    meta: "EU AI Act // Annex III(5)",
    alba: "Telling a guest they can't afford the meal, based on a model they've never seen, is a decision that deserves the same scrutiny as the meal itself.",
    kai: "Annex III(5) covers eligibility for public assistance benefits, creditworthiness/credit scoring, life and health insurance risk pricing, and emergency-call dispatch prioritisation.",
    action: "Confirm credit and insurance-pricing models are inventoried under this category, including third-party scoring APIs."
  },
  {
    title: "The Interrogation Room (Law Enforcement)",
    meta: "EU AI Act // Annex III(6)",
    alba: "A kitchen that decides guilt before the trial has stopped cooking and started sentencing.",
    kai: "Annex III(6) covers risk assessment for offending or reoffending, polygraph-type tools, evidence-reliability evaluation, victim risk assessment, and profiling in detection, investigation, or prosecution.",
    action: "Confirm law-enforcement-facing tools are classified per sub-use, since polygraph-type and evidence-evaluation functions carry distinct obligations."
  },
  {
    title: "The Border Kitchen (Migration & Asylum)",
    meta: "EU AI Act // Annex III(7)",
    alba: "Deciding who is welcome and who is turned away at the door is a decision no kitchen takes lightly — least of all one where the stakes are someone's safety.",
    kai: "Annex III(7) covers polygraph-type tools, risk assessment for irregular migration/security/health risk, examination of asylum/visa applications, and detection tools used in the migration context.",
    action: "Confirm any migration-facing risk tool is reviewed against the Article 27 fundamental-rights impact obligations, not just the base Article 9–15 set."
  },
  {
    title: "The Verdict Course (Administration of Justice)",
    meta: "EU AI Act // Annex III(8)",
    alba: "Helping the judge read faster is one thing. Helping the judge decide is another — and this kitchen only serves the first course.",
    kai: "Annex III(8) covers AI assisting judicial authorities in researching and interpreting facts and law, and AI intended to influence the outcome of an election, referendum, or voting behaviour.",
    action: "Confirm legal-research tools are scoped to assistance rather than outcome-influencing recommendation to avoid classification ambiguity."
  },

  // ============ LEVEL 4 — TRANSPARENCY (4) ============
  {
    title: "The Labeled Broth (AI Interaction Disclosure)",
    meta: "EU AI Act // Article 50(1)",
    alba: "If the voice on the other end is not human, say so before the first exchange — not buried in a footnote.",
    kai: "Article 50(1) requires providers of systems intended to interact directly with natural persons to disclose the interaction is with an AI system, unless obvious from context.",
    action: "Audit every conversational interface for an undisclosed AI-mediated interaction point."
  },
  {
    title: "The Watermarked Plate (Synthetic Content Marking)",
    meta: "EU AI Act // Article 50(2)",
    alba: "A dish built entirely from synthetic ingredients should say so on the menu — not dressed up to look like something it isn't.",
    kai: "Article 50(2) requires machine-readable marking, detectable as artificially generated or manipulated, for synthetic audio, image, video, and text output. Regulation (EU) 2026/1744 requires providers whose systems were already on the market before 2 August 2026 to comply by 2 December 2026.",
    action: "Confirm your grace-period eligibility depends on your system's market-placement date, not a blanket extension."
  },
  {
    title: "The Watched Guest (Emotion/Biometric Disclosure)",
    meta: "EU AI Act // Article 50(3)",
    alba: "If I'm reading a guest's face to understand them, they deserve to know I'm looking.",
    kai: "Article 50(3) requires deployers of emotion-recognition or biometric-categorisation systems to inform exposed natural persons of the system's operation.",
    action: "Confirm disclosure occurs before or at the point of exposure, not retroactively."
  },
  {
    title: "The Ghost-Written Column (Public-Interest Content Disclosure)",
    meta: "EU AI Act // Article 50(4)",
    alba: "A guest reading tonight's news deserves to know whether it was written by a person or a machine wearing a person's byline.",
    kai: "Article 50(4) requires disclosure that text published to inform the public on matters of public interest was artificially generated, unless the content underwent human editorial review with a person holding editorial responsibility.",
    action: "Confirm editorial-review workflows are documented for any AI-assisted publishing pipeline claiming this exception."
  },

  // ============ LEVEL 5 — MINIMAL RISK (3) ============
  {
    title: "The Open Pantry (Minimal-Risk Baseline)",
    meta: "EU AI Act // General Classification",
    alba: "Not every ingredient needs a certificate of provenance pinned to it. Most of what leaves the pass is simply competent cooking.",
    kai: "Spam filters, most recommender functions, and similar tools without Annex III classification fall outside mandatory obligations.",
    action: "Document the classification reasoning, not just the conclusion — \"not high-risk\" needs a paper trail too."
  },
  {
    title: "The House Games (Entertainment Tools)",
    meta: "EU AI Act // Minimal-Risk, Illustrative",
    alba: "A game is a game. Nobody needs a risk-management system to enjoy dessert.",
    kai: "AI-enabled video games generally sit outside high-risk and transparency tiers unless they generate synthetic content covered by Article 50(2) or process biometric data.",
    action: "Re-check classification if the game adds generative avatars, voice synthesis, or biometric input."
  },
  {
    title: "The Voluntary Table (Codes of Conduct)",
    meta: "EU AI Act // Article 95",
    alba: "Not every kitchen needs an inspector to cook honestly. Some hold themselves to the standard anyway, because it's good practice, not because someone is watching.",
    kai: "Article 95 encourages — without mandating — voluntary codes of conduct for minimal-risk systems, particularly on transparency and environmental sustainability.",
    action: "Record adoption of any voluntary code as a governance artefact; it shortens the response if the system is later reclassified."
  },

  // ============ LEVEL 6 — GOVERNANCE, MONITORING, ENFORCEMENT (7) ============
  {
    title: "The Standing Watch (Post-Market Monitoring)",
    meta: "EU AI Act // Article 72",
    alba: "A kitchen doesn't stop tasting once the dish leaves the pass. You keep tasting, every service, for as long as the dish is on the menu.",
    kai: "Article 72 requires providers of high-risk systems to maintain a post-market monitoring system proportionate to the AI technology and risks involved.",
    action: "Build the monitoring plan into the technical documentation before deployment, not as a retrofit."
  },
  {
    title: "The 15-Day Clock (Serious Incident Reporting)",
    meta: "EU AI Act // Article 73(2)",
    alba: "When something breaks in service, you don't wait for the perfect explanation before telling the front of house. You say what you know, when you know it.",
    kai: "Article 73(2) requires reporting to the market surveillance authority without undue delay, and no later than 15 days after becoming aware of a serious incident — an incomplete initial report is permitted.",
    action: "Build an incident register with the reporting clock attached at first credible signal, not after root-cause analysis."
  },
  {
    title: "The Two-Day Alarm (Widespread Infringement)",
    meta: "EU AI Act // Article 73(3)",
    alba: "Some fires you call in immediately, before you've even found the extinguisher.",
    kai: "Article 73(3) shortens the reporting window to 2 days for a widespread infringement or a serious and irreversible disruption of critical infrastructure.",
    action: "Pre-classify incident severity tiers in your response playbook so the 2-day clock is recognised at triage."
  },
  {
    title: "The Ten-Day Reckoning (Death)",
    meta: "EU AI Act // Article 73(4)",
    alba: "Some things you never wait on. You report the moment the link is established, and the deadline exists only as a hard outer limit, not a target.",
    kai: "Article 73(4) sets a 10-day reporting deadline where a serious incident may have caused a person's death, running from when the causal link is established or reasonably suspected.",
    action: "Ensure this tier is escalated directly to legal and executive leadership, bypassing standard triage queues."
  },
  {
    title: "The Kitchen Inspection Log (Enforcement Architecture)",
    meta: "EU AI Act // Chapter VII, Article 73(8)",
    alba: "Every serious kitchen keeps a logbook the inspector can seize without warning. A spotless dining room means nothing if the log behind the pass is empty.",
    kai: "Chapter VII establishes the AI Office, the European Artificial Intelligence Board, and national competent authorities; market surveillance authorities must act on incident reports within 7 days of receipt (Art. 73(8), applying Art. 19 of Regulation (EU) 2019/1020).",
    action: "Identify your relevant national market surveillance authority before an incident occurs, not during one."
  },
  {
    title: "The Bill at the End (Penalties)",
    meta: "EU AI Act // Article 99, Article 101",
    alba: "Every kitchen eventually gets the bill for how it was run. Some bills are survivable. Some end the restaurant.",
    kai: "Article 99 tiers penalties: up to €35M or 7% of worldwide turnover for Article 5 violations; up to €15M or 3% for other obligations including high-risk and Article 50 breaches; up to €7.5M or 1% for misleading information to authorities. Article 101 sets a parallel €15M/3% ceiling for GPAI-provider violations, enforced by the Commission.",
    action: "Classify internal risk registers by these exact penalty tiers, not a single generic \"non-compliance\" bucket."
  },
  {
    title: "The Recipe Just Changed (Digital Omnibus)",
    meta: "Regulation (EU) 2026/1744",
    alba: "Even the finest kitchen occasionally rewrites its own menu mid-season. The standard didn't lower. The service date moved.",
    kai: "Regulation (EU) 2026/1744, in force since 27 July 2026, deferred the Annex III standalone high-risk deadline from 2 August 2026 to 2 December 2027, and the Annex I embedded high-risk deadline to 2 August 2028. Article 5 prohibitions, Article 4 AI literacy, and the Article 50 transparency timeline were not deferred.",
    action: "Re-baseline every compliance roadmap against the amended dates immediately — this is a scheduling correction, not a scope reduction."
  },

  // ============ LEVEL 7 — GPAI OBLIGATIONS (5) ============
  {
    title: "The Transparent Consommé (GPAI Baseline Obligations)",
    meta: "EU AI Act // Article 53(1)",
    alba: "A proper consommé is perfectly clear. You see straight to the bottom of the bowl. Show your ingredients, or leave the kitchen.",
    kai: "Article 53(1) requires GPAI providers to maintain technical documentation, provide information to downstream integrators, establish a Union-copyright-compliant policy, and publish a training-content summary using the AI Office template.",
    action: "Generate a machine-readable training-provenance manifest before publication."
  },
  {
    title: "The Weight of the Kitchen (Systemic-Risk Classification)",
    meta: "EU AI Act // Article 51",
    alba: "Some kitchens serve a neighbourhood. Some serve a nation. The bigger the kitchen, the heavier the obligation — and you don't get to decide which one you're running.",
    kai: "Article 51(2) presumes high-impact capability, and therefore systemic-risk classification, where cumulative training compute exceeds 10²⁵ FLOPs; the Commission may also designate a model by decision under Article 51(1)(b) and Annex XIII criteria.",
    action: "Track cumulative training compute (including fine-tuning and RLHF phases) as a standing metric, not a one-time calculation."
  },
  {
    title: "The Two-Week Notice (Systemic-Risk Notification)",
    meta: "EU AI Act // Article 52",
    alba: "The moment you know your kitchen has grown too large to serve quietly, you tell the authority — you don't wait for them to notice first.",
    kai: "Providers must notify the Commission without delay, and in any event within two weeks, after the systemic-risk criterion is met or becomes foreseeable.",
    action: "Assign explicit ownership of this notification trigger before compute budgets approach the threshold."
  },
  {
    title: "The Adversarial Tasting (Systemic-Risk Obligations)",
    meta: "EU AI Act // Article 55",
    alba: "A kitchen this size doesn't just cook the dish. It tries to break it first, deliberately, before anyone else can.",
    kai: "Article 55 adds model evaluation with adversarial testing, systemic-risk assessment and mitigation, serious-incident tracking and reporting to the AI Office, and cybersecurity protection for the model and infrastructure.",
    action: "Document red-teaming methodology and results as part of the standing technical file, not a one-off pre-release exercise."
  },
  {
    title: "The Foreign Correspondent (Authorised Representative)",
    meta: "EU AI Act // Article 54",
    alba: "If you're going to serve this dining room from a kitchen abroad, someone local has to be able to answer the door when the inspector knocks.",
    kai: "Article 54 requires non-EU GPAI providers to appoint, by written mandate, an authorised representative established in the Union before placing the model on the market, able to produce Article 53 technical documentation to the AI Office on request, retained for 10 years after market placement.",
    action: "Confirm the mandate is documented in writing and the retention clock is tracked from the model's EU market-placement date."
  }

];

const waveBridgeLines = [
  // Level 1 — Territorial Scope
  "First question, always: does this even apply to you? Check that before anything else — everything downstream depends on it.",
  "Defence and national-security AI plays by different rules entirely. If that's not your system, keep reading the rest of the menu.",
  "Pure research gets a pass — until it touches a real person. That's the line to watch, not the label on the project.",
  "Using AI for yourself, not your business? Most of this menu doesn't apply to you at all.",

  // Level 2 — Prohibited Practices
  "This one's a hard stop, not a maybe. If your system is anywhere near this line, that's the only thing to fix first.",
  "Targeting someone because they're struggling is the kind of 'personalization' that's actually banned outright.",
  "If your scoring system follows someone from one context into an unrelated one, that's the red flag here.",
  "Predicting someone's crime before it happens, based on a profile alone, isn't policing — it's guessing with legal cover, and it's banned.",
  "Scraping faces off the internet to build a recognition tool isn't a shortcut. It's the exact thing this article exists to stop.",
  "Reading emotions at work or in school sounds harmless until you ask what the reading gets used for.",
  "If biometric data ends up inferring someone's religion or politics, that's not a side effect — that's the prohibited part.",
  "Live facial recognition on a public street needs a genuinely serious reason, documented in advance, not a standing camera.",
  "This is the newest addition to the list — added in 2026, banned from December. If you touch generative image or video tools, read this one twice.",

  // Level 3 — High-Risk
  "This is the long list — most compliance work lives here. Worth checking Annex III before assuming you're not on it.",
  "If your AI helps run power, water, or traffic systems, the bar is set by what happens when it fails, not what it does when it works.",
  "Admissions, grading, and exam monitoring are all separately checked here — being fine on one doesn't clear the others.",
  "Hiring, firing, promotion — if AI touches any of it, assume high-risk until proven otherwise.",
  "Credit scores and insurance pricing decided by AI carry the same weight here as biometric systems do.",
  "AI used by police for evidence or risk assessment gets checked function by function, not as one big category.",
  "Migration and asylum tools sit in the highest-scrutiny bracket for a reason — the stakes for the person on the other end are enormous.",
  "AI helping judges research is fine. AI nudging the outcome is a different conversation entirely.",

  // Level 4 — Transparency
  "Small fix, easy to miss: if a person is talking to your AI, they need to know it's AI. That's most of this level.",
  "AI-generated images and audio need a machine-readable mark saying so — think of it as an ingredient label, not a watermark for show.",
  "If you're reading someone's face or category with AI, telling them isn't optional courtesy — it's the requirement.",
  "AI-written news content needs a human editor in the loop, or it needs to say it was AI-written. Pick one.",

  // Level 5 — Minimal Risk
  "Not every tool needs a compliance file. If you land here, the work is optional — but optional isn't the same as ignored.",
  "Games are usually fine — right up until they start generating realistic synthetic content or reading biometric input.",
  "Doing the right thing without being told to is still worth writing down. Future-you will thank present-you.",

  // Level 6 — Governance
  "This is the part that keeps mattering after launch. Worth setting up once, properly, instead of scrambling later.",
  "If something goes wrong, the clock starts the moment you find out — not when you've figured out why it happened.",
  "Some incidents get two days, not fifteen. Know which kind you're dealing with before it happens, not during.",
  "If an incident may have caused someone's death, this jumps straight to the top of everyone's inbox — as it should.",
  "Knowing who to call before you need to call them saves the fifteen minutes you don't have during an actual incident.",
  "The fines are tiered on purpose — worth knowing which tier your risk actually sits in, not just that fines exist.",
  "The deadline moved in 2026. If your plan still says 'August 2026' for high-risk systems, it's out of date — update it, don't panic about it.",

  // Level 7 — GPAI
  "Different track entirely — this is about the model itself, not what you built on top of it.",
  "There's a real number that decides whether you're in the heavier tier. Know your compute, not just your ambition.",
  "If you cross that number, the clock to tell the Commission is two weeks — mark it before you get close, not after.",
  "The biggest models have to try to break themselves on purpose, before anyone else gets the chance.",
  "Building a frontier model outside the EU? You still need someone inside it who can answer for the paperwork."
];
