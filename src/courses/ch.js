// The chemistry course, Klasse 7 to the Abitur (after the NRW Kernlehrplan
// Chemie, Sek I and II). Format: see parseCourse in src/courses.js.
import { parseCourse } from "../courses.js";
import { diagram, INK, SOFT } from "./diagram.js";

const ring = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${SOFT}" stroke-width="2" stroke-dasharray="6 5"/>`;
const ball = (cx, cy, fill) => `<circle cx="${cx}" cy="${cy}" r="11" fill="${fill}" stroke="${INK}" stroke-width="1.5"/>`;

const diagrams = {
  atom: diagram({
    w: 640, h: 420,
    shapes: `${ring(320, 210, 95)}${ring(320, 210, 170)}
      ${ball(306, 200, "#E57373")}${ball(330, 196, "#B0B6C3")}${ball(318, 220, "#E57373")}${ball(340, 218, "#B0B6C3")}${ball(300, 222, "#B0B6C3")}${ball(322, 240, "#E57373")}
      <circle cx="415" cy="210" r="8" fill="#5A8FD8"/><circle cx="225" cy="210" r="8" fill="#5A8FD8"/>
      <circle cx="320" cy="40" r="8" fill="#5A8FD8"/>`,
    labels: [
      { text: "Atomkern", x: 20, y: 120, to: [298, 205] },
      { text: "Proton", x: 20, y: 300, to: [312, 228] },
      { text: "Neutron", x: 620, y: 300, anchor: "end", to: [346, 222] },
      { text: "Elektron", x: 620, y: 60, anchor: "end", to: [328, 40] },
      { text: "Elektronenschale", x: 620, y: 395, anchor: "end", to: [440, 330] },
    ],
  }),
  laborgeraete: diagram({
    w: 680, h: 360,
    shapes: `
      <path d="M 40 110 L 40 260 Q 40 272 52 272 L 128 272 Q 140 272 140 260 L 140 110 L 128 104" fill="#E3F0FA" stroke="${INK}" stroke-width="3"/>
      <rect x="42" y="190" width="96" height="80" fill="#9CC4E8" opacity="0.7"/>
      <path d="M 210 100 L 230 100 L 230 160 L 280 260 Q 284 272 272 272 L 168 272 Q 156 272 160 260 L 210 160 Z" fill="#E3F0FA" stroke="${INK}" stroke-width="3"/>
      <path d="M 186 215 L 254 215 L 276 262 L 164 262 Z" fill="#9CC4E8" opacity="0.7"/>
      <path d="M 340 60 L 340 245 Q 340 270 360 270 Q 380 270 380 245 L 380 60" fill="#E3F0FA" stroke="${INK}" stroke-width="3"/>
      <path d="M 342 190 L 342 245 Q 342 266 360 266 Q 378 266 378 245 L 378 190 Z" fill="#E8A37B" opacity="0.8"/>
      <path d="M 460 50 L 460 262 M 500 50 L 500 262 M 440 262 L 520 262" stroke="${INK}" stroke-width="3" fill="none"/>
      <rect x="462" y="150" width="36" height="110" fill="#9CC4E8" opacity="0.7"/>
      <path d="M 466 80 h 12 M 466 110 h 12 M 466 140 h 12 M 466 170 h 12 M 466 200 h 12 M 466 230 h 12" stroke="${INK}" stroke-width="2"/>
      <rect x="590" y="140" width="20" height="120" fill="#B0B6C3" stroke="${INK}" stroke-width="2"/>
      <rect x="560" y="258" width="80" height="14" rx="4" fill="#8A909C" stroke="${INK}" stroke-width="2"/>
      <path d="M 600 138 Q 580 100 600 60 Q 620 100 600 138 Z" fill="#7FA8F0" stroke="#3E6CC0" stroke-width="2"/>`,
    labels: [
      { text: "Becherglas", x: 90, y: 320, anchor: "middle" },
      { text: "Erlenmeyerkolben", x: 222, y: 340, anchor: "middle" },
      { text: "Reagenzglas", x: 360, y: 320, anchor: "middle" },
      { text: "Messzylinder", x: 480, y: 340, anchor: "middle" },
      { text: "Gasbrenner", x: 600, y: 320, anchor: "middle" },
    ],
  }),
  galvani: diagram({
    w: 660, h: 440,
    shapes: `
      <path d="M 70 200 L 70 380 Q 70 395 85 395 L 245 395 Q 260 395 260 380 L 260 200" fill="#EEF4FA" stroke="${INK}" stroke-width="3"/>
      <rect x="72" y="260" width="186" height="133" fill="#CFE0EE"/>
      <path d="M 400 200 L 400 380 Q 400 395 415 395 L 575 395 Q 590 395 590 380 L 590 200" fill="#EEF4FA" stroke="${INK}" stroke-width="3"/>
      <rect x="402" y="260" width="186" height="133" fill="#9CC4E8"/>
      <rect x="120" y="150" width="26" height="200" fill="#A9AEB8" stroke="${INK}" stroke-width="2"/>
      <rect x="500" y="150" width="26" height="200" fill="#C87A4A" stroke="${INK}" stroke-width="2"/>
      <path d="M 200 330 L 200 230 Q 200 200 230 200 L 430 200 Q 460 200 460 230 L 460 330" fill="none" stroke="#D9C27A" stroke-width="24"/>
      <path d="M 133 150 L 133 70 L 513 70 L 513 150" fill="none" stroke="${INK}" stroke-width="3"/>
      <circle cx="323" cy="70" r="24" fill="#FFFDF7" stroke="${INK}" stroke-width="3"/>
      <text x="323" y="77" text-anchor="middle" font-size="20" fill="${INK}">V</text>
      <path d="M 200 52 L 260 52 M 252 45 L 262 52 L 252 59" stroke="#3E6CC0" stroke-width="3" fill="none"/>`,
    labels: [
      { text: "Anode (Zn)", x: 20, y: 130, to: [133, 170] },
      { text: "Zinksulfat-Lösung", x: 20, y: 425, to: [110, 350] },
      { text: "Salzbrücke", x: 330, y: 250, anchor: "middle", to: [330, 205] },
      { text: "Elektronenfluss", x: 20, y: 45, to: [200, 52] },
      { text: "Kathode (Cu)", x: 532, y: 182, to: [526, 200] },
      { text: "Kupfersulfat-Lösung", x: 640, y: 425, anchor: "end", to: [560, 350] },
    ],
  }),
};

