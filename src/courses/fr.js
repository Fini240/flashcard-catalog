// The French course (after the NRW Kernlehrplan Französisch, Sek I and II).
// Format: see parseCourse in src/courses.js. French | German.
import { parseCourse } from "../courses.js";

const text = `
# v1-salut | Salut ! | Begrüßen, vorstellen, Zahlen
salut | hallo; tschüss
bonjour | guten Tag
bonsoir | guten Abend
au revoir | auf Wiedersehen
à bientôt | bis bald
à demain | bis morgen
Ça va ? | Wie geht's?
ça va bien, merci | es geht gut, danke
Comment tu t'appelles ? | Wie heißt du?
je m'appelle … | ich heiße …
Tu as quel âge ? | Wie alt bist du?
j'ai quinze ans | ich bin fünfzehn
Tu habites où ? | Wo wohnst du?
j'habite à … | ich wohne in …
je viens d'Allemagne | ich komme aus Deutschland
allemand / allemande | deutsch
français / française | französisch
le garçon / la fille | der Junge / das Mädchen
l'ami / l'amie | der Freund / die Freundin
s'il te plaît | bitte (du)
s'il vous plaît | bitte (Sie, ihr)
merci | danke
de rien | gern geschehen
pardon | Entschuldigung
oui / non | ja / nein
un, deux, trois | eins, zwei, drei
quatre, cinq, six | vier, fünf, sechs
sept, huit, neuf, dix | sieben, acht, neun, zehn
vingt, trente | zwanzig, dreißig
soixante-dix | siebzig
quatre-vingts | achtzig
quatre-vingt-dix | neunzig
cent | hundert

# v1-famille | La famille | Familie und Aussehen
la famille | die Familie
les parents | die Eltern
la mère / le père | die Mutter / der Vater
le frère / la sœur | der Bruder / die Schwester
le fils / la fille | der Sohn / die Tochter
les grands-parents | die Großeltern
le grand-père / la grand-mère | der Großvater / die Großmutter
l'oncle / la tante | der Onkel / die Tante
le cousin / la cousine | der Cousin / die Cousine
le chien / le chat | der Hund / die Katze
l'animal domestique | das Haustier
grand / grande | groß
petit / petite | klein
mince | schlank
blond / blonde | blond
brun / brune | dunkelhaarig
les cheveux | die Haare
les yeux | die Augen
sympa | nett
drôle | lustig
timide | schüchtern
gentil / gentille | freundlich, lieb
sérieux / sérieuse | ernst
s'entendre bien avec | sich gut verstehen mit
divorcé / divorcée | geschieden
fils unique / fille unique | Einzelkind

# v1-college | Au collège | Schule und Unterricht
le collège | die Schule (Sek I, Kl. 6–9)
le lycée | das Gymnasium (Oberstufe)
la classe | die Klasse
la salle de classe | das Klassenzimmer
le professeur / le prof | der Lehrer / die Lehrerin
l'élève | der Schüler / die Schülerin
la matière | das Schulfach
les maths | Mathe
l'anglais | Englisch
l'histoire-géo | Geschichte und Erdkunde
la SVT | Biologie (Naturwissenschaften)
l'EPS | Sport (Schulfach)
l'emploi du temps | der Stundenplan
la récré | die Pause
la cantine | die Kantine
le contrôle | die Klassenarbeit
les devoirs | die Hausaufgaben
la note | die Note
le livre | das Buch
le cahier | das Heft
le stylo | der Kugelschreiber
la trousse | das Mäppchen
le cartable | die Schultasche
travailler | arbeiten, lernen
apprendre | lernen
comprendre | verstehen
expliquer | erklären
facile / difficile | leicht / schwierig
ennuyeux / ennuyeuse | langweilig
intéressant / intéressante | interessant

# v1-loisirs | Les loisirs | Freizeit und Hobbys
le temps libre | die Freizeit
le passe-temps | das Hobby
jouer au foot | Fußball spielen
jouer de la guitare | Gitarre spielen
faire du sport | Sport treiben
faire du vélo | Fahrrad fahren
nager | schwimmen
danser | tanzen
chanter | singen
écouter de la musique | Musik hören
lire | lesen
regarder la télé | fernsehen
aller au cinéma | ins Kino gehen
sortir avec des copains | mit Freunden ausgehen
le copain / la copine | der Kumpel / die Freundin
le match | das Spiel
l'équipe | die Mannschaft
le club | der Verein
la piscine | das Schwimmbad
le film | der Film
la chanson | das Lied
dessiner | zeichnen
se promener | spazieren gehen
j'adore | ich liebe
je déteste | ich hasse
souvent | oft
parfois | manchmal
jamais | nie
toujours | immer
le week-end | das Wochenende

# v1-maison | La maison | Wohnung und Zimmer
la maison | das Haus
l'appartement | die Wohnung
la pièce | das Zimmer (allg.)
ma chambre | mein Zimmer
la cuisine | die Küche
le salon | das Wohnzimmer
la salle de bains | das Badezimmer
les toilettes | die Toilette
le jardin | der Garten
l'escalier | die Treppe
l'étage | das Stockwerk
la porte | die Tür
la fenêtre | das Fenster
le lit | das Bett
la table | der Tisch
la chaise | der Stuhl
l'armoire | der Schrank
l'étagère | das Regal
le canapé | das Sofa
l'ordinateur | der Computer
le mur | die Wand
sur / sous | auf / unter
devant / derrière | vor / hinter
à côté de | neben
entre | zwischen
à droite / à gauche | rechts / links
il y a | es gibt
rangé / rangée | aufgeräumt
le voisin / la voisine | der Nachbar / die Nachbarin

# v1-nourriture | Manger et boire | Essen, Trinken, Einkaufen
le petit-déjeuner | das Frühstück
le déjeuner | das Mittagessen
le dîner | das Abendessen
manger | essen
boire | trinken
avoir faim | Hunger haben
avoir soif | Durst haben
le pain | das Brot
la baguette | das Baguette
le croissant | das Croissant
le beurre | die Butter
le fromage | der Käse
le jambon | der Schinken
la viande | das Fleisch
le poulet | das Hähnchen
le poisson | der Fisch
les pâtes | die Nudeln
le riz | der Reis
les légumes | das Gemüse
les fruits | das Obst
la pomme | der Apfel
la fraise | die Erdbeere
le lait | die Milch
l'eau | das Wasser
le jus d'orange | der Orangensaft
la boulangerie | die Bäckerei
le supermarché | der Supermarkt
le marché | der Markt
Ça coûte combien ? | Was kostet das?
un kilo de | ein Kilo
une bouteille de | eine Flasche
je voudrais | ich hätte gern
délicieux / délicieuse | lecker

# v2-ville | En ville | Stadt, Wege, Verkehr
la ville | die Stadt
le village | das Dorf
le quartier | das Viertel
la rue | die Straße
la place | der Platz
le centre-ville | die Innenstadt
le magasin | das Geschäft
le musée | das Museum
l'église | die Kirche
la mairie | das Rathaus
la gare | der Bahnhof
l'arrêt de bus | die Bushaltestelle
le métro | die U-Bahn
le train | der Zug
la voiture | das Auto
à pied | zu Fuß
le feu | die Ampel
le carrefour | die Kreuzung
tout droit | geradeaus
tourner | abbiegen
traverser | überqueren
près de | in der Nähe von
loin de | weit weg von
Où est … ? | Wo ist …?
Pour aller à … ? | Wie komme ich zu …?
prendre le bus | den Bus nehmen
la pharmacie | die Apotheke
l'hôpital | das Krankenhaus
la banque | die Bank
le cinéma | das Kino

# v2-vetements | Les vêtements | Kleidung, Farben, Mode
les vêtements | die Kleidung
le tee-shirt | das T-Shirt
la chemise | das Hemd
le pull | der Pullover
le sweat | das Sweatshirt
le pantalon | die Hose
le jean | die Jeans
la jupe | der Rock
la robe | das Kleid
la veste | die Jacke
le manteau | der Mantel
les chaussures | die Schuhe
les baskets | die Turnschuhe
les chaussettes | die Socken
la casquette | die Kappe
la taille | die Größe
essayer | anprobieren
porter | tragen
cher / chère | teuer
bon marché | billig
les soldes | der Schlussverkauf
la mode | die Mode
à la mode | modisch
rouge | rot
bleu / bleue | blau
vert / verte | grün
jaune | gelb
noir / noire | schwarz
blanc / blanche | weiß
gris / grise | grau

# v2-journee | Ma journée | Tagesablauf und Uhrzeit
se réveiller | aufwachen
se lever | aufstehen
se doucher | duschen
se brosser les dents | sich die Zähne putzen
s'habiller | sich anziehen
prendre le petit-déjeuner | frühstücken
partir | losgehen, abfahren
arriver | ankommen
rentrer | nach Hause kommen
se coucher | ins Bett gehen
dormir | schlafen
le matin | der Morgen; morgens
l'après-midi | der Nachmittag
le soir | der Abend
la nuit | die Nacht
tôt / tard | früh / spät
d'abord | zuerst
ensuite | dann
après | danach
enfin | schließlich
tous les jours | jeden Tag
Quelle heure est-il ? | Wie spät ist es?
il est huit heures | es ist acht Uhr
et demie | halb (… Uhr dreißig)
et quart / moins le quart | Viertel nach / Viertel vor
midi / minuit | Mittag / Mitternacht
lundi, mardi, mercredi | Montag, Dienstag, Mittwoch
jeudi, vendredi | Donnerstag, Freitag
samedi, dimanche | Samstag, Sonntag
fatigué / fatiguée | müde

# v2-vacances | Les vacances | Ferien und Reisen
les vacances | die Ferien
le voyage | die Reise
voyager | reisen
le pays | das Land
à l'étranger | im Ausland
la plage | der Strand
la mer | das Meer
la montagne | das Gebirge
la campagne | das Land (ländlich)
l'hôtel | das Hotel
l'auberge de jeunesse | die Jugendherberge
le camping | der Campingplatz
réserver | reservieren
le billet | die Fahrkarte
l'avion | das Flugzeug
l'aéroport | der Flughafen
la valise | der Koffer
faire sa valise | den Koffer packen
le passeport | der Reisepass
visiter | besichtigen
le monument | die Sehenswürdigkeit
l'échange scolaire | der Schüleraustausch
la famille d'accueil | die Gastfamilie
s'amuser | Spaß haben
bronzer | braun werden
la carte postale | die Postkarte
il fait beau | es ist schönes Wetter
il pleut | es regnet
il fait chaud / froid | es ist warm / kalt
le soleil | die Sonne

# v2-medias | Les médias | Handy, Internet, soziale Netzwerke
le portable | das Handy
l'ordinateur portable | der Laptop
l'écran | der Bildschirm
internet | das Internet
le réseau social | das soziale Netzwerk
l'appli | die App
le message | die Nachricht
envoyer un SMS | eine SMS schicken
le mail | die E-Mail
le mot de passe | das Passwort
télécharger | herunterladen
partager | teilen
poster | posten
liker | liken
l'abonné / l'abonnée | der Follower
la vidéo | das Video
surfer sur internet | im Internet surfen
chercher | suchen
en ligne | online
être accro à | süchtig sein nach
le harcèlement en ligne | das Cybermobbing
la vie privée | die Privatsphäre
les fausses informations | die Falschmeldungen
l'avantage | der Vorteil
l'inconvénient | der Nachteil
la publicité | die Werbung
le jeu vidéo | das Videospiel
la série | die Serie

# v2-sentiments | Amitié et sentiments | Freundschaft und Gefühle
l'amitié | die Freundschaft
le meilleur ami / la meilleure amie | der beste Freund / die beste Freundin
le petit ami / la petite amie | der feste Freund / die feste Freundin
tomber amoureux de | sich verlieben in
être amoureux / amoureuse | verliebt sein
faire confiance à | vertrauen
aider | helfen
se disputer | sich streiten
se réconcilier | sich versöhnen
s'excuser | sich entschuldigen
manquer à qn | jemandem fehlen
content / contente | froh
heureux / heureuse | glücklich
triste | traurig
fâché / fâchée | verärgert
nerveux / nerveuse | nervös
inquiet / inquiète | besorgt
jaloux / jalouse | eifersüchtig
avoir peur | Angst haben
se sentir seul | sich einsam fühlen
le sentiment | das Gefühl
honnête | ehrlich
fidèle | treu
la confiance | das Vertrauen
le secret | das Geheimnis
rire | lachen
pleurer | weinen
le conflit | der Konflikt

# v3-francophonie | La francophonie | Frankreich und die französischsprachige Welt
la francophonie | die französischsprachige Welt
francophone | französischsprachig
la région | die Region
la capitale | die Hauptstadt
Paris | Paris
la Bretagne | die Bretagne
la Provence | die Provence
l'Alsace | das Elsass
la Corse | Korsika
les DOM-TOM | die Überseegebiete
la Martinique | Martinique
le Québec | Québec
la Belgique | Belgien
la Suisse | die Schweiz
le Sénégal | Senegal
le Maroc | Marokko
l'Algérie | Algerien
la colonisation | die Kolonisierung
la colonie | die Kolonie
la décolonisation | die Dekolonisierung
la langue officielle | die Amtssprache
le dialecte | der Dialekt
l'habitant / l'habitante | der Einwohner / die Einwohnerin
la République | die Republik
le président / la présidente | der Präsident / die Präsidentin
la fête nationale | der Nationalfeiertag
le 14 juillet | der 14. Juli (Nationalfeiertag)
la Révolution française | die Französische Revolution
liberté, égalité, fraternité | Freiheit, Gleichheit, Brüderlichkeit
la gastronomie | die (feine) Küche

# v3-avenir | Le travail et l'avenir | Beruf, Praktikum, Zukunft
l'avenir | die Zukunft
le métier | der Beruf
le travail | die Arbeit
le boulot | der Job (ugs.)
l'emploi | die Stelle
le salaire | das Gehalt
l'entreprise | das Unternehmen
le patron / la patronne | der Chef / die Chefin
le stage | das Praktikum
la formation | die Ausbildung
les études | das Studium
faire des études | studieren
le bac | das Abitur (Frankreich)
le diplôme | der Abschluss
le CV | der Lebenslauf
la lettre de motivation | das Bewerbungsschreiben
l'entretien d'embauche | das Vorstellungsgespräch
postuler | sich bewerben
l'expérience | die Erfahrung
les compétences | die Kompetenzen
le chômage | die Arbeitslosigkeit
gagner sa vie | seinen Lebensunterhalt verdienen
réussir | Erfolg haben, schaffen
le rêve | der Traum
le médecin | der Arzt / die Ärztin
l'avocat / l'avocate | der Anwalt / die Anwältin
l'ingénieur / l'ingénieure | der Ingenieur / die Ingenieurin
l'infirmier / l'infirmière | der Krankenpfleger / die Krankenschwester
le journaliste / la journaliste | der Journalist / die Journalistin

# v3-environnement | L'environnement | Umwelt und Klima
l'environnement | die Umwelt
le changement climatique | der Klimawandel
le réchauffement climatique | die Erderwärmung
l'effet de serre | der Treibhauseffekt
la pollution | die Verschmutzung
polluer | verschmutzen
les déchets | der Müll
recycler | recyceln
le tri des déchets | die Mülltrennung
le plastique | das Plastik
la sécheresse | die Dürre
l'inondation | die Überschwemmung
la canicule | die Hitzewelle
l'énergie renouvelable | die erneuerbare Energie
l'énergie solaire | die Sonnenenergie
l'éolienne | das Windrad
le nucléaire | die Atomkraft
économiser l'énergie | Energie sparen
durable | nachhaltig
le développement durable | die nachhaltige Entwicklung
protéger | schützen
l'espèce menacée | die bedrohte Art
la consommation | der Verbrauch, der Konsum
le gaspillage | die Verschwendung
gaspiller | verschwenden
la manifestation | die Demonstration
prendre des mesures | Maßnahmen ergreifen
à long terme | langfristig
la planète | der Planet

# v4-banlieue | Vivre en banlieue | Stadt, Banlieue, soziale Fragen
la banlieue | der Vorort; die Banlieue
la cité | die Hochhaussiedlung
le HLM | die Sozialwohnung
le grand ensemble | die Großsiedlung
le jeune de banlieue | der Jugendliche aus der Banlieue
la mixité sociale | die soziale Durchmischung
l'exclusion | die Ausgrenzung
la ségrégation | die Segregation
le quartier défavorisé | das benachteiligte Viertel
la précarité | die prekäre Lage
le taux de chômage | die Arbeitslosenquote
l'échec scolaire | das schulische Scheitern
la délinquance | die Kriminalität
la violence | die Gewalt
les émeutes | die Unruhen
la police | die Polizei
le contrôle d'identité | die Personenkontrolle
les préjugés | die Vorurteile
la stigmatisation | die Stigmatisierung
le verlan | Verlan (Jugendsprache)
le rap | der Rap
la solidarité | die Solidarität
l'association | der Verein
s'engager | sich engagieren
l'égalité des chances | die Chancengleichheit
la réussite | der Erfolg
s'en sortir | es schaffen, herauskommen

# v4-immigration | La France multiculturelle | Einwanderung, Integration, Identität
l'immigration | die Einwanderung
l'immigré / l'immigrée | der Einwanderer / die Einwanderin
l'émigration | die Auswanderung
le réfugié / la réfugiée | der Flüchtling
le demandeur d'asile | der Asylbewerber
le pays d'origine | das Herkunftsland
le pays d'accueil | das Aufnahmeland
les sans-papiers | die Menschen ohne Papiere
le titre de séjour | die Aufenthaltsgenehmigung
la nationalité | die Staatsangehörigkeit
l'intégration | die Integration
s'intégrer | sich integrieren
l'assimilation | die Assimilation
la discrimination | die Diskriminierung
le racisme | der Rassismus
la xénophobie | die Fremdenfeindlichkeit
la laïcité | der Laizismus
la religion | die Religion
la diversité | die Vielfalt
la double culture | die doppelte Kultur
les racines | die Wurzeln
l'identité | die Identität
appartenir à | gehören zu
la deuxième génération | die zweite Generation
le Maghreb | der Maghreb
maghrébin / maghrébine | aus dem Maghreb
le métissage | die Vermischung (der Kulturen)
la tolérance | die Toleranz

# v4-analyse | Analyser un texte | Redemittel für Textarbeit
le texte | der Text
l'extrait | der Auszug
l'article | der Artikel
le roman | der Roman
la nouvelle | die Novelle, die Kurzgeschichte
le poème | das Gedicht
la chanson engagée | das politische Lied
l'auteur / l'autrice | der Autor / die Autorin
le narrateur / la narratrice | der Erzähler / die Erzählerin
le personnage principal | die Hauptfigur
le thème | das Thema
il s'agit de … | es geht um …
le texte traite de … | der Text handelt von …
l'auteur critique … | der Autor kritisiert …
résumer | zusammenfassen
le résumé | die Zusammenfassung
analyser | analysieren
caractériser | charakterisieren
le registre familier | die Umgangssprache
la figure de style | das Stilmittel
la métaphore | die Metapher
la comparaison | der Vergleich
l'énumération | die Aufzählung
la question rhétorique | die rhetorische Frage
l'ironie | die Ironie
l'intention | die Absicht
d'abord … ensuite … enfin | zunächst … dann … schließlich
de plus | außerdem
en résumé | zusammenfassend

# v4-opinion | Donner son avis | Meinung und Argumentation
à mon avis | meiner Meinung nach
je pense que | ich denke, dass
je crois que | ich glaube, dass
je ne pense pas que + subj. | ich denke nicht, dass
il me semble que | mir scheint, dass
être d'accord avec | einverstanden sein mit
avoir raison / avoir tort | recht / unrecht haben
il est vrai que | es stimmt, dass
il faut que + subj. | man muss, es ist nötig, dass
il est important que + subj. | es ist wichtig, dass
d'un côté … de l'autre côté | einerseits … andererseits
pour / contre | dafür / dagegen
l'argument | das Argument
c'est pourquoi | deshalb
donc | also
car | denn
parce que | weil
puisque | da (ja)
bien que + subj. | obwohl
malgré | trotz
par contre | dagegen
pourtant | trotzdem
cependant | jedoch
c'est-à-dire | das heißt
par exemple | zum Beispiel
en conclusion | abschließend
pour finir | zum Schluss
le débat | die Debatte
convaincre | überzeugen

# v4-europe | La France et l'Europe | deutsch-französische Beziehungen, EU
l'Union européenne | die Europäische Union
l'Europe | Europa
européen / européenne | europäisch
l'État membre | der Mitgliedstaat
le Parlement européen | das Europäische Parlament
l'euro | der Euro
la frontière | die Grenze
la coopération | die Zusammenarbeit
l'amitié franco-allemande | die deutsch-französische Freundschaft
le traité de l'Élysée | der Élysée-Vertrag (1963)
la réconciliation | die Versöhnung
le partenariat | die Partnerschaft
le jumelage | die Städtepartnerschaft
l'OFAJ | das Deutsch-Französische Jugendwerk
la mobilité | die Mobilität
le programme Erasmus | das Erasmus-Programm
le voisin | der Nachbar
la guerre mondiale | der Weltkrieg
la paix | der Frieden
l'ennemi / l'ennemie | der Feind
les valeurs communes | die gemeinsamen Werte
la démocratie | die Demokratie
les élections | die Wahlen
voter | wählen (abstimmen)
le citoyen / la citoyenne | der Bürger / die Bürgerin
l'euroscepticisme | die EU-Skepsis
le bilinguisme | die Zweisprachigkeit

# v4-numerique | Le monde numérique | Digitalisierung und ihre Folgen
le numérique | das Digitale, die Digitalisierung
l'intelligence artificielle | die künstliche Intelligenz
l'algorithme | der Algorithmus
les données personnelles | die persönlichen Daten
la protection des données | der Datenschutz
la surveillance | die Überwachung
le smartphone | das Smartphone
la dépendance | die Abhängigkeit
le temps d'écran | die Bildschirmzeit
la déconnexion | das Abschalten, die Offline-Zeit
l'influenceur / l'influenceuse | der Influencer / die Influencerin
la e-réputation | der Ruf im Netz
le télétravail | die Arbeit im Homeoffice
le commerce en ligne | der Onlinehandel
la fracture numérique | die digitale Kluft
le progrès | der Fortschritt
la menace | die Bedrohung
le risque | das Risiko
la manipulation | die Manipulation
la désinformation | die Desinformation
vérifier une source | eine Quelle prüfen
fiable | zuverlässig
l'esprit critique | das kritische Denken
la liberté d'expression | die Meinungsfreiheit
réglementer | regulieren
l'innovation | die Innovation

# v4-afrique | L'Afrique francophone | Senegal, Maghreb, Entwicklung
l'Afrique de l'Ouest | Westafrika
le Sénégalais / la Sénégalaise | der Senegalese / die Senegalesin
Dakar | Dakar
le wolof | Wolof (Sprache)
la Tunisie | Tunesien
le Printemps arabe | der Arabische Frühling
l'indépendance | die Unabhängigkeit
l'héritage colonial | das koloniale Erbe
la Françafrique | die französisch-afrikanischen Beziehungen
le pays en voie de développement | das Entwicklungsland
la pauvreté | die Armut
les ressources | die Rohstoffe
l'aide au développement | die Entwicklungshilfe
l'exode rural | die Landflucht
la croissance | das Wachstum
la jeunesse | die Jugend
l'avenir du continent | die Zukunft des Kontinents
la tradition orale | die mündliche Überlieferung
le griot | der Griot (Erzähler, Sänger)
la négritude | die Négritude
l'écrivain / l'écrivaine | der Schriftsteller / die Schriftstellerin
le métis / la métisse | Person gemischter Herkunft
la diaspora | die Diaspora
le sable / le désert | der Sand / die Wüste
la sécheresse au Sahel | die Dürre im Sahel
le commerce équitable | der faire Handel

# g1-articles | Artikel und Plural | le, la, les – un, une, des
> Jedes Nomen ist männlich oder weiblich. Bestimmter Artikel: **le** (m.), **la** (f.), vor Vokal oder stummem h **l'**; Plural immer **les**.
> Unbestimmter Artikel: **un** (m.), **une** (f.), Plural **des**.
> Plural meist mit **-s**, das man nicht hört: le livre → les livres.
> -eau / -eu → **-x**: le gâteau → les gâteaux · -al → **-aux**: le journal → les journaux
> Präposition + Artikel verschmelzen: à + le → **au**, à + les → **aux**, de + le → **du**, de + les → **des**
> Je vais **au** cinéma. Je parle **du** film.
? {{c1::La}} maison de mes grands-parents est grande.
? J'ai {{c1::un}} frère et deux sœurs.
? {{c1::L'}}école est près de la gare.
? Dans ma rue, il y a {{c1::des}} magasins.
? Je vais {{c1::au}} cinéma ce soir. (à + le)
? Elle parle {{c1::aux}} élèves. (à + les)
? C'est le livre {{c1::du}} professeur. (de + le)
? J'aime les {{c1::gâteaux}}. (gâteau)
? {{c1::Les}} chaussures sont trop chères.
? Il lit trois {{c1::journaux}} par jour. (journal)

# g1-etre-avoir | être und avoir | Ich bin, ich habe
> Die zwei wichtigsten Verben – unregelmäßig, also auswendig lernen.
> **être**: je suis · tu es · il/elle/on est · nous sommes · vous êtes · ils/elles sont
> **avoir**: j'ai · tu as · il/elle/on a · nous avons · vous avez · ils/elles ont
> **on** (man, wir) wird wie il konjugiert und ist im Alltag sehr häufig: On va au cinéma ?
> Alter und viele Zustände mit **avoir**: J'ai seize ans. J'ai faim. J'ai peur.
? Je {{c1::suis}} allemand.
? Tu {{c1::as}} quel âge ?
? Nous {{c1::sommes}} en retard.
? Mes parents {{c1::ont}} une voiture rouge.
? Vous {{c1::êtes}} français ?
? J'{{c1::ai}} faim, on mange ?
? Elle {{c1::est}} très sympa.
? Ils {{c1::sont}} à la piscine.
? On {{c1::a}} un contrôle demain.
? Vous {{c1::avez}} des frères et sœurs ?

# g1-er-verbes | Verben auf -er | parler, aimer, habiter
> Die meisten französischen Verben enden auf **-er** und sind regelmäßig.
> **parler**: je parle · tu parles · il parle · nous parlons · vous parlez · ils parlent
> Die Endungen -e, -es, -e, -ent klingen gleich – man hört nur parl-.
> Vor Vokal: je → **j'**: j'aime, j'habite.
> Besonderheiten: nous mang**e**ons, nous commen**ç**ons · acheter → j'ach**è**te · préférer → je préf**è**re
? Je {{c1::parle}} un peu français. (parler)
? Tu {{c1::habites}} où ? (habiter)
? Nous {{c1::jouons}} au foot le samedi. (jouer)
? Vous {{c1::aimez}} la musique ? (aimer)
? Mes amis {{c1::regardent}} une série. (regarder)
? Il {{c1::travaille}} dans une banque. (travailler)
? Nous {{c1::mangeons}} à midi. (manger)
? J'{{c1::achète}} une baguette. (acheter)
? Elle {{c1::préfère}} le thé. (préférer)
? On {{c1::écoute}} de la musique. (écouter)

# g1-negation | Verneinung | ne … pas, ne … jamais
> Die Verneinung umschließt das konjugierte Verb: **ne** … **pas**. Vor Vokal: **n'**.
> Je **ne** parle **pas** anglais. Il **n'**aime **pas** le fromage.
> ne … **jamais** (nie) · ne … **plus** (nicht mehr) · ne … **rien** (nichts) · ne … **personne** (niemand)
> Nach der Verneinung wird un/une/des zu **de**: J'ai un chien. → Je n'ai **pas de** chien.
> Im gesprochenen Französisch fällt ne oft weg: J'sais pas.
? Je {{c1::ne}} parle {{c2::pas}} chinois.
? Il {{c1::n'}}aime pas les maths.
? Nous ne mangeons {{c1::jamais}} de viande. (nie)
? Je n'ai pas {{c1::de}} frère.
? Elle ne fume {{c1::plus}}. (nicht mehr)
? Je ne comprends {{c1::rien}}. (nichts)
? Il n'y a {{c1::personne}} dans la salle. (niemand)
? Tu n'as pas {{c1::de}} devoirs aujourd'hui ?

# g1-questions | Fragen stellen | est-ce que, où, quand …
> Drei Arten, eine Frage zu stellen:
> - Intonation: Tu viens ? (Alltag)
> - **Est-ce que**: Est-ce que tu viens ? (neutral)
> - Inversion: Viens-tu ? (gehoben)
> Fragewörter: **où** (wo, wohin) · **quand** (wann) · **comment** (wie) · **pourquoi** (warum) · **combien** (wie viel) · **qui** (wer) · **que / qu'est-ce que** (was) · **quel/quelle** (welche/r)
> Antwort auf pourquoi: **parce que** …
> **quel** passt sich an: quel âge, quelle heure, quels films, quelles chansons
? {{c1::Est-ce que}} tu aimes le chocolat ?
? Tu habites {{c1::où}} ?
? {{c1::Comment}} tu t'appelles ?
? {{c1::Pourquoi}} tu apprends le français ? – {{c2::Parce que}} j'aime la France.
? {{c1::Quelle}} heure est-il ?
? {{c1::Combien}} coûte ce pull ?
? {{c1::Qu'est-ce que}} tu fais ce week-end ?
? {{c1::Qui}} est ton prof de maths ?
? {{c1::Quand}} est ton anniversaire ?
? Tu as {{c1::quel}} âge ?

# g1-aller-futur | aller, venir und futur composé | Je vais partir
> **aller**: je vais · tu vas · il va · nous allons · vous allez · ils vont
> **venir**: je viens · tu viens · il vient · nous venons · vous venez · ils viennent
> ## futur composé – die nahe Zukunft
> **aller** + Infinitiv: Demain, je **vais visiter** Paris.
> ## passé récent – gerade eben
> **venir de** + Infinitiv: Je **viens de** manger. (Ich habe gerade gegessen.)
? Je {{c1::vais}} au collège à pied. (aller)
? Vous {{c1::allez}} bien ? (aller)
? Mes amis {{c1::viennent}} chez moi. (venir)
? Demain, nous {{c1::allons}} faire du vélo.
? Ce soir, je vais {{c1::regarder}} un film.
? Tu {{c1::viens}} d'où ? (venir)
? Elle {{c1::vient}} de partir. (gerade gegangen)
? Ils {{c1::vont}} acheter une maison.
? On {{c1::va}} manger une pizza ?
? Je viens {{c1::de}} finir mes devoirs.

# g2-adjectifs | Adjektive | Stellung und Angleichung
> Adjektive richten sich nach dem Nomen: un garçon grand · une fille grand**e** · des garçons grand**s** · des filles grand**es**
> Besondere Formen: heureux → heureu**se** · sportif → sporti**ve** · gentil → gentil**le** · blanc → blan**che**
> Meist stehen Adjektive **nach** dem Nomen: un film intéressant.
> Kurze häufige Adjektive stehen **davor**: grand, petit, bon, mauvais, beau, jeune, vieux, nouveau
> beau / nouveau / vieux vor Vokal: un **bel** homme, un **nouvel** ami, un **vieil** arbre
> Feminin: belle, nouvelle, vieille
? C'est une fille très {{c1::sportive}}. (sportif)
? Mes amies sont {{c1::heureuses}}. (heureux)
? J'ai une {{c1::nouvelle}} voiture. (nouveau)
? C'est un {{c1::bel}} appartement. (beau)
? Elle porte une robe {{c1::blanche}}. (blanc)
? Ce sont des chansons {{c1::intéressantes}}. (intéressant)
? Il a un {{c1::vieil}} ordinateur. (vieux)
? Ma grand-mère est très {{c1::gentille}}. (gentil)
? C'est une {{c1::bonne}} idée ! (bon)

# g2-passe-compose | Passé composé | j'ai mangé, je suis allé
> Die Vergangenheit für abgeschlossene Handlungen: **avoir** oder **être** + Partizip.
> Partizip: -er → **-é** (parlé) · -ir → **-i** (fini) · -re → **-u** (vendu)
> Unregelmäßig: faire → fait · prendre → pris · voir → vu · lire → lu · boire → bu · avoir → eu · être → été · écrire → écrit · mettre → mis
> ## mit être
> Verben der Bewegung (aller, venir, partir, arriver, entrer, sortir, monter, descendre, rester, tomber, naître, mourir) und alle reflexiven Verben.
> Dann passt sich das Partizip an: Elle est allé**e**. Nous sommes parti**s**.
? Hier, j'{{c1::ai mangé}} une pizza. (manger)
? Tu {{c1::as fini}} tes devoirs ? (finir)
? Nous {{c1::avons vu}} un bon film. (voir)
? Elle {{c1::est allée}} à Paris. (aller)
? Ils {{c1::sont arrivés}} en retard. (arriver)
? Qu'est-ce que tu {{c1::as fait}} ce week-end ? (faire)
? J'{{c1::ai pris}} le bus. (prendre)
? Ma sœur {{c1::est née}} en 2010. (naître)
? Nous {{c1::nous sommes levés}} tôt. (se lever)
? Vous {{c1::avez lu}} ce livre ? (lire)

# g2-pronoms-cod | Objektpronomen | le, la, les, lui, leur
> ## direktes Objekt (wen? was?)
> me · te · **le / la / l'** · nous · vous · **les** – Tu vois Marie ? Oui, je **la** vois.
> ## indirektes Objekt (wem?) – nach Verben mit **à**
> me · te · **lui** · nous · vous · **leur** – Je **lui** parle. Je **leur** écris.
> Das Pronomen steht **vor** dem konjugierten Verb, bei Infinitiv davor: Je vais **le** faire.
> Verneinung umschließt beides: Je ne **le** vois pas.
> **y** ersetzt à + Ort/Sache (J'y vais), **en** ersetzt de + Sache/Menge (J'en veux deux).
? Tu connais Paul ? – Oui, je {{c1::le}} connais.
? Tu aimes la musique ? – Oui, je {{c1::l'}}aime.
? Où sont mes clés ? Je ne {{c1::les}} trouve pas.
? Tu téléphones à ta mère ? – Oui, je {{c1::lui}} téléphone.
? Tu écris à tes amis ? – Oui, je {{c1::leur}} écris.
? Ce film ? Je vais {{c1::le}} regarder ce soir.
? Tu vas à Paris ? – Oui, j'{{c1::y}} vais demain.
? Tu veux des pommes ? – Oui, j'{{c1::en}} veux trois.
? Elle ne {{c1::nous}} comprend pas.

# g2-imparfait | Imparfait | je jouais, c'était
> Für Beschreibungen, Gewohnheiten und Hintergründe in der Vergangenheit.
> Stamm der 1. Person Plural Präsens (nous **jou**ons) + Endungen: -ais · -ais · -ait · -ions · -iez · -aient
> jouer → je jouais · finir (nous finissons) → je finissais · faire (nous faisons) → je faisais
> Einzige Ausnahme: **être** → j'étais, tu étais, il était …
> Signalwörter: autrefois, avant, d'habitude, tous les jours, quand j'étais petit
? Quand j'{{c1::étais}} petit, j'habitais à Lyon. (être)
? Avant, nous {{c1::jouions}} souvent au parc. (jouer)
? Il {{c1::faisait}} beau et le soleil brillait. (faire)
? Mes grands-parents n'{{c1::avaient}} pas de télé. (avoir)
? Tous les étés, on {{c1::allait}} à la mer. (aller)
? Tu {{c1::regardais}} quoi à la télé ? (regarder)
? Vous {{c1::habitiez}} où avant ? (habiter)
? C'{{c1::était}} une belle journée. (être)
? Je {{c1::lisais}} beaucoup de BD. (lire)

# g2-imparfait-pc | Imparfait oder passé composé? | Hintergrund und Handlung
> **Imparfait** = Bühne: wie es war, was gerade lief, was man immer tat.
> **Passé composé** = Handlung: was passierte, einmal, Schritt für Schritt.
> Il pleuvait (Bühne). Soudain, quelqu'un a frappé à la porte (Handlung).
> Eine laufende Handlung wird unterbrochen: Je **regardais** la télé quand le téléphone **a sonné**.
> Signal passé composé: hier, soudain, tout à coup, une fois · imparfait: toujours, souvent, pendant que
? Je {{c1::dormais}} quand mon portable {{c2::a sonné}}. (dormir, sonner)
? Il {{c1::faisait}} froid, alors nous {{c2::sommes restés}} à la maison. (faire, rester)
? Hier, j'{{c1::ai rencontré}} un ami. (rencontrer)
? Quand j'étais petite, je {{c1::jouais}} toujours avec mon chat. (jouer)
? Soudain, la lumière {{c1::s'est éteinte}}. (s'éteindre)
? Pendant que je {{c1::faisais}} mes devoirs, ma sœur chantait. (faire)
? L'année dernière, nous {{c1::sommes allés}} en Bretagne. (aller)
? C'{{c1::était}} la nuit et il {{c2::pleuvait}}. (être, pleuvoir)
? Tout à coup, il {{c1::a commencé}} à neiger. (commencer)

# g2-futur | Futur simple | je parlerai, j'aurai
> Für Vorhersagen und Pläne in weiterer Zukunft.
> Infinitiv (bei -re ohne e) + Endungen von avoir: **-ai · -as · -a · -ons · -ez · -ont**
> parler → je parlerai · finir → je finirai · prendre → je prendrai
> Unregelmäßige Stämme: être → **ser**- · avoir → **aur**- · aller → **ir**- · faire → **fer**- · venir → **viendr**- · pouvoir → **pourr**- · vouloir → **voudr**- · voir → **verr**- · savoir → **saur**- · il faut → il **faudra**
> Nach **quand** steht im Französischen das Futur: Quand je **serai** grand, …
? Demain, il {{c1::pleuvra}}. (pleuvoir)
? Plus tard, je {{c1::serai}} médecin. (être)
? Nous {{c1::aurons}} les résultats lundi. (avoir)
? Tu {{c1::viendras}} à ma fête ? (venir)
? Ils {{c1::feront}} un voyage en Afrique. (faire)
? Je {{c1::parlerai}} à ma prof demain. (parler)
? Quand j'{{c1::aurai}} dix-huit ans, je passerai le permis. (avoir)
? Vous {{c1::pourrez}} venir avec nous ? (pouvoir)
? On {{c1::verra}} ! (voir)

# g3-subjonctif | Subjonctif | il faut que tu viennes
> Der Subjonctif steht nach Ausdrücken von Notwendigkeit, Wunsch, Gefühl und Zweifel.
> ## Bildung
> Stamm der 3. Person Plural Präsens (ils **parl**ent) + **-e · -es · -e · -ions · -iez · -ent**
> que je parle · que tu finisses · qu'il prenne · que nous venions
> Unregelmäßig: être → que je **sois** · avoir → que j'**aie** · aller → que j'**aille** · faire → que je **fasse** · pouvoir → que je **puisse** · savoir → que je **sache** · vouloir → que je **veuille**
> ## Auslöser
> il faut que · vouloir que · aimer que · avoir peur que · être content que · bien que · pour que · avant que
? Il faut que tu {{c1::fasses}} tes devoirs. (faire)
? Je veux que vous {{c1::veniez}} avec nous. (venir)
? Ma mère aimerait que je {{c1::sois}} plus calme. (être)
? Il faut que nous {{c1::partions}} tôt. (partir)
? Bien qu'il {{c1::pleuve}}, on sort. (pleuvoir)
? Je suis content que tu {{c1::aies}} réussi. (avoir)
? Le prof parle lentement pour que nous {{c1::comprenions}}. (comprendre)
? J'ai peur qu'elle ne {{c1::puisse}} pas venir. (pouvoir)
? Il faut que j'{{c1::aille}} chez le médecin. (aller)

# g3-conditionnel | Conditionnel | je voudrais, j'aimerais
> Für Wünsche, höfliche Bitten, Ratschläge und Vermutungen.
> Stamm des Futur + Endungen des Imparfait: **-ais · -ais · -ait · -ions · -iez · -aient**
> parler → je parlerais · être → je serais · avoir → j'aurais · faire → je ferais · pouvoir → je pourrais · vouloir → je voudrais
> Je **voudrais** un café. Tu **pourrais** m'aider ? À ta place, je **parlerais** au prof.
? Je {{c1::voudrais}} un croissant, s'il vous plaît. (vouloir)
? Tu {{c1::pourrais}} fermer la fenêtre ? (pouvoir)
? J'{{c1::aimerais}} vivre au Québec. (aimer)
? À ta place, je {{c1::parlerais}} à mes parents. (parler)
? Ce {{c1::serait}} super ! (être)
? Nous {{c1::ferions}} un tour du monde. (faire)
? Vous {{c1::auriez}} un moment ? (avoir)
? Ils {{c1::préféreraient}} rester ici. (préférer)
? On {{c1::devrait}} protéger la planète. (devoir)

# g3-relatifs | Relativpronomen | qui, que, où, dont
> **qui** = Subjekt (vor dem Verb): Le garçon **qui** parle est mon frère.
> **que / qu'** = direktes Objekt: Le film **que** j'ai vu était génial.
> **où** = Ort oder Zeit: La ville **où** j'habite. Le jour **où** il est venu.
> **dont** = ersetzt de + …: Le livre **dont** je parle. (parler de)
> **ce qui / ce que** = „was“: Je ne sais pas **ce que** tu veux.
? La fille {{c1::qui}} chante est ma sœur.
? Le livre {{c1::que}} je lis est passionnant.
? C'est la ville {{c1::où}} je suis né.
? Voilà le prof {{c1::dont}} je t'ai parlé.
? Je ne comprends pas {{c1::ce que}} tu dis.
? Le pull {{c1::que}} tu portes est joli.
? C'est un film {{c1::qui}} fait peur.
? {{c1::Ce qui}} m'intéresse, c'est l'histoire.
? Le jour {{c1::où}} on s'est rencontrés, il pleuvait.

# g4-si | Bedingungssätze | si j'avais, j'aurais fait
> ## real
> si + **présent**, → présent / futur / impératif: Si tu **viens**, on **ira** au cinéma.
> ## irreal Gegenwart
> si + **imparfait**, → **conditionnel**: Si j'**avais** de l'argent, je **voyagerais**.
> ## irreal Vergangenheit
> si + **plus-que-parfait**, → **conditionnel passé**: Si j'**avais travaillé**, j'**aurais réussi**.
> Nach **si** steht nie Futur oder Conditionnel.
? Si tu {{c1::veux}}, on peut sortir. (vouloir)
? S'il {{c1::fait}} beau demain, on ira à la plage. (faire)
? Si j'{{c1::avais}} le temps, je lirais plus. (avoir)
? Si nous {{c1::étions}} riches, nous achèterions une île. (être)
? Si tu habitais à Paris, tu {{c1::pourrais}} visiter le Louvre. (pouvoir)
? Si j'avais su, je {{c1::serais venu}}. (venir)
? Si elle {{c1::avait travaillé}}, elle aurait eu son bac. (travailler)
? Qu'est-ce que tu ferais si tu {{c1::gagnais}} au loto ? (gagner)
? Si on {{c1::protégeait}} mieux la planète, il y aurait moins de catastrophes. (protéger)

# g4-subjonctif-opinion | Meinung, Zweifel und Subjonctif | je ne pense pas que
> Bejahte Meinung → **Indikativ**: Je pense que c'**est** vrai.
> Verneinte Meinung oder Frage → **Subjonctif**: Je ne pense pas que ce **soit** vrai. Crois-tu qu'il **vienne** ?
> Wertung und Zweifel → **Subjonctif**: il est possible que, il est normal que, je doute que, c'est dommage que
> Gewissheit → **Indikativ**: il est certain que, il est évident que, je suis sûr que
? Je pense que tu {{c1::as}} raison. (avoir)
? Je ne pense pas que ce {{c1::soit}} facile. (être)
? Je doute qu'il {{c1::puisse}} venir. (pouvoir)
? Il est possible qu'elle {{c1::fasse}} un stage à Paris. (faire)
? Il est évident que le climat {{c1::change}}. (changer)
? C'est dommage que tu ne {{c1::viennes}} pas. (venir)
? Je suis sûr que nous {{c1::allons}} réussir. (aller)
? Il est normal que les jeunes {{c1::veuillent}} être indépendants. (vouloir)
? Crois-tu que l'Europe {{c1::soit}} importante ? (être)

# g4-discours-indirect | Indirekte Rede | Il dit que … / Il a dit que …
> **Einleitung im Präsens**: Zeiten bleiben, nur Personen ändern sich. „Je suis fatigué.“ → Il dit qu'il **est** fatigué.
> **Einleitung in der Vergangenheit**: Die Zeiten verschieben sich.
> présent → imparfait · passé composé → plus-que-parfait · futur → conditionnel · impératif → **de** + Infinitiv
> „Je viendrai.“ → Elle a dit qu'elle **viendrait**. · „Viens !“ → Il m'a dit **de venir**.
> Fragen: Il demande **si** … · Il demande **ce que** … (was)
> aujourd'hui → ce jour-là · demain → le lendemain · hier → la veille
? „J'ai faim.“ → Paul dit qu'il {{c1::a}} faim.
? „Je suis malade.“ → Elle a dit qu'elle {{c1::était}} malade.
? „Je partirai demain.“ → Il a dit qu'il {{c1::partirait}} le lendemain.
? „J'ai perdu mon portable.“ → Elle a dit qu'elle {{c1::avait perdu}} son portable.
? „Ferme la porte !“ → Ma mère m'a dit {{c1::de}} fermer la porte.
? „Tu viens ?“ → Il m'a demandé {{c1::si}} je venais.
? „Qu'est-ce que tu fais ?“ → Elle m'a demandé {{c1::ce que}} je faisais.
? „Nous habitons à Lyon.“ → Ils ont dit qu'ils {{c1::habitaient}} à Lyon.
? „Je l'ai vu hier.“ → Il a dit qu'il l'avait vu {{c1::la veille}}.

# g4-passif | Passiv | être + participe passé
> **être** in der passenden Zeit + Partizip (angeglichen) + **par** + Urheber.
> La tour Eiffel **a été construite** par Gustave Eiffel. Les résultats **seront publiés** demain.
> Im Alltag ersetzt man das Passiv oft durch **on**: On parle français ici.
> oder ein reflexives Verb: Ce livre **se vend** bien.
? Le Louvre {{c1::est visité}} par des millions de touristes. (visiter – Präsens)
? La maison {{c1::a été construite}} en 1900. (construire – passé composé)
? Les lettres {{c1::seront envoyées}} demain. (envoyer – futur)
? Le film {{c1::a été tourné}} à Marseille. (tourner)
? Ici, {{c1::on}} parle français.
? Les élèves {{c1::sont interrogés}} par le prof. (interroger)
? Cette loi {{c1::a été votée}} en 2005. (voter)
? Ce produit {{c1::se vend}} partout. (se vendre)
? Les déchets {{c1::doivent être triés}}. (trier – müssen)

# g4-gerondif | Gérondif und Partizip Präsens | en lisant
> **Gérondif** = **en** + Partizip Präsens: zeigt Gleichzeitigkeit, Art und Weise oder Bedingung.
> Bildung: Stamm von nous (nous **lis**ons) + **-ant**: en lisant · en faisant · en finissant
> Ausnahmen: être → **étant** · avoir → **ayant** · savoir → **sachant**
> Il écoute de la musique **en travaillant**. (während) · **En travaillant** beaucoup, tu réussiras. (indem)
> Das Subjekt ist dasselbe wie im Hauptsatz.
? Je fais mes devoirs {{c1::en écoutant}} de la musique. (écouter)
? Elle s'est cassé la jambe {{c1::en faisant}} du ski. (faire)
? {{c1::En lisant}} beaucoup, on apprend du vocabulaire. (lire)
? Il chante {{c1::en prenant}} sa douche. (prendre)
? {{c1::En partant}} tôt, nous éviterons les bouchons. (partir)
? Ne parle pas {{c1::en mangeant}} ! (manger)
? On apprend une langue {{c1::en parlant}} avec des natifs. (parler)
? {{c1::Étant}} malade, il est resté au lit. (être)

# g4-plus-que-parfait | Plus-que-parfait | j'avais fini
> Die Vorvergangenheit: was **vor** einem anderen vergangenen Ereignis schon passiert war.
> **avoir / être** im Imparfait + Partizip: j'avais mangé · elle était partie
> Quand je suis arrivé, le film **avait** déjà **commencé**.
> Dieselben Regeln für être und die Angleichung wie beim Passé composé.
? Quand nous sommes arrivés, le train {{c1::était parti}}. (partir)
? Il m'a dit qu'il {{c1::avait perdu}} ses clés. (perdre)
? J'{{c1::avais fini}} mes devoirs avant le dîner. (finir)
? Elle n'{{c1::avait}} jamais {{c2::vu}} la mer avant. (voir)
? Nous {{c1::avions réservé}} une chambre. (réserver)
? Ils {{c1::étaient rentrés}} tard. (rentrer)
? Tu {{c1::avais lu}} le livre avant de voir le film ? (lire)
? Quand je l'ai appelée, elle {{c1::s'était}} déjà couchée.
`;

// Seven blocks after the NRW Kernlehrplan Französisch.
const blocks = [
  ["v1-salut", "v1-famille", "v1-college", "g1-articles", "g1-etre-avoir", "g1-er-verbes"],
  ["v1-loisirs", "v1-maison", "v1-nourriture", "g1-negation", "g1-questions", "g1-aller-futur"],
  ["v2-ville", "v2-vetements", "v2-journee", "g2-adjectifs", "g2-passe-compose", "g2-pronoms-cod"],
  ["v2-vacances", "v2-medias", "v2-sentiments", "g2-imparfait", "g2-imparfait-pc", "g2-futur"],
  ["v3-francophonie", "v3-avenir", "v3-environnement", "g3-subjonctif", "g3-conditionnel", "g3-relatifs"],
  ["v4-banlieue", "v4-immigration", "v4-analyse", "v4-opinion", "g4-si", "g4-subjonctif-opinion", "g4-discours-indirect"],
  ["v4-europe", "v4-numerique", "v4-afrique", "g4-passif", "g4-gerondif", "g4-plus-que-parfait"],
];

export default { units: parseCourse(text), blocks };
