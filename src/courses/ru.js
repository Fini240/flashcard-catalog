// The Russian course (after the NRW Kernlehrplan Russisch, Sek I and II).
// Format: see parseCourse in src/courses.js. Russian | German.
import { parseCourse } from "../courses.js";

const text = `
# v1-alfavit | Алфавит | Das kyrillische Alphabet
А а | a – wie in „Vater“
Б б | b
В в | w
Г г | g
Д д | d
Е е | je – wie in „jetzt“
Ё ё | jo – immer betont
Ж ж | stimmhaftes sch – wie in „Garage“
З з | stimmhaftes s – wie in „Sonne“
И и | i
Й й | j – kurz, wie in „Mai“
К к | k
Л л | l
М м | m
Н н | n
О о | o (unbetont fast wie a)
П п | p
Р р | gerolltes r
С с | stimmloses s – wie in „Haus“
Т т | t
У у | u
Ф ф | f
Х х | ch – wie in „Bach“
Ц ц | z – wie in „Zeit“
Ч ч | tsch
Ш ш | sch
Щ щ | langes, weiches schtsch
Ъ ъ | hartes Zeichen (Trennung)
Ы ы | dumpfes i (hinten gesprochen)
Ь ь | weiches Zeichen (Erweichung)
Э э | e – wie in „Ende“
Ю ю | ju
Я я | ja

# v1-privet | Привет! | Begrüßen, vorstellen, Zahlen
привет | hallo (du)
здравствуйте | guten Tag (Sie)
доброе утро | guten Morgen
добрый вечер | guten Abend
пока | tschüss
до свидания | auf Wiedersehen
Как дела? | Wie geht's?
хорошо, спасибо | gut, danke
нормально | ganz gut
Как тебя зовут? | Wie heißt du?
меня зовут … | ich heiße …
Откуда ты? | Woher kommst du?
я из Германии | ich komme aus Deutschland
Сколько тебе лет? | Wie alt bist du?
мне шестнадцать лет | ich bin sechzehn
очень приятно | sehr angenehm
мальчик / девочка | der Junge / das Mädchen
друг / подруга | der Freund / die Freundin
пожалуйста | bitte
спасибо | danke
извините | Entschuldigung
да / нет | ja / nein
один, два, три | eins, zwei, drei
четыре, пять, шесть | vier, fünf, sechs
семь, восемь, девять | sieben, acht, neun
десять | zehn
двадцать, тридцать | zwanzig, dreißig
сто | hundert

# v1-semya | Моя семья | Familie und Aussehen
семья | die Familie
родители | die Eltern
мама / папа | Mama / Papa
мать / отец | die Mutter / der Vater
брат / сестра | der Bruder / die Schwester
сын / дочь | der Sohn / die Tochter
бабушка / дедушка | die Großmutter / der Großvater
дядя / тётя | der Onkel / die Tante
двоюродный брат | der Cousin
собака / кошка | der Hund / die Katze
высокий / высокая | groß
маленький / маленькая | klein
красивый / красивая | schön
молодой / молодая | jung
старый / старая | alt
весёлый / весёлая | lustig, fröhlich
добрый / добрая | gütig, nett
умный / умная | klug
серьёзный / серьёзная | ernst
волосы | die Haare
глаза | die Augen
он / она | er / sie
у меня есть | ich habe
жить | wohnen, leben
любить | lieben, gern mögen
работать | arbeiten

# v1-shkola | В школе | Schule und Unterricht
школа | die Schule
класс | die Klasse; das Klassenzimmer
учитель / учительница | der Lehrer / die Lehrerin
ученик / ученица | der Schüler / die Schülerin
урок | die Unterrichtsstunde
предмет | das Schulfach
математика | Mathematik
русский язык | Russisch (Fach)
немецкий язык | Deutsch (Fach)
английский язык | Englisch (Fach)
история | Geschichte
физкультура | Sport (Fach)
расписание | der Stundenplan
перемена | die Pause
контрольная работа | die Klassenarbeit
домашнее задание | die Hausaufgabe
оценка | die Note
пятёрка | die Fünf (beste Note in Russland)
учебник | das Lehrbuch
тетрадь | das Heft
ручка | der Kugelschreiber
доска | die Tafel
учиться | lernen, studieren
изучать | (ein Fach) lernen
понимать | verstehen
читать | lesen
писать | schreiben
трудный / лёгкий | schwer / leicht

# v1-dom | Мой дом | Wohnung und Zimmer
дом | das Haus
квартира | die Wohnung
комната | das Zimmer
кухня | die Küche
гостиная | das Wohnzimmer
спальня | das Schlafzimmer
ванная | das Badezimmer
туалет | die Toilette
балкон | der Balkon
этаж | das Stockwerk
лифт | der Aufzug
дверь | die Tür
окно | das Fenster
стол | der Tisch
стул | der Stuhl
кровать | das Bett
шкаф | der Schrank
диван | das Sofa
компьютер | der Computer
стена | die Wand
на / в | auf / in
под | unter
рядом с | neben
справа / слева | rechts / links
здесь / там | hier / dort
дача | das Sommerhaus, die Datscha

# v1-eda | Еда и напитки | Essen, Trinken, Einkaufen
завтрак | das Frühstück
обед | das Mittagessen
ужин | das Abendessen
есть | essen
пить | trinken
хлеб | das Brot
масло | die Butter; das Öl
сыр | der Käse
колбаса | die Wurst
мясо | das Fleisch
рыба | der Fisch
курица | das Huhn, das Hähnchen
суп | die Suppe
борщ | der Borschtsch
пельмени | die Pelmeni (Teigtaschen)
блины | die Pfannkuchen (Bliny)
каша | der Brei
овощи | das Gemüse
фрукты | das Obst
яблоко | der Apfel
вода | das Wasser
сок | der Saft
чай | der Tee
кофе | der Kaffee
молоко | die Milch
магазин | das Geschäft
Сколько стоит? | Wie viel kostet das?
вкусно | lecker

# v2-gorod | В городе | Stadt, Wege, Verkehr
город | die Stadt
деревня | das Dorf
улица | die Straße
площадь | der Platz
центр | das Zentrum
музей | das Museum
театр | das Theater
церковь | die Kirche
вокзал | der Bahnhof
остановка | die Haltestelle
автобус | der Bus
метро | die U-Bahn
трамвай | die Straßenbahn
машина | das Auto
пешком | zu Fuß
светофор | die Ampel
прямо | geradeaus
направо / налево | nach rechts / nach links
далеко / близко | weit / nah
Где находится …? | Wo befindet sich …?
Как пройти к …? | Wie komme ich zu …?
аптека | die Apotheke
больница | das Krankenhaus
банк | die Bank
кафе | das Café
рынок | der Markt

# v2-odezhda | Одежда | Kleidung, Farben, Einkaufen
одежда | die Kleidung
футболка | das T-Shirt
рубашка | das Hemd
свитер | der Pullover
брюки | die Hose
джинсы | die Jeans
юбка | der Rock
платье | das Kleid
куртка | die Jacke
пальто | der Mantel
шапка | die Mütze
обувь | die Schuhe
кроссовки | die Turnschuhe
носки | die Socken
размер | die Größe
носить | tragen
примерять | anprobieren
дорогой / дешёвый | teuer / billig
мода | die Mode
красный | rot
синий | dunkelblau
голубой | hellblau
зелёный | grün
жёлтый | gelb
чёрный | schwarz
белый | weiß

# v2-den | Мой день | Tagesablauf und Uhrzeit
просыпаться | aufwachen
вставать | aufstehen
умываться | sich waschen
принимать душ | duschen
одеваться | sich anziehen
завтракать | frühstücken
идти в школу | zur Schule gehen
возвращаться домой | nach Hause zurückkehren
ложиться спать | schlafen gehen
утром | morgens
днём | tagsüber
вечером | abends
ночью | nachts
рано / поздно | früh / spät
сначала | zuerst
потом | dann
наконец | schließlich
каждый день | jeden Tag
Который час? | Wie spät ist es?
сейчас три часа | jetzt ist es drei Uhr
понедельник, вторник, среда | Montag, Dienstag, Mittwoch
четверг, пятница | Donnerstag, Freitag
суббота, воскресенье | Samstag, Sonntag
устал / устала | müde (er / sie)
свободное время | die Freizeit

# v2-puteshestviya | Путешествия | Reisen, Ferien, Wetter
каникулы | die Schulferien
отпуск | der Urlaub
путешествие | die Reise
путешествовать | reisen
за границей | im Ausland
море | das Meer
пляж | der Strand
горы | das Gebirge
гостиница | das Hotel
билет | die Fahrkarte
поезд | der Zug
самолёт | das Flugzeug
аэропорт | der Flughafen
чемодан | der Koffer
паспорт | der Reisepass
виза | das Visum
достопримечательность | die Sehenswürdigkeit
экскурсия | die Führung, der Ausflug
обмен | der Austausch
погода | das Wetter
солнце | die Sonne
дождь | der Regen
снег | der Schnee
тепло / холодно | warm / kalt
весна, лето | der Frühling, der Sommer
осень, зима | der Herbst, der Winter

# v2-media | СМИ и интернет | Handy, Internet, soziale Netzwerke
мобильный телефон | das Handy
смартфон | das Smartphone
ноутбук | der Laptop
экран | der Bildschirm
интернет | das Internet
социальная сеть | das soziale Netzwerk
приложение | die App
сообщение | die Nachricht
отправить сообщение | eine Nachricht schicken
пароль | das Passwort
скачать | herunterladen
выложить | hochladen, posten
лайк | das Like
подписчик | der Follower
видео | das Video
блогер | der Blogger
сидеть в интернете | im Internet hängen
зависимость | die Abhängigkeit
кибербуллинг | das Cybermobbing
фейк | die Falschmeldung
реклама | die Werbung
плюс / минус | der Vorteil / der Nachteil
компьютерная игра | das Computerspiel
сериал | die Serie
новости | die Nachrichten

# v2-chuvstva | Дружба и чувства | Freundschaft und Gefühle
дружба | die Freundschaft
лучший друг | der beste Freund
парень / девушка | der feste Freund / die feste Freundin
влюбиться в | sich verlieben in
доверять | vertrauen
помогать | helfen
ссориться | sich streiten
мириться | sich versöhnen
извиняться | sich entschuldigen
скучать по | vermissen
рад / рада | froh
счастливый | glücklich
грустный | traurig
злой | böse, wütend
нервный | nervös
бояться | Angst haben
одинокий | einsam
ревновать | eifersüchtig sein
чувство | das Gefühl
честный | ehrlich
верный | treu
доверие | das Vertrauen
тайна | das Geheimnis
смеяться | lachen
плакать | weinen

# v3-rossiya | Россия | Land, Städte, Natur
Россия | Russland
Москва | Moskau
Санкт-Петербург | Sankt Petersburg
Кремль | der Kreml
Красная площадь | der Rote Platz
Сибирь | Sibirien
Байкал | der Baikalsee
Волга | die Wolga
Урал | der Ural
тайга | die Taiga
Транссибирская магистраль | die Transsibirische Eisenbahn
страна | das Land
столица | die Hauptstadt
население | die Bevölkerung
житель | der Einwohner
народ | das Volk
национальность | die Nationalität
многонациональный | multinational
часовой пояс | die Zeitzone
климат | das Klima
мороз | der Frost
лес | der Wald
река | der Fluss
озеро | der See
природа | die Natur
граница | die Grenze

# v3-budushchee | Работа и будущее | Beruf, Ausbildung, Zukunft
будущее | die Zukunft
профессия | der Beruf
работа | die Arbeit
зарплата | das Gehalt
фирма | die Firma
начальник | der Chef
практика | das Praktikum
университет | die Universität
студент / студентка | der Student / die Studentin
поступить в университет | an der Universität angenommen werden
экзамен | die Prüfung
ЕГЭ | das Einheitliche Staatsexamen (Abitur)
диплом | der Abschluss
резюме | der Lebenslauf
собеседование | das Vorstellungsgespräch
опыт | die Erfahrung
безработица | die Arbeitslosigkeit
зарабатывать | verdienen
мечта | der Traum
врач | der Arzt / die Ärztin
инженер | der Ingenieur / die Ingenieurin
программист | der Programmierer / die Programmiererin
журналист | der Journalist / die Journalistin
юрист | der Jurist / die Juristin
успех | der Erfolg

# v3-ekologiya | Экология | Umwelt und Klima
экология | die Ökologie
окружающая среда | die Umwelt
изменение климата | der Klimawandel
глобальное потепление | die Erderwärmung
загрязнение | die Verschmutzung
загрязнять | verschmutzen
мусор | der Müll
переработка | das Recycling
пластик | das Plastik
засуха | die Dürre
наводнение | die Überschwemmung
лесной пожар | der Waldbrand
вечная мерзлота | der Permafrost
энергия | die Energie
возобновляемая энергия | die erneuerbare Energie
нефть | das Erdöl
газ | das Gas
экономить | sparen
охранять | schützen
вымирающий вид | die aussterbende Art
потребление | der Verbrauch
устойчивый | nachhaltig
катастрофа | die Katastrophe
защита природы | der Naturschutz
планета | der Planet

# v4-istoriya | История | Zarenreich, Sowjetunion, Gegenwart
исторический | historisch
царь | der Zar
Пётр Первый | Peter der Große
революция | die Revolution
Октябрьская революция | die Oktoberrevolution (1917)
Советский Союз | die Sowjetunion
СССР | die UdSSR
Ленин | Lenin
Сталин | Stalin
коммунизм | der Kommunismus
партия | die Partei
репрессии | die Repressionen
ГУЛАГ | der Gulag
Великая Отечественная война | der Große Vaterländische Krieg (1941–45)
блокада Ленинграда | die Blockade Leningrads
победа | der Sieg
День Победы | der Tag des Sieges (9. Mai)
холодная война | der Kalte Krieg
перестройка | die Perestroika
распад Советского Союза | der Zerfall der Sowjetunion
независимость | die Unabhängigkeit
память | die Erinnerung, das Gedächtnis
жертва | das Opfer
власть | die Macht
свобода | die Freiheit

# v4-obshchestvo | Общество | Gesellschaft, Jugend, Werte
общество | die Gesellschaft
молодёжь | die Jugend
поколение | die Generation
ценности | die Werte
традиция | die Tradition
религия | die Religion
православие | die Orthodoxie
семейные ценности | die Familienwerte
равенство | die Gleichheit
права человека | die Menschenrechte
свобода слова | die Meinungsfreiheit
цензура | die Zensur
государство | der Staat
правительство | die Regierung
президент | der Präsident
выборы | die Wahlen
гражданин | der Bürger
демократия | die Demokratie
коррупция | die Korruption
бедность | die Armut
богатство | der Reichtum
город и деревня | Stadt und Land
мигрант | der Migrant
Россия и Германия | Russland und Deutschland
русские немцы | die Russlanddeutschen

# v4-analiz | Анализ текста | Redemittel für Textarbeit
текст | der Text
отрывок | der Auszug
статья | der Artikel
рассказ | die Erzählung
роман | der Roman
стихотворение | das Gedicht
автор | der Autor
рассказчик | der Erzähler
главный герой | die Hauptfigur
персонаж | die Figur
тема | das Thema
текст рассказывает о … | der Text erzählt von …
речь идёт о … | es geht um …
автор критикует … | der Autor kritisiert …
кратко пересказать | kurz nacherzählen
анализировать | analysieren
метафора | die Metapher
сравнение | der Vergleich
риторический вопрос | die rhetorische Frage
ирония | die Ironie
во-первых | erstens
во-вторых | zweitens
кроме того | außerdem
однако | jedoch
таким образом | somit
в заключение | abschließend

# v4-kultura | Культура | Literatur, Kunst, Musik
культура | die Kultur
литература | die Literatur
писатель | der Schriftsteller
поэт | der Dichter
Пушкин | Puschkin
Толстой | Tolstoi
Достоевский | Dostojewski
Чехов | Tschechow
Булгаков | Bulgakow
произведение | das Werk
пьеса | das Theaterstück
балет | das Ballett
опера | die Oper
композитор | der Komponist
Чайковский | Tschaikowski
художник | der Maler, der Künstler
картина | das Gemälde
фильм | der Film
режиссёр | der Regisseur
сказка | das Märchen
праздник | das Fest
Новый год | Neujahr
Масленица | die Butterwoche (Fasching)
матрёшка | die Matrjoschka
душа | die Seele

# v4-mnenie | Моё мнение | Meinung und Argumentation
по-моему | meiner Meinung nach
я думаю, что | ich denke, dass
я считаю, что | ich bin der Meinung, dass
мне кажется, что | mir scheint, dass
я согласен / согласна | ich bin einverstanden
я не согласен | ich bin nicht einverstanden
ты прав / права | du hast recht
с одной стороны … с другой стороны | einerseits … andererseits
за и против | dafür und dagegen
аргумент | das Argument
поэтому | deshalb
потому что | weil
так как | da
хотя | obwohl
несмотря на | trotz
но | aber
например | zum Beispiel
то есть | das heißt
важно, что | wichtig ist, dass
в итоге | im Ergebnis
дискуссия | die Diskussion
убедить | überzeugen

# g1-rod | Geschlecht und Pronomen | он, она, оно
> Russische Nomen haben drei Geschlechter – meist an der Endung erkennbar:
> **männlich** (он): Konsonant oder -й: стол, музей
> **weiblich** (она): **-а / -я**: мама, неделя · oft -ь: тетрадь
> **sächlich** (оно): **-о / -е**: окно, море
> Ausnahmen: папа, дядя, дедушка sind männlich (natürliches Geschlecht).
> Possessiv: **мой / моя / моё** (mein), **твой / твоя / твоё** (dein); его (sein), её (ihr) bleiben gleich.
> Es gibt keine Artikel, und „sein“ fällt im Präsens weg: Это мой брат. – Das ist mein Bruder.
? Это {{c1::мой}} брат. (mein)
? Это {{c1::моя}} сестра. (mein)
? Это {{c1::моё}} окно. (mein)
? Где мама? – {{c1::Она}} дома.
? Где стол? – {{c1::Он}} там.
? Где окно? – {{c1::Оно}} здесь.
? Это {{c1::твоя}} кошка? (dein)
? Это {{c1::его}} книга. (sein)
? Мой папа — {{c1::он}} учитель.

# g1-glagol | Präsens: e- und i-Konjugation | читать, говорить
> **e-Konjugation** – читать: чита**ю** · чита**ешь** · чита**ет** · чита**ем** · чита**ете** · чита**ют**
> **i-Konjugation** – говорить: говор**ю** · говор**ишь** · говор**ит** · говор**им** · говор**ите** · говор**ят**
> Die Personalpronomen: я · ты · он/она · мы · вы · они
> Häufig: жить → живу, живёшь … живут · писать → пишу, пишешь … пишут
> Nach ж, ш, ч, щ steht -у/-ат statt -ю/-ят: учить → учу … учат
? Я {{c1::читаю}} книгу. (читать)
? Ты {{c1::говоришь}} по-немецки? (говорить)
? Мы {{c1::живём}} в Германии. (жить)
? Они {{c1::работают}} в школе. (работать)
? Вы {{c1::понимаете}} по-русски? (понимать)
? Он {{c1::пишет}} письмо. (писать)
? Я {{c1::люблю}} музыку. (любить)
? Мама {{c1::говорит}} по телефону. (говорить)
? Что ты {{c1::делаешь}}? (делать)
? Ученики {{c1::учат}} слова. (учить)

# g1-net | Haben und nicht haben | у меня есть – у меня нет
> „Haben“ heißt wörtlich „bei mir ist“: **у меня есть** брат.
> у меня · у тебя · у него · у неё · у нас · у вас · у них
> Verneinung: **у меня нет** + **Genitiv**: У меня нет брат**а**. У меня нет сестр**ы**.
> Genitiv Singular: m./n. **-а / -я** (брат → брата, окно → окна) · f. **-ы / -и** (сестра → сестры, неделя → недели)
> „Es gibt nicht“ / „ist nicht da“: Здесь **нет** магазина. Мамы **нет** дома.
? У {{c1::меня}} есть собака. (ich)
? У {{c1::тебя}} есть брат? (du)
? У меня нет {{c1::брата}}. (брат)
? У неё нет {{c1::сестры}}. (сестра)
? У {{c1::нас}} есть дача. (wir)
? Здесь нет {{c1::магазина}}. (магазин)
? Папы {{c1::нет}} дома.
? У него нет {{c1::времени}}. (время)
? У них {{c1::есть}} машина.

# g2-predlozhnyj | Präpositiv | в школе, на улице, о маме
> Der Präpositiv steht nach **в** / **на** (wo?) und **о** (über).
> Endung meist **-е**: в школ**е**, в дом**е**, на улиц**е**, о мам**е**
> Wörter auf -ия / -ие / -ь (f.) → **-и**: в Росси**и**, в тетрад**и**
> **на** für offene Flächen, Veranstaltungen und manche Orte: на улице, на уроке, на работе, на вокзале
> Pronomen: обо мне · о тебе · о нём · о ней · о нас · о вас · о них
? Я живу в {{c1::Москве}}. (Москва)
? Мы сейчас в {{c1::школе}}. (школа)
? Книга на {{c1::столе}}. (стол)
? Он работает в {{c1::банке}}. (банк)
? Мы говорим о {{c1::фильме}}. (фильм)
? Она живёт в {{c1::России}}. (Россия)
? Дети играют на {{c1::улице}}. (улица)
? Я думаю о {{c1::тебе}}. (ты)
? Вчера мы были на {{c1::концерте}}. (концерт)

# g2-vinitelnyj | Akkusativ | Я вижу маму
> Der Akkusativ ist der Fall des direkten Objekts (wen? was?).
> Weiblich **-а → -у**, **-я → -ю**: мама → мам**у**, неделя → недел**ю**
> Männlich unbelebt und sächlich: **wie der Nominativ**: Я читаю журнал. Я вижу окно.
> Männlich belebt: **wie der Genitiv**: Я вижу брат**а**. Я люблю пап**у**.
> **в / на** + Akkusativ = **wohin?**: Я иду в школ**у**. (aber wo? → Präpositiv: в школе)
> Pronomen: меня · тебя · его · её · нас · вас · их
? Я вижу {{c1::маму}}. (мама)
? Мы читаем {{c1::книгу}}. (книга)
? Он любит {{c1::музыку}}. (музыка)
? Я жду {{c1::брата}}. (брат)
? Они смотрят {{c1::фильм}}. (фильм)
? Я иду в {{c1::школу}}. (школа – wohin?)
? Мы едем на {{c1::дачу}}. (дача – wohin?)
? Я тебя {{c1::люблю}}. (любить)
? Ты знаешь {{c1::его}}? (он)

# g2-proshedshee | Vergangenheit | я читал, она читала
> Infinitivstamm + **-л** (m.) · **-ла** (f.) · **-ло** (n.) · **-ли** (Pl.): читать → читал, читала, читало, читали
> Die Form richtet sich nach dem **Geschlecht**, nicht nach der Person: я читал (Mann) / я читала (Frau)
> быть → был, была, было, были
> Unregelmäßig: идти → шёл, шла, шли · есть → ел, ела · мочь → мог, могла
? Вчера я {{c1::читал}} книгу. (читать – ein Mann)
? Мама {{c1::работала}} в банке. (работать)
? Мы {{c1::были}} в Москве. (быть)
? Где ты {{c1::была}}, Аня? (быть)
? Дети {{c1::играли}} в парке. (играть)
? Папа {{c1::смотрел}} телевизор. (смотреть)
? Она {{c1::жила}} в Петербурге. (жить)
? Вчера {{c1::было}} холодно. (быть – es)
? Он не {{c1::мог}} прийти. (мочь)

# g2-roditelnyj | Genitiv und Zahlen | нет, много, два брата
> Der Genitiv steht für „von / des“, nach **нет**, nach Mengen (много, мало, сколько) und nach Zahlen.
> Sg.: m./n. **-а / -я**, f. **-ы / -и**: книга брата · много воды
> Pl.: m. **-ов / -ей** · f./n. oft Endung weg: много друзей, много книг, много мест
> ## Zahlen
> 1 + Nominativ Sg.: один брат · 2, 3, 4 + **Genitiv Sg.**: два брат**а**, три сестр**ы** · ab 5 + **Genitiv Pl.**: пять брат**ьев**, пять книг
> Präpositionen mit Genitiv: у, из, от, до, без, для, после, около
? Это книга {{c1::брата}}. (брат)
? У меня два {{c1::брата}}. (брат)
? В классе три {{c1::девочки}}. (девочка)
? В городе много {{c1::музеев}}. (музей – Pl.)
? Сколько у тебя {{c1::книг}}? (книга – Pl.)
? Мне шестнадцать {{c1::лет}}. (год – Genitiv Pl.)
? Я из {{c1::Германии}}. (Германия)
? Чай без {{c1::сахара}}, пожалуйста. (сахар)
? После {{c1::урока}} мы идём домой. (урок)

# g2-dvizhenie | Verben der Bewegung | идти / ходить, ехать / ездить
> Russisch unterscheidet **zu Fuß** (идти/ходить) und **mit Verkehrsmittel** (ехать/ездить).
> **einmalig / gerade unterwegs** (eine Richtung): **идти** – иду, идёшь, идут · **ехать** – еду, едешь, едут
> **regelmäßig / hin und zurück**: **ходить** – хожу, ходишь, ходят · **ездить** – езжу, ездишь, ездят
> Сейчас я **иду** в школу. – Каждый день я **хожу** в школу.
> Mit Präfix wird die Richtung genauer: при- (ankommen), у- (weggehen), в- (hinein), вы- (hinaus): прийти, уехать
? Сейчас я {{c1::иду}} в школу. (gerade, zu Fuß)
? Каждый день я {{c1::хожу}} в школу. (regelmäßig, zu Fuß)
? Завтра мы {{c1::едем}} в Москву. (mit Zug, einmalig)
? Летом мы часто {{c1::ездим}} на дачу. (regelmäßig, mit Auto)
? Куда ты {{c1::идёшь}}? (gerade, zu Fuß)
? Они {{c1::едут}} на автобусе. (gerade unterwegs)
? Мой папа {{c1::ходит}} на работу пешком. (regelmäßig)
? Вчера Аня {{c1::приехала}} из Петербурга. (ankommen – mit Verkehrsmittel)
? Он {{c1::ушёл}} домой. (weggehen – zu Fuß)

# g2-budushchee | Zukunft | я буду читать, я прочитаю
> Russische Verben haben zwei Aspekte (mehr dazu später). Die Zukunft bildet man je nach Aspekt:
> **unvollendet**: **быть** in der Zukunft + Infinitiv: буду · будешь · будет · будем · будете · будут + читать
> **vollendet**: die Präsensformen haben Zukunftsbedeutung: прочитать → я прочитаю (ich werde zu Ende lesen)
> Завтра я **буду** работать. (Vorgang) – Завтра я **напишу** письмо. (Ergebnis)
? Завтра я {{c1::буду}} работать.
? Что ты {{c1::будешь}} делать летом?
? Мы {{c1::будем}} смотреть фильм.
? Они {{c1::будут}} жить в Москве.
? Завтра я {{c1::напишу}} письмо. (написать – vollendet)
? Вечером мы {{c1::прочитаем}} текст. (прочитать – vollendet)
? Летом {{c1::будет}} жарко.
? Я тебе {{c1::позвоню}}. (позвонить – vollendet)
? Ты {{c1::придёшь}} на вечеринку? (прийти – vollendet)

# g3-dativ | Dativ | мне нравится, мне нужно
> Der Dativ (wem?): m./n. **-у / -ю**, f. **-е** (bei -ия/-ь: **-и**): брат**у**, мам**е**, Мари**и**
> Pronomen: **мне · тебе · ему · ей · нам · вам · им**
> Wichtige Konstruktionen mit Dativ:
> **нравится / нравятся** (gefallen): Мне нравится музыка. Мне нравятся фильмы.
> **нужно / надо** (müssen, brauchen): Мне нужно работать.
> **Alter**: Мне шестнадцать лет. · **Gefühl**: Мне холодно. Мне скучно.
> Präpositionen: **к** (zu): к врачу · **по** (auf, über, entlang): по улице, по телефону
? {{c1::Мне}} нравится эта песня. (ich)
? {{c1::Тебе}} нравятся фильмы? (du)
? Я звоню {{c1::маме}}. (мама)
? Мы дарим подарок {{c1::брату}}. (брат)
? {{c1::Ему}} шестнадцать лет. (er)
? {{c1::Нам}} нужно идти. (wir)
? Мне {{c1::нравятся}} эти джинсы.
? Я иду к {{c1::врачу}}. (врач)
? {{c1::Ей}} холодно. (sie)

# g3-instrumental | Instrumental | с другом, ручкой, врачом
> Der Instrumental (womit? mit wem? als was?): m./n. **-ом / -ем**, f. **-ой / -ей**
> **с** + Instr. = mit (zusammen): с друг**ом**, с мам**ой**
> Mittel ohne Präposition: писать ручк**ой**, ехать поезд**ом**
> Beruf / Rolle: Он работает врач**ом**. Я хочу стать инженер**ом**.
> Nach **интересоваться, заниматься**: Я занимаюсь спорт**ом**.
> Präpositionen: над, под, перед, за, между (wo?): под стол**ом**
> Pronomen: мной · тобой · ним · ней · нами · вами · ними
? Я иду в кино с {{c1::другом}}. (друг)
? Она говорит с {{c1::мамой}}. (мама)
? Я пишу {{c1::ручкой}}. (ручка)
? Мой папа работает {{c1::врачом}}. (врач)
? Я хочу стать {{c1::инженером}}. (инженер)
? Ты занимаешься {{c1::спортом}}? (спорт)
? Кошка лежит под {{c1::столом}}. (стол)
? Пойдём со {{c1::мной}}! (я)
? Он интересуется {{c1::историей}}. (история)

# g3-vid | Verbaspekt | делать / сделать
> Fast jedes Verb gibt es als Paar: **unvollendet** (Vorgang, Wiederholung, Dauer) und **vollendet** (einmaliges Ergebnis, abgeschlossen).
> делать / **с**делать · читать / **про**читать · писать / **на**писать · покупать / купить · говорить / сказать · брать / взять
> **unvollendet**: Я долго **читал**. Я **читаю** каждый день. (Vorgang, Gewohnheit)
> **vollendet**: Я **прочитал** книгу. (fertig) · Vollendete Verben haben kein Präsens – ihre Präsensformen sind Zukunft.
> Signalwörter: каждый день, часто, долго → unvollendet · уже, наконец, вдруг → vollendet
? Каждый день я {{c1::делаю}} домашнее задание. (Gewohnheit)
? Я уже {{c1::сделал}} домашнее задание. (fertig)
? Вчера я долго {{c1::читал}}. (Dauer)
? Я наконец {{c1::прочитал}} эту книгу. (fertig)
? Он часто {{c1::покупает}} хлеб. (Gewohnheit)
? Вчера она {{c1::купила}} платье. (einmalig)
? Что он тебе {{c1::сказал}}? (einmalig)
? Завтра я {{c1::напишу}} тебе. (vollendet – Zukunft)
? Мы всегда {{c1::говорим}} по-русски. (Gewohnheit)

# g3-plural | Plural der Fälle | в школах, с друзьями
> Plural-Nominativ: **-ы / -и** (m., f.), **-а / -я** (n.): студенты, книги, окна
> Nach г, к, х, ж, ш, ч, щ: **-и**: книги, мальчики
> Unregelmäßig: друг → друзья · брат → братья · город → города · дом → дома · ребёнок → дети · человек → люди
> Die Plural-Endungen der übrigen Fälle sind für alle Geschlechter gleich:
> Dativ **-ам / -ям** · Instrumental **-ами / -ями** · Präpositiv **-ах / -ях**
? В классе сидят {{c1::студенты}}. (студент)
? На столе лежат {{c1::книги}}. (книга)
? Мои {{c1::друзья}} живут в Москве. (друг)
? Я пишу {{c1::друзьям}}. (друзья – Dativ)
? Мы гуляем с {{c1::друзьями}}. (друзья – Instrumental)
? В {{c1::городах}} много машин. (города – Präpositiv)
? Мы говорим о {{c1::книгах}}. (книги – Präpositiv)
? На улице много {{c1::людей}}. (люди – Genitiv)
? {{c1::Дети}} играют в парке. (ребёнок – Pl.)

# g3-imperativ | Imperativ und -ся-Verben | читай! учись!
> **Imperativ**: Präsensstamm (3. Pl. ohne -ют/-ят) + **-й** (nach Vokal) oder **-и** / **-ь**: читать (читают) → **читай!** · говорить (говорят) → **говори!** · сидеть → **сиди!**
> Höflich / Plural: **-те**: читайте! говорите!
> ## Reflexive Verben auf -ся
> Endung **-ся** nach Konsonant, **-сь** nach Vokal: я учу**сь** · ты учишь**ся** · он учит**ся** · мы учим**ся** · вы учите**сь** · они учат**ся**
> Viele haben im Deutschen keine reflexive Entsprechung: учиться (lernen, studieren), заниматься (sich beschäftigen, Sport treiben), нравиться (gefallen)
? {{c1::Читай}} текст! (читать – du)
? {{c1::Говорите}} медленно, пожалуйста! (говорить – Sie)
? {{c1::Сиди}} тихо! (сидеть – du)
? {{c1::Пишите}} упражнение! (писать – ihr)
? Я {{c1::учусь}} в гимназии. (учиться)
? Где ты {{c1::учишься}}? (учиться)
? Мы {{c1::занимаемся}} спортом. (заниматься)
? Фильм {{c1::начинается}} в восемь. (начинаться)
? Не {{c1::волнуйся}}! (волноваться – du)

# g4-uslovnoe | Konjunktiv | если бы … бы
> Der Konjunktiv (Möglichkeit, Wunsch, Irrealis) ist einfach: **Vergangenheitsform + бы**.
> Я **бы** поехал в Москву. – Ich würde nach Moskau fahren / wäre gefahren.
> Bedingung: **если бы** + Vergangenheit, … **бы** + Vergangenheit: Если бы у меня было время, я бы читал больше.
> Es gibt keine Zeitunterscheidung: dieselbe Form für Gegenwart und Vergangenheit.
> Höflicher Wunsch: Я **хотел бы** … – Ich hätte gern … · Wunsch: **Хорошо бы** …
> Reale Bedingung ohne бы: Если будет дождь, мы останемся дома.
? Я {{c1::бы}} поехал в Россию.
? Если бы у меня {{c1::были}} деньги, я бы купил машину. (быть)
? Если бы я знал, я {{c1::бы}} помог.
? Я {{c1::хотел}} бы пить чай. (хотеть – ein Mann)
? Что бы ты {{c1::сделал}} на моём месте? (сделать)
? Если {{c1::будет}} дождь, мы останемся дома. (real)
? Она бы {{c1::пришла}}, если бы её пригласили. (прийти)
? Хорошо {{c1::бы}} поехать на море!

# g4-kotoryj | Relativsätze | который, которая, которое
> **который** richtet sich in **Geschlecht und Zahl** nach dem Bezugswort, im **Fall** nach seiner Rolle im Relativsatz.
> Девушка, **которая** живёт здесь … (Nom. f.) · Книга, **которую** я читаю … (Akk. f.)
> Город, **в котором** я живу … (Präp. m.) · Друг, **с которым** я говорил … (Instr. m.)
> Formen wie ein Adjektiv: который · которая · которое · которые
> Vor который steht immer ein Komma.
? Мальчик, {{c1::который}} сидит там, мой брат.
? Девушка, {{c1::которая}} поёт, моя сестра.
? Книга, {{c1::которую}} я читаю, очень интересная.
? Город, в {{c1::котором}} я живу, маленький.
? Друг, с {{c1::которым}} я говорил, из Москвы.
? Фильм, {{c1::который}} мы смотрели, был скучный.
? Люди, {{c1::которые}} здесь работают, очень добрые.
? Это учитель, {{c1::которому}} я написал письмо. (Dativ)

# g4-prichastiya | Partizipien und Adverbialpartizipien | читающий, прочитав
> In Texten (Zeitung, Literatur) ersetzen Partizipien Relativsätze – man muss sie erkennen.
> **Aktiv Präsens**: -ущий/-ющий, -ащий/-ящий: читающий мальчик = мальчик, который читает
> **Aktiv Vergangenheit**: -вший: читавший = который читал
> **Passiv Vergangenheit**: -нный, -тый: прочитанная книга = книга, которую прочитали
> **Adverbialpartizip (деепричастие)**, gleichzeitig: -я/-а: **читая** – beim Lesen, während er liest
> vorzeitig: -в: **прочитав** – nachdem er gelesen hatte
? Мальчик, {{c1::читающий}} книгу, мой брат. (der liest)
? Девушка, {{c1::сидевшая}} здесь, ушла. (die gesessen hatte)
? {{c1::Прочитанная}} книга лежит на столе. (gelesen worden)
? {{c1::Читая}} текст, я понял всё. (beim Lesen)
? {{c1::Сделав}} уроки, он пошёл гулять. (nachdem er gemacht hatte)
? Это дом, {{c1::построенный}} в 1900 году. (gebaut)
? {{c1::Слушая}} музыку, она готовила ужин. (beim Hören)
? Люди, {{c1::живущие}} в деревне, работают много. (die leben)

# g4-chtoby | что und чтобы, indirekte Rede | Я хочу, чтобы ты пришёл
> **что** = dass (Aussage): Он сказал, **что** придёт.
> **чтобы** = damit / dass (Wunsch, Zweck):
> gleiches Subjekt → + **Infinitiv**: Я учусь, **чтобы** поступить в университет.
> anderes Subjekt → + **Vergangenheit**: Я хочу, **чтобы** ты пришёл. Мама просит, **чтобы** я помогал.
> ## Indirekte Rede
> Die Zeit **bleibt** wie in der direkten Rede: «Я устал.» → Он сказал, что он **устал**. · «Я приду.» → Он сказал, что **придёт**.
> Fragen ohne Fragewort: **ли** – Он спросил, **приду ли** я.
? Он сказал, {{c1::что}} придёт завтра.
? Я хочу, {{c1::чтобы}} ты пришёл.
? Мама просит, чтобы я {{c1::помогал}} ей. (помогать – Vergangenheit)
? Я учусь, чтобы {{c1::поступить}} в университет. (поступить – gleiches Subjekt)
? «Я устал.» → Он сказал, что он {{c1::устал}}.
? «Я позвоню.» → Она сказала, что {{c1::позвонит}}.
? Он спросил, приду {{c1::ли}} я.
? Учитель говорит, {{c1::чтобы}} мы сидели тихо.
`;

const blocks = [
  ["v1-alfavit", "v1-privet", "v1-semya", "g1-rod", "g1-glagol", "g1-net"],
  ["v1-shkola", "v1-dom", "v1-eda", "g2-predlozhnyj", "g2-vinitelnyj", "g2-proshedshee"],
  ["v2-gorod", "v2-odezhda", "v2-den", "g2-roditelnyj", "g2-dvizhenie", "g2-budushchee"],
  ["v2-puteshestviya", "v2-media", "v2-chuvstva", "g3-dativ", "g3-instrumental", "g3-vid"],
  ["v3-rossiya", "v3-budushchee", "v3-ekologiya", "g3-plural", "g3-imperativ"],
  ["v4-istoriya", "v4-obshchestvo", "v4-analiz", "g4-uslovnoe", "g4-kotoryj"],
  ["v4-kultura", "v4-mnenie", "g4-prichastiya", "g4-chtoby"],
];

export default { units: parseCourse(text), blocks };
