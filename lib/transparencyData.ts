// ─────────────────────────────────────────────────────────────────────────────
// TaxEasy — State Constituency Budget Transparency Data
// Compliant with current 2025/2026 State Budget Projections
// ─────────────────────────────────────────────────────────────────────────────

export interface BudgetCategory {
  name: string;
  amount: number;
  description: string;
}

export interface LgaAllocation {
  name: string;
  allocation: number;
  focus: string;
}

export interface StateBudgetData {
  state: string;
  year: number;
  totalBudget: number;
  categories: BudgetCategory[];
  lgas: LgaAllocation[];
}

export const transparencyData: StateBudgetData[] = [
  {
    state: "Lagos",
    year: 2026,
    totalBudget: 3005000000000, // 3.005 Trillion
    categories: [
      { name: "Infrastructure", amount: 1205000000000, description: "Metro rail projects (Blue/Red/Green lines), fourth mainland bridge pathing, and primary arterial roads." },
      { name: "Education", amount: 590000000000, description: "Renovation of public secondary schools, state university bursaries, and smart-classroom digitisation." },
      { name: "Health", amount: 480000000000, description: "Lagos State University Teaching Hospital (LASUTH) expansion and 50 new primary health centres." },
      { name: "Security", amount: 250000000000, description: "LCC surveillance expansion, security trust fund grants, and rapid response squad logistics." },
      { name: "Agriculture", amount: 210000000000, description: "Imota Rice Mill expansion, youth aquaculture grants, and Eko agro-allied supply chains." },
      { name: "Environment", amount: 270000000000, description: "Dredging of drainage systems, waste-to-energy projects, and coastal erosion control." }
    ],
    lgas: [
      { name: "Ikeja", allocation: 65000000000, focus: "Tech hub upgrades, streetlights, and drainage" },
      { name: "Alimosho", allocation: 88000000000, focus: "Primary healthcare clinics, school expansions, and link bridges" },
      { name: "Ikorodu", allocation: 55000000000, focus: "Agricultural storage, modern markets, and jetty construction" },
      { name: "Lagos Island", allocation: 48000000000, focus: "Urban renewal, historic building drainage, and high-street security" }
    ]
  },
  {
    state: "Abuja FCT",
    year: 2026,
    totalBudget: 1280000000000, // 1.28 Trillion
    categories: [
      { name: "Infrastructure", amount: 620000000000, description: "Expansion of outer southern expressway, FCT rail mass transit operations, and district water supply." },
      { name: "Security", amount: 240000000000, description: "Centralised CCTV command centres, police patrol vehicles, and capital guard installations." },
      { name: "Health", amount: 190000000000, description: "Gwarinpa General Hospital upgrades and Abuja-wide rural ambulance dispatch." },
      { name: "Education", amount: 160000000000, description: "FCT College of Education expansion and primary school technology equipment." },
      { name: "Environment", amount: 70000000000, description: "City waste management recycling loops and national park maintenance." }
    ],
    lgas: [
      { name: "Abuja Municipal", allocation: 95000000000, focus: "Diplomatic zone security, road paving, and city park cleaning" },
      { name: "Bwari", allocation: 48000000000, focus: "Rural health centres, clean water boreholes, and school blocks" },
      { name: "Gwagwalada", allocation: 42000000000, focus: "Sewerage construction, market road access, and youth training centres" }
    ]
  },
  {
    state: "Rivers",
    year: 2026,
    totalBudget: 950000000000, // 950 Billion
    categories: [
      { name: "Infrastructure", amount: 410000000000, description: "Dualization of coastal bypasses, rural-urban link bridges, and port access roads." },
      { name: "Health", amount: 190000000000, description: "Rivers State University Teaching Hospital upgrades and rural maternal health kits." },
      { name: "Education", amount: 155000000000, description: "Tertiary school research grants, vocational training institutes, and primary school rehabilitation." },
      { name: "Environment", amount: 105000000000, description: "Oil spill remediation advocacy, flood control channels, and ecological reserves." },
      { name: "Security", amount: 90000000000, description: "Waterways security gunboats, joint security patrols, and coastal watch logistics." }
    ],
    lgas: [
      { name: "Port Harcourt", allocation: 72000000000, focus: "Flyovers, modern drainage systems, and green open parks" },
      { name: "Obio-Akpor", allocation: 68000000000, focus: "Markets renovation, community sanitation, and general hospital upgrade" },
      { name: "Bonny", allocation: 45000000000, focus: "Jetty terminals, marine policing support, and power mini-grids" }
    ]
  },
  {
    state: "Delta",
    year: 2026,
    totalBudget: 905000000000, // 905 Billion
    categories: [
      { name: "Infrastructure", amount: 390000000000, description: "Asaba airport runway extension, flyovers at Effurun, and swamp land bridge structures." },
      { name: "Education", amount: 175000000000, description: "Three new state universities upgrades, teacher recruitment, and primary school renovation." },
      { name: "Health", amount: 160000000000, description: "Delta State Contributory Health Scheme subsidies and secondary hospital equipment." },
      { name: "Agriculture", amount: 95000000000, description: "Cassava processing plants, palm oil cluster grants, and mechanized tractor leasing." },
      { name: "Security", amount: 85000000000, description: "Anti-kidnapping squads funding, riverine security patrols, and community vigilante support." }
    ],
    lgas: [
      { name: "Asaba / Oshimili South", allocation: 58000000000, focus: "Stormwater channels, government secretariat roads, and schools" },
      { name: "Warri South", allocation: 62000000000, focus: "Jetty upgrades, swamp drainage, and market solar-lighting installation" },
      { name: "Uvwie", allocation: 44000000000, focus: "Urban road repair, primary health centre, and vocational labs" }
    ]
  },
  {
    state: "Kano",
    year: 2026,
    totalBudget: 520000000000, // 520 Billion
    categories: [
      { name: "Education", amount: 170000000000, description: "Free school feeding programs, girl-child education initiatives, and Almajiri modern schools." },
      { name: "Health", amount: 115000000000, description: "Polio immunization schemes, primary health clinic rebuilding, and free maternal drugs." },
      { name: "Agriculture", amount: 105000000000, description: "Tiga dam canal extensions, subsidized fertilizer distributions, and grain reserve storehouses." },
      { name: "Infrastructure", amount: 90000000000, description: "Kano-Katsina road dualization, flyover upgrades, and city water treatment facilities." },
      { name: "Security", amount: 40000000000, description: "Border surveillance systems, vigilante command coordination, and police support." }
    ],
    lgas: [
      { name: "Kano Municipal", allocation: 38000000000, focus: "Market reconstruction, sanitary drainage, and street solar lighting" },
      { name: "Dala", allocation: 28000000000, focus: "Maternal clinic expansion, school science labs, and water pipelines" },
      { name: "Fagge", allocation: 32000000000, focus: "SME business park roads, primary schools, and clean water wells" }
    ]
  },
  {
    state: "Oyo",
    year: 2026,
    totalBudget: 480000000000, // 480 Billion
    categories: [
      { name: "Infrastructure", amount: 180000000000, description: "Ibadan circular road construction, rural farm-to-market feeder roads, and light-up Oyo expansion." },
      { name: "Education", amount: 125000000000, description: "LAUTECH multi-campus upgrades, public school renovation, and free notebooks distribution." },
      { name: "Agriculture", amount: 80000000000, description: "Fashola Agribusiness hub expansion, tractor hire subsidies, and cassava value chain grants." },
      { name: "Health", amount: 55000000000, description: "Ring Road State Hospital renovation, medical officer staffing, and rural healthcare kits." },
      { name: "Security", amount: 40000000000, description: "Amotekun Corps vehicles procurement, security communication systems, and state police funds." }
    ],
    lgas: [
      { name: "Ibadan North", allocation: 32000000000, focus: "Urban asphalt paving, community health centres, and university roads" },
      { name: "Ogbomosho North", allocation: 19000000000, focus: "Agribusiness support, secondary school renovations, and borehole water" },
      { name: "Akinyele", allocation: 22000000000, focus: "Dry port access roads, agricultural transport, and primary clinic equipment" }
    ]
  },
  {
    state: "Enugu",
    year: 2026,
    totalBudget: 410000000000, // 410 Billion
    categories: [
      { name: "Infrastructure", amount: 175000000000, description: "Enugu smart-city roads, clean tap water project network, and state highway repairs." },
      { name: "Education", amount: 95000000000, description: "Premium basic education smart schools, science equipment, and IMT Enugu funding." },
      { name: "Health", amount: 60000000000, description: "Parklane Teaching Hospital upgrades, rural telemedicine stations, and local healthcare clinics." },
      { name: "Agriculture", amount: 45000000000, description: "Pineapple production hubs, rice clusters processing equipment, and organic manure distribution." },
      { name: "Security", amount: 35000000000, description: "Distress call command centre, vehicle trackers, and community vigilante vehicles." }
    ],
    lgas: [
      { name: "Enugu East", allocation: 28000000000, focus: "Smart school builds, clean municipal water pipes, and estate link roads" },
      { name: "Nsukka", allocation: 24000000000, focus: "University town roads, agricultural processing, and clinic rehabilitation" },
      { name: "Udi", allocation: 18000000000, focus: "Rural solar streetlights, soil erosion control, and primary health centre" }
    ]
  },
  {
    state: "Kaduna",
    year: 2026,
    totalBudget: 395000000000, // 395 Billion
    categories: [
      { name: "Infrastructure", amount: 145000000000, description: "Kaduna urban renewal roads, bridge construction, and suburban water schemes." },
      { name: "Education", amount: 110000000000, description: "Primary school teacher training, classroom construction, and Kaduna State University research." },
      { name: "Health", amount: 70000000000, description: "Barau Dikko Hospital equipment, rural clinic building, and primary care immunization." },
      { name: "Agriculture", amount: 40000000000, description: "Ginger processing facilities, maize farming fertilizers, and irrigation pumps." },
      { name: "Security", amount: 30000000000, description: "Security drone monitoring, military coordination hubs, and rural vigilante allowances." }
    ],
    lgas: [
      { name: "Kaduna North", allocation: 26000000000, focus: "Urban road asphalt overlays, streetlights, and primary health centres" },
      { name: "Zaria", allocation: 22000000000, focus: "Water distribution pipes, school laboratories, and secondary roads" },
      { name: "Chikun", allocation: 19000000000, focus: "Suburban community security, primary school renovations, and boreholes" }
    ]
  }
];
