import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell } from "recharts";

const ORANGE = "#ff6b35";
const GREEN = "#4ade80";
const RED = "#f87171";
const BLUE = "#60a5fa";
const PURPLE = "#a78bfa";
const YELLOW = "#fbbf24";
const DARK = "#111118";
const DARKER = "#08080d";

// Data
const universalsData = [
  { name: "Discrete\nPitches", value: 315, desc: "Every culture lands on specific notes" },
  { name: "Steady\nBeat", value: 315, desc: "Every culture keeps a pulse" },
  { name: "Phrase\nRepetition", value: 315, desc: "Every culture repeats ideas" },
  { name: "Octave\nEquivalence", value: 315, desc: "Every culture hears octaves as 'same'" },
];

const functionsData = [
  { name: "Dance", value: 315, color: ORANGE, icon: "💃", desc: "Moving the body together" },
  { name: "Love", value: 315, color: RED, icon: "❤️", desc: "Bonding, courtship, connection" },
  { name: "Healing", value: 315, color: GREEN, icon: "🌿", desc: "Recovery, ceremony, restoration" },
  { name: "Lullabies", value: 315, color: BLUE, icon: "🌙", desc: "Soothing a child to sleep" },
];

const consonanceData = [
  { name: "Major 3rd", western: 4.2, tsimane: 3.1 },
  { name: "Perfect 5th", western: 4.5, tsimane: 3.0 },
  { name: "Octave", western: 4.6, tsimane: 4.4 },
  { name: "Minor 2nd", western: 1.8, tsimane: 3.0 },
  { name: "Tritone", western: 2.0, tsimane: 3.1 },
];

const iLoveYouShape = [
  { pos: 0, pitch: 0.3, label: "" },
  { pos: 1, pitch: 0.5, label: "I" },
  { pos: 2, pitch: 0.7, label: "" },
  { pos: 3, pitch: 1.0, label: "love" },
  { pos: 4, pitch: 0.8, label: "" },
  { pos: 5, pitch: 0.5, label: "you" },
  { pos: 6, pitch: 0.3, label: "" },
];

const berlyneCurve = Array.from({ length: 50 }, (_, i) => {
  const x = i / 49;
  const y = 4 * x * (1 - x);
  return { complexity: Math.round(x * 100), pleasure: +(y * 100).toFixed(1), label: i === 24 ? "Sweet Spot" : "" };
});

const grokkingData = Array.from({ length: 40 }, (_, i) => {
  let accuracy;
  if (i < 28) accuracy = 2 + Math.random() * 5;
  else if (i === 28) accuracy = 15;
  else if (i === 29) accuracy = 45;
  else if (i === 30) accuracy = 78;
  else if (i === 31) accuracy = 92;
  else accuracy = 95 + Math.random() * 3;
  return { epoch: (i + 1) * 100, accuracy: +accuracy.toFixed(1) };
});

const noiseData = Array.from({ length: 60 }, (_, i) => {
  const white = 50 + (Math.random() - 0.5) * 80;
  const brown = 50 + Math.sin(i * 0.1) * 30 + (Math.random() - 0.5) * 10;
  const pink = 50 + Math.sin(i * 0.15) * 25 + (Math.random() - 0.5) * 30;
  return { t: i, white: +white.toFixed(1), brown: +brown.toFixed(1), pink: +pink.toFixed(1) };
});

const euclideanPatterns = [
  { name: "Tresillo", hits: 3, steps: 16, pattern: [1,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0], origin: "Cuban Son, New Orleans" },
  { name: "Four-on-floor", hits: 4, steps: 16, pattern: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], origin: "House, Techno" },
  { name: "Cinquillo", hits: 5, steps: 16, pattern: [1,0,0,1,0,1,0,0,1,0,1,0,0,0,0,0], origin: "Caribbean" },
  { name: "West African Bell", hits: 7, steps: 16, pattern: [1,0,1,1,0,1,0,1,1,0,1,0,1,0,1,0], origin: "West Africa" },
];

const climateData = [
  { region: "Tropical", vowelRatio: 85, pitchRange: 90, tonal: 75, color: ORANGE },
  { region: "Subtropical", vowelRatio: 72, pitchRange: 75, tonal: 50, color: YELLOW },
  { region: "Temperate", vowelRatio: 55, pitchRange: 55, tonal: 20, color: BLUE },
  { region: "Arctic", vowelRatio: 35, pitchRange: 30, tonal: 5, color: PURPLE },
];

