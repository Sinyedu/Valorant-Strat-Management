// Ability icons in public/abilities/<agent>/<ability>.webp (64x64, white glyph on transparent),
// keyed "<characterId>/<abilityId>" as in Wingman files. Abilities without an icon (passives,
// new releases, or ids that differ from the display name) fall back to a diamond marker.
export const ABILITY_ICONS: ReadonlySet<string> = new Set([
  "astra/astral_form", "astra/cosmic_divide", "astra/dissipate", "astra/gravity_well", "astra/nebula",
  "astra/nova_pulse", "astra/stars", "breach/aftershock", "breach/fault_line", "breach/flashpoint",
  "breach/rolling_thunder", "brimstone/incendiary", "brimstone/orbital_strike",
  "brimstone/sky_smoke", "brimstone/stim_beacon", "chamber/headhunter", "chamber/rendezvous",
  "chamber/tour_de_force", "chamber/trademark", "clove/meddle", "clove/not_dead_yet",
  "clove/pick_me_up", "clove/ruse", "cypher/cyber_cage", "cypher/neural_theft",
  "cypher/spycam", "cypher/trapwire", "deadlock/annihilation", "deadlock/barrier_mesh",
  "deadlock/gravnet", "deadlock/sonic_sensor", "fade/haunt", "fade/nightfall",
  "fade/prowler", "fade/seize", "gekko/dizzy", "gekko/mosh_pit", "gekko/thrash",
  "gekko/wingman", "harbor/cove", "harbor/high_tide", "harbor/reckoning",
  "harbor/storm_surge", "hush/displacement", "hush/flashbulb", "hush/flow",
  "hush/suspension", "hush/telekinesis", "iso/contingency", "iso/double_tap",
  "iso/kill_contract", "iso/undercut", "jett/blade_storm", "jett/cloudburst", "jett/drift",
  "jett/tailwind", "jett/updraft", "kayo/flashdrive", "kayo/fragment", "kayo/nullcmd",
  "kayo/zeropoint", "killjoy/alarmbot", "killjoy/lockdown", "killjoy/nanoswarm",
  "killjoy/turret", "miks/bassquake", "miks/harmonize", "miks/m_pulse", "miks/waveform",
  "neon/fast_lane", "neon/high_gear", "neon/overdrive", "neon/relay_bolt", "omen/dark_cover",
  "omen/from_the_shadows", "omen/paranoia", "omen/shrouded_step", "phoenix/blaze",
  "phoenix/curveball", "phoenix/hot_hands", "phoenix/run_it_back", "raze/blast_pack",
  "raze/boom_bot", "raze/paint_shells", "raze/showstopper", "reyna/devour", "reyna/dismiss",
  "reyna/empress", "reyna/leer", "sage/barrier_orb", "sage/healing_orb", "sage/resurrection",
  "sage/slow_orb", "skye/guiding_light", "skye/regrowth", "skye/seekers", "skye/trailblazer",
  "sova/hunters_fury", "sova/owl_drone", "sova/recon_bolt", "sova/shock_bolt",
  "tejo/armageddon", "tejo/guided_salvo", "tejo/special_delivery", "tejo/stealth_drone",
  "veto/chokehold", "veto/crosscut", "veto/evolution", "veto/interceptor",
  "viper/poison_cloud", "viper/snake_bite", "viper/toxic_screen", "viper/vipers_pit",
  "vyse/arc_rose", "vyse/razorvine", "vyse/shear", "vyse/steel_garden",
  "waylay/convergent_paths", "waylay/lightspeed", "waylay/refract", "waylay/saturate",
  "yoru/blindside", "yoru/dimensional_drift", "yoru/fakeout", "yoru/gatecrash",
]);

// Wingman's "alt icon" toggle on Astra's Nebula shows Dissipate; other abilities have no alt art.
const altAbilityId = (characterId: string, abilityId: string): string =>
  characterId === "astra" && abilityId === "nebula" ? "dissipate" : abilityId;

export const abilityIconSrc = (
  characterId: string,
  abilityId: string | null,
  useAltIcon = false,
): string | null => {
  if (!abilityId) return null;
  const id = useAltIcon ? altAbilityId(characterId, abilityId) : abilityId;
  return ABILITY_ICONS.has(`${characterId}/${id}`) ? `/abilities/${characterId}/${id}.webp` : null;
};
