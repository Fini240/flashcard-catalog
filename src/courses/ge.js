// The history course, Klasse 6 to the Abitur (after the NRW Kernlehrplan
// Geschichte, Sek I and II; Oberstufe after its Inhaltsfelder). Format: see
// parseCourse in src/courses.js.
import { parseCourse } from "../courses.js";
import { diagram, INK, SOFT } from "./diagram.js";

const tier = (y, w, fill) => `<rect x="${320 - w / 2}" y="${y}" width="${w}" height="70" rx="6" fill="${fill}" stroke="${INK}" stroke-width="2"/>`;

const diagrams = {
  lehnswesen: diagram({
    w: 640, h: 420,
    shapes: `${tier(40, 150, "#F2D89B")}${tier(125, 290, "#E8C9A6")}${tier(210, 430, "#D9D2C2")}${tier(295, 600, "#C8D6B8")}
      <path d="M 60 100 L 60 330" stroke="${SOFT}" stroke-width="3"/><path d="M 52 318 L 60 334 L 68 318" fill="none" stroke="${SOFT}" stroke-width="3"/>
      <path d="M 580 330 L 580 100" stroke="${SOFT}" stroke-width="3"/><path d="M 572 112 L 580 96 L 588 112" fill="none" stroke="${SOFT}" stroke-width="3"/>`,
    labels: [
      { text: "König", x: 320, y: 82, anchor: "middle" },
      { text: "Kronvasallen", x: 320, y: 167, anchor: "middle" },
      { text: "Untervasallen", x: 320, y: 252, anchor: "middle" },
      { text: "Bauern und Hörige", x: 320, y: 337, anchor: "middle" },
      { text: "Lehen und Schutz", x: 20, y: 400, to: [60, 330] },
      { text: "Treue und Dienste", x: 620, y: 400, anchor: "end", to: [580, 330] },
    ],
  }),
  gewaltenteilung: diagram({
    w: 660, h: 400,
    shapes: `
      <rect x="30" y="60" width="180" height="110" rx="10" fill="#DCE6F5" stroke="${INK}" stroke-width="2"/>
      <rect x="240" y="60" width="180" height="110" rx="10" fill="#F5E2CF" stroke="${INK}" stroke-width="2"/>
      <rect x="450" y="60" width="180" height="110" rx="10" fill="#E2EFD9" stroke="${INK}" stroke-width="2"/>
      <rect x="180" y="290" width="300" height="70" rx="10" fill="#EFE6F5" stroke="${INK}" stroke-width="2"/>
      <path d="M 230 290 L 130 175" stroke="${SOFT}" stroke-width="3"/><path d="M 128 192 L 128 172 L 146 180" fill="none" stroke="${SOFT}" stroke-width="3"/>
      <path d="M 210 115 L 238 115 M 420 115 L 448 115" stroke="${SOFT}" stroke-width="3"/>`,
    labels: [
      { text: "Legislative", x: 120, y: 105, anchor: "middle" },
      { text: "Parlament", x: 120, y: 145, anchor: "middle" },
      { text: "Exekutive", x: 330, y: 105, anchor: "middle" },
      { text: "Regierung", x: 330, y: 145, anchor: "middle" },
      { text: "Judikative", x: 540, y: 105, anchor: "middle" },
      { text: "Gerichte", x: 540, y: 145, anchor: "middle" },
      { text: "Volk", x: 330, y: 333, anchor: "middle" },
      { text: "wählt", x: 120, y: 260, anchor: "middle", to: [170, 230] },
    ],
  }),
};

