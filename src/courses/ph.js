// The physics course, Klasse 5 to the Abitur (after the NRW Kernlehrplan
// Physik, Sek I and II). Format: see parseCourse in src/courses.js.
import { parseCourse } from "../courses.js";
import { diagram, INK, SOFT } from "./diagram.js";

const meter = (cx, cy, letter) => `<circle cx="${cx}" cy="${cy}" r="22" fill="#FFFDF7" stroke="${INK}" stroke-width="3"/>`
  + `<text x="${cx}" y="${cy + 7}" text-anchor="middle" font-size="20" fill="${INK}">${letter}</text>`;

const sine = (() => {
  const pts = [];
  for (let x = 60; x <= 600; x += 6) pts.push(`${x},${200 - 90 * Math.sin(((x - 60) / 240) * 2 * Math.PI)}`);
  return pts.join(" ");
})();

const diagrams = {
  stromkreis: diagram({
    w: 640, h: 420,
    shapes: `
      <path d="M 120 110 L 520 110 L 520 330 L 120 330 Z" fill="none" stroke="${INK}" stroke-width="3"/>
      <rect x="100" y="190" width="40" height="60" fill="#FFFDF7"/>
      <line x1="96" y1="205" x2="144" y2="205" stroke="${INK}" stroke-width="4"/>
      <line x1="108" y1="225" x2="132" y2="225" stroke="${INK}" stroke-width="7"/>
      <rect x="260" y="95" width="70" height="30" fill="#FFFDF7"/>
      <line x1="262" y1="110" x2="320" y2="88" stroke="${INK}" stroke-width="3"/>
      <circle cx="262" cy="110" r="4" fill="${INK}"/><circle cx="328" cy="110" r="4" fill="${INK}"/>
      <circle cx="520" cy="220" r="26" fill="#FFF3B8" stroke="${INK}" stroke-width="3"/>
      <path d="M 502 202 L 538 238 M 538 202 L 502 238" stroke="${INK}" stroke-width="3"/>
      ${meter(320, 330, "A")}
      <path d="M 520 175 L 600 175 L 600 265 L 520 265" fill="none" stroke="${INK}" stroke-width="2.5"/>
      ${meter(600, 220, "V")}`,
    labels: [
      { text: "Spannungsquelle", x: 20, y: 392, to: [110, 225] },
      { text: "Schalter", x: 295, y: 60, anchor: "middle", to: [292, 98] },
      { text: "Lampe", x: 420, y: 230, anchor: "middle", to: [494, 220] },
      { text: "Strommessgerät", x: 320, y: 395, anchor: "middle", to: [320, 352] },
      { text: "Spannungsmessgerät", x: 630, y: 60, anchor: "end", to: [600, 198] },
    ],
  }),
  linse: diagram({
    w: 680, h: 400,
    shapes: `
      <line x1="20" y1="220" x2="660" y2="220" stroke="${SOFT}" stroke-width="2" stroke-dasharray="8 6"/>
      <path d="M 340 70 Q 372 220 340 370 Q 308 220 340 70 Z" fill="#CFE4F5" stroke="#4A7DB0" stroke-width="2.5"/>
      <circle cx="240" cy="220" r="5" fill="${INK}"/><circle cx="440" cy="220" r="5" fill="${INK}"/>
      <line x1="130" y1="220" x2="130" y2="140" stroke="#D0524F" stroke-width="5"/>
      <path d="M 120 152 L 130 136 L 140 152" fill="#D0524F" stroke="#D0524F" stroke-width="2"/>
      <line x1="130" y1="140" x2="340" y2="140" stroke="#E0A030" stroke-width="2"/>
      <line x1="340" y1="140" x2="531" y2="293" stroke="#E0A030" stroke-width="2"/>
      <line x1="130" y1="140" x2="531" y2="293" stroke="#6AAE5A" stroke-width="2"/>
      <line x1="531" y1="220" x2="531" y2="282" stroke="#4A7DB0" stroke-width="5"/>
      <path d="M 521 279 L 531 295 L 541 279" fill="#4A7DB0" stroke="#4A7DB0" stroke-width="2"/>
      <path d="M 340 250 L 440 250" stroke="${INK}" stroke-width="1.5"/><path d="M 340 244 L 340 256 M 440 244 L 440 256" stroke="${INK}" stroke-width="1.5"/>`,
    labels: [
      { text: "Gegenstand", x: 20, y: 110, to: [130, 150] },
      { text: "Brennpunkt", x: 200, y: 300, anchor: "middle", to: [240, 222] },
      { text: "Sammellinse", x: 340, y: 50, anchor: "middle", to: [340, 72] },
      { text: "Brennweite", x: 395, y: 330, to: [405, 252] },
      { text: "optische Achse", x: 660, y: 200, anchor: "end", to: [620, 220] },
      { text: "Bild", x: 600, y: 360, to: [531, 285] },
    ],
  }),
  welle: diagram({
    w: 660, h: 380,
    shapes: `
      <line x1="40" y1="200" x2="630" y2="200" stroke="${SOFT}" stroke-width="2" stroke-dasharray="8 6"/>
      <polyline points="${sine}" fill="none" stroke="#3E6CC0" stroke-width="4"/>
      <path d="M 120 100 L 360 100" stroke="${INK}" stroke-width="2"/><path d="M 120 92 L 120 108 M 360 92 L 360 108" stroke="${INK}" stroke-width="2"/>
      <path d="M 120 200 L 120 110" stroke="#D0524F" stroke-width="2.5"/><path d="M 113 120 L 120 108 L 127 120" fill="none" stroke="#D0524F" stroke-width="2.5"/>`,
    labels: [
      { text: "Wellenlänge", x: 240, y: 80, anchor: "middle", to: [240, 100] },
      { text: "Amplitude", x: 20, y: 265, to: [118, 160] },
      { text: "Wellenberg", x: 390, y: 60, to: [360, 112] },
      { text: "Wellental", x: 220, y: 345, anchor: "middle", to: [240, 290] },
      { text: "Ruhelage", x: 640, y: 240, anchor: "end", to: [600, 202] },
    ],
  }),
};

