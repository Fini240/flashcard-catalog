// The Italian course (after the NRW Kernlehrplan Italienisch, Sek I and II).
// Format: see parseCourse in src/courses.js. Italian | German.
import { parseCourse } from "../courses.js";

const text = `
# v1-ciao | Ciao! | Begrüßen, vorstellen, Zahlen
ciao | hallo; tschüss
buongiorno | guten Morgen / guten Tag
buonasera | guten Abend
arrivederci | auf Wiedersehen
a presto | bis bald
Come stai? | Wie geht's dir?
sto bene, grazie | mir geht's gut, danke
Come ti chiami? | Wie heißt du?
mi chiamo … | ich heiße …
Di dove sei? | Woher kommst du?
sono tedesco / tedesca | ich bin Deutscher / Deutsche
Quanti anni hai? | Wie alt bist du?
ho sedici anni | ich bin sechzehn
Dove abiti? | Wo wohnst du?
abito a … | ich wohne in …
piacere | angenehm, freut mich
il ragazzo / la ragazza | der Junge / das Mädchen
l'amico / l'amica | der Freund / die Freundin
per favore | bitte
grazie | danke
prego | bitte sehr, gern geschehen
scusa / scusi | Entschuldigung (du / Sie)
sì / no | ja / nein
uno, due, tre | eins, zwei, drei
quattro, cinque, sei | vier, fünf, sechs
sette, otto, nove, dieci | sieben, acht, neun, zehn
venti, trenta | zwanzig, dreißig
cento, mille | hundert, tausend

# v1-famiglia | La famiglia | Familie und Aussehen
la famiglia | die Familie
i genitori | die Eltern
la madre / la mamma | die Mutter / Mama
il padre / il papà | der Vater / Papa
il fratello / la sorella | der Bruder / die Schwester
il figlio / la figlia | der Sohn / die Tochter
i nonni | die Großeltern
il nonno / la nonna | der Großvater / die Großmutter
lo zio / la zia | der Onkel / die Tante
il cugino / la cugina | der Cousin / die Cousine
il cane / il gatto | der Hund / die Katze
alto / alta | groß
basso / bassa | klein
magro / magra | schlank
biondo / bionda | blond
bruno / bruna | dunkelhaarig
i capelli | die Haare
gli occhi | die Augen
simpatico / simpatica | sympathisch
antipatico / antipatica | unsympathisch
divertente | lustig
timido / timida | schüchtern
gentile | freundlich
giovane / anziano | jung / alt
andare d'accordo con | sich verstehen mit
figlio unico | Einzelkind

# v1-scuola | A scuola | Schule und Unterricht
la scuola | die Schule
la scuola media | die Mittelschule (Kl. 6–8)
il liceo | das Gymnasium (Oberstufe)
la classe | die Klasse
l'aula | das Klassenzimmer
il professore / la professoressa | der Lehrer / die Lehrerin
lo studente / la studentessa | der Schüler / die Schülerin
la materia | das Schulfach
la matematica | Mathematik
la storia | Geschichte
l'inglese | Englisch
l'educazione fisica | Sport (Schulfach)
l'orario | der Stundenplan
l'intervallo | die Pause
il compito in classe | die Klassenarbeit
i compiti | die Hausaufgaben
il voto | die Note
il libro | das Buch
il quaderno | das Heft
la penna | der Stift
lo zaino | der Rucksack
studiare | lernen
imparare | lernen (sich aneignen)
capire | verstehen
spiegare | erklären
facile / difficile | leicht / schwierig
noioso / noiosa | langweilig

# v1-tempolibero | Il tempo libero | Freizeit und Hobbys
il tempo libero | die Freizeit
giocare a calcio | Fußball spielen
suonare la chitarra | Gitarre spielen
fare sport | Sport treiben
andare in bicicletta | Fahrrad fahren
nuotare | schwimmen
ballare | tanzen
cantare | singen
ascoltare musica | Musik hören
leggere | lesen
guardare la TV | fernsehen
andare al cinema | ins Kino gehen
uscire con gli amici | mit Freunden ausgehen
la partita | das Spiel
la squadra | die Mannschaft
la piscina | das Schwimmbad
il film | der Film
la canzone | das Lied
disegnare | zeichnen
passeggiare | spazieren gehen
mi piace | mir gefällt
adoro | ich liebe
spesso | oft
qualche volta | manchmal
mai | nie
sempre | immer
il fine settimana | das Wochenende

# v1-casa | La casa | Wohnung und Zimmer
la casa | das Haus, das Zuhause
l'appartamento | die Wohnung
la camera | das Zimmer
la mia stanza | mein Zimmer
la cucina | die Küche
il soggiorno | das Wohnzimmer
il bagno | das Badezimmer
il giardino | der Garten
il balcone | der Balkon
la scala | die Treppe
il piano | das Stockwerk
la porta | die Tür
la finestra | das Fenster
il letto | das Bett
il tavolo | der Tisch
la sedia | der Stuhl
l'armadio | der Schrank
il divano | das Sofa
il computer | der Computer
sopra / sotto | auf / unter
davanti a / dietro | vor / hinter
accanto a | neben
tra / fra | zwischen
a destra / a sinistra | rechts / links
c'è / ci sono | es gibt
ordinato / ordinata | ordentlich

# v1-cibo | Mangiare e bere | Essen, Trinken, Einkaufen
la colazione | das Frühstück
il pranzo | das Mittagessen
la cena | das Abendessen
mangiare | essen
bere | trinken
avere fame | Hunger haben
avere sete | Durst haben
il pane | das Brot
il formaggio | der Käse
il prosciutto | der Schinken
la carne | das Fleisch
il pollo | das Hähnchen
il pesce | der Fisch
la pasta | die Nudeln
il riso | der Reis
la pizza | die Pizza
la verdura | das Gemüse
la frutta | das Obst
la mela | der Apfel
il latte | die Milch
l'acqua | das Wasser
il succo | der Saft
il gelato | das Eis
il caffè | der Kaffee
Quanto costa? | Wie viel kostet das?
vorrei | ich hätte gern
buono / buona | gut, lecker
il conto, per favore | die Rechnung, bitte

# v2-citta | In città | Stadt, Wege, Verkehr
la città | die Stadt
il paese | das Dorf; das Land
il quartiere | das Viertel
la via / la strada | die Straße
la piazza | der Platz
il centro | das Zentrum
il negozio | das Geschäft
il supermercato | der Supermarkt
il mercato | der Markt
il museo | das Museum
la chiesa | die Kirche
il duomo | der Dom
la stazione | der Bahnhof
la fermata dell'autobus | die Bushaltestelle
il treno | der Zug
la macchina | das Auto
a piedi | zu Fuß
il semaforo | die Ampel
sempre dritto | geradeaus
girare | abbiegen
attraversare | überqueren
vicino a / lontano da | nahe bei / weit weg von
Dov'è …? | Wo ist …?
prendere l'autobus | den Bus nehmen
la farmacia | die Apotheke
l'ospedale | das Krankenhaus

# v2-vestiti | I vestiti | Kleidung, Farben, Mode
i vestiti | die Kleidung
la maglietta | das T-Shirt
la camicia | das Hemd
il maglione | der Pullover
la felpa | das Sweatshirt
i pantaloni | die Hose
i jeans | die Jeans
la gonna | der Rock
il vestito | das Kleid; der Anzug
la giacca | die Jacke
il cappotto | der Mantel
le scarpe | die Schuhe
le scarpe da ginnastica | die Turnschuhe
la taglia | die Größe
provare | anprobieren
portare | tragen
caro / cara | teuer
economico / economica | billig
i saldi | der Schlussverkauf
la moda | die Mode
rosso / rossa | rot
azzurro / azzurra | hellblau
verde | grün
giallo / gialla | gelb
nero / nera | schwarz
bianco / bianca | weiß

# v2-giornata | La mia giornata | Tagesablauf und Uhrzeit
svegliarsi | aufwachen
alzarsi | aufstehen
fare la doccia | duschen
lavarsi i denti | sich die Zähne putzen
vestirsi | sich anziehen
uscire di casa | das Haus verlassen
arrivare | ankommen
tornare a casa | nach Hause kommen
andare a letto | ins Bett gehen
dormire | schlafen
la mattina | der Morgen; morgens
il pomeriggio | der Nachmittag
la sera | der Abend
la notte | die Nacht
presto / tardi | früh / spät
prima | zuerst
poi | dann
dopo | danach
alla fine | schließlich
ogni giorno | jeden Tag
Che ore sono? | Wie spät ist es?
sono le otto | es ist acht Uhr
e mezza | halb (… Uhr dreißig)
lunedì, martedì, mercoledì | Montag, Dienstag, Mittwoch
giovedì, venerdì | Donnerstag, Freitag
sabato, domenica | Samstag, Sonntag
stanco / stanca | müde

# v2-vacanze | Le vacanze | Ferien, Reisen, Wetter
le vacanze | die Ferien
il viaggio | die Reise
viaggiare | reisen
all'estero | im Ausland
la spiaggia | der Strand
il mare | das Meer
la montagna | das Gebirge
il lago | der See
l'albergo | das Hotel
l'ostello | die Jugendherberge
il campeggio | der Campingplatz
prenotare | buchen, reservieren
il biglietto | die Fahrkarte
l'aereo | das Flugzeug
l'aeroporto | der Flughafen
la valigia | der Koffer
il passaporto | der Reisepass
visitare | besichtigen
lo scambio | der Austausch
divertirsi | Spaß haben
fa bel tempo | es ist schönes Wetter
piove | es regnet
fa caldo / fa freddo | es ist warm / kalt
c'è il sole | die Sonne scheint
la primavera, l'estate | der Frühling, der Sommer
l'autunno, l'inverno | der Herbst, der Winter

# v2-media | I media | Handy, Internet, soziale Netzwerke
il cellulare | das Handy
il portatile | der Laptop
lo schermo | der Bildschirm
internet | das Internet
il social network | das soziale Netzwerk
l'app | die App
il messaggio | die Nachricht
mandare un messaggio | eine Nachricht schicken
la password | das Passwort
scaricare | herunterladen
condividere | teilen
pubblicare | veröffentlichen, posten
il follower | der Follower
il video | das Video
navigare in internet | im Internet surfen
cercare | suchen
essere dipendente da | abhängig sein von
il cyberbullismo | das Cybermobbing
la privacy | die Privatsphäre
le notizie false | die Falschmeldungen
il vantaggio | der Vorteil
lo svantaggio | der Nachteil
la pubblicità | die Werbung
il videogioco | das Videospiel
la serie | die Serie

# v2-sentimenti | Amicizia e sentimenti | Freundschaft und Gefühle
l'amicizia | die Freundschaft
il migliore amico / la migliore amica | der beste Freund / die beste Freundin
il ragazzo / la ragazza (fidanzati) | der feste Freund / die feste Freundin
innamorarsi di | sich verlieben in
fidarsi di | vertrauen
aiutare | helfen
litigare | streiten
fare pace | sich versöhnen
chiedere scusa | sich entschuldigen
mi manchi | du fehlst mir
contento / contenta | froh
felice | glücklich
triste | traurig
arrabbiato / arrabbiata | wütend
nervoso / nervosa | nervös
preoccupato / preoccupata | besorgt
geloso / gelosa | eifersüchtig
avere paura | Angst haben
sentirsi solo | sich einsam fühlen
il sentimento | das Gefühl
sincero / sincera | ehrlich
la fiducia | das Vertrauen
il segreto | das Geheimnis
ridere | lachen
piangere | weinen

# v3-italia | L'Italia | Regionen, Geschichte, Kultur
la regione | die Region
la capitale | die Hauptstadt
il Nord / il Sud | der Norden / der Süden
il Mezzogiorno | Süditalien
la Toscana | die Toskana
la Lombardia | die Lombardei
la Sicilia | Sizilien
la Sardegna | Sardinien
Venezia | Venedig
Firenze | Florenz
Napoli | Neapel
il dialetto | der Dialekt
l'unità d'Italia | die Einigung Italiens
il Risorgimento | das Risorgimento
la Repubblica | die Republik
il Rinascimento | die Renaissance
l'Impero romano | das Römische Reich
il patrimonio culturale | das Kulturerbe
l'opera | die Oper
la gastronomia | die Gastronomie
il made in Italy | das Made in Italy
l'emigrazione italiana | die italienische Auswanderung
il divario Nord-Sud | das Nord-Süd-Gefälle
la mafia | die Mafia
la legalità | die Rechtsstaatlichkeit

# v3-futuro | Lavoro e futuro | Beruf, Ausbildung, Zukunft
il futuro | die Zukunft
il lavoro | die Arbeit
il mestiere | der Beruf (Handwerk)
la professione | der Beruf
il posto di lavoro | der Arbeitsplatz
lo stipendio | das Gehalt
l'azienda | das Unternehmen
il capo | der Chef
lo stage | das Praktikum
la formazione | die Ausbildung
l'università | die Universität
la laurea | der Studienabschluss
la maturità | das Abitur (Italien)
il curriculum | der Lebenslauf
il colloquio di lavoro | das Vorstellungsgespräch
candidarsi | sich bewerben
l'esperienza | die Erfahrung
la disoccupazione | die Arbeitslosigkeit
il precariato | die prekäre Beschäftigung
la fuga dei cervelli | die Abwanderung von Fachkräften
guadagnare | verdienen
avere successo | Erfolg haben
il sogno | der Traum
il medico | der Arzt / die Ärztin
l'avvocato | der Anwalt / die Anwältin
l'ingegnere | der Ingenieur / die Ingenieurin

# v3-ambiente | L'ambiente | Umwelt und Klima
l'ambiente | die Umwelt
il cambiamento climatico | der Klimawandel
il riscaldamento globale | die Erderwärmung
l'inquinamento | die Verschmutzung
inquinare | verschmutzen
i rifiuti | der Müll
la raccolta differenziata | die Mülltrennung
riciclare | recyceln
la plastica | das Plastik
la siccità | die Dürre
l'alluvione | die Überschwemmung
l'incendio | der Brand
l'energia rinnovabile | die erneuerbare Energie
l'energia solare | die Sonnenenergie
risparmiare energia | Energie sparen
sostenibile | nachhaltig
proteggere | schützen
la specie in via d'estinzione | die bedrohte Art
il consumo | der Verbrauch
sprecare | verschwenden
lo spreco | die Verschwendung
la manifestazione | die Demonstration
a lungo termine | langfristig
il pianeta | der Planet
l'acqua alta | das Hochwasser (Venedig)

# v4-migrazione | Migrazione | Ein- und Auswanderung, Integration
la migrazione | die Migration
emigrare | auswandern
immigrare | einwandern
l'immigrato / l'immigrata | der Einwanderer / die Einwanderin
il profugo / il rifugiato | der Flüchtling
il richiedente asilo | der Asylbewerber
lo sbarco | die Landung (von Booten)
il barcone | das Flüchtlingsboot
Lampedusa | Lampedusa
il Mediterraneo | das Mittelmeer
il paese d'origine | das Herkunftsland
il permesso di soggiorno | die Aufenthaltsgenehmigung
la cittadinanza | die Staatsbürgerschaft
l'integrazione | die Integration
integrarsi | sich integrieren
la discriminazione | die Diskriminierung
il razzismo | der Rassismus
il pregiudizio | das Vorurteil
l'accoglienza | die Aufnahme
la seconda generazione | die zweite Generation
gli italiani all'estero | die Auslandsitaliener
la valigia di cartone | der Pappkoffer (Symbol der Auswanderer)
le radici | die Wurzeln
l'identità | die Identität
la convivenza | das Zusammenleben

# v4-giovani | Giovani di oggi | Jugend, Werte, Zukunftsangst
i giovani | die Jugendlichen
l'adolescenza | die Jugendzeit
crescere | aufwachsen
diventare adulto | erwachsen werden
l'indipendenza | die Unabhängigkeit
i bamboccioni | die „Nesthocker“
vivere con i genitori | bei den Eltern wohnen
i valori | die Werte
il volontariato | das Ehrenamt
impegnarsi | sich engagieren
la pressione del gruppo | der Gruppenzwang
il bullismo | das Mobbing
l'autostima | das Selbstwertgefühl
il modello | das Vorbild
la generazione | die Generation
il conflitto generazionale | der Generationenkonflikt
l'incertezza | die Unsicherheit
la speranza | die Hoffnung
il disagio | das Unbehagen, die Not
la libertà | die Freiheit
la responsabilità | die Verantwortung
la movida | das Nachtleben
le regole | die Regeln
ribellarsi | rebellieren

# v4-analisi | Analizzare un testo | Redemittel für Textarbeit
il testo | der Text
il brano | der Auszug
l'articolo | der Artikel
il romanzo | der Roman
il racconto | die Erzählung
la poesia | das Gedicht
l'autore / l'autrice | der Autor / die Autorin
il narratore / la narratrice | der Erzähler / die Erzählerin
il protagonista | die Hauptfigur
il personaggio | die Figur
il tema | das Thema
il testo tratta di … | der Text handelt von …
si tratta di … | es geht um …
riassumere | zusammenfassen
il riassunto | die Zusammenfassung
analizzare | analysieren
la figura retorica | das Stilmittel
la metafora | die Metapher
il paragone | der Vergleich
la domanda retorica | die rhetorische Frage
l'ironia | die Ironie
l'intenzione | die Absicht
innanzitutto | zunächst
inoltre | außerdem
in conclusione | abschließend
secondo me | meiner Meinung nach
penso che + cong. | ich denke, dass
non sono d'accordo | ich bin nicht einverstanden
tuttavia | jedoch
quindi | also, deshalb
benché + cong. | obwohl

# v4-europa | Italia ed Europa | EU, Geschichte, Gesellschaft
l'Unione europea | die Europäische Union
europeo / europea | europäisch
l'euro | der Euro
il confine | die Grenze
la cooperazione | die Zusammenarbeit
il fascismo | der Faschismus
Mussolini | Mussolini
la Resistenza | der Widerstand (1943–45)
la Liberazione | die Befreiung
la Costituzione | die Verfassung
il dopoguerra | die Nachkriegszeit
il miracolo economico | das Wirtschaftswunder
gli anni di piombo | die bleiernen Jahre (Terrorismus)
il governo | die Regierung
il parlamento | das Parlament
le elezioni | die Wahlen
votare | wählen
il cittadino / la cittadina | der Bürger / die Bürgerin
la democrazia | die Demokratie
il populismo | der Populismus
la crisi economica | die Wirtschaftskrise
il turismo di massa | der Massentourismus
il patrimonio dell'UNESCO | das UNESCO-Welterbe
la globalizzazione | die Globalisierung

# v4-digitale | Il mondo digitale | Digitalisierung und Gesellschaft
il digitale | das Digitale
l'intelligenza artificiale | die künstliche Intelligenz
l'algoritmo | der Algorithmus
i dati personali | die persönlichen Daten
la protezione dei dati | der Datenschutz
la sorveglianza | die Überwachung
la dipendenza | die Abhängigkeit
il tempo davanti allo schermo | die Bildschirmzeit
disconnettersi | abschalten, offline gehen
l'influencer | der Influencer / die Influencerin
lo smart working | das Arbeiten im Homeoffice
il commercio online | der Onlinehandel
il divario digitale | die digitale Kluft
il progresso | der Fortschritt
la minaccia | die Bedrohung
il rischio | das Risiko
la disinformazione | die Desinformation
verificare una fonte | eine Quelle prüfen
affidabile | zuverlässig
lo spirito critico | das kritische Denken
la libertà di espressione | die Meinungsfreiheit
regolamentare | regulieren
l'innovazione | die Innovation

# g1-articoli | Artikel und Plural | il, lo, la, i, gli, le
> Männlich: **il** (vor Konsonant) · **lo** (vor s + Konsonant, z, gn, ps, y) · **l'** (vor Vokal)
> Weiblich: **la** · **l'** (vor Vokal)
> Plural: il → **i** · lo / l' (m.) → **gli** · la / l' (f.) → **le**
> il libro → i libri · lo zaino → gli zaini · l'amico → gli amici · la casa → le case
> Endungen: -o → **-i** · -a → **-e** · -e → **-i** (il cane → i cani)
> Unbestimmt: **un** (m.), **uno** (vor s + Kons., z), **una** (f.), **un'** (f. vor Vokal)
? {{c1::Il}} libro è sul tavolo.
? {{c1::Lo}} zaino di Marco è pesante.
? {{c1::Gli}} amici di Anna sono simpatici.
? {{c1::Le}} ragazze vanno a scuola.
? Ho {{c1::un}} fratello e {{c2::una}} sorella.
? Mio padre ha {{c1::uno}} zio a Napoli.
? Abbiamo due {{c1::cani}}. (cane)
? {{c1::L'}}amica di Luca si chiama Giulia.
? Compro due {{c1::mele}} al mercato. (mela)
? {{c1::I}} ragazzi giocano a calcio.

# g1-essere-avere | essere und avere | Ich bin, ich habe
> **essere**: sono · sei · è · siamo · siete · sono
> **avere**: ho · hai · ha · abbiamo · avete · hanno
> Das h in ho, hai, ha, hanno spricht man nicht.
> Subjektpronomen lässt man meist weg: (Io) sono tedesco.
> Alter mit **avere**: Ho quindici anni. · Hunger/Durst/Angst: avere fame, sete, paura
? Io {{c1::sono}} tedesco.
? Tu {{c1::hai}} un gatto?
? Marco {{c1::è}} molto simpatico.
? Noi {{c1::abbiamo}} un compito domani.
? Voi {{c1::siete}} di Roma?
? I miei nonni {{c1::hanno}} una casa al mare.
? Io {{c1::ho}} fame!
? Le ragazze {{c1::sono}} in piscina.
? Quanti anni {{c1::hai}}?

# g1-presente | Präsens | parlare, prendere, dormire, finire
> Drei Konjugationen: **-are**, **-ere**, **-ire**.
> **parlare**: parlo · parli · parla · parliamo · parlate · parlano
> **prendere**: prendo · prendi · prende · prendiamo · prendete · prendono
> **dormire**: dormo · dormi · dorme · dormiamo · dormite · dormono
> Viele -ire-Verben schieben **-isc-** ein: **capire**: capisco · capisci · capisce · capiamo · capite · capiscono
> Achte auf die Betonung bei loro: **par**lano, **pren**dono.
? Io {{c1::parlo}} un po' d'italiano. (parlare)
? Tu {{c1::abiti}} a Milano? (abitare)
? Noi {{c1::prendiamo}} il treno. (prendere)
? Voi {{c1::leggete}} molto. (leggere)
? Loro {{c1::dormono}} fino a tardi. (dormire)
? Non {{c1::capisco}} la domanda. (capire)
? Mia sorella {{c1::studia}} medicina. (studiare)
? Gli studenti {{c1::finiscono}} alle due. (finire)
? Che cosa {{c1::mangiate}} stasera? (mangiare)
? Marco {{c1::scrive}} un messaggio. (scrivere)

# g1-negazione | Verneinung und Fragen | non, mai, niente – chi, dove, quando
> Verneinung: **non** vor das Verb: Non parlo francese.
> Doppelte Verneinung ist normal: **Non** mangio **mai** carne. **Non** vedo **niente**. **Non** c'è **nessuno**.
> Fragewörter: **chi** (wer) · **che cosa / cosa** (was) · **dove** (wo) · **quando** (wann) · **come** (wie) · **perché** (warum; weil) · **quanto/a/i/e** (wie viel)
> Fragen haben dieselbe Wortstellung wie Aussagen – nur die Stimme steigt.
? {{c1::Non}} parlo cinese.
? Non mangio {{c1::mai}} pesce. (nie)
? Non capisco {{c1::niente}}. (nichts)
? Non c'è {{c1::nessuno}} in classe. (niemand)
? {{c1::Dove}} abiti?
? {{c1::Come}} ti chiami?
? {{c1::Perché}} studi l'italiano? – {{c2::Perché}} mi piace.
? {{c1::Quanti}} anni ha tuo fratello?
? {{c1::Chi}} è la tua professoressa?
? {{c1::Quando}} parti per le vacanze?

# g1-preposizioni | Präpositionen mit Artikel | al, nel, dal …
> Die Präpositionen di, a, da, in, su verschmelzen mit dem Artikel:
> a + il = **al** · a + la = **alla** · a + i = **ai** · a + le = **alle**
> in + il = **nel** · in + la = **nella** · in + i = **nei**
> di + il = **del** · da + il = **dal** · su + il = **sul**
> Vado **al** cinema. Il libro è **sul** tavolo. Vengo **dalla** stazione.
> Ohne Artikel: a casa, in Italia, a Roma, a scuola
? Vado {{c1::al}} cinema stasera. (a + il)
? Il gatto è {{c1::sul}} divano. (su + il)
? Abito {{c1::nella}} casa gialla. (in + la)
? Vengo {{c1::dalla}} stazione. (da + la)
? Il libro {{c1::del}} professore è nuovo. (di + il)
? Scrivo {{c1::ai}} miei amici. (a + i)
? Le chiavi sono {{c1::nel}} cassetto. (in + il)
? Torno {{c1::a}} casa alle sei.
? Abitiamo {{c1::in}} Germania.

# g1-andare-fare | Unregelmäßige Verben | andare, fare, venire, volere …
> **andare**: vado · vai · va · andiamo · andate · vanno
> **fare**: faccio · fai · fa · facciamo · fate · fanno
> **venire**: vengo · vieni · viene · veniamo · venite · vengono
> **volere**: voglio · vuoi · vuole · vogliamo · volete · vogliono
> **potere**: posso · puoi · può · possiamo · potete · possono
> **dovere**: devo · devi · deve · dobbiamo · dovete · devono
> **uscire**: esco · esci · esce · usciamo · uscite · escono
? Domani {{c1::vado}} a Firenze. (andare)
? Che cosa {{c1::fai}} stasera? (fare)
? {{c1::Vieni}} alla mia festa? (venire)
? Io {{c1::voglio}} un gelato. (volere)
? Non {{c1::posso}} uscire oggi. (potere)
? Noi {{c1::dobbiamo}} studiare. (dovere)
? I miei amici {{c1::vanno}} al mare. (andare)
? Io {{c1::esco}} con Giulia. (uscire)
? Voi {{c1::fate}} sport? (fare)

# g2-passato-prossimo | Passato prossimo | ho mangiato, sono andato
> Für abgeschlossene Handlungen: **avere** oder **essere** + Partizip.
> Partizip: -are → **-ato** · -ere → **-uto** · -ire → **-ito**
> Unregelmäßig: fare → fatto · prendere → preso · vedere → visto · leggere → letto · scrivere → scritto · dire → detto · aprire → aperto · essere → stato · venire → venuto · mettere → messo
> **essere** bei Bewegung und Zustandsänderung (andare, venire, partire, arrivare, uscire, tornare, restare, nascere) und bei reflexiven Verben – dann passt sich das Partizip an: Giulia è andat**a**. Siamo partit**i**.
? Ieri {{c1::ho mangiato}} una pizza. (mangiare)
? Hai {{c1::finito}} i compiti? (finire)
? Abbiamo {{c1::visto}} un bel film. (vedere)
? Giulia {{c1::è andata}} a Roma. (andare)
? I ragazzi {{c1::sono arrivati}} tardi. (arrivare)
? Che cosa {{c1::hai fatto}} il fine settimana? (fare)
? Ho {{c1::preso}} l'autobus. (prendere)
? Mia sorella {{c1::è nata}} nel 2010. (nascere)
? Ci {{c1::siamo alzati}} presto. (alzarsi)
? Avete {{c1::letto}} questo libro? (leggere)

# g2-riflessivi | Reflexive Verben und piacere | mi alzo – mi piace
> Reflexivpronomen: **mi · ti · si · ci · vi · si** + Verb: mi alzo, ti svegli, si lava …
> Im passato prossimo immer mit **essere**: Mi sono alzato/a.
> ## piacere
> Wörtlich „gefallen“: Das Verb richtet sich nach dem, was gefällt.
> **mi piace** la pizza / ballare · **mi piacciono** i cani
> Pronomen: mi · ti · gli (ihm) · le (ihr) · ci · vi · gli (ihnen)
> Vergangenheit mit essere: Mi **è piaciuto** il film. Mi **sono piaciute** le canzoni.
? Io {{c1::mi}} alzo alle sette.
? A che ora {{c1::ti}} svegli?
? Marco {{c1::si}} lava i denti.
? Noi {{c1::ci}} divertiamo molto.
? Mi {{c1::piace}} il gelato.
? Ti {{c1::piacciono}} i film d'azione?
? A Luca {{c1::piace}} il calcio. (piacere)
? A Giulia {{c1::piace}} cantare.
? Ieri mi {{c1::sono}} svegliato tardi.
? Il concerto mi è {{c1::piaciuto}} molto.

# g2-imperfetto | Imperfetto | giocavo, ero
> Für Beschreibungen, Gewohnheiten, Hintergründe: „früher“, „immer“, „als ich klein war“.
> -are: gioc**avo** · gioc**avi** · gioc**ava** · gioc**avamo** · gioc**avate** · gioc**avano**
> -ere: legg**evo** … · -ire: dorm**ivo** …
> **essere**: ero · eri · era · eravamo · eravate · erano
> fare → facevo · bere → bevevo · dire → dicevo
> **Imperfetto** = Bühne (wie es war), **passato prossimo** = Handlung (was passierte): Dormivo quando è suonato il telefono.
? Da piccolo {{c1::giocavo}} sempre a calcio. (giocare)
? Quando {{c1::ero}} bambina, abitavo a Bari. (essere)
? Ogni estate {{c1::andavamo}} al mare. (andare)
? Faceva caldo e il sole {{c1::splendeva}}. (splendere)
? I miei nonni non {{c1::avevano}} la televisione. (avere)
? Mentre {{c1::studiavo}}, mio fratello guardava la TV. (studiare)
? {{c1::Dormivo}} quando è suonato il telefono. (dormire)
? Che cosa {{c1::facevi}} da piccolo? (fare)
? Ieri {{c1::è suonato}} il telefono mentre mangiavo. (suonare – passato prossimo)

# g2-pronomi | Objektpronomen | lo, la, gli, le, ne
> ## direkt (wen? was?)
> mi · ti · **lo / la** · ci · vi · **li / le** – Vedi Marco? Sì, **lo** vedo.
> ## indirekt (wem?)
> mi · ti · **gli** (ihm) · **le** (ihr; Ihnen) · ci · vi · **gli** (ihnen)
> Das Pronomen steht vor dem konjugierten Verb; beim Infinitiv wird es angehängt: Voglio veder**lo**. / **Lo** voglio vedere.
> **ne** ersetzt eine Menge oder „davon“: Quante mele vuoi? **Ne** voglio due.
> Im passato prossimo passt sich das Partizip an lo/la/li/le an: **L**'ho vist**a**.
? Conosci Paolo? – Sì, {{c1::lo}} conosco.
? Hai la chiave? – No, non {{c1::la}} ho.
? Telefoni a tua madre? – Sì, {{c1::le}} telefono.
? Scrivi a Marco? – Sì, {{c1::gli}} scrivo.
? Dove sono i libri? Non {{c1::li}} trovo.
? Quanti fratelli hai? – {{c1::Ne}} ho due.
? Questo film voglio veder{{c1::lo}} stasera.
? Hai visto Giulia? – Sì, l'ho {{c1::vista}} ieri.
? Ci {{c1::vediamo}} domani! (vedersi)

# g3-futuro | Futuro semplice | parlerò, sarò
> Für Pläne, Vorhersagen und Vermutungen.
> -are/-ere: parl**erò** · prend**erò** · -ire: dorm**irò**
> Endungen: -ò · -ai · -à · -emo · -ete · -anno
> Unregelmäßig: essere → **sarò** · avere → **avrò** · fare → **farò** · andare → **andrò** · venire → **verrò** · potere → **potrò** · volere → **vorrò** · dovere → **dovrò** · vedere → **vedrò**
> Vermutung: Che ore sono? – **Saranno** le otto. (Es wird wohl acht sein.)
? Domani {{c1::pioverà}}. (piovere)
? Da grande {{c1::sarò}} medico. (essere)
? Quest'estate {{c1::andremo}} in Sicilia. (andare)
? {{c1::Avrai}} tempo domani? (avere)
? I miei genitori {{c1::verranno}} alla festa. (venire)
? Ti {{c1::chiamerò}} stasera. (chiamare)
? Che cosa {{c1::farete}} dopo la maturità? (fare)
? Non so dov'è Marco. {{c1::Sarà}} a casa. (essere – Vermutung)
? {{c1::Potremo}} venire anche noi? (potere)

# g3-congiuntivo | Congiuntivo presente | penso che sia
> Nach Meinung, Wunsch, Gefühl, Zweifel und bestimmten Konjunktionen.
> -are: parl**i** · parl**i** · parl**i** · parl**iamo** · parl**iate** · parl**ino**
> -ere / -ire: prend**a** · prend**a** · prend**a** · prend**iamo** · prend**iate** · prend**ano**
> Unregelmäßig: essere → **sia** · avere → **abbia** · fare → **faccia** · andare → **vada** · venire → **venga** · potere → **possa** · volere → **voglia**
> Auslöser: penso che, credo che, voglio che, spero che, è importante che, bisogna che, benché, affinché, prima che
? Penso che Marco {{c1::sia}} simpatico. (essere)
? Spero che tu {{c1::abbia}} ragione. (avere)
? Voglio che voi {{c1::veniate}} con noi. (venire)
? È importante che tu {{c1::studi}} ogni giorno. (studiare)
? Credo che i ragazzi {{c1::giochino}} a calcio. (giocare)
? Benché {{c1::piova}}, usciamo. (piovere)
? Bisogna che noi {{c1::partiamo}} presto. (partire)
? Mia madre vuole che io {{c1::faccia}} i compiti. (fare)
? Non credo che lui {{c1::possa}} venire. (potere)

# g3-condizionale | Condizionale | vorrei, mi piacerebbe
> Für Wünsche, höfliche Bitten und Ratschläge.
> Stamm des Futuro + Endungen: **-ei · -esti · -ebbe · -emmo · -este · -ebbero**
> parlare → parlerei · essere → sarei · avere → avrei · fare → farei · volere → vorrei · potere → potrei · dovere → dovrei
> **Vorrei** un caffè. **Potresti** aiutarmi? Al tuo posto **parlerei** con lui. **Mi piacerebbe** …
? {{c1::Vorrei}} un cappuccino, per favore. (volere)
? {{c1::Potresti}} chiudere la finestra? (potere)
? Mi {{c1::piacerebbe}} vivere a Roma. (piacere)
? Al tuo posto {{c1::parlerei}} con il professore. (parlare)
? {{c1::Sarebbe}} bello andare al mare. (essere)
? Che cosa {{c1::faresti}} con un milione di euro? (fare)
? Noi {{c1::dovremmo}} studiare di più. (dovere)
? Loro {{c1::preferirebbero}} restare a casa. (preferire)
? {{c1::Avresti}} un momento? (avere)

# g3-relativi | Relativpronomen | che, cui, il quale
> **che** = Subjekt und direktes Objekt, für Personen und Sachen: Il ragazzo **che** parla … Il libro **che** leggo …
> **cui** nach Präposition: la città **in cui** abito · l'amico **con cui** esco · il motivo **per cui** …
> **il quale / la quale / i quali / le quali** ersetzt che oder cui (gehoben, eindeutiger)
> **quello che / ciò che** = „das, was“: Non capisco **quello che** dici.
> **dove** für Orte: la casa **dove** sono nato
? Il ragazzo {{c1::che}} canta è mio fratello.
? Il libro {{c1::che}} leggo è molto bello.
? La città in {{c1::cui}} abito è piccola.
? L'amica con {{c1::cui}} vado al cinema si chiama Sara.
? Non capisco {{c1::quello che}} dici.
? Questo è il motivo per {{c1::cui}} sono qui.
? La casa {{c1::dove}} sono nato è vicino al mare.
? Il professore, {{c1::il quale}} è di Napoli, parla tre lingue.
? È una canzone {{c1::che}} mi piace molto.

# g4-periodo-ipotetico | Bedingungssätze | se avessi, avrei fatto
> ## real
> se + presente, → presente / futuro: Se **piove**, **resto** a casa.
> ## irreal Gegenwart
> se + **congiuntivo imperfetto**, → **condizionale**: Se **avessi** tempo, **leggerei** di più.
> congiuntivo imperfetto: parl**assi**, prend**essi**, dorm**issi** · essere → **fossi** · avere → **avessi** · fare → **facessi**
> ## irreal Vergangenheit
> se + **congiuntivo trapassato**, → **condizionale passato**: Se **avessi studiato**, **avrei passato** l'esame.
? Se {{c1::piove}}, restiamo a casa. (piovere)
? Se {{c1::avessi}} tempo, leggerei di più. (avere)
? Se {{c1::fossi}} ricco, comprerei una villa. (essere)
? Se vivessi a Roma, {{c1::visiterei}} il Colosseo ogni settimana. (visitare)
? Che cosa faresti se {{c1::vincessi}} la lotteria? (vincere)
? Se {{c1::avessi studiato}}, avrei passato l'esame. (studiare)
? Se fossimo partiti prima, non {{c1::avremmo perso}} il treno. (perdere)
? Se tu {{c1::facessi}} sport, staresti meglio. (fare)
? Se lo {{c1::sapessi}}, te lo direi. (sapere)

# g4-passato-remoto | Passato remoto | parlò, fu, ebbe
> Die Vergangenheit der Literatur und Geschichte – in Texten und im Süden auch gesprochen.
> -are: parl**ai** · parl**asti** · parl**ò** · parl**ammo** · parl**aste** · parl**arono**
> -ere: cred**ei/-etti** · cred**esti** · cred**é/-ette** … · -ire: dorm**ii** · dorm**isti** · dorm**ì** …
> Unregelmäßig: essere → **fui**, fosti, **fu**, fummo, foste, **furono** · avere → **ebbi**, avesti, **ebbe** … · fare → feci, fece · dire → dissi, disse · venire → venni, venne · vedere → vidi, vide · nascere → nacque
> Für Prüfungen: erkennen und den Infinitiv zuordnen ist wichtiger als selbst bilden.
? Dante {{c1::nacque}} a Firenze nel 1265. (nascere)
? Garibaldi {{c1::fu}} un eroe del Risorgimento. (essere)
? Colombo {{c1::arrivò}} in America nel 1492. (arrivare)
? I Romani {{c1::costruirono}} molte strade. (costruire)
? Leonardo {{c1::dipinse}} la Gioconda. (dipingere)
? Mio nonno {{c1::emigrò}} in Germania nel 1960. (emigrare)
? Quando lo {{c1::vide}}, si innamorò. (vedere)
? Gli italiani {{c1::votarono}} per la Repubblica nel 1946. (votare)
? Lei {{c1::disse}} di sì. (dire)

# g4-passivo | Passiv und si impersonale | è stato costruito, si dice
> **essere** + Partizip (angeglichen) + **da** + Urheber: Il Colosseo **è stato costruito** dai Romani.
> Mit **venire** statt essere (nur einfache Zeiten), betont den Vorgang: La porta **viene chiusa** alle otto.
> **andare** + Partizip = muss … werden: I rifiuti **vanno separati**.
> **si passivante / impersonale** (man): In Italia **si mangia** bene. Qui **si parlano** molte lingue.
? Il Colosseo {{c1::è stato costruito}} dai Romani. (costruire)
? La Divina Commedia {{c1::è stata scritta}} da Dante. (scrivere)
? Il museo {{c1::viene aperto}} alle nove. (aprire – venire)
? I rifiuti {{c1::vanno separati}}. (separare – müssen)
? In Italia {{c1::si mangia}} molto bene. (mangiare)
? Qui {{c1::si parlano}} tre lingue. (parlare)
? La legge {{c1::sarà approvata}} domani. (approvare – Futur)
? Come {{c1::si dice}} „Hausaufgaben“ in italiano? (dire)
? Le lettere {{c1::sono state spedite}} ieri. (spedire)
`;

const blocks = [
  ["v1-ciao", "v1-famiglia", "v1-scuola", "g1-articoli", "g1-essere-avere", "g1-presente"],
  ["v1-tempolibero", "v1-casa", "v1-cibo", "g1-negazione", "g1-preposizioni", "g1-andare-fare"],
  ["v2-citta", "v2-vestiti", "v2-giornata", "g2-passato-prossimo", "g2-riflessivi"],
  ["v2-vacanze", "v2-media", "v2-sentimenti", "g2-imperfetto", "g2-pronomi"],
  ["v3-italia", "v3-futuro", "v3-ambiente", "g3-futuro", "g3-congiuntivo", "g3-condizionale"],
  ["v4-migrazione", "v4-giovani", "v4-analisi", "g3-relativi", "g4-periodo-ipotetico"],
  ["v4-europa", "v4-digitale", "g4-passato-remoto", "g4-passivo"],
];

export default { units: parseCourse(text), blocks };
