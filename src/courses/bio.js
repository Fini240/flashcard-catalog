// The biology course, Klasse 5 to the Abitur (after the NRW Kernlehrplan
// Biologie, Sek I and II). Format: see parseCourse in src/courses.js.
import { parseCourse } from "../courses.js";
import { diagram, INK, SOFT } from "./diagram.js";

const diagrams = {
  pflanzenzelle: diagram({
    w: 640, h: 420,
    shapes: `
      <rect x="170" y="50" width="300" height="320" rx="18" fill="#DCEFD2" stroke="#4E7A3A" stroke-width="10"/>
      <rect x="182" y="62" width="276" height="296" rx="12" fill="#EEF7E8" stroke="#7FA86A" stroke-width="2"/>
      <ellipse cx="330" cy="235" rx="95" ry="85" fill="#CFE4F5" stroke="#6E9CC4" stroke-width="2"/>
      <circle cx="240" cy="130" r="36" fill="#E9D6F0" stroke="#8C5FA0" stroke-width="2"/>
      <circle cx="244" cy="126" r="11" fill="#B58CC6"/>
      <ellipse cx="415" cy="110" rx="26" ry="13" fill="#7DBB5A" stroke="#3F7A2A" stroke-width="2"/>
      <ellipse cx="420" cy="320" rx="26" ry="13" fill="#7DBB5A" stroke="#3F7A2A" stroke-width="2"/>
      <ellipse cx="215" cy="320" rx="24" ry="12" fill="#7DBB5A" stroke="#3F7A2A" stroke-width="2"/>
      <ellipse cx="440" cy="215" rx="16" ry="10" fill="#F2A65A" stroke="#B86A22" stroke-width="2"/>`,
    labels: [
      { text: "Zellwand", x: 20, y: 70, to: [172, 80] },
      { text: "Zellmembran", x: 20, y: 150, to: [184, 170] },
      { text: "Zellkern", x: 20, y: 230, to: [206, 138] },
      { text: "Zellplasma", x: 20, y: 380, to: [200, 260] },
      { text: "Chloroplast", x: 620, y: 70, anchor: "end", to: [425, 106] },
      { text: "Mitochondrium", x: 620, y: 200, anchor: "end", to: [452, 212] },
      { text: "Vakuole", x: 620, y: 290, anchor: "end", to: [400, 255] },
    ],
  }),
  bluete: diagram({
    w: 640, h: 440,
    shapes: `
      <rect x="312" y="300" width="16" height="130" fill="#6FA34F"/>
      <path d="M 280 300 Q 320 330 360 300 Q 320 285 280 300 Z" fill="#8CC06A" stroke="#4E7A3A" stroke-width="2"/>
      <path d="M 300 290 Q 220 300 200 340 Q 260 330 300 300 Z" fill="#8CC06A" stroke="#4E7A3A" stroke-width="2"/>
      <path d="M 340 290 Q 420 300 440 340 Q 380 330 340 300 Z" fill="#8CC06A" stroke="#4E7A3A" stroke-width="2"/>
      <path d="M 300 285 Q 190 230 190 150 Q 270 170 310 270 Z" fill="#F5B8C8" stroke="#C0607A" stroke-width="2"/>
      <path d="M 340 285 Q 450 230 450 150 Q 370 170 330 270 Z" fill="#F5B8C8" stroke="#C0607A" stroke-width="2"/>
      <ellipse cx="320" cy="270" rx="22" ry="26" fill="#9CCB7C" stroke="#4E7A3A" stroke-width="2"/>
      <rect x="315" y="150" width="10" height="100" fill="#B7D99A" stroke="#4E7A3A" stroke-width="1.5"/>
      <ellipse cx="320" cy="145" rx="16" ry="8" fill="#E8C24A" stroke="#A8862A" stroke-width="2"/>
      <line x1="300" y1="262" x2="262" y2="178" stroke="#A8862A" stroke-width="3"/>
      <ellipse cx="260" cy="172" rx="11" ry="7" fill="#F2D35C" stroke="#A8862A" stroke-width="2"/>
      <line x1="340" y1="262" x2="378" y2="178" stroke="#A8862A" stroke-width="3"/>
      <ellipse cx="380" cy="172" rx="11" ry="7" fill="#F2D35C" stroke="#A8862A" stroke-width="2"/>`,
    labels: [
      { text: "Narbe", x: 20, y: 60, to: [312, 142] },
      { text: "Staubbeutel", x: 20, y: 130, to: [252, 172] },
      { text: "Kronblatt", x: 20, y: 220, to: [215, 190] },
      { text: "Kelchblatt", x: 20, y: 380, to: [225, 330] },
      { text: "Griffel", x: 620, y: 60, anchor: "end", to: [326, 200] },
      { text: "Staubfaden", x: 620, y: 140, anchor: "end", to: [365, 210] },
      { text: "Fruchtknoten", x: 620, y: 290, anchor: "end", to: [342, 270] },
    ],
  }),
  herz: diagram({
    w: 640, h: 460,
    shapes: `
      <path d="M 200 60 L 200 150" stroke="#5A7FC4" stroke-width="28" fill="none"/>
      <path d="M 330 150 Q 330 40 430 40 L 470 40" stroke="#D0524F" stroke-width="30" fill="none"/>
      <path d="M 290 150 Q 270 70 180 80" stroke="#6E8FD0" stroke-width="22" fill="none" opacity="0.9"/>
      <path d="M 150 170 Q 150 140 190 140 L 450 140 Q 490 140 490 170 L 490 300 Q 490 420 320 440 Q 150 420 150 300 Z" fill="#F4C9C4" stroke="#B5534C" stroke-width="3"/>
      <line x1="320" y1="140" x2="320" y2="430" stroke="#B5534C" stroke-width="5"/>
      <line x1="150" y1="250" x2="490" y2="250" stroke="#B5534C" stroke-width="3" stroke-dasharray="10 6"/>
      <rect x="160" y="150" width="152" height="94" rx="10" fill="#C9D6F2"/>
      <rect x="160" y="258" width="152" height="150" rx="10" fill="#B3C5EE"/>
      <rect x="328" y="150" width="152" height="94" rx="10" fill="#F2C2BE"/>
      <rect x="328" y="258" width="152" height="150" rx="10" fill="#EBA8A2"/>
      <rect x="215" y="244" width="40" height="12" rx="3" fill="${INK}"/>
      <rect x="385" y="244" width="40" height="12" rx="3" fill="${INK}"/>`,
    labels: [
      { text: "obere Hohlvene", x: 20, y: 50, to: [200, 70] },
      { text: "rechter Vorhof", x: 20, y: 180, to: [200, 195] },
      { text: "Segelklappe", x: 20, y: 250, to: [225, 250] },
      { text: "rechte Kammer", x: 20, y: 360, to: [200, 330] },
      { text: "Aorta", x: 620, y: 40, anchor: "end", to: [470, 40] },
      { text: "Lungenarterie", x: 620, y: 100, anchor: "end", to: [262, 100] },
      { text: "linker Vorhof", x: 620, y: 185, anchor: "end", to: [440, 195] },
      { text: "linke Kammer", x: 620, y: 360, anchor: "end", to: [440, 330] },
    ],
  }),
  nervenzelle: diagram({
    w: 660, h: 340,
    shapes: `
      <path d="M 70 170 L 30 120 M 70 170 L 20 175 M 70 170 L 35 230 M 95 135 L 85 70 M 95 205 L 90 280" stroke="${INK}" stroke-width="4" fill="none"/>
      <circle cx="100" cy="170" r="42" fill="#E9D6F0" stroke="#8C5FA0" stroke-width="3"/>
      <circle cx="100" cy="170" r="13" fill="#B58CC6"/>
      <line x1="142" y1="170" x2="560" y2="170" stroke="${INK}" stroke-width="5"/>
      <rect x="175" y="156" width="80" height="28" rx="14" fill="#F4E3A1" stroke="#B89A3A" stroke-width="2"/>
      <rect x="275" y="156" width="80" height="28" rx="14" fill="#F4E3A1" stroke="#B89A3A" stroke-width="2"/>
      <rect x="375" y="156" width="80" height="28" rx="14" fill="#F4E3A1" stroke="#B89A3A" stroke-width="2"/>
      <path d="M 560 170 L 610 120 M 560 170 L 620 172 M 560 170 L 610 222" stroke="${INK}" stroke-width="4" fill="none"/>
      <circle cx="612" cy="118" r="9" fill="#9CC4E8" stroke="${SOFT}" stroke-width="2"/>
      <circle cx="624" cy="172" r="9" fill="#9CC4E8" stroke="${SOFT}" stroke-width="2"/>
      <circle cx="612" cy="224" r="9" fill="#9CC4E8" stroke="${SOFT}" stroke-width="2"/>`,
    labels: [
      { text: "Dendrit", x: 20, y: 40, to: [80, 80] },
      { text: "Zellkörper", x: 20, y: 320, to: [92, 200] },
      { text: "Axon", x: 480, y: 120, to: [500, 170] },
      { text: "Myelinscheide", x: 160, y: 120, to: [215, 158] },
      { text: "Schnürring", x: 230, y: 250, to: [265, 172] },
      { text: "Endknöpfchen", x: 640, y: 290, anchor: "end", to: [612, 232] },
    ],
  }),
};

