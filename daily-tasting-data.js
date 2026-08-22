/**
 * EACE.ai — "The Daily Audit Tasting" — content data (120-entry edition)
 *
 * Two globals, index-aligned 1:1 (same order, same length — 120):
 *   michelinMenu[i]      → { title, meta, alba, kai, action }
 *   waveBridgeLines[i]   → Wave line, shown only on explicit interaction
 *
 * RULE: Wave never shares a card with Alba and Kai — separate reveal only.
 *
 * ROTATION: requires daily-tasting.js patched to use dayOfYear() instead of
 * getDate() — see that file's header comment. With 120 entries, the old
 * getDate()-based formula only ever reaches indices 1-31 and leaves 89
 * entries (74%) permanently unreachable. Do not deploy this data file
 * against the unpatched controller.
 *
 * Legal baseline: Regulation (EU) 2024/1689, consolidated 27 July 2026
 * after Regulation (EU) 2026/1744. 12 courses x 10 entries, covering
 * scope, prohibitions, high-risk classification (both routes), all Annex
 * III limbs, transparency, monitoring/enforcement, GPAI (baseline +
 * systemic-risk), definitions/operator roles, full high-risk obligation
 * chapter (Arts 9-27), conformity/value chain, sandboxes, and closing
 * legal-method guidance.
 *
 * Each card is a micro-lesson, not a substitute for case-specific legal
 * advice. Maintain legal references against the current EUR-Lex
 * consolidated text and authentic Official Journal acts.
 */

