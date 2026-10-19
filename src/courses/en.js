// The English course, Klasse 5 to the Abitur (after the NRW Kernlehrplan
// Englisch, Sek I and II). Format: see parseCourse in src/courses.js.
// English | German.
import { parseCourse } from "../courses.js";

const text = `
# v1-hello | Hello! | Begrüßen, vorstellen, Zahlen
hello / hi | hallo
good morning | guten Morgen
goodbye / bye | tschüss
see you later | bis später
How are you? | Wie geht es dir?
I'm fine, thanks | mir geht's gut, danke
What's your name? | Wie heißt du?
my name is … | ich heiße …
Where are you from? | Woher kommst du?
I'm from Germany | ich komme aus Deutschland
How old are you? | Wie alt bist du?
I'm eleven years old | ich bin elf Jahre alt
nice to meet you | schön, dich kennenzulernen
boy / girl | Junge / Mädchen
friend | der Freund / die Freundin
please | bitte
thank you | danke
you're welcome | gern geschehen
sorry | Entschuldigung
excuse me | Entschuldigung (um etwas zu fragen)
one, two, three | eins, zwei, drei
eleven, twelve | elf, zwölf
thirteen, twenty | dreizehn, zwanzig
a hundred | hundert
Monday, Tuesday, Wednesday | Montag, Dienstag, Mittwoch
Thursday, Friday | Donnerstag, Freitag
Saturday, Sunday | Samstag, Sonntag
birthday | der Geburtstag

# v1-school | At school | Schule und Unterricht
school | die Schule
classroom | das Klassenzimmer
teacher | der Lehrer / die Lehrerin
pupil / student | der Schüler / die Schülerin
subject | das Schulfach
maths | Mathe
German | Deutsch
history | Geschichte
geography | Erdkunde
PE | Sport (Schulfach)
timetable | der Stundenplan
break | die Pause
lesson | die Unterrichtsstunde
homework | die Hausaufgaben
test | die Klassenarbeit, der Test
mark | die Note
book | das Buch
exercise book | das Heft
pencil case | das Federmäppchen
schoolbag | die Schultasche
board | die Tafel
ruler | das Lineal
rubber | der Radiergummi
to learn | lernen
to listen | zuhören
to repeat | wiederholen
easy / difficult | leicht / schwierig
boring | langweilig

# v1-family | My family | Familie, Haustiere, Aussehen
family | die Familie
parents | die Eltern
mother / mum | die Mutter / Mama
father / dad | der Vater / Papa
brother / sister | der Bruder / die Schwester
grandparents | die Großeltern
grandma / grandpa | Oma / Opa
uncle / aunt | der Onkel / die Tante
cousin | der Cousin / die Cousine
son / daughter | der Sohn / die Tochter
only child | das Einzelkind
pet | das Haustier
dog / cat | der Hund / die Katze
rabbit | das Kaninchen
budgie | der Wellensittich
tall | groß
short | klein
hair | die Haare
eyes | die Augen
glasses | die Brille
funny | lustig
friendly | freundlich
shy | schüchtern
clever | klug
cool | cool
young / old | jung / alt

# v1-hobbies | Free time | Hobbys und Sport
free time | die Freizeit
hobby | das Hobby
to play football | Fußball spielen
to play the guitar | Gitarre spielen
to go swimming | schwimmen gehen
to ride a bike | Fahrrad fahren
to dance | tanzen
to sing | singen
to read | lesen
to watch TV | fernsehen
to listen to music | Musik hören
to meet friends | Freunde treffen
to go shopping | einkaufen gehen
match | das Spiel
team | die Mannschaft
club | der Verein
swimming pool | das Schwimmbad
park | der Park
film / movie | der Film
song | das Lied
to draw | zeichnen
to collect | sammeln
often | oft
sometimes | manchmal
never | nie
always | immer
at the weekend | am Wochenende

# v1-home | My home | Haus und Zimmer
house | das Haus
flat | die Wohnung
room | das Zimmer
bedroom | das Schlafzimmer
kitchen | die Küche
living room | das Wohnzimmer
bathroom | das Badezimmer
garden | der Garten
stairs | die Treppe
upstairs / downstairs | oben / unten
door | die Tür
window | das Fenster
bed | das Bett
table | der Tisch
chair | der Stuhl
wardrobe | der Kleiderschrank
shelf | das Regal
sofa | das Sofa
lamp | die Lampe
wall | die Wand
floor | der Fußboden
in / on / under | in / auf / unter
next to | neben
behind / in front of | hinter / vor
between | zwischen
there is / there are | es gibt
tidy / messy | ordentlich / unordentlich

# v1-food | Food and drink | Essen, Trinken, Einkaufen
breakfast | das Frühstück
lunch | das Mittagessen
dinner | das Abendessen
to eat | essen
to drink | trinken
hungry | hungrig
thirsty | durstig
bread | das Brot
butter | die Butter
cheese | der Käse
egg | das Ei
meat | das Fleisch
chicken | das Hähnchen
fish | der Fisch
chips | die Pommes
crisps | die Chips
vegetables | das Gemüse
fruit | das Obst
apple | der Apfel
banana | die Banane
milk | die Milch
water | das Wasser
orange juice | der Orangensaft
sandwich | das belegte Brot
How much is it? | Wie viel kostet das?
I'd like … | ich hätte gern …
a bottle of | eine Flasche
delicious | lecker

# v2-town | In town | Stadt, Wege, Einkaufen
town / city | die Stadt / die Großstadt
village | das Dorf
street | die Straße
square | der Platz
shop | das Geschäft
supermarket | der Supermarkt
market | der Markt
museum | das Museum
church | die Kirche
station | der Bahnhof
bus stop | die Bushaltestelle
the underground | die U-Bahn (London)
traffic lights | die Ampel
corner | die Ecke
to turn left / right | links / rechts abbiegen
to go straight on | geradeaus gehen
to cross | überqueren
near / far from | in der Nähe / weit weg von
opposite | gegenüber
How do I get to …? | Wie komme ich zu …?
shopping centre | das Einkaufszentrum
customer | der Kunde / die Kundin
shop assistant | der Verkäufer / die Verkäuferin
price | der Preis
cheap / expensive | billig / teuer
to pay | bezahlen
change | das Wechselgeld

# v2-holidays | Holidays and weather | Ferien, Reisen, Wetter
holidays | die Ferien
trip | der Ausflug, die Reise
to travel | reisen
abroad | im Ausland
beach | der Strand
sea | das Meer
mountains | das Gebirge
countryside | das Land (ländliche Gegend)
hotel | das Hotel
youth hostel | die Jugendherberge
campsite | der Campingplatz
suitcase | der Koffer
passport | der Reisepass
plane | das Flugzeug
airport | der Flughafen
ticket | die Fahrkarte
sights | die Sehenswürdigkeiten
souvenir | das Andenken
weather | das Wetter
sunny | sonnig
rainy | regnerisch
cloudy | bewölkt
windy | windig
foggy | neblig
temperature | die Temperatur
spring, summer | Frühling, Sommer
autumn, winter | Herbst, Winter

# v2-britain | Great Britain | London und das Vereinigte Königreich
the United Kingdom (UK) | das Vereinigte Königreich
Great Britain | Großbritannien
England, Scotland, Wales | England, Schottland, Wales
Northern Ireland | Nordirland
capital | die Hauptstadt
the Thames | die Themse
Buckingham Palace | der Buckingham-Palast
the Houses of Parliament | das Parlamentsgebäude
Big Ben | Big Ben
the Tower of London | der Tower von London
the London Eye | das London Eye
double-decker bus | der Doppeldeckerbus
the King / the Queen | der König / die Königin
royal family | die Königsfamilie
pound (£) | das Pfund
penny / pence | der Penny / die Pence
to drive on the left | links fahren
pub | die Kneipe
fish and chips | Fisch mit Pommes
tea time | die Teezeit
island | die Insel
coast | die Küste
population | die Bevölkerung
tourist | der Tourist / die Touristin
famous | berühmt
historic | historisch, geschichtsträchtig
tradition | die Tradition

# v2-media | Media | Handy, Internet, soziale Medien
mobile phone | das Handy
smartphone | das Smartphone
laptop | der Laptop
screen | der Bildschirm
the internet | das Internet
website | die Webseite
app | die App
social media | die sozialen Medien
to post | posten
to share | teilen
to download | herunterladen
to upload | hochladen
to text sb. | jemandem eine Nachricht schreiben
message | die Nachricht
password | das Passwort
follower | der Follower
influencer | der Influencer / die Influencerin
online / offline | online / offline
to be addicted to | süchtig sein nach
cyberbullying | das Cybermobbing
privacy | die Privatsphäre
fake news | die Falschmeldungen
advantage | der Vorteil
disadvantage | der Nachteil
advertising | die Werbung
video game | das Videospiel

# v2-feelings | Friends and feelings | Freundschaft und Gefühle
friendship | die Freundschaft
best friend | der beste Freund / die beste Freundin
boyfriend / girlfriend | der feste Freund / die feste Freundin
to fall in love with | sich verlieben in
to trust | vertrauen
to help | helfen
to argue | streiten
to make up | sich versöhnen
to apologize | sich entschuldigen
to miss sb. | jemanden vermissen
happy | glücklich
sad | traurig
angry | wütend
nervous | nervös
worried | besorgt
jealous | eifersüchtig
lonely | einsam
proud | stolz
embarrassed | verlegen, peinlich berührt
scared | ängstlich
excited | aufgeregt (vor Freude)
honest | ehrlich
loyal | treu
secret | das Geheimnis
to laugh | lachen
to cry | weinen

# v2-usa | The USA | Staaten, Städte, Geschichte
the United States (USA) | die Vereinigten Staaten
state | der Bundesstaat
New York City | New York
the Statue of Liberty | die Freiheitsstatue
skyscraper | der Wolkenkratzer
Washington, D.C. | Washington, D.C.
the White House | das Weiße Haus
the President | der Präsident / die Präsidentin
the Native Americans | die amerikanischen Ureinwohner
reservation | das Reservat
settler | der Siedler / die Siedlerin
the Wild West | der Wilde Westen
the Grand Canyon | der Grand Canyon
national park | der Nationalpark
coast to coast | von Küste zu Küste
the Civil War | der Amerikanische Bürgerkrieg
slavery | die Sklaverei
the civil rights movement | die Bürgerrechtsbewegung
immigrant | der Einwanderer / die Einwanderin
melting pot | der Schmelztiegel
the American flag | die amerikanische Flagge
Independence Day | der Unabhängigkeitstag (4. Juli)
road trip | die Autoreise
highway | die Fernstraße
dollar | der Dollar
neighbourhood | die Nachbarschaft, das Viertel

# v3-environment | The environment | Umwelt und Klima
environment | die Umwelt
climate change | der Klimawandel
global warming | die Erderwärmung
greenhouse effect | der Treibhauseffekt
pollution | die Verschmutzung
to pollute | verschmutzen
waste / rubbish | der Müll
to recycle | recyceln
plastic | das Plastik
drought | die Dürre
flood | die Überschwemmung
wildfire | der Waldbrand
renewable energy | die erneuerbare Energie
solar power | die Solarenergie
wind turbine | das Windrad
fossil fuels | die fossilen Brennstoffe
carbon footprint | der CO2-Fußabdruck
to save energy | Energie sparen
sustainable | nachhaltig
to protect | schützen
endangered species | die bedrohte Art
consumption | der Verbrauch
to waste | verschwenden
protest | der Protest
to take action | handeln
in the long run | langfristig
planet | der Planet

# v3-jobs | Jobs and the future | Beruf, Bewerbung, Zukunft
job | der Job, die Stelle
career | die Karriere, der Werdegang
work experience | das Praktikum
apprenticeship | die Ausbildung (Lehre)
university | die Universität
degree | der Studienabschluss
to apply for | sich bewerben um
application | die Bewerbung
CV | der Lebenslauf
cover letter | das Anschreiben
job interview | das Vorstellungsgespräch
skills | die Fähigkeiten
experience | die Erfahrung
salary | das Gehalt
employer | der Arbeitgeber
employee | der Arbeitnehmer
full-time / part-time | Vollzeit / Teilzeit
unemployed | arbeitslos
to earn money | Geld verdienen
gap year | das Auszeitjahr
doctor | der Arzt / die Ärztin
nurse | der Krankenpfleger / die Krankenpflegerin
engineer | der Ingenieur / die Ingenieurin
lawyer | der Anwalt / die Anwältin
plumber | der Installateur / die Installateurin
to succeed | Erfolg haben

# v3-health | Body and health | Körper, Krankheit, Lebensstil
body | der Körper
head | der Kopf
face | das Gesicht
arm / hand | der Arm / die Hand
leg / foot | das Bein / der Fuß
back | der Rücken
stomach | der Magen, der Bauch
headache | die Kopfschmerzen
to have a cold | erkältet sein
cough | der Husten
temperature (fever) | das Fieber
ill / sick | krank
to hurt | wehtun
to break your arm | sich den Arm brechen
appointment | der Termin
medicine | die Medizin
healthy | gesund
diet | die Ernährung; die Diät
junk food | das ungesunde Essen
to keep fit | sich fit halten
exercise | die Bewegung, das Training
sleep | der Schlaf
stress | der Stress
mental health | die psychische Gesundheit
to feel better | sich besser fühlen
Get well soon! | Gute Besserung!

# v3-growingup | Growing up | Jugend, Familie, Probleme
teenager | der/die Jugendliche
adolescence | die Jugendzeit, die Pubertät
to grow up | aufwachsen, erwachsen werden
adult | der/die Erwachsene
independence | die Unabhängigkeit
to be allowed to | dürfen
to forbid | verbieten
rule | die Regel
pocket money | das Taschengeld
peer pressure | der Gruppenzwang
bullying | das Mobbing
self-confidence | das Selbstvertrauen
body image | das Körperbild
role model | das Vorbild
responsibility | die Verantwortung
to rebel | rebellieren
generation gap | der Generationenkonflikt
to get on well with | sich gut verstehen mit
curfew | die Ausgangssperre (feste Heimkehrzeit)
to volunteer | sich ehrenamtlich engagieren
party | die Party
alcohol | der Alkohol
drugs | die Drogen
dream | der Traum
goal | das Ziel
values | die Werte

# v3-commonwealth | The English-speaking world | Commonwealth, Australien, Indien
the Commonwealth | das Commonwealth
the British Empire | das Britische Weltreich
colony | die Kolonie
independence (of a country) | die Unabhängigkeit (eines Landes)
Australia | Australien
the Outback | das Outback
the Aborigines | die Aborigines
the Stolen Generations | die gestohlenen Generationen
New Zealand | Neuseeland
the Maori | die Māori
India | Indien
Bollywood | Bollywood
the caste system | das Kastensystem
Canada | Kanada
Ireland | Irland
the Republic of Ireland | die Republik Irland
South Africa | Südafrika
apartheid | die Apartheid
official language | die Amtssprache
mother tongue | die Muttersprache
accent | der Akzent
lingua franca | die Verkehrssprache
multicultural | multikulturell
heritage | das Erbe
native | einheimisch
to settle | sich niederlassen, besiedeln

# v3-technology | Technology | Technik, Fortschritt, KI
technology | die Technologie
invention | die Erfindung
to invent | erfinden
progress | der Fortschritt
device | das Gerät
artificial intelligence | die künstliche Intelligenz
robot | der Roboter
algorithm | der Algorithmus
data | die Daten
data protection | der Datenschutz
surveillance | die Überwachung
to hack | hacken
virus | das Virus
cloud | die Cloud
virtual reality | die virtuelle Realität
self-driving car | das selbstfahrende Auto
smart home | das vernetzte Zuhause
screen time | die Bildschirmzeit
digital detox | die digitale Auszeit
to replace | ersetzen
risk | das Risiko
benefit | der Nutzen
threat | die Bedrohung
reliable | zuverlässig
to depend on | abhängen von
innovation | die Innovation

# v4-identity | Individual and society | Identität, Zugehörigkeit, Gesellschaft
identity | die Identität
to belong to | gehören zu
sense of belonging | das Zugehörigkeitsgefühl
individual | der Einzelne; individuell
society | die Gesellschaft
community | die Gemeinschaft
diversity | die Vielfalt
minority | die Minderheit
majority | die Mehrheit
gender | das (soziale) Geschlecht
equality | die Gleichheit, Gleichberechtigung
discrimination | die Diskriminierung
racism | der Rassismus
prejudice | das Vorurteil
stereotype | das Stereotyp
tolerance | die Toleranz
to fit in | dazugehören, sich einfügen
outsider | der Außenseiter / die Außenseiterin
peer group | die Gruppe Gleichaltriger
self-image | das Selbstbild
to conform | sich anpassen
expectations | die Erwartungen
to break free | sich befreien
coming of age | das Erwachsenwerden
roots | die Wurzeln
migration background | der Migrationshintergrund

# v4-analysis | Analysing texts | Redemittel für Textanalyse
extract | der Auszug
article | der Artikel
novel | der Roman
short story | die Kurzgeschichte
poem | das Gedicht
author | der Autor / die Autorin
narrator | der Erzähler / die Erzählerin
first-person narrator | der Ich-Erzähler
omniscient narrator | der allwissende Erzähler
point of view | die Erzählperspektive
protagonist | die Hauptfigur
character | die Figur
setting | der Schauplatz
plot | die Handlung
climax | der Höhepunkt
open ending | das offene Ende
the text deals with … | der Text handelt von …
to summarize | zusammenfassen
to analyse | analysieren
to characterize | charakterisieren
stylistic device | das Stilmittel
metaphor | die Metapher
simile | der Vergleich (mit like/as)
rhetorical question | die rhetorische Frage
irony | die Ironie
alliteration | die Alliteration
target audience | die Zielgruppe
tone | der Ton, die Stimmung
to emphasize | hervorheben

# v4-americandream | The American Dream | Ideale, Wirklichkeit, Politik
the American Dream | der amerikanische Traum
the land of opportunity | das Land der unbegrenzten Möglichkeiten
freedom | die Freiheit
pursuit of happiness | das Streben nach Glück
from rags to riches | vom Tellerwäscher zum Millionär
self-made man / woman | jemand, der es aus eigener Kraft geschafft hat
upward mobility | der soziale Aufstieg
hard work | die harte Arbeit
the Constitution | die Verfassung
the Declaration of Independence | die Unabhängigkeitserklärung
the Founding Fathers | die Gründerväter
democracy | die Demokratie
Congress | der Kongress
the Supreme Court | der Oberste Gerichtshof
Democrats / Republicans | Demokraten / Republikaner
election | die Wahl
to vote | wählen (abstimmen)
patriotism | der Patriotismus
the gap between rich and poor | die Kluft zwischen Arm und Reich
poverty | die Armut
homelessness | die Obdachlosigkeit
gun control | die Waffenkontrolle
the Second Amendment | der Zweite Verfassungszusatz
the frontier | die Grenze (zur Wildnis), die Frontier
manifest destiny | die „offenkundige Bestimmung“
illusion | die Illusion
disillusionment | die Ernüchterung

# v4-nigeria | Postcolonialism: Nigeria | Kolonialismus, Unabhängigkeit, Gegenwart
Nigeria | Nigeria
Lagos | Lagos
colonialism | der Kolonialismus
postcolonial | postkolonial
colonizer | der Kolonisator
the colonized | die Kolonisierten
to gain independence | unabhängig werden
ethnic group | die ethnische Gruppe
the Igbo, the Yoruba, the Hausa | die Igbo, Yoruba, Hausa
civil war | der Bürgerkrieg
Biafra | Biafra
oil | das Erdöl
corruption | die Korruption
exploitation | die Ausbeutung
natural resources | die Bodenschätze
megacity | die Megastadt
slum | das Elendsviertel
the middle class | die Mittelschicht
emigration | die Auswanderung
brain drain | die Abwanderung von Fachkräften
Nollywood | Nollywood
Afrobeats | Afrobeats
pidgin English | das Pidgin-Englisch
the single story | die einseitige Geschichte (Adichie)
to stereotype | in Klischees denken
to empower | stärken, befähigen

# v4-globalisation | Globalisation | Welthandel, Konsum, Folgen
globalisation | die Globalisierung
global village | das globale Dorf
trade | der Handel
free trade | der Freihandel
multinational company | der multinationale Konzern
to outsource | auslagern
cheap labour | die billigen Arbeitskräfte
sweatshop | der Ausbeuterbetrieb
working conditions | die Arbeitsbedingungen
fair trade | der faire Handel
consumer | der Verbraucher / die Verbraucherin
consumer society | die Konsumgesellschaft
fast fashion | die Fast Fashion
brand | die Marke
supply chain | die Lieferkette
developing country | das Entwicklungsland
industrialized country | das Industrieland
economic growth | das Wirtschaftswachstum
inequality | die Ungleichheit
profit | der Gewinn
competition | der Wettbewerb
to benefit from | profitieren von
cultural exchange | der kulturelle Austausch
Americanization | die Amerikanisierung
interconnected | vernetzt

# v4-ukpolitics | The UK today | Monarchie, Brexit, Nationen
monarchy | die Monarchie
the Crown | die Krone
constitutional monarchy | die konstitutionelle Monarchie
Parliament | das Parlament
the House of Commons | das Unterhaus
the House of Lords | das Oberhaus
the Prime Minister | der Premierminister / die Premierministerin
the Conservatives / Labour | die Konservativen / Labour
general election | die Parlamentswahl
referendum | die Volksabstimmung
Brexit | der Brexit
to leave the EU | aus der EU austreten
Leave / Remain | Austritt / Verbleib
sovereignty | die Souveränität
the Scottish independence movement | die schottische Unabhängigkeitsbewegung
devolution | die Übertragung von Befugnissen an die Regionen
the Good Friday Agreement | das Karfreitagsabkommen
the Troubles | der Nordirlandkonflikt
multicultural Britain | das multikulturelle Großbritannien
the class system | das Klassensystem
public school | die Privatschule (GB)
the NHS | der staatliche Gesundheitsdienst
heritage (national) | das nationale Erbe
special relationship | die besondere Beziehung (GB–USA)
Commonwealth citizen | Bürger/in des Commonwealth

# v4-science | Science and ethics | Genetik, KI, Verantwortung
science | die Wissenschaft
scientist | der Wissenschaftler / die Wissenschaftlerin
research | die Forschung
experiment | das Experiment
ethics | die Ethik
ethical | ethisch
genetic engineering | die Gentechnik
gene | das Gen
DNA | die DNA
cloning | das Klonen
designer baby | das Designerbaby
dystopia | die Dystopie
utopia | die Utopie
to manipulate | manipulieren
human dignity | die Menschenwürde
consequence | die Folge
to play God | Gott spielen
responsibility for | die Verantwortung für
artificial life | das künstliche Leben
transhumanism | der Transhumanismus
to enhance | verbessern, steigern
the fear of | die Angst vor
progress vs. danger | Fortschritt gegen Gefahr
to regulate | regulieren
moral dilemma | das moralische Dilemma
science fiction | die Science-Fiction

# v4-argument | Giving your opinion | Kommentar, Diskussion, Redemittel
in my opinion | meiner Meinung nach
I believe that | ich glaube, dass
from my point of view | aus meiner Sicht
to agree / to disagree | zustimmen / widersprechen
I see your point, but | ich verstehe, was du meinst, aber
on the one hand … on the other hand | einerseits … andererseits
to be in favour of | dafür sein
to be against | dagegen sein
argument | das Argument
pros and cons | das Für und Wider
firstly | erstens
furthermore | außerdem
moreover | darüber hinaus
however | jedoch
nevertheless | dennoch
although | obwohl
despite | trotz
whereas | während, wohingegen
therefore | deshalb
as a result | infolgedessen
for example | zum Beispiel
it is obvious that | es ist offensichtlich, dass
to sum up | zusammenfassend
all in all | alles in allem
in conclusion | abschließend
to convince | überzeugen

# g1-be | to be und have got | I am, she has got
> **to be** (sein): I **am** · you **are** · he/she/it **is** · we/you/they **are**
> Kurzformen: I'm, you're, he's, we're, they're · verneint: I'm not, he isn't, they aren't
> Frage: **Are** you twelve? – Yes, I am. / No, I'm not.
> **have got** (haben, besitzen): I/you/we/they **have got** · he/she/it **has got**
> Kurzformen: I've got, she's got · verneint: I haven't got, she hasn't got · Frage: **Have** you **got** a pet?
? I {{c1::am}} eleven years old.
? My sister {{c1::is}} very funny.
? We {{c1::are}} from Germany.
? {{c1::Are}} you in my class? – Yes, I am.
? Tom {{c1::isn't}} at school today. (nicht)
? I {{c1::have got}} two brothers.
? She {{c1::has got}} a cat.
? {{c1::Have}} you got a pet? – No, I haven't.
? My parents {{c1::aren't}} at home. (nicht)
? He {{c1::hasn't got}} a smartphone. (nicht)

# g1-simple-present | Simple present | I play – he plays
> Für Gewohnheiten, Regelmäßiges und Tatsachen: every day, often, always, never.
> he / she / it: **-s** anhängen: I play → she play**s** · nach -s, -sh, -ch, -x, -o: **-es** (watches, goes) · Konsonant + y → **-ies** (study → studies)
> Verneinung mit **don't / doesn't** + Grundform: I **don't** like fish. He **doesn't** play tennis.
> Frage mit **do / does**: **Do** you like pizza? **Does** she live here?
> Bei doesn't und does fällt das -s am Verb weg!
? I {{c1::play}} football every Saturday. (play)
? My brother {{c1::watches}} TV every evening. (watch)
? She {{c1::goes}} to school by bus. (go)
? We {{c1::don't}} like spinach.
? He {{c1::doesn't}} live in London.
? {{c1::Do}} you speak English?
? {{c1::Does}} your sister play the piano?
? Tom {{c1::studies}} a lot for his tests. (study)
? My parents {{c1::work}} in an office. (work)
? It {{c1::rains}} a lot in Wales. (rain)

# g1-plural-a-an | Plural, a / an und some / any | books, a apple?
> **a** vor Konsonantenlaut, **an** vor Vokallaut: a book, an apple, **an** hour (h stumm), **a** university (j-Laut)
> Plural meist **-s**: book → books · nach -s, -sh, -ch, -x: **-es** (boxes) · Konsonant + y → **-ies** (city → cities)
> Unregelmäßig: man → men · woman → women · child → children · foot → feet · tooth → teeth · mouse → mice · person → people
> **some** in bejahten Sätzen und Angeboten, **any** in Fragen und Verneinungen: I've got some apples. Have you got any milk? There isn't any bread.
? I've got {{c1::an}} orange.
? She's got {{c1::a}} uncle in America.
? There are three {{c1::children}} in the garden. (child)
? I need two new {{c1::boxes}}. (box)
? London and Paris are big {{c1::cities}}. (city)
? Have you got {{c1::any}} brothers?
? We need {{c1::some}} eggs for the cake.
? There aren't {{c1::any}} chairs in the room.
? Many {{c1::people}} visit London every year. (person)
? It takes {{c1::an}} hour.

# g2-present-progressive | Present progressive | I'm reading right now
> Was **gerade jetzt** passiert: am/is/are + Verb mit **-ing**.
> I **am reading**. She **is playing**. They **are sleeping**.
> Schreibung: make → mak**ing** · swim → swi**mm**ing · lie → l**y**ing
> Signalwörter: now, right now, at the moment, look!, listen!
> Verben wie like, love, know, want, need stehen fast nie in der -ing-Form.
? Look! The baby {{c1::is sleeping}}. (sleep)
? I {{c1::am doing}} my homework at the moment. (do)
? What {{c1::are}} you {{c2::doing}}? (do)
? Listen! Somebody {{c1::is singing}}. (sing)
? We {{c1::are swimming}} in the lake right now. (swim)
? She {{c1::isn't watching}} TV, she's reading. (watch – nicht)
? They {{c1::are making}} a cake. (make)
? Every day I walk to school, but today I {{c1::am taking}} the bus. (take)
? I {{c1::like}} chocolate. (like – kein -ing)

# g2-simple-past | Simple past | I played, I went
> Für abgeschlossene Handlungen in der Vergangenheit: yesterday, last week, two years ago, in 2010.
> Regelmäßig: **-ed** – play → played · stop → stopped · study → studied
> Unregelmäßig (lernen!): go → **went** · see → **saw** · have → **had** · buy → **bought** · eat → **ate** · get → **got** · come → **came** · take → **took** · make → **made** · write → **wrote**
> **to be**: I/he/she/it **was**, you/we/they **were**
> Verneinung und Frage mit **did** + Grundform: I **didn't go**. **Did** you **see** it?
? Yesterday I {{c1::played}} tennis with Tom. (play)
? Last summer we {{c1::went}} to Scotland. (go)
? She {{c1::bought}} a new jacket. (buy)
? I {{c1::was}} very tired yesterday. (be)
? They {{c1::were}} at the cinema. (be)
? {{c1::Did}} you {{c2::see}} the match?
? He {{c1::didn't}} do his homework.
? We {{c1::ate}} fish and chips in Brighton. (eat)
? The bus {{c1::stopped}} in front of the school. (stop)
? Two years ago my family {{c1::moved}} to Soest. (move)

# g2-possessive | Possessivbegleiter und Genitiv | my, your, Tom's
> my · your · his · her · its · our · your · their
> **his** = sein (Mann), **her** = ihr (Frau), **its** = sein/ihr (Ding, Tier) – ohne Apostroph!
> Genitiv mit **'s**: Tom**'s** bike · my sister**'s** room
> Plural auf -s: nur Apostroph: my parents**'** car · unregelmäßiger Plural: the children**'s** toys
> Possessivpronomen (allein stehend): mine, yours, his, hers, ours, theirs – This book is **mine**.
? This is {{c1::my}} brother. (ich)
? Anna and {{c1::her}} mum live in York. (Anna)
? Peter likes {{c1::his}} new school. (Peter)
? The dog is eating {{c1::its}} food.
? We love {{c1::our}} teacher.
? This is {{c1::Tom's}} bike. (Tom)
? My {{c1::parents'}} car is red. (parents)
? The {{c1::children's}} room is upstairs. (children)
? Is this your pen? – No, it isn't {{c1::mine}}.
? They visit {{c1::their}} grandparents every Sunday.

# g3-future | will und going to | I'll help – I'm going to visit
> **going to**: Pläne und Absichten, und Vorhersagen mit sichtbarem Grund: I'm **going to** visit my aunt. Look at the clouds – it's **going to** rain.
> **will**: Vermutungen, spontane Entscheidungen, Versprechen: I think it **will** be sunny. I'**ll** help you!
> Verneinung: **won't** (= will not)
> **present progressive** für feste Verabredungen: I'm meeting Sam at five.
? Look at the sky! It {{c1::is going to}} rain.
? I {{c1::am going to}} visit my grandma next weekend. (Plan)
? I think Germany {{c1::will}} win the match.
? The phone is ringing. – I{{c1::'ll}} answer it! (spontan)
? Don't worry, I {{c1::won't}} tell anybody. (nicht)
? What {{c1::are}} you going to do after school?
? In 2050, people {{c1::will}} live on Mars, maybe.
? We {{c1::are going to}} buy a new car. (Plan)
? I {{c1::am meeting}} Sam at five tomorrow. (meet – feste Verabredung)

# g3-comparison | Steigerung | bigger, more interesting, the best
> Kurze Adjektive: **-er / -est**: small → small**er** → the small**est** · big → bi**gg**er · happy → happ**ier**
> Lange Adjektive: **more / most**: interesting → **more** interesting → the **most** interesting
> Unregelmäßig: good → **better** → the **best** · bad → **worse** → the **worst** · far → further → furthest
> Vergleich: **than** (als) – London is bigger **than** Leeds. · **as … as** (genauso … wie) – Tom is **as** tall **as** Ben.
? An elephant is {{c1::bigger}} than a dog. (big)
? This book is {{c1::more interesting}} than the film. (interesting)
? Ben Nevis is the {{c1::highest}} mountain in Britain. (high)
? My brother is {{c1::older}} {{c2::than}} me. (old)
? Today is the {{c1::best}} day of my life! (good)
? The weather is {{c1::worse}} than yesterday. (bad)
? She is {{c1::happier}} now. (happy)
? Maths is not {{c1::as}} difficult {{c2::as}} physics.
? It's the {{c1::most expensive}} shop in town. (expensive)

# g3-adverbs | Adjektiv oder Adverb? | quick – quickly
> **Adjektiv** beschreibt ein Nomen (wie ist etwas?): a **careful** driver
> **Adverb** beschreibt ein Verb (wie tut man etwas?): He drives **carefully**.
> Bildung: Adjektiv + **-ly**: slow → slowly · easy → eas**ily** · terrible → terrib**ly**
> Unregelmäßig: good → **well** · fast → fast · hard → hard · late → late
> Nach Verben wie be, look, feel, sound, taste steht das **Adjektiv**: You look **tired**. It tastes **good**.
? She sings very {{c1::beautifully}}. (beautiful)
? He is a {{c1::careful}} driver. (careful)
? Please speak {{c1::slowly}}. (slow)
? You play football really {{c1::well}}. (good)
? The test was {{c1::easy}}. (easy)
? I did the test {{c1::easily}}. (easy)
? He works very {{c1::hard}}. (hard)
? This soup tastes {{c1::delicious}}. (delicious)
? She ran {{c1::fast}} to catch the bus. (fast)

# g4-present-perfect | Present perfect | I have been, she has seen
> Für Vergangenes mit Bezug zur Gegenwart – wann genau, ist egal oder nicht vorbei.
> **have / has** + 3. Form (Partizip): I **have seen** · she **has finished**
> Signalwörter: ever, never, already, yet, just, so far, since, for
> **since** = seit Zeitpunkt (since 2020), **for** = seit Zeitraum (for three years)
> Mit genauer Zeitangabe in der Vergangenheit (yesterday, in 2019) → simple past!
> Wichtige 3. Formen: been, seen, done, gone, written, eaten, taken, bought, known, met
? I {{c1::have}} never {{c2::been}} to the USA. (be)
? She {{c1::has}} just {{c2::finished}} her homework. (finish)
? {{c1::Have}} you ever eaten sushi?
? We have lived here {{c1::since}} 2019.
? He has played the guitar {{c1::for}} five years.
? They {{c1::haven't}} arrived yet. (nicht)
? I {{c1::have lost}} my keys! (lose)
? Yesterday I {{c1::lost}} my keys. (lose – yesterday!)
? How long {{c1::have}} you known her?
? My parents {{c1::have bought}} a new house. (buy)

# g4-if1 | if-Sätze Typ 1 | If it rains, we'll stay home
> Was **wahrscheinlich** passiert, wenn eine Bedingung erfüllt ist.
> **if** + simple present, → **will** + Grundform: If it **rains**, we **will stay** at home.
> Im if-Satz steht **nie will**!
> Auch möglich: Imperativ oder can/must: If you **see** Tom, **tell** him to call me.
? If it {{c1::rains}}, we will stay at home. (rain)
? If you study hard, you {{c1::will pass}} the test. (pass)
? If I {{c1::miss}} the bus, I'll be late. (miss)
? We {{c1::will go}} to the beach if the weather is nice. (go)
? If she {{c1::doesn't}} hurry, she'll miss the train.
? If you see Anna, {{c1::tell}} her to call me. (tell – Imperativ)
? What will you do if you {{c1::don't}} get the job?
? If they {{c1::win}} this match, they'll be champions. (win)
? I {{c1::won't}} come if you don't invite Tom.

# g4-modals | Modalverben und Ersatzformen | can, must, have to
> **can** (können) – Vergangenheit **could**, Zukunft **will be able to**
> **must** (müssen) – Ersatz **have to / had to / will have to**
> **mustn't** = nicht dürfen! · **needn't / don't have to** = nicht müssen
> **may** / **be allowed to** (dürfen) · **should** (sollte)
> You **mustn't** smoke here. (verboten) · You **don't have to** come. (nicht nötig)
? I {{c1::can}} swim very well.
? When I was five, I {{c1::could}} already read.
? You {{c1::mustn't}} use your phone in the exam. (verboten)
? You {{c1::don't have to}} wear a uniform at our school. (nicht nötig)
? Yesterday I {{c1::had to}} get up at six. (musste)
? You {{c1::should}} see a doctor.
? Next year I {{c1::will be able to}} drive. (können – Zukunft)
? We {{c1::were allowed to}} stay up late. (durften)
? {{c1::May}} I open the window?

# g5-past-progressive | Past progressive | I was reading when …
> Was in der Vergangenheit **gerade im Gange war**: was/were + -ing.
> At eight o'clock I **was having** dinner.
> Mit simple past: Eine laufende Handlung wird unterbrochen: I **was watching** TV when the phone **rang**.
> **while** + past progressive: **While** she **was cooking**, he **was reading**.
? I {{c1::was reading}} when the lights went out. (read)
? They {{c1::were playing}} football when it started to rain. (play)
? While Tom {{c1::was cooking}}, his sister was doing her homework. (cook)
? What {{c1::were}} you doing at eight last night?
? She was sleeping when the alarm {{c1::rang}}. (ring)
? It {{c1::was snowing}} when we left the house. (snow)
? We {{c1::weren't listening}} to the teacher. (listen – nicht)
? He {{c1::fell}} while he was running. (fall)
? At 6 pm I {{c1::was sitting}} on the bus. (sit)

# g5-passive | Passiv | It was built in 1890
> Wenn die Handlung wichtiger ist als der Handelnde: **be** + 3. Form (+ **by** …).
> Simple present: English **is spoken** all over the world.
> Simple past: The bridge **was built** in 1894.
> Present perfect: The tickets **have been sold**.
> will: The results **will be published** tomorrow.
> Mit Modalverb: The rubbish **must be recycled**.
? English {{c1::is spoken}} in many countries. (speak)
? Tower Bridge {{c1::was built}} in 1894. (build)
? The book {{c1::was written}} by J. K. Rowling. (write)
? The new school {{c1::will be opened}} next year. (open)
? All tickets {{c1::have been sold}}. (sell)
? Millions of cars {{c1::are made}} in Germany every year. (make)
? Plastic bottles {{c1::must be recycled}}. (recycle – müssen)
? The thief {{c1::was caught}} by the police. (catch)
? Where {{c1::was}} your phone made?

# g5-relative | Relativsätze | who, which, that, whose
> **who** für Personen, **which** für Dinge und Tiere, **that** für beides (in notwendigen Relativsätzen).
> **whose** = dessen/deren: The girl **whose** dad is a pilot …
> **where** für Orte: the town **where** I live
> Ist das Relativpronomen Objekt, kann man es weglassen (contact clause): The film (that) I saw was great.
> Nicht notwendige Relativsätze stehen zwischen Kommas, ohne that: My sister, **who** lives in Leeds, is a nurse.
? The girl {{c1::who}} sits next to me is from Ireland.
? This is the book {{c1::which}} I told you about.
? That's the man {{c1::whose}} car was stolen.
? Soest is the town {{c1::where}} I was born.
? The film {{c1::that}} we watched yesterday was boring.
? My uncle, {{c1::who}} lives in Canada, is visiting us.
? Do you know the boy {{c1::whose}} sister is a singer?
? The cake {{c1::which}} you made was delicious.
? London, {{c1::which}} is the capital, has nine million people.

# g6-if2-if3 | if-Sätze Typ 2 und 3 | If I were rich … If I had known …
> ## Typ 2 – unwahrscheinlich oder unwirklich (Gegenwart)
> **if** + simple past, → **would** + Grundform: If I **had** more money, I **would travel** more.
> Bei be oft **were** für alle Personen: If I **were** you, I would apologize.
> ## Typ 3 – unwirklich in der Vergangenheit
> **if** + past perfect, → **would have** + 3. Form: If I **had studied**, I **would have passed**.
> Nie would im if-Satz!
? If I {{c1::had}} a million dollars, I would buy an island. (have)
? If I {{c1::were}} you, I would talk to her. (be)
? If she lived in London, she {{c1::would visit}} museums every week. (visit)
? What would you do if you {{c1::won}} the lottery? (win)
? If I {{c1::had known}}, I would have helped you. (know)
? If we had left earlier, we {{c1::would have caught}} the train. (catch)
? If he {{c1::hadn't eaten}} so much, he wouldn't have felt sick. (eat – nicht)
? I {{c1::would}} go out if it weren't raining.
? She would have passed if she {{c1::had studied}} more. (study)

# g6-reported-speech | Indirekte Rede | She said that she was tired
> Mit Einleitung in der Vergangenheit (said, told, asked) rücken die Zeiten eine Stufe zurück (backshift):
> simple present → simple past · simple past / present perfect → past perfect · will → would · can → could
> „I **am** tired.“ → She said (that) she **was** tired.
> **say** ohne Person, **tell** mit Person: He **told me** that …
> Fragen: asked **if / whether** … · asked **where** … (normale Satzstellung!)
> Aufforderungen: told me **to** …
> now → then · today → that day · tomorrow → the next day · yesterday → the day before · here → there
? „I'm hungry.“ – Tom said that he {{c1::was}} hungry.
? „I will help you.“ – She said she {{c1::would}} help me.
? „I saw the film.“ – He said he {{c1::had seen}} the film.
? „Can you swim?“ – She asked me if I {{c1::could}} swim.
? „Where do you live?“ – He asked me where I {{c1::lived}}.
? „Close the door!“ – Mum told me {{c1::to close}} the door.
? „Are you coming?“ – She asked {{c1::if}} I was coming.
? He {{c1::told}} me that he was moving to Leeds. (say / tell)
? „I'll call you tomorrow.“ – She said she would call me {{c1::the next day}}.

# g6-gerund-infinitive | Gerund oder Infinitiv? | I enjoy reading – I want to read
> **Gerund (-ing)** nach: enjoy, finish, avoid, mind, keep, suggest, can't stand – und nach Präpositionen: interested **in** learning, good **at** dancing, before leaving
> **to-Infinitiv** nach: want, decide, hope, plan, promise, agree, refuse, would like
> Beides (gleiche Bedeutung): like, love, hate, start, begin
> Mit Bedeutungsunterschied: **stop** smoking (aufhören zu rauchen) – **stop to** smoke (anhalten, um zu rauchen) · **remember** doing (sich erinnern, etwas getan zu haben) – **remember to** do (daran denken, etwas zu tun)
? I enjoy {{c1::reading}} detective stories. (read)
? We decided {{c1::to go}} to Wales. (go)
? She is good at {{c1::playing}} the piano. (play)
? I want {{c1::to become}} a doctor. (become)
? Would you mind {{c1::opening}} the window? (open)
? He promised {{c1::to call}} me. (call)
? They finished {{c1::painting}} the house. (paint)
? Don't forget {{c1::to lock}} the door! (lock)
? He stopped {{c1::smoking}} last year. (smoke – aufgehört)
? Thank you for {{c1::helping}} me. (help)

# g7-past-perfect | Past perfect | I had already eaten
> Die Vorvergangenheit: was **vor** einem anderen Ereignis in der Vergangenheit geschah.
> **had** + 3. Form: When we arrived, the film **had** already **started**.
> Oft mit after, before, when, already, by the time.
> Past perfect progressive (had been + -ing) für eine Dauer davor: She **had been waiting** for an hour.
? When I got to the station, the train {{c1::had left}}. (leave)
? She {{c1::had}} never {{c2::seen}} the sea before. (see)
? After he {{c1::had finished}} his homework, he went out. (finish)
? We {{c1::had}} already {{c2::eaten}} when Dad came home. (eat)
? By the time the police arrived, the thief {{c1::had escaped}}. (escape)
? I {{c1::had been waiting}} for an hour when she finally called. (wait – Dauer)
? He was tired because he {{c1::hadn't slept}} well. (sleep – nicht)
? {{c1::Had}} you met him before the party?

# g7-participles | Partizipialkonstruktionen | Walking home, I met …
> Partizipien verkürzen Nebensätze – typisch für geschriebene Texte und das Abitur.
> **Present participle (-ing)**, gleichzeitig oder aktiv: **Walking** home, I met Tom. (= As I was walking home …)
> **Perfect participle (having + 3. Form)**, vorzeitig: **Having finished** the test, she left. (= After she had finished …)
> **Past participle (3. Form)**, passiv: **Written** in 1949, the novel is still popular. (= It was written …)
> Statt Relativsatz: The man **sitting** there is my uncle. (who is sitting) · a car **made** in Japan (that was made)
? {{c1::Walking}} through the park, I saw an old friend. (walk)
? {{c1::Having finished}} her homework, she went to bed. (finish – vorher)
? {{c1::Written}} in 1960, the book is still famous. (write – passiv)
? The girl {{c1::sitting}} next to me is new. (sit)
? Most cars {{c1::produced}} here are exported. (produce – passiv)
? {{c1::Feeling}} tired, he went home early. (feel)
? {{c1::Having lost}} his key, he couldn't get in. (lose – vorher)
? Students {{c1::wanting}} to join the trip must pay by Friday. (want)

# g7-future-forms | Weitere Zeitformen der Zukunft | will be doing, will have done
> **Future progressive** (will be + -ing): was zu einem Zeitpunkt in der Zukunft gerade läuft – This time tomorrow I **will be flying** to New York.
> **Future perfect** (will have + 3. Form): was bis zu einem Zeitpunkt abgeschlossen sein wird – By 2030, scientists **will have found** a cure.
> **Simple present** für Fahrpläne und feste Termine: The train **leaves** at 7.15.
> **be about to** = gleich tun: The film **is about to** start.
? This time next week I {{c1::will be lying}} on the beach. (lie)
? By the end of the year, I {{c1::will have saved}} 500 euros. (save)
? Hurry up! The train {{c1::leaves}} in five minutes. (leave – Fahrplan)
? Don't call at eight – we {{c1::will be having}} dinner. (have)
? By 2040, many jobs {{c1::will have disappeared}}. (disappear)
? Quick, the concert {{c1::is about to}} start! (gleich)
? Next summer my parents {{c1::will have been}} married for 25 years. (be)
? At midnight we {{c1::will be celebrating}}. (celebrate)

# g8-linking | Verknüpfen und Argumentieren | although, despite, whereas
> Die richtige Konjunktion macht einen Text logisch – wichtig für Kommentar und Analyse.
> **although / even though** + Satz · **despite / in spite of** + Nomen oder -ing: Although it rained, … / Despite the rain, …
> **because** + Satz · **because of** + Nomen
> **whereas / while** = während (Gegensatz) · **however** (jedoch) steht am Satzanfang mit Komma
> **therefore / as a result** (deshalb) · **in order to** + Infinitiv (um … zu)
> **unless** = wenn … nicht · **as long as** = solange
? {{c1::Although}} it was raining, we went for a walk.
? {{c1::Despite}} the rain, we went for a walk.
? She stayed at home {{c1::because of}} her cold.
? Tom loves football, {{c1::whereas}} his brother prefers tennis.
? The plan was good. {{c1::However}}, it failed.
? He saved money {{c1::in order to}} buy a car.
? You won't pass {{c1::unless}} you study. (wenn nicht)
? The factory closed. {{c1::As a result}}, many people lost their jobs.
? {{c1::In spite of}} being tired, she finished the essay.

# g8-emphasis | Betonung und Inversion | Never have I seen …
> Für Nachdruck – typisch in Reden, Kommentaren und Literatur.
> **Inversion** nach verneinenden Ausdrücken am Satzanfang: **Never have I** seen such a mess. **Not only did** he lie, he also stole. **Rarely does** she complain.
> **Cleft sentences**: **It was** Tom **who** broke the window. **What** I need **is** a break.
> **do / does / did** zur Betonung: I **do** like your idea! She **did** call, I promise.
? Never {{c1::have}} I seen such a beautiful sunset.
? Not only {{c1::did}} he forget my birthday, he also lost my present.
? {{c1::It}} was my sister who told me the truth.
? {{c1::What}} we need is more time.
? Rarely {{c1::does}} he make mistakes.
? I {{c1::do}} understand your problem! (Betonung)
? Hardly {{c1::had}} we arrived when it started to rain.
? Under no circumstances {{c1::should}} you open this door.
? {{c1::It}} is the government that has to act.

# g9-wish | Wünsche und Bedauern | I wish I had …, If only …
> **I wish / If only** + simple past: Wunsch für die Gegenwart – I **wish** I **had** more time. (habe ich aber nicht)
> **I wish / If only** + past perfect: Bedauern über die Vergangenheit – I **wish** I **had studied** harder.
> **I wish** + **would**: Ärger über das Verhalten anderer – I **wish** you **would** stop talking.
> **It's (high) time** + simple past: **It's time** we **left**.
> **I'd rather** + simple past (bei anderer Person): I'**d rather** you **stayed** here.
? I wish I {{c1::had}} a dog. (have – Gegenwart)
? I wish I {{c1::were}} taller. (be)
? If only I {{c1::had listened}} to my parents! (listen – Vergangenheit)
? I wish you {{c1::would}} stop complaining. (Ärger)
? She wishes she {{c1::hadn't said}} that. (say – nicht, Vergangenheit)
? It's high time we {{c1::did}} something about climate change. (do)
? I'd rather you {{c1::didn't}} tell anyone.
? If only it {{c1::would}} stop raining!
? He wishes he {{c1::could}} speak Spanish. (can)

# g9-modal-perfect | Modalverben der Vergangenheit | should have, might have
> Modalverb + **have** + 3. Form – für Vermutungen und Kritik an Vergangenem.
> **should have / shouldn't have**: Kritik – You **should have told** me. (hättest sollen)
> **must have**: sichere Vermutung – He **must have forgotten**. (muss … haben)
> **can't have**: sicher nicht – She **can't have seen** us.
> **might / may / could have**: vielleicht – They **might have missed** the bus.
> **needn't have**: war unnötig – You **needn't have brought** a present.
? You {{c1::should have}} called me! (Kritik)
? He isn't here. He {{c1::must have}} missed the train. (sicher)
? She {{c1::can't have}} seen us – she was in London. (sicher nicht)
? They {{c1::might have}} got lost. (vielleicht)
? You {{c1::needn't have}} bought a present. (unnötig)
? I {{c1::shouldn't have}} eaten so much. (Kritik – nicht)
? The government {{c1::could have}} done more to help. (hätte können)
? Somebody {{c1::must have}} taken my phone.

# g9-tenses | Zeiten im Überblick | Welche Zeit passt?
> **Simple present** – Gewohnheit, Tatsache · **Present progressive** – gerade jetzt
> **Simple past** – abgeschlossen, mit Zeitpunkt · **Present perfect** – Bezug zur Gegenwart, ohne Zeitpunkt
> **Past progressive** – lief gerade in der Vergangenheit · **Past perfect** – noch früher
> **will / going to / future progressive / future perfect** – die Zukunft
> Frag dich: Wann? Wie lange? Abgeschlossen? Bezug zu jetzt?
? Water {{c1::boils}} at 100 degrees. (boil – Tatsache)
? Be quiet! The baby {{c1::is sleeping}}. (sleep)
? Shakespeare {{c1::wrote}} Hamlet around 1600. (write)
? I {{c1::have}} never {{c2::been}} to Australia. (be)
? When she called, I {{c1::was having}} a shower. (have)
? Before he became famous, he {{c1::had worked}} as a waiter. (work)
? Look at those clouds! It {{c1::is going to}} rain.
? They {{c1::have been}} married since 2005. (be)
? By next June I {{c1::will have finished}} school. (finish)
`;

// Nine blocks, one per school year from Klasse 5 to Q2.
const blocks = [
  ["v1-hello", "v1-school", "v1-family", "g1-be", "g1-simple-present", "g1-plural-a-an"],
  ["v1-hobbies", "v1-home", "v1-food", "g2-present-progressive", "g2-simple-past", "g2-possessive"],
  ["v2-town", "v2-holidays", "v2-britain", "g3-future", "g3-comparison", "g3-adverbs"],
  ["v2-media", "v2-feelings", "v2-usa", "g4-present-perfect", "g4-if1", "g4-modals"],
  ["v3-environment", "v3-jobs", "v3-health", "g5-past-progressive", "g5-passive", "g5-relative"],
  ["v3-growingup", "v3-commonwealth", "v3-technology", "g6-if2-if3", "g6-reported-speech", "g6-gerund-infinitive"],
  ["v4-identity", "v4-analysis", "v4-americandream", "g7-past-perfect", "g7-participles", "g7-future-forms"],
  ["v4-nigeria", "v4-globalisation", "v4-argument", "g8-linking", "g8-emphasis"],
  ["v4-ukpolitics", "v4-science", "g9-wish", "g9-modal-perfect", "g9-tenses"],
];

export default { units: parseCourse(text), blocks };
