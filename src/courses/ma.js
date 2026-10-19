// The maths course, Klasse 5 to the Abitur (after the NRW Kernlehrplan
// Mathematik, Sek I and II). Mostly calculation cards: answers are checked by
// value, so 0,75 and 3/4 are both right. Format: see parseCourse in
// src/courses.js.
import { parseCourse } from "../courses.js";
import { diagram, INK, SOFT } from "./diagram.js";

const parabola = (() => {
  // y = 0.5·(x − 1)² − 2 in maths units; 1 unit = 60 px, origin at (300, 250).
  const pts = [];
  for (let u = -2.2; u <= 4.2; u += 0.1) pts.push(`${300 + u * 60},${250 - (0.5 * (u - 1) ** 2 - 2) * 60}`);
  return pts.join(" ");
})();

const diagrams = {
  dreieck: diagram({
    w: 640, h: 400,
    shapes: `
      <path d="M 140 320 L 500 320 L 500 90 Z" fill="#E7EEF8" stroke="${INK}" stroke-width="3"/>
      <path d="M 470 320 L 470 290 L 500 290" fill="none" stroke="${INK}" stroke-width="2"/>
      <circle cx="486" cy="305" r="3" fill="${INK}"/>
      <path d="M 200 320 A 60 60 0 0 0 190 288" fill="none" stroke="#D0524F" stroke-width="3"/>
      <text x="212" y="308" font-size="18" fill="#D0524F">α</text>`,
    labels: [
      { text: "Hypotenuse", x: 180, y: 160, to: [320, 205] },
      { text: "Ankathete", x: 320, y: 370, anchor: "middle", to: [320, 322] },
      { text: "Gegenkathete", x: 508, y: 210, to: [502, 210] },
      { text: "rechter Winkel", x: 620, y: 370, anchor: "end", to: [486, 305] },
      { text: "Winkel α", x: 30, y: 280, to: [192, 300] },
    ],
  }),
  kreis: diagram({
    w: 640, h: 420,
    shapes: `
      <circle cx="300" cy="210" r="150" fill="#E7EEF8" stroke="${INK}" stroke-width="3"/>
      <circle cx="300" cy="210" r="5" fill="${INK}"/>
      <line x1="300" y1="210" x2="406" y2="104" stroke="#D0524F" stroke-width="3"/>
      <line x1="150" y1="210" x2="450" y2="210" stroke="#3E6CC0" stroke-width="3"/>
      <line x1="194" y1="316" x2="406" y2="316" stroke="#6AAE5A" stroke-width="3"/>
      <line x1="450" y1="20" x2="450" y2="400" stroke="#B05AA8" stroke-width="2.5"/>
      <path d="M 194 104 A 150 150 0 0 1 300 60" fill="none" stroke="#E0A030" stroke-width="6"/>`,
    labels: [
      { text: "Mittelpunkt", x: 20, y: 230, to: [298, 212] },
      { text: "Radius", x: 620, y: 80, anchor: "end", to: [360, 150] },
      { text: "Durchmesser", x: 20, y: 160, to: [200, 210] },
      { text: "Sehne", x: 20, y: 380, to: [240, 316] },
      { text: "Tangente", x: 620, y: 330, anchor: "end", to: [450, 300] },
      { text: "Kreisbogen", x: 20, y: 50, to: [230, 78] },
    ],
  }),
  parabel: diagram({
    w: 640, h: 440,
    shapes: `
      <line x1="40" y1="250" x2="600" y2="250" stroke="${INK}" stroke-width="2"/>
      <path d="M 592 244 L 602 250 L 592 256" fill="none" stroke="${INK}" stroke-width="2"/>
      <line x1="300" y1="420" x2="300" y2="30" stroke="${INK}" stroke-width="2"/>
      <path d="M 294 38 L 300 28 L 306 38" fill="none" stroke="${INK}" stroke-width="2"/>
      <line x1="360" y1="40" x2="360" y2="410" stroke="${SOFT}" stroke-width="2" stroke-dasharray="8 6"/>
      <polyline points="${parabola}" fill="none" stroke="#3E6CC0" stroke-width="4"/>
      <circle cx="360" cy="370" r="6" fill="#D0524F"/>
      <circle cx="240" cy="250" r="6" fill="#6AAE5A"/><circle cx="480" cy="250" r="6" fill="#6AAE5A"/>
      <circle cx="300" cy="340" r="6" fill="#E0A030"/>`,
    labels: [
      { text: "Scheitelpunkt", x: 400, y: 420, to: [362, 372] },
      { text: "Nullstelle", x: 520, y: 290, to: [484, 254] },
      { text: "y-Achsenabschnitt", x: 30, y: 380, to: [296, 342] },
      { text: "Symmetrieachse", x: 380, y: 60, to: [362, 70] },
      { text: "x-Achse", x: 620, y: 230, anchor: "end", to: [590, 250] },
      { text: "y-Achse", x: 220, y: 50, anchor: "end", to: [298, 50] },
    ],
  }),
};

