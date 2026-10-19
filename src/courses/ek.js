// The geography course, Klasse 5 to the Abitur (after the NRW Kernlehrplan
// Erdkunde, Sek I and II). Format: see parseCourse in src/courses.js.
import { parseCourse } from "../courses.js";
import { diagram, INK, SOFT } from "./diagram.js";

const diagrams = {
  vulkan: diagram({
    w: 640, h: 440,
    shapes: `
      <path d="M 40 360 L 260 120 L 380 120 L 600 360 Z" fill="#C9B8A0" stroke="${INK}" stroke-width="2"/>
      <path d="M 90 360 L 270 165 M 140 360 L 285 205 M 550 360 L 370 165 M 500 360 L 355 205" stroke="#9E8B70" stroke-width="3"/>
      <path d="M 260 120 Q 320 150 380 120" fill="#7A6A58"/>
      <rect x="306" y="130" width="28" height="250" fill="#E2603C"/>
      <ellipse cx="320" cy="400" rx="120" ry="30" fill="#E2603C" stroke="#A8402A" stroke-width="2"/>
      <path d="M 334 140 Q 420 200 470 290" stroke="#E2603C" stroke-width="10" fill="none"/>
      <path d="M 300 110 Q 260 60 300 40 Q 330 10 370 40 Q 420 50 390 100 Z" fill="#A8A8A8" opacity="0.85"/>`,
    labels: [
      { text: "Aschewolke", x: 620, y: 40, anchor: "end", to: [390, 60] },
      { text: "Krater", x: 20, y: 90, to: [300, 128] },
      { text: "Schlot", x: 20, y: 250, to: [306, 250] },
      { text: "Lavastrom", x: 620, y: 230, anchor: "end", to: [440, 240] },
      { text: "Asche- und Lavaschichten", x: 20, y: 40, to: [120, 330] },
      { text: "Magmakammer", x: 20, y: 425, to: [210, 405] },
    ],
  }),
  wasserkreislauf: diagram({
    w: 660, h: 420,
    shapes: `
      <rect x="0" y="300" width="300" height="120" fill="#9CC4E8"/>
      <path d="M 300 300 L 420 230 L 520 170 L 660 150 L 660 420 L 300 420 Z" fill="#B8D49A" stroke="#6F9A4F" stroke-width="2"/>
      <path d="M 300 360 L 660 360 L 660 420 L 300 420 Z" fill="#8FB5D8" opacity="0.6"/>
      <circle cx="80" cy="70" r="34" fill="#F5C842"/>
      <path d="M 380 80 Q 400 50 440 60 Q 470 40 500 65 Q 530 70 520 100 L 390 100 Q 360 95 380 80 Z" fill="#D7DDE6" stroke="${SOFT}" stroke-width="2"/>
      <path d="M 410 110 L 400 140 M 440 110 L 430 140 M 470 110 L 460 140 M 500 110 L 490 140" stroke="#3E6CC0" stroke-width="3"/>
      <path d="M 150 290 Q 160 220 150 160" stroke="#3E6CC0" stroke-width="3" fill="none" stroke-dasharray="6 5"/>
      <path d="M 143 172 L 150 156 L 157 172" fill="none" stroke="#3E6CC0" stroke-width="3"/>
      <path d="M 200 140 Q 290 90 370 85" stroke="${SOFT}" stroke-width="3" fill="none"/>
      <path d="M 358 78 L 372 85 L 360 94" fill="none" stroke="${SOFT}" stroke-width="3"/>
      <path d="M 560 200 Q 460 270 330 300" stroke="#3E6CC0" stroke-width="4" fill="none"/>
      <path d="M 344 291 L 328 301 L 346 305" fill="none" stroke="#3E6CC0" stroke-width="3"/>
      <path d="M 470 230 L 470 340" stroke="#3E6CC0" stroke-width="3" stroke-dasharray="4 5"/>`,
    labels: [
      { text: "Verdunstung", x: 20, y: 230, to: [150, 220] },
      { text: "Kondensation", x: 180, y: 50, to: [440, 70] },
      { text: "Niederschlag", x: 640, y: 120, anchor: "end", to: [500, 125] },
      { text: "Abfluss", x: 640, y: 250, anchor: "end", to: [520, 225] },
      { text: "Versickerung", x: 640, y: 300, anchor: "end", to: [472, 300] },
      { text: "Grundwasser", x: 640, y: 405, anchor: "end", to: [560, 390] },
      { text: "Meer", x: 120, y: 375, anchor: "middle" },
    ],
  }),
};