const text = `
# t1-temperatur | Temperatur und Wärme | Thermometer, Teilchen, Wärmetransport
> **Temperatur** misst man in Grad Celsius (°C) oder Kelvin (K): 0 °C = 273 K, absoluter Nullpunkt 0 K = −273 °C.
> Im **Teilchenmodell** bedeutet höhere Temperatur schnellere Teilchenbewegung. Stoffe dehnen sich beim Erwärmen meist aus (Ausnahme: Wasser zwischen 0 und 4 °C – **Anomalie des Wassers**).
> **Wärmetransport**: **Wärmeleitung** (in Stoffen, Metalle leiten gut), **Wärmeströmung/Konvektion** (Flüssigkeiten und Gase strömen), **Wärmestrahlung** (auch im Vakuum, z. B. Sonne).
> Gute Wärmedämmung: Luftpolster, Styropor, Wolle.
Temperatur | Maß dafür, wie warm oder kalt ein Körper ist
Kelvin | Einheit der absoluten Temperatur; 0 K ist der absolute Nullpunkt
Wärmeleitung | Wärmetransport durch einen Stoff ohne Materialfluss
Wärmeströmung | Wärmetransport durch strömende Flüssigkeiten oder Gase
Wärmestrahlung | Wärmetransport durch Strahlung, auch im Vakuum
Anomalie des Wassers | Wasser hat bei 4 °C seine größte Dichte
Wärmedämmung | Verringerung des Wärmetransports
Bimetall | zwei verbundene Metallstreifen, die sich beim Erwärmen biegen
Thermometer | Gerät zur Temperaturmessung
= 20 °C in Kelvin? | 293 K
= 300 K in °C? | 27 °C
? Wasser hat bei {{c1::4}} °C die größte Dichte.
? Die Sonne erwärmt die Erde durch {{c1::Wärmestrahlung}}.
! Warum ist eine Daunenjacke warm? | Sie enthält viel Luft, die schlecht leitet | Sie erzeugt Wärme | Sie strahlt Wärme ab | Sie ist schwarz
! Wie gelangt die Wärme der Heizung in den Raum? | vor allem durch Konvektion der Luft | nur durch Leitung | gar nicht | durch Schall

# t1-strom | Der elektrische Stromkreis | Leiter, Schaltungen, Sicherheit
> Ein **Stromkreis** braucht eine **Spannungsquelle**, einen geschlossenen Leiterweg und einen **Verbraucher**.
> **Leiter**: Metalle, Graphit, Salzwasser · **Isolatoren**: Kunststoff, Glas, Gummi, trockenes Holz.
> **Reihenschaltung**: ein Weg – fällt eine Lampe aus, sind alle aus. **Parallelschaltung**: mehrere Wege – Lampen unabhängig (so ist die Wohnung geschaltet).
> **UND-Schaltung** (Schalter in Reihe) · **ODER-Schaltung** (Schalter parallel) · **Wechselschaltung** (Treppenhaus).
> **Kurzschluss**: Strom fließt am Verbraucher vorbei – Sicherungen unterbrechen dann den Stromkreis. Steckdosenstrom (230 V) ist lebensgefährlich!
@ stromkreis
Stromkreis | geschlossener Weg für den elektrischen Strom
Leiter | Stoff, der den elektrischen Strom gut leitet
Isolator | Stoff, der den elektrischen Strom nicht leitet
Reihenschaltung | Bauteile hintereinander in einem einzigen Stromweg
Parallelschaltung | Bauteile nebeneinander in getrennten Stromwegen
Kurzschluss | Strom fließt ohne Verbraucher und wird sehr groß
Sicherung | unterbricht den Stromkreis bei zu großem Strom
UND-Schaltung | Lampe leuchtet nur, wenn beide Schalter geschlossen sind
Wechselschaltung | Licht lässt sich von zwei Stellen ein- und ausschalten
? Kunststoff ist ein {{c1::Isolator}}.
? In der Wohnung sind Geräte {{c1::parallel}} geschaltet.
? Eine {{c1::Sicherung}} schützt vor Überlastung.
! Was passiert in einer Reihenschaltung, wenn eine Lampe kaputtgeht? | Alle Lampen gehen aus | Die anderen leuchten heller | Nichts | Es gibt einen Kurzschluss
! Welcher Stoff leitet den Strom? | Kupfer | Glas | Gummi | Plastik

# t1-licht | Licht und Schatten | Ausbreitung, Reflexion, Finsternisse
> Licht breitet sich von **Lichtquellen** geradlinig aus (Modell **Lichtstrahl**). Beleuchtete Körper streuen Licht – nur so sehen wir sie.
> **Schatten** entsteht hinter lichtundurchlässigen Körpern; bei zwei Lichtquellen: **Kernschatten** und **Halbschatten**.
> **Mondphasen**: Neumond, zunehmender Mond, Vollmond, abnehmender Mond (Umlauf ca. 29,5 Tage).
> **Sonnenfinsternis**: Mond zwischen Sonne und Erde · **Mondfinsternis**: Erde zwischen Sonne und Mond.
> **Reflexionsgesetz**: Einfallswinkel = Reflexionswinkel (gemessen zum Lot). Glatte Flächen spiegeln, raue streuen.
Lichtquelle | Körper, der selbst Licht aussendet
Lichtstrahl | Modell für die geradlinige Ausbreitung des Lichts
Kernschatten | Bereich, der von keiner Lichtquelle beleuchtet wird
Halbschatten | Bereich, der nur von einem Teil der Lichtquellen beleuchtet wird
Reflexionsgesetz | Einfallswinkel ist gleich Reflexionswinkel
Lot | Senkrechte auf der spiegelnden Fläche
Sonnenfinsternis | der Mond verdeckt die Sonne
Mondfinsternis | der Mond liegt im Erdschatten
Streuung | Licht wird an rauen Flächen in alle Richtungen zurückgeworfen
= Einfallswinkel 35°. Reflexionswinkel? | 35°
? Bei einer {{c1::Sonnenfinsternis}} steht der Mond zwischen Sonne und Erde.
? Licht breitet sich {{c1::geradlinig}} aus.
! Warum sehen wir den Mond? | Er reflektiert das Sonnenlicht | Er leuchtet selbst | Er ist heiß | Er spiegelt die Erde
! Wo entsteht ein Kernschatten? | wo keine Lichtquelle hinscheint | überall hinter Glas | direkt an der Lampe | im Spiegel

# t1-schall | Schall | Schwingung, Frequenz, Lautstärke
> **Schall** entsteht durch **Schwingungen** und breitet sich als Druckwelle in einem Stoff aus – im Vakuum gibt es keinen Schall.
> Schallgeschwindigkeit in Luft ca. **340 m/s** (in Wasser schneller, ca. 1480 m/s).
> **Frequenz** (Hertz, Hz) = Schwingungen pro Sekunde → **Tonhöhe**. Menschen hören ca. 20 Hz bis 20 000 Hz; darüber **Ultraschall**, darunter **Infraschall**.
> **Amplitude** → **Lautstärke** (gemessen in Dezibel, dB). Ab ca. 85 dB auf Dauer gehörschädigend.
> **Echo**: reflektierter Schall – nutzen Fledermäuse und das Echolot.
Schwingung | regelmäßige Hin- und Herbewegung
Frequenz | Anzahl der Schwingungen pro Sekunde, Einheit Hertz
Amplitude | größte Auslenkung einer Schwingung
Ultraschall | Schall oberhalb von 20 000 Hz
Infraschall | Schall unterhalb von 20 Hz
Dezibel | Einheit für den Schallpegel
Echo | zurückgeworfener Schall
Schallgeschwindigkeit | in Luft etwa 340 m/s
Echolot | misst die Wassertiefe mit Schall
= Ein Echo kommt nach 2 s zurück (v = 340 m/s). Wie weit ist die Wand entfernt (in m)? | 340 m
= Eine Saite schwingt 440-mal pro Sekunde. Frequenz? | 440 Hz
? Im {{c1::Vakuum}} breitet sich kein Schall aus.
! Was bestimmt die Tonhöhe? | die Frequenz | die Amplitude | die Lautstärke | die Entfernung
! Was nutzen Fledermäuse zur Orientierung? | Ultraschall | Infraschall | Licht | Magnetfelder

# t2-bewegung | Bewegung und Geschwindigkeit | gleichförmig, beschleunigt, Diagramme
> **Geschwindigkeit** v = s / t (Weg durch Zeit), Einheiten m/s und km/h: 1 m/s = 3,6 km/h.
> **Gleichförmige Bewegung**: v konstant – im s-t-Diagramm eine Gerade.
> **Gleichmäßig beschleunigte Bewegung**: Beschleunigung a = Δv / Δt (m/s²), s = ½ · a · t², v = a · t.
> **Durchschnittsgeschwindigkeit** = Gesamtweg / Gesamtzeit.
> Anhalteweg = Reaktionsweg + Bremsweg; der Bremsweg wächst mit dem **Quadrat** der Geschwindigkeit.
Geschwindigkeit | Weg pro Zeit, v = s/t
gleichförmige Bewegung | Bewegung mit konstanter Geschwindigkeit
Beschleunigung | Änderung der Geschwindigkeit pro Zeit
Durchschnittsgeschwindigkeit | Gesamtweg geteilt durch Gesamtzeit
Reaktionsweg | Weg, der während der Reaktionszeit zurückgelegt wird
Bremsweg | Weg vom Beginn des Bremsens bis zum Stillstand
s-t-Diagramm | Darstellung des Weges über der Zeit
Momentangeschwindigkeit | Geschwindigkeit in einem bestimmten Augenblick
= Ein Radfahrer fährt 30 km in 2 h. Geschwindigkeit in km/h? | 15 km/h
= 20 m/s in km/h? | 72 km/h
= 108 km/h in m/s? | 30 m/s
= Ein Auto beschleunigt in 5 s von 0 auf 20 m/s. a in m/s²? | 4 m/s²
= Weg nach 4 s bei a = 2 m/s² aus dem Stand (in m)? | 16 m
? Verdoppelt man die Geschwindigkeit, vervierfacht sich der {{c1::Bremsweg}}.
! Wie sieht eine gleichförmige Bewegung im s-t-Diagramm aus? | als Gerade | als Parabel | als waagerechte Linie | als Kreis

# t2-kraft | Kräfte | Newton, Gewichtskraft, Reibung, Hebel
> **Kräfte** verformen Körper oder ändern ihre Bewegung. Einheit **Newton (N)**; Darstellung als Pfeil (Betrag, Richtung, Angriffspunkt).
> **Gewichtskraft** F_G = m · g mit g = 9,81 N/kg (Erde) – rund 10 N pro kg. Masse (kg) ist überall gleich, das Gewicht nicht.
> **Hookesches Gesetz**: F = D · s (Federkraft proportional zur Dehnung).
> **Wechselwirkungsprinzip**: Kraft = Gegenkraft. **Trägheit**: Körper behalten ihren Bewegungszustand bei.
> **Reibung**: Haft-, Gleit-, Rollreibung (Rollreibung am kleinsten).
> **Hebelgesetz**: F₁ · l₁ = F₂ · l₂ (Kraft · Kraftarm = Last · Lastarm). **Goldene Regel der Mechanik**: Was man an Kraft spart, muss man an Weg zusetzen.
Newton | Einheit der Kraft
Gewichtskraft | Kraft, mit der ein Körper von der Erde angezogen wird
Masse | Maß für Trägheit und Schwere, Einheit kg; ortsunabhängig
Federkonstante | gibt an, wie hart eine Feder ist (N/m)
Trägheit | Bestreben eines Körpers, seinen Bewegungszustand beizubehalten
Reibung | Kraft, die einer Bewegung entgegenwirkt
Hebelgesetz | Kraft mal Kraftarm gleich Last mal Lastarm
Kraftpfeil | Darstellung einer Kraft mit Richtung, Betrag und Angriffspunkt
Ortsfaktor | g, auf der Erde etwa 9,81 N/kg
= Gewichtskraft von 5 kg auf der Erde (g = 10 N/kg)? | 50 N
= Feder mit D = 200 N/m wird 0,05 m gedehnt. Kraft? | 10 N
= Hebel: 100 N greifen 0,2 m vom Drehpunkt an. Welche Kraft hält bei 0,5 m das Gleichgewicht? | 40 N
? Masse und Gewichtskraft sind nicht dasselbe: auf dem Mond ist die {{c1::Gewichtskraft}} kleiner.
! Welche Reibung ist meist am kleinsten? | Rollreibung | Haftreibung | Gleitreibung | alle gleich
! Warum fliegt man beim Bremsen nach vorn? | wegen der Trägheit | wegen der Reibung | wegen des Magnetfelds | wegen der Gewichtskraft

# t2-optik | Brechung und Linsen | Brechung, Sammellinse, Auge
> Beim Übergang in ein anderes Medium wird Licht **gebrochen**: von Luft in Glas/Wasser **zum Lot hin**, umgekehrt **vom Lot weg**.
> **Totalreflexion**: beim Übergang ins optisch dünnere Medium oberhalb des Grenzwinkels (Glasfaser).
> **Sammellinse** (konvex) bündelt parallele Strahlen im **Brennpunkt F**; **Zerstreuungslinse** (konkav) streut sie.
> Konstruktion: Parallelstrahl → Brennpunktstrahl, Mittelpunktstrahl geht gerade durch.
> **Linsengleichung**: 1/f = 1/g + 1/b · Abbildungsmaßstab B/G = b/g · **Brechkraft** D = 1/f (Dioptrie).
> **Auge**: Linse erzeugt ein umgekehrtes, verkleinertes Bild auf der Netzhaut. Kurzsichtig → Zerstreuungslinse, weitsichtig → Sammellinse.
@ linse
Brechung | Richtungsänderung des Lichts beim Übergang in ein anderes Medium
Totalreflexion | vollständige Reflexion an der Grenze zum optisch dünneren Medium
Brennpunkt | Punkt, in dem eine Sammellinse parallele Strahlen bündelt
Brennweite | Abstand zwischen Linsenmitte und Brennpunkt
Sammellinse | konvexe Linse, die Licht bündelt
Zerstreuungslinse | konkave Linse, die Licht streut
Brechkraft | Kehrwert der Brennweite, Einheit Dioptrie
Netzhaut | lichtempfindliche Schicht im Auge
Kurzsichtigkeit | ferne Gegenstände werden unscharf; Korrektur mit Zerstreuungslinse
= f = 10 cm, g = 30 cm. Bildweite b in cm? | 15 cm
= Brennweite 0,5 m. Brechkraft in Dioptrien? | 2
? Von Luft in Wasser wird Licht {{c1::zum Lot hin}} gebrochen.
? Glasfasern nutzen die {{c1::Totalreflexion}}.
! Welche Linse braucht ein Kurzsichtiger? | eine Zerstreuungslinse | eine Sammellinse | keine | ein Prisma
! Welcher Strahl geht ungebrochen durch eine Linse? | der Mittelpunktstrahl | der Parallelstrahl | der Brennpunktstrahl | keiner

# t2-elektrizitaet | Spannung, Stromstärke, Widerstand | Ohmsches Gesetz, Leistung
> **Stromstärke I** (Ampere, A): wie viel Ladung pro Sekunde fließt – Messung **in Reihe**.
> **Spannung U** (Volt, V): „Antrieb“ des Stroms – Messung **parallel**.
> **Widerstand R** (Ohm, Ω): R = U / I · **Ohmsches Gesetz**: bei konstanter Temperatur ist I ~ U.
> **Reihenschaltung**: I überall gleich, U teilt sich auf, R_ges = R₁ + R₂ · **Parallelschaltung**: U überall gleich, I teilt sich auf, 1/R_ges = 1/R₁ + 1/R₂
> **Elektrische Leistung** P = U · I (Watt) · **Energie** E = P · t (kWh)
Stromstärke | Ladung, die pro Sekunde durch einen Leiter fließt (Ampere)
Spannung | Antrieb des elektrischen Stroms (Volt)
Widerstand | Hemmung des Stromflusses, R = U/I (Ohm)
Ohmsches Gesetz | Stromstärke ist proportional zur Spannung
Amperemeter | Messgerät für die Stromstärke, in Reihe geschaltet
Voltmeter | Messgerät für die Spannung, parallel geschaltet
elektrische Leistung | P = U · I, Einheit Watt
Kilowattstunde | Energieeinheit: 1 kW eine Stunde lang
Ladung | Einheit Coulomb; Q = I · t
= U = 12 V, R = 20 Ω. Stromstärke? | 0,6 A
= I = 2 A, R = 115 Ω. Spannung? | 230 V
= U = 230 V, I = 5 A. Leistung? | 1150 W
= Reihenschaltung: 10 Ω und 30 Ω. Gesamtwiderstand? | 40 Ω
= Parallelschaltung: 20 Ω und 20 Ω. Gesamtwiderstand? | 10 Ω
= Ein 2-kW-Wasserkocher läuft 0,5 h. Energie in kWh? | 1 kWh
! Wie schaltet man ein Voltmeter? | parallel zum Bauteil | in Reihe | gar nicht | nur an die Batterie

# t2-energie | Energie | Energieformen, Erhaltung, Wirkungsgrad
> **Energie** (Joule, J) tritt in vielen **Formen** auf: Lageenergie, Bewegungsenergie, Spannenergie, thermische, elektrische, chemische, Strahlungsenergie, Kernenergie.
> **Energieerhaltungssatz**: Energie geht nicht verloren, sie wird nur umgewandelt (oft teilweise in Wärme = „entwertet“).
> **Lageenergie** E_pot = m · g · h · **Bewegungsenergie** E_kin = ½ · m · v²
> **Arbeit** W = F · s · **Leistung** P = W / t (Watt)
> **Wirkungsgrad** η = nutzbare Energie / zugeführte Energie (immer < 100 %).
> Regenerative Energien: Sonne, Wind, Wasser, Biomasse, Erdwärme.
Energieerhaltungssatz | Energie wird nicht erzeugt oder vernichtet, nur umgewandelt
Lageenergie | Energie durch die Höhe eines Körpers: m · g · h
Bewegungsenergie | Energie durch Bewegung: ½ · m · v²
Arbeit | Kraft mal Weg in Kraftrichtung
Leistung | Energie bzw. Arbeit pro Zeit
Wirkungsgrad | Verhältnis von Nutzenergie zu zugeführter Energie
Joule | Einheit der Energie
Energieentwertung | Umwandlung in nicht mehr nutzbare Wärme
regenerative Energie | Energie aus Quellen, die sich erneuern
= m = 2 kg, h = 5 m, g = 10 N/kg. Lageenergie? | 100 J
= m = 4 kg, v = 3 m/s. Bewegungsenergie? | 18 J
= 200 J Arbeit in 4 s. Leistung? | 50 W
= Eine Lampe nimmt 100 J auf und gibt 20 J Licht ab. Wirkungsgrad in %? | 20
! In welche Form wird Energie bei Umwandlungen meist teilweise entwertet? | Wärme | Licht | Lageenergie | Kernenergie

# t2-radioaktivitaet | Radioaktivität | Strahlung, Halbwertszeit, Schutz
> Instabile **Atomkerne** zerfallen und senden **ionisierende Strahlung** aus.
> **Alpha (α)**: Heliumkerne, kurze Reichweite, durch Papier abschirmbar · **Beta (β)**: Elektronen, durch Aluminium · **Gamma (γ)**: elektromagnetische Strahlung, nur durch dickes Blei/Beton abschwächbar.
> **Halbwertszeit**: Zeit, nach der die Hälfte der Kerne zerfallen ist (C-14: 5730 Jahre → Altersbestimmung).
> **Aktivität** in Becquerel (Bq) = Zerfälle pro Sekunde · **Äquivalentdosis** in Sievert (Sv).
> Schutz: **Abstand, Abschirmung, kurze Aufenthaltsdauer, keine Aufnahme in den Körper**.
> **Kernspaltung** (Uran, Kernkraftwerk) und **Kernfusion** (Sonne) setzen viel Energie frei.
Alphastrahlung | Strahlung aus Heliumkernen, durch Papier abschirmbar
Betastrahlung | Strahlung aus Elektronen
Gammastrahlung | energiereiche elektromagnetische Strahlung
Halbwertszeit | Zeit, nach der die Hälfte der Kerne zerfallen ist
Becquerel | Einheit der Aktivität: ein Zerfall pro Sekunde
Sievert | Einheit der Äquivalentdosis
Isotop | Atomart mit bestimmter Neutronenzahl
Kernspaltung | Zerlegung schwerer Kerne, setzt Energie frei
Kernfusion | Verschmelzung leichter Kerne, Energiequelle der Sonne
Geiger-Müller-Zählrohr | Messgerät für radioaktive Strahlung
= Halbwertszeit 8 Tage. Wie viel Prozent sind nach 16 Tagen noch übrig? | 25
= 1000 Kerne, nach 3 Halbwertszeiten noch wie viele? | 125
? {{c1::Alpha}}strahlung wird schon von einem Blatt Papier abgeschirmt.
! Welche Strahlung durchdringt am meisten? | Gammastrahlung | Alphastrahlung | Betastrahlung | alle gleich
! Was ist keine Schutzregel? | möglichst nah herangehen | Abstand halten | abschirmen | kurz aufhalten

# t3-kinematik | Kinematik | Bewegungsgleichungen, freier Fall, Wurf
> **Gleichmäßig beschleunigte Bewegung**: s(t) = ½ · a · t² + v₀ · t + s₀ · v(t) = a · t + v₀ · ohne Zeit: v² = v₀² + 2 · a · s
> **Freier Fall**: a = g = 9,81 m/s² (ohne Luftwiderstand fallen alle Körper gleich schnell).
> **Waagerechter Wurf**: Überlagerung (**Superposition**) von gleichförmiger Bewegung in x (v₀) und freiem Fall in y → Parabelbahn.
> **Schiefer Wurf**: Wurfweite maximal bei 45° (ohne Luftwiderstand).
> Diagramme: Steigung im s-t-Diagramm = v, Steigung im v-t-Diagramm = a, Fläche unter v-t = Weg.
Kinematik | Lehre von der Beschreibung der Bewegung
freier Fall | Fall ohne Luftwiderstand mit konstanter Beschleunigung g
Superpositionsprinzip | Teilbewegungen überlagern sich ungestört
waagerechter Wurf | Wurf mit waagerechter Anfangsgeschwindigkeit, Bahn ist eine Parabel
Fallbeschleunigung | g ≈ 9,81 m/s²
Momentangeschwindigkeit | Steigung der Tangente im s-t-Diagramm
Fläche unter dem v-t-Graphen | entspricht dem zurückgelegten Weg
Wurfparabel | Bahnkurve eines geworfenen Körpers
= Freier Fall aus dem Stand: Geschwindigkeit nach 3 s (g = 10 m/s²)? | 30 m/s
= Freier Fall: Fallweg in 2 s (g = 10 m/s²)? | 20 m
= Auto bremst von 20 m/s mit a = −4 m/s². Bremsweg? | 50 m
= Waagerechter Wurf aus 5 m Höhe (g = 10 m/s²). Fallzeit in s? | 1 s
? Ohne Luftwiderstand ist die Wurfweite bei {{c1::45}}° maximal.
! Was gibt die Steigung im v-t-Diagramm an? | die Beschleunigung | den Weg | die Kraft | die Masse

# t3-dynamik | Dynamik | Newtonsche Gesetze, Impuls, Energieerhaltung
> **1. Newtonsches Gesetz** (Trägheit): ohne resultierende Kraft keine Änderung der Bewegung.
> **2. Newtonsches Gesetz**: F = m · a
> **3. Newtonsches Gesetz**: actio = reactio.
> **Impuls** p = m · v; **Impulserhaltung** in abgeschlossenen Systemen. Elastischer Stoß: Impuls und kinetische Energie bleiben erhalten; unelastischer Stoß: nur der Impuls.
> **Kraftstoß** F · Δt = Δp (Airbag verlängert Δt → kleinere Kraft).
> **Energieerhaltung**: E_pot + E_kin = konstant (ohne Reibung) → v = √(2 · g · h).
Trägheitsgesetz | ein Körper bleibt in Ruhe oder gleichförmiger Bewegung ohne äußere Kraft
Grundgleichung der Mechanik | F = m · a
Wechselwirkungsgesetz | zu jeder Kraft gibt es eine gleich große Gegenkraft
Impuls | Produkt aus Masse und Geschwindigkeit
Impulserhaltungssatz | in einem abgeschlossenen System bleibt der Gesamtimpuls gleich
elastischer Stoß | Stoß, bei dem auch die Bewegungsenergie erhalten bleibt
unelastischer Stoß | Stoß, bei dem die Körper zusammenbleiben; Energie wird umgewandelt
Kraftstoß | Produkt aus Kraft und Einwirkdauer, ändert den Impuls
resultierende Kraft | Summe aller wirkenden Kräfte
= m = 1200 kg, a = 2 m/s². Kraft? | 2400 N
= F = 50 N, m = 10 kg. Beschleunigung? | 5 m/s²
= m = 0,5 kg, v = 4 m/s. Impuls in kg·m/s? | 2
= Freier Fall aus 5 m (g = 10 m/s²) ohne Reibung: Aufprallgeschwindigkeit? | 10 m/s
= Unelastischer Stoß: 2 kg mit 3 m/s trifft ruhende 1 kg. Gemeinsame Geschwindigkeit? | 2 m/s
! Warum schützt ein Airbag? | Er verlängert die Bremszeit und verringert so die Kraft | Er erhöht den Impuls | Er macht den Körper leichter | Er bremst das Auto

# t3-kreis-gravitation | Kreisbewegung und Gravitation | Zentripetalkraft, Kepler, Satelliten
> **Kreisbewegung**: Bahngeschwindigkeit v = 2π · r / T, Winkelgeschwindigkeit ω = 2π / T.
> Die **Zentripetalkraft** F_Z = m · v² / r zeigt zum Kreismittelpunkt.
> **Gravitationsgesetz**: F = G · m₁ · m₂ / r² mit G = 6,67 · 10⁻¹¹ N·m²/kg².
> **Keplersche Gesetze**: 1. Ellipsenbahnen, Sonne in einem Brennpunkt · 2. Flächensatz · 3. T² / a³ = konstant.
> **Satelliten**: Gravitation liefert die Zentripetalkraft; geostationäre Satelliten umrunden die Erde in 24 h über dem Äquator.
Zentripetalkraft | zum Kreismittelpunkt gerichtete Kraft bei einer Kreisbewegung
Umlaufzeit | Zeit für einen vollen Umlauf
Bahngeschwindigkeit | Geschwindigkeit auf der Kreisbahn
Winkelgeschwindigkeit | überstrichener Winkel pro Zeit
Gravitationsgesetz | Massen ziehen sich mit F = G · m₁m₂/r² an
Gravitationskonstante | G ≈ 6,67 · 10⁻¹¹ N·m²/kg²
1. Keplersches Gesetz | Planeten bewegen sich auf Ellipsen, die Sonne steht in einem Brennpunkt
3. Keplersches Gesetz | T²/a³ ist für alle Planeten gleich
geostationärer Satellit | steht scheinbar still über einem Punkt am Äquator
= m = 2 kg, v = 3 m/s, r = 1,5 m. Zentripetalkraft? | 12 N
= Doppelter Abstand: Wie ändert sich die Gravitationskraft (Faktor)? | 0,25
= r = 2 m, T = 4 s. Bahngeschwindigkeit in m/s (π ≈ 3,14)? | 3,14 m/s
? Die Zentripetalkraft zeigt zum {{c1::Mittelpunkt}}.
! Welche Kraft hält den Mond auf seiner Bahn? | die Gravitation | die Fliehkraft allein | der Luftwiderstand | Magnetismus

# t4-felder | Elektrische und magnetische Felder | Feldstärke, Kondensator, Lorentzkraft
> **Elektrisches Feld**: Feldstärke E = F / q (N/C); im Plattenkondensator homogen: E = U / d.
> **Kondensator**: Kapazität C = Q / U (Farad); Plattenkondensator C = ε₀ · εᵣ · A / d. Lade- und Entladekurven exponentiell.
> **Coulomb-Gesetz**: F = 1/(4πε₀) · q₁ · q₂ / r².
> **Magnetfeld**: Flussdichte B (Tesla). **Lorentzkraft** auf bewegte Ladungen: F = q · v · B (senkrecht), Drei-Finger-Regel.
> **Elektronen im Feld**: Beschleunigung durch U: ½ m v² = e · U; im Magnetfeld Kreisbahn (r = m·v / (e·B)) – Fadenstrahlrohr, e/m-Bestimmung.
> **Hall-Effekt**: Hallspannung U_H = B · v · d, Messung von Magnetfeldern.
elektrische Feldstärke | Kraft pro Ladung, E = F/q
homogenes Feld | Feld mit überall gleicher Stärke und Richtung
Kapazität | Fähigkeit eines Kondensators, Ladung zu speichern, C = Q/U
Plattenkondensator | zwei parallele Metallplatten mit homogenem Feld dazwischen
magnetische Flussdichte | Stärke des Magnetfelds, Einheit Tesla
Lorentzkraft | Kraft auf eine bewegte Ladung im Magnetfeld
Drei-Finger-Regel | bestimmt die Richtung der Lorentzkraft
Elementarladung | e ≈ 1,6 · 10⁻¹⁹ C
Fadenstrahlrohr | macht die Kreisbahn von Elektronen im Magnetfeld sichtbar
Hall-Effekt | Spannung quer zum Strom in einem Leiter im Magnetfeld
= U = 200 V, d = 0,02 m. Feldstärke im Plattenkondensator in V/m? | 10000 V/m
= C = 2 μF, U = 50 V. Ladung in μC? | 100 μC
= q = 2 C, v = 3 m/s, B = 0,5 T. Lorentzkraft? | 3 N
? Die Einheit der Kapazität ist das {{c1::Farad}}.
! Welche Bahn beschreibt ein Elektron senkrecht zu einem homogenen Magnetfeld? | eine Kreisbahn | eine Gerade | eine Parabel | eine Spirale nach außen

# t4-induktion | Elektromagnetische Induktion | Faraday, Lenz, Generator, Transformator
> **Induktion**: Ändert sich der magnetische Fluss Φ = B · A durch eine Leiterschleife, wird eine Spannung induziert: U_ind = −n · ΔΦ / Δt.
> **Lenzsche Regel**: Der Induktionsstrom ist so gerichtet, dass er seiner Ursache entgegenwirkt (Minuszeichen, Wirbelstrombremse).
> **Generator**: rotierende Spule im Magnetfeld → sinusförmige Wechselspannung.
> **Transformator**: U₁ / U₂ = n₁ / n₂ · I₁ / I₂ = n₂ / n₁ (ideal). Hochspannung beim Transport verringert Verluste (P_Verlust = I² · R).
> **Selbstinduktion**: Spule mit Induktivität L (Henry) wirkt Stromänderungen entgegen; Energie E = ½ L I².
magnetischer Fluss | Produkt aus Flussdichte und durchsetzter Fläche
Induktion | Entstehung einer Spannung durch Änderung des magnetischen Flusses
Lenzsche Regel | der induzierte Strom wirkt seiner Ursache entgegen
Generator | wandelt Bewegungsenergie in elektrische Energie um
Transformator | ändert die Wechselspannung über das Windungsverhältnis
Wirbelstrom | Induktionsstrom in massiven Metallteilen
Selbstinduktion | Induktion in einer Spule durch ihre eigene Stromänderung
Induktivität | Kenngröße einer Spule, Einheit Henry
Wechselspannung | Spannung, die periodisch ihre Richtung ändert
= Trafo: n₁ = 1000, n₂ = 50, U₁ = 230 V. U₂? | 11,5 V
= Trafo: U₁ = 10 V, U₂ = 1000 V, n₁ = 20. n₂? | 2000
= ΔΦ = 0,02 Wb in 0,1 s, n = 100. Betrag der induzierten Spannung? | 20 V
? Strom wird mit {{c1::Hochspannung}} übertragen, um Verluste klein zu halten.
! Was besagt die Lenzsche Regel? | Der Induktionsstrom wirkt seiner Ursache entgegen | Die Spannung ist immer null | Strom fließt nur im Kreis | Magnetfelder sind konstant

# t4-wellen | Schwingungen und Wellen | Interferenz, Doppelspalt, Beugung
> **Schwingung**: Periode T, Frequenz f = 1/T; Federpendel T = 2π · √(m/D), Fadenpendel T = 2π · √(l/g).
> **Welle**: c = λ · f. Transversalwellen (Licht) und Longitudinalwellen (Schall).
> **Huygens-Prinzip**: jeder Punkt einer Wellenfront ist Ausgangspunkt einer Elementarwelle → Beugung, Brechung.
> **Interferenz**: konstruktiv bei Gangunterschied Δs = k · λ, destruktiv bei Δs = (k + ½) · λ.
> **Doppelspalt/Gitter**: Maxima bei sin αₖ = k · λ / g (für kleine Winkel: aₖ / e ≈ k · λ / g).
> Interferenz beweist den **Wellencharakter** des Lichts; stehende Wellen und Resonanz.
@ welle
Periodendauer | Zeit für eine vollständige Schwingung
Wellenlänge | Abstand zweier benachbarter Wellenberge
Transversalwelle | Welle, bei der die Schwingung senkrecht zur Ausbreitung erfolgt
Longitudinalwelle | Welle, bei der die Schwingung in Ausbreitungsrichtung erfolgt
Huygens-Prinzip | jeder Punkt einer Wellenfront ist Ausgangspunkt einer Elementarwelle
Beugung | Ausbreitung einer Welle in den Schattenraum hinter einem Hindernis
Interferenz | Überlagerung von Wellen mit Verstärkung oder Auslöschung
Gangunterschied | Wegdifferenz zweier Wellen bis zu einem Punkt
stehende Welle | Überlagerung zweier gegenläufiger Wellen mit festen Knoten
Resonanz | starke Schwingung bei Anregung mit der Eigenfrequenz
= f = 50 Hz, λ = 6,8 m. Ausbreitungsgeschwindigkeit? | 340 m/s
= T = 0,02 s. Frequenz? | 50 Hz
= Licht mit λ = 500 nm, Frequenz in 10^14 Hz (c = 3 · 10^8 m/s)? | 6
? Konstruktive Interferenz tritt bei Gangunterschied k · {{c1::λ}} auf.
! Was beweist der Doppelspaltversuch für Licht? | den Wellencharakter | den Teilchencharakter allein | die Masse des Lichts | die Ladung des Lichts

# t4-quanten | Quantenphysik | Photoeffekt, Photon, Welle-Teilchen-Dualismus
> **Photoeffekt**: Licht löst Elektronen aus Metall – nur oberhalb einer **Grenzfrequenz**, unabhängig von der Intensität. Erklärung (Einstein): Licht besteht aus **Photonen** mit E = h · f.
> **Einstein-Gleichung**: E_kin = h · f − W_A (Austrittsarbeit).
> Plancksches Wirkungsquantum h = 6,63 · 10⁻³⁴ J·s; Photonenimpuls p = h / λ.
> **De-Broglie-Wellenlänge** von Teilchen: λ = h / p → Elektronenbeugung.
> **Welle-Teilchen-Dualismus**, Wahrscheinlichkeitsdeutung (|ψ|²), **Heisenbergsche Unbestimmtheitsrelation**: Δx · Δp ≥ h / (4π).
> Doppelspalt mit einzelnen Elektronen: Interferenzmuster baut sich aus Einzeltreffern auf.
Photoeffekt | Auslösen von Elektronen aus einem Metall durch Licht
Photon | Lichtquant mit der Energie E = h · f
Grenzfrequenz | Mindestfrequenz für den Photoeffekt
Austrittsarbeit | Energie, die ein Elektron zum Verlassen des Metalls braucht
Plancksches Wirkungsquantum | h ≈ 6,63 · 10⁻³⁴ J·s
De-Broglie-Wellenlänge | Wellenlänge eines Teilchens: λ = h/p
Welle-Teilchen-Dualismus | Quantenobjekte zeigen Wellen- und Teilcheneigenschaften
Unbestimmtheitsrelation | Ort und Impuls sind nicht gleichzeitig beliebig genau bestimmt
Elektronenvolt | Energieeinheit: 1 eV ≈ 1,6 · 10⁻¹⁹ J
= Photonenenergie 3 eV, Austrittsarbeit 2 eV. Maximale kinetische Energie in eV? | 1 eV
= f = 5 · 10^14 Hz, h = 6,6 · 10^-34 J·s. Photonenenergie in 10^-19 J? | 3,3
? Beim Photoeffekt hängt die Elektronenenergie von der {{c1::Frequenz}} ab, nicht von der Intensität.
! Was zeigt die Elektronenbeugung? | Elektronen haben Welleneigenschaften | Elektronen sind ungeladen | Licht hat Masse | Atome sind unteilbar

# t4-atom-kern | Atom- und Kernphysik | Energieniveaus, Spektren, Zerfall
> **Bohrsches Atommodell** (Wasserstoff): Elektronen auf diskreten Energieniveaus Eₙ = −13,6 eV / n².
> **Emission**: Übergang auf ein tieferes Niveau sendet ein Photon aus: h · f = E_oben − E_unten → **Linienspektrum**. Absorption umgekehrt (Fraunhofer-Linien).
> **Franck-Hertz-Versuch**: Elektronen geben Energie nur in Portionen (4,9 eV bei Hg) ab – Beleg für Energieniveaus.
> **Zerfallsgesetz**: N(t) = N₀ · e^(−λt), Halbwertszeit T½ = ln 2 / λ.
> **Kernbindungsenergie** und **Massendefekt**: E = Δm · c² – Spaltung schwerer und Fusion leichter Kerne setzen Energie frei.
> Zerfallsreihen, α-Zerfall (Massenzahl −4, Ordnungszahl −2), β⁻-Zerfall (Ordnungszahl +1).
Energieniveau | erlaubter Energiezustand eines Elektrons im Atom
Linienspektrum | Spektrum aus einzelnen Linien, typisch für ein Element
Emission | Aussenden eines Photons beim Übergang auf ein tieferes Niveau
Absorption | Aufnahme eines Photons, Elektron wird angeregt
Franck-Hertz-Versuch | belegt diskrete Energieniveaus im Atom
Zerfallskonstante | Wahrscheinlichkeit des Zerfalls pro Zeit
Massendefekt | Masse des Kerns ist kleiner als die Summe seiner Nukleonen
Bindungsenergie | Energie, die beim Zusammenfügen eines Kerns frei wird
Alphazerfall | Kern sendet einen Heliumkern aus
Betazerfall | ein Neutron wandelt sich in ein Proton und ein Elektron um
= Wasserstoff: Übergang von n = 2 (−3,4 eV) nach n = 1 (−13,6 eV). Photonenenergie in eV? | 10,2 eV
= U-238 zerfällt durch α. Neue Massenzahl? | 234
= Halbwertszeit 10 min. Wie viel Prozent sind nach 30 min übrig? | 12,5
? Beim β⁻-Zerfall steigt die Ordnungszahl um {{c1::1}}.
! Was belegt der Franck-Hertz-Versuch? | diskrete Energieniveaus im Atom | die Welleneigenschaft des Lichts | die Existenz von Neutronen | die Relativitätstheorie

# t4-relativitaet | Spezielle Relativitätstheorie | Lichtgeschwindigkeit, Zeitdilatation (LK)
> **Postulate** (Einstein 1905): 1. Die Naturgesetze gelten in allen Inertialsystemen gleich. 2. Die Lichtgeschwindigkeit c ≈ 3 · 10⁸ m/s ist in jedem Inertialsystem gleich.
> **Relativität der Gleichzeitigkeit**: Ereignisse, die in einem System gleichzeitig sind, sind es in einem anderen nicht unbedingt.
> **Zeitdilatation**: bewegte Uhren gehen langsamer: Δt = γ · Δt₀ mit γ = 1 / √(1 − v²/c²) (Myonen erreichen den Erdboden).
> **Längenkontraktion**: l = l₀ / γ.
> **Masse-Energie-Äquivalenz**: E = m · c²; relativistischer Impuls p = γ · m · v; nichts mit Masse erreicht c.
Inertialsystem | Bezugssystem, in dem das Trägheitsgesetz gilt
Lichtgeschwindigkeit | c ≈ 3 · 10⁸ m/s, in allen Inertialsystemen gleich
Zeitdilatation | bewegte Uhren gehen langsamer
Längenkontraktion | bewegte Körper sind in Bewegungsrichtung verkürzt
Lorentzfaktor | γ = 1/√(1 − v²/c²)
Eigenzeit | Zeit, die eine mitbewegte Uhr misst
Myonen-Experiment | Beleg für die Zeitdilatation
Masse-Energie-Äquivalenz | E = m · c²
Relativität der Gleichzeitigkeit | Gleichzeitigkeit hängt vom Bezugssystem ab
= v = 0,6 c. Lorentzfaktor γ? | 1,25
= γ = 2, Eigenzeit 1 s. Wie lange dauert es für den ruhenden Beobachter (in s)? | 2 s
= Wie viel Energie entspricht 1 g Masse (c = 3 · 10^8 m/s), in 10^13 J? | 9
? Bewegte Uhren gehen {{c1::langsamer}}.
! Was ist in jedem Inertialsystem gleich? | die Lichtgeschwindigkeit | die Zeit | die Länge | die Masse
`;

const blocks = [
  ["t1-temperatur", "t1-strom", "t1-licht", "t1-schall"],
  ["t2-bewegung", "t2-kraft", "t2-optik", "t2-elektrizitaet", "t2-energie", "t2-radioaktivitaet"],
  ["t3-kinematik", "t3-dynamik", "t3-kreis-gravitation"],
  ["t4-felder", "t4-induktion", "t4-wellen", "t4-quanten", "t4-atom-kern", "t4-relativitaet"],
];

export default { units: parseCourse(text, { diagrams }), blocks, lk: ["t4-relativitaet"], diagrams };
