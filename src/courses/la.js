// The Latin course, from the first textbook year to the author reading of
// the Oberstufe (after the NRW Kernlehrplan Latein). Format: see parseCourse
// in src/courses.js. Latin (with the forms a school vocabulary list gives) |
// German.
import { parseCourse } from "../courses.js";

const text = `
# v1-forum | In foro | Erste Wörter: Rom und Alltag
forum, -i n. | der Marktplatz, das Forum
via, -ae f. | der Weg, die Straße
Roma, -ae f. | Rom
Romanus, -i m. | der Römer
amicus, -i m. | der Freund
amica, -ae f. | die Freundin
servus, -i m. | der Sklave
serva, -ae f. | die Sklavin
dominus, -i m. | der Herr
domina, -ae f. | die Herrin
populus, -i m. | das Volk
turba, -ae f. | die Menschenmenge
mercator, -oris m. | der Kaufmann, der Händler
taberna, -ae f. | der Laden, die Gaststätte
clamor, -oris m. | das Geschrei, der Lärm
hic | hier
ibi | dort
nunc | jetzt
iam | schon
subito | plötzlich
et | und
sed | aber
non | nicht
-que | und (angehängt)
ecce! | sieh da! schau!
salve! / salvete! | sei gegrüßt! / seid gegrüßt!
vale! / valete! | leb wohl! / lebt wohl!

# v1-familia | Familia Romana | Familie und Haus
familia, -ae f. | die Familie, die Hausgemeinschaft
pater, patris m. | der Vater
mater, matris f. | die Mutter
filius, -i m. | der Sohn
filia, -ae f. | die Tochter
frater, fratris m. | der Bruder
soror, sororis f. | die Schwester
puer, pueri m. | der Junge
puella, -ae f. | das Mädchen
vir, viri m. | der Mann
femina, -ae f. | die Frau
liberi, -orum m. | die Kinder
avus, -i m. | der Großvater
uxor, uxoris f. | die Ehefrau
maritus, -i m. | der Ehemann
domus, -us f. | das Haus
villa, -ae f. | das Landhaus, das Gut
atrium, -i n. | das Atrium
cena, -ae f. | das Essen, die Mahlzeit
cibus, -i m. | die Speise
aqua, -ae f. | das Wasser
vinum, -i n. | der Wein
laetus, -a, -um | froh, fröhlich
miser, misera, miserum | arm, elend
bonus, -a, -um | gut
malus, -a, -um | schlecht

# v1-verba | Verba prima | Die ersten Verben
esse, sum | sein
laborare, laboro | arbeiten
clamare, clamo | rufen, schreien
amare, amo | lieben
vocare, voco | rufen, nennen
spectare, specto | betrachten, anschauen
ambulare, ambulo | spazieren gehen
stare, sto | stehen
intrare, intro | betreten
exspectare, exspecto | erwarten, warten
properare, propero | eilen
narrare, narro | erzählen
rogare, rogo | fragen, bitten
dare, do | geben
videre, video | sehen
tacere, taceo | schweigen
respondere, respondeo | antworten
ridere, rideo | lachen
timere, timeo | fürchten
debere, debeo | müssen; schulden
habere, habeo | haben, halten
manere, maneo | bleiben
sedere, sedeo | sitzen
gaudere, gaudeo | sich freuen
placere, placeo | gefallen
monere, moneo | mahnen, erinnern
iubere, iubeo | befehlen

# v2-villa | In villa | Landgut, Arbeit, Sklaven
ager, agri m. | der Acker, das Feld
agricola, -ae m. | der Bauer
hortus, -i m. | der Garten
equus, -i m. | das Pferd
canis, canis m. | der Hund
silva, -ae f. | der Wald
labor, -oris m. | die Arbeit, die Mühe
opus, operis n. | das Werk, die Arbeit
otium, -i n. | die Freizeit, die Muße
negotium, -i n. | die Aufgabe, das Geschäft
pecunia, -ae f. | das Geld
poena, -ae f. | die Strafe
libertas, -atis f. | die Freiheit
libertus, -i m. | der Freigelassene
vita, -ae f. | das Leben
mors, mortis f. | der Tod
cura, -ae f. | die Sorge, die Pflege
curare, curo | sorgen für, pflegen
parare, paro | vorbereiten
portare, porto | tragen, bringen
servare, servo | retten, bewahren
liberare, libero | befreien
punire, punio | bestrafen
audire, audio | hören
venire, venio | kommen
dormire, dormio | schlafen
nescire, nescio | nicht wissen
scire, scio | wissen

# v2-dei | Di deaeque | Götter, Religion, Opfer
deus, -i m. | der Gott
dea, -ae f. | die Göttin
Iuppiter, Iovis m. | Jupiter
Iuno, Iunonis f. | Juno
Venus, Veneris f. | Venus
Mars, Martis m. | Mars
Minerva, -ae f. | Minerva
Neptunus, -i m. | Neptun
templum, -i n. | der Tempel
ara, -ae f. | der Altar
sacrificium, -i n. | das Opfer
sacerdos, -otis m./f. | der Priester / die Priesterin
oraculum, -i n. | das Orakel
fatum, -i n. | das Schicksal
pietas, -atis f. | die Frömmigkeit, das Pflichtgefühl
caelum, -i n. | der Himmel
terra, -ae f. | die Erde, das Land
mare, maris n. | das Meer
ira, -ae f. | der Zorn
donum, -i n. | das Geschenk
sacer, sacra, sacrum | heilig
immortalis, -e | unsterblich
orare, oro | beten, bitten
colere, colo | verehren; bebauen
credere, credo | glauben, anvertrauen
precari, precor | bitten, beten

# v2-urbs | Urbs Roma | Stadt, Gebäude, Spiele
urbs, urbis f. | die Stadt (Rom)
oppidum, -i n. | die Stadt (Landstadt)
murus, -i m. | die Mauer
porta, -ae f. | das Tor
aedificium, -i n. | das Gebäude
aedificare, aedifico | bauen
thermae, -arum f. | die Thermen
circus, -i m. | der Circus, die Rennbahn
amphitheatrum, -i n. | das Amphitheater
gladiator, -oris m. | der Gladiator
spectaculum, -i n. | das Schauspiel
ludus, -i m. | das Spiel; die Schule
curia, -ae f. | das Rathaus, die Kurie
basilica, -ae f. | die Markthalle, die Basilika
civis, civis m. | der Bürger
senator, -oris m. | der Senator
senatus, -us m. | der Senat
nomen, nominis n. | der Name
locus, -i m. | der Ort, die Stelle
tempus, temporis n. | die Zeit
magnus, -a, -um | groß
parvus, -a, -um | klein
multus, -a, -um | viel
pulcher, pulchra, pulchrum | schön
novus, -a, -um | neu
antiquus, -a, -um | alt

# v3-mythos | Fabulae | Mythen, Helden, Troja
fabula, -ae f. | die Geschichte, die Sage
heros, herois m. | der Held
Troia, -ae f. | Troja
Graeci, -orum m. | die Griechen
Aeneas, -ae m. | Aeneas
Ulixes, -is m. | Odysseus
Hercules, -is m. | Herkules
monstrum, -i n. | das Ungeheuer
equus Troianus | das Trojanische Pferd
dolus, -i m. | die List
insula, -ae f. | die Insel
navis, navis f. | das Schiff
nauta, -ae m. | der Seemann
periculum, -i n. | die Gefahr
fuga, -ae f. | die Flucht
patria, -ae f. | die Heimat
regnum, -i n. | die Herrschaft, das Königreich
rex, regis m. | der König
regina, -ae f. | die Königin
fortis, -e | tapfer, stark
callidus, -a, -um | schlau
fugere, fugio | fliehen
capere, capio | fangen, nehmen
facere, facio | machen, tun
iacere, iacio | werfen
interficere, interficio | töten
relinquere, relinquo | verlassen, zurücklassen

# v3-bellum | Bellum et pax | Krieg, Heer, Frieden
bellum, -i n. | der Krieg
pax, pacis f. | der Frieden
hostis, hostis m. | der Feind (Landesfeind)
inimicus, -i m. | der (persönliche) Feind
miles, militis m. | der Soldat
exercitus, -us m. | das Heer
legio, -onis f. | die Legion
imperator, -oris m. | der Feldherr
dux, ducis m. | der Anführer
arma, -orum n. | die Waffen
gladius, -i m. | das Schwert
pugna, -ae f. | der Kampf
pugnare, pugno | kämpfen
proelium, -i n. | die Schlacht
victoria, -ae f. | der Sieg
vincere, vinco | siegen, besiegen
castra, -orum n. | das Lager
virtus, -utis f. | die Tapferkeit, die Tugend
vulnus, vulneris n. | die Wunde
captivus, -i m. | der Gefangene
oppugnare, oppugno | angreifen, bestürmen
defendere, defendo | verteidigen
occupare, occupo | besetzen
superare, supero | übertreffen, besiegen
ducere, duco | führen
mittere, mitto | schicken, werfen
cedere, cedo | weichen, gehen

# v3-adiectiva | Qualis? | Eigenschaften und Gegensätze
altus, -a, -um | hoch, tief
longus, -a, -um | lang
latus, -a, -um | breit
clarus, -a, -um | hell, berühmt
notus, -a, -um | bekannt
ignotus, -a, -um | unbekannt
liber, libera, liberum | frei
dignus, -a, -um | würdig
iustus, -a, -um | gerecht
iniustus, -a, -um | ungerecht
superbus, -a, -um | stolz, hochmütig
aeger, aegra, aegrum | krank
validus, -a, -um | kräftig, gesund
omnis, -e | jeder, ganz; Pl. alle
gravis, -e | schwer, ernst
levis, -e | leicht
brevis, -e | kurz
facilis, -e | leicht (zu tun)
difficilis, -e | schwierig
crudelis, -e | grausam
nobilis, -e | adlig, berühmt
felix, felicis | glücklich, erfolgreich
ingens, ingentis | riesig
potens, potentis | mächtig
sapiens, sapientis | weise
vetus, veteris | alt

# v4-historia | Res Romanae | Republik, Ämter, Geschichte
res publica, rei publicae f. | der Staat, die Republik
consul, -is m. | der Konsul
magistratus, -us m. | das Amt; der Beamte
imperium, -i n. | der Befehl, die Herrschaft, das Reich
potestas, -atis f. | die Macht, die Amtsgewalt
lex, legis f. | das Gesetz
ius, iuris n. | das Recht
plebs, plebis f. | das einfache Volk
patricius, -i m. | der Patrizier
tribunus plebis | der Volkstribun
dictator, -oris m. | der Diktator
tyrannus, -i m. | der Tyrann, der Gewaltherrscher
gens, gentis f. | das Geschlecht, der Stamm, das Volk
maiores, -um m. | die Vorfahren
mos, moris m. | die Sitte; Pl. der Charakter
auctoritas, -atis f. | das Ansehen, der Einfluss
gloria, -ae f. | der Ruhm
honor, -oris m. | die Ehre, das Ehrenamt
regere, rego | lenken, regieren
creare, creo | wählen (zu), erschaffen
gerere, gero | führen, ausführen
condere, condo | gründen
constituere, constituo | festsetzen, beschließen
tradere, trado | übergeben, überliefern
memoria, -ae f. | die Erinnerung, das Gedächtnis
annus, -i m. | das Jahr

# v4-graecia | Graecia | Griechenland, Philosophie, Bildung
Graecia, -ae f. | Griechenland
Athenae, -arum f. | Athen
philosophus, -i m. | der Philosoph
philosophia, -ae f. | die Philosophie
sapientia, -ae f. | die Weisheit
doctrina, -ae f. | die Lehre, die Bildung
magister, magistri m. | der Lehrer
discipulus, -i m. | der Schüler
liber, libri m. | das Buch
littera, -ae f. | der Buchstabe; Pl. der Brief, die Literatur
ars, artis f. | die Kunst, die Fertigkeit
ratio, -onis f. | die Vernunft, die Art und Weise
animus, -i m. | der Geist, der Mut, die Gesinnung
corpus, corporis n. | der Körper
verbum, -i n. | das Wort
oratio, -onis f. | die Rede
poeta, -ae m. | der Dichter
carmen, carminis n. | das Lied, das Gedicht
discere, disco | lernen
docere, doceo | lehren
legere, lego | lesen; auswählen
scribere, scribo | schreiben
cognoscere, cognosco | erkennen, kennenlernen
putare, puto | glauben, meinen
quaerere, quaero | suchen, fragen
doctus, -a, -um | gelehrt

# v4-provinciae | Imperium Romanum | Provinzen, Germanen, Reisen
provincia, -ae f. | die Provinz
Gallia, -ae f. | Gallien
Germania, -ae f. | Germanien
Germani, -orum m. | die Germanen
Britannia, -ae f. | Britannien
Rhenus, -i m. | der Rhein
flumen, fluminis n. | der Fluss
mons, montis m. | der Berg
finis, finis m. | die Grenze, das Ende; Pl. das Gebiet
limes, limitis m. | der Grenzwall
iter, itineris n. | der Weg, die Reise, der Marsch
barbarus, -i m. | der Barbar, der Fremde
incola, -ae m. | der Einwohner
colonia, -ae f. | die Kolonie, die Siedlung
mercatura, -ae f. | der Handel
aurum, -i n. | das Gold
frumentum, -i n. | das Getreide
tributum, -i n. | die Steuer, der Tribut
vectigal, -alis n. | die Abgabe, der Zoll
alienus, -a, -um | fremd
proximus, -a, -um | der nächste
longinquus, -a, -um | weit entfernt
navigare, navigo | segeln, zur See fahren
transire, transeo | hinübergehen, überschreiten
pervenire, pervenio | gelangen
petere, peto | aufsuchen, erstreben, bitten

# v5-respublica | Civitas | Staat, Recht, Gericht
civitas, -atis f. | die Bürgerschaft, der Staat
societas, -atis f. | die Gemeinschaft, das Bündnis
concordia, -ae f. | die Eintracht
discordia, -ae f. | die Zwietracht
salus, -utis f. | das Wohl, die Rettung, der Gruß
iudex, iudicis m. | der Richter
iudicium, -i n. | das Urteil, das Gericht
crimen, criminis n. | das Verbrechen, der Vorwurf
scelus, sceleris n. | das Verbrechen, der Frevel
reus, -i m. | der Angeklagte
accusare, accuso | anklagen
damnare, damno | verurteilen
iniuria, -ae f. | das Unrecht
fides, -ei f. | die Treue, das Vertrauen
officium, -i n. | die Pflicht
utilitas, -atis f. | der Nutzen
consilium, -i n. | der Rat, der Plan, der Beschluss
sententia, -ae f. | die Meinung, der Satz
voluntas, -atis f. | der Wille
metus, -us m. | die Furcht
spes, spei f. | die Hoffnung
res, rei f. | die Sache, die Angelegenheit
publicus, -a, -um | öffentlich, staatlich
privatus, -a, -um | privat
communis, -e | gemeinsam, allgemein

# v5-animus | Animi motus | Gefühle, Charakter, Tugenden
amor, -oris m. | die Liebe
odium, -i n. | der Hass
dolor, -oris m. | der Schmerz
gaudium, -i n. | die Freude
timor, -oris m. | die Angst
cupiditas, -atis f. | die Begierde, die Leidenschaft
avaritia, -ae f. | die Habgier
superbia, -ae f. | der Hochmut
modestia, -ae f. | die Bescheidenheit
clementia, -ae f. | die Milde
iustitia, -ae f. | die Gerechtigkeit
prudentia, -ae f. | die Klugheit
fortitudo, -inis f. | die Tapferkeit
dignitas, -atis f. | die Würde, das Ansehen
fama, -ae f. | der Ruf, das Gerücht
mens, mentis f. | der Verstand, der Sinn
cor, cordis n. | das Herz
lacrima, -ae f. | die Träne
flere, fleo | weinen
dolere, doleo | Schmerz empfinden, bedauern
cupere, cupio | wünschen, verlangen
sperare, spero | hoffen
contemnere, contemno | verachten
ignoscere, ignosco | verzeihen
vereri, vereor | fürchten, verehren

# v5-particulae | Kleine Wörter | Konjunktionen, Adverbien, Zeit
cum (+ Konj.) | als, weil, obwohl
ut (+ Konj.) | dass, damit, sodass
ne (+ Konj.) | dass nicht, damit nicht
quod | weil; dass
si | wenn, falls
nisi | wenn nicht
quamquam | obwohl
dum | während, solange
postquam | nachdem
antequam / priusquam | bevor
ubi | wo; sobald
quia | weil
enim | nämlich
autem | aber, jedoch
tamen | dennoch
igitur | also, folglich
itaque | deshalb
etiam | auch, sogar
quoque | auch (nachgestellt)
semper | immer
numquam | niemals
saepe | oft
diu | lange
mox | bald
tum | dann, damals
deinde | darauf, dann

# v6-caesar | Caesar | Gallien, Militärsprache, Bellum Gallicum
Caesar, -aris m. | Caesar
Commentarii de bello Gallico | Caesars Bericht über den Gallischen Krieg
Galli, -orum m. | die Gallier
Helvetii, -orum m. | die Helvetier
Belgae, -arum m. | die Belger
civitas Gallica | der gallische Stamm
princeps, principis m. | der Erste, der Fürst
legatus, -i m. | der Gesandte, der Legat
equites, -um m. | die Reiter, die Reiterei
agmen, agminis n. | der Heereszug
acies, -ei f. | die Schlachtreihe
copiae, -arum f. | die Truppen
impetus, -us m. | der Angriff
obsides, -um m. | die Geiseln
auxilium, -i n. | die Hilfe; Pl. die Hilfstruppen
frumentarius, -a, -um | Getreide-, Proviant-
fortuna, -ae f. | das Schicksal, das Glück
coniuratio, -onis f. | die Verschwörung
deditio, -onis f. | die Kapitulation
proficisci, proficiscor | aufbrechen
progredi, progredior | vorrücken
hortari, hortor | ermahnen, auffordern
cogere, cogo | sammeln, zwingen
consistere, consisto | sich aufstellen, haltmachen
obtinere, obtineo | innehaben, behaupten
pacare, paco | unterwerfen, befrieden

# v6-cicero | Cicero | Rede, Gericht, Staat
Cicero, -onis m. | Cicero
orator, -oris m. | der Redner
eloquentia, -ae f. | die Beredsamkeit
contio, -onis f. | die Volksversammlung, die Rede
Catilina, -ae m. | Catilina
patres conscripti | versammelte Senatoren (Anrede)
Quirites | Mitbürger (Anrede)
libertas populi | die Freiheit des Volkes
optimates, -ium m. | die Optimaten
populares, -ium m. | die Popularen
coniurati, -orum m. | die Verschwörer
rem publicam gerere | den Staat lenken
dicere, dico | sagen, sprechen
loqui, loquor | sprechen, reden
persuadere, persuadeo | überreden, überzeugen
probare, probo | billigen, beweisen
negare, nego | verneinen, leugnen
affirmare, affirmo | versichern, bekräftigen
hortatio, -onis f. | die Ermahnung
testis, testis m. | der Zeuge
causa, -ae f. | der Grund, der Prozess
causam dicere | sich vor Gericht verteidigen
patronus, -i m. | der Verteidiger, der Schutzherr
o tempora, o mores! | Was für Zeiten, was für Sitten!
videre, ut | darauf achten, dass
arguere, arguo | beschuldigen, beweisen

# v6-stilmittel | Stilmittel | Fachbegriffe der Textanalyse
alliteratio | Alliteration: gleicher Anlaut
anaphora | Anapher: Wiederholung am Satzanfang
asyndeton | Asyndeton: Aufzählung ohne Konjunktion
polysyndeton | Polysyndeton: Aufzählung mit vielen Konjunktionen
chiasmus | Chiasmus: Überkreuzstellung (a b – b a)
parallelismus | Parallelismus: gleicher Satzbau
antithesis | Antithese: Gegenüberstellung
hyperbaton | Hyperbaton: Sperrung zusammengehöriger Wörter
climax | Klimax: Steigerung
trikolon | Trikolon: Dreierfigur
metaphora | Metapher: bildlicher Ausdruck
comparatio | Vergleich
personificatio | Personifikation
rhetorica interrogatio | rhetorische Frage
litotes | Litotes: Verneinung des Gegenteils
hyperbole | Hyperbel: Übertreibung
ironia | Ironie
ellipsis | Ellipse: Auslassung
praeteritio | Praeteritio: Erwähnung durch Übergehen
exclamatio | Ausruf
apostrophe | Apostrophe: Anrede abwesender Personen/Dinge
enallage | Enallage: Vertauschung des Bezugs
pars pro toto | Teil fürs Ganze
oxymoron | Oxymoron: Verbindung von Gegensätzen
homoioteleuton | Homoioteleuton: gleicher Wortausgang

# v7-ovid | Ovid: Metamorphosen | Liebe, Verwandlung, Mythos
Ovidius, -i m. | Ovid
metamorphosis, -is f. | die Verwandlung
mutare, muto | verändern, verwandeln
forma, -ae f. | die Gestalt, die Schönheit
figura, -ae f. | die Gestalt, die Form
imago, imaginis f. | das Bild, das Abbild
umbra, -ae f. | der Schatten
Amor / Cupido | Amor (Liebesgott)
puer alatus | der geflügelte Knabe
sagitta, -ae f. | der Pfeil
flamma, -ae f. | die Flamme
ardere, ardeo | brennen
nympha, -ae f. | die Nymphe
Daphne, -es f. | Daphne
Narcissus, -i m. | Narziss
Echo, -us f. | Echo
Pyramus et Thisbe | Pyramus und Thisbe
Orpheus, -i m. | Orpheus
Daedalus et Icarus | Daedalus und Ikarus
penna, -ae f. | die Feder
ala, -ae f. | der Flügel
arbor, arboris f. | der Baum
vox, vocis f. | die Stimme
membrum, -i n. | das Glied (Körperteil)
crescere, cresco | wachsen
fallere, fallo | täuschen

# v7-seneca | Seneca: Philosophie | Stoa, Zeit, Glück
Seneca, -ae m. | Seneca
Epistulae morales | Senecas Briefe an Lucilius
Stoicus, -i m. | der Stoiker
virtus vera | die wahre Tugend
natura, -ae f. | die Natur, das Wesen
secundum naturam vivere | im Einklang mit der Natur leben
beatus, -a, -um | glücklich, glückselig
vita beata | das glückliche Leben
voluptas, -atis f. | die Lust, das Vergnügen
divitiae, -arum f. | der Reichtum
paupertas, -atis f. | die Armut
tranquillitas animi | die Seelenruhe
affectus, -us m. | die Leidenschaft, der Affekt
constantia, -ae f. | die Standhaftigkeit
brevitas vitae | die Kürze des Lebens
hora, -ae f. | die Stunde
dies, diei m. | der Tag
vindicare, vindico | beanspruchen, befreien
perdere, perdo | verlieren, verschwenden
fugere tempus | die Zeit flieht
sapiens, -entis m. | der Weise
stultus, -i m. | der Tor, der Dummkopf
exemplum, -i n. | das Beispiel, das Vorbild
moderatio, -onis f. | das Maßhalten
mortalis, -e | sterblich
aeternus, -a, -um | ewig

# v7-poesis | Dichtersprache | Poesie, Metrik, Begriffe
versus, -us m. | der Vers
hexameter, -tri m. | der Hexameter
distichon, -i n. | das Distichon
pentameter, -tri m. | der Pentameter
syllaba, -ae f. | die Silbe
longa / brevis | lange / kurze Silbe
elisio, -onis f. | die Elision (Verschleifung)
caesura, -ae f. | die Zäsur
dactylus, -i m. | der Daktylus (– ◡ ◡)
spondeus, -i m. | der Spondeus (– –)
Musa, -ae f. | die Muse
lyra, -ae f. | die Leier
canere, cano | singen, besingen
epos, -i n. | das Epos
elegia, -ae f. | die Elegie
Vergilius, -i m. | Vergil
Aeneis, -idis f. | die Aeneis
Horatius, -i m. | Horaz
Catullus, -i m. | Catull
carpe diem | nutze den Tag
odi et amo | ich hasse und liebe
aetas aurea | das goldene Zeitalter
locus amoenus | der liebliche Ort
nox, noctis f. | die Nacht
lux, lucis f. | das Licht
sidus, sideris n. | das Gestirn

# g1-a-o-dekl | a- und o-Deklination | Nominativ und Akkusativ
> Nomen ändern ihre Endung je nach Fall (Kasus). Zuerst: **Nominativ** (Subjekt, wer?) und **Akkusativ** (Objekt, wen?).
> ## a-Deklination (meist feminin): amica
> Sg.: Nom. amic**a** · Akk. amic**am** — Pl.: Nom. amic**ae** · Akk. amic**as**
> ## o-Deklination (meist maskulin): servus
> Sg.: Nom. serv**us** · Akk. serv**um** — Pl.: Nom. serv**i** · Akk. serv**os**
> ## o-Deklination Neutrum: forum
> Sg.: Nom./Akk. for**um** — Pl.: Nom./Akk. for**a** (Neutrum: Nom. = Akk.!)
> Das Prädikat steht meist am Satzende: Servus dominum exspectat.
? Amic{{c1::a}} in foro stat. (Freundin – Nom. Sg.)
? Servi domin{{c1::um}} exspectant. (den Herrn)
? Puellae amic{{c1::as}} vocant. (die Freundinnen)
? Domin{{c1::us}} servos vocat. (der Herr)
? Romani templ{{c1::a}} spectant. (die Tempel)
? Serv{{c1::i}} laborant. (die Sklaven – Nom. Pl.)
? Marcus amic{{c1::os}} salutat. (die Freunde)
? Turba {{c1::forum}} intrat. (das Forum)
? Filiae patrem {{c1::exspectant}}. (erwarten)

# g1-praesens | Präsens: a- und e-Konjugation | voco, video
> Die Endung zeigt die Person – ein Pronomen braucht man nicht.
> **vocare** (a-Konj.): voc**o** · voc**as** · voc**at** · voc**amus** · voc**atis** · voc**ant**
> **videre** (e-Konj.): vide**o** · vide**s** · vide**t** · vide**mus** · vide**tis** · vide**nt**
> Infinitiv: voc**are**, vid**ere** · Imperativ: voc**a**! voc**ate**! – vid**e**! vid**ete**!
> Merke: **-o** ich · **-s** du · **-t** er/sie/es · **-mus** wir · **-tis** ihr · **-nt** sie
? Ego amicum {{c1::voco}}. (vocare – ich)
? Tu forum {{c1::spectas}}. (spectare – du)
? Servus {{c1::laborat}}. (laborare – er)
? Nos dominum {{c1::videmus}}. (videre – wir)
? Vos {{c1::tacetis}}. (tacere – ihr)
? Puellae {{c1::rident}}. (ridere – sie)
? {{c1::Propera}}, Marce! (properare – Imperativ Sg.)
? {{c1::Tacete}}, pueri! (tacere – Imperativ Pl.)
? Cur non {{c1::respondes}}? (respondere – du)
? Mercatores in foro {{c1::clamant}}. (clamare – sie)

# g1-esse | esse und posse | sum, es, est – possum
> **esse** (sein): sum · es · est · sumus · estis · sunt
> Ist esse Prädikat, steht oft ein **Prädikatsnomen** im Nominativ: Marcus servus est.
> **posse** (können) = pot- + esse: possum · potes · potest · possumus · potestis · possunt
> Vor s wird pot- zu pos-: **pos**sum, **pos**sumus, **pos**sunt.
> Mit Infinitiv: Laborare non possum. (Ich kann nicht arbeiten.)
? Ego Romanus {{c1::sum}}.
? Tu servus {{c1::es}}.
? Villa magna {{c1::est}}.
? Nos amici {{c1::sumus}}.
? Vos laeti {{c1::estis}}.
? Servi miseri {{c1::sunt}}.
? Ego laborare non {{c1::possum}}.
? Puellae cantare {{c1::possunt}}.
? {{c1::Potestis}} nos audire? (könnt ihr)

# g2-kasus | Genitiv, Dativ, Ablativ | Alle fünf Fälle
> **Genitiv** (wessen?): domus domin**i** – das Haus des Herrn
> **Dativ** (wem?): servo cibum dat – er gibt dem Sklaven Essen
> **Ablativ** (womit? wodurch? wo? wann?): gladio pugnat – er kämpft mit dem Schwert · in foro – auf dem Forum
> ## a-Dekl. amica
> Gen. amic**ae** / amic**arum** · Dat. amic**ae** / amic**is** · Abl. amic**a** / amic**is**
> ## o-Dekl. servus
> Gen. serv**i** / serv**orum** · Dat. serv**o** / serv**is** · Abl. serv**o** / serv**is**
> Präpositionen mit Ablativ: in, cum, de, ex/e, a/ab, sine, pro · mit Akkusativ: ad, ante, post, per, in (wohin?)
? Villa domin{{c1::i}} magna est. (des Herrn)
? Pater fili{{c1::o}} donum dat. (dem Sohn)
? Servi cum domin{{c1::o}} veniunt. (mit dem Herrn)
? Liberi in hort{{c1::o}} ludunt. (im Garten)
? Turba ad for{{c1::um}} properat. (zum Forum)
? Nomina servor{{c1::um}} nota sunt. (der Sklaven)
? Puellae amic{{c1::is}} fabulam narrant. (den Freundinnen)
? Marcus gladi{{c1::o}} pugnat. (mit dem Schwert)
? Mercator ex tabern{{c1::a}} venit. (aus dem Laden)

# g2-kons-dekl | Konsonantische Deklination | mercator, nomen, urbs
> Die 3. Deklination hat viele Genitive auf **-is** – den Stamm erkennt man erst am Genitiv: mercator, mercator**is**.
> ## mercator (m./f.)
> Sg.: Nom. mercator · Gen. mercator**is** · Dat. mercator**i** · Akk. mercator**em** · Abl. mercator**e**
> Pl.: Nom./Akk. mercator**es** · Gen. mercator**um** · Dat./Abl. mercator**ibus**
> ## nomen (Neutrum)
> Sg. Nom./Akk. nomen · Pl. Nom./Akk. nomin**a**
> i-Stämme (urbs, civis, mare) haben Gen. Pl. **-ium**: urb**ium**, civ**ium**.
? Mercator{{c1::es}} in foro clamant. (die Händler)
? Servus mercator{{c1::em}} videt. (den Händler)
? Pater uxor{{c1::i}} donum dat. (der Ehefrau)
? Nomen mercator{{c1::is}} Lucius est. (des Händlers)
? Senatores cum consul{{c1::e}} veniunt. (mit dem Konsul)
? Nomin{{c1::a}} deorum nota sunt. (die Namen)
? Romani clamor{{c1::em}} audiunt. (den Lärm)
? Muri urb{{c1::is}} alti sunt. (der Stadt)
? Imperator militi{{c1::bus}} gratias agit. (den Soldaten)

# g2-imperfekt-futur | Imperfekt und Futur I | vocabam, vocabo
> ## Imperfekt (erzählt, was dauerte oder üblich war)
> Kennzeichen **-ba-**: voca**ba**m · voca**ba**s · voca**ba**t · voca**ba**mus · voca**ba**tis · voca**ba**nt
> esse: eram, eras, erat … · audire: audi**eba**m
> ## Futur I
> a/e-Konjugation **-b-**: voca**bo** · voca**bis** · voca**bit** · voca**bimus** · voca**bitis** · voca**bunt**
> konsonantische und i-Konjugation **-a-/-e-**: mittam · mittes · mittet … · audiam · audies …
> esse: ero, eris, erit · posse: potero
? Olim Romani deos {{c1::colebant}}. (colere – Imperfekt, sie)
? Puer saepe in silva {{c1::ambulabat}}. (ambulare – Imperfekt)
? Tum servi miseri {{c1::erant}}. (esse – Imperfekt)
? Cras amicum {{c1::vocabo}}. (vocare – Futur, ich)
? Mox {{c1::videbimus}} templum. (videre – Futur, wir)
? Cras {{c1::veniemus}}. (venire – Futur, wir)
? Iam diu te {{c1::exspectabam}}. (exspectare – Imperfekt, ich)
? Tu felix {{c1::eris}}. (esse – Futur)
? Milites urbem {{c1::defendent}}. (defendere – Futur)

# g3-perfekt | Perfekt | vocavi, vidi, fui
> Das Perfekt ist das Erzähltempus: was einmal geschah.
> Endungen (bei allen Verben gleich): **-i · -isti · -it · -imus · -istis · -erunt**
> Den Perfektstamm lernt man mit: voc**av**- · mon**u**- · vid- · mis- · cep- · fu-
> v-Perfekt: vocavi · u-Perfekt: monui · Dehnung: vidi, veni · s-Perfekt: misi, mansi · Reduplikation: dedi, steti
> esse → **fui** · ire → **ii** · posse → **potui**
> Plusquamperfekt: Perfektstamm + **-eram**: vocaveram (ich hatte gerufen)
? Heri amicum {{c1::vocavi}}. (vocare – ich)
? Caesar Galliam {{c1::vicit}}. (vincere)
? Graeci Troiam {{c1::ceperunt}}. (capere)
? Tu mihi donum {{c1::dedisti}}. (dare)
? Nos templum {{c1::vidimus}}. (videre)
? Aeneas ex urbe {{c1::fugit}}. (fugere)
? Ubi {{c1::fuistis}}? (esse – ihr)
? Imperator legatos {{c1::misit}}. (mittere)
? Servi diu {{c1::laboraverant}}. (laborare – Plusquamperfekt)

# g3-adjektive | Adjektive | KNG-Kongruenz, a/o- und 3. Deklination
> Adjektive richten sich nach ihrem Nomen in **K**asus, **N**umerus und **G**enus (KNG) – nicht unbedingt in der Endung!
> a/o-Deklination: bonus, bona, bonum – vir bon**us**, femina bon**a**, donum bon**um**
> agricola (m.) bon**us**: gleicher Fall, andere Endung.
> 3. Deklination: fortis, forte (zweiendig) · felix, felicis (einendig) · acer, acris, acre (dreiendig)
> Abl. Sg. meist **-i**, Gen. Pl. **-ium**, Neutr. Pl. **-ia**: cum milite fort**i**, militum fort**ium**, animalia fort**ia**
? Servus miser est, domina {{c1::misera}} non est. (miser)
? Agricola {{c1::bonus}} laborat. (bonus)
? Templa {{c1::magna}} spectamus. (magnus)
? Milites {{c1::fortes}} pugnant. (fortis – Nom. Pl.)
? Imperator cum militibus {{c1::fortibus}} venit. (fortis – Abl. Pl.)
? Puellam {{c1::pulchram}} video. (pulcher)
? Hoc bellum {{c1::grave}} est. (gravis – Neutrum)
? Homines {{c1::felices}} rident. (felix)
? Viae {{c1::longae}} sunt. (longus)

# g3-pronomen | Pronomen | is, hic, ille, qui
> **is, ea, id** – er, sie, es / dieser; Gen. **eius** (sein, ihr): Filius eius – sein Sohn
> **hic, haec, hoc** – dieser (hier) · **ille, illa, illud** – jener (dort)
> **qui, quae, quod** – Relativpronomen (der, die, das; welcher): richtet sich in Genus und Numerus nach dem Bezugswort, der Kasus nach seiner Rolle im Relativsatz
> Vir, **quem** vides, consul est. (Der Mann, den du siehst …)
> **suus, -a, -um** – sein/ihr (reflexiv, bezieht sich auf das Subjekt) · **eius** – sein/ihr (nicht reflexiv)
> Personalpronomen: ego, me, mihi · tu, te, tibi · nos, vos · se (sich)
? Marcus amicum videt et {{c1::eum}} vocat. (ihn)
? Puella, {{c1::quam}} amo, Iulia est. (die – Akk.)
? Templum, {{c1::quod}} spectas, Iovis est. (das – Akk.)
? Vir, {{c1::qui}} venit, consul est. (der – Nom.)
? {{c1::Hic}} liber meus est. (dieser – m.)
? {{c1::Illa}} urbs Roma est. (jene – f.)
? Marcus patrem {{c1::suum}} amat. (seinen eigenen)
? Domus {{c1::eius}} magna est. (sein – nicht reflexiv)
? Da {{c1::mihi}} librum! (mir)

# g4-aci | AcI | Accusativus cum Infinitivo
> Nach Verben des Sagens, Meinens, Wissens und Wahrnehmens (dicere, putare, scire, videre, audire) steht ein **Akkusativ** als Subjekt und ein **Infinitiv** als Prädikat.
> Übersetzung mit „dass“: Video amicum venire. → Ich sehe, **dass** der Freund kommt.
> ## Zeitverhältnis
> Infinitiv Präsens = **gleichzeitig** (venire) · Infinitiv Perfekt = **vorzeitig** (venisse) · Infinitiv Futur = **nachzeitig** (venturum esse)
> Bezieht sich der Akkusativ auf das Subjekt des Hauptsatzes, steht **se**: Marcus dicit **se** laetum esse.
? Video amic{{c1::um}} venire. (den Freund)
? Scio te Romam {{c1::venisse}}. (venire – vorzeitig)
? Marcus dicit {{c1::se}} laetum esse. (sich – er selbst)
? Audio puellas {{c1::cantare}}. (cantare – gleichzeitig)
? Putamus deos nos {{c1::adiuvare}}. (adiuvare – gleichzeitig)
? Caesar putat hostes {{c1::fugisse}}. (fugere – vorzeitig)
? Nuntius dicit milites {{c1::venturos esse}}. (venire – nachzeitig)
? Constat Romam magnam {{c1::esse}}. (esse – gleichzeitig)
? Puto {{c1::eum}} errare. (ihn – nicht reflexiv)

# g4-passiv | Passiv | vocor, vocatus sum
> ## Präsensstamm (Präsens, Imperfekt, Futur)
> Passivendungen: **-or · -ris · -tur · -mur · -mini · -ntur**
> voc**or** (ich werde gerufen) · vocaba**tur** (er wurde gerufen) · voca**bitur** (er wird gerufen werden)
> Infinitiv Präsens Passiv: voca**ri**, vide**ri**, mitt**i**, audi**ri**
> ## Perfektstamm
> **PPP + esse**: vocatus sum (ich bin gerufen worden) · vocatus eram (ich war gerufen worden)
> Das PPP richtet sich nach dem Subjekt: Urbs capt**a** est.
> **Deponentien** haben passive Formen, aber aktive Bedeutung: hortor – ich ermahne.
? Servus a domino {{c1::vocatur}}. (vocare – Präsens Passiv)
? Milites ab imperatore {{c1::laudantur}}. (laudare – sie werden gelobt)
? Troia a Graecis {{c1::capta}} est. (capere – PPP f.)
? Urbs bene {{c1::defendebatur}}. (defendere – Imperfekt Passiv)
? Puer a matre {{c1::amatur}}. (amare)
? Litterae {{c1::missae}} sunt. (mittere – PPP f. Pl.)
? Nos ab amicis {{c1::videmur}}. (videre – wir)
? Hostes {{c1::victi}} sunt. (vincere – PPP m. Pl.)
? Hoc templum deo {{c1::dedicatum}} est. (dedicare – PPP n.)

# g4-u-e-dekl | u- und e-Deklination | senatus, res
> ## u-Deklination (meist maskulin): senatus
> Sg.: Nom. senat**us** · Gen. senat**us** · Dat. senat**ui** · Akk. senat**um** · Abl. senat**u**
> Pl.: Nom./Akk. senat**us** · Gen. senat**uum** · Dat./Abl. senat**ibus**
> domus (f.) ist feminin! · manus (f.) die Hand
> ## e-Deklination (meist feminin): res
> Sg.: Nom. r**es** · Gen. r**ei** · Dat. r**ei** · Akk. r**em** · Abl. r**e**
> Pl.: Nom./Akk. r**es** · Gen. r**erum** · Dat./Abl. r**ebus**
> res hat viele Bedeutungen: res publica (Staat), res gestae (Taten), res adversae (Unglück)
? Consul in senat{{c1::u}} orationem habet. (im Senat)
? Exercit{{c1::us}} Caesaris magnus est. (das Heer – Nom.)
? Imperator impet{{c1::um}} hostium exspectat. (den Angriff)
? Spe{{c1::m}} non amittimus. (die Hoffnung – Akk.)
? R{{c1::es}} publica in periculo est. (der Staat)
? Caesar r{{c1::es}} gestas scribit. (die Taten – Akk. Pl.)
? Multis di{{c1::ebus}} laboravimus. (an vielen Tagen)
? Fides r{{c1::ei}} publicae magna est. (des Staates)
? Senat{{c1::us}} populusque Romanus. (der Senat)

# g5-pc | Participium coniunctum | Das PC
> Ein Partizip, das mit einem Nomen verbunden ist (KNG-Kongruenz), ersetzt einen Nebensatz.
> **PPA** (Partizip Präsens Aktiv, -ns, -ntis) = **gleichzeitig**, aktiv: Puer **ridens** – der Junge, der lacht / während er lacht
> **PPP** (Partizip Perfekt Passiv, -tus) = **vorzeitig**, passiv: Urbs **capta** – die Stadt, die erobert worden war / nachdem sie erobert worden war
> **PFA** (Partizip Futur Aktiv, -turus) = **nachzeitig**: moriturus – einer, der sterben wird
> Übersetzungsmöglichkeiten: Relativsatz, Adverbialsatz (als, weil, obwohl), Beiordnung, Präpositionalausdruck
? Puellam {{c1::ridentem}} video. (ridere – PPA, Akk.)
? Milites urbem {{c1::captam}} intraverunt. (capere – PPP, Akk.)
? Servus a domino {{c1::vocatus}} venit. (vocare – PPP, Nom.)
? Mercatores {{c1::clamantes}} in foro stant. (clamare – PPA, Nom. Pl.)
? Caesar hostes {{c1::fugientes}} vidit. (fugere – PPA, Akk. Pl.)
? Graeci Troiam {{c1::expugnatam}} deleverunt. (expugnare – PPP)
? Ave, Caesar, {{c1::morituri}} te salutant. (mori – PFA)
? Amicus mihi epistulam {{c1::scriptam}} dedit. (scribere – PPP, Akk. f.)
? Puer {{c1::dormiens}} nihil audit. (dormire – PPA)

# g5-abl-abs | Ablativus absolutus | Der Abl. abs.
> Ein Nomen im Ablativ mit einem Partizip im Ablativ – grammatisch „losgelöst“ vom Hauptsatz.
> **Abl. + PPP** = vorzeitig, passiv: **Urbe capta** milites gaudebant. – Nachdem die Stadt erobert worden war, …
> **Abl. + PPA** = gleichzeitig, aktiv: **Caesare imperante** – während Caesar herrschte / unter Caesars Herrschaft
> **Nominaler Abl. abs.** (ohne Partizip): **Cicerone consule** – als Cicero Konsul war · **me invito** – gegen meinen Willen
> Übersetzung: Nebensatz (nachdem, als, weil, obwohl), Präpositionalausdruck, Beiordnung
? Urbe {{c1::capta}} Graeci gaudebant. (capere – PPP)
? Caesare {{c1::imperante}} Galli victi sunt. (imperare – PPA)
? Hostibus {{c1::victis}} milites in castra redierunt. (vincere – PPP)
? {{c1::Cicerone}} consule coniuratio patefacta est. (Cicero – Abl.)
? Litteris {{c1::acceptis}} Caesar profectus est. (accipere – PPP)
? Sole {{c1::oriente}} agricolae laborant. (oriri – PPA)
? Pace {{c1::facta}} omnes laeti erant. (facere – PPP)
? Patre {{c1::vivo}} filius tacebat. (vivus – nominal)
? Signo {{c1::dato}} milites pugnare coeperunt. (dare – PPP)

# g5-konjunktiv | Konjunktiv in Gliedsätzen | ut, ne, cum
> ## Formen
> Konj. Präsens: a-Konj. voc**e**m, e-/kons./i-Konj. vide**a**m, mitt**a**m, audi**a**m · esse: **sim**, sis, sit …
> Konj. Imperfekt: Infinitiv + Endung: vocare**m**, esse**m**, posse**m**
> Konj. Perfekt: voca**verim** · Konj. Plusquamperfekt: voca**vissem**
> ## Gliedsätze
> **ut** + Konj.: dass, damit, sodass · **ne** + Konj.: dass nicht, damit nicht
> **cum** + Konj.: als, nachdem (cum historicum), weil, obwohl
> **indirekte Frage** + Konj.: Nescio, ubi **sis**.
> Zeitenfolge (consecutio temporum): Hauptsatz Präsens → Konj. Präsens/Perfekt; Hauptsatz Vergangenheit → Konj. Imperfekt/Plusquamperfekt
? Te oro, ut {{c1::venias}}. (venire – Konj. Präsens)
? Caesar imperavit, ut milites castra {{c1::moverent}}. (movere – Konj. Imperfekt)
? Laboramus, ne {{c1::puniamur}}. (punire – damit wir nicht)
? Cum Caesar Romam {{c1::venisset}}, senatores timebant. (venire – Konj. Plusquamperfekt)
? Nescio, ubi {{c1::sis}}. (esse – du)
? Rogo te, quid {{c1::facias}}. (facere – indirekte Frage)
? Tam fortis erat, ut omnes eum {{c1::laudarent}}. (laudare – sodass)
? Cum {{c1::essem}} puer, Romae habitabam. (esse – als ich)
? Monuit amicos, {{c1::ne}} discederent. (dass nicht)

# g6-nd | nd-Formen | Gerundium und Gerundivum
> **Gerundium**: substantivierter Infinitiv (das Lesen) – nur Gen., Dat., Akk. (nach Präp.), Abl.: ars **legendi** – die Kunst des Lesens · **ad pugnandum** – zum Kämpfen
> **Gerundivum** attributiv: ein Adjektiv auf -ndus, -a, -um, das sich nach dem Nomen richtet: **ad urbem capiendam** – um die Stadt zu erobern
> **causa** / **gratia** + Gen.: **pacis petendae causa** – um Frieden zu erbitten
> **Gerundivum + esse** (prädikativ): Notwendigkeit, „muss … werden“: Carthago **delenda est**. – Karthago muss zerstört werden.
> Dativus auctoris (wer muss?): **Nobis** laborandum est. – Wir müssen arbeiten.
? Ars {{c1::dicendi}} difficilis est. (dicere – des Redens)
? Milites ad {{c1::pugnandum}} parati sunt. (pugnare – zum Kämpfen)
? Caesar ad urbem {{c1::capiendam}} venit. (capere – Gerundivum f.)
? Legati pacis {{c1::petendae}} causa venerunt. (petere)
? Carthago {{c1::delenda}} est. (delere – muss zerstört werden)
? Nobis {{c1::laborandum}} est. (laborare – wir müssen)
? Discimus {{c1::legendo}}. (legere – durch Lesen)
? Libri {{c1::legendi}} sunt. (legere – müssen gelesen werden)
? Cupidus urbis {{c1::videndae}} sum. (videre – die Stadt zu sehen)

# g6-konj-hauptsatz | Konjunktiv im Hauptsatz | Wunsch, Aufforderung, Möglichkeit
> **Hortativ** (1. Pl. Konj. Präsens): Aufforderung an sich selbst – **Gaudeamus**! (Lasst uns fröhlich sein!)
> **Iussiv** (3. Pers. Konj. Präsens): Befehl an Dritte – **Veniat**! (Er soll kommen!)
> **Prohibitiv** (ne + Konj. Perfekt): Verbot – **Ne** id **feceris**! (Tu das nicht!)
> **Optativ** (utinam + Konj.): Wunsch – **Utinam** adesses! (Wärst du doch da!)
> **Potentialis** (Konj. Präsens/Perfekt): Möglichkeit – **Dicat** aliquis … (Es könnte jemand sagen …)
> **Irrealis** (Konj. Imperfekt/Plusquamperfekt): Unwirkliches – Si **viveret**, **gauderet**.
> **Deliberativ**: Überlegungsfrage – Quid **faciam**? (Was soll ich tun?)
? {{c1::Gaudeamus}} igitur! (gaudere – lasst uns)
? {{c1::Veniat}} amicus! (venire – er soll)
? Ne hoc {{c1::feceris}}! (facere – Prohibitiv)
? Utinam pater {{c1::adesset}}! (adesse – Wunsch, Gegenwart)
? Quid {{c1::faciam}}? (facere – was soll ich)
? Si tacuisses, philosophus {{c1::mansisses}}. (manere – Irrealis Vergangenheit)
? {{c1::Dicat}} aliquis: „Errat.“ (dicere – Potentialis)
? Utinam ne id {{c1::dixissem}}! (dicere – Wunsch, Vergangenheit)
? {{c1::Pugnemus}} pro patria! (pugnare – lasst uns)

# g6-deponentien | Deponentien und Semideponentien | hortor, loquor
> Deponentien haben **passive Formen** mit **aktiver Bedeutung**.
> hortari: hortor (ich ermahne) · hortaris · hortatur … · Perfekt: hortatus sum (ich habe ermahnt)
> Wichtige: conari (versuchen), arbitrari (meinen), loqui (sprechen), sequi (folgen), proficisci (aufbrechen), pati (erleiden), mori (sterben), uti (+ Abl., benutzen), oriri (entstehen)
> Das PPP der Deponentien ist **aktiv** und **vorzeitig**: hortatus – nachdem er ermahnt hatte
> Semideponentien: Präsensstamm aktiv, Perfektstamm passiv: audere, ausus sum (wagen) · gaudere, gavisus sum
? Caesar milites {{c1::hortatur}}. (hortari – er ermahnt)
? Cicero in senatu {{c1::loquitur}}. (loqui – er spricht)
? Legiones imperatorem {{c1::sequuntur}}. (sequi – sie folgen)
? Caesar mane {{c1::profectus}} est. (proficisci – PPP)
? Multi in bello {{c1::mortui}} sunt. (mori – PPP m. Pl.)
? Gladio {{c1::utimur}}. (uti – wir benutzen)
? Milites, ab imperatore {{c1::hortati}}, fortiter pugnaverunt. (hortari – PPP)
? Galli Romanos vincere {{c1::conantur}}. (conari – sie versuchen)
? Nemo id facere {{c1::ausus}} est. (audere – wagte)

# g7-oratio-obliqua | Oratio obliqua | Indirekte Rede bei Caesar
> Caesar berichtet Reden meist **indirekt**:
> Hauptsätze (Aussagen) → **AcI**: Dixit **se** venturum esse.
> Gliedsätze → **Konjunktiv** (meist Imperfekt/Plusquamperfekt nach Vergangenheit)
> Befehle → **Konjunktiv** (ohne ut): Dixit, milites **venirent**. (Die Soldaten sollten kommen.)
> Pronomen: der Sprecher wird zu **se / suus**, der Angesprochene zu **is / ille**
> Übersetzung ins Deutsche mit Konjunktiv I: „er sei“, „sie hätten“.
? Legati dixerunt {{c1::se}} pacem petere. (sie selbst)
? Ariovistus respondit {{c1::se}} prius in Galliam venisse quam populum Romanum. (er selbst)
? Caesar dixit hostes, qui {{c1::fugissent}}, iam procul esse. (fugere – Konj. Plusquamperfekt)
? Imperator dixit milites fortiter {{c1::pugnarent}}. (pugnare – Befehl)
? Nuntiaverunt Helvetios iter per provinciam facere {{c1::conari}}. (conari – Inf.)
? Dixit {{c1::suos}} milites paratos esse. (seine eigenen)
? Respondit Caesar {{c1::eum}} errare. (ihn – den Angesprochenen)
? Legati orabant, ut Caesar sibi {{c1::ignosceret}}. (ignoscere – Konj. Imperfekt)

# g7-nci | NcI und Konditionalsätze | dicitur esse – si …
> **NcI** (Nominativus cum Infinitivo): bei passivem Verb des Sagens/Meinens steht das Subjekt im Nominativ: Homerus caecus fuisse **dicitur**. – Homer soll blind gewesen sein. / Man sagt, Homer sei blind gewesen.
> Ebenso: videtur (scheint), putatur, traditur (wird überliefert)
> ## Konditionalsätze
> Realis (Indikativ): Si vales, gaudeo.
> Potentialis (Konj. Präsens/Perfekt): Si quis dicat … (Wenn jemand sagen sollte …)
> Irrealis der Gegenwart (Konj. Imperfekt): Si adesses, gauderem.
> Irrealis der Vergangenheit (Konj. Plusquamperfekt): Si adfuisses, gavisus essem.
? Homerus caecus {{c1::fuisse}} dicitur. (esse – vorzeitig)
? Roma a Romulo {{c1::condita}} esse traditur. (condere – PPP f.)
? Tu felix esse {{c1::videris}}. (videri – du scheinst)
? Si {{c1::vales}}, bene est. (valere – Realis)
? Si adesses, {{c1::gauderem}}. (gaudere – Irrealis Gegenwart)
? Si me {{c1::audivisses}}, non errasses. (audire – Irrealis Vergangenheit)
? Seneca sapiens {{c1::fuisse}} putatur. (esse)
? Nisi {{c1::properavissemus}}, sero venissemus. (properare – Irrealis Vergangenheit)
? Puellae laetae esse {{c1::videntur}}. (videri – sie scheinen)
`;

// Seven blocks: four textbook years, the step into real texts, and two blocks
// of author reading.
const blocks = [
  ["v1-forum", "v1-familia", "v1-verba", "g1-a-o-dekl", "g1-praesens", "g1-esse"],
  ["v2-villa", "v2-dei", "v2-urbs", "g2-kasus", "g2-kons-dekl", "g2-imperfekt-futur"],
  ["v3-mythos", "v3-bellum", "v3-adiectiva", "g3-perfekt", "g3-adjektive", "g3-pronomen"],
  ["v4-historia", "v4-graecia", "v4-provinciae", "g4-aci", "g4-passiv", "g4-u-e-dekl"],
  ["v5-respublica", "v5-animus", "v5-particulae", "g5-pc", "g5-abl-abs", "g5-konjunktiv"],
  ["v6-caesar", "v6-cicero", "v6-stilmittel", "g6-nd", "g6-konj-hauptsatz", "g6-deponentien"],
  ["v7-ovid", "v7-seneca", "v7-poesis", "g7-oratio-obliqua", "g7-nci"],
];

export default { units: parseCourse(text), blocks };