const proximityData = [
  { distance: "20ft", effect: "Harmonic Shadow", intensity: 25, desc: "You hear a presence — their root hums beneath yours" },
  { distance: "10ft", effect: "Filter Reaction", intensity: 50, desc: "Your filters start reacting to each other's energy" },
  { distance: "5ft", effect: "Tempo Entrainment", intensity: 75, desc: "Your BPMs drift together — coupled oscillators" },
  { distance: "Touch", effect: "Full Merge", intensity: 100, desc: "Two bodies, one instrument" },
];

const sections = [
  "universals", "functions", "tsimane", "iloveyou", "climate",
  "proximity", "stillness", "grokking", "berlyne", "noise", "euclidean", "building"
];

const sectionNames = [
  "4 Universals", "4 Functions", "Tsimane", "I Love You", "Climate",
  "Proximity", "Stillness", "Grokking", "Sweet Spot", "Alive Sound", "Euclidean", "Building"
];

export default function GodsDetails() {
  const [active, setActive] = useState("universals");

  return (
    <div style={{ background: DARKER, color: "#e0e0e0", minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{ textAlign: "center", padding: "40px 20px 20px", borderBottom: `1px solid ${DARK}` }}>
        <h1 style={{ fontSize: "2.2em", fontWeight: 200, letterSpacing: "8px", color: ORANGE, margin: 0 }}>GOD'S DETAILS</h1>
        <p style={{ color: "#555", fontSize: "0.85em", letterSpacing: "3px", marginTop: 8 }}>WHAT 315 CULTURES TAUGHT US ABOUT MUSIC</p>
        <p style={{ color: "#333", fontSize: "0.75em", marginTop: 4 }}>beGump LLC — GUMP Research — March 2026</p>
      </div>

      {/* Nav */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 2, padding: "12px 20px", borderBottom: `1px solid ${DARK}`, justifyContent: "center" }}>
        {sections.map((s, i) => (
          <button key={s} onClick={() => setActive(s)} style={{
            background: active === s ? DARK : "transparent",
            border: "none",
            color: active === s ? ORANGE : "#555",
            padding: "8px 14px",
            cursor: "pointer",
            fontSize: "0.72em",
            letterSpacing: "1px",
            textTransform: "uppercase",
            borderBottom: active === s ? `2px solid ${ORANGE}` : "2px solid transparent",
            transition: "all 0.2s"
          }}>{sectionNames[i]}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>

        {active === "universals" && (
          <div>
            <h2 style={{ color: ORANGE, fontSize: "1.4em", fontWeight: 300, marginBottom: 8 }}>The Four Universals</h2>
            <p style={{ color: "#999", fontSize: "0.9em", lineHeight: 1.6, marginBottom: 20 }}>
              315 cultures. Every inhabited continent. Four things every single one shares about music. Not scales. Not harmony. Not chords. Simpler. Deeper.
            </p>
            <p style={{ color: "#555", fontSize: "0.8em", marginBottom: 20 }}>Mehr et al. (2019), Science — one of the most prestigious journals in the world.</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={universalsData} margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                <XAxis dataKey="name" tick={{ fill: "#999", fontSize: 11 }} interval={0} />
                <YAxis tick={{ fill: "#555" }} domain={[0, 315]} label={{ value: "Cultures", angle: -90, position: "insideLeft", fill: "#555" }} />
                <Tooltip contentStyle={{ background: DARK, border: `1px solid ${ORANGE}`, color: "#e0e0e0" }} />
                <Bar dataKey="value" fill={ORANGE} radius={[4, 4, 0, 0]} name="Cultures with this trait" />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 20 }}>
              {universalsData.map((d, i) => (
                <div key={i} style={{ background: DARK, borderRadius: 8, padding: 16, borderLeft: `3px solid ${ORANGE}` }}>
                  <div style={{ fontSize: "1.1em", color: "#fff", marginBottom: 4 }}>{d.name.replace("\n", " ")}</div>
                  <div style={{ fontSize: "0.85em", color: "#777" }}>{d.desc}</div>
                  <div style={{ fontSize: "0.75em", color: ORANGE, marginTop: 4 }}>315/315 cultures</div>
                </div>
              ))}
            </div>
            <div style={{ background: DARK, borderRadius: 8, padding: 20, marginTop: 20, textAlign: "center" }}>
              <p style={{ color: "#999", fontSize: "0.9em", fontStyle: "italic" }}>Everything else — scales, harmony, consonance — has cultural fingerprints on it. These four are in the body itself.</p>
            </div>
          </div>
        )}

        {active === "functions" && (
          <div>
            <h2 style={{ color: ORANGE, fontSize: "1.4em", fontWeight: 300, marginBottom: 8 }}>The Four Functions</h2>
            <p style={{ color: "#999", fontSize: "0.9em", lineHeight: 1.6, marginBottom: 20 }}>
              Not entertainment. Not art. Not performance. Not commerce. Every culture on Earth independently arrived at the same four purposes for music.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {functionsData.map((d, i) => (
                <div key={i} style={{ background: DARK, borderRadius: 12, padding: 24, textAlign: "center", border: `1px solid ${d.color}33` }}>
                  <div style={{ fontSize: "2.5em", marginBottom: 8 }}>{d.icon}</div>
                  <div style={{ fontSize: "1.3em", color: d.color, fontWeight: 600, marginBottom: 4 }}>{d.name}</div>
                  <div style={{ fontSize: "0.85em", color: "#777" }}>{d.desc}</div>
                  <div style={{ fontSize: "0.75em", color: "#555", marginTop: 8 }}>315/315 cultures</div>
                </div>
              ))}
            </div>
            <div style={{ background: DARK, borderRadius: 8, padding: 20, marginTop: 20, textAlign: "center" }}>
              <p style={{ color: ORANGE, fontSize: "1.1em", fontWeight: 300 }}>Dance. Love. Healing. Lullabies.</p>
              <p style={{ color: "#666", fontSize: "0.85em", marginTop: 8 }}>Music exists for the body, the heart, the wound, and the child.</p>
            </div>
          </div>
        )}

        {active === "tsimane" && (
          <div>
            <h2 style={{ color: ORANGE, fontSize: "1.4em", fontWeight: 300, marginBottom: 8 }}>The Tsimane Discovery</h2>
            <p style={{ color: "#999", fontSize: "0.9em", lineHeight: 1.6, marginBottom: 8 }}>
              MIT researchers traveled to the Bolivian Amazon to study a group with zero exposure to Western music. They played them "pleasant" and "harsh" chords.
            </p>
            <p style={{ color: RED, fontSize: "1em", fontWeight: 600, marginBottom: 20 }}>
              The Tsimane rated them as equally pleasant. Consonance is not a law of nature.
            </p>
            <p style={{ color: "#555", fontSize: "0.8em", marginBottom: 20 }}>McDermott et al. (2016), Nature</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={consonanceData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                <XAxis dataKey="name" tick={{ fill: "#999", fontSize: 11 }} />
                <YAxis tick={{ fill: "#555" }} domain={[0, 5]} label={{ value: "Pleasantness", angle: -90, position: "insideLeft", fill: "#555" }} />
                <Tooltip contentStyle={{ background: DARK, border: `1px solid ${ORANGE}`, color: "#e0e0e0" }} />
                <Bar dataKey="western" fill={BLUE} name="Western listeners" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tsimane" fill={ORANGE} name="Tsimane (no Western exposure)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 12, fontSize: "0.8em" }}>
              <span style={{ color: BLUE }}>■ Western listeners</span>
              <span style={{ color: ORANGE }}>■ Tsimane (no Western exposure)</span>
            </div>
            <div style={{ background: DARK, borderRadius: 8, padding: 20, marginTop: 20 }}>
              <p style={{ color: "#999", fontSize: "0.9em" }}>Notice: Western listeners show strong preference for consonant intervals. The Tsimane rate everything roughly equal — <span style={{ color: GREEN }}>except the octave</span>, which both groups recognize as special.</p>
              <p style={{ color: ORANGE, fontSize: "0.95em", marginTop: 12, fontWeight: 300 }}>The octave is in the ear. Everything else is in the culture.</p>
            </div>
          </div>
        )}

        {active === "iloveyou" && (
          <div>
            <h2 style={{ color: ORANGE, fontSize: "1.4em", fontWeight: 300, marginBottom: 8 }}>The Shape of "I Love You"</h2>
            <p style={{ color: "#999", fontSize: "0.9em", lineHeight: 1.6, marginBottom: 20 }}>
              In 10 out of 14 languages tested, the voice follows the same shape when saying "I love you": rise, peak on "love," fall. An arch. The same shape as a breath, a heartbeat, a musical phrase.
            </p>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={iLoveYouShape} margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                <defs>
                  <linearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={RED} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={RED} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fill: "#fff", fontSize: 18, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Area type="monotone" dataKey="pitch" stroke={RED} fill="url(#pitchGrad)" strokeWidth={3} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ textAlign: "center", marginTop: -10, marginBottom: 20 }}>
              <span style={{ color: "#555", fontSize: "0.8em" }}>↑ Pitch rises to "love" then falls ↑</span>
            </div>
            <div style={{ background: DARK, borderRadius: 12, padding: 24, textAlign: "center" }}>
              <p style={{ color: "#999", fontSize: "0.9em", marginBottom: 12 }}>The three most common notes across 14 languages mapped to:</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 24 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "2em", color: RED, fontWeight: 300 }}>E</div>
                  <div style={{ fontSize: "0.7em", color: "#555" }}>329 Hz</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "2em", color: RED, fontWeight: 300 }}>G</div>
                  <div style={{ fontSize: "0.7em", color: "#555" }}>392 Hz</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "2em", color: RED, fontWeight: 300 }}>C</div>
                  <div style={{ fontSize: "0.7em", color: "#555" }}>523 Hz</div>
                </div>
              </div>
              <p style={{ color: ORANGE, fontSize: "1em", marginTop: 16, fontWeight: 300 }}>A major triad. The melodic DNA of love lives inside one chord.</p>
            </div>
          </div>
        )}

        {active === "climate" && (
          <div>
            <h2 style={{ color: ORANGE, fontSize: "1.4em", fontWeight: 300, marginBottom: 8 }}>Weather Shapes the Voice</h2>
            <p style={{ color: "#999", fontSize: "0.9em", lineHeight: 1.6, marginBottom: 8 }}>
              9,179 language samples. Your vocal cords physically respond to the air. Music from warm places sounds different because the bodies making it are different in that air.
            </p>
            <p style={{ color: "#555", fontSize: "0.8em", marginBottom: 20 }}>Wang & Wichmann (2023), PNAS Nexus</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={climateData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                <XAxis dataKey="region" tick={{ fill: "#999", fontSize: 12 }} />
                <YAxis tick={{ fill: "#555" }} domain={[0, 100]} label={{ value: "Relative %", angle: -90, position: "insideLeft", fill: "#555" }} />
                <Tooltip contentStyle={{ background: DARK, border: `1px solid ${ORANGE}`, color: "#e0e0e0" }} />
                <Bar dataKey="vowelRatio" fill={ORANGE} name="Vowel openness" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pitchRange" fill={BLUE} name="Pitch range" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tonal" fill={PURPLE} name="Tonal language %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 12, fontSize: "0.8em" }}>
              <span style={{ color: ORANGE }}>■ Vowel openness</span>
              <span style={{ color: BLUE }}>■ Pitch range</span>
              <span style={{ color: PURPLE }}>■ Tonal language %</span>
            </div>
            <div style={{ background: DARK, borderRadius: 8, padding: 20, marginTop: 20 }}>
              <p style={{ color: "#999", fontSize: "0.9em" }}>Warm + humid = wider vowels, wider pitch, more tonal languages. Cold + dry = compressed, consonant-heavy, narrow pitch. This is physiology, not culture.</p>
            </div>
          </div>
        )}

        {active === "proximity" && (
          <div>
            <h2 style={{ color: ORANGE, fontSize: "1.4em", fontWeight: 300, marginBottom: 8 }}>Two People Are Already Making Music</h2>
            <p style={{ color: "#999", fontSize: "0.9em", lineHeight: 1.6, marginBottom: 20 }}>
              Mirror neurons fire when you see someone move. Speed contagion shifts your timing in ONE SECOND. Strangers in rocking chairs sync without trying. The biology does it automatically.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {proximityData.map((d, i) => (
                <div key={i} style={{ background: DARK, borderRadius: 8, padding: 16, display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 60, textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: "1.2em", color: ORANGE, fontWeight: 600 }}>{d.distance}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 8, background: "#1a1a2e", borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
                      <div style={{ height: "100%", width: `${d.intensity}%`, background: `linear-gradient(90deg, ${ORANGE}, ${RED})`, borderRadius: 4, transition: "width 0.5s" }} />
                    </div>
                    <div style={{ fontSize: "0.9em", color: "#fff" }}>{d.effect}</div>
                    <div style={{ fontSize: "0.8em", color: "#666" }}>{d.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: DARK, borderRadius: 8, padding: 20, marginTop: 20, textAlign: "center", borderLeft: `3px solid ${ORANGE}` }}>
              <p style={{ color: ORANGE, fontSize: "1em", fontStyle: "italic" }}>"People start to know you by how you sound coming down the hall."</p>
            </div>
          </div>
        )}

        {active === "stillness" && (
          <div>
            <h2 style={{ color: ORANGE, fontSize: "1.4em", fontWeight: 300, marginBottom: 8 }}>Stillness Is Not Silence</h2>
            <p style={{ color: "#999", fontSize: "0.9em", lineHeight: 1.6, marginBottom: 20 }}>
              Your cardiovascular system resonates at 0.1 Hz — one cycle every 10 seconds. Breathing at this rate strengthens the vagus nerve and produces measurable calm.
            </p>
            <p style={{ color: "#555", fontSize: "0.8em", marginBottom: 20 }}>Lehrer & Gevirtz (2014), Frontiers in Psychology</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={Array.from({ length: 100 }, (_, i) => ({ t: i, wave: Math.sin(i * 0.063) * 50 + 50 }))} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <defs>
                  <linearGradient id="breathGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BLUE} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={BLUE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="wave" stroke={BLUE} fill="url(#breathGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ textAlign: "center", color: "#555", fontSize: "0.8em", marginTop: -10 }}>0.1 Hz — your body's resting frequency</div>
            <div style={{ background: DARK, borderRadius: 12, padding: 24, marginTop: 20, textAlign: "center" }}>
              <p style={{ color: BLUE, fontSize: "1.2em", fontWeight: 300 }}>When you stop moving, GUMP doesn't go silent.</p>
              <p style={{ color: "#999", fontSize: "0.9em", marginTop: 8 }}>A deep drone breathes at 0.1 Hz — your body's own resting frequency made audible.</p>
              <p style={{ color: ORANGE, fontSize: "1em", fontStyle: "italic", marginTop: 12 }}>Stillness isn't leaving the music. It's arriving at the deepest note you already play.</p>
            </div>
          </div>
        )}

        {active === "grokking" && (
          <div>
            <h2 style={{ color: ORANGE, fontSize: "1.4em", fontWeight: 300, marginBottom: 8 }}>The Grokking Moment</h2>
            <p style={{ color: "#999", fontSize: "0.9em", lineHeight: 1.6, marginBottom: 8 }}>
              In 2022, OpenAI left a neural network training over a weekend. It had been memorizing — no understanding. Then suddenly, without warning, it understood. Test accuracy jumped from near-zero to near-perfect in a sharp phase transition.
            </p>
            <p style={{ color: "#999", fontSize: "0.9em", lineHeight: 1.6, marginBottom: 20 }}>
              This is the same pattern as every discovery: accumulation → plateau → sudden phase transition → integration. The "aha" moment and musical resolution activate the SAME dopamine pathway.
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={grokkingData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                <XAxis dataKey="epoch" tick={{ fill: "#555", fontSize: 10 }} label={{ value: "Training epochs", position: "bottom", fill: "#555" }} />
                <YAxis tick={{ fill: "#555" }} domain={[0, 100]} label={{ value: "Accuracy %", angle: -90, position: "insideLeft", fill: "#555" }} />
                <Tooltip contentStyle={{ background: DARK, border: `1px solid ${ORANGE}`, color: "#e0e0e0" }} />
                <Line type="monotone" dataKey="accuracy" stroke={GREEN} strokeWidth={2} dot={false} name="Test accuracy" />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
              {["Accumulation", "Plateau", "Phase Transition", "Integration"].map((stage, i) => (
                <div key={i} style={{ background: DARK, borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: "0.75em", color: i === 2 ? ORANGE : "#555", fontWeight: i === 2 ? 600 : 400 }}>{stage}</div>
                </div>
              ))}
            </div>
            <div style={{ background: DARK, borderRadius: 8, padding: 20, marginTop: 20 }}>
              <p style={{ color: "#999", fontSize: "0.9em" }}>Every GUMP user has this moment — when they stop "moving and hearing sound" and start "making music." The brain literally reorganizes. GUMP detects it. The sound opens up.</p>
            </div>
          </div>
        )}

        {active === "berlyne" && (
          <div>
            <h2 style={{ color: ORANGE, fontSize: "1.4em", fontWeight: 300, marginBottom: 8 }}>The Sweet Spot — Between Order and Chaos</h2>
            <p style={{ color: "#999", fontSize: "0.9em", lineHeight: 1.6, marginBottom: 8 }}>
              Too simple = boring. Too complex = noise. Peak pleasure lives at moderate complexity with moderate surprise. Berlyne proved this in 1971. It holds for every art form.
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={berlyneCurve} margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                <defs>
                  <linearGradient id="berlyneGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ORANGE} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={ORANGE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                <XAxis dataKey="complexity" tick={{ fill: "#555", fontSize: 10 }} label={{ value: "Complexity →", position: "bottom", fill: "#555" }} />
                <YAxis tick={{ fill: "#555" }} label={{ value: "Pleasure", angle: -90, position: "insideLeft", fill: "#555" }} />
                <Area type="monotone" dataKey="pleasure" stroke={ORANGE} fill="url(#berlyneGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0 40px", marginTop: -20, fontSize: "0.8em" }}>
              <span style={{ color: "#555" }}>Boring</span>
              <span style={{ color: ORANGE, fontWeight: 600 }}>Sweet Spot</span>
              <span style={{ color: "#555" }}>Noise</span>
            </div>
            <div style={{ background: DARK, borderRadius: 8, padding: 20, marginTop: 20 }}>
              <p style={{ color: "#999", fontSize: "0.9em" }}>Moderate syncopation = peak groove (Witek 2014). Unusual intervals within conventional contours = earworms (Jakubowski 2017). High uncertainty + expected resolution = peak pleasure (Cheung 2019). GUMP's Prodigy system targets this sweet spot dynamically.</p>
            </div>
          </div>
        )}

        {active === "noise" && (
          <div>
            <h2 style={{ color: ORANGE, fontSize: "1.4em", fontWeight: 300, marginBottom: 8 }}>The Alive Sound — 1/f Noise</h2>
            <p style={{ color: "#999", fontSize: "0.9em", lineHeight: 1.6, marginBottom: 8 }}>
              The difference between a drum machine and a drummer is 10-30ms of timing variation — not random, but correlated. This pattern is called 1/f noise (pink noise). Your ear evolved to hear it as the signature of something alive.
            </p>
            <p style={{ color: "#555", fontSize: "0.8em", marginBottom: 20 }}>Hennig et al. (2011), PLoS ONE</p>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={noiseData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                <XAxis tick={false} />
                <YAxis tick={{ fill: "#555" }} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: DARK, border: `1px solid ${ORANGE}`, color: "#e0e0e0" }} />
                <Line type="monotone" dataKey="white" stroke="#555" strokeWidth={1} dot={false} name="White noise (rigid)" />
                <Line type="monotone" dataKey="pink" stroke={ORANGE} strokeWidth={2} dot={false} name="Pink noise (alive)" />
                <Line type="monotone" dataKey="brown" stroke="#333" strokeWidth={1} dot={false} name="Brown noise (chaos)" />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 12, fontSize: "0.8em" }}>
              <span style={{ color: "#555" }}>■ White (rigid/dead)</span>
              <span style={{ color: ORANGE }}>■ Pink (alive)</span>
              <span style={{ color: "#333" }}>■ Brown (chaos)</span>
            </div>
            <div style={{ background: DARK, borderRadius: 8, padding: 20, marginTop: 20 }}>
              <p style={{ color: "#999", fontSize: "0.9em" }}>1/f noise appears in heartbeats, ocean waves, neural firing, and great musicians. A perfectly timed machine sounds dead because nothing alive moves that way. GUMP's timing has 1/f fluctuation built in.</p>
            </div>
          </div>
        )}

        {active === "euclidean" && (
          <div>
            <h2 style={{ color: ORANGE, fontSize: "1.4em", fontWeight: 300, marginBottom: 8 }}>Euclidean Rhythms — Groove from Math</h2>
            <p style={{ color: "#999", fontSize: "0.9em", lineHeight: 1.6, marginBottom: 8 }}>
              The most groove-inducing patterns across ALL cultures are the most-even distributions of beats. The math guarantees groove. No culture invented these — they discovered them.
            </p>
            <p style={{ color: "#555", fontSize: "0.8em", marginBottom: 20 }}>Toussaint (2013), The Geometry of Musical Rhythm</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {euclideanPatterns.map((p, pi) => (
                <div key={pi} style={{ background: DARK, borderRadius: 8, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ color: "#fff", fontSize: "1em" }}>{p.name}</span>
                    <span style={{ color: "#555", fontSize: "0.8em" }}>{p.origin}</span>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {p.pattern.map((step, si) => (
                      <div key={si} style={{
                        flex: 1,
                        height: step ? 32 : 16,
                        background: step ? ORANGE : "#1a1a2e",
                        borderRadius: 3,
                        alignSelf: "flex-end",
                        transition: "all 0.3s",
                        opacity: step ? 1 : 0.4,
                      }} />
                    ))}
                  </div>
                  <div style={{ fontSize: "0.75em", color: "#555", marginTop: 6 }}>{p.hits} hits in {p.steps} steps — maximally even distribution</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {active === "building" && (
          <div>
            <h2 style={{ color: ORANGE, fontSize: "1.4em", fontWeight: 300, marginBottom: 8 }}>What We're Actually Building</h2>
            <p style={{ color: "#999", fontSize: "1em", lineHeight: 1.8, marginBottom: 20 }}>
              Not a music app. Not an instrument. A frequency microscope that transposes the sub-audible music of the body into the range the ear can hear.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Physics", desc: "Same forces that organize atoms", color: BLUE },
                { label: "Biology", desc: "Same systems that sync heartbeats", color: GREEN },
                { label: "Purpose", desc: "Dance, love, healing, lullabies", color: ORANGE },
                { label: "Dopamine", desc: "Same pathway as solving a problem", color: PURPLE },
              ].map((d, i) => (
                <div key={i} style={{ background: DARK, borderRadius: 8, padding: 16, borderTop: `3px solid ${d.color}` }}>
                  <div style={{ fontSize: "0.9em", color: d.color, fontWeight: 600, marginBottom: 4 }}>{d.label}</div>
                  <div style={{ fontSize: "0.8em", color: "#777" }}>{d.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "linear-gradient(135deg, #111118 0%, #1a0d0d 100%)", borderRadius: 12, padding: 32, textAlign: "center" }}>
              <p style={{ color: ORANGE, fontSize: "1.2em", fontWeight: 300, lineHeight: 1.6, marginBottom: 16 }}>
                Your body is already making music. You just can't hear it yet.
              </p>
              <p style={{ color: "#999", fontSize: "0.95em", lineHeight: 1.6 }}>
                When two bodies are near each other — their nervous systems coupling through mirror neurons, their tempos converging, their rhythms synchronizing through the same physics that makes pendulum clocks swing together — GUMP makes that connection audible.
              </p>
              <p style={{ color: "#666", fontSize: "0.9em", fontStyle: "italic", marginTop: 20 }}>
                The music doesn't belong to anyone. It belongs to the space between people. That's where love lives. That's where God's details are.
              </p>
              <div style={{ marginTop: 24, padding: "16px 24px", background: DARKER, borderRadius: 8, display: "inline-block" }}>
                <a href="https://begump.com" style={{ color: ORANGE, textDecoration: "none", fontSize: "1.1em", letterSpacing: "2px" }}>begump.com</a>
                <div style={{ color: "#555", fontSize: "0.75em", marginTop: 4 }}>Open on your phone. Move.</div>
              </div>
            </div>
            <div style={{ textAlign: "center", marginTop: 24 }}>
              <p style={{ color: "#555", fontSize: "0.85em", fontStyle: "italic" }}>"We are not building anything. We are discovering through evidence what God's movements sound like."</p>
              <p style={{ color: "#444", fontSize: "0.8em", marginTop: 8 }}>beGump LLC — Patent Pending #64/011,402 — March 2026</p>
            </div>
          </div>
        )}

      </div>

      <div style={{ textAlign: "center", padding: 30, color: "#333", fontSize: "0.7em" }}>
        All findings from peer-reviewed research. Full source list in gods_details.md.<br />
        beGump LLC — James McCandless — jim@begump.com — begump.com
      </div>
    </div>
  );
}