const text = `
# t1-wirbeltiere | Wirbeltiere | Klassen, Merkmale, Angepasstheit
> Wirbeltiere haben eine **Wirbelsäule** und ein **Innenskelett**. Es gibt fünf Klassen.
> - **Fische**: Kiemen, Schuppen, wechselwarm, Eier im Wasser
> - **Amphibien**: Larve mit Kiemen, später Lunge und Hautatmung, feuchte Haut, wechselwarm
> - **Reptilien**: Hornschuppen, Lunge, Eier mit Schale an Land, wechselwarm
> - **Vögel**: Federn, Lunge, gleichwarm, hartschalige Eier
> - **Säugetiere**: Fell, Lunge, gleichwarm, Junge werden gesäugt
> **gleichwarm**: Körpertemperatur bleibt konstant · **wechselwarm**: Körpertemperatur folgt der Umgebung
> **Angepasstheit**: Bau und Lebensweise passen zum Lebensraum (z. B. Stromlinienform beim Fisch).
gleichwarm | Körpertemperatur bleibt unabhängig von der Umgebung gleich
wechselwarm | Körpertemperatur passt sich der Umgebung an
Kiemen | Atmungsorgan der Fische, nimmt Sauerstoff aus dem Wasser auf
Metamorphose | Umwandlung der Larve zum erwachsenen Tier (z. B. Kaulquappe → Frosch)
Säugetier | Wirbeltier mit Fell, das seine Jungen mit Milch säugt
Pflanzenfresser | Tier, das sich von Pflanzen ernährt; breite Mahlzähne
Fleischfresser | Tier, das andere Tiere frisst; Fang- und Reißzähne
Allesfresser | Tier, das Pflanzen und Tiere frisst (z. B. Mensch, Schwein)
Stromlinienform | Körperform, die wenig Wasser- oder Luftwiderstand bietet
Winterschlaf | Ruhezustand mit stark gesenkter Körpertemperatur (z. B. Igel)
? Vögel und Säugetiere sind {{c1::gleichwarm}}.
? Fische atmen mit {{c1::Kiemen}}.
? Amphibien durchlaufen eine {{c1::Metamorphose}}.
? Reptilien legen Eier mit einer festen {{c1::Schale}} an Land.
! Welches Merkmal haben nur Säugetiere? | Sie säugen ihre Jungen | Sie legen Eier | Sie atmen mit Lungen | Sie haben eine Wirbelsäule
! Zu welcher Klasse gehört der Frosch? | Amphibien | Reptilien | Fische | Säugetiere
! Was bedeutet „wechselwarm“? | Die Körpertemperatur folgt der Umgebung | Das Tier schwitzt viel | Das Tier hält Winterschlaf | Das Tier ist nachtaktiv
! Welches Tier ist ein Säugetier? | Wal | Hai | Pinguin | Krokodil

# t1-pflanzen | Blütenpflanzen | Aufbau, Bestäubung, Fotosynthese
> Eine Blütenpflanze besteht aus **Wurzel, Sprossachse, Blättern und Blüten**.
> Die Blüte dient der **Fortpflanzung**: Staubblätter (männlich) bilden Pollen, der Stempel (weiblich: Narbe, Griffel, Fruchtknoten) enthält die Samenanlagen.
> **Bestäubung**: Pollen gelangt auf die Narbe (durch Insekten oder Wind). **Befruchtung**: Pollenschlauch wächst zur Eizelle, Kerne verschmelzen.
> Aus dem Fruchtknoten wird die **Frucht**, aus der Samenanlage der **Samen**.
> **Fotosynthese** (vereinfacht): Kohlenstoffdioxid + Wasser → (Licht, Chlorophyll) → Traubenzucker + Sauerstoff
@ bluete
Bestäubung | Übertragung von Pollen auf die Narbe
Befruchtung | Verschmelzung von Eizelle und Spermazelle aus dem Pollen
Keimung | Wachstum eines Keimlings aus dem Samen
Chlorophyll | grüner Blattfarbstoff, fängt Lichtenergie ein
Fotosynthese | Aufbau von Traubenzucker aus CO₂ und Wasser mithilfe von Licht
Spaltöffnung | Öffnung an der Blattunterseite für den Gasaustausch
Wurzel | verankert die Pflanze, nimmt Wasser und Mineralstoffe auf
Sprossachse | Stängel; trägt Blätter und leitet Wasser und Nährstoffe
Samenverbreitung | Ausbreitung der Samen durch Wind, Tiere oder Wasser
? Bei der Fotosynthese entsteht {{c1::Sauerstoff}}.
? Der grüne Farbstoff der Blätter heißt {{c1::Chlorophyll}}.
? Aus dem {{c1::Fruchtknoten}} entwickelt sich die Frucht.
! Was braucht eine Pflanze für die Fotosynthese? | Licht, Wasser und Kohlenstoffdioxid | Sauerstoff und Zucker | nur Erde | Wärme und Stickstoff
! Was ist Bestäubung? | Pollen gelangt auf die Narbe | Der Samen keimt | Die Blätter fallen ab | Die Wurzel nimmt Wasser auf
! Welcher Teil der Blüte ist männlich? | Staubblatt | Narbe | Fruchtknoten | Kelchblatt

# t1-zelle | Zellen und Mikroskop | Pflanzen- und Tierzelle
> Alle Lebewesen bestehen aus **Zellen** – der kleinsten lebenden Einheit.
> Mit dem **Lichtmikroskop** sieht man Zellen: Vergrößerung = Okularvergrößerung · Objektivvergrößerung.
> **Tier- und Pflanzenzelle** haben: Zellmembran, Zellplasma, Zellkern, Mitochondrien.
> Nur die **Pflanzenzelle** hat zusätzlich: Zellwand, große Vakuole, Chloroplasten.
> Zellkern = Steuerzentrale (enthält die Erbinformation) · Mitochondrien = „Kraftwerke“ (Zellatmung) · Chloroplasten = Ort der Fotosynthese
@ pflanzenzelle
Zellkern | enthält die Erbinformation und steuert die Zelle
Zellmembran | dünne Hülle, regelt den Stoffaustausch
Zellwand | feste Hülle aus Cellulose, gibt der Pflanzenzelle Form
Chloroplast | Zellorganell, in dem die Fotosynthese stattfindet
Mitochondrium | Zellorganell der Zellatmung, liefert Energie
Vakuole | flüssigkeitsgefüllter Raum der Pflanzenzelle, sorgt für Festigkeit
Zellplasma | gelartige Grundsubstanz im Inneren der Zelle
Objektiv | Linse des Mikroskops nahe am Präparat
Okular | Linse des Mikroskops, durch die man schaut
= Okular 10-fach, Objektiv 40-fach: Gesamtvergrößerung? | 400
= Okular 10-fach, Objektiv 10-fach: Gesamtvergrößerung? | 100
! Was hat nur die Pflanzenzelle? | Zellwand | Zellkern | Zellmembran | Mitochondrien
! Wo findet die Fotosynthese statt? | in den Chloroplasten | im Zellkern | in der Vakuole | in der Zellmembran

# t1-ernaehrung | Ernährung und Verdauung | Nährstoffe, Verdauungsorgane
> **Nährstoffe**: Kohlenhydrate (Energie), Fette (Energie, Speicher), Eiweiße/Proteine (Baustoff).
> **Ergänzungsstoffe**: Vitamine, Mineralstoffe, Ballaststoffe, Wasser.
> **Verdauung** zerlegt die Nährstoffe in kleine Bausteine, die ins Blut gelangen:
> Mund (Zähne, Speichel) → Speiseröhre → Magen (Magensaft, Säure) → Dünndarm (Hauptverdauung, Aufnahme ins Blut über Darmzotten) → Dickdarm (Wasserentzug) → After
> **Enzyme** zerlegen die Nährstoffe: Stärke → Zucker, Eiweiß → Aminosäuren, Fett → Glycerin + Fettsäuren.
Kohlenhydrate | Nährstoffe, die vor allem Energie liefern (z. B. Stärke, Zucker)
Eiweiß | Nährstoff für den Aufbau von Körpersubstanz (Protein)
Ballaststoffe | unverdauliche Pflanzenfasern, fördern die Verdauung
Speichel | beginnt im Mund die Verdauung der Stärke
Magen | zersetzt Nahrung mit Magensaft und Salzsäure
Dünndarm | Hauptort der Verdauung und der Aufnahme ins Blut
Darmzotten | Ausstülpungen im Dünndarm, vergrößern die Oberfläche
Dickdarm | entzieht dem Nahrungsbrei Wasser
Enzym | Stoff, der Nährstoffe in kleinere Bausteine zerlegt
? Eiweiße werden in {{c1::Aminosäuren}} zerlegt.
? Die meisten Nährstoffe werden im {{c1::Dünndarm}} ins Blut aufgenommen.
? Stärke wird zu {{c1::Zucker}} abgebaut.
! Welcher Nährstoff ist vor allem Baustoff? | Eiweiß | Fett | Zucker | Wasser
! Wozu dienen die Darmzotten? | Sie vergrößern die Oberfläche für die Aufnahme | Sie zerkleinern die Nahrung | Sie bilden Magensäure | Sie speichern Fett

# t1-bewegung | Skelett und Bewegung | Knochen, Gelenke, Muskeln
> Das **Skelett** stützt den Körper und schützt Organe (Schädel → Gehirn, Brustkorb → Herz und Lunge).
> **Gelenke** verbinden Knochen beweglich: Kugelgelenk (Schulter, Hüfte), Scharniergelenk (Knie, Ellenbogen), Sattelgelenk (Daumen).
> Muskeln können sich nur **zusammenziehen** – deshalb arbeiten sie paarweise als **Gegenspieler**: Beuger (Bizeps) und Strecker (Trizeps).
> **Sehnen** verbinden Muskeln mit Knochen, **Bänder** verbinden Knochen mit Knochen.
> Die Wirbelsäule ist doppelt S-förmig gebogen und federt Stöße ab; Bandscheiben dämpfen zwischen den Wirbeln.
Kugelgelenk | Gelenk, das Bewegung in alle Richtungen erlaubt (z. B. Schulter)
Scharniergelenk | Gelenk, das nur in eine Richtung beugt (z. B. Knie)
Gegenspielerprinzip | zwei Muskeln bewegen einen Knochen in entgegengesetzte Richtungen
Bizeps | Beugermuskel des Oberarms
Trizeps | Streckermuskel des Oberarms
Sehne | verbindet Muskel und Knochen
Band | verbindet Knochen miteinander
Bandscheibe | knorpelige Scheibe zwischen den Wirbeln, dämpft Stöße
Gelenkknorpel | glatte Schicht auf den Gelenkflächen, verringert Reibung
? Muskeln können sich nur {{c1::zusammenziehen}}.
? Beim Beugen des Arms zieht sich der {{c1::Bizeps}} zusammen.
? Das Kniegelenk ist ein {{c1::Scharniergelenk}}.
! Welches Gelenk ist ein Kugelgelenk? | Hüftgelenk | Kniegelenk | Fingergelenk | Ellenbogengelenk
! Was schützt der Brustkorb? | Herz und Lunge | Gehirn | Magen | Nieren

# t2-oekosystem | Ökosystem Wald | Nahrungsnetz, Stoffkreislauf, Faktoren
> Ein **Ökosystem** = Lebensraum (**Biotop**) + Lebensgemeinschaft (**Biozönose**).
> **Abiotische Faktoren**: unbelebte Umwelt (Licht, Temperatur, Wasser, Boden). **Biotische Faktoren**: Einfluss anderer Lebewesen (Konkurrenz, Räuber, Parasiten).
> **Produzenten** (Pflanzen) bauen durch Fotosynthese organische Stoffe auf, **Konsumenten** (Tiere) fressen sie, **Destruenten** (Bakterien, Pilze) zersetzen tote Reste zu Mineralstoffen.
> **Nahrungskette**: Buche → Raupe → Meise → Sperber. Viele verknüpfte Ketten bilden ein **Nahrungsnetz**.
> Der Wald hat **Stockwerke**: Wurzel-, Moos-, Kraut-, Strauch-, Baumschicht.
Biotop | Lebensraum mit seinen unbelebten Bedingungen
Biozönose | Lebensgemeinschaft aller Lebewesen eines Biotops
abiotischer Faktor | Umweltfaktor der unbelebten Natur (z. B. Licht, Temperatur)
biotischer Faktor | Umweltfaktor, der von Lebewesen ausgeht (z. B. Konkurrenz)
Produzent | Lebewesen, das organische Stoffe selbst herstellt (Pflanze)
Konsument | Lebewesen, das sich von anderen Lebewesen ernährt
Destruent | Zersetzer toter Biomasse (Bakterien, Pilze)
Nahrungsnetz | Verknüpfung vieler Nahrungsketten
Symbiose | Zusammenleben zum gegenseitigen Nutzen (z. B. Flechte)
Parasit | Lebewesen, das auf Kosten eines Wirts lebt
? Pilze und Bakterien sind {{c1::Destruenten}}.
? Licht und Temperatur sind {{c1::abiotische}} Faktoren.
? Pflanzen sind in der Nahrungskette {{c1::Produzenten}}.
! Was gehört zur Biozönose? | alle Lebewesen eines Ökosystems | Boden und Wasser | nur die Pflanzen | das Klima
! Welche Nahrungskette ist richtig? | Gras → Hase → Fuchs | Fuchs → Hase → Gras | Hase → Gras → Fuchs | Gras → Fuchs → Hase
! Was ist eine Symbiose? | ein Zusammenleben zum gegenseitigen Nutzen | ein Räuber frisst seine Beute | ein Parasit schwächt den Wirt | zwei Arten konkurrieren

# t2-kreislauf | Atmung und Blutkreislauf | Herz, Lunge, Blut
> **Atmung**: In den Lungenbläschen (**Alveolen**) gelangt Sauerstoff ins Blut, Kohlenstoffdioxid aus dem Blut in die Lunge (**Diffusion**).
> **Doppelter Blutkreislauf**: Lungenkreislauf (rechte Herzhälfte → Lunge → linker Vorhof) und Körperkreislauf (linke Kammer → Aorta → Körper → Hohlvenen → rechter Vorhof).
> **Arterien** führen Blut vom Herzen weg, **Venen** zum Herzen hin. **Kapillaren** sind die feinsten Gefäße, dort findet der Stoffaustausch statt.
> **Blut**: rote Blutkörperchen (Sauerstofftransport mit Hämoglobin), weiße (Abwehr), Blutplättchen (Gerinnung), Blutplasma.
> Herzklappen verhindern, dass das Blut zurückfließt.
@ herz
Alveolen | Lungenbläschen, Ort des Gasaustauschs
Arterie | Blutgefäß, das Blut vom Herzen wegführt
Vene | Blutgefäß, das Blut zum Herzen hinführt
Kapillare | feinstes Blutgefäß, Ort des Stoffaustauschs
Hämoglobin | roter Blutfarbstoff, bindet Sauerstoff
Aorta | Hauptschlagader, verlässt die linke Herzkammer
Lungenkreislauf | Weg des Blutes vom rechten Herzen durch die Lunge zum linken Herzen
Herzklappe | Ventil im Herzen, verhindert das Zurückfließen des Blutes
Blutplättchen | Blutbestandteil, wichtig für die Blutgerinnung
? Die {{c1::Aorta}} ist die größte Arterie.
? Rote Blutkörperchen transportieren {{c1::Sauerstoff}}.
? Der Gasaustausch findet in den {{c1::Alveolen}} statt.
! Wohin pumpt die rechte Herzkammer das Blut? | in die Lunge | in den Körper | ins Gehirn | in die Leber
! Was führen Venen? | Blut zum Herzen hin | Blut vom Herzen weg | Luft | Lymphe
= Ein Herz schlägt 70-mal pro Minute. Wie oft in einer Stunde? | 4200

# t2-nerven | Nerven, Sinne und Hormone | Reiz, Reaktion, Regelung
> **Reiz → Sinnesorgan (Rezeptor) → sensorischer Nerv → Gehirn/Rückenmark → motorischer Nerv → Muskel (Reaktion)**
> **Reflex**: schnelle, unbewusste Reaktion über das Rückenmark (z. B. Kniesehnenreflex).
> Die **Nervenzelle (Neuron)** leitet elektrische Signale: Dendriten empfangen, das Axon leitet weiter, die Synapse überträgt chemisch.
> **Hormone** sind Botenstoffe im Blut. Beispiel Blutzucker: **Insulin** senkt den Blutzuckerspiegel, **Glukagon** erhöht ihn (beide aus der Bauchspeicheldrüse).
> **Diabetes**: zu wenig Insulin oder die Zellen reagieren nicht darauf.
@ nervenzelle
Reiz | Einwirkung aus der Umwelt, die ein Sinnesorgan erregt
Rezeptor | Sinneszelle, die einen Reiz aufnimmt
Reflex | schnelle, unbewusste Reaktion über das Rückenmark
Neuron | Nervenzelle
Synapse | Kontaktstelle zwischen Nervenzelle und nächster Zelle
Hormon | Botenstoff, der über das Blut wirkt
Insulin | Hormon, das den Blutzuckerspiegel senkt
Glukagon | Hormon, das den Blutzuckerspiegel erhöht
Diabetes | Erkrankung mit zu hohem Blutzuckerspiegel
? Insulin {{c1::senkt}} den Blutzuckerspiegel.
? Ein {{c1::Reflex}} läuft ohne Beteiligung des Gehirns ab.
? Das {{c1::Axon}} leitet die Erregung vom Zellkörper weg.
! Wo wird Insulin gebildet? | in der Bauchspeicheldrüse | in der Leber | im Gehirn | in der Niere
! Was ist die richtige Reihenfolge? | Reiz → Rezeptor → Nerv → Gehirn → Muskel | Muskel → Gehirn → Reiz | Gehirn → Reiz → Rezeptor | Nerv → Reiz → Muskel

# t2-immunsystem | Infektion und Immunsystem | Bakterien, Viren, Impfung
> **Bakterien** sind Zellen ohne Zellkern; sie lassen sich mit **Antibiotika** bekämpfen. **Viren** sind keine Zellen – sie vermehren sich nur in Wirtszellen; Antibiotika wirken nicht.
> **Unspezifische Abwehr**: Haut, Schleimhäute, Fresszellen (**Makrophagen**).
> **Spezifische Abwehr**: **B-Zellen** bilden **Antikörper**, die genau zu einem **Antigen** passen (Schlüssel-Schloss). **T-Zellen** töten befallene Zellen oder helfen. **Gedächtniszellen** sorgen für Immunität.
> **Aktive Impfung**: abgeschwächte Erreger oder Teile → Körper bildet Gedächtniszellen (lange Schutz). **Passive Impfung**: fertige Antikörper → sofort, aber kurz.
Antigen | Molekül an der Oberfläche eines Erregers, das erkannt wird
Antikörper | Eiweiß, das genau an ein bestimmtes Antigen bindet
Makrophage | Fresszelle der unspezifischen Abwehr
Gedächtniszelle | Abwehrzelle, die sich den Erreger lange merkt
Antibiotikum | Medikament gegen Bakterien, nicht gegen Viren
aktive Impfung | Gabe abgeschwächter Erreger, der Körper bildet selbst Antikörper
passive Impfung | Gabe fertiger Antikörper, wirkt sofort, aber nur kurz
Inkubationszeit | Zeit zwischen Ansteckung und Ausbruch der Krankheit
Virus | Krankheitserreger ohne eigenen Stoffwechsel, vermehrt sich in Wirtszellen
? Gegen Viren helfen {{c1::Antibiotika}} nicht.
? Antikörper werden von {{c1::B-Zellen}} gebildet.
? Nach einer aktiven Impfung bildet der Körper {{c1::Gedächtniszellen}}.
! Wogegen wirken Antibiotika? | gegen Bakterien | gegen Viren | gegen Pilze und Viren | gegen alle Erreger
! Was passiert bei der passiven Impfung? | Man erhält fertige Antikörper | Man erhält abgeschwächte Erreger | Man bildet Gedächtniszellen | Man wird lebenslang immun

# t2-genetik | Grundlagen der Genetik | DNA, Chromosomen, Mendel
> Die Erbinformation liegt in der **DNA** im Zellkern. Ein Abschnitt der DNA, der für ein Merkmal codiert, ist ein **Gen**.
> Menschen haben **46 Chromosomen** (23 Paare); Geschlechtschromosomen XX (Frau) bzw. XY (Mann).
> **Mitose**: Zellteilung mit gleicher Erbinformation (Wachstum). **Meiose**: Bildung der Keimzellen mit halbem Chromosomensatz.
> **Mendel**: Uniformitätsregel (F1 gleich), Spaltungsregel (F2 im Verhältnis 3 : 1 bei dominant-rezessiv), Unabhängigkeitsregel.
> **dominant** setzt sich durch (Großbuchstabe A), **rezessiv** nur sichtbar, wenn reinerbig (aa).
> **Genotyp** = Erbanlagen · **Phänotyp** = Erscheinungsbild
Gen | DNA-Abschnitt mit der Information für ein Merkmal
Chromosom | aufgewickelter DNA-Faden, Träger der Gene
Allel | Ausprägungsform eines Gens (z. B. A oder a)
dominant | Allel, das sich im Erscheinungsbild durchsetzt
rezessiv | Allel, das nur bei Reinerbigkeit sichtbar wird
homozygot | reinerbig: zwei gleiche Allele (AA oder aa)
heterozygot | mischerbig: zwei verschiedene Allele (Aa)
Genotyp | Gesamtheit der Erbanlagen
Phänotyp | sichtbares Erscheinungsbild
Mutation | Veränderung der Erbinformation
? Menschen haben {{c1::46}} Chromosomen.
? Ein mischerbiger Genotyp heißt {{c1::heterozygot}}.
? Bei der {{c1::Meiose}} entstehen Keimzellen.
= Aa × Aa (A dominant): Verhältnis dominant : rezessiv in F2? | 3:1
= Aa × aa: Anteil der Nachkommen mit rezessivem Phänotyp in Prozent? | 50
! Was ist ein Phänotyp? | das sichtbare Erscheinungsbild | die Erbanlagen | ein Chromosom | eine Mutation
! Welche Geschlechtschromosomen hat ein Mann? | XY | XX | YY | XXY

# t2-evolution | Evolution | Darwin, Selektion, Belege
> **Evolution**: Lebewesen verändern sich über viele Generationen; alle stammen von gemeinsamen Vorfahren ab.
> **Darwins Theorie**: Lebewesen unterscheiden sich (Variation), es entstehen mehr Nachkommen als überleben, die am besten Angepassten überleben und vermehren sich (**natürliche Selektion**).
> **Lamarck** (widerlegt): erworbene Eigenschaften würden vererbt.
> **Belege**: Fossilien, homologe Organe (gleicher Grundbauplan, z. B. Vordergliedmaßen der Wirbeltiere), Brückentiere (Archaeopteryx), DNA-Vergleiche.
> **Analoge Organe**: gleiche Funktion, verschiedener Bauplan (Flügel von Vogel und Insekt).
Evolution | Veränderung der Lebewesen über viele Generationen
Selektion | Auslese der am besten angepassten Individuen
Variation | Unterschiede zwischen Individuen einer Art
Fossil | versteinerter Rest oder Abdruck eines Lebewesens
homologe Organe | Organe mit gleichem Grundbauplan, aber oft anderer Funktion
analoge Organe | Organe mit gleicher Funktion, aber unterschiedlichem Bauplan
Brückentier | Lebewesen mit Merkmalen zweier Tiergruppen (z. B. Archaeopteryx)
Art | Gruppe von Lebewesen, die sich fruchtbar fortpflanzen können
Anpassung | Merkmal, das das Überleben in einer Umwelt verbessert
? Darwin erklärte Evolution durch natürliche {{c1::Selektion}}.
? Archaeopteryx ist ein {{c1::Brückentier}} zwischen Reptilien und Vögeln.
? Der Arm des Menschen und der Flügel der Fledermaus sind {{c1::homologe}} Organe.
! Was sind analoge Organe? | Organe mit gleicher Funktion, aber verschiedenem Bauplan | Organe mit gleichem Bauplan | verkümmerte Organe | Organe von Pflanzen
! Was ist kein Beleg für die Evolution? | dass Giraffen ihren Hals strecken und das vererben | Fossilien | homologe Organe | DNA-Vergleiche

# t3-biomembran | Biomembran und Stofftransport | Fluid-Mosaik, Diffusion, Osmose
> Die **Biomembran** besteht aus einer **Lipid-Doppelschicht** (Phospholipide: hydrophiler Kopf, hydrophobe Schwänze) mit eingelagerten **Proteinen** – **Fluid-Mosaik-Modell**.
> **Passiver Transport** (ohne Energie, entlang des Konzentrationsgefälles): Diffusion, erleichterte Diffusion (Kanäle, Carrier), **Osmose** (Wasser durch eine selektiv permeable Membran).
> **Aktiver Transport**: gegen das Gefälle, unter ATP-Verbrauch (z. B. Natrium-Kalium-Pumpe).
> **Endo-/Exocytose**: Aufnahme bzw. Abgabe großer Teilchen über Bläschen (Vesikel).
> Lösung **hypertonisch** → Zelle verliert Wasser (Plasmolyse); **hypotonisch** → Zelle nimmt Wasser auf.
Phospholipid | Membranbaustein mit hydrophilem Kopf und hydrophobem Schwanz
Fluid-Mosaik-Modell | Modell der Membran: bewegliche Lipid-Doppelschicht mit Proteinen
Diffusion | Bewegung von Teilchen vom Ort hoher zum Ort niedriger Konzentration
Osmose | Diffusion von Wasser durch eine selektiv permeable Membran
selektiv permeabel | halbdurchlässig: lässt nur bestimmte Stoffe durch
aktiver Transport | Transport gegen das Konzentrationsgefälle unter ATP-Verbrauch
Carrier | Transportprotein, das Stoffe durch die Membran schleust
Plasmolyse | Ablösen des Protoplasten von der Zellwand bei Wasserverlust
hypertonisch | Lösung mit höherer Konzentration als die Zelle
Endocytose | Aufnahme von Stoffen durch Einstülpung der Membran
? Die Membran besteht aus einer Lipid-{{c1::Doppelschicht}}.
? Aktiver Transport verbraucht {{c1::ATP}}.
? In hypertonischer Lösung kommt es zur {{c1::Plasmolyse}}.
! Was ist Osmose? | Diffusion von Wasser durch eine halbdurchlässige Membran | Transport mit ATP | Aufnahme von Bakterien | Teilung der Zelle
! Was passiert mit einer roten Blutzelle in destilliertem Wasser? | Sie nimmt Wasser auf und platzt | Sie schrumpft | Nichts | Sie teilt sich

# t3-enzyme | Enzyme | Wirkungsweise, Einflüsse, Hemmung
> **Enzyme** sind Biokatalysatoren (meist Proteine): sie senken die **Aktivierungsenergie** und beschleunigen Reaktionen, ohne verbraucht zu werden.
> Das **Substrat** bindet im **aktiven Zentrum** (Schlüssel-Schloss-Prinzip, besser: induzierte Passform) → Enzym-Substrat-Komplex → Produkte.
> **Substratspezifität**: ein Enzym setzt nur ein bestimmtes Substrat um · **Wirkungsspezifität**: nur eine bestimmte Reaktion.
> Einflüsse: **Temperatur** (Optimum, ab ca. 40–50 °C **Denaturierung**), **pH-Wert** (Optimum, z. B. Pepsin bei pH 2), **Substratkonzentration** (Sättigung bei vmax).
> **Kompetitive Hemmung**: Hemmstoff konkurriert ums aktive Zentrum (durch mehr Substrat aufhebbar). **Allosterische Hemmung**: Bindung an anderer Stelle verändert das aktive Zentrum.
Enzym | Biokatalysator, der Reaktionen beschleunigt
Aktivierungsenergie | Energie, die nötig ist, um eine Reaktion zu starten
aktives Zentrum | Bindungsstelle des Substrats am Enzym
Substrat | Stoff, der von einem Enzym umgesetzt wird
Denaturierung | irreversible Zerstörung der Raumstruktur eines Proteins
Substratspezifität | Enzym setzt nur ein bestimmtes Substrat um
kompetitive Hemmung | Hemmstoff besetzt das aktive Zentrum
allosterische Hemmung | Hemmstoff bindet an anderer Stelle und verformt das Enzym
RGT-Regel | 10 °C mehr verdoppelt etwa die Reaktionsgeschwindigkeit
? Enzyme senken die {{c1::Aktivierungsenergie}}.
? Bei zu hoher Temperatur {{c1::denaturieren}} Enzyme.
? Das Substrat bindet im {{c1::aktiven Zentrum}}.
! Wie lässt sich eine kompetitive Hemmung aufheben? | durch mehr Substrat | durch Erhitzen | durch Senken des pH | gar nicht
! Was ist ein Enzym chemisch meist? | ein Protein | ein Zucker | ein Fett | ein Salz
= Nach der RGT-Regel: Wie viel schneller ist eine Reaktion bei 30 °C statt 20 °C? | 2

# t3-zellzyklus | Zellzyklus, Mitose und Meiose | Chromosomen, Phasen
> **Zellzyklus**: Interphase (G1 – Wachstum, S – DNA-Verdopplung, G2) und Mitose.
> **Mitose-Phasen**: Prophase (Chromosomen kondensieren) → Metaphase (Anordnung in der Äquatorialebene) → Anaphase (Chromatiden werden getrennt) → Telophase (zwei Kerne).
> Ergebnis Mitose: zwei genetisch **identische** diploide Zellen (2n).
> **Meiose**: zwei Teilungen, Ergebnis: vier **haploide** Keimzellen (n) mit neuer Kombination; **Crossing-over** in Prophase I.
> **Replikation** der DNA ist **semikonservativ**: jeder neue Doppelstrang enthält einen alten und einen neuen Strang.
Interphase | Phase zwischen zwei Teilungen, DNA wird verdoppelt
Prophase | Chromosomen verdichten sich, Kernhülle löst sich auf
Metaphase | Chromosomen liegen in der Äquatorialebene
Anaphase | Schwesterchromatiden werden zu den Polen gezogen
Telophase | neue Kernhüllen bilden sich, Chromosomen entspiralisieren
diploid | mit doppeltem Chromosomensatz (2n)
haploid | mit einfachem Chromosomensatz (n)
Crossing-over | Austausch von Abschnitten zwischen homologen Chromosomen
semikonservativ | jeder neue DNA-Doppelstrang besteht aus einem alten und einem neuen Strang
Chromatide | eine Hälfte eines verdoppelten Chromosoms
? Bei der Mitose entstehen zwei {{c1::identische}} Tochterzellen.
? Keimzellen sind {{c1::haploid}}.
? Die DNA wird in der {{c1::S}}-Phase verdoppelt.
= Wie viele Keimzellen entstehen aus einer Zelle durch Meiose? | 4
= Wie viele Chromosomen hat eine menschliche Eizelle? | 23
! In welcher Phase liegen die Chromosomen in der Äquatorialebene? | Metaphase | Prophase | Anaphase | Telophase

# t4-proteinbiosynthese | Proteinbiosynthese | Transkription, Translation, Code
> **Gen → mRNA → Protein**
> **Transkription** (im Zellkern): RNA-Polymerase liest den codogenen DNA-Strang ab und bildet **mRNA** (U statt T).
> Bei Eukaryoten: **Prozessierung** – Introns werden herausgeschnitten (**Spleißen**), Exons bleiben; Cap und Poly-A-Schwanz.
> **Translation** (am Ribosom): je drei Basen der mRNA (**Codon**) codieren eine Aminosäure; **tRNA** mit passendem **Anticodon** bringt sie. Start: AUG, Stopp: UAA, UAG, UGA.
> Der **genetische Code** ist universell, eindeutig, degeneriert (mehrere Codons für eine Aminosäure) und kommafrei.
> **Genmutationen**: Punktmutation (stumm, missense, nonsense), Rasterschubmutation (Insertion/Deletion).
Transkription | Umschreiben eines DNA-Abschnitts in mRNA
Translation | Übersetzung der mRNA in eine Aminosäurekette am Ribosom
Codon | Basentriplett der mRNA, das eine Aminosäure codiert
Anticodon | komplementäres Basentriplett der tRNA
Intron | nicht codierender Abschnitt, wird beim Spleißen entfernt
Exon | codierender Abschnitt eines Gens
RNA-Polymerase | Enzym, das bei der Transkription mRNA bildet
degeneriert (Code) | mehrere Codons codieren dieselbe Aminosäure
Rasterschubmutation | Einfügen oder Verlust von Basen verschiebt das Leseraster
Startcodon | AUG – beginnt die Translation (Methionin)
? Die Translation findet am {{c1::Ribosom}} statt.
? In der RNA steht {{c1::Uracil}} statt Thymin.
? Beim Spleißen werden die {{c1::Introns}} entfernt.
= Wie viele Basen codieren eine Aminosäure? | 3
= Wie viele verschiedene Codons gibt es? | 64
! Welche Mutation hat oft die schwersten Folgen? | Rasterschubmutation | stumme Mutation | Mutation in einem Intron | missense-Mutation am Kettenende
! Wo findet die Transkription bei Eukaryoten statt? | im Zellkern | am Ribosom | im Mitochondrium | im Cytoplasma

# t4-gentechnik | Gentechnik und Genregulation | PCR, Gelelektrophorese, Operon
> **PCR** (Polymerase-Kettenreaktion): vervielfältigt DNA in Zyklen: Denaturierung (ca. 95 °C) → Primer-Anlagerung (ca. 55 °C) → Elongation (72 °C, Taq-Polymerase).
> **Gelelektrophorese**: trennt DNA-Fragmente nach Größe; kleine Fragmente wandern weiter (DNA ist negativ geladen → zum Pluspol).
> **Genetischer Fingerabdruck**: Vergleich von Längenmustern (STRs) – Vaterschaft, Kriminalistik.
> **CRISPR/Cas9**: „Genschere“, schneidet DNA an gewünschter Stelle.
> **Genregulation bei Bakterien (Operon-Modell)**: lac-Operon – Repressor blockiert den Operator; Lactose (Induktor) bindet den Repressor → Gene werden abgelesen (**Substratinduktion**). **Endproduktrepression** beim trp-Operon.
PCR | Verfahren zur Vervielfältigung von DNA
Primer | kurzes Nukleotidstück als Startpunkt der DNA-Synthese
Taq-Polymerase | hitzestabile DNA-Polymerase für die PCR
Gelelektrophorese | Trennung von DNA-Fragmenten nach ihrer Größe
Restriktionsenzym | Enzym, das DNA an bestimmten Sequenzen schneidet
CRISPR/Cas9 | Werkzeug, mit dem DNA gezielt geschnitten wird
Operon | Gruppe gemeinsam regulierter Gene mit Promotor und Operator
Repressor | Protein, das den Operator blockiert
Substratinduktion | ein Stoff schaltet die Gene für seinen Abbau ein
transgener Organismus | Lebewesen mit fremdem Gen
? DNA wandert in der Gelelektrophorese zum {{c1::Pluspol}}.
? Beim lac-Operon wirkt Lactose als {{c1::Induktor}}.
? Die PCR braucht eine hitzestabile {{c1::Polymerase}}.
= Nach wie vielen PCR-Zyklen liegt aus 1 DNA-Molekül theoretisch 1024 vor? | 10
! Welche DNA-Fragmente wandern in der Gelelektrophorese am weitesten? | die kleinsten | die größten | die ungeladenen | alle gleich weit
! Was macht der Repressor beim lac-Operon ohne Lactose? | Er blockiert den Operator | Er baut Lactose ab | Er startet die Transkription | Er wird zerstört

# t4-epigenetik | Epigenetik und Krebs | Methylierung, Tumorsuppressoren (LK)
> **Epigenetik**: vererbbare Veränderungen der Genaktivität **ohne** Änderung der DNA-Sequenz.
> **DNA-Methylierung** (an Cytosin) schaltet Gene meist ab; **Histonmodifikation** (z. B. Acetylierung) lockert das Chromatin und schaltet Gene an.
> Umwelt (Ernährung, Stress) kann epigenetische Muster beeinflussen – Beispiel eineiige Zwillinge werden mit dem Alter verschiedener.
> **Krebs**: unkontrollierte Zellteilung durch Mutationen in **Proto-Onkogenen** (werden zu Onkogenen, „Gaspedal“) und **Tumorsuppressorgenen** (z. B. p53, „Bremse“ fällt aus).
> Eukaryotische Genregulation: Transkriptionsfaktoren, Enhancer/Silencer, RNA-Interferenz.
Epigenetik | Veränderung der Genaktivität ohne Änderung der DNA-Sequenz
DNA-Methylierung | Anhängen von Methylgruppen an Cytosin, schaltet Gene meist ab
Histon | Protein, um das die DNA gewickelt ist
Histonacetylierung | lockert das Chromatin und erleichtert das Ablesen
Proto-Onkogen | Gen, das die Zellteilung fördert; mutiert zum Onkogen
Tumorsuppressorgen | Gen, das die Zellteilung bremst (z. B. p53)
Transkriptionsfaktor | Protein, das die Transkription eines Gens steuert
Enhancer | DNA-Abschnitt, der die Transkription verstärkt
RNA-Interferenz | Abschaltung von Genen durch kleine RNA-Moleküle
? Methylierung der DNA schaltet Gene meist {{c1::ab}}.
? p53 ist ein {{c1::Tumorsuppressorgen}}.
? Epigenetische Veränderungen ändern die DNA-{{c1::Sequenz}} nicht.
! Was bewirkt Histonacetylierung? | Das Chromatin lockert sich, Gene werden aktiver | Die DNA wird geschnitten | Die Basenfolge ändert sich | Das Gen wird zerstört
! Warum werden eineiige Zwillinge mit dem Alter unterschiedlicher? | wegen unterschiedlicher epigenetischer Muster | wegen verschiedener DNA-Sequenz | wegen Crossing-over | zufällig ohne Grund

# t4-neurobiologie | Neurobiologie | Ruhepotential, Aktionspotential, Synapse
> **Ruhepotential** (ca. −70 mV): ungleiche Ionenverteilung (innen viel K⁺, außen viel Na⁺), Membran vor allem für K⁺ durchlässig; **Natrium-Kalium-Pumpe** erhält das Gefälle.
> **Aktionspotential**: Schwellenwert erreicht → spannungsgesteuerte Na⁺-Kanäle öffnen (**Depolarisation**, bis ca. +30 mV) → K⁺-Kanäle öffnen (**Repolarisation**) → **Hyperpolarisation** → Refraktärzeit. „Alles-oder-nichts“.
> **Saltatorische Erregungsleitung**: bei myelinisierten Axonen springt die Erregung von Schnürring zu Schnürring – schneller.
> **Chemische Synapse**: AP erreicht Endknöpfchen → Ca²⁺ strömt ein → Vesikel schütten **Transmitter** (z. B. Acetylcholin) aus → Bindung an Rezeptoren → EPSP/IPSP → Enzym baut Transmitter ab.
> Synapsengifte: Curare blockiert Rezeptoren, E 605 hemmt die Acetylcholinesterase.
Ruhepotential | Spannung an der Membran einer unerregten Nervenzelle, ca. −70 mV
Aktionspotential | kurzfristige Umkehr der Membranspannung, Alles-oder-nichts
Depolarisation | Abnahme der negativen Spannung durch Na⁺-Einstrom
Repolarisation | Rückkehr zum Ruhepotential durch K⁺-Ausstrom
Refraktärzeit | Zeit, in der kein neues Aktionspotential möglich ist
saltatorische Erregungsleitung | sprunghafte Leitung von Schnürring zu Schnürring
Transmitter | Botenstoff, der an der Synapse ausgeschüttet wird
Acetylcholinesterase | Enzym, das Acetylcholin im synaptischen Spalt abbaut
EPSP | erregendes postsynaptisches Potential
Natrium-Kalium-Pumpe | transportiert unter ATP-Verbrauch 3 Na⁺ hinaus und 2 K⁺ hinein
? Das Ruhepotential liegt bei etwa {{c1::−70}} mV.
? Bei der Depolarisation strömen {{c1::Natrium}}-Ionen ein.
? An der Synapse löst der Einstrom von {{c1::Calcium}}-Ionen die Ausschüttung aus.
= Spannung von −70 mV auf +30 mV: Um wie viel mV ändert sie sich? | 100
! Warum ist die Erregungsleitung bei myelinisierten Axonen schneller? | Die Erregung springt von Schnürring zu Schnürring | Die Axone sind kürzer | Es gibt mehr Natrium | Die Synapsen fehlen
! Was bewirkt Curare? | Es blockiert die Acetylcholin-Rezeptoren | Es hemmt den Abbau von Acetylcholin | Es öffnet Natriumkanäle | Es verstärkt die Erregung

# t4-oekologie | Ökologie | Populationen, Räuber-Beute, Stoffkreisläufe
> **Populationswachstum**: exponentiell bei unbegrenzten Ressourcen, logistisch bis zur **Kapazitätsgrenze K**.
> **r-Strategen** (viele Nachkommen, wenig Pflege) · **K-Strategen** (wenige Nachkommen, viel Pflege)
> **Lotka-Volterra-Regeln**: Räuber- und Beutezahlen schwanken periodisch und phasenverschoben; Mittelwerte bleiben konstant; nach Eingriff erholt sich die Beute schneller.
> **Ökologische Nische**: Gesamtheit der Beziehungen einer Art zu ihrer Umwelt. **Konkurrenzausschlussprinzip**: zwei Arten mit gleicher Nische können nicht dauerhaft koexistieren.
> **Kohlenstoffkreislauf**: Fotosynthese bindet CO₂, Zellatmung und Verbrennung setzen es frei. **Energiefluss**: pro Trophiestufe gehen ca. 90 % verloren.
> **Toleranzkurve**: Optimum, Pessimum, ökologische Potenz (stenök/euryök).
Kapazitätsgrenze | maximale Populationsgröße, die ein Lebensraum tragen kann
logistisches Wachstum | Wachstum, das sich der Kapazitätsgrenze annähert
r-Strategie | viele Nachkommen, kaum Brutpflege
K-Strategie | wenige Nachkommen, intensive Brutpflege
ökologische Nische | Gesamtheit der Ansprüche einer Art an ihre Umwelt
Konkurrenzausschlussprinzip | Arten mit gleicher Nische können nicht dauerhaft nebeneinander bestehen
Trophiestufe | Ernährungsebene in einer Nahrungskette
stenök | mit engem Toleranzbereich
euryök | mit weitem Toleranzbereich
Neozoen | eingeschleppte Tierarten
? Pro Trophiestufe gehen etwa {{c1::90}} % der Energie verloren.
? Die maximale Populationsgröße heißt {{c1::Kapazitätsgrenze}}.
? Räuber- und Beutepopulationen schwanken {{c1::phasenverschoben}}.
= Produzenten speichern 10 000 kJ. Wie viel kommt etwa bei Konsumenten 2. Ordnung an (in kJ)? | 100
! Was besagt die 1. Lotka-Volterra-Regel? | Räuber- und Beutezahlen schwanken periodisch | Der Räuber stirbt aus | Die Beute wächst exponentiell | Beide bleiben konstant
! Welche Art ist ein typischer K-Stratege? | Elefant | Blattlaus | Feldmaus | Bakterium

# t4-evolution | Evolutionstheorie | Synthetische Theorie, Artbildung
> **Synthetische Evolutionstheorie**: Evolutionsfaktoren sind **Mutation, Rekombination, Selektion, Gendrift, Isolation**.
> **Selektionsformen**: stabilisierend, gerichtet, disruptiv. Auch **sexuelle Selektion**.
> **Gendrift**: zufällige Veränderung der Allelhäufigkeit, stark in kleinen Populationen (Flaschenhals-, Gründereffekt).
> **Artbildung**: **allopatrisch** (geografische Trennung) oder **sympatrisch** (ohne räumliche Trennung, z. B. durch Polyploidie). Isolationsmechanismen: präzygotisch (Verhalten, Zeit, Ort) und postzygotisch (sterile Hybride).
> **Adaptive Radiation**: Aufspaltung in viele Arten mit verschiedenen Nischen (Darwinfinken).
> **Stammbäume** aus DNA-Vergleichen; Mensch: Australopithecus → Homo erectus → Homo sapiens (vereinfacht).
Rekombination | Neukombination von Erbanlagen bei der sexuellen Fortpflanzung
Gendrift | zufällige Änderung der Allelhäufigkeit
Gründereffekt | wenige Gründer bilden eine Population mit einseitigem Genpool
Genpool | Gesamtheit aller Allele einer Population
allopatrische Artbildung | Artbildung durch geografische Trennung
sympatrische Artbildung | Artbildung ohne geografische Trennung
adaptive Radiation | Aufspaltung einer Art in viele angepasste Arten
stabilisierende Selektion | Selektion gegen beide Extreme
disruptive Selektion | Selektion begünstigt beide Extreme
Koevolution | wechselseitige Anpassung zweier Arten
? Die Darwinfinken sind ein Beispiel für adaptive {{c1::Radiation}}.
? In kleinen Populationen wirkt die {{c1::Gendrift}} stark.
? Artbildung durch geografische Trennung heißt {{c1::allopatrisch}}.
! Welcher Faktor ist zufällig und nicht gerichtet? | Gendrift | Selektion | Anpassung | Konkurrenz
! Was ist ein postzygotischer Isolationsmechanismus? | Hybride sind unfruchtbar | unterschiedliche Balzrituale | verschiedene Paarungszeiten | verschiedene Lebensräume

# t4-stoffwechsel | Fotosynthese und Zellatmung | Energieumwandlung in der Zelle
> **Fotosynthese** (Chloroplast): 6 CO₂ + 12 H₂O → (Licht) → C₆H₁₂O₆ + 6 O₂ + 6 H₂O
> **Lichtabhängige Reaktion** (Thylakoide): Lichtenergie spaltet Wasser (Fotolyse) → O₂, ATP und NADPH.
> **Lichtunabhängige Reaktion** (Calvin-Zyklus, Stroma): CO₂-Fixierung mit RuBisCO, Aufbau von Glucose mit ATP und NADPH.
> **Zellatmung**: C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O + Energie (ca. 32–38 ATP)
> Glykolyse (Cytoplasma) → oxidative Decarboxylierung → Citratzyklus (Mitochondrienmatrix) → Atmungskette (innere Mitochondrienmembran, ATP-Synthase).
> **Gärung** ohne Sauerstoff: alkoholische Gärung (Hefe) oder Milchsäuregärung (Muskel) – nur 2 ATP.
Thylakoid | Membranstapel im Chloroplasten, Ort der Lichtreaktion
Stroma | Grundsubstanz des Chloroplasten, Ort des Calvin-Zyklus
Calvin-Zyklus | lichtunabhängige Reaktion, fixiert CO₂ zu Zucker
RuBisCO | Enzym, das CO₂ im Calvin-Zyklus bindet
Fotolyse | Spaltung von Wasser durch Lichtenergie
Glykolyse | Abbau von Glucose zu Pyruvat im Cytoplasma
Citratzyklus | Abbau in der Mitochondrienmatrix, setzt CO₂ frei
Atmungskette | erzeugt an der inneren Mitochondrienmembran den größten Teil des ATP
ATP | universeller Energieträger der Zelle
Milchsäuregärung | Glucoseabbau ohne Sauerstoff zu Milchsäure
? Der Sauerstoff der Fotosynthese stammt aus dem {{c1::Wasser}}.
? Die Glykolyse findet im {{c1::Cytoplasma}} statt.
? Den meisten ATP-Gewinn liefert die {{c1::Atmungskette}}.
= Wie viele CO₂-Moleküle braucht die Fotosynthese für ein Glucosemolekül? | 6
= Wie viele ATP liefert die Gärung pro Glucose? | 2
! Wo findet der Calvin-Zyklus statt? | im Stroma | in den Thylakoiden | im Cytoplasma | in der Mitochondrienmatrix
`;

const blocks = [
  ["t1-wirbeltiere", "t1-pflanzen", "t1-zelle", "t1-ernaehrung", "t1-bewegung"],
  ["t2-oekosystem", "t2-kreislauf", "t2-nerven", "t2-immunsystem", "t2-genetik", "t2-evolution"],
  ["t3-biomembran", "t3-enzyme", "t3-zellzyklus"],
  ["t4-proteinbiosynthese", "t4-gentechnik", "t4-epigenetik", "t4-neurobiologie", "t4-oekologie", "t4-evolution", "t4-stoffwechsel"],
];

export default { units: parseCourse(text, { diagrams }), blocks, lk: ["t4-epigenetik"], diagrams };