const text = `
# t1-zahlen | Natürliche Zahlen | Stellenwerte, Teilbarkeit, Primzahlen
> **Stellenwertsystem**: Einer, Zehner, Hunderter, Tausender … – jede Stelle ist 10-mal so viel wert wie die rechts daneben.
> **Rechengesetze**: Kommutativgesetz (a + b = b + a), Assoziativgesetz, Distributivgesetz a · (b + c) = a·b + a·c.
> **Punkt vor Strich**, Klammern zuerst.
> **Teilbarkeitsregeln**: durch 2 (gerade Endziffer), 3 (Quersumme durch 3), 4 (letzte zwei Ziffern), 5 (Endziffer 0 oder 5), 9 (Quersumme durch 9), 10 (Endziffer 0).
> **Primzahlen** haben genau zwei Teiler (1 und sich selbst): 2, 3, 5, 7, 11, 13 …
> **ggT** (größter gemeinsamer Teiler) und **kgV** (kleinstes gemeinsames Vielfaches).
Primzahl | Zahl mit genau zwei Teilern: 1 und sich selbst
Quersumme | Summe aller Ziffern einer Zahl
Teiler | Zahl, durch die eine andere ohne Rest teilbar ist
Vielfaches | Produkt einer Zahl mit einer natürlichen Zahl
ggT | größter gemeinsamer Teiler zweier Zahlen
kgV | kleinstes gemeinsames Vielfaches zweier Zahlen
Distributivgesetz | a · (b + c) = a · b + a · c
Kommutativgesetz | Vertauschungsgesetz: a + b = b + a
Primfaktorzerlegung | Zerlegung einer Zahl in ein Produkt aus Primzahlen
= 3 + 4 · 5 | 23
= (3 + 4) · 5 | 35
= 144 : 12 | 12
= ggT von 12 und 18 | 6
= kgV von 4 und 6 | 12
= Quersumme von 4572 | 18
= 25 · 4 · 7 | 700
? 1 ist {{c1::keine}} Primzahl.
! Welche Zahl ist durch 3 teilbar? | 417 | 418 | 419 | 421
! Welche Zahl ist eine Primzahl? | 29 | 27 | 21 | 33

# t1-brueche | Brüche | Kürzen, Erweitern, Rechnen
> Ein **Bruch** a/b: Zähler a oben, Nenner b unten. 3/4 bedeutet: das Ganze in 4 Teile, davon 3.
> **Erweitern/Kürzen**: Zähler und Nenner mit derselben Zahl multiplizieren bzw. dividieren – der Wert bleibt gleich.
> **Addieren/Subtrahieren**: erst gleichnamig machen (gemeinsamer Nenner), dann Zähler addieren.
> **Multiplizieren**: Zähler mal Zähler, Nenner mal Nenner.
> **Dividieren**: mit dem **Kehrwert** multiplizieren: (a/b) : (c/d) = (a/b) · (d/c).
> Gemischte Zahl: 1 ½ = 3/2.
Zähler | obere Zahl eines Bruchs
Nenner | untere Zahl eines Bruchs
Kürzen | Zähler und Nenner durch dieselbe Zahl teilen
Erweitern | Zähler und Nenner mit derselben Zahl multiplizieren
gleichnamig | Brüche mit gleichem Nenner
Kehrwert | Bruch mit vertauschtem Zähler und Nenner
gemischte Zahl | Schreibweise aus Ganzen und Bruch, z. B. 2 ¼
echter Bruch | Bruch, dessen Zähler kleiner als der Nenner ist
= 1/2 + 1/4 | 3/4
= 2/3 − 1/6 | 1/2
= 3/4 · 2/5 | 3/10
= 3/4 : 1/2 | 3/2
= Kürze 18/24 vollständig | 3/4
= 2/5 als Dezimalzahl | 0,4
= 3/4 von 60 | 45
! Welcher Bruch ist am größten? | 3/4 | 2/3 | 5/8 | 1/2

# t1-dezimal | Dezimalzahlen und Größen | Komma, Runden, Einheiten
> **Dezimalzahlen**: Zehntel, Hundertstel, Tausendstel nach dem Komma: 0,1 = 1/10.
> **Runden**: bei Ziffer 0–4 abrunden, bei 5–9 aufrunden.
> **Multiplizieren**: wie ohne Komma rechnen, dann so viele Nachkommastellen wie beide Faktoren zusammen.
> **Einheiten**: Länge mm – cm – dm – m (je ·10), km = 1000 m · Masse g – kg – t (je ·1000) · Zeit 1 h = 60 min = 3600 s.
> **Fläche**: 1 m² = 100 dm² = 10 000 cm² · **Volumen**: 1 dm³ = 1 l = 1000 cm³ = 1000 ml.
Dezimalzahl | Zahl mit Nachkommastellen, z. B. 3,25
Zehntel | erste Stelle nach dem Komma
Runden | Ersetzen einer Zahl durch einen Näherungswert
Liter | 1 l = 1 dm³
Quadratmeter | Flächeneinheit, 1 m² = 10 000 cm²
Tonne | 1 t = 1000 kg
Maßstab | Verhältnis von Bildgröße zu Originalgröße
Hektar | 1 ha = 10 000 m²
= 2,5 + 1,75 | 4,25
= 0,3 · 0,4 | 0,12
= 4,8 : 4 | 1,2
= 3,456 auf eine Nachkommastelle gerundet | 3,5
= 2,5 km in m | 2500 m
= 750 ml in l | 0,75 l
= 3 h 15 min in min | 195 min
= Maßstab 1 : 25 000 – 4 cm auf der Karte sind in Wirklichkeit wie viele km? | 1 km

# t1-geometrie | Geometrie: Winkel, Flächen, Körper | Rechteck, Dreieck, Quader
> **Winkel**: spitz (< 90°), recht (= 90°), stumpf (90°–180°), gestreckt (180°), Vollwinkel 360°.
> **Rechteck**: Umfang u = 2·a + 2·b, Fläche A = a · b · **Quadrat**: A = a²
> **Dreieck**: A = ½ · g · h · **Parallelogramm**: A = g · h · **Trapez**: A = ½ · (a + c) · h
> **Quader**: Volumen V = a · b · c, Oberfläche O = 2·(ab + ac + bc) · **Würfel**: V = a³
> **Symmetrie**: achsensymmetrisch (Spiegelachse), punktsymmetrisch (180°-Drehung).
rechter Winkel | Winkel von genau 90°
stumpfer Winkel | Winkel zwischen 90° und 180°
Umfang | Länge der Begrenzungslinie einer Figur
Flächeninhalt | Größe einer Fläche
Volumen | Rauminhalt eines Körpers
Oberfläche | Summe aller Flächen eines Körpers
Parallelogramm | Viereck mit zwei Paaren paralleler Seiten
Trapez | Viereck mit mindestens einem Paar paralleler Seiten
achsensymmetrisch | durch eine Spiegelachse auf sich selbst abbildbar
= Rechteck a = 7 cm, b = 4 cm: Fläche in cm² | 28 cm²
= Rechteck a = 7 cm, b = 4 cm: Umfang in cm | 22 cm
= Dreieck g = 10 cm, h = 6 cm: Fläche in cm² | 30 cm²
= Quader 3 cm × 4 cm × 5 cm: Volumen in cm³ | 60 cm³
= Würfel a = 3 cm: Oberfläche in cm² | 54 cm²
= Trapez a = 8, c = 4, h = 5: Fläche | 30
! Wie viel Grad hat ein gestreckter Winkel? | 180° | 90° | 360° | 270°

# t2-prozent | Prozent- und Zinsrechnung | Grundwert, Prozentwert, Zinsen
> **Prozent** = Hundertstel: p % = p/100.
> **Prozentwert** W = G · p/100 · **Grundwert** G = W · 100/p · **Prozentsatz** p = W/G · 100
> **Vermehrter Grundwert** (Erhöhung um p %): G · (1 + p/100) · **verminderter** (Rabatt): G · (1 − p/100)
> **Zinsen**: Z = K · p/100 · (t/360) für Tage; **Zinseszins**: Kₙ = K₀ · (1 + p/100)ⁿ
> Prozentpunkte ≠ Prozent: von 10 % auf 12 % sind 2 Prozentpunkte, aber 20 % mehr.
Prozentwert | Anteil am Grundwert in absoluter Größe
Grundwert | das Ganze, 100 %
Prozentsatz | Anteil in Prozent
Zinssatz | Prozentsatz, zu dem Kapital verzinst wird
Kapital | angelegter oder geliehener Geldbetrag
Zinseszins | Verzinsung der bereits erhaltenen Zinsen
Wachstumsfaktor | Faktor, mit dem pro Schritt multipliziert wird, z. B. 1,05
Rabatt | Preisnachlass
Mehrwertsteuer | Steuer auf Waren, in Deutschland meist 19 %
= 20 % von 150 € | 30 €
= 15 € sind wie viel Prozent von 60 €? | 25 %
= 12 sind 30 % von welcher Zahl? | 40
= 80 € plus 19 % Mehrwertsteuer | 95,2 €
= Jacke 120 €, 25 % Rabatt. Neuer Preis | 90 €
= 1000 € zu 3 % ein Jahr. Zinsen | 30 €
= 1000 € zu 10 % Zinseszins, 2 Jahre. Endkapital | 1210 €
! Ein Preis steigt um 10 % und sinkt dann um 10 %. Ergebnis? | etwas weniger als vorher | genau wie vorher | etwas mehr als vorher | 20 % weniger

# t2-terme | Terme und Gleichungen | Umformen, binomische Formeln
> **Terme** vereinfachen: gleichartige Glieder zusammenfassen (3x + 2x = 5x), ausmultiplizieren, ausklammern.
> **Binomische Formeln**: (a + b)² = a² + 2ab + b² · (a − b)² = a² − 2ab + b² · (a + b)(a − b) = a² − b²
> **Gleichungen lösen** durch Äquivalenzumformungen: auf beiden Seiten dasselbe tun (addieren, subtrahieren, multiplizieren, dividieren ≠ 0).
> Probe: Lösung einsetzen.
> **Lineare Gleichungssysteme**: Einsetzungs-, Gleichsetzungs- oder Additionsverfahren.
Term | Rechenausdruck aus Zahlen, Variablen und Rechenzeichen
Variable | Platzhalter für eine Zahl, z. B. x
Äquivalenzumformung | Umformung, die die Lösungsmenge nicht ändert
ausklammern | gemeinsamen Faktor vor eine Klammer ziehen
1. binomische Formel | (a + b)² = a² + 2ab + b²
3. binomische Formel | (a + b)(a − b) = a² − b²
Lösungsmenge | Menge aller Zahlen, die eine Gleichung erfüllen
lineares Gleichungssystem | mehrere lineare Gleichungen mit gemeinsamen Variablen
= Löse: 3x + 5 = 20 | x = 5
= Löse: 2x − 7 = 11 | x = 9
= Löse: 5x = 3x + 8 | x = 4
= Löse: x/4 = 6 | x = 24
= Löse: 4(x − 2) = 12 | x = 5
= (x + 3)² für x = 2 | 25
= 7² − 3² mit der 3. binomischen Formel: (7 + 3)(7 − 3) | 40
= System: x + y = 10 und x − y = 2. x? | x = 6
! (a − b)² ist gleich … | a² − 2ab + b² | a² − b² | a² + b² | a² − 2ab − b²

# t2-lineare-funktionen | Lineare Funktionen | Steigung, y-Achsenabschnitt
> **Funktion**: jedem x wird genau ein y zugeordnet.
> **Lineare Funktion**: f(x) = m · x + b – Graph ist eine **Gerade**. m = **Steigung**, b = **y-Achsenabschnitt**.
> Steigung aus zwei Punkten: m = (y₂ − y₁) / (x₂ − x₁) (Steigungsdreieck).
> m > 0 steigend, m < 0 fallend, m = 0 waagerecht. **Nullstelle**: f(x) = 0 → x = −b/m.
> **Proportionale Zuordnung**: y = m · x (Gerade durch den Ursprung) · antiproportional: x · y = konstant.
> Parallele Geraden: gleiches m · senkrecht: m₁ · m₂ = −1.
Steigung | gibt an, um wie viel y steigt, wenn x um 1 wächst
y-Achsenabschnitt | Schnittpunkt der Geraden mit der y-Achse
Nullstelle | x-Wert, an dem die Funktion den Wert 0 hat
Steigungsdreieck | rechtwinkliges Dreieck zur Bestimmung der Steigung
proportional | doppeltes x ergibt doppeltes y, Gerade durch den Ursprung
antiproportional | doppeltes x ergibt halbes y
Ursprung | Punkt (0 | 0) im Koordinatensystem
Funktionsgleichung | Vorschrift, die x einen y-Wert zuordnet
= f(x) = 2x + 3. f(4)? | 11
= Steigung durch (1|2) und (3|8) | 3
= Nullstelle von f(x) = 2x − 6 | x = 3
= f(x) = −0,5x + 4. f(2)? | 3
= Gerade senkrecht zu m = 2 hat die Steigung | −0,5
= Gerade durch (0|1) mit m = 3: y-Wert bei x = 2 | 7
! Welche Gerade fällt? | f(x) = −2x + 1 | f(x) = 2x − 1 | f(x) = 3 | f(x) = x
! Was bedeutet b in f(x) = mx + b? | den y-Achsenabschnitt | die Steigung | die Nullstelle | den Scheitelpunkt

# t2-dreiecke | Dreiecke und Winkel | Winkelsumme, Kongruenz, Flächen
> **Winkelsumme im Dreieck**: 180° · im Viereck: 360°.
> **Scheitelwinkel** sind gleich groß, **Nebenwinkel** ergänzen sich zu 180°, **Stufen-** und **Wechselwinkel** an Parallelen sind gleich.
> **Dreiecksarten**: gleichschenklig (zwei gleiche Seiten), gleichseitig (alle 60°), rechtwinklig.
> **Kongruenzsätze**: SSS, SWS, WSW, SsW – legen ein Dreieck eindeutig fest.
> **Satz des Thales**: liegt C auf dem Kreis über AB, ist der Winkel bei C ein rechter.
> Besondere Linien: Mittelsenkrechte (Umkreis), Winkelhalbierende (Inkreis), Höhe, Seitenhalbierende (Schwerpunkt).
Winkelsumme | Summe der Innenwinkel, im Dreieck 180°
Scheitelwinkel | gegenüberliegende Winkel an einer Geradenkreuzung, gleich groß
Nebenwinkel | benachbarte Winkel, zusammen 180°
Wechselwinkel | gleich große Winkel an geschnittenen Parallelen
gleichschenklig | Dreieck mit zwei gleich langen Seiten
Kongruenz | Deckungsgleichheit von Figuren
Satz des Thales | Winkel im Halbkreis ist ein rechter Winkel
Mittelsenkrechte | Senkrechte durch die Mitte einer Seite; ihr Schnittpunkt ist der Umkreismittelpunkt
Höhe | Senkrechte von einer Ecke auf die gegenüberliegende Seite
= Dreieck mit α = 50°, β = 60°. γ? | 70°
= Nebenwinkel von 115° | 65°
= Gleichschenkliges Dreieck, Basiswinkel 40°. Winkel an der Spitze? | 100°
= Viereck mit 90°, 90°, 120°. Vierter Winkel? | 60°
! Welcher Kongruenzsatz gibt es nicht? | WWW | SSS | SWS | WSW
! Wie groß ist jeder Winkel im gleichseitigen Dreieck? | 60° | 90° | 45° | 30°

# t2-pythagoras | Pythagoras und Trigonometrie | a² + b² = c², sin, cos, tan
> **Satz des Pythagoras** (rechtwinkliges Dreieck): a² + b² = c² – c ist die **Hypotenuse** (gegenüber dem rechten Winkel), a und b die **Katheten**.
> **Trigonometrie** (bezogen auf Winkel α):
> sin α = Gegenkathete / Hypotenuse · cos α = Ankathete / Hypotenuse · tan α = Gegenkathete / Ankathete
> Besondere Werte: sin 30° = 0,5 · cos 60° = 0,5 · tan 45° = 1 · sin 90° = 1
> **Sinussatz** und **Kosinussatz** für beliebige Dreiecke: c² = a² + b² − 2ab · cos γ
@ dreieck
Hypotenuse | längste Seite im rechtwinkligen Dreieck, gegenüber dem rechten Winkel
Kathete | Seite, die am rechten Winkel anliegt
Satz des Pythagoras | a² + b² = c² im rechtwinkligen Dreieck
Sinus | Gegenkathete durch Hypotenuse
Kosinus | Ankathete durch Hypotenuse
Tangens | Gegenkathete durch Ankathete
Ankathete | Kathete, die am Winkel α anliegt
Gegenkathete | Kathete, die dem Winkel α gegenüberliegt
Kosinussatz | c² = a² + b² − 2ab · cos γ
= a = 3, b = 4. Hypotenuse c? | 5
= c = 13, a = 5. b? | 12
= a = 6, b = 8. c? | 10
= sin 30° | 0,5
= tan 45° | 1
= Hypotenuse 10, α = 30°. Gegenkathete? | 5
= Leiter 5 m lang, Fuß 3 m von der Wand. Wie hoch reicht sie (in m)? | 4 m
! Welche Gleichung gilt im rechtwinkligen Dreieck mit Hypotenuse c? | a² + b² = c² | a + b = c | a² − b² = c² | ab = c²

# t2-quadratisch | Quadratische Funktionen | Parabel, Scheitelpunkt, pq-Formel
> **Normalparabel**: f(x) = x² mit Scheitelpunkt (0|0).
> **Scheitelpunktform**: f(x) = a · (x − d)² + e → Scheitelpunkt S(d | e). a > 0: nach oben geöffnet, |a| > 1: gestreckt, |a| < 1: gestaucht.
> **Allgemeine Form**: f(x) = ax² + bx + c (c = y-Achsenabschnitt).
> **Nullstellen** von x² + px + q = 0 mit der **pq-Formel**: x = −p/2 ± √((p/2)² − q)
> Diskriminante D = (p/2)² − q: D > 0 zwei, D = 0 eine, D < 0 keine Lösung.
> **Satz von Vieta**: x₁ + x₂ = −p, x₁ · x₂ = q.
@ parabel
Parabel | Graph einer quadratischen Funktion
Scheitelpunkt | höchster oder tiefster Punkt einer Parabel
Scheitelpunktform | f(x) = a(x − d)² + e mit Scheitelpunkt (d|e)
Normalparabel | Graph von f(x) = x²
pq-Formel | Lösungsformel für x² + px + q = 0
Diskriminante | Term unter der Wurzel, entscheidet über die Zahl der Lösungen
gestreckt | Parabel ist schmaler als die Normalparabel (|a| > 1)
Symmetrieachse | senkrechte Gerade durch den Scheitelpunkt
quadratische Ergänzung | Umformung in die Scheitelpunktform
= Scheitelpunkt von f(x) = (x − 3)² + 2: x-Koordinate | 3
= Scheitelpunkt von f(x) = (x − 3)² + 2: y-Koordinate | 2
= f(x) = x² − 4. Positive Nullstelle | x = 2
= x² − 6x + 9 = 0. Lösung | x = 3
= Diskriminante von x² + 4x + 5 = 0: (p/2)² − q | −1
= f(x) = 2x² − 3. f(2)? | 5
! Wie viele Nullstellen hat x² + 1 = 0? | keine | eine | zwei | drei
! Wohin ist f(x) = −x² + 2 geöffnet? | nach unten | nach oben | nach rechts | gar nicht

# t2-potenzen | Potenzen, Wurzeln, Wachstum | Potenzgesetze, Exponentialfunktion
> **Potenz** aⁿ = a · a · … · a (n-mal). a⁰ = 1, a⁻ⁿ = 1/aⁿ.
> **Potenzgesetze**: aᵐ · aⁿ = aᵐ⁺ⁿ · aᵐ : aⁿ = aᵐ⁻ⁿ · (aᵐ)ⁿ = aᵐ·ⁿ · aⁿ · bⁿ = (ab)ⁿ
> **Wurzel**: √a ist die nichtnegative Zahl, deren Quadrat a ist; a^(1/n) = ⁿ√a.
> **Wissenschaftliche Schreibweise**: 3 400 000 = 3,4 · 10⁶ · 0,0005 = 5 · 10⁻⁴
> **Exponentielles Wachstum**: f(x) = a · bˣ (b > 1 Wachstum, 0 < b < 1 Zerfall). Verdopplungszeit, Halbwertszeit.
> **Logarithmus**: log_b(a) ist der Exponent, mit dem man b potenzieren muss, um a zu erhalten.
Potenz | Produkt gleicher Faktoren, z. B. 2³ = 8
Basis | Zahl, die potenziert wird
Exponent | Hochzahl einer Potenz
Quadratwurzel | Zahl, die mit sich selbst multipliziert den Radikanden ergibt
wissenschaftliche Schreibweise | Zahl als a · 10ⁿ mit 1 ≤ a < 10
exponentielles Wachstum | Wachstum um denselben Faktor pro Zeitschritt
Zerfall | exponentielle Abnahme mit 0 < b < 1
Logarithmus | Exponent, mit dem man die Basis potenzieren muss
Halbwertszeit | Zeit, in der sich ein Bestand halbiert
= 2⁵ | 32
= 10⁻² | 0,01
= 3² · 3³ als Zahl | 243
= √144 | 12
= 8^(1/3) | 2
= log₂(64) | 6
= 5 · 10³ · 2 · 10² | 1000000
= Bakterien verdoppeln sich stündlich, Start 100. Anzahl nach 4 h | 1600
! Was ist a⁰ (a ≠ 0)? | 1 | 0 | a | nicht definiert

# t2-kreis | Kreis und Körper | Kreisfläche, Zylinder, Kegel, Kugel
> **Kreis**: Umfang u = 2 · π · r = π · d · Fläche A = π · r² · π ≈ 3,14
> **Zylinder**: V = π · r² · h · Mantel M = 2 · π · r · h
> **Kegel**: V = ⅓ · π · r² · h · **Pyramide**: V = ⅓ · G · h
> **Kugel**: V = ⁴⁄₃ · π · r³ · O = 4 · π · r²
> **Prisma**: V = G · h (Grundfläche mal Höhe).
@ kreis
Radius | Abstand vom Mittelpunkt zum Kreisrand
Durchmesser | Strecke durch den Mittelpunkt, doppelt so lang wie der Radius
Sehne | Strecke zwischen zwei Punkten auf dem Kreis
Tangente | Gerade, die den Kreis in genau einem Punkt berührt
Kreiszahl π | Verhältnis von Umfang zu Durchmesser, ≈ 3,14159
Zylinder | Körper mit zwei parallelen Kreisflächen und gekrümmtem Mantel
Kegel | Körper mit Kreis als Grundfläche und einer Spitze
Mantelfläche | gekrümmte Seitenfläche eines Zylinders oder Kegels
Prisma | Körper mit zwei kongruenten, parallelen Grundflächen
= Kreis r = 5 cm: Umfang in cm (π ≈ 3,14) | 31,4 cm
= Kreis r = 10 cm: Fläche in cm² (π ≈ 3,14) | 314 cm²
= Zylinder r = 2, h = 10: Volumen (π ≈ 3,14) | 125,6
= Kegel r = 3, h = 4: Volumen (π ≈ 3,14) | 37,68
= Kugel r = 3: Volumen (π ≈ 3,14) | 113,04
= Pyramide G = 36 cm², h = 10 cm: Volumen in cm³ | 120 cm³
! Wie ändert sich die Kreisfläche, wenn der Radius verdoppelt wird? | sie vervierfacht sich | sie verdoppelt sich | sie bleibt gleich | sie verachtfacht sich

# t2-wahrscheinlichkeit | Wahrscheinlichkeit und Statistik | Laplace, Baumdiagramm, Mittelwert
> **Laplace-Experiment**: alle Ergebnisse gleich wahrscheinlich: P(E) = Anzahl günstige / Anzahl mögliche.
> **Baumdiagramm**: Pfadregel (entlang des Pfades multiplizieren), Summenregel (Pfade addieren).
> Gegenereignis: P(Ē) = 1 − P(E).
> **Statistik**: arithmetisches Mittel (Durchschnitt), Median (mittlerer Wert der geordneten Liste), Modalwert (häufigster Wert), Spannweite (Maximum − Minimum).
> Relative Häufigkeit nähert sich bei vielen Versuchen der Wahrscheinlichkeit (empirisches Gesetz der großen Zahlen).
Laplace-Experiment | Zufallsexperiment mit gleich wahrscheinlichen Ergebnissen
Ereignis | Menge von Ergebnissen eines Zufallsexperiments
Gegenereignis | alle Ergebnisse, die nicht zum Ereignis gehören
Pfadregel | Wahrscheinlichkeiten entlang eines Pfades werden multipliziert
Summenregel | Wahrscheinlichkeiten mehrerer Pfade werden addiert
arithmetisches Mittel | Summe aller Werte geteilt durch ihre Anzahl
Median | mittlerer Wert einer der Größe nach geordneten Liste
Spannweite | Differenz zwischen größtem und kleinstem Wert
relative Häufigkeit | absolute Häufigkeit geteilt durch Anzahl der Versuche
= Würfel: P(6) als Bruch | 1/6
= Würfel: P(gerade Zahl) | 1/2
= Zwei Münzwürfe: P(zweimal Kopf) | 1/4
= Mittelwert von 2, 4, 6, 8 | 5
= Median von 1, 3, 7, 9, 20 | 7
= P(E) = 0,3. P(Gegenereignis)? | 0,7
= Urne: 3 rote, 2 blaue Kugeln. P(rot) | 3/5
! Bei welchem Experiment sind alle Ergebnisse gleich wahrscheinlich? | fairer Würfel | Reißzwecke werfen | Wetter von morgen | Lotto-Gewinner raten

# t3-ableitung | Differentialrechnung | Änderungsrate, Ableitung, Tangente
> **Mittlere Änderungsrate** (Sekantensteigung): (f(b) − f(a)) / (b − a).
> **Momentane Änderungsrate** (Tangentensteigung) = **Ableitung** f'(x₀) = lim (f(x₀ + h) − f(x₀)) / h für h → 0.
> **Ableitungsregeln**: Potenzregel (xⁿ)' = n · xⁿ⁻¹ · Faktorregel · Summenregel · (sin x)' = cos x · (cos x)' = −sin x · (eˣ)' = eˣ
> **Tangentengleichung** in x₀: t(x) = f'(x₀) · (x − x₀) + f(x₀).
> f' > 0: f steigt · f' < 0: f fällt · f' = 0: waagerechte Tangente (möglicher Extrempunkt).
Ableitung | Steigung der Tangente an den Graphen in einem Punkt
Differenzenquotient | mittlere Änderungsrate zwischen zwei Stellen
Differentialquotient | Grenzwert des Differenzenquotienten, die Ableitung
Potenzregel | (xⁿ)' = n · xⁿ⁻¹
Tangente | Gerade, die den Graphen in einem Punkt berührt
Sekante | Gerade durch zwei Punkte des Graphen
Monotonie | Steigen oder Fallen einer Funktion
Ableitungsfunktion | Funktion, die jeder Stelle die Steigung zuordnet
= f(x) = x³. f'(2)? | 12
= f(x) = 5x² − 3x. f'(1)? | 7
= f(x) = 4. f'(x)? | 0
= Mittlere Änderungsrate von f(x) = x² zwischen 1 und 3 | 4
= f(x) = x². Steigung der Tangente bei x = 3 | 6
= f(x) = 2x⁴. f'(1)? | 8
! Was gilt, wenn f'(x) > 0 auf einem Intervall? | f ist dort streng monoton steigend | f ist dort konstant | f hat dort eine Nullstelle | f fällt dort

# t3-kurven | Funktionsuntersuchung | Extrempunkte, Wendepunkte, Symmetrie
> **Extrempunkte**: notwendig f'(x) = 0, hinreichend f''(x) < 0 (Hochpunkt) bzw. f''(x) > 0 (Tiefpunkt) – oder Vorzeichenwechsel von f'.
> **Wendepunkte**: f''(x) = 0 und f'''(x) ≠ 0 bzw. Vorzeichenwechsel von f''. Sattelpunkt: Wendepunkt mit waagerechter Tangente.
> **Symmetrie**: nur gerade Exponenten → achsensymmetrisch zur y-Achse · nur ungerade → punktsymmetrisch zum Ursprung.
> **Verhalten für x → ±∞**: bestimmt der Term mit dem höchsten Exponenten.
> Schema: Definitionsbereich, Symmetrie, Nullstellen, Extrem- und Wendepunkte, Verhalten im Unendlichen, Graph.
Hochpunkt | lokales Maximum des Graphen
Tiefpunkt | lokales Minimum des Graphen
notwendige Bedingung | f'(x) = 0 für eine Extremstelle
hinreichende Bedingung | f'(x) = 0 und f''(x) ≠ 0
Wendepunkt | Punkt, an dem sich die Krümmung ändert
Sattelpunkt | Wendepunkt mit waagerechter Tangente
achsensymmetrisch | Graph spiegelsymmetrisch zur y-Achse: f(−x) = f(x)
punktsymmetrisch | Graph symmetrisch zum Ursprung: f(−x) = −f(x)
Krümmung | Links- (f'' > 0) oder Rechtskrümmung (f'' < 0)
= f(x) = x² − 4x. x-Stelle des Tiefpunkts | x = 2
= f(x) = x³ − 3x. f''(x) bei x = 1 | 6
= f(x) = x³ − 6x². x-Stelle des Wendepunkts | x = 2
= f(x) = −x² + 6x. y-Wert des Hochpunkts | 9
! Welche Funktion ist achsensymmetrisch zur y-Achse? | f(x) = x⁴ − 2x² | f(x) = x³ | f(x) = x³ + x | f(x) = x + 1
! Was gilt an einem Tiefpunkt? | f'(x) = 0 und f''(x) > 0 | f'(x) > 0 | f''(x) < 0 | f(x) = 0

# t4-integral | Integralrechnung | Stammfunktion, Flächen, Hauptsatz
> **Stammfunktion** F von f: F'(x) = f(x). Zu xⁿ: xⁿ⁺¹ / (n + 1) (+ C).
> **Bestimmtes Integral**: ∫ₐᵇ f(x) dx = F(b) − F(a) (**Hauptsatz der Differential- und Integralrechnung**).
> Das Integral ist eine **orientierte Fläche**: unter der x-Achse negativ → bei Flächen über Nullstellen hinweg abschnittsweise integrieren.
> **Fläche zwischen zwei Graphen**: ∫ (f(x) − g(x)) dx zwischen den Schnittstellen.
> Rekonstruktion von Beständen aus Änderungsraten; Mittelwert einer Funktion: 1/(b − a) · ∫ₐᵇ f(x) dx.
Stammfunktion | Funktion F mit F' = f
unbestimmtes Integral | Menge aller Stammfunktionen, mit Konstante C
bestimmtes Integral | F(b) − F(a), orientierter Flächeninhalt
Hauptsatz | verbindet Ableiten und Integrieren
Integrationskonstante | beliebige Konstante C einer Stammfunktion
orientierte Fläche | Fläche unter der x-Achse zählt negativ
Integrationsgrenzen | Werte a und b im bestimmten Integral
Rotationskörper | Körper durch Drehung eines Graphen um die x-Achse
= ∫₀² 3x² dx | 8
= ∫₁³ 2x dx | 8
= ∫₀¹ (x + 1) dx | 1,5
= Stammfunktion von 4x³ an der Stelle x = 1 (ohne C) | 1
= ∫₀³ 2 dx | 6
= Fläche zwischen f(x) = x² und der x-Achse von 0 bis 3 | 9
! Was ist eine Stammfunktion von f(x) = cos x? | sin x | −sin x | cos x | −cos x

# t4-exp-ln | Exponential- und Logarithmusfunktion | e-Funktion, ln, Wachstum
> **e-Funktion** f(x) = eˣ (e ≈ 2,718): f'(x) = eˣ, immer positiv, Asymptote y = 0.
> **Natürlicher Logarithmus** ln x ist die Umkehrfunktion: e^(ln x) = x, ln(eˣ) = x; (ln x)' = 1/x.
> **Ketten-** und **Produktregel**: (e^(kx))' = k · e^(kx) · (u·v)' = u'v + uv'
> **Wachstumsmodelle**: exponentiell f(t) = a · e^(kt), begrenzt f(t) = S − c · e^(−kt), logistisch.
> Verdopplungszeit T = ln 2 / k.
e-Funktion | f(x) = eˣ, ihre eigene Ableitung
eulersche Zahl | e ≈ 2,718
natürlicher Logarithmus | Umkehrfunktion der e-Funktion
Kettenregel | (f(g(x)))' = f'(g(x)) · g'(x)
Produktregel | (u · v)' = u' · v + u · v'
Asymptote | Gerade, der sich ein Graph beliebig annähert
begrenztes Wachstum | Wachstum, das sich einer Schranke S nähert
Verdopplungszeit | Zeit, in der sich ein Bestand verdoppelt
= ln(1) | 0
= ln(e³) | 3
= f(x) = e^(2x). f'(0)? | 2
= f(x) = 5 · e^x. f'(0)? | 5
= e^(ln 7) | 7
= f(x) = x · e^x. f'(0)? | 1
! Was ist die Ableitung von ln x? | 1/x | ln x | eˣ | x
! Welchen Wert nimmt eˣ nie an? | 0 | 1 | 100 | 0,001

# t4-vektoren | Analytische Geometrie | Vektoren, Geraden, Ebenen
> **Vektor**: Verschiebung mit Länge und Richtung; Verbindungsvektor AB = B − A.
> **Betrag** |v| = √(v₁² + v₂² + v₃²) · **Skalarprodukt** a · b = a₁b₁ + a₂b₂ + a₃b₃; a · b = 0 ⇔ a ⊥ b.
> Winkel: cos φ = (a · b) / (|a| · |b|).
> **Geradengleichung**: x = p + t · u (Stützvektor p, Richtungsvektor u).
> **Ebene**: Parameterform x = p + r · u + s · v · Koordinatenform ax₁ + bx₂ + cx₃ = d mit Normalenvektor (a, b, c).
> Lagebeziehungen von Geraden: identisch, parallel, schneidend, windschief. **Kreuzprodukt** liefert einen Normalenvektor.
Vektor | gerichtete Größe mit Betrag und Richtung
Ortsvektor | Vektor vom Ursprung zu einem Punkt
Betrag | Länge eines Vektors
Skalarprodukt | a₁b₁ + a₂b₂ + a₃b₃; null bei senkrechten Vektoren
Richtungsvektor | gibt die Richtung einer Geraden an
Stützvektor | Ortsvektor eines Punktes der Geraden
Normalenvektor | Vektor, der senkrecht auf einer Ebene steht
windschief | Geraden, die sich nicht schneiden und nicht parallel sind
kollinear | Vektoren, die Vielfache voneinander sind
= Betrag von (3, 4, 0) | 5
= Skalarprodukt (1, 2, 3) · (4, 0, −1) | 1
= Betrag von (2, 2, 1) | 3
= Skalarprodukt (2, −1, 0) · (1, 2, 5) | 0
= Ebene 2x₁ + x₂ − x₃ = 4: Wert von d für den Punkt (1, 3, 1) | 4
! Was bedeutet a · b = 0 (a, b ≠ 0)? | a und b stehen senkrecht zueinander | a und b sind parallel | a ist gleich b | a ist doppelt so lang
! Wie liegen zwei Geraden, die sich nicht schneiden und nicht parallel sind? | windschief | identisch | senkrecht | gleich

# t4-stochastik | Stochastik | Zufallsgrößen, Binomialverteilung
> **Zufallsgröße** X ordnet Ergebnissen Zahlen zu. **Erwartungswert** E(X) = Σ xᵢ · P(X = xᵢ).
> **Bernoulli-Kette**: n unabhängige Versuche mit Treffer (p) und Niete (1 − p).
> **Binomialverteilung**: P(X = k) = (n über k) · pᵏ · (1 − p)ⁿ⁻ᵏ
> E(X) = n · p · Varianz V(X) = n · p · (1 − p) · Standardabweichung σ = √V(X)
> **Bedingte Wahrscheinlichkeit** P_B(A) = P(A ∩ B) / P(B); Vierfeldertafel; **stochastische Unabhängigkeit**: P(A ∩ B) = P(A) · P(B).
Zufallsgröße | ordnet jedem Ergebnis eines Zufallsexperiments eine Zahl zu
Erwartungswert | auf lange Sicht zu erwartender Mittelwert
Bernoulli-Kette | Folge unabhängiger Versuche mit nur zwei Ausgängen
Binomialverteilung | Verteilung der Trefferzahl in einer Bernoulli-Kette
Binomialkoeffizient | (n über k): Anzahl der Möglichkeiten, k aus n auszuwählen
Varianz | mittlere quadratische Abweichung vom Erwartungswert
Standardabweichung | Wurzel aus der Varianz
bedingte Wahrscheinlichkeit | Wahrscheinlichkeit von A unter der Bedingung B
Vierfeldertafel | Tabelle für zwei Merkmale mit je zwei Ausprägungen
= n = 100, p = 0,3. Erwartungswert | 30
= n = 100, p = 0,5. Varianz | 25
= (5 über 2) | 10
= Münze 3-mal: P(genau 2-mal Kopf) | 3/8
= Würfelspiel: 6 gewinnt 5 €, sonst 0 €. Erwartungswert in € | 5/6
= P(A ∩ B) = 0,12, P(B) = 0,4. P_B(A) | 0,3
! Wann ist eine Binomialverteilung passend? | bei unabhängigen Versuchen mit gleicher Trefferwahrscheinlichkeit | bei Ziehen ohne Zurücklegen aus kleiner Urne | nur bei Würfeln | bei abhängigen Versuchen

# t4-hypothesentest | Hypothesentests | Signifikanz, Fehler 1. und 2. Art (LK)
> Ein **Hypothesentest** prüft eine Vermutung (**Nullhypothese H₀**) anhand einer Stichprobe.
> **Signifikanzniveau** α (z. B. 5 %): höchstens so groß soll die Wahrscheinlichkeit sein, H₀ zu Unrecht abzulehnen.
> **Ablehnungsbereich**: Werte, bei denen H₀ verworfen wird; links-, rechts- oder beidseitiger Test.
> **Fehler 1. Art**: H₀ wird abgelehnt, obwohl sie wahr ist (Wahrscheinlichkeit ≤ α). **Fehler 2. Art**: H₀ wird beibehalten, obwohl sie falsch ist.
> σ-Regeln: P(μ − 2σ ≤ X ≤ μ + 2σ) ≈ 95,4 % · 1,96σ ≈ 95 %.
Nullhypothese | Vermutung, die getestet und gegebenenfalls verworfen wird
Signifikanzniveau | maximale Irrtumswahrscheinlichkeit beim Ablehnen von H₀
Ablehnungsbereich | Bereich der Stichprobenwerte, in dem H₀ verworfen wird
Fehler 1. Art | H₀ wird abgelehnt, obwohl sie wahr ist
Fehler 2. Art | H₀ wird beibehalten, obwohl sie falsch ist
einseitiger Test | Ablehnungsbereich liegt nur auf einer Seite
Stichprobe | zufällige Auswahl, an der getestet wird
Sigma-Regel | Anteil der Werte innerhalb von k Standardabweichungen um μ
= n = 100, p = 0,5: σ | 5
= n = 100, p = 0,5: obere Grenze von μ + 2σ | 60
? Ein Fehler {{c1::1.}} Art liegt vor, wenn H₀ zu Unrecht abgelehnt wird.
! Was passiert, wenn man das Signifikanzniveau verkleinert? | Der Fehler 1. Art wird unwahrscheinlicher, der Fehler 2. Art wahrscheinlicher | Beide Fehler werden kleiner | Beide werden größer | Nichts
! Was ist ein Fehler 2. Art? | H₀ wird beibehalten, obwohl sie falsch ist | H₀ wird abgelehnt, obwohl sie wahr ist | Die Stichprobe ist zu groß | Der Test ist zweiseitig
`;

const blocks = [
  ["t1-zahlen", "t1-brueche", "t1-dezimal", "t1-geometrie"],
  ["t2-prozent", "t2-terme", "t2-lineare-funktionen", "t2-dreiecke", "t2-pythagoras", "t2-quadratisch", "t2-potenzen", "t2-kreis", "t2-wahrscheinlichkeit"],
  ["t3-ableitung", "t3-kurven"],
  ["t4-integral", "t4-exp-ln", "t4-vektoren", "t4-stochastik", "t4-hypothesentest"],
];

export default { units: parseCourse(text, { diagrams }), blocks, lk: ["t4-hypothesentest"], diagrams };