const text = `
# t1-orientierung | Orientierung auf der Erde | Kontinente, Ozeane, Gradnetz, Karten
> **Kontinente**: Asien (größter), Afrika, Nordamerika, Südamerika, Antarktis, Europa, Australien/Ozeanien.
> **Ozeane**: Pazifik (größter), Atlantik, Indischer Ozean (dazu Nord- und Südpolarmeer).
> **Gradnetz**: **Breitenkreise** (parallel zum Äquator, 0°–90° Nord/Süd) und **Längenhalbkreise/Meridiane** (0° Greenwich, bis 180° Ost/West).
> **Karten**: physische Karte (Höhen, Gewässer), thematische Karte (ein Thema), Legende, **Maßstab** (1 : 100 000 → 1 cm = 1 km), Nordpfeil.
> Himmelsrichtungen: Norden, Osten, Süden, Westen (Kompass, Sonne mittags im Süden).
Kontinent | große zusammenhängende Landmasse, Erdteil
Ozean | großes Weltmeer
Äquator | größter Breitenkreis, teilt die Erde in Nord- und Südhalbkugel
Breitenkreis | Kreis parallel zum Äquator
Längenhalbkreis | Linie vom Nord- zum Südpol (Meridian)
Nullmeridian | Längenhalbkreis durch Greenwich
Maßstab | Verhältnis der Entfernung auf der Karte zur Wirklichkeit
Legende | Zeichenerklärung einer Karte
thematische Karte | Karte zu einem bestimmten Thema
Gradnetz | Netz aus Breiten- und Längenkreisen zur Ortsbestimmung
= Maßstab 1 : 50 000 – 2 cm auf der Karte sind wie viele km? | 1 km
= Wie viele Kontinente gibt es (Australien/Ozeanien als einer)? | 7
? Der größte Ozean ist der {{c1::Pazifik}}.
? Der Nullmeridian verläuft durch {{c1::Greenwich}}.
! Welcher Kontinent ist der größte? | Asien | Afrika | Nordamerika | Europa
! In welcher Himmelsrichtung steht die Sonne mittags bei uns? | im Süden | im Norden | im Osten | im Westen

# t1-landwirtschaft | Landwirtschaft | Ackerbau, Viehhaltung, Bio
> **Landwirtschaft** erzeugt Nahrungsmittel und Rohstoffe: **Ackerbau** (Weizen, Mais, Kartoffeln, Zuckerrüben) und **Viehhaltung** (Rinder, Schweine, Geflügel).
> Bodengüte, Klima und Relief bestimmen, was wo angebaut wird (Börden = fruchtbare Lössböden, z. B. Soester Börde).
> **Konventionelle** vs. **ökologische Landwirtschaft** (Bio): ohne chemische Pflanzenschutzmittel und Mineraldünger, artgerechte Tierhaltung.
> **Massentierhaltung**, **Intensivierung** und **Spezialisierung**; Sonderkulturen (Wein, Obst, Spargel).
> Strukturwandel: weniger, aber größere Höfe; Maschinen ersetzen Arbeitskräfte.
Ackerbau | Anbau von Nutzpflanzen auf Feldern
Viehhaltung | Halten von Nutztieren
Börde | fruchtbare Landschaft mit Lössboden
Löss | sehr fruchtbarer, feiner Boden
ökologische Landwirtschaft | Landwirtschaft ohne Kunstdünger und chemische Pflanzenschutzmittel
Massentierhaltung | Haltung sehr vieler Tiere auf engem Raum
Sonderkultur | Anbau besonderer Pflanzen wie Wein, Obst oder Spargel
Fruchtfolge | Wechsel der angebauten Pflanzen auf einem Feld
Monokultur | Anbau immer derselben Pflanze auf großer Fläche
= Ein Hof hat 120 ha, davon 30 % Wald. Wie viele ha Wald? | 36 ha
? Die Soester Börde hat sehr fruchtbare {{c1::Löss}}böden.
! Was ist ein Nachteil von Monokulturen? | Der Boden laugt aus und Schädlinge breiten sich aus | höhere Artenvielfalt | weniger Maschinen | bessere Böden
! Was kennzeichnet Bio-Landwirtschaft? | kein Kunstdünger und keine chemischen Pflanzenschutzmittel | mehr Tiere pro Stall | nur Maisanbau | Gentechnik

# t1-tourismus | Tourismus | Reiseziele, Folgen, sanfter Tourismus
> **Tourismus** = Reisen zur Erholung, Bildung oder Erlebnis. Beliebte Ziele: Küsten (Badeurlaub), Alpen (Wintersport), Städte.
> **Positive Folgen**: Arbeitsplätze, Einnahmen, Infrastruktur.
> **Negative Folgen**: Umweltbelastung (Müll, Wasserverbrauch, Verkehr, Zersiedelung), Saisonarbeit, steigende Preise für Einheimische, Massentourismus.
> **Sanfter Tourismus**: umwelt- und sozialverträglich – Anreise mit Bahn, regionale Produkte, Rücksicht auf Natur und Kultur.
> Beispiel Alpen: Skipisten, Schneekanonen, Lawinengefahr durch Abholzung.
Tourismus | Reisen zur Erholung, Bildung oder Erholung außerhalb des Wohnorts
Massentourismus | Tourismus vieler Menschen am selben Ort
sanfter Tourismus | umwelt- und sozialverträglicher Tourismus
Saisonarbeit | Arbeit nur während der Urlaubssaison
Infrastruktur | Einrichtungen wie Straßen, Strom- und Wasserversorgung
Zersiedelung | ungeordnete Bebauung der Landschaft
Schneekanone | Gerät zur Erzeugung künstlichen Schnees
Destination | Reiseziel
Ökotourismus | naturnaher Tourismus mit Schutzgedanken
? Reisen mit Rücksicht auf Natur und Einheimische heißt {{c1::sanfter}} Tourismus.
! Was ist eine negative Folge des Massentourismus? | hoher Wasserverbrauch und Müll | mehr Arbeitsplätze | bessere Straßen | höhere Einnahmen
! Was gehört zum sanften Tourismus? | Anreise mit der Bahn | Flug für ein Wochenende | neue Skipisten im Wald | große Hotelburgen

# t1-stadt | Leben in Stadt und Land | Stadtviertel, Pendler, Ruhrgebiet
> **Stadt**: viele Menschen, dichte Bebauung, viele Arbeitsplätze und Einrichtungen (Schulen, Krankenhäuser, Geschäfte).
> **Stadtviertel**: Innenstadt (City: Geschäfte, Büros), Wohnviertel, Industrie- und Gewerbegebiete, Stadtrand.
> **Pendler** fahren täglich zwischen Wohnort und Arbeitsort; Folgen: Staus, Verkehr.
> **Ruhrgebiet**: größter Ballungsraum Deutschlands, früher Kohle und Stahl, heute Dienstleistungen, Hochschulen, Kultur.
> **Ländlicher Raum**: Landwirtschaft, Natur, oft weniger Busverbindungen und Geschäfte.
Ballungsraum | Gebiet mit vielen Städten und Menschen auf engem Raum
Pendler | Person, die regelmäßig zwischen Wohn- und Arbeitsort fährt
City | Innenstadt mit Geschäften und Büros
Gewerbegebiet | Gebiet für Betriebe und Firmen
Infrastruktur (Stadt) | Verkehrswege, Versorgung, öffentliche Einrichtungen
Suburbanisierung | Abwanderung aus der Kernstadt ins Umland
Fußgängerzone | autofreier Einkaufsbereich in der Innenstadt
ländlicher Raum | dünn besiedelter Raum außerhalb der Städte
Zeche | Bergwerk, besonders im Ruhrgebiet
= Ein Pendler fährt täglich 25 km hin und zurück, 5 Tage. Kilometer pro Woche? | 250 km
? Der größte Ballungsraum Deutschlands ist das {{c1::Ruhrgebiet}}.
! Was beschreibt Suburbanisierung? | Menschen ziehen aus der Stadt ins Umland | Menschen ziehen aufs Dorf in die Berge | Städte schrumpfen auf null | Dörfer werden zu Städten erklärt

# t2-klimazonen | Klima und Klimazonen | Klimadiagramm, Vegetationszonen
> **Wetter** = kurzfristiger Zustand, **Klima** = durchschnittliches Wetter über mindestens 30 Jahre.
> **Klimadiagramm**: Temperaturkurve (rot, °C) und Niederschlagssäulen (blau, mm); humid (Niederschlag > Verdunstung) / arid (trocken).
> **Klimazonen**: Tropen (heiß, feucht – tropischer Regenwald), Subtropen (Wüsten, Mittelmeerklima), gemäßigte Zone (Laub- und Mischwald, Deutschland), kalte Zone/Polarzone (Tundra, Eis).
> Gründe: Einstrahlungswinkel der Sonne, Lage zum Meer (maritim/kontinental), Höhe (pro 100 m ca. 0,6 °C kälter).
> **Passatkreislauf**: Aufsteigen am Äquator (Regen), Absinken an den Wendekreisen (Wüsten).
Wetter | Zustand der Atmosphäre zu einem bestimmten Zeitpunkt
Klima | durchschnittlicher Wetterverlauf über mindestens 30 Jahre
Klimadiagramm | Darstellung von Temperatur und Niederschlag eines Ortes
humid | feucht: Niederschlag größer als Verdunstung
arid | trocken: Verdunstung größer als Niederschlag
maritimes Klima | Meeresklima mit milden Wintern und kühlen Sommern
kontinentales Klima | Landklima mit großen Temperaturunterschieden
Vegetationszone | Gebiet mit ähnlicher natürlicher Pflanzenwelt
Passat | beständiger Wind zwischen Wendekreis und Äquator
tropischer Regenwald | immergrüner Wald in den feuchten Tropen
= Am Fuß eines Bergs sind es 20 °C. Wie warm ist es 1000 m höher (−0,6 °C pro 100 m)? | 14 °C
= Monatsniederschläge 50, 60, 70 mm. Durchschnitt in mm | 60 mm
? Klima beschreibt das Wetter über mindestens {{c1::30}} Jahre.
! In welcher Klimazone liegt Deutschland? | gemäßigte Zone | Tropen | Subtropen | Polarzone
! Warum gibt es an den Wendekreisen viele Wüsten? | Dort sinkt trockene Luft ab | Dort regnet es täglich | Dort ist es am kältesten | Dort liegen die Ozeane

# t2-naturgefahren | Naturgefahren | Plattentektonik, Vulkane, Erdbeben
> Die Erdkruste besteht aus **Platten**, die auf dem zähflüssigen Mantel wandern (Konvektionsströme).
> **Plattengrenzen**: auseinander (divergent, Mittelatlantischer Rücken, Island), aufeinander zu (konvergent, **Subduktion** → Vulkane, Gebirge, Tiefseegraben), aneinander vorbei (Transformstörung, San-Andreas-Graben).
> **Vulkane**: Schichtvulkan (explosiv, steil, z. B. Vesuv) und Schildvulkan (flach, dünnflüssige Lava, z. B. Hawaii). **Pazifischer Feuerring**.
> **Erdbeben**: Spannungen lösen sich ruckartig; Stärke mit der **Richterskala** (logarithmisch); Gefahr durch Tsunamis.
> Schutz: Frühwarnsysteme, erdbebensicheres Bauen, Gefahrenkarten.
@ vulkan
Plattentektonik | Theorie der wandernden Erdkrustenplatten
Subduktion | Abtauchen einer Platte unter eine andere
Magma | geschmolzenes Gestein im Erdinneren
Lava | Magma, das an die Oberfläche austritt
Schichtvulkan | steiler Vulkan aus Asche- und Lavaschichten, explosiv
Schildvulkan | flacher Vulkan aus dünnflüssiger Lava
Pazifischer Feuerring | Vulkan- und Erdbebengürtel um den Pazifik
Epizentrum | Punkt an der Erdoberfläche über dem Erdbebenherd
Tsunami | Riesenwelle, oft durch Seebeben ausgelöst
Richterskala | logarithmische Skala für die Stärke von Erdbeben
= Ein Beben der Stärke 6 setzt etwa 32-mal so viel Energie frei wie eines der Stärke 5. Wie oft mehr bei Stärke 7 gegenüber 5? | 1024
? Bei der {{c1::Subduktion}} taucht eine Platte unter eine andere ab.
! Welcher Vulkantyp bricht meist explosiv aus? | Schichtvulkan | Schildvulkan | beide nie | nur unterseeische
! Was passiert an einer divergenten Plattengrenze? | Platten bewegen sich auseinander | Platten stoßen zusammen | Platten gleiten aneinander vorbei | nichts

# t2-wasser | Wasser als Ressource | Wasserkreislauf, Wasserknappheit
> **Wasserkreislauf**: Verdunstung → Kondensation (Wolken) → Niederschlag → Abfluss/Versickerung → Grundwasser → Meer.
> Nur ca. **3 %** des Wassers der Erde sind Süßwasser, davon der größte Teil im Eis gebunden.
> **Wasserknappheit**: Übernutzung (Bewässerungslandwirtschaft), Bevölkerungswachstum, Klimawandel; Beispiel Aralsee (ausgetrocknet durch Baumwollbewässerung).
> **Virtuelles Wasser**: Wasser, das zur Herstellung eines Produkts gebraucht wird (1 kg Rindfleisch ca. 15 000 l).
> Lösungen: Tröpfchenbewässerung, Meerwasserentsalzung, Wasserrecycling; Konflikte um Flüsse (Nil, Euphrat).
@ wasserkreislauf
Verdunstung | Übergang von Wasser in Wasserdampf
Kondensation | Wasserdampf wird zu Tröpfchen (Wolkenbildung)
Niederschlag | Regen, Schnee oder Hagel
Versickerung | Eindringen von Wasser in den Boden
Grundwasser | Wasser in den Hohlräumen des Untergrunds
Süßwasser | salzarmes Wasser in Flüssen, Seen, Eis und Grundwasser
virtuelles Wasser | Wassermenge, die für die Herstellung eines Produkts verbraucht wird
Tröpfchenbewässerung | sparsame Bewässerung direkt an der Pflanze
Meerwasserentsalzung | Gewinnung von Trinkwasser aus Meerwasser
Bewässerungslandwirtschaft | Landwirtschaft mit künstlicher Wasserzufuhr
= Etwa wie viel Prozent des Wassers auf der Erde sind Süßwasser? | 3
= Ein Haushalt verbraucht täglich 125 l pro Person. Liter pro Woche für 4 Personen? | 3500 l
? Der Aralsee schrumpfte durch die Bewässerung von {{c1::Baumwolle}}.
! Was ist virtuelles Wasser? | Wasser, das zur Herstellung eines Produkts nötig war | Wasser in Wolken | Wasser im Computer | Grundwasser
! Welche Reihenfolge stimmt? | Verdunstung → Kondensation → Niederschlag | Niederschlag → Verdunstung → Kondensation | Kondensation → Grundwasser → Verdunstung | Meer → Wolken → Verdunstung

# t2-globalisierung | Globalisierung und Entwicklung | Welthandel, Entwicklungsländer, Indikatoren
> **Globalisierung**: weltweite Verflechtung von Wirtschaft, Kommunikation und Kultur – möglich durch Containerschiffe, Internet, sinkende Transportkosten.
> **Globale Wertschöpfungsketten**: z. B. ein T-Shirt: Baumwolle aus Indien, Nähen in Bangladesch, Verkauf in Europa.
> **Entwicklungsstand** messen: BIP pro Kopf, **HDI** (Human Development Index: Lebenserwartung, Bildung, Einkommen), Kindersterblichkeit, Alphabetisierung.
> Länder des Globalen Südens vs. Industrieländer; **Schwellenländer** (China, Brasilien, Indien).
> **Fairer Handel**, Entwicklungszusammenarbeit, Hilfe zur Selbsthilfe.
Globalisierung | weltweite Verflechtung von Wirtschaft, Politik und Kultur
Wertschöpfungskette | Abfolge der Arbeitsschritte von der Rohware bis zum Produkt
BIP pro Kopf | Wirtschaftsleistung eines Landes geteilt durch die Einwohnerzahl
HDI | Index aus Lebenserwartung, Bildung und Einkommen
Schwellenland | Land auf dem Weg vom Entwicklungs- zum Industrieland
Globaler Süden | wirtschaftlich benachteiligte Länder, vor allem auf der Südhalbkugel
fairer Handel | Handel mit gerechten Preisen und Arbeitsbedingungen
Entwicklungszusammenarbeit | Unterstützung von Ländern bei ihrer Entwicklung
Containerisierung | Transport von Waren in genormten Containern
= Land mit BIP 500 Mrd. $ und 50 Mio. Einwohnern. BIP pro Kopf in $ | 10000 $
? Der HDI berücksichtigt Lebenserwartung, Bildung und {{c1::Einkommen}}.
! Was ermöglichte vor allem die Globalisierung? | billiger Transport und Kommunikation | weniger Handel | Grenzschließungen | höhere Zölle
! Welches Land ist ein Schwellenland? | Brasilien | Norwegen | Tschad | Schweiz

# t2-bevoelkerung | Bevölkerung und Migration | Wachstum, Pyramiden, Wanderung
> Die **Weltbevölkerung** wächst (über 8 Milliarden), besonders in Afrika und Südasien.
> **Bevölkerungspyramide**: Pyramide (wachsend, viele Kinder) – Glocke (stabil) – Urne (schrumpfend, alternd, z. B. Deutschland).
> **Modell des demografischen Übergangs**: Sterberate sinkt zuerst, Geburtenrate später → Phase starken Wachstums.
> **Migration**: Push-Faktoren (Krieg, Armut, Klima) und Pull-Faktoren (Arbeit, Sicherheit); Binnenmigration, Landflucht.
> Folgen in Deutschland: Fachkräftemangel, alternde Gesellschaft, Rentensystem.
Weltbevölkerung | Gesamtzahl der Menschen auf der Erde
Geburtenrate | Zahl der Geburten pro 1000 Einwohner und Jahr
Sterberate | Zahl der Todesfälle pro 1000 Einwohner und Jahr
Bevölkerungspyramide | Diagramm des Altersaufbaus einer Bevölkerung
demografischer Übergang | Modell vom Wandel der Geburten- und Sterberaten
Migration | dauerhafte Wanderung von Menschen
Binnenmigration | Wanderung innerhalb eines Landes
Überalterung | hoher Anteil älterer Menschen
Fertilitätsrate | durchschnittliche Kinderzahl pro Frau
= Geburtenrate 30 ‰, Sterberate 10 ‰. Natürliches Wachstum in ‰ | 20
= Wie viele Kinder pro Frau sind etwa nötig, damit eine Bevölkerung stabil bleibt? | 2,1
? Eine alternde Bevölkerung hat eine {{c1::Urnen}}form.
! Was ist ein Push-Faktor? | Krieg im Heimatland | gute Arbeitsplätze im Zielland | Sicherheit im Zielland | höhere Löhne im Zielland

# t3-ressourcen | Ressourcen und Energie | fossile und erneuerbare Energieträger
> **Ressourcen**: erneuerbar (Wind, Sonne, Wasser, Biomasse) und nicht erneuerbar (Erdöl, Erdgas, Kohle, Uran, Erze).
> **Fossile Energieträger** liefern noch den Großteil der Energie, setzen aber CO₂ frei; Förderung oft mit Umweltschäden (Ölsande, Fracking, Braunkohletagebau im Rheinischen Revier).
> **Energiewende** in Deutschland: Atomausstieg (2023), Kohleausstieg, Ausbau erneuerbarer Energien, Netze und Speicher (Wasserstoff).
> **Statische Reichweite** = Reserven / jährliche Förderung.
> Konflikte um Rohstoffe, Abhängigkeiten (Erdgas), seltene Erden für Elektronik.
Ressource | natürlicher Rohstoff oder Energieträger
fossiler Energieträger | Energieträger aus urzeitlicher Biomasse (Kohle, Öl, Gas)
erneuerbare Energie | Energie aus Quellen, die sich erneuern
Energiewende | Umstieg von fossiler und atomarer auf erneuerbare Energie
statische Reichweite | Reserven geteilt durch die jährliche Förderung
Fracking | Gasförderung durch Aufbrechen von Gestein mit Druck
Tagebau | Abbau von Rohstoffen an der Oberfläche
seltene Erden | Metalle, die für Elektronik und Magnete gebraucht werden
Reserven | bekannte, wirtschaftlich förderbare Vorkommen
= Reserven 100 Mrd. t, Förderung 4 Mrd. t pro Jahr. Statische Reichweite in Jahren | 25
? Deutschland stieg {{c1::2023}} aus der Atomkraft aus.
! Welcher Energieträger ist erneuerbar? | Wind | Erdöl | Braunkohle | Erdgas
! Wo liegt in NRW ein großes Braunkohlerevier? | Rheinisches Revier | Sauerland | Münsterland | Teutoburger Wald

# t3-landwirtschaft-global | Ernährung der Welt | Tragfähigkeit, Agrobusiness, Bodendegradation
> **Tragfähigkeit**: Wie viele Menschen kann ein Raum dauerhaft ernähren?
> Hunger trotz ausreichender Produktion – Ursachen: Armut, Kriege, Verteilung, Verschwendung, Klima.
> **Grüne Revolution**: Hochertragssorten, Dünger, Bewässerung – höhere Erträge, aber Umweltfolgen.
> **Agrobusiness**: große Konzerne kontrollieren Saatgut, Anbau und Handel; Exportprodukte (Soja für Tierfutter, Palmöl) verdrängen Regenwald.
> **Bodendegradation** und **Desertifikation** (z. B. Sahel) durch Übernutzung; Lösungen: nachhaltige Landwirtschaft, Agroforst.
Tragfähigkeit | Zahl der Menschen, die ein Raum dauerhaft versorgen kann
Grüne Revolution | Ertragssteigerung durch Hochertragssorten, Dünger und Bewässerung
Agrobusiness | großindustrielle, vernetzte Landwirtschaft
Desertifikation | Ausbreitung wüstenähnlicher Bedingungen durch den Menschen
Bodendegradation | Verschlechterung der Bodenqualität
Cash Crop | Agrarprodukt für den Export
Subsistenzwirtschaft | Landwirtschaft zur Selbstversorgung
Agroforst | Kombination von Bäumen mit Ackerbau oder Viehhaltung
Ernährungssicherheit | ausreichender Zugang zu Nahrung für alle
= 1 ha liefert 8 t Weizen; ein Mensch braucht 0,2 t im Jahr. Wie viele Menschen ernährt 1 ha? | 40
? Die Ausbreitung wüstenähnlicher Bedingungen heißt {{c1::Desertifikation}}.
! Was ist eine Cash Crop? | ein Agrarprodukt für den Export | Getreide für den eigenen Bedarf | ein Bargeldkredit | ein Bio-Siegel
! Was ist eine Hauptursache für Hunger heute? | Armut und Verteilung | zu wenig Ackerland weltweit allein | zu viele Traktoren | zu viel Regen überall

# t4-stadt | Stadtentwicklung | Verstädterung, Stadtmodelle, Gentrifizierung
> **Verstädterung**: Anteil der Stadtbevölkerung steigt weltweit (über 55 %), **Megastädte** über 10 Mio. Einwohner (Tokio, Lagos, Mumbai).
> In Ländern des Globalen Südens: Landflucht, **Marginalsiedlungen** (Slums, Favelas), informeller Sektor.
> **Stadtmodelle**: europäische Stadt (Altstadt, Ringe), nordamerikanische Stadt (CBD, Schachbrettgrundriss, Suburbs), orientalische und lateinamerikanische Stadt.
> **Gentrifizierung**: Aufwertung eines Viertels, steigende Mieten verdrängen alteingesessene Bewohner.
> **Nachhaltige Stadt**: ÖPNV, Grünflächen, kurze Wege, Klimaanpassung (Hitzeinseln).
Verstädterung | Zunahme der Stadtbevölkerung
Megastadt | Stadt mit über 10 Millionen Einwohnern
Marginalsiedlung | ungeplantes Armenviertel am Rand oder in der Stadt
informeller Sektor | Arbeit ohne Vertrag, Steuern und soziale Absicherung
CBD | Central Business District, Geschäftszentrum
Gentrifizierung | Aufwertung eines Viertels mit Verdrängung der Bewohner
Segregation | räumliche Trennung von Bevölkerungsgruppen in der Stadt
Reurbanisierung | Rückwanderung in die Kernstadt
städtische Wärmeinsel | Stadt ist wärmer als ihr Umland
= Eine Stadt wächst jährlich um 5 % von 2 Mio. Einwohnern. Einwohner nach 2 Jahren (in Mio.) | 2,205
? Die Aufwertung eines Viertels mit Verdrängung heißt {{c1::Gentrifizierung}}.
! Was ist typisch für die nordamerikanische Stadt? | Schachbrettgrundriss und CBD mit Hochhäusern | mittelalterliche Altstadt | Basar im Zentrum | Stadtmauer
! Was hilft gegen städtische Hitzeinseln? | mehr Grünflächen und Bäume | mehr Asphalt | breitere Straßen | mehr Parkplätze

# t4-strukturwandel | Wirtschaftsräume und Strukturwandel | Standortfaktoren, Ruhrgebiet, Tertiärisierung
> **Wirtschaftssektoren**: primär (Land- und Forstwirtschaft, Bergbau), sekundär (Industrie), tertiär (Dienstleistungen), quartär (Information, Forschung).
> **Standortfaktoren**: harte (Rohstoffe, Verkehr, Flächen, Lohnkosten) und weiche (Image, Kultur, Freizeitwert).
> **Strukturwandel im Ruhrgebiet**: Kohlekrise ab 1958, Schließung der Zechen (letzte 2018), Stahlkrise; neue Branchen: Logistik, Gesundheit, Hochschulen, Kultur (Zeche Zollverein).
> **Tertiärisierung**: wachsender Anteil des Dienstleistungssektors.
> **Cluster** (z. B. Silicon Valley), Deindustrialisierung und Reindustrialisierung, Globalisierung der Produktion.
primärer Sektor | Urproduktion: Land- und Forstwirtschaft, Fischerei, Bergbau
sekundärer Sektor | Industrie und Handwerk
tertiärer Sektor | Dienstleistungen
harter Standortfaktor | messbarer Standortvorteil wie Verkehr oder Lohnkosten
weicher Standortfaktor | schwer messbarer Faktor wie Image oder Kultur
Strukturwandel | Veränderung der Wirtschaftsstruktur einer Region
Tertiärisierung | Zunahme des Dienstleistungssektors
Cluster | Ballung verbundener Unternehmen einer Branche
Deindustrialisierung | Rückgang der Industrie in einer Region
Zeche Zollverein | stillgelegtes Bergwerk in Essen, heute UNESCO-Welterbe
= Jahr der Schließung der letzten Steinkohlenzeche im Ruhrgebiet | 2018
= Von 200 000 Beschäftigten arbeiten 150 000 im Dienstleistungssektor. Anteil in % | 75
? Dienstleistungen gehören zum {{c1::tertiären}} Sektor.
! Was ist ein weicher Standortfaktor? | Freizeitwert einer Stadt | Autobahnanschluss | Grundstückspreise | Steuersätze

# t4-disparitaeten | Räumliche Disparitäten und Klimawandel | Ungleichheit, Entwicklung, Klimafolgen
> **Disparitäten**: Unterschiede im Entwicklungsstand zwischen Räumen – global (Nord–Süd), national (Stadt–Land, Ost–West in Deutschland), regional.
> Ursachen: naturräumliche Gegebenheiten, Geschichte (Kolonialismus), Infrastruktur, Bildung, Politik.
> **Entwicklungstheorien**: Modernisierungstheorie, Dependenztheorie; Ziele für nachhaltige Entwicklung (**SDGs**, 17 Ziele der UN bis 2030).
> **Klimawandel**: anthropogener Treibhauseffekt, Folgen – Meeresspiegelanstieg, Extremwetter, Dürren, Klimaflucht; Klimaschutz (Pariser Abkommen 2015: unter 2 °C, möglichst 1,5 °C) und Anpassung.
Disparität | Ungleichheit der Lebensbedingungen zwischen Räumen
Modernisierungstheorie | Entwicklung durch Übernahme westlicher Strukturen
Dependenztheorie | Unterentwicklung durch Abhängigkeit von Industrieländern
SDGs | 17 Ziele für nachhaltige Entwicklung der UN
anthropogen | vom Menschen verursacht
Pariser Klimaabkommen | Vereinbarung von 2015, die Erwärmung deutlich unter 2 °C zu halten
Klimaanpassung | Maßnahmen, um mit den Folgen des Klimawandels umzugehen
Klimaflucht | Migration infolge von Klimafolgen
Meeresspiegelanstieg | Folge der Erwärmung durch Eisschmelze und Ausdehnung des Wassers
= Wie viele SDGs gibt es? | 17
= Jahr des Pariser Klimaabkommens | 2015
? Vom Menschen verursacht heißt {{c1::anthropogen}}.
! Was sagt die Dependenztheorie? | Unterentwicklung entsteht durch Abhängigkeit von reichen Ländern | Alle Länder entwickeln sich gleich | Klima bestimmt allein die Entwicklung | Industrie ist schädlich
`;

const blocks = [
  ["t1-orientierung", "t1-landwirtschaft", "t1-tourismus", "t1-stadt"],
  ["t2-klimazonen", "t2-naturgefahren", "t2-wasser", "t2-globalisierung", "t2-bevoelkerung"],
  ["t3-ressourcen", "t3-landwirtschaft-global"],
  ["t4-stadt", "t4-strukturwandel", "t4-disparitaeten"],
];

export default { units: parseCourse(text, { diagrams }), blocks, lk: [], diagrams };