const text = `
# t2-stoffe | Stoffe und ihre Eigenschaften | Aggregatzustände, Reinstoffe, Gemische
> Jeder Stoff hat typische **Eigenschaften**: Farbe, Geruch, Dichte, Schmelz- und Siedetemperatur, Löslichkeit, elektrische Leitfähigkeit.
> **Aggregatzustände**: fest – flüssig – gasförmig. Übergänge: Schmelzen/Erstarren, Verdampfen/Kondensieren, Sublimieren/Resublimieren.
> **Teilchenmodell**: Stoffe bestehen aus kleinsten Teilchen; je höher die Temperatur, desto schneller bewegen sie sich.
> **Reinstoff**: nur eine Teilchensorte (Wasser, Kupfer). **Gemisch**: mehrere Stoffe – homogen (Lösung, Legierung) oder heterogen (Suspension, Emulsion, Rauch).
> **Dichte** ρ = m / V (Masse durch Volumen), z. B. Wasser 1 g/cm³.
Aggregatzustand | Zustandsform eines Stoffes: fest, flüssig oder gasförmig
Schmelztemperatur | Temperatur, bei der ein Stoff fest → flüssig wird
Siedetemperatur | Temperatur, bei der ein Stoff flüssig → gasförmig wird
Sublimation | direkter Übergang von fest zu gasförmig
Reinstoff | Stoff aus nur einer Teilchensorte
homogenes Gemisch | Gemisch, in dem man die Bestandteile nicht unterscheiden kann
Suspension | heterogenes Gemisch aus Feststoff in Flüssigkeit
Emulsion | heterogenes Gemisch aus zwei nicht mischbaren Flüssigkeiten
Legierung | homogenes Gemisch aus Metallen (z. B. Messing)
Dichte | Masse eines Stoffes pro Volumen
? Wasser siedet bei {{c1::100}} °C.
? Milch ist eine {{c1::Emulsion}}.
? Der Übergang von gasförmig zu flüssig heißt {{c1::Kondensieren}}.
= Ein Stück Metall hat m = 54 g und V = 20 cm³. Dichte in g/cm³? | 2,7
= Wie viel g wiegen 50 cm³ Wasser (ρ = 1 g/cm³)? | 50
! Welches Gemisch ist homogen? | Salzwasser | Schlamm | Rauch | Orangensaft mit Fruchtfleisch
! Was passiert mit den Teilchen beim Erwärmen? | Sie bewegen sich schneller | Sie werden größer | Sie werden schwerer | Sie hören auf, sich zu bewegen

# t2-trennen | Trennverfahren und Laborgeräte | Filtrieren, Destillieren, Extrahieren
> Stoffgemische trennt man über **unterschiedliche Eigenschaften** ihrer Bestandteile:
> - **Sieben**: Teilchengröße · **Dekantieren/Sedimentieren**: Dichte
> - **Filtrieren**: fest von flüssig (Rückstand und Filtrat)
> - **Eindampfen**: gelöster Feststoff bleibt zurück (Salz aus Salzwasser)
> - **Destillieren**: unterschiedliche Siedetemperaturen (Alkohol aus Wein)
> - **Extrahieren**: unterschiedliche Löslichkeit (Tee, Kaffee)
> - **Chromatografie**: unterschiedlich starke Haftung (Farbstoffe trennen)
> - **Magnetscheiden**: Magnetismus (Eisen)
> **Sicherheit**: Schutzbrille, Haare zusammen, Gefahrstoffsymbole beachten, nie Chemikalien probieren.
@ laborgeraete
Filtrieren | Trennen eines Feststoffs von einer Flüssigkeit mit einem Filter
Filtrat | die Flüssigkeit, die durch den Filter läuft
Rückstand | der Feststoff, der im Filter zurückbleibt
Destillation | Trennen nach Siedetemperaturen durch Verdampfen und Kondensieren
Extraktion | Herauslösen eines Stoffes mit einem Lösemittel
Chromatografie | Trennen von Farbstoffen nach ihrer Haftung und Löslichkeit
Eindampfen | Verdampfen des Lösemittels, der gelöste Stoff bleibt zurück
Dekantieren | vorsichtiges Abgießen einer Flüssigkeit über einem Bodensatz
Destillat | die bei der Destillation aufgefangene Flüssigkeit
? Salz gewinnt man aus Salzwasser durch {{c1::Eindampfen}}.
? Beim Filtrieren bleibt der {{c1::Rückstand}} im Filter.
? Alkohol trennt man vom Wasser durch {{c1::Destillation}}.
! Welches Verfahren trennt Farbstoffe eines Filzstifts? | Chromatografie | Filtrieren | Sieben | Magnetscheiden
! Auf welcher Eigenschaft beruht die Destillation? | unterschiedliche Siedetemperaturen | unterschiedliche Farbe | unterschiedliche Teilchengröße | Magnetismus

# t2-reaktion | Die chemische Reaktion | Stoffumwandlung, Energie, Verbrennung
> Bei einer **chemischen Reaktion** entstehen **neue Stoffe** mit neuen Eigenschaften; dabei wird Energie umgesetzt.
> **exotherm**: Energie wird frei (Verbrennung) · **endotherm**: Energie wird benötigt (Zersetzung von Wasser)
> **Aktivierungsenergie**: Startenergie, die eine Reaktion braucht. **Katalysatoren** senken sie.
> **Gesetz von der Erhaltung der Masse**: Masse der Edukte = Masse der Produkte.
> **Verbrennung** = Reaktion mit Sauerstoff (**Oxidation**), es entstehen **Oxide**: Kohlenstoff + Sauerstoff → Kohlenstoffdioxid.
> Branddreieck: brennbarer Stoff, Sauerstoff, Zündtemperatur – fehlt eins, erlischt das Feuer.
> **Reduktion**: Abgabe von Sauerstoff; **Redoxreaktion**: beides gleichzeitig (Thermitverfahren).
chemische Reaktion | Vorgang, bei dem neue Stoffe mit neuen Eigenschaften entstehen
Edukt | Ausgangsstoff einer Reaktion
Produkt | Stoff, der bei einer Reaktion entsteht
exotherm | Reaktion, bei der Energie frei wird
endotherm | Reaktion, die Energie benötigt
Aktivierungsenergie | Energie, die zum Starten einer Reaktion nötig ist
Katalysator | Stoff, der eine Reaktion beschleunigt und unverändert bleibt
Oxidation | Reaktion mit Sauerstoff (später: Elektronenabgabe)
Oxid | Verbindung eines Elements mit Sauerstoff
Branddreieck | brennbarer Stoff, Sauerstoff und Zündtemperatur
? Eine Verbrennung ist eine {{c1::exotherme}} Reaktion.
? Bei der Verbrennung von Kohlenstoff entsteht {{c1::Kohlenstoffdioxid}}.
? Ein {{c1::Katalysator}} senkt die Aktivierungsenergie.
= 12 g Kohlenstoff reagieren mit 32 g Sauerstoff. Wie viel g Kohlenstoffdioxid entstehen? | 44
! Was ist ein Hinweis auf eine chemische Reaktion? | Es entsteht ein neuer Stoff | Zucker löst sich in Wasser | Eis schmilzt | Wasser verdampft
! Warum löscht Sand ein Feuer? | Er hält den Sauerstoff fern | Er kühlt unter 0 °C | Er reagiert mit dem Brennstoff | Er ist brennbar

# t2-atombau | Atombau und Periodensystem | Kern-Hülle-Modell, Schalen
> **Atom** = Atomkern (**Protonen** +, **Neutronen** ±0) + Atomhülle (**Elektronen** −).
> **Ordnungszahl** = Zahl der Protonen = Zahl der Elektronen (im neutralen Atom). **Massenzahl** = Protonen + Neutronen.
> **Isotope**: gleiche Protonenzahl, verschiedene Neutronenzahl (z. B. C-12, C-14).
> **Schalenmodell**: 1. Schale max. 2, 2. Schale max. 8 Elektronen (außen meist max. 8 → **Oktettregel**).
> **Periodensystem**: Hauptgruppe = Zahl der Außenelektronen (Valenzelektronen), Periode = Zahl der Schalen.
> Wichtige Gruppen: Alkalimetalle (I), Erdalkalimetalle (II), Halogene (VII), Edelgase (VIII, voll besetzte Außenschale, reaktionsträge).
@ atom
Proton | positiv geladenes Teilchen im Atomkern
Neutron | ungeladenes Teilchen im Atomkern
Elektron | negativ geladenes Teilchen in der Atomhülle
Ordnungszahl | Zahl der Protonen im Kern
Massenzahl | Summe aus Protonen und Neutronen
Isotop | Atomart mit gleicher Protonen-, aber anderer Neutronenzahl
Valenzelektronen | Elektronen auf der äußersten Schale
Edelgaskonfiguration | voll besetzte Außenschale (meist 8 Elektronen)
Halogene | Elemente der VII. Hauptgruppe (z. B. Chlor)
Alkalimetalle | sehr reaktive Metalle der I. Hauptgruppe (z. B. Natrium)
? Natrium hat die Ordnungszahl 11, also {{c1::11}} Protonen.
? Edelgase haben eine voll besetzte {{c1::Außenschale}}.
? Die Hauptgruppe gibt die Zahl der {{c1::Valenzelektronen}} an.
= Chlor-35 hat 17 Protonen. Wie viele Neutronen? | 18
= Wie viele Elektronen passen auf die 2. Schale? | 8
! Welches Teilchen ist ungeladen? | Neutron | Proton | Elektron | Ion
! Warum reagieren Edelgase kaum? | Ihre Außenschale ist voll besetzt | Sie haben keine Elektronen | Sie sind Metalle | Sie sind zu schwer

# t2-salze | Ionen und Salze | Ionenbindung, Ionengitter
> Atome erreichen durch Abgabe oder Aufnahme von Elektronen die **Edelgaskonfiguration** und werden zu **Ionen**.
> Metalle geben Elektronen ab → **Kationen** (+): Na → Na⁺ + e⁻ · Nichtmetalle nehmen auf → **Anionen** (−): Cl + e⁻ → Cl⁻
> **Ionenbindung**: Anziehung entgegengesetzt geladener Ionen; sie bilden ein **Ionengitter** (z. B. Natriumchlorid NaCl).
> Eigenschaften von Salzen: hohe Schmelztemperatur, spröde, leiten als **Schmelze** oder **Lösung** den Strom (bewegliche Ionen), nicht als Feststoff.
> Formeln: Ladungen ausgleichen – Mg²⁺ + 2 Cl⁻ → MgCl₂ · Al³⁺ und O²⁻ → Al₂O₃
Ion | elektrisch geladenes Teilchen
Kation | positiv geladenes Ion
Anion | negativ geladenes Ion
Ionenbindung | Zusammenhalt durch elektrische Anziehung zwischen Ionen
Ionengitter | regelmäßige Anordnung von Kationen und Anionen
Salz | Verbindung aus Kationen und Anionen
Natriumchlorid | Kochsalz, NaCl
Elektrolyse | Zerlegung eines Stoffes durch elektrischen Strom
Elektrolyt | Stoff, dessen Lösung oder Schmelze den Strom leitet
? Natrium gibt ein Elektron ab und wird zum {{c1::Kation}} Na⁺.
? Die Formel von Magnesiumchlorid ist {{c1::MgCl₂}}.
? Salze leiten den Strom als {{c1::Schmelze}} oder Lösung.
! Warum leitet festes Kochsalz keinen Strom? | Die Ionen sind im Gitter nicht beweglich | Es enthält keine Ionen | Es ist ein Metall | Es ist zu kalt
! Welches Ion bildet Sauerstoff? | O²⁻ | O⁺ | O²⁺ | O⁻⁻⁻
= Wie viele Elektronen gibt ein Aluminiumatom bei der Ionenbildung ab? | 3

# t2-molekuele | Moleküle und Elektronenpaarbindung | Wasser, Polarität, Wasserstoffbrücken
> **Elektronenpaarbindung** (kovalente Bindung): Nichtmetallatome teilen sich Elektronenpaare (H₂, Cl₂, H₂O, CO₂).
> **Lewis-Formel**: bindende und freie Elektronenpaare als Striche.
> **Elektronegativität (EN)**: Fähigkeit, Bindungselektronen anzuziehen (Fluor am höchsten). Großer EN-Unterschied → **polare Bindung** mit Teilladungen δ+ / δ−.
> Das **Wassermolekül** ist gewinkelt und ein **Dipol**; zwischen Wassermolekülen wirken **Wasserstoffbrückenbindungen** → hohe Siedetemperatur, Eis schwimmt.
> **Ähnliches löst sich in Ähnlichem**: polare Stoffe (Salz, Zucker) lösen sich in Wasser, unpolare (Fett, Öl) in unpolaren Lösemitteln (Benzin).
Elektronenpaarbindung | Bindung durch gemeinsame Elektronenpaare zwischen Nichtmetallen
Molekül | Teilchen aus zwei oder mehr verbundenen Atomen
Lewis-Formel | Strukturformel mit Strichen für Elektronenpaare
Elektronegativität | Fähigkeit eines Atoms, Bindungselektronen anzuziehen
polare Bindung | Elektronenpaarbindung mit ungleich verteilten Elektronen
Dipol | Molekül mit positivem und negativem Ladungsschwerpunkt
Wasserstoffbrückenbindung | Anziehung zwischen H-Atom und freiem Elektronenpaar eines stark elektronegativen Atoms
hydrophil | wasserliebend, löst sich in Wasser
hydrophob | wasserabweisend
Van-der-Waals-Kräfte | schwache Anziehungskräfte zwischen unpolaren Molekülen
? Das Element mit der höchsten Elektronegativität ist {{c1::Fluor}}.
? Wassermoleküle sind {{c1::Dipole}}.
? Zwischen Wassermolekülen wirken {{c1::Wasserstoffbrücken}}.
! Warum löst sich Öl nicht in Wasser? | Öl ist unpolar, Wasser polar | Öl ist schwerer | Wasser ist zu kalt | Öl ist ein Salz
! Welches Molekül ist gewinkelt gebaut? | H₂O | CO₂ | H₂ | O₂
= Wie viele Elektronen teilen sich zwei Atome bei einer Einfachbindung? | 2

# t2-saeuren | Säuren, Basen, pH-Wert | Neutralisation, Indikatoren
> **Säuren** geben in Wasser **H⁺-Ionen** ab (bilden Oxonium-Ionen H₃O⁺): Salzsäure HCl, Schwefelsäure H₂SO₄, Essigsäure.
> **Basen/Laugen** bilden **Hydroxid-Ionen OH⁻**: Natronlauge NaOH.
> **pH-Wert**: 0–7 sauer, 7 neutral, 7–14 basisch. Je kleiner, desto saurer.
> **Indikatoren** zeigen den pH-Wert durch Farbe (Universalindikator: rot sauer, grün neutral, blau/violett basisch).
> **Neutralisation**: Säure + Base → Salz + Wasser · H₃O⁺ + OH⁻ → 2 H₂O
> Beispiel: HCl + NaOH → NaCl + H₂O
Säure | Stoff, der in Wasser H⁺-Ionen abgibt
Base | Stoff, der H⁺-Ionen aufnimmt; Lauge bildet OH⁻-Ionen
Oxonium-Ion | H₃O⁺, Kennzeichen saurer Lösungen
Hydroxid-Ion | OH⁻, Kennzeichen basischer Lösungen
pH-Wert | Maß dafür, wie sauer oder basisch eine Lösung ist
Indikator | Farbstoff, der durch Farbumschlag den pH-Wert anzeigt
Neutralisation | Reaktion von Säure und Base zu Salz und Wasser
Salzsäure | wässrige Lösung von Chlorwasserstoff, HCl
Natronlauge | wässrige Lösung von Natriumhydroxid, NaOH
? Eine Lösung mit pH 3 ist {{c1::sauer}}.
? Säure und Base reagieren zu Salz und {{c1::Wasser}}.
? Laugen enthalten {{c1::Hydroxid}}-Ionen.
= Welchen pH-Wert hat reines Wasser? | 7
! Welche Lösung ist am sauersten? | pH 1 | pH 5 | pH 7 | pH 12
! Was entsteht bei HCl + NaOH? | NaCl + H₂O | NaOH + Cl₂ | H₂ + O₂ | HCl + Na

# t2-organik | Organische Chemie: Grundlagen | Alkane, Alkohole, Kohlenstoff
> Organische Chemie = Chemie der **Kohlenstoffverbindungen**. Kohlenstoff bildet **4 Bindungen**.
> **Alkane** (CₙH₂ₙ₊₂): Methan, Ethan, Propan, Butan, Pentan, Hexan, Heptan, Octan, Nonan, Decan – **homologe Reihe**.
> Je länger die Kette, desto höher die Siedetemperatur (stärkere Van-der-Waals-Kräfte).
> **Isomere**: gleiche Summenformel, verschiedene Struktur (Butan / Isobutan).
> **Alkohole**: Hydroxygruppe **–OH**, Endung **-ol** (Ethanol C₂H₅OH). Kurzkettige Alkohole mischen sich mit Wasser.
> Erdöl wird durch **fraktionierte Destillation** getrennt; Verbrennung fossiler Stoffe setzt CO₂ frei.
Alkan | gesättigter Kohlenwasserstoff mit nur Einfachbindungen
homologe Reihe | Reihe von Verbindungen, die sich um je eine CH₂-Gruppe unterscheiden
Isomer | Verbindung mit gleicher Summenformel, aber anderer Struktur
Methan | einfachstes Alkan, CH₄, Hauptbestandteil von Erdgas
Alken | Kohlenwasserstoff mit mindestens einer C=C-Doppelbindung
Hydroxygruppe | funktionelle Gruppe –OH der Alkohole
Ethanol | Trinkalkohol, C₂H₅OH
fraktionierte Destillation | Trennen von Erdöl in Fraktionen nach Siedebereichen
Summenformel | gibt an, wie viele Atome welcher Art ein Molekül enthält
? Kohlenstoff bildet {{c1::vier}} Bindungen.
? Alkohole enthalten eine {{c1::Hydroxy}}gruppe.
? Das Alkan mit drei C-Atomen heißt {{c1::Propan}}.
= Wie viele H-Atome hat Hexan (C₆H₂ₙ₊₂)? | 14
= Summenformel von Butan: C₄H? | 10
! Warum hat Decan eine höhere Siedetemperatur als Methan? | stärkere Van-der-Waals-Kräfte zwischen längeren Molekülen | es ist polar | es enthält Ionen | es ist leichter

# t3-funktionelle-gruppen | Organische Stoffklassen | Alkohole, Aldehyde, Carbonsäuren, Ester
> **Funktionelle Gruppen** bestimmen die Eigenschaften:
> - Hydroxygruppe –OH: **Alkohole** (-ol)
> - Aldehydgruppe –CHO: **Aldehyde** (-al), z. B. Ethanal
> - Ketogruppe C=O in der Kette: **Ketone** (-on), z. B. Propanon (Aceton)
> - Carboxygruppe –COOH: **Carbonsäuren** (-säure), z. B. Ethansäure (Essigsäure)
> - Estergruppe –COO–: **Ester**, Duft- und Aromastoffe
> **Oxidationsreihe**: primärer Alkohol → Aldehyd → Carbonsäure · sekundärer Alkohol → Keton · tertiärer Alkohol: nicht oxidierbar
> **Veresterung**: Carbonsäure + Alkohol ⇌ Ester + Wasser (Kondensation, säurekatalysiert, Gleichgewicht)
funktionelle Gruppe | Atomgruppe, die die Eigenschaften einer Stoffklasse bestimmt
Aldehyd | Verbindung mit der Gruppe –CHO, Endung -al
Keton | Verbindung mit C=O innerhalb der Kette, Endung -on
Carbonsäure | Verbindung mit der Carboxygruppe –COOH
Ester | Verbindung aus Carbonsäure und Alkohol, oft Duftstoff
Veresterung | Reaktion von Carbonsäure und Alkohol zu Ester und Wasser
Kondensation | Reaktion, bei der zwei Moleküle unter Wasserabspaltung verbinden
primärer Alkohol | Alkohol, bei dem das C mit –OH an nur ein weiteres C gebunden ist
Fehling-Probe | Nachweis von Aldehyden (roter Niederschlag)
Hydrolyse | Spaltung eines Moleküls durch Wasser
? Ethanol wird zu Ethanal und dann zu {{c1::Ethansäure}} oxidiert.
? Ein sekundärer Alkohol wird zu einem {{c1::Keton}} oxidiert.
? Ester entstehen aus Carbonsäure und {{c1::Alkohol}}.
! Welche Gruppe haben Carbonsäuren? | –COOH | –OH | –CHO | –NH₂
! Welcher Alkohol lässt sich nicht oxidieren? | ein tertiärer | ein primärer | ein sekundärer | Methanol

# t3-gleichgewicht | Reaktionsgeschwindigkeit und Gleichgewicht | Kinetik, Le Chatelier, MWG
> **Reaktionsgeschwindigkeit** v = Δc / Δt. Sie steigt mit höherer **Temperatur**, **Konzentration**, **Zerteilungsgrad** und durch **Katalysatoren** (Stoßtheorie: mehr wirksame Zusammenstöße).
> **Chemisches Gleichgewicht**: Hin- und Rückreaktion laufen gleich schnell; die Konzentrationen bleiben konstant (**dynamisches** Gleichgewicht).
> **Massenwirkungsgesetz**: K = c(C)·c(D) / (c(A)·c(B)) für A + B ⇌ C + D.
> **Prinzip von Le Chatelier**: Ein Zwang verschiebt das Gleichgewicht so, dass der Zwang verringert wird (Konzentration, Druck, Temperatur).
> Beispiel **Haber-Bosch**: N₂ + 3 H₂ ⇌ 2 NH₃ (exotherm) – hoher Druck begünstigt Ammoniak.
Reaktionsgeschwindigkeit | Konzentrationsänderung pro Zeit
Stoßtheorie | Reaktion erfolgt durch wirksame Zusammenstöße der Teilchen
Zerteilungsgrad | Feinheit eines Feststoffs; größere Oberfläche beschleunigt
chemisches Gleichgewicht | Zustand, in dem Hin- und Rückreaktion gleich schnell sind
Massenwirkungsgesetz | Beziehung der Konzentrationen im Gleichgewicht über K
Gleichgewichtskonstante | K; groß bedeutet: viel Produkt im Gleichgewicht
Prinzip von Le Chatelier | Ausweichen des Gleichgewichts vor einem Zwang
Haber-Bosch-Verfahren | technische Ammoniaksynthese aus Stickstoff und Wasserstoff
dynamisch | Reaktionen laufen weiter, die Konzentrationen bleiben aber gleich
? Im Gleichgewicht sind Hin- und Rückreaktion gleich {{c1::schnell}}.
? Druckerhöhung verschiebt das Gleichgewicht zur Seite mit weniger {{c1::Gasteilchen}}.
? Ein Katalysator verändert die Lage des Gleichgewichts {{c1::nicht}}.
= Die Konzentration sinkt in 20 s von 0,5 auf 0,3 mol/l. Mittlere Geschwindigkeit in mol/(l·s)? | 0,01
! Was passiert bei Temperaturerhöhung mit einem exothermen Gleichgewicht? | Es verschiebt sich zu den Edukten | Es verschiebt sich zu den Produkten | Nichts | Die Reaktion stoppt
! Was bewirkt ein Katalysator? | Das Gleichgewicht stellt sich schneller ein | mehr Produkt im Gleichgewicht | höhere Temperatur | weniger Edukte

# t4-saeure-base | Säure-Base-Reaktionen | Brønsted, pH-Rechnung, Titration, Puffer
> **Brønsted**: Säuren sind **Protonendonatoren**, Basen **Protonenakzeptoren**; korrespondierende Säure-Base-Paare (HCl/Cl⁻, NH₄⁺/NH₃).
> **pH = −lg c(H₃O⁺)** · **pOH = −lg c(OH⁻)** · pH + pOH = 14 (bei 25 °C)
> **Säurestärke**: pKs-Wert – je kleiner, desto stärker. Starke Säuren protolysieren vollständig.
> Schwache Säure: pH = ½ · (pKs − lg c₀)
> **Titration**: Zugabe einer Maßlösung bis zum Äquivalenzpunkt: c(Säure) · V(Säure) = c(Base) · V(Base) (bei einwertigen Säuren und Basen).
> **Puffer**: schwache Säure + ihre korrespondierende Base, hält den pH-Wert fast konstant · Henderson-Hasselbalch: pH = pKs + lg(c(A⁻)/c(HA))
Protonendonator | Teilchen, das ein Proton (H⁺) abgibt: Brønsted-Säure
Protonenakzeptor | Teilchen, das ein Proton aufnimmt: Brønsted-Base
korrespondierendes Säure-Base-Paar | Säure und Base, die sich um ein Proton unterscheiden
Ampholyt | Teilchen, das als Säure und als Base reagieren kann (z. B. H₂O)
pKs-Wert | Maß für die Säurestärke; klein bedeutet stark
Äquivalenzpunkt | Punkt der Titration, an dem Säure und Base vollständig reagiert haben
Maßlösung | Lösung bekannter Konzentration für die Titration
Pufferlösung | Lösung, die ihren pH-Wert bei Säure- oder Basezugabe kaum ändert
Halbäquivalenzpunkt | dort gilt pH = pKs
Autoprotolyse | Reaktion von Wasser mit sich selbst zu H₃O⁺ und OH⁻
= c(H₃O⁺) = 0,01 mol/l. pH-Wert? | 2
= pH = 4. Wie groß ist c(H₃O⁺) in mol/l? | 0,0001
= pOH = 3. pH-Wert? | 11
= 20 ml Salzsäure werden mit 10 ml NaOH (c = 0,1 mol/l) neutralisiert. c(HCl) in mol/l? | 0,05
? Am Halbäquivalenzpunkt gilt pH = {{c1::pKs}}.
? Wasser ist ein {{c1::Ampholyt}}.
! Welche Säure ist am stärksten? | pKs = −7 | pKs = 4,75 | pKs = 9,25 | pKs = 15
! Woraus besteht ein Puffer? | einer schwachen Säure und ihrer korrespondierenden Base | einer starken Säure und Wasser | zwei starken Basen | Salz und Zucker

# t4-elektrochemie | Elektrochemie | Redox, Spannungsreihe, galvanische Zelle, Elektrolyse
> **Oxidation** = Elektronenabgabe, **Reduktion** = Elektronenaufnahme (Merkhilfe: OIL RIG). Oxidationsmittel nimmt Elektronen auf.
> **Oxidationszahlen** helfen, Redoxgleichungen aufzustellen.
> **Redoxreihe der Metalle**: unedle Metalle (Zn) geben leichter Elektronen ab als edle (Cu, Ag, Au).
> **Galvanische Zelle (Daniell)**: Zn | Zn²⁺ || Cu²⁺ | Cu – Anode (Oxidation, Minuspol) Zink, Kathode (Reduktion, Pluspol) Kupfer; Salzbrücke schließt den Stromkreis.
> Zellspannung: ΔE = E(Kathode) − E(Anode) (Standardpotentiale: Cu +0,34 V, Zn −0,76 V → 1,10 V).
> **Elektrolyse**: erzwungene Redoxreaktion durch äußere Spannung (Umkehr der galvanischen Zelle); Akkus und Batterien, Korrosion und Korrosionsschutz (Opferanode).
@ galvani
Oxidation | Abgabe von Elektronen
Reduktion | Aufnahme von Elektronen
Oxidationsmittel | Stoff, der Elektronen aufnimmt und dabei reduziert wird
Anode | Elektrode, an der die Oxidation stattfindet
Kathode | Elektrode, an der die Reduktion stattfindet
Salzbrücke | Verbindung der Halbzellen, ermöglicht Ionenausgleich
Standardpotential | Spannung einer Halbzelle gegen die Normal-Wasserstoffelektrode
Elektrolyse | durch Strom erzwungene Redoxreaktion
Opferanode | unedles Metall, das statt des Bauteils korrodiert
Korrosion | Zerstörung von Metallen durch Redoxreaktionen
= E(Cu) = +0,34 V, E(Zn) = −0,76 V. Zellspannung in V? | 1,1
= E(Ag) = +0,80 V, E(Cu) = +0,34 V. Zellspannung der Silber-Kupfer-Zelle in V? | 0,46
? In der galvanischen Zelle ist die Anode der {{c1::Minuspol}}.
? An der {{c1::Kathode}} werden Elektronen aufgenommen.
! Welches Metall ist am unedelsten? | Zink | Kupfer | Silber | Gold
! Wozu dient eine Opferanode? | Sie korrodiert statt des geschützten Metalls | Sie liefert Wärme | Sie macht das Metall edler | Sie lädt eine Batterie

# t4-nernst | Nernst-Gleichung und Konzentrationszellen | Elektrochemie vertieft (LK)
> Das Elektrodenpotential hängt von der Konzentration ab – **Nernst-Gleichung** (25 °C):
> E = E° + (0,059 V / z) · lg (c(Ox) / c(Red))
> Für Metallelektroden: E = E° + (0,059 V / z) · lg c(Mⁿ⁺)
> **Konzentrationszelle**: zwei gleiche Halbzellen mit verschiedener Konzentration liefern eine Spannung; die verdünntere Seite ist die Anode.
> ΔE = (0,059 V / z) · lg (c(konzentriert) / c(verdünnt))
> Anwendungen: pH-Messung (Glaselektrode), Brennstoffzelle (H₂ + O₂ → H₂O), Lithium-Ionen-Akku, Überspannung bei der Elektrolyse.
Nernst-Gleichung | berechnet das Elektrodenpotential in Abhängigkeit von der Konzentration
Konzentrationszelle | galvanische Zelle aus zwei gleichen Halbzellen verschiedener Konzentration
z (Nernst) | Zahl der übertragenen Elektronen
Überspannung | zusätzliche Spannung, die bei der Elektrolyse nötig ist
Brennstoffzelle | galvanische Zelle, die Wasserstoff und Sauerstoff zu Wasser umsetzt
Glaselektrode | Elektrode zur pH-Messung
Zersetzungsspannung | Mindestspannung, bei der eine Elektrolyse abläuft
Lithium-Ionen-Akku | wiederaufladbarer Akku mit Lithium-Ionen als Ladungsträgern
Normal-Wasserstoffelektrode | Bezugselektrode mit dem Potential 0 V
= Cu/Cu²⁺ (z = 2), E° = 0,34 V, c = 0,01 mol/l. E in V? | 0,281
= Konzentrationszelle Ag/Ag⁺ (z = 1): 1 mol/l gegen 0,01 mol/l. ΔE in V? | 0,118
? In der Konzentrationszelle ist die {{c1::verdünntere}} Halbzelle die Anode.
? Die Normal-Wasserstoffelektrode hat das Potential {{c1::0}} V.
! Was entsteht in einer Wasserstoff-Brennstoffzelle? | Wasser | Kohlenstoffdioxid | Sauerstoff | Methan
! Wie ändert sich E einer Metallelektrode, wenn c(Mⁿ⁺) steigt? | E steigt | E sinkt | E bleibt gleich | E wird null

# t4-organische-synthese | Reaktionswege und Kunststoffe | Substitution, Addition, Polymere
> **Radikalische Substitution** (Alkane + Halogene, Licht): Startreaktion, Kettenreaktion, Abbruch.
> **Elektrophile Addition** an C=C (Alkene + Brom): Entfärbung von Bromwasser als **Nachweis von Doppelbindungen**.
> **Eliminierung**: Abspaltung kleiner Moleküle → Doppelbindung · **nucleophile Substitution** an Halogenalkanen.
> **Kunststoffe (Polymere)**: aus Monomeren durch **Polymerisation** (PE, PVC aus C=C-Monomeren), **Polykondensation** (Polyester, Polyamide) oder **Polyaddition**.
> **Thermoplaste** (erweichen beim Erwärmen) · **Duroplaste** (engmaschig vernetzt, nicht verformbar) · **Elastomere** (weitmaschig, gummielastisch).
> Recycling: werkstofflich, rohstofflich, energetisch; Mikroplastik als Umweltproblem.
radikalische Substitution | Ersatz eines H-Atoms durch ein Halogen über Radikale
elektrophile Addition | Anlagerung an eine C=C-Doppelbindung
Eliminierung | Abspaltung eines kleinen Moleküls unter Bildung einer Doppelbindung
Radikal | Teilchen mit einem ungepaarten Elektron
Polymer | Makromolekül aus vielen Monomeren
Monomer | Baustein eines Polymers
Polymerisation | Verknüpfung von Monomeren mit Doppelbindung zu einem Polymer
Polykondensation | Polymerbildung unter Abspaltung kleiner Moleküle (z. B. Wasser)
Thermoplast | Kunststoff, der beim Erwärmen weich und verformbar wird
Duroplast | stark vernetzter Kunststoff, beim Erwärmen nicht verformbar
? Bromwasser wird durch Alkene {{c1::entfärbt}}.
? PE entsteht durch {{c1::Polymerisation}} von Ethen.
? Bei der Polykondensation wird meist {{c1::Wasser}} abgespalten.
! Welcher Kunststoff lässt sich durch Erwärmen verformen? | Thermoplast | Duroplast | jeder Kunststoff | keiner
! Welche Reaktion läuft zwischen Methan und Chlor im Licht ab? | radikalische Substitution | elektrophile Addition | Neutralisation | Eliminierung

# t4-farbstoffe | Farbstoffe und Spektroskopie | Konjugation, Lichtabsorption
> Stoffe sind farbig, wenn sie einen Teil des **sichtbaren Lichts (400–750 nm) absorbieren**; man sieht die **Komplementärfarbe**.
> **Konjugierte Doppelbindungen** (abwechselnd Einfach- und Doppelbindung) – je mehr, desto langwelliger die Absorption (Farbe).
> **Chromophor**: farbgebende Gruppe · **Auxochrome** (–OH, –NH₂) verschieben die Absorption · **Azofarbstoffe** (–N=N–).
> Indikatoren ändern ihre Farbe, weil sich die Struktur (Konjugation) mit dem pH-Wert ändert.
> **Lambert-Beer-Gesetz**: E = ε · c · d (Extinktion proportional zur Konzentration) – Konzentrationsbestimmung mit dem Fotometer.
Komplementärfarbe | Farbe, die man sieht, wenn ihr Gegenstück absorbiert wird
konjugierte Doppelbindungen | abwechselnd angeordnete Einfach- und Doppelbindungen
Chromophor | Molekülteil, der für die Farbe verantwortlich ist
Auxochrom | Gruppe, die die Farbe eines Farbstoffs verstärkt oder verschiebt
Azofarbstoff | Farbstoff mit der Azogruppe –N=N–
Extinktion | Maß für die Lichtabsorption einer Lösung
Lambert-Beer-Gesetz | Extinktion ist proportional zu Konzentration und Schichtdicke
Fotometer | Gerät zur Messung der Lichtabsorption
Absorptionsspektrum | Darstellung der Absorption in Abhängigkeit von der Wellenlänge
? Ein Stoff, der blaues Licht absorbiert, erscheint {{c1::gelb}}.
? Mehr konjugierte Doppelbindungen verschieben die Absorption zu {{c1::längeren}} Wellenlängen.
= E = 0,6, ε = 1200 l/(mol·cm), d = 1 cm. c in mol/l? | 0,0005
= Verdoppelt man die Konzentration, wie ändert sich E (Faktor)? | 2
! Warum ist ein Indikator bei verschiedenen pH-Werten verschieden farbig? | Seine Struktur und Konjugation ändern sich | Er löst sich auf | Er wird heißer | Das Licht ändert sich
`;

const blocks = [
  ["t2-stoffe", "t2-trennen", "t2-reaktion", "t2-atombau", "t2-salze", "t2-molekuele", "t2-saeuren", "t2-organik"],
  ["t3-funktionelle-gruppen", "t3-gleichgewicht"],
  ["t4-saeure-base", "t4-elektrochemie", "t4-nernst", "t4-organische-synthese", "t4-farbstoffe"],
];

export default { units: parseCourse(text, { diagrams }), blocks, lk: ["t4-nernst"], diagrams };