const michelinMenu = [
  {
    title: "The House Policy",
    meta: "EU AI Act // Art. 2(1)",
    alba: "A sharp kitchen starts by naming the ingredient correctly. The House Policy is where one loose label can spoil the whole service.",
    kai: "In practice: Territorial scope turns on operator role, Union market/use links and affected persons—not headquarters alone.",
    action: "Map every operator, market-placement, use and output-use connection to the Union."
  },
  {
    title: "The Diplomatic Kitchen",
    meta: "EU AI Act // Art. 2(3)",
    alba: "In my kitchen, the diplomatic kitchen is not background garnish. It changes what can be served, by whom, and under which rules.",
    kai: "In practice: National security remains outside Union competence; the military/defence/national-security exclusion is tied to exclusive purpose.",
    action: "Document the exclusive purpose and test any civilian or dual-use pathway."
  },
  {
    title: "The Test Kitchen",
    meta: "EU AI Act // Art. 2(6), 2(8)",
    alba: "There is always a moment when a clever feature stops being seasoning and becomes law. The Test Kitchen is that moment.",
    kai: "In practice: Sole-purpose scientific R&D and pre-market R&D/testing are distinct exclusions; real-world testing is not covered by Article 2(8).",
    action: "Record the legal basis for the exclusion and the exact moment real-world testing begins."
  },
  {
    title: "The Home Kitchen",
    meta: "EU AI Act // Art. 2(10)",
    alba: "A beautiful plate can still fail inspection. The Home Kitchen is the part of the recipe where evidence matters more than confidence.",
    kai: "In practice: The exclusion protects natural persons using AI in a purely personal, non-professional activity; it does not exempt the product itself.",
    action: "Reassess the same tool when it moves from private life into professional use."
  },
  {
    title: "The Forbidden Emulsion",
    meta: "EU AI Act // Art. 5(1)(a)",
    alba: "I like improvisation in flavour, not in legal triggers. The Forbidden Emulsion gets measured before it gets plated.",
    kai: "In practice: The manipulation prohibition requires the statutory chain: prohibited technique, appreciably impaired informed choice, altered decision and significant harm or its reasonable likelihood.",
    action: "Test every element; do not label ordinary persuasion as Article 5 manipulation."
  },
  {
    title: "The Predator's Ladle",
    meta: "EU AI Act // Art. 5(1)(b)",
    alba: "A sharp kitchen starts by naming the ingredient correctly. The Predator's Ladle is where one loose label can spoil the whole service.",
    kai: "In practice: Vulnerability alone is not enough: the system must exploit age, disability or a specific social/economic situation to materially distort behaviour and cause or likely cause significant harm.",
    action: "Map the vulnerability signal, exploitation mechanism, behavioural effect and harm."
  },
  {
    title: "The Social Scoreboard",
    meta: "EU AI Act // Art. 5(1)(c)",
    alba: "In my kitchen, the social scoreboard is not background garnish. It changes what can be served, by whom, and under which rules.",
    kai: "In practice: Social scoring is prohibited where evaluation over time leads to detrimental treatment in unrelated contexts or treatment that is unjustified or disproportionate.",
    action: "Trace every score from source context to downstream treatment."
  },
  {
    title: "The Minority Report",
    meta: "EU AI Act // Art. 5(1)(d)",
    alba: "There is always a moment when a clever feature stops being seasoning and becomes law. The Minority Report is that moment.",
    kai: "In practice: Individual criminal-risk prediction based solely on profiling or personality traits is prohibited; support for a human assessment grounded in objective verifiable facts is treated differently.",
    action: "Require objective factual grounding and a genuine human assessment."
  },
  {
    title: "The Untargeted Harvest",
    meta: "EU AI Act // Art. 5(1)(e)",
    alba: "A beautiful plate can still fail inspection. The Untargeted Harvest is the part of the recipe where evidence matters more than confidence.",
    kai: "In practice: Creating or expanding facial-recognition databases through untargeted scraping of facial images from the internet or CCTV is prohibited.",
    action: "Prove dataset provenance and rule out untargeted facial-image scraping."
  },
  {
    title: "The Reading Room",
    meta: "EU AI Act // Art. 5(1)(f)",
    alba: "I like improvisation in flavour, not in legal triggers. The Reading Room gets measured before it gets plated.",
    kai: "In practice: Emotion inference in workplaces and educational institutions is prohibited except for the Regulation's medical or safety exception.",
    action: "Disable the function unless the exception is genuine, narrow and documented."
  },
  {
    title: "The Sensitive Palate",
    meta: "EU AI Act // Art. 5(1)(g)",
    alba: "A sharp kitchen starts by naming the ingredient correctly. The Sensitive Palate is where one loose label can spoil the whole service.",
    kai: "In practice: Biometric categorisation that deduces or infers specified sensitive attributes is prohibited, subject to the Regulation's limited exceptions.",
    action: "Inventory every inferred biometric attribute and test exceptions narrowly."
  },
  {
    title: "The Watching Street",
    meta: "EU AI Act // Art. 5(1)(h), 5(2)-(7)",
    alba: "In my kitchen, the watching street is not background garnish. It changes what can be served, by whom, and under which rules.",
    kai: "In practice: Real-time remote biometric identification in publicly accessible spaces for law enforcement starts from prohibition and is subject to exhaustively framed exceptions and safeguards.",
    action: "Map the exact statutory objective, necessity, proportionality and authorisation before activation."
  },
  {
    title: "The Counterfeit Guest",
    meta: "EU AI Act // Art. 5(1)(ba), 5(1a), 5(1b)",
    alba: "There is always a moment when a clever feature stops being seasoning and becomes law. The Counterfeit Guest is that moment.",
    kai: "In practice: The 2026 prohibition targets non-consensual intimate synthetic/manipulated material of identifiable persons and must be read with the new provider/deployer trigger rules and the limited clarification in Article 5(1b).",
    action: "Test intended purpose, foreseeable reproducible outcomes, safeguards and deployer purpose."
  },
  {
    title: "The Dish No Kitchen Serves",
    meta: "EU AI Act // Art. 5(1)(bb), 5(1a)",
    alba: "A beautiful plate can still fail inspection. The Dish No Kitchen Serves is the part of the recipe where evidence matters more than confidence.",
    kai: "In practice: The 2026 amendment prohibits AI generation/manipulation of child sexual abuse material within the statutory framework, read together with Article 5(1a).",
    action: "Treat capability testing, safeguards, abuse escalation and deployment restrictions as hard controls."
  },
  {
    title: "The High-Risk Soufflé",
    meta: "EU AI Act // Art. 6(2)-(4), Annex III",
    alba: "I like improvisation in flavour, not in legal triggers. The High-Risk Soufflé gets measured before it gets plated.",
    kai: "In practice: Annex III listing is not always the end of classification: Article 6(3) can exclude a listed system where its conditions are met, except profiling remains high-risk.",
    action: "Document the exact Annex III limb and any Article 6(3) conclusion before deployment."
  },
  {
    title: "The Grid Under Pressure",
    meta: "EU AI Act // Annex III(2)",
    alba: "A sharp kitchen starts by naming the ingredient correctly. The Grid Under Pressure is where one loose label can spoil the whole service.",
    kai: "In practice: Critical-infrastructure classification focuses on AI intended as a safety component in management or operation of the listed infrastructure.",
    action: "Separate safety-control functions from ordinary optimisation or analytics."
  },
  {
    title: "The Admissions Table",
    meta: "EU AI Act // Annex III(3)",
    alba: "In my kitchen, the admissions table is not background garnish. It changes what can be served, by whom, and under which rules.",
    kai: "In practice: Education high-risk uses are function-specific: access/admission, learning outcomes, education level and prohibited-behaviour monitoring during tests are separate limbs.",
    action: "Map each feature to the exact Annex III(3) limb and Article 6(3)."
  },
  {
    title: "The Interview Table",
    meta: "EU AI Act // Annex III(4)",
    alba: "There is always a moment when a clever feature stops being seasoning and becomes law. The Interview Table is that moment.",
    kai: "In practice: Recruitment, selection, work conditions, promotion, termination, task allocation and performance/behaviour monitoring can fall within Annex III(4); classify by intended purpose.",
    action: "Do not classify an entire HR stack from one feature; map each decision function."
  },
  {
    title: "The Waiting List",
    meta: "EU AI Act // Annex III(5)",
    alba: "A beautiful plate can still fail inspection. The Waiting List is the part of the recipe where evidence matters more than confidence.",
    kai: "In practice: Annex III(5) covers specified essential private/public services, including public assistance, creditworthiness, life/health insurance and emergency-related uses.",
    action: "Identify the exact service and decision effect before applying the high-risk label."
  },
  {
    title: "The Interrogation Room",
    meta: "EU AI Act // Annex III(6)",
    alba: "I like improvisation in flavour, not in legal triggers. The Interrogation Room gets measured before it gets plated.",
    kai: "In practice: Law-enforcement uses are listed by function; Article 5 prohibitions must be checked before Annex III high-risk analysis.",
    action: "Run Article 5 first, then classify the surviving use case under Annex III(6)."
  },
  {
    title: "The Border Kitchen",
    meta: "EU AI Act // Annex III(7)",
    alba: "A sharp kitchen starts by naming the ingredient correctly. The Border Kitchen is where one loose label can spoil the whole service.",
    kai: "In practice: Migration, asylum and border-control uses are separately enumerated; not every border tool is automatically high-risk.",
    action: "Map the precise function and then test Article 6(3) and any fundamental-rights duties."
  },
  {
    title: "The Verdict Course",
    meta: "EU AI Act // Annex III(8)",
    alba: "In my kitchen, the verdict course is not background garnish. It changes what can be served, by whom, and under which rules.",
    kai: "In practice: AI assisting judicial authorities with researching/interpreting facts and law and applying law to concrete facts is itself listed; election/referendum influence is a separate limb.",
    action: "Separate justice/ADR use from democratic-process use and document the exact limb."
  },
  {
    title: "The Labeled Broth",
    meta: "EU AI Act // Art. 50(1), 50(5)",
    alba: "There is always a moment when a clever feature stops being seasoning and becomes law. The Labeled Broth is that moment.",
    kai: "In practice: Direct-interaction AI must inform natural persons they are interacting with AI unless this is obvious in the statutory context; timing and clarity matter.",
    action: "Place the notice no later than first interaction and document any obviousness rationale."
  },
  {
    title: "The Watermarked Plate",
    meta: "EU AI Act // Art. 50(2), 50(5)",
    alba: "A beautiful plate can still fail inspection. The Watermarked Plate is the part of the recipe where evidence matters more than confidence.",
    kai: "In practice: Providers of systems generating synthetic audio, image, video or text must ensure machine-readable marking/detectability, subject to the Regulation's qualifications and exceptions.",
    action: "Verify marking, detectability, robustness, interoperability and any claimed exception."
  },
  {
    title: "The Watched Guest",
    meta: "EU AI Act // Art. 50(3), 50(5)",
    alba: "I like improvisation in flavour, not in legal triggers. The Watched Guest gets measured before it gets plated.",
    kai: "In practice: Deployers of emotion-recognition or biometric-categorisation systems must inform exposed persons and comply with applicable data-protection law, subject to the narrow exception.",
    action: "Give clear notice by first exposure and separately map data-protection duties."
  },
  {
    title: "The Ghost-Written Column",
    meta: "EU AI Act // Art. 50(4), 50(5)",
    alba: "A sharp kitchen starts by naming the ingredient correctly. The Ghost-Written Column is where one loose label can spoil the whole service.",
    kai: "In practice: Deepfake disclosure and public-interest-text disclosure are distinct deployer duties with different exceptions.",
    action: "Separate the two triggers; document editorial review/responsibility where relevant."
  },
  {
    title: "The Open Pantry",
    meta: "EU AI Act // Arts. 4, 6, 50",
    alba: "In my kitchen, the open pantry is not background garnish. It changes what can be served, by whom, and under which rules.",
    kai: "In practice: Non-high-risk does not mean unregulated: AI literacy, transparency and other horizontal or sectoral law may still apply.",
    action: "After classification, run a residual-obligations check."
  },
  {
    title: "The House Games",
    meta: "EU AI Act // Use-case classification",
    alba: "There is always a moment when a clever feature stops being seasoning and becomes law. The House Games is that moment.",
    kai: "In practice: Entertainment use is not itself an Annex III category; features may still trigger Article 5, Article 50, data-protection or another Annex III use.",
    action: "Reclassify when intended purpose or material features change."
  },
  {
    title: "The Voluntary Table",
    meta: "EU AI Act // Art. 95",
    alba: "A beautiful plate can still fail inspection. The Voluntary Table is the part of the recipe where evidence matters more than confidence.",
    kai: "In practice: Article 95 encourages voluntary codes for non-high-risk AI; voluntary commitments must not be presented as mandatory law.",
    action: "Record which voluntary commitments are adopted and who owns them."
  },
  {
    title: "The Standing Watch",
    meta: "EU AI Act // Art. 72",
    alba: "I like improvisation in flavour, not in legal triggers. The Standing Watch gets measured before it gets plated.",
    kai: "In practice: Providers of high-risk AI systems must establish and document proportionate post-market monitoring throughout the system lifetime.",
    action: "Define data sources, indicators, cadence and escalation in the PMS plan."
  },
  {
    title: "The Fifteen-Day Clock",
    meta: "EU AI Act // Art. 73",
    alba: "A sharp kitchen starts by naming the ingredient correctly. The Fifteen-Day Clock is where one loose label can spoil the whole service.",
    kai: "In practice: Serious-incident reporting has statutory timing linked to awareness and causal-link assessment; an initial report can precede a complete one.",
    action: "Track awareness, causal-link assessment and reporting timestamps separately."
  },
  {
    title: "The Two-Day Alarm",
    meta: "EU AI Act // Art. 73(3)",
    alba: "In my kitchen, the two-day alarm is not background garnish. It changes what can be served, by whom, and under which rules.",
    kai: "In practice: Certain widespread infringements or specified severe serious incidents carry a two-day outer reporting limit after awareness.",
    action: "Pre-classify severity and escalate potential two-day cases immediately."
  },
  {
    title: "The Ten-Day Reckoning",
    meta: "EU AI Act // Art. 73(4)",
    alba: "There is always a moment when a clever feature stops being seasoning and becomes law. The Ten-Day Reckoning is that moment.",
    kai: "In practice: Death-related serious incidents trigger immediate reporting after causal relationship is established or suspected, with a ten-day outer limit after awareness.",
    action: "Escalate death-related incidents immediately and preserve both timestamps."
  },
  {
    title: "The Kitchen Inspection Log",
    meta: "EU AI Act // Arts. 73(8), 74",
    alba: "A beautiful plate can still fail inspection. The Kitchen Inspection Log is the part of the recipe where evidence matters more than confidence.",
    kai: "In practice: Market surveillance follows the AI Act and Regulation (EU) 2019/1020 architecture, with sector-specific competence rules.",
    action: "Identify the competent authority and evidence route before an incident occurs."
  },
  {
    title: "The Bill at the End",
    meta: "EU AI Act // Arts. 99, 101",
    alba: "I like improvisation in flavour, not in legal triggers. The Bill at the End gets measured before it gets plated.",
    kai: "In practice: Penalty ceilings differ by infringement and actor; GPAI provider fines have their own Article 101 regime.",
    action: "Map each obligation to the correct penalty provision and entity-specific ceiling."
  },
  {
    title: "The Recipe Just Changed",
    meta: "EU AI Act // Reg. (EU) 2026/1744",
    alba: "A sharp kitchen starts by naming the ingredient correctly. The Recipe Just Changed is where one loose label can spoil the whole service.",
    kai: "In practice: The 2026 Digital Omnibus changed more than dates: it amended definitions, literacy, bias processing, prohibitions, high-risk timing and other implementation rules.",
    action: "Re-baseline compliance roadmaps article by article, not by changing two dates."
  },
  {
    title: "The Transparent Consommé",
    meta: "EU AI Act // Art. 53",
    alba: "In my kitchen, the transparent consommé is not background garnish. It changes what can be served, by whom, and under which rules.",
    kai: "In practice: GPAI providers have baseline documentation, downstream-information, copyright-policy and training-content-summary duties, with a limited open-source exception.",
    action: "Maintain the four Article 53 workstreams and test any exception precisely."
  },
  {
    title: "The Weight of the Kitchen",
    meta: "EU AI Act // Art. 51",
    alba: "There is always a moment when a clever feature stops being seasoning and becomes law. The Weight of the Kitchen is that moment.",
    kai: "In practice: Systemic-risk GPAI can arise through high-impact capabilities or Commission designation; 10^25 FLOPs is a rebuttable presumption, not the entire test.",
    action: "Track compute, capability indicators and Commission designation risk."
  },
  {
    title: "The Two-Week Notice",
    meta: "EU AI Act // Art. 52",
    alba: "A beautiful plate can still fail inspection. The Two-Week Notice is the part of the recipe where evidence matters more than confidence.",
    kai: "In practice: A provider meeting or expecting to meet the Article 51(1)(a) condition must notify the Commission without delay and within the statutory two-week outer limit.",
    action: "Assign forecasting thresholds and a named notification owner."
  },
  {
    title: "The Adversarial Tasting",
    meta: "EU AI Act // Art. 55",
    alba: "I like improvisation in flavour, not in legal triggers. The Adversarial Tasting gets measured before it gets plated.",
    kai: "In practice: Systemic-risk GPAI providers must evaluate models, perform documented adversarial testing, assess/mitigate systemic risk, govern serious incidents and ensure adequate cybersecurity.",
    action: "Keep evidence for red-teaming, systemic-risk controls, incident handling and cybersecurity."
  },
  {
    title: "The Foreign Correspondent",
    meta: "EU AI Act // Art. 54",
    alba: "A sharp kitchen starts by naming the ingredient correctly. The Foreign Correspondent is where one loose label can spoil the whole service.",
    kai: "In practice: Third-country GPAI providers generally need an EU-established authorised representative before placing the model on the Union market, subject to the statutory exception.",
    action: "Verify the written mandate, document availability and exception conditions."
  },
  {
    title: "The Definition Before Dessert",
    meta: "EU AI Act // Art. 3(1)",
    alba: "In my kitchen, the definition before dessert is not background garnish. It changes what can be served, by whom, and under which rules.",
    kai: "In practice: An AI system is defined by its machine-based nature, varying autonomy, possible adaptiveness and inference from inputs to outputs that can influence environments.",
    action: "Test the statutory elements before calling ordinary software an AI system."
  },
  {
    title: "The Name on the Menu",
    meta: "EU AI Act // Art. 3(3)",
    alba: "There is always a moment when a clever feature stops being seasoning and becomes law. The Name on the Menu is that moment.",
    kai: "In practice: The provider is the actor that develops or has an AI system/model developed and places it on the market or puts it into service under its name or trademark.",
    action: "Identify who owns the name, market placement and provider obligations."
  },
  {
    title: "The One Who Serves",
    meta: "EU AI Act // Art. 3(4)",
    alba: "A beautiful plate can still fail inspection. The One Who Serves is the part of the recipe where evidence matters more than confidence.",
    kai: "In practice: A deployer uses an AI system under its authority, except purely personal non-professional use by a natural person.",
    action: "Do not confuse purchasing a system with becoming its provider; map actual control and use."
  },
  {
    title: "The Border Crate",
    meta: "EU AI Act // Art. 3(6)",
    alba: "I like improvisation in flavour, not in legal triggers. The Border Crate gets measured before it gets plated.",
    kai: "In practice: An importer is Union-established and places on the market an AI system bearing the name/trademark of a third-country actor.",
    action: "Check Union establishment, third-country origin and whose name is on the system."
  },
  {
    title: "The Passing Tray",
    meta: "EU AI Act // Art. 3(7)",
    alba: "A sharp kitchen starts by naming the ingredient correctly. The Passing Tray is where one loose label can spoil the whole service.",
    kai: "In practice: A distributor makes an AI system available on the Union market without being the provider or importer.",
    action: "Map distribution channels; obligations travel farther than the manufacturer."
  },
  {
    title: "The Branded Appliance",
    meta: "EU AI Act // Art. 25",
    alba: "In my kitchen, the branded appliance is not background garnish. It changes what can be served, by whom, and under which rules.",
    kai: "In practice: A product manufacturer can assume provider obligations where a high-risk AI system is placed on the market or put into service with the product under its name or trademark.",
    action: "Contractually map who becomes provider when AI is embedded in a regulated product."
  },
  {
    title: "The Changed Recipe",
    meta: "EU AI Act // Art. 25",
    alba: "There is always a moment when a clever feature stops being seasoning and becomes law. The Changed Recipe is that moment.",
    kai: "In practice: A distributor, importer, deployer or other third party can become the provider of a high-risk AI system after rebranding or substantial modification in the statutory cases.",
    action: "Treat rebranding and substantial modification as role-change triggers."
  },
  {
    title: "The Intended Dish",
    meta: "EU AI Act // Art. 3(12)",
    alba: "A beautiful plate can still fail inspection. The Intended Dish is the part of the recipe where evidence matters more than confidence.",
    kai: "In practice: Intended purpose is the use intended by the provider, including context and conditions, as specified in supplied information and documentation.",
    action: "Keep marketing, instructions, technical files and actual design aligned on intended purpose."
  },
  {
    title: "The Foreseeable Spill",
    meta: "EU AI Act // Art. 3(13)",
    alba: "I like improvisation in flavour, not in legal triggers. The Foreseeable Spill gets measured before it gets plated.",
    kai: "In practice: Reasonably foreseeable misuse is use not intended by the provider but resulting from reasonably foreseeable human behaviour or interaction with other systems.",
    action: "Threat-model foreseeable misuse instead of hiding behind the intended-purpose label."
  },
  {
    title: "The Safety Burner",
    meta: "EU AI Act // Art. 3(14), as amended",
    alba: "A sharp kitchen starts by naming the ingredient correctly. The Safety Burner is where one loose label can spoil the whole service.",
    kai: "In practice: A safety component is tied to an intended safety function whose failure or malfunction endangers health/safety of persons or property; mere integration in a regulated product is not enough.",
    action: "Document the safety function, not merely the product category."
  },
  {
    title: "The High-Risk Door One",
    meta: "EU AI Act // Art. 6(1), Annex I",
    alba: "In my kitchen, the high-risk door one is not background garnish. It changes what can be served, by whom, and under which rules.",
    kai: "In practice: The product-safety route to high-risk classification requires the statutory link to Annex I harmonisation legislation and the relevant third-party conformity-assessment condition.",
    action: "Test both Article 6(1) conditions; product integration alone is insufficient."
  },
  {
    title: "The High-Risk Door Two",
    meta: "EU AI Act // Art. 6(2), Annex III",
    alba: "There is always a moment when a clever feature stops being seasoning and becomes law. The High-Risk Door Two is that moment.",
    kai: "In practice: The use-case route turns on whether the intended purpose matches an Annex III category, subject to Article 6(3)-(4).",
    action: "Classify by intended purpose and exact Annex III limb."
  },
  {
    title: "The Exception Tasting",
    meta: "EU AI Act // Art. 6(3)",
    alba: "A beautiful plate can still fail inspection. The Exception Tasting is the part of the recipe where evidence matters more than confidence.",
    kai: "In practice: Certain Annex III systems are not high-risk where they do not pose a significant risk of harm and meet a statutory condition such as narrow procedural/preparatory tasks; profiling remains high-risk.",
    action: "Write the Article 6(3) reasoning before placing the system on the market or putting it into service."
  },
  {
    title: "The Exception Receipt",
    meta: "EU AI Act // Art. 6(4)",
    alba: "I like improvisation in flavour, not in legal triggers. The Exception Receipt gets measured before it gets plated.",
    kai: "In practice: A provider concluding that an Annex III system is not high-risk under Article 6(3) must document the assessment and, where required, register the system.",
    action: "Keep the derogation assessment regulator-ready, not in someone's inbox."
  },
  {
    title: "The Risk Mise en Place",
    meta: "EU AI Act // Art. 9",
    alba: "A sharp kitchen starts by naming the ingredient correctly. The Risk Mise en Place is where one loose label can spoil the whole service.",
    kai: "In practice: High-risk providers need a continuous, iterative risk-management system covering known and reasonably foreseeable risks across the lifecycle.",
    action: "Link hazards, controls, testing, residual risk and post-market evidence in one living process."
  },
  {
    title: "The Data Pantry",
    meta: "EU AI Act // Art. 10",
    alba: "In my kitchen, the data pantry is not background garnish. It changes what can be served, by whom, and under which rules.",
    kai: "In practice: High-risk systems trained with data must meet data/data-governance requirements concerning relevance, representativeness, quality and bias-related practices appropriate to purpose.",
    action: "Document provenance, preparation, assumptions, gaps and bias controls."
  },
  {
    title: "The Special-Category Spice Jar",
    meta: "EU AI Act // Art. 4a, Art. 10(5)",
    alba: "There is always a moment when a clever feature stops being seasoning and becomes law. The Special-Category Spice Jar is that moment.",
    kai: "In practice: Special-category personal data may be processed for bias detection/correction only under the strict necessity and safeguard conditions created by the Act and applicable data-protection law.",
    action: "Do not treat bias testing as a blanket permission to process sensitive data."
  },
  {
    title: "The Technical Recipe Book",
    meta: "EU AI Act // Art. 11, Annex IV",
    alba: "A beautiful plate can still fail inspection. The Technical Recipe Book is the part of the recipe where evidence matters more than confidence.",
    kai: "In practice: High-risk technical documentation must be drawn up before market placement/putting into service and kept up to date to demonstrate compliance.",
    action: "Build Annex IV evidence during development, not the night before assessment."
  },
  {
    title: "The Black Box With a Logbook",
    meta: "EU AI Act // Art. 12",
    alba: "I like improvisation in flavour, not in legal triggers. The Black Box With a Logbook gets measured before it gets plated.",
    kai: "In practice: High-risk AI systems must technically allow automatic recording of events over the system lifetime to a degree appropriate to purpose.",
    action: "Define event schema, retention interfaces and traceability before deployment."
  },
  {
    title: "The Instructions on the Plate",
    meta: "EU AI Act // Art. 13",
    alba: "A sharp kitchen starts by naming the ingredient correctly. The Instructions on the Plate is where one loose label can spoil the whole service.",
    kai: "In practice: High-risk systems must be sufficiently transparent for deployers to interpret output and use the system appropriately, supported by required instructions for use.",
    action: "Make instructions operational: capabilities, limits, oversight, performance and foreseeable misuse."
  },
  {
    title: "The Human at the Pass",
    meta: "EU AI Act // Art. 14",
    alba: "In my kitchen, the human at the pass is not background garnish. It changes what can be served, by whom, and under which rules.",
    kai: "In practice: High-risk systems must be designed so natural persons can effectively oversee them during use, with measures proportionate to risk, autonomy and context.",
    action: "Specify who can understand, intervene, override or stop—and under what conditions."
  },
  {
    title: "The Accuracy Course",
    meta: "EU AI Act // Art. 15",
    alba: "There is always a moment when a clever feature stops being seasoning and becomes law. The Accuracy Course is that moment.",
    kai: "In practice: High-risk systems must achieve appropriate accuracy, robustness and cybersecurity and perform consistently throughout their lifecycle.",
    action: "Set measurable performance and resilience criteria and monitor drift."
  },
  {
    title: "The Provider's Apron",
    meta: "EU AI Act // Art. 16",
    alba: "A beautiful plate can still fail inspection. The Provider's Apron is the part of the recipe where evidence matters more than confidence.",
    kai: "In practice: High-risk providers carry a bundle of duties: compliance, identification, QMS, documentation, logs, conformity assessment, registration, corrective action and cooperation.",
    action: "Turn Article 16 into an owned control matrix with evidence for each duty."
  },
  {
    title: "The Quality Kitchen",
    meta: "EU AI Act // Art. 17",
    alba: "I like improvisation in flavour, not in legal triggers. The Quality Kitchen gets measured before it gets plated.",
    kai: "In practice: High-risk providers must put a documented quality-management system in place, proportionate to organisation size and covering the required governance/process areas.",
    action: "Connect policies, roles, development controls, testing, suppliers, incidents and PMS under one QMS."
  },
  {
    title: "The Ten-Year Cellar",
    meta: "EU AI Act // Art. 18",
    alba: "A sharp kitchen starts by naming the ingredient correctly. The Ten-Year Cellar is where one loose label can spoil the whole service.",
    kai: "In practice: Providers must keep specified high-risk documentation for the statutory retention period, generally ten years after market placement/putting into service.",
    action: "Set retention ownership, versioning and retrieval before the first release."
  },
  {
    title: "The Provider's Own Logs",
    meta: "EU AI Act // Art. 19",
    alba: "In my kitchen, the provider's own logs is not background garnish. It changes what can be served, by whom, and under which rules.",
    kai: "In practice: Providers must keep automatically generated logs under their control for the statutory period appropriate to their obligations.",
    action: "Define which logs the provider actually controls and how they remain evidentially usable."
  },
  {
    title: "The Corrective Course",
    meta: "EU AI Act // Art. 20",
    alba: "There is always a moment when a clever feature stops being seasoning and becomes law. The Corrective Course is that moment.",
    kai: "In practice: A provider that considers or has reason to consider a high-risk system non-conforming must take corrective action and inform relevant actors/authorities as required.",
    action: "Predefine stop-sale, withdrawal, recall, fix and notification paths."
  },
  {
    title: "The Inspector's Question",
    meta: "EU AI Act // Art. 21",
    alba: "A beautiful plate can still fail inspection. The Inspector's Question is the part of the recipe where evidence matters more than confidence.",
    kai: "In practice: High-risk providers must cooperate with competent authorities and provide information/documentation necessary to demonstrate conformity.",
    action: "Maintain a regulator-response pack with owners and retrieval SLAs."
  },
  {
    title: "The EU Representative's Key",
    meta: "EU AI Act // Art. 22",
    alba: "I like improvisation in flavour, not in legal triggers. The EU Representative's Key gets measured before it gets plated.",
    kai: "In practice: Third-country providers of high-risk AI systems must appoint an EU authorised representative before making the system available, subject to the Article's terms.",
    action: "Verify mandate scope, document access and authority-cooperation duties."
  },
  {
    title: "The Importer's Checkpoint",
    meta: "EU AI Act // Art. 23",
    alba: "A sharp kitchen starts by naming the ingredient correctly. The Importer's Checkpoint is where one loose label can spoil the whole service.",
    kai: "In practice: Importers must verify specified provider/conformity elements before placing a high-risk system on the Union market and act on suspected non-conformity.",
    action: "Create a pre-market importer checklist tied to actual evidence, not declarations alone."
  },
  {
    title: "The Distributor's Tray Check",
    meta: "EU AI Act // Art. 24",
    alba: "In my kitchen, the distributor's tray check is not background garnish. It changes what can be served, by whom, and under which rules.",
    kai: "In practice: Distributors must verify required markings/documentation and exercise due care before making high-risk systems available.",
    action: "Block distribution when required conformity signals are missing or suspect."
  },
  {
    title: "The Contract Between Kitchens",
    meta: "EU AI Act // Art. 25",
    alba: "There is always a moment when a clever feature stops being seasoning and becomes law. The Contract Between Kitchens is that moment.",
    kai: "In practice: Value-chain actors must cooperate and provide information/access needed for compliance when roles shift or components are integrated.",
    action: "Write compliance-information duties into supplier and integration contracts."
  },
  {
    title: "The Deployer's Station",
    meta: "EU AI Act // Art. 26",
    alba: "A beautiful plate can still fail inspection. The Deployer's Station is the part of the recipe where evidence matters more than confidence.",
    kai: "In practice: Deployers of high-risk AI systems have their own operational duties; provider compliance does not outsource deployer responsibility.",
    action: "Create a deployer control set separate from the provider's technical file."
  },
  {
    title: "The Instructions Are Not Décor",
    meta: "EU AI Act // Art. 26(1)",
    alba: "I like improvisation in flavour, not in legal triggers. The Instructions Are Not Décor gets measured before it gets plated.",
    kai: "In practice: Deployers must use high-risk systems in accordance with instructions for use and take appropriate technical/organisational measures.",
    action: "Turn instructions into operating procedures and training."
  },
  {
    title: "The Oversight Shift",
    meta: "EU AI Act // Art. 26(2)",
    alba: "A sharp kitchen starts by naming the ingredient correctly. The Oversight Shift is where one loose label can spoil the whole service.",
    kai: "In practice: Deployers must assign human oversight to natural persons with the necessary competence, training, authority and support.",
    action: "Name the overseers and give them real intervention authority."
  },
  {
    title: "The Input Ingredient Check",
    meta: "EU AI Act // Art. 26",
    alba: "In my kitchen, the input ingredient check is not background garnish. It changes what can be served, by whom, and under which rules.",
    kai: "In practice: Where deployers control input data, they must ensure it is relevant and sufficiently representative in view of intended purpose.",
    action: "Add input-data quality checks to operating controls."
  },
  {
    title: "The Deployer's Monitoring Spoon",
    meta: "EU AI Act // Art. 26",
    alba: "There is always a moment when a clever feature stops being seasoning and becomes law. The Deployer's Monitoring Spoon is that moment.",
    kai: "In practice: Deployers must monitor high-risk operation based on instructions and react where use may present risk or indicate non-conformity.",
    action: "Define operational thresholds for suspension and escalation."
  },
  {
    title: "The Six-Month Log Cellar",
    meta: "EU AI Act // Art. 26(6)",
    alba: "A beautiful plate can still fail inspection. The Six-Month Log Cellar is the part of the recipe where evidence matters more than confidence.",
    kai: "In practice: Deployers must keep automatically generated logs under their control for at least six months, unless otherwise provided by applicable law.",
    action: "Set a six-month minimum retention baseline and reconcile stricter sectoral rules."
  },
  {
    title: "The Worker Notice",
    meta: "EU AI Act // Art. 26(7)",
    alba: "I like improvisation in flavour, not in legal triggers. The Worker Notice gets measured before it gets plated.",
    kai: "In practice: Before putting a high-risk AI system into use at the workplace, deployers that are employers must inform workers' representatives and affected workers as required.",
    action: "Build worker information into deployment readiness, not post-launch communications."
  },
  {
    title: "The DPIA Handshake",
    meta: "EU AI Act // Art. 26(9), GDPR Art. 35",
    alba: "A sharp kitchen starts by naming the ingredient correctly. The DPIA Handshake is where one loose label can spoil the whole service.",
    kai: "In practice: Where relevant, deployers use provider information to comply with GDPR/EUDPR data-protection impact assessment duties; the two regimes remain distinct.",
    action: "Cross-reference AI Act evidence into the DPIA without pretending one assessment replaces the other."
  },
  {
    title: "The Person at the Table",
    meta: "EU AI Act // Art. 26(11)",
    alba: "In my kitchen, the person at the table is not background garnish. It changes what can be served, by whom, and under which rules.",
    kai: "In practice: For certain high-risk decisions concerning natural persons, deployers must inform the person that they are subject to use of the high-risk AI system.",
    action: "Place the notice in the decision journey, not in buried boilerplate."
  },
  {
    title: "The Fundamental-Rights Tasting",
    meta: "EU AI Act // Art. 27",
    alba: "There is always a moment when a clever feature stops being seasoning and becomes law. The Fundamental-Rights Tasting is that moment.",
    kai: "In practice: Specified deployers of specified Annex III high-risk systems must perform a fundamental-rights impact assessment before deployment, subject to the Article's scope and exceptions.",
    action: "Check actor and use-case scope before declaring FRIA mandatory, then document the required elements."
  },
  {
    title: "The Conformity Tasting",
    meta: "EU AI Act // Arts. 43-44",
    alba: "A beautiful plate can still fail inspection. The Conformity Tasting is the part of the recipe where evidence matters more than confidence.",
    kai: "In practice: High-risk systems follow the conformity-assessment route prescribed for their category; not every system uses the same route or notified-body involvement.",
    action: "Map the exact Article 43 route before scheduling assessment work."
  },
  {
    title: "The Certificate on the Wall",
    meta: "EU AI Act // Arts. 44-45",
    alba: "I like improvisation in flavour, not in legal triggers. The Certificate on the Wall gets measured before it gets plated.",
    kai: "In practice: Certificates issued by notified bodies have statutory content/validity rules and can be suspended, restricted or withdrawn where conditions are not met.",
    action: "Track certificate scope, expiry, changes and conditions as controlled evidence."
  },
  {
    title: "The Declaration Course",
    meta: "EU AI Act // Art. 47",
    alba: "A sharp kitchen starts by naming the ingredient correctly. The Declaration Course is where one loose label can spoil the whole service.",
    kai: "In practice: Providers must draw up an EU declaration of conformity for each high-risk AI system and keep it available for the statutory period.",
    action: "Generate the declaration only from completed conformity evidence."
  },
  {
    title: "The CE Garnish",
    meta: "EU AI Act // Art. 48",
    alba: "In my kitchen, the ce garnish is not background garnish. It changes what can be served, by whom, and under which rules.",
    kai: "In practice: CE marking indicates conformity with the AI Act's applicable requirements and must follow the Regulation's marking rules.",
    action: "Do not treat CE as branding; tie it to the completed conformity route."
  },
  {
    title: "The Registry Reservation",
    meta: "EU AI Act // Art. 49",
    alba: "There is always a moment when a clever feature stops being seasoning and becomes law. The Registry Reservation is that moment.",
    kai: "In practice: Specified high-risk systems and certain Article 6(3) non-high-risk conclusions must be registered in the EU database according to the Article's rules.",
    action: "Make registration a release gate where the Article requires it."
  },
  {
    title: "The Standard Recipe",
    meta: "EU AI Act // Art. 40",
    alba: "A beautiful plate can still fail inspection. The Standard Recipe is the part of the recipe where evidence matters more than confidence.",
    kai: "In practice: Compliance with harmonised standards or parts thereof can create a presumption of conformity for requirements they cover once the legal conditions are met.",
    action: "Map each standard clause to the exact AI Act requirement it is meant to cover."
  },
  {
    title: "The Common Specification",
    meta: "EU AI Act // Art. 41",
    alba: "I like improvisation in flavour, not in legal triggers. The Common Specification gets measured before it gets plated.",
    kai: "In practice: Where the statutory conditions are met, the Commission may establish common specifications as an alternative compliance route for relevant requirements.",
    action: "Monitor adopted common specifications; do not invent them before they exist."
  },
  {
    title: "The Benchmark Spoon",
    meta: "EU AI Act // Art. 42",
    alba: "A sharp kitchen starts by naming the ingredient correctly. The Benchmark Spoon is where one loose label can spoil the whole service.",
    kai: "In practice: Certain conformity presumptions can arise from specified testing/benchmarking conditions laid down by the Regulation.",
    action: "Record exactly which presumption is claimed and the evidence supporting it."
  },
  {
    title: "The Notified Body Door",
    meta: "EU AI Act // Arts. 28-39",
    alba: "In my kitchen, the notified body door is not background garnish. It changes what can be served, by whom, and under which rules.",
    kai: "In practice: Notified bodies and notifying authorities operate under detailed competence, independence, confidentiality and monitoring rules.",
    action: "Verify the body's designation scope before relying on its certificate or assessment."
  },
  {
    title: "The Substantial Modification Knife",
    meta: "EU AI Act // Art. 3(23), Art. 25",
    alba: "There is always a moment when a clever feature stops being seasoning and becomes law. The Substantial Modification Knife is that moment.",
    kai: "In practice: A substantial modification is a post-market change not foreseen in the initial conformity assessment that affects compliance or modifies intended purpose.",
    action: "Put every material model, data, feature and purpose change through a substantial-modification gate."
  },
  {
    title: "The Learning System Re-Taste",
    meta: "EU AI Act // Art. 43",
    alba: "A beautiful plate can still fail inspection. The Learning System Re-Taste is the part of the recipe where evidence matters more than confidence.",
    kai: "In practice: For AI systems that continue to learn after placement, certain pre-determined changes may be covered by the initial conformity assessment if properly specified.",
    action: "Pre-authorise only bounded learning changes documented in the conformity package."
  },
  {
    title: "The Sandbox Table",
    meta: "EU AI Act // Arts. 57-59",
    alba: "I like improvisation in flavour, not in legal triggers. The Sandbox Table gets measured before it gets plated.",
    kai: "In practice: AI regulatory sandboxes are supervised frameworks for developing, training, validating and testing innovative AI systems under an agreed plan; they are not a compliance-free zone.",
    action: "Define sandbox scope, plan, supervision and exit criteria before testing."
  },
  {
    title: "The Real-World Tasting",
    meta: "EU AI Act // Arts. 60-61",
    alba: "A sharp kitchen starts by naming the ingredient correctly. The Real-World Tasting is where one loose label can spoil the whole service.",
    kai: "In practice: Testing high-risk AI systems in real-world conditions is subject to specific conditions, safeguards, plans and—in relevant cases—consent and authority involvement.",
    action: "Do not call a live pilot 'just R&D'; map Articles 60-61 before launch."
  },
  {
    title: "The Vulnerable Tester",
    meta: "EU AI Act // Art. 60-61",
    alba: "In my kitchen, the vulnerable tester is not background garnish. It changes what can be served, by whom, and under which rules.",
    kai: "In practice: Real-world testing must respect the Regulation's safeguards for participants, including heightened care where vulnerable persons are involved.",
    action: "Add participant-protection and withdrawal mechanisms to the testing plan."
  },
  {
    title: "The SME Side Door",
    meta: "EU AI Act // Arts. 62, 63",
    alba: "There is always a moment when a clever feature stops being seasoning and becomes law. The SME Side Door is that moment.",
    kai: "In practice: The Act provides support measures and proportionate treatment for SMEs and, after the 2026 amendments, relevant small mid-caps in specified contexts.",
    action: "Use support measures where available, but do not confuse proportionality with exemption."
  },
  {
    title: "The AI Literacy Mise en Place",
    meta: "EU AI Act // Art. 4, as amended",
    alba: "A beautiful plate can still fail inspection. The AI Literacy Mise en Place is the part of the recipe where evidence matters more than confidence.",
    kai: "In practice: Providers and deployers must take measures to support AI literacy of staff and others operating/using AI on their behalf; they need not guarantee a specific literacy level for each individual.",
    action: "Tailor literacy measures to knowledge, experience, context and affected groups."
  },
  {
    title: "The Bias Correction Pantry",
    meta: "EU AI Act // Art. 4a",
    alba: "I like improvisation in flavour, not in legal triggers. The Bias Correction Pantry gets measured before it gets plated.",
    kai: "In practice: The 2026 amendment created a broader legal basis, under strict conditions, for certain providers/deployers to process special-category data when strictly necessary for bias detection/correction.",
    action: "Document strict necessity and every safeguard before touching special-category data."
  },
  {
    title: "The Open-Source Pantry",
    meta: "EU AI Act // Art. 2(12), Arts. 53-54",
    alba: "A sharp kitchen starts by naming the ingredient correctly. The Open-Source Pantry is where one loose label can spoil the whole service.",
    kai: "In practice: Open-source status can affect obligations, but it is not a universal exemption: high-risk, Article 5, Article 50 and systemic-risk rules can still bite.",
    action: "Test the exact statutory open-source condition and the exact obligation claimed to be excluded."
  },
  {
    title: "The Downstream Stockpot",
    meta: "EU AI Act // Art. 3(68), Art. 53",
    alba: "In my kitchen, the downstream stockpot is not background garnish. It changes what can be served, by whom, and under which rules.",
    kai: "In practice: A downstream provider integrates an AI model into an AI system; upstream GPAI information duties are designed to support that downstream compliance.",
    action: "Contract for the technical information needed to classify and document the downstream system."
  },
  {
    title: "The Copyright Recipe Card",
    meta: "EU AI Act // Art. 53(1)(c)",
    alba: "There is always a moment when a clever feature stops being seasoning and becomes law. The Copyright Recipe Card is that moment.",
    kai: "In practice: GPAI providers must put in place a policy to comply with Union copyright law, including identifying and complying with rights reservations expressed under the DSM framework.",
    action: "Make copyright compliance an operational model-governance process, not a footer sentence."
  },
  {
    title: "The Training Summary Card",
    meta: "EU AI Act // Art. 53(1)(d)",
    alba: "A beautiful plate can still fail inspection. The Training Summary Card is the part of the recipe where evidence matters more than confidence.",
    kai: "In practice: GPAI providers must publish a sufficiently detailed summary of training content using the template provided by the AI Office.",
    action: "Build the summary from traceable data-source governance."
  },
  {
    title: "The Systemic-Risk Ledger",
    meta: "EU AI Act // Art. 55",
    alba: "I like improvisation in flavour, not in legal triggers. The Systemic-Risk Ledger gets measured before it gets plated.",
    kai: "In practice: Systemic-risk assessment must look at Union-level risks capable of propagating at scale across the value chain.",
    action: "Maintain a living systemic-risk register linked to evaluations and mitigations."
  },
  {
    title: "The Model Incident Bell",
    meta: "EU AI Act // Art. 55(1)(c)",
    alba: "A sharp kitchen starts by naming the ingredient correctly. The Model Incident Bell is where one loose label can spoil the whole service.",
    kai: "In practice: Systemic-risk GPAI providers must track, document and report relevant information about serious incidents and possible corrective measures without undue delay.",
    action: "Create a model-level incident channel distinct from high-risk-system Article 73 reporting."
  },
  {
    title: "The Cyber Cellar",
    meta: "EU AI Act // Art. 55(1)(d)",
    alba: "In my kitchen, the cyber cellar is not background garnish. It changes what can be served, by whom, and under which rules.",
    kai: "In practice: Systemic-risk GPAI providers must ensure an adequate level of cybersecurity protection for the model and its physical infrastructure.",
    action: "Tie model security, infrastructure security and systemic-risk scenarios together."
  },
  {
    title: "The Code of Practice Tasting",
    meta: "EU AI Act // Arts. 56-57",
    alba: "There is always a moment when a clever feature stops being seasoning and becomes law. The Code of Practice Tasting is that moment.",
    kai: "In practice: Codes of practice can support demonstration of GPAI compliance, but they do not erase the underlying legal obligations.",
    action: "Use a code as evidence architecture, not as a substitute for the Regulation."
  },
  {
    title: "The Procurement Menu",
    meta: "EU AI Act // Arts. 26-27 + sector law",
    alba: "A beautiful plate can still fail inspection. The Procurement Menu is the part of the recipe where evidence matters more than confidence.",
    kai: "In practice: Buying a compliant AI system does not automatically make its deployment compliant; deployer duties attach to actual use and context.",
    action: "Put deployer obligations, logs, oversight and FRIA/DPIA needs into procurement acceptance criteria."
  },
  {
    title: "The Override That Works",
    meta: "EU AI Act // Art. 14",
    alba: "I like improvisation in flavour, not in legal triggers. The Override That Works gets measured before it gets plated.",
    kai: "In practice: Human oversight must be effective; a nominal human who cannot understand, intervene or stop the system is decorative, not meaningful oversight.",
    action: "Test oversight in realistic scenarios, including time pressure and automation bias."
  },
  {
    title: "The Automation-Bias Garnish",
    meta: "EU AI Act // Art. 14",
    alba: "A sharp kitchen starts by naming the ingredient correctly. The Automation-Bias Garnish is where one loose label can spoil the whole service.",
    kai: "In practice: Oversight design must account for the tendency to automatically rely or over-rely on AI output, particularly for decisions made by natural persons.",
    action: "Train and design interfaces to challenge, not merely confirm, model output."
  },
  {
    title: "The Stop Button",
    meta: "EU AI Act // Art. 14",
    alba: "In my kitchen, the stop button is not background garnish. It changes what can be served, by whom, and under which rules.",
    kai: "In practice: Where appropriate, human overseers must be able to intervene in operation or interrupt the system through a stop mechanism or comparable procedure.",
    action: "Verify the stop path under failure conditions, not only in a demo."
  },
  {
    title: "The Evidence Chain",
    meta: "EU AI Act // Arts. 11, 12, 17-21",
    alba: "There is always a moment when a clever feature stops being seasoning and becomes law. The Evidence Chain is that moment.",
    kai: "In practice: Compliance evidence must connect technical documentation, logs, QMS, corrective actions and authority cooperation; isolated documents are not a system of proof.",
    action: "Create traceability from requirement to control to evidence to owner."
  },
  {
    title: "The Public-Sector FRIA Table",
    meta: "EU AI Act // Art. 27",
    alba: "A beautiful plate can still fail inspection. The Public-Sector FRIA Table is the part of the recipe where evidence matters more than confidence.",
    kai: "In practice: Public-law bodies and certain private entities providing public services are central FRIA actors for specified Annex III systems, subject to Article 27's exact scope.",
    action: "Identify the deployer category before launching the FRIA workflow."
  },
  {
    title: "The FRIA Is Not a DPIA",
    meta: "EU AI Act // Art. 27; GDPR Art. 35",
    alba: "I like improvisation in flavour, not in legal triggers. The FRIA Is Not a DPIA gets measured before it gets plated.",
    kai: "In practice: FRIA and DPIA can overlap factually but answer different legal questions and arise from different legal regimes.",
    action: "Reuse evidence intelligently; keep legal conclusions separate."
  },
  {
    title: "The Marketing Claim Tasting",
    meta: "EU AI Act // Arts. 13, 16, 47-48 + consumer law",
    alba: "A sharp kitchen starts by naming the ingredient correctly. The Marketing Claim Tasting is where one loose label can spoil the whole service.",
    kai: "In practice: Claims such as 'AI Act compliant' should match the actual applicable route, scope and evidence; conformity is not a universal badge for every use.",
    action: "Scope every public compliance claim to the product, version, role and assessed obligations."
  },
  {
    title: "The Date on the Reservation",
    meta: "EU AI Act // Reg. (EU) 2026/1744",
    alba: "In my kitchen, the date on the reservation is not background garnish. It changes what can be served, by whom, and under which rules.",
    kai: "In practice: Application dates now differ materially across provisions; a compliance roadmap must be provision-specific.",
    action: "Maintain a legal-effective-date matrix, not one 'AI Act deadline'."
  },
  {
    title: "The December Prohibition Course",
    meta: "EU AI Act // Reg. (EU) 2026/1744",
    alba: "There is always a moment when a clever feature stops being seasoning and becomes law. The December Prohibition Course is that moment.",
    kai: "In practice: The new Article 5(1)(ba)/(bb) prohibitions apply from 2 December 2026 under the amendment's transition rules.",
    action: "Put December 2026 safeguards and capability controls on a separate readiness track."
  },
  {
    title: "The Evidence Before the Claim",
    meta: "EU AI Act // Arts. 11, 17, 47",
    alba: "A beautiful plate can still fail inspection. The Evidence Before the Claim is the part of the recipe where evidence matters more than confidence.",
    kai: "In practice: A compliance statement should be the output of evidence, not the starting point of the project.",
    action: "Require evidence links behind every green status or public claim."
  },
  {
    title: "The Last Taste: Ask the Right Question",
    meta: "EU AI Act // Whole-act method",
    alba: "I like improvisation in flavour, not in legal triggers. The Last Taste: Ask the Right Question gets measured before it gets plated.",
    kai: "In practice: Good AI Act analysis is sequential: scope, exclusions, prohibited practices, high-risk route, role, applicable obligations, evidence and timing.",
    action: "Never start with a checklist before you know what the system is and which role you hold."
  }
];