const text = `
# t1-urgeschichte | Ur- und Frühgeschichte | Altsteinzeit, Jungsteinzeit, Metallzeit
> **Altsteinzeit** (bis ca. 10 000 v. Chr.): Menschen leben als **Jäger und Sammler**, ziehen umher (Nomaden), nutzen Feuer und Steinwerkzeuge (Faustkeil), Höhlenmalerei.
> **Jungsteinzeit** (ab ca. 10 000 v. Chr. im Vorderen Orient): **Neolithische Revolution** – Ackerbau und Viehzucht, Sesshaftigkeit, Dörfer, Keramik, Arbeitsteilung.
> **Metallzeit**: Kupfer, Bronze (Legierung aus Kupfer und Zinn), dann Eisen – Handel und soziale Unterschiede wachsen.
> Quellen: Funde (Archäologie), z. B. Ötzi (ca. 3300 v. Chr.).
> **Quellen** sind Überreste aus der Vergangenheit, **Darstellungen** entstehen später.
Jäger und Sammler | Menschen, die von Jagd und gesammelten Pflanzen leben
Nomaden | Menschen ohne festen Wohnsitz
Neolithische Revolution | Übergang zu Ackerbau, Viehzucht und Sesshaftigkeit
Faustkeil | Allzweckwerkzeug aus Stein in der Altsteinzeit
Archäologie | Wissenschaft, die Überreste aus der Vergangenheit ausgräbt und untersucht
Bronze | Legierung aus Kupfer und Zinn
Quelle | Überrest oder Zeugnis aus der Vergangenheit
Darstellung | späterer Bericht über die Vergangenheit, z. B. ein Schulbuchtext
Sesshaftigkeit | Leben an einem festen Ort
? In der {{c1::Jungsteinzeit}} wurden die Menschen sesshaft.
? Bronze besteht aus Kupfer und {{c1::Zinn}}.
= Vor etwa wie vielen Jahren lebte Ötzi (gerundet, heute ca. 2025, Ötzi ca. 3300 v. Chr.)? | 5300
! Was kennzeichnet die Neolithische Revolution? | Ackerbau und Viehzucht | die Erfindung des Rades allein | das Ende der Eiszeit | der Bau von Pyramiden
! Was ist eine Quelle? | ein Zeugnis aus der Vergangenheit | ein Schulbuchtext von heute | eine Meinung | ein Film über die Steinzeit

# t1-aegypten | Hochkultur Ägypten | Nil, Pharao, Pyramiden
> **Hochkultur**: Staat mit Herrscher, Verwaltung, Schrift, Religion, Arbeitsteilung, Städten und großen Bauwerken.
> Der **Nil** ist die Lebensader: jährliche Überschwemmung bringt fruchtbaren Schlamm, Bewässerung erfordert Planung → Staat.
> Der **Pharao** ist König und Gottkönig; Beamte (Schreiber) verwalten, Bauern zahlen Abgaben.
> **Hieroglyphen** (Bilderschrift) auf Papyrus und Steinen; entziffert 1822 mit dem Stein von Rosette.
> **Pyramiden** als Grabmäler (Gizeh, ca. 2500 v. Chr.), Totenkult und **Mumifizierung**, Glaube an ein Leben nach dem Tod.
Hochkultur | weit entwickelte Kultur mit Staat, Schrift und Arbeitsteilung
Pharao | König im alten Ägypten, als Gott verehrt
Hieroglyphen | Bilderschrift der alten Ägypter
Papyrus | Schreibmaterial aus der Papyrusstaude
Mumifizierung | Haltbarmachen eines Leichnams für das Jenseits
Nilschwemme | jährliche Überschwemmung, die fruchtbaren Schlamm bringt
Schreiber | Beamter, der lesen und schreiben konnte
Pyramide | Grabmal der Pharaonen
Polytheismus | Glaube an viele Götter
? Die Hieroglyphen wurden mit dem Stein von {{c1::Rosette}} entziffert.
? Die Ägypter glaubten an viele Götter: {{c1::Polytheismus}}.
= Etwa wann wurden die Pyramiden von Gizeh gebaut (Jahr v. Chr.)? | 2500
! Warum ist der Nil so wichtig für Ägypten? | Die Überschwemmung machte die Felder fruchtbar | Er war ein Grenzfluss | Dort lagen die Pyramiden | Er war salzig
! Welche Aufgabe hatten Schreiber? | Abgaben und Vorräte verwalten | Pyramiden bauen | Krieg führen | Felder pflügen

# t1-griechen | Antikes Griechenland | Polis, Demokratie in Athen, Olympia
> Griechenland bestand aus vielen unabhängigen **Stadtstaaten (Poleis)**, z. B. **Athen** und **Sparta**; gemeinsam waren Sprache, Götter (Zeus, Olymp) und die **Olympischen Spiele** (ab 776 v. Chr.).
> **Athener Demokratie** (5. Jh. v. Chr., Perikles): Volksversammlung entscheidet – aber nur freie männliche Bürger; Frauen, Sklaven und Metöken waren ausgeschlossen.
> **Sparta**: Militärstaat, strenge Erziehung der Jungen.
> **Kolonisation** im Mittelmeerraum; Perserkriege (Marathon 490 v. Chr.).
> Erbe: Philosophie (Sokrates, Platon, Aristoteles), Theater, Wissenschaft, Wörter wie „Demokratie“ (Volksherrschaft).
Polis | griechischer Stadtstaat
Demokratie | Volksherrschaft
Volksversammlung | Versammlung der Bürger, die in Athen die Gesetze beschloss
Metöken | in Athen lebende Fremde ohne Bürgerrecht
Scherbengericht | Abstimmung über die Verbannung eines Bürgers
Olympische Spiele | Sportfest zu Ehren des Zeus in Olympia
Perikles | athenischer Staatsmann zur Blütezeit der Demokratie
Kolonie | Tochterstadt einer griechischen Polis
Sparta | griechischer Stadtstaat mit militärischer Ordnung
? Die ersten Olympischen Spiele fanden {{c1::776}} v. Chr. statt.
? Frauen und {{c1::Sklaven}} durften in Athen nicht mitbestimmen.
! Wer durfte in der Volksversammlung Athens abstimmen? | freie männliche Bürger | alle Einwohner | nur Adlige | Frauen und Männer
! Was bedeutet „Demokratie“? | Volksherrschaft | Königsherrschaft | Herrschaft der Reichen | Herrschaft der Priester

# t1-rom | Das Römische Reich | Republik, Kaiserzeit, Germanien
> Gründungssage 753 v. Chr. (Romulus und Remus). **Republik** (ab ca. 509 v. Chr.): zwei Konsuln, Senat, Volksversammlungen; Ständekämpfe zwischen **Patriziern** und **Plebejern**.
> Ausdehnung zum Weltreich (Punische Kriege gegen Karthago).
> **Caesar** wird Diktator, 44 v. Chr. ermordet; **Augustus** wird erster Kaiser (27 v. Chr.) – **Kaiserzeit**, Pax Romana.
> **Römer in Germanien**: Limes als Grenze, Varusschlacht 9 n. Chr., Städte wie Köln (Colonia) und Trier.
> Untergang Westroms 476 n. Chr.; Erbe: Latein, Recht, Straßen, Aquädukte, Christentum als Staatsreligion (ab 380).
Republik | Staatsform ohne König, Ämter auf Zeit
Senat | Rat der erfahrenen Adligen im alten Rom
Konsul | höchster Beamter der römischen Republik
Patrizier | adlige Oberschicht Roms
Plebejer | einfaches Volk Roms
Limes | befestigte Grenze des Römischen Reiches in Germanien
Varusschlacht | Niederlage der Römer gegen die Germanen 9 n. Chr.
Pax Romana | Friedenszeit im Römischen Reich unter den Kaisern
Aquädukt | römische Wasserleitung
Romanisierung | Übernahme römischer Lebensweise in den Provinzen
= In welchem Jahr wurde Caesar ermordet (v. Chr.)? | 44
= Jahr der Varusschlacht (n. Chr.) | 9
= Wann ging das Weströmische Reich unter (n. Chr.)? | 476
? Der erste römische Kaiser war {{c1::Augustus}}.
! Wie hieß die Grenze der Römer in Germanien? | Limes | Mauer des Hadrian | Rhein-Wall | Aquädukt

# t2-mittelalter | Mittelalter | Lehnswesen, Kirche, Stadt
> Mittelalter ca. 500–1500. **Karl der Große** wird 800 zum Kaiser gekrönt.
> **Lehnswesen**: Der König vergibt Land (**Lehen**) an Vasallen gegen Treue und Kriegsdienst; diese geben es an Untervasallen weiter. Bauern sind oft **Hörige** in der **Grundherrschaft**.
> **Ständegesellschaft**: Klerus (beten), Adel (kämpfen), Bauern (arbeiten) – Stand durch Geburt.
> **Kirche**: Klöster als Orte von Bildung und Wirtschaft (ora et labora); Investiturstreit zwischen Kaiser und Papst (Gang nach Canossa 1077).
> **Stadt**: Märkte, Handel, Zünfte; „Stadtluft macht frei“; Pest 1347–1351.
@ lehnswesen
Lehen | geliehenes Land gegen Treue und Dienste
Vasall | Lehnsmann, der ein Lehen erhält
Grundherrschaft | Herrschaft eines Grundherrn über Land und Bauern
Ständegesellschaft | Gesellschaft aus Klerus, Adel und Bauern, Stand durch Geburt
Klerus | Geistlichkeit
Zunft | Zusammenschluss der Handwerker eines Berufs in der Stadt
Investiturstreit | Streit zwischen Kaiser und Papst um die Einsetzung der Bischöfe
Kloster | Lebensgemeinschaft von Mönchen oder Nonnen
Leibeigenschaft | persönliche Abhängigkeit eines Bauern von seinem Herrn
= Jahr der Kaiserkrönung Karls des Großen | 800
= Gang nach Canossa (Jahr) | 1077
? „Stadtluft macht {{c1::frei}}.“
! Was erhielt ein Vasall vom König? | ein Lehen | einen Lohn in Geld | eine Burg in Rom | nichts
! Welcher Stand sollte im Mittelalter „beten“? | Klerus | Adel | Bauern | Bürger

# t2-neuzeit | Beginn der Neuzeit | Renaissance, Entdeckungen, Reformation
> **Renaissance** (Wiedergeburt der Antike) und **Humanismus**: der Mensch im Mittelpunkt, Kunst (Leonardo da Vinci) und Wissenschaft.
> **Buchdruck** mit beweglichen Lettern (Gutenberg, um 1450) – Ideen verbreiten sich schnell.
> **Entdeckungsfahrten**: Kolumbus erreicht 1492 Amerika; Eroberung durch Spanier und Portugiesen, Folgen für die indigene Bevölkerung.
> **Reformation**: Martin Luther veröffentlicht 1517 die **95 Thesen** gegen den Ablasshandel; Bibelübersetzung ins Deutsche; Kirchenspaltung (katholisch – evangelisch).
> Bauernkrieg 1525, Augsburger Religionsfrieden 1555, **Dreißigjähriger Krieg** 1618–1648.
Renaissance | Wiedergeburt der antiken Kultur ab dem 15. Jahrhundert
Humanismus | Denkrichtung, die den Menschen und die Bildung betont
Buchdruck | Vervielfältigung von Texten mit beweglichen Lettern
Ablass | Nachlass von Sündenstrafen gegen Geld
Reformation | Erneuerungsbewegung der Kirche, führte zur Kirchenspaltung
95 Thesen | Luthers Kritik am Ablasshandel, 1517
Konfession | christliche Glaubensrichtung
Augsburger Religionsfrieden | 1555: der Landesherr bestimmt die Konfession
Kolonialismus | Eroberung und Ausbeutung fremder Gebiete
= Jahr der 95 Thesen | 1517
= Kolumbus erreicht Amerika (Jahr) | 1492
= Ende des Dreißigjährigen Krieges | 1648
? Den Buchdruck mit beweglichen Lettern erfand {{c1::Gutenberg}}.
! Wogegen richteten sich Luthers Thesen? | gegen den Ablasshandel | gegen den Kaiser | gegen die Bauern | gegen den Buchdruck

# t2-revolution | Französische Revolution | Aufklärung, Menschenrechte, Napoleon
> **Aufklärung**: Vernunft statt Tradition (Kant: „Habe Mut, dich deines eigenen Verstandes zu bedienen“); **Montesquieu**: Gewaltenteilung; **Rousseau**: Volkssouveränität.
> **Absolutismus**: Ludwig XIV. („Der Staat bin ich“), dritter Stand trägt die Lasten.
> **1789**: Generalstände → Nationalversammlung, **Sturm auf die Bastille** (14. Juli), **Erklärung der Menschen- und Bürgerrechte**.
> 1792 Republik, 1793/94 **Schreckensherrschaft** (Robespierre, Guillotine).
> **Napoleon** (Kaiser 1804): Code civil, Ende des Heiligen Römischen Reiches 1806, Niederlage 1815 (Waterloo) → **Wiener Kongress**.
@ gewaltenteilung
Aufklärung | geistige Bewegung, die auf Vernunft und Freiheit setzt
Absolutismus | Herrschaftsform mit uneingeschränkter Macht des Königs
Gewaltenteilung | Trennung von Gesetzgebung, Regierung und Rechtsprechung
Legislative | gesetzgebende Gewalt
Exekutive | ausführende Gewalt
Judikative | rechtsprechende Gewalt
Volkssouveränität | alle Staatsgewalt geht vom Volk aus
dritter Stand | Bürger und Bauern, die die meisten Abgaben trugen
Code civil | von Napoleon eingeführtes bürgerliches Gesetzbuch
Schreckensherrschaft | Phase der Revolution mit Massenhinrichtungen 1793/94
= Sturm auf die Bastille (Jahr) | 1789
= Napoleon krönt sich zum Kaiser (Jahr) | 1804
? Die Gewaltenteilung geht auf {{c1::Montesquieu}} zurück.
! Was bedeutet „Exekutive“? | die ausführende Gewalt (Regierung) | die gesetzgebende Gewalt | die Gerichte | das Volk
! Welche Losung prägte die Revolution? | Freiheit, Gleichheit, Brüderlichkeit | Gott, König, Vaterland | Ordnung und Fortschritt | Brot und Spiele

# t2-industrialisierung | Industrialisierung | Dampfmaschine, Fabrik, soziale Frage
> Beginn in **England** um 1770: Dampfmaschine (James Watt), mechanischer Webstuhl, Eisenbahn; in Deutschland ab ca. 1835 (erste Eisenbahn Nürnberg–Fürth).
> **Fabriksystem**: Arbeitsteilung, Massenproduktion; **Urbanisierung** – Menschen ziehen in die Städte (Ruhrgebiet: Kohle und Stahl).
> **Soziale Frage**: lange Arbeitszeiten, Kinderarbeit, Wohnungselend, Unfälle.
> Lösungsansätze: **Gewerkschaften**, **Arbeiterparteien** (SPD), Marx und Engels (Kommunistisches Manifest 1848), Kirche (Kolping), Unternehmer (Krupp), Staat: **Bismarcks Sozialversicherung** (Kranken- 1883, Unfall- 1884, Rentenversicherung 1889).
Industrialisierung | Übergang zur maschinellen Massenproduktion in Fabriken
Dampfmaschine | Kraftmaschine, die Wärme in Bewegung umwandelt (James Watt)
Urbanisierung | Verstädterung, Wachstum der Städte
soziale Frage | Not der Arbeiterschaft im 19. Jahrhundert
Proletariat | Arbeiterklasse ohne eigenen Besitz an Produktionsmitteln
Gewerkschaft | Zusammenschluss von Arbeitnehmern zur Durchsetzung ihrer Interessen
Sozialversicherung | staatlicher Schutz bei Krankheit, Unfall und Alter
Kinderarbeit | Arbeit von Kindern, im 19. Jahrhundert weit verbreitet
Kommunistisches Manifest | Schrift von Marx und Engels, 1848
= Erste deutsche Eisenbahn (Jahr) | 1835
= Einführung der Krankenversicherung durch Bismarck (Jahr) | 1883
? Die Industrialisierung begann in {{c1::England}}.
! Was war eine Folge der Industrialisierung? | Verstädterung | Rückgang der Bevölkerung | Ende der Landwirtschaft | weniger Arbeitsstunden sofort
! Wer führte in Deutschland die Sozialversicherung ein? | Bismarck | Wilhelm II. | Karl Marx | Friedrich Ebert

# t2-imperialismus-wk1 | Imperialismus und Erster Weltkrieg | Kolonien, Bündnisse, Krieg
> **Imperialismus** (ca. 1880–1914): europäische Mächte teilen Afrika und Asien unter sich auf (Berliner Kongokonferenz 1884/85); Rechtfertigung durch Rassismus und Sendungsbewusstsein.
> Deutsche Kolonien, z. B. Deutsch-Südwestafrika: **Völkermord an den Herero und Nama** (1904–1908).
> **Ursachen des Ersten Weltkriegs**: Bündnissysteme, Wettrüsten (Flotte), Nationalismus; Auslöser: Attentat von **Sarajevo** (28. 6. 1914).
> Stellungskrieg (Verdun 1916), neue Waffen (Giftgas, Panzer); 1917 Kriegseintritt der USA, Russische Revolution.
> 1918 Novemberrevolution, Kaiser dankt ab, **Waffenstillstand 11. 11. 1918**; **Versailler Vertrag** 1919.
Imperialismus | Streben nach Herrschaft über andere Länder und Kolonien
Kolonie | abhängiges Gebiet unter fremder Herrschaft
Bündnissystem | Verträge zwischen Staaten zur gegenseitigen Unterstützung
Wettrüsten | Konkurrenz der Staaten um immer mehr Waffen
Stellungskrieg | Krieg in festen Schützengräben ohne große Bewegung
Attentat von Sarajevo | Ermordung des österreichischen Thronfolgers 1914
Versailler Vertrag | Friedensvertrag nach dem Ersten Weltkrieg, 1919
Kriegsschuldartikel | Artikel 231: Deutschland trägt die Alleinschuld
Völkermord an den Herero und Nama | Verbrechen der deutschen Kolonialtruppen 1904–1908
= Beginn des Ersten Weltkriegs (Jahr) | 1914
= Ende des Ersten Weltkriegs (Jahr) | 1918
? Auslöser des Kriegs war das Attentat von {{c1::Sarajevo}}.
! Was regelte der Versailler Vertrag u. a.? | Gebietsabtretungen und Reparationen Deutschlands | die Gründung der Bundesrepublik | die Teilung Berlins | den Frieden mit Japan

# t2-weimar | Weimarer Republik | Demokratie, Krisen, Scheitern
> **9. 11. 1918**: Ausrufung der Republik (Scheidemann); 1919 **Weimarer Verfassung**: Frauenwahlrecht, Reichspräsident mit großer Macht (**Artikel 48**: Notverordnungen).
> **Krisenjahr 1923**: Hyperinflation, Ruhrbesetzung, Hitlerputsch.
> „Goldene Zwanziger“ (1924–1929): Stabilisierung (Stresemann), Kultur.
> **Weltwirtschaftskrise** ab 1929: Massenarbeitslosigkeit, Radikalisierung (NSDAP, KPD), Präsidialkabinette.
> **Gründe für das Scheitern**: Belastung durch Versailles, „Dolchstoßlegende“, Republikfeinde in Justiz und Militär, Verfassungsschwächen, Wirtschaftskrise.
> **30. 1. 1933**: Hindenburg ernennt Hitler zum Reichskanzler.
Weimarer Verfassung | erste demokratische Verfassung Deutschlands, 1919
Artikel 48 | Notverordnungsrecht des Reichspräsidenten
Hyperinflation | extreme Geldentwertung, 1923
Dolchstoßlegende | Lüge, das Heer sei von der Heimat verraten worden
Weltwirtschaftskrise | weltweiter Wirtschaftseinbruch ab 1929
Präsidialkabinett | Regierung, die nur mit Notverordnungen des Präsidenten regiert
Frauenwahlrecht | seit 1918/19 dürfen Frauen in Deutschland wählen
Hitlerputsch | gescheiterter Umsturzversuch in München 1923
Goldene Zwanziger | Phase relativer Stabilität 1924–1929
= Jahr der Hyperinflation | 1923
= Beginn der Weltwirtschaftskrise | 1929
= Hitler wird Reichskanzler (Jahr) | 1933
? Der Reichspräsident konnte mit Artikel {{c1::48}} Notverordnungen erlassen.
! Welcher Faktor trug nicht zum Scheitern der Republik bei? | die Einführung des Frauenwahlrechts | die Weltwirtschaftskrise | die Dolchstoßlegende | Republikfeinde in der Justiz

# t2-ns | Nationalsozialismus | Diktatur, Verfolgung, Krieg, Holocaust
> **Machtübernahme 1933**: Reichstagsbrandverordnung, **Ermächtigungsgesetz**, Verbot der Parteien und Gewerkschaften, **Gleichschaltung**.
> **Ideologie**: Rassismus, **Antisemitismus**, „Volksgemeinschaft“, Führerprinzip, „Lebensraum im Osten“.
> **Judenverfolgung**: Boykott 1933, **Nürnberger Gesetze** 1935, **Novemberpogrome** 1938, Deportation und systematischer Massenmord – **Holocaust/Shoah** (ca. 6 Millionen ermordete Juden, z. B. in Auschwitz).
> **Zweiter Weltkrieg**: Überfall auf Polen 1. 9. 1939, Vernichtungskrieg gegen die Sowjetunion 1941, Wannseekonferenz 1942, Kapitulation **8. Mai 1945**.
> **Widerstand**: Weiße Rose (Geschwister Scholl), 20. Juli 1944 (Stauffenberg), Georg Elser.
Ermächtigungsgesetz | Gesetz von 1933, das der Regierung die Gesetzgebung übertrug
Gleichschaltung | Ausschaltung aller unabhängigen Organisationen
Antisemitismus | Hass und Feindschaft gegen Juden
Nürnberger Gesetze | Gesetze von 1935, die Juden entrechteten
Novemberpogrome | organisierte Gewalt gegen Juden im November 1938
Holocaust | systematischer Völkermord an den europäischen Juden
Konzentrationslager | Lager zur Inhaftierung, Zwangsarbeit und Ermordung
Wannseekonferenz | Treffen 1942 zur Organisation des Völkermords
Weiße Rose | studentische Widerstandsgruppe in München
Volksgemeinschaft | NS-Ideologie einer rassisch definierten Gemeinschaft
= Beginn des Zweiten Weltkriegs (Jahr) | 1939
= Jahr der Nürnberger Gesetze | 1935
= Kapitulation der Wehrmacht (Jahr) | 1945
? Der Völkermord an den Juden wird auch {{c1::Shoah}} genannt.
! Was war das Ziel der Gleichschaltung? | die Ausschaltung aller unabhängigen Organisationen | freie Wahlen | die Stärkung der Länder | die Trennung von Staat und Partei

# t2-kalter-krieg | Teilung und Wiedervereinigung | Kalter Krieg, BRD, DDR, Mauerfall
> Nach 1945: Besatzungszonen, Potsdamer Konferenz; **Kalter Krieg** zwischen USA (Westen, Kapitalismus, Demokratie) und UdSSR (Osten, Kommunismus).
> **1949**: Gründung der **Bundesrepublik** (Grundgesetz, Adenauer) und der **DDR** (SED-Diktatur).
> Berlin-Blockade und Luftbrücke 1948/49, Aufstand 17. Juni 1953, **Mauerbau 13. 8. 1961**.
> BRD: soziale Marktwirtschaft, „Wirtschaftswunder“, Westintegration (NATO, EWG); Ostpolitik (Brandt).
> **1989**: friedliche Revolution, Montagsdemonstrationen, **Mauerfall 9. November 1989**; **Wiedervereinigung 3. Oktober 1990** (Zwei-plus-Vier-Vertrag).
Kalter Krieg | Konflikt zwischen Ost und West ohne direkten Krieg
Besatzungszone | von einer Siegermacht verwaltetes Gebiet Deutschlands
Luftbrücke | Versorgung West-Berlins aus der Luft 1948/49
Grundgesetz | Verfassung der Bundesrepublik Deutschland, seit 1949
SED | Staatspartei der DDR
Stasi | Ministerium für Staatssicherheit der DDR
Mauerbau | Abriegelung West-Berlins durch die DDR 1961
Montagsdemonstrationen | friedliche Proteste in der DDR 1989
Zwei-plus-Vier-Vertrag | Vertrag zur deutschen Einheit 1990
soziale Marktwirtschaft | Wirtschaftsordnung der BRD mit sozialem Ausgleich
= Gründung von BRD und DDR (Jahr) | 1949
= Mauerbau (Jahr) | 1961
= Mauerfall (Jahr) | 1989
= Wiedervereinigung (Jahr) | 1990
? Der Tag der Deutschen Einheit ist der 3. {{c1::Oktober}}.
! Wofür steht die Luftbrücke? | die Versorgung West-Berlins während der Blockade | den Bau der Mauer | den Fall der Mauer | die Gründung der NATO

# t3-fremdsein | Erfahrungen mit Fremdsein | Wahrnehmung, Migration in der Geschichte
> Inhaltsfeld 1 der Oberstufe: Wie haben Menschen „das Fremde“ wahrgenommen und dargestellt?
> **Perspektiven**: Fremdbilder sagen oft mehr über den Betrachter als über die Betrachteten (Stereotype, Vorurteile).
> Beispiele: Germanenbild bei Tacitus („Germania“), Darstellung der Indigenen nach 1492, **Ruhrpolen** im 19. Jahrhundert, **„Gastarbeiter“** ab 1955 (Anwerbeabkommen mit Italien, Türkei 1961).
> Fachbegriffe: Migration (Ein- und Auswanderung), **Integration**, **Assimilation**, Push- und Pull-Faktoren.
> Methode: **Quellenkritik** – Wer schreibt, wann, für wen, mit welcher Absicht?
Fremdbild | Vorstellung von einer anderen Gruppe
Selbstbild | Vorstellung einer Gruppe von sich selbst
Stereotyp | vereinfachtes, verallgemeinerndes Bild einer Gruppe
Ruhrpolen | polnischsprachige Arbeitsmigranten im Ruhrgebiet um 1900
Gastarbeiter | angeworbene ausländische Arbeitskräfte in der BRD ab 1955
Anwerbeabkommen | Vertrag zur Anwerbung ausländischer Arbeitskräfte
Push-Faktor | Grund, ein Land zu verlassen
Pull-Faktor | Grund, in ein Land zu kommen
Quellenkritik | Prüfung einer Quelle auf Autor, Zeit, Absicht und Glaubwürdigkeit
Germania | Schrift des Tacitus über die Germanen, um 98 n. Chr.
= Anwerbeabkommen mit der Türkei (Jahr) | 1961
= Erstes Anwerbeabkommen mit Italien (Jahr) | 1955
? Gründe, ein Land zu verlassen, heißen {{c1::Push}}-Faktoren.
! Was fragt die Quellenkritik? | wer, wann, für wen und mit welcher Absicht | nur nach dem Datum | nach der Länge | nach dem Preis

# t3-islam-christentum | Islamische und christliche Welt | Expansion, Kreuzzüge, Kulturkontakt
> Inhaltsfeld 2: **Islam** entsteht im 7. Jahrhundert (Mohammed, **Hidschra 622**); rasche Expansion bis Spanien (**al-Andalus**).
> Hochkultur in Bagdad und Córdoba: Wissenschaft (Medizin, Mathematik, Ziffern), Übersetzung antiker Texte.
> **Kreuzzüge** (1096–1291): Aufruf durch Papst Urban II. (1095), Eroberung Jerusalems 1099, Gewalt gegen Muslime und Juden.
> **Reconquista** in Spanien bis 1492.
> Kulturkontakt und -transfer, aber auch Feindbilder auf beiden Seiten; Bewertung aus heutiger Sicht.
Islam | monotheistische Religion, begründet von Mohammed
Hidschra | Auswanderung Mohammeds nach Medina 622, Beginn der islamischen Zeitrechnung
al-Andalus | muslimisch beherrschtes Spanien im Mittelalter
Kreuzzug | Kriegszug zur Eroberung des Heiligen Landes
Reconquista | christliche Rückeroberung der Iberischen Halbinsel
Kalif | Nachfolger Mohammeds als Oberhaupt der Muslime
Kulturtransfer | Austausch von Wissen und Kultur zwischen Gesellschaften
Dschihad | Anstrengung auf dem Weg Gottes; im Krieg als Rechtfertigung genutzt
Urban II. | Papst, der 1095 zum ersten Kreuzzug aufrief
= Jahr der Hidschra | 622
= Aufruf zum ersten Kreuzzug (Jahr) | 1095
= Eroberung Jerusalems durch die Kreuzfahrer (Jahr) | 1099
! Was gelangte u. a. über die islamische Welt nach Europa? | die arabischen Ziffern | der Buchdruck | das Schießpulver aus Amerika | die Dampfmaschine

# t3-menschenrechte | Menschenrechte in historischer Perspektive | Ideen, Erklärungen, Durchsetzung
> Inhaltsfeld 3: **Naturrecht**: Menschen haben angeborene, unveräußerliche Rechte (Locke: Leben, Freiheit, Eigentum).
> **Virginia Bill of Rights** und **amerikanische Unabhängigkeitserklärung** (1776), **französische Erklärung der Menschen- und Bürgerrechte** (1789).
> Kritik: Olympe de Gouges (Rechte der Frau, 1791); Sklaverei blieb bestehen.
> **Allgemeine Erklärung der Menschenrechte** der UN (**10. 12. 1948**), Grundgesetz Art. 1: „Die Würde des Menschen ist unantastbar.“
> Menschenrechte heute: Universalität und ihre Durchsetzung (UN, Internationaler Strafgerichtshof).
Naturrecht | Recht, das dem Menschen von Natur aus zusteht
unveräußerlich | kann nicht weggegeben oder genommen werden
Unabhängigkeitserklärung | Erklärung der USA von 1776
Menschen- und Bürgerrechte | Erklärung der Französischen Revolution 1789
Olympe de Gouges | forderte 1791 die Rechte der Frau
Allgemeine Erklärung der Menschenrechte | UN-Erklärung vom 10. 12. 1948
Menschenwürde | Grundwert jedes Menschen, Artikel 1 Grundgesetz
Universalität | Gültigkeit für alle Menschen überall
Internationaler Strafgerichtshof | Gericht für Völkermord und Kriegsverbrechen in Den Haag
= Jahr der amerikanischen Unabhängigkeitserklärung | 1776
= Jahr der UN-Menschenrechtserklärung | 1948
? Artikel 1 GG: „Die {{c1::Würde}} des Menschen ist unantastbar.“
! Wer forderte 1791 die Rechte der Frau? | Olympe de Gouges | Marie Antoinette | Robespierre | Rousseau

# t4-industriegesellschaft | Die moderne Industriegesellschaft | Wandel von Arbeit, Gesellschaft, Mobilität
> Inhaltsfeld 4: Merkmale der **Zweiten Industriellen Revolution** (ab ca. 1880): Elektrizität, Chemie, Fließband (Ford 1913).
> **Gesellschaftlicher Wandel**: Klassengesellschaft, Arbeiterbewegung, neue Mittelschichten (Angestellte), Rolle der Frau, Urbanisierung.
> **Migration** im Zeitalter der Industrialisierung: Landflucht, Auswanderung nach Amerika, Ruhrpolen.
> **Fortschrittsoptimismus und Krisen**: Weltwirtschaftskrise 1929, Strukturwandel nach 1960 (Zechensterben), **Dienstleistungsgesellschaft**.
> Methode: Statistiken und Bilder als Quellen auswerten.
Zweite Industrielle Revolution | Industrialisierung durch Elektrizität und Chemie ab ca. 1880
Fließbandarbeit | Arbeitsteilung am laufenden Band (Ford)
Taylorismus | wissenschaftliche Betriebsführung mit stark zerlegten Arbeitsschritten
Arbeiterbewegung | Organisation der Arbeiter in Parteien und Gewerkschaften
Angestellte | neue Mittelschicht in Büros und Verwaltung
Landflucht | Abwanderung der Landbevölkerung in die Städte
Strukturwandel | Wandel der Wirtschaft, z. B. von Kohle zu Dienstleistung
Dienstleistungsgesellschaft | Gesellschaft, in der die meisten im Dienstleistungssektor arbeiten
Massenkonsum | Konsum standardisierter Güter durch breite Schichten
= Ford führte das Fließband ein (Jahr) | 1913
? Die Arbeit am Fließband geht auf {{c1::Ford}} zurück.
! Was kennzeichnet den Strukturwandel im Ruhrgebiet? | Rückgang von Kohle und Stahl, Zunahme der Dienstleistung | mehr Zechen | mehr Landwirtschaft | Rückkehr zur Handarbeit

# t4-ns-vertieft | Nationalsozialismus – Ursachen, Herrschaft, Aufarbeitung | Abitur-Inhaltsfeld 5
> **Ursachen**: Krisen der Weimarer Republik, Versailler Vertrag, Wirtschaftskrise, Propaganda, Bündnis mit konservativen Eliten.
> **Herrschaftssystem**: Führerstaat, Terror (SS, Gestapo, KZ) und Zustimmung (Volksgemeinschaft, Erfolge, Propaganda – Goebbels).
> **Verbrechen**: Holocaust, Vernichtungskrieg, Zwangsarbeit, „Euthanasie“-Morde an Kranken und Behinderten, Völkermord an Sinti und Roma.
> **Nachkrieg**: Nürnberger Prozesse 1945/46, Entnazifizierung, Frankfurter Auschwitzprozesse (1963–65), Erinnerungskultur, Historikerstreit.
> Methode: Täter-, Opfer-, Zuschauerperspektiven unterscheiden; Fragen nach **Verantwortung**.
Führerstaat | auf Hitler zugeschnittenes Herrschaftssystem
Propaganda | gezielte Beeinflussung der Meinung
Gestapo | Geheime Staatspolizei
„Euthanasie“ | NS-Mord an Kranken und Menschen mit Behinderung
Vernichtungskrieg | Krieg mit dem Ziel der Ausrottung von Bevölkerungsgruppen
Nürnberger Prozesse | Prozesse gegen NS-Hauptkriegsverbrecher 1945/46
Entnazifizierung | Entfernung ehemaliger Nazis aus Ämtern nach 1945
Erinnerungskultur | Umgang einer Gesellschaft mit ihrer Vergangenheit
Porajmos | Völkermord an den Sinti und Roma
= Beginn der Nürnberger Prozesse (Jahr) | 1945
? Der NS-Propagandaminister war {{c1::Goebbels}}.
! Wodurch sicherte sich das NS-Regime auch Zustimmung? | Propaganda und Erfolge | freie Presse | Wahlen mit mehreren Parteien | Gewaltenteilung
! Was war das Ziel der Entnazifizierung? | NS-Belastete aus öffentlichen Ämtern zu entfernen | Deutschland zu teilen | die Wirtschaft aufzubauen | neue Parteien zu verbieten

# t4-nation | Nation und Nationalismus | Von 1815 bis zur Reichsgründung
> Inhaltsfeld 6: **Nation** als vorgestellte Gemeinschaft (Sprache, Kultur, Geschichte, Wille).
> Nach den Befreiungskriegen: Wartburgfest 1817, **Hambacher Fest 1832** (Schwarz-Rot-Gold).
> **Revolution 1848/49**: Frankfurter Nationalversammlung in der Paulskirche, Verfassung, Scheitern (König lehnt die Kaiserkrone ab).
> **Reichsgründung 1871** „von oben“: Bismarcks Einigungskriege (Dänemark 1864, Österreich 1866, Frankreich 1870/71), Kaiserproklamation in Versailles am 18. 1. 1871.
> Wandel des Nationalismus: von liberal-emanzipatorisch zu aggressiv-ausgrenzend (Kaiserreich, Kulturkampf, Antisemitismus).
Nation | Gemeinschaft, die sich durch Sprache, Kultur, Geschichte oder Willen verbunden fühlt
Nationalismus | übersteigertes Nationalbewusstsein; auch Einigungsbewegung
Hambacher Fest | Volksfest 1832 für Einheit und Freiheit
Paulskirche | Tagungsort der Frankfurter Nationalversammlung 1848/49
kleindeutsche Lösung | Einigung Deutschlands ohne Österreich
Einigungskriege | Kriege Preußens 1864, 1866 und 1870/71
Kaiserproklamation | Ausrufung Wilhelms I. zum Kaiser in Versailles 1871
Reichsgründung „von oben“ | Einigung durch Fürsten und Kriege statt durch das Volk
Kulturkampf | Konflikt Bismarcks mit der katholischen Kirche
= Jahr des Hambacher Festes | 1832
= Jahr der Reichsgründung | 1871
= Revolution in Deutschland (Jahr des Beginns) | 1848
! Warum gilt die Reichsgründung 1871 als Einigung „von oben“? | Sie ging von Fürsten und Kriegen aus, nicht vom Volk | Sie wurde in Frankfurt beschlossen | Sie war eine Volksabstimmung | Österreich führte sie an
! Was ist die „kleindeutsche Lösung“? | Einigung ohne Österreich | Einigung mit Österreich | eine Republik | ein Staatenbund mit Frankreich

# t4-frieden | Friedensschlüsse und Ordnungen des Friedens | 1648, 1815, 1919, 1945/1990
> Inhaltsfeld 7: Wie wird nach Kriegen Frieden geschaffen?
> **Westfälischer Friede 1648** (Münster und Osnabrück): Ende des Dreißigjährigen Krieges, Gleichberechtigung der Konfessionen, Souveränität der Staaten.
> **Wiener Kongress 1814/15**: Restauration, Legitimität, **Gleichgewicht der Mächte**, Deutscher Bund.
> **Pariser Vorortverträge 1919** (Versailles): Völkerbund, Selbstbestimmungsrecht – aber „Diktatfrieden“ aus deutscher Sicht.
> Nach 1945: Potsdamer Abkommen, UNO, europäische Einigung; **Zwei-plus-Vier-Vertrag 1990**.
> Vergleichskriterien: Sieger und Besiegte, Prinzipien, Dauerhaftigkeit, Beteiligung.
Westfälischer Friede | Friedensschluss 1648 nach dem Dreißigjährigen Krieg
Souveränität | Unabhängigkeit eines Staates nach innen und außen
Wiener Kongress | Neuordnung Europas 1814/15 nach Napoleon
Restauration | Wiederherstellung der alten Ordnung
Gleichgewicht der Mächte | kein Staat soll Europa beherrschen
Völkerbund | internationale Organisation zur Friedenssicherung nach 1919
Selbstbestimmungsrecht | Recht der Völker, über ihre Staatsform selbst zu entscheiden
Diktatfrieden | Frieden, der den Besiegten aufgezwungen wird
Potsdamer Abkommen | Beschlüsse der Siegermächte über Deutschland 1945
= Jahr des Westfälischen Friedens | 1648
= Beginn des Wiener Kongresses (Jahr) | 1814
? Der Westfälische Friede wurde in Münster und {{c1::Osnabrück}} geschlossen.
! Welches Prinzip prägte den Wiener Kongress? | Gleichgewicht der Mächte | Selbstbestimmungsrecht der Völker | Volkssouveränität | Kolonialfreiheit
`;

const blocks = [
  ["t1-urgeschichte", "t1-aegypten", "t1-griechen", "t1-rom"],
  ["t2-mittelalter", "t2-neuzeit", "t2-revolution", "t2-industrialisierung", "t2-imperialismus-wk1", "t2-weimar", "t2-ns", "t2-kalter-krieg"],
  ["t3-fremdsein", "t3-islam-christentum", "t3-menschenrechte"],
  ["t4-industriegesellschaft", "t4-ns-vertieft", "t4-nation", "t4-frieden"],
];

export default { units: parseCourse(text, { diagrams }), blocks, lk: [], diagrams };