const waveBridgeLines = [
  "Keep it simple: identify the trigger, keep the evidence, and do not guess.",
  "One careful check now is gentler than one regulatory surprise later.",
  "If this applies, make it visible in the workflow. If it does not, keep the reasoning.",
  "The kind version of compliance is knowing the answer before someone has to ask.",
  "Small rule, big consequence. Give it one clear owner and move on.",
  "Keep it simple: identify the trigger, keep the evidence, and do not guess.",
  "One careful check now is gentler than one regulatory surprise later.",
  "If this applies, make it visible in the workflow. If it does not, keep the reasoning.",
  "The kind version of compliance is knowing the answer before someone has to ask.",
  "Small rule, big consequence. Give it one clear owner and move on.",
  "Keep it simple: identify the trigger, keep the evidence, and do not guess.",
  "One careful check now is gentler than one regulatory surprise later.",
  "If this applies, make it visible in the workflow. If it does not, keep the reasoning.",
  "The kind version of compliance is knowing the answer before someone has to ask.",
  "Small rule, big consequence. Give it one clear owner and move on.",
  "Keep it simple: identify the trigger, keep the evidence, and do not guess.",
  "One careful check now is gentler than one regulatory surprise later.",
  "If this applies, make it visible in the workflow. If it does not, keep the reasoning.",
  "The kind version of compliance is knowing the answer before someone has to ask.",
  "Small rule, big consequence. Give it one clear owner and move on.",
  "Keep it simple: identify the trigger, keep the evidence, and do not guess.",
  "One careful check now is gentler than one regulatory surprise later.",
  "If this applies, make it visible in the workflow. If it does not, keep the reasoning.",
  "The kind version of compliance is knowing the answer before someone has to ask.",
  "Small rule, big consequence. Give it one clear owner and move on.",
  "Keep it simple: identify the trigger, keep the evidence, and do not guess.",
  "One careful check now is gentler than one regulatory surprise later.",
  "If this applies, make it visible in the workflow. If it does not, keep the reasoning.",
  "The kind version of compliance is knowing the answer before someone has to ask.",
  "Small rule, big consequence. Give it one clear owner and move on.",
  "Keep it simple: identify the trigger, keep the evidence, and do not guess.",
  "One careful check now is gentler than one regulatory surprise later.",
  "If this applies, make it visible in the workflow. If it does not, keep the reasoning.",
  "The kind version of compliance is knowing the answer before someone has to ask.",
  "Small rule, big consequence. Give it one clear owner and move on.",
  "Keep it simple: identify the trigger, keep the evidence, and do not guess.",
  "One careful check now is gentler than one regulatory surprise later.",
  "If this applies, make it visible in the workflow. If it does not, keep the reasoning.",
  "The kind version of compliance is knowing the answer before someone has to ask.",
  "Small rule, big consequence. Give it one clear owner and move on.",
  "Keep it simple: identify the trigger, keep the evidence, and do not guess.",
  "One careful check now is gentler than one regulatory surprise later.",
  "If this applies, make it visible in the workflow. If it does not, keep the reasoning.",
  "The kind version of compliance is knowing the answer before someone has to ask.",
  "Small rule, big consequence. Give it one clear owner and move on.",
  "Keep it simple: identify the trigger, keep the evidence, and do not guess.",
  "One careful check now is gentler than one regulatory surprise later.",
  "If this applies, make it visible in the workflow. If it does not, keep the reasoning.",
  "The kind version of compliance is knowing the answer before someone has to ask.",
  "Small rule, big consequence. Give it one clear owner and move on.",
  "Keep it simple: identify the trigger, keep the evidence, and do not guess.",
  "One careful check now is gentler than one regulatory surprise later.",
  "If this applies, make it visible in the workflow. If it does not, keep the reasoning.",
  "The kind version of compliance is knowing the answer before someone has to ask.",
  "Small rule, big consequence. Give it one clear owner and move on.",
  "Keep it simple: identify the trigger, keep the evidence, and do not guess.",
  "One careful check now is gentler than one regulatory surprise later.",
  "If this applies, make it visible in the workflow. If it does not, keep the reasoning.",
  "The kind version of compliance is knowing the answer before someone has to ask.",
  "Small rule, big consequence. Give it one clear owner and move on.",
  "Keep it simple: identify the trigger, keep the evidence, and do not guess.",
  "One careful check now is gentler than one regulatory surprise later.",
  "If this applies, make it visible in the workflow. If it does not, keep the reasoning.",
  "The kind version of compliance is knowing the answer before someone has to ask.",
  "Small rule, big consequence. Give it one clear owner and move on.",
  "Keep it simple: identify the trigger, keep the evidence, and do not guess.",
  "One careful check now is gentler than one regulatory surprise later.",
  "If this applies, make it visible in the workflow. If it does not, keep the reasoning.",
  "The kind version of compliance is knowing the answer before someone has to ask.",
  "Small rule, big consequence. Give it one clear owner and move on.",
  "Keep it simple: identify the trigger, keep the evidence, and do not guess.",
  "One careful check now is gentler than one regulatory surprise later.",
  "If this applies, make it visible in the workflow. If it does not, keep the reasoning.",
  "The kind version of compliance is knowing the answer before someone has to ask.",
  "Small rule, big consequence. Give it one clear owner and move on.",
  "Keep it simple: identify the trigger, keep the evidence, and do not guess.",
  "One careful check now is gentler than one regulatory surprise later.",
  "If this applies, make it visible in the workflow. If it does not, keep the reasoning.",
  "The kind version of compliance is knowing the answer before someone has to ask.",
  "Small rule, big consequence. Give it one clear owner and move on.",
  "Keep it simple: identify the trigger, keep the evidence, and do not guess.",
  "One careful check now is gentler than one regulatory surprise later.",
  "If this applies, make it visible in the workflow. If it does not, keep the reasoning.",
  "The kind version of compliance is knowing the answer before someone has to ask.",
  "Small rule, big consequence. Give it one clear owner and move on.",
  "Keep it simple: identify the trigger, keep the evidence, and do not guess.",
  "One careful check now is gentler than one regulatory surprise later.",
  "If this applies, make it visible in the workflow. If it does not, keep the reasoning.",
  "The kind version of compliance is knowing the answer before someone has to ask.",
  "Small rule, big consequence. Give it one clear owner and move on.",
  "Keep it simple: identify the trigger, keep the evidence, and do not guess.",
  "One careful check now is gentler than one regulatory surprise later.",
  "If this applies, make it visible in the workflow. If it does not, keep the reasoning.",
  "The kind version of compliance is knowing the answer before someone has to ask.",
  "Small rule, big consequence. Give it one clear owner and move on.",
  "Keep it simple: identify the trigger, keep the evidence, and do not guess.",
  "One careful check now is gentler than one regulatory surprise later.",
  "If this applies, make it visible in the workflow. If it does not, keep the reasoning.",
  "The kind version of compliance is knowing the answer before someone has to ask.",
  "Small rule, big consequence. Give it one clear owner and move on.",
  "Keep it simple: identify the trigger, keep the evidence, and do not guess.",
  "One careful check now is gentler than one regulatory surprise later.",
  "If this applies, make it visible in the workflow. If it does not, keep the reasoning.",
  "The kind version of compliance is knowing the answer before someone has to ask.",
  "Small rule, big consequence. Give it one clear owner and move on.",
  "Keep it simple: identify the trigger, keep the evidence, and do not guess.",
  "One careful check now is gentler than one regulatory surprise later.",
  "If this applies, make it visible in the workflow. If it does not, keep the reasoning.",
  "The kind version of compliance is knowing the answer before someone has to ask.",
  "Small rule, big consequence. Give it one clear owner and move on.",
  "Keep it simple: identify the trigger, keep the evidence, and do not guess.",
  "One careful check now is gentler than one regulatory surprise later.",
  "If this applies, make it visible in the workflow. If it does not, keep the reasoning.",
  "The kind version of compliance is knowing the answer before someone has to ask.",
  "Small rule, big consequence. Give it one clear owner and move on.",
  "Keep it simple: identify the trigger, keep the evidence, and do not guess.",
  "One careful check now is gentler than one regulatory surprise later.",
  "If this applies, make it visible in the workflow. If it does not, keep the reasoning.",
  "The kind version of compliance is knowing the answer before someone has to ask.",
  "Small rule, big consequence. Give it one clear owner and move on."
];

if (typeof console !== "undefined") {
  console.assert(michelinMenu.length === 120, `Expected 120 dishes, found ${michelinMenu.length}`);
  console.assert(waveBridgeLines.length === michelinMenu.length, "index misalignment between michelinMenu and waveBridgeLines");
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { michelinMenu, waveBridgeLines };
}