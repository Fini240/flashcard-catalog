// The Korean course: self-study in four levels, starting with Hangul.
// Format: see parseCourse in src/courses.js. Korean | German.
import { parseCourse } from "../courses.js";

const text = `
# v1-moeum | 모음 | Hangul: Vokale
ㅏ | a
ㅑ | ya
ㅓ | eo (offenes o, wie in „Sonne“)
ㅕ | yeo
ㅗ | o (geschlossen)
ㅛ | yo
ㅜ | u
ㅠ | yu
ㅡ | eu (u mit breiten Lippen)
ㅣ | i
ㅐ | ae (offenes ä)
ㅔ | e
ㅒ | yae
ㅖ | ye
ㅘ | wa
ㅝ | wo
ㅙ | wae
ㅞ | we
ㅚ | oe (gesprochen we)
ㅟ | wi
ㅢ | ui
아 | a (Silbe mit stummem ㅇ am Anfang)
오이 | die Gurke (o-i)
우유 | die Milch (u-yu)
아이 | das Kind (a-i)

# v1-jaeum | 자음 | Hangul: Konsonanten
ㄱ | g / k
ㄴ | n
ㄷ | d / t
ㄹ | r / l
ㅁ | m
ㅂ | b / p
ㅅ | s
ㅇ | stumm am Silbenanfang / ng am Ende
ㅈ | dsch / j
ㅊ | tsch (behaucht)
ㅋ | k (behaucht)
ㅌ | t (behaucht)
ㅍ | p (behaucht)
ㅎ | h
ㄲ | kk (gespannt)
ㄸ | tt (gespannt)
ㅃ | pp (gespannt)
ㅆ | ss (gespannt)
ㅉ | jj (gespannt)
가 | ga
나 | na
한국 | Korea (han-guk)
서울 | Seoul (seo-ul)
김치 | das Kimchi (gim-chi)
바나나 | die Banane (ba-na-na)

# v1-insa | 인사 | Begrüßen und vorstellen
안녕하세요 | guten Tag, hallo (höflich)
안녕 | hallo; tschüss (unter Freunden)
안녕히 가세요 | auf Wiedersehen (zu dem, der geht)
안녕히 계세요 | auf Wiedersehen (zu dem, der bleibt)
감사합니다 | vielen Dank
고마워요 | danke
천만에요 | gern geschehen
죄송합니다 | es tut mir leid (sehr höflich)
미안해요 | Entschuldigung, tut mir leid
괜찮아요 | schon gut, es ist in Ordnung
처음 뵙겠습니다 | sehr erfreut (erstes Treffen)
만나서 반가워요 | schön, dich kennenzulernen
이름이 뭐예요? | Wie heißt du?
제 이름은 … 이에요 | mein Name ist …
저는 … 이에요 / 예요 | ich bin …
저 | ich (höflich)
학생 | der Schüler, der Student
선생님 | der Lehrer, die Lehrerin
독일 사람 | Deutscher, Deutsche
한국 사람 | Koreaner, Koreanerin
한국어 | Koreanisch (Sprache)
네 | ja
아니요 | nein
잘 먹겠습니다 | guten Appetit (vor dem Essen)
잘 먹었습니다 | danke für das Essen

# v1-sutja | 숫자 | Zahlen und Alter
일, 이, 삼 | eins, zwei, drei (sino-koreanisch)
사, 오, 육 | vier, fünf, sechs (sino-koreanisch)
칠, 팔, 구 | sieben, acht, neun (sino-koreanisch)
십 | zehn (sino-koreanisch)
백 | hundert
천 | tausend
만 | zehntausend
하나, 둘, 셋 | eins, zwei, drei (koreanisch)
넷, 다섯, 여섯 | vier, fünf, sechs (koreanisch)
일곱, 여덟, 아홉 | sieben, acht, neun (koreanisch)
열 | zehn (koreanisch)
스물 | zwanzig (koreanisch)
몇 살이에요? | Wie alt bist du?
열여섯 살이에요 | ich bin sechzehn
얼마예요? | Wie viel kostet das?
원 | Won (Währung)
몇 시예요? | Wie spät ist es?
… 시 | … Uhr (mit koreanischen Zahlen)
… 분 | … Minuten (mit sino-koreanischen Zahlen)
개 | Stück (Zählwort)
명 | Person (Zählwort)
전화번호 | die Telefonnummer
영 / 공 | null

# v2-gajok | 가족 | Familie
가족 | die Familie
아버지 / 아빠 | der Vater / Papa
어머니 / 엄마 | die Mutter / Mama
부모님 | die Eltern
형 | älterer Bruder (eines Jungen)
오빠 | älterer Bruder (eines Mädchens)
누나 | ältere Schwester (eines Jungen)
언니 | ältere Schwester (eines Mädchens)
남동생 | jüngerer Bruder
여동생 | jüngere Schwester
형제 | die Geschwister
할아버지 | der Großvater
할머니 | die Großmutter
아들 | der Sohn
딸 | die Tochter
친구 | der Freund, die Freundin
남자 친구 | der feste Freund
여자 친구 | die feste Freundin
강아지 | der (junge) Hund
고양이 | die Katze
사람 | der Mensch
키가 커요 | ist groß gewachsen
친절해요 | ist freundlich
재미있어요 | ist lustig, interessant
살아요 | wohnt, lebt

# v2-hakgyo | 학교 | Schule
학교 | die Schule
고등학교 | die Oberschule
교실 | das Klassenzimmer
수업 | der Unterricht
숙제 | die Hausaufgabe
시험 | die Prüfung
책 | das Buch
공책 | das Heft
연필 | der Bleistift
가방 | die Tasche
책상 | der Schreibtisch
의자 | der Stuhl
수학 | Mathematik
영어 | Englisch
역사 | Geschichte
체육 | Sport (Fach)
교복 | die Schuluniform
쉬는 시간 | die Pause
공부해요 | lernen
읽어요 | lesen
써요 | schreiben
알아요 | wissen, kennen
몰라요 | nicht wissen
어려워요 | ist schwierig
쉬워요 | ist leicht

# v2-eumsik | 음식 | Essen und Trinken
음식 | das Essen
아침 | das Frühstück; der Morgen
점심 | das Mittagessen
저녁 | das Abendessen; der Abend
밥 | der Reis; die Mahlzeit
빵 | das Brot
고기 | das Fleisch
생선 | der Fisch
달걀 | das Ei
야채 | das Gemüse
과일 | das Obst
사과 | der Apfel
비빔밥 | das Bibimbap
불고기 | das Bulgogi
라면 | die Instantnudeln
떡볶이 | das Tteokbokki
물 | das Wasser
차 | der Tee; das Auto
커피 | der Kaffee
먹어요 | essen
마셔요 | trinken
맛있어요 | ist lecker
매워요 | ist scharf
배고파요 | ich habe Hunger
젓가락 | die Essstäbchen
식당 | das Restaurant

# v2-sigan | 시간 | Tage, Zeit, Tagesablauf
시간 | die Zeit; die Stunde
오늘 | heute
내일 | morgen
어제 | gestern
지금 | jetzt
매일 | jeden Tag
주말 | das Wochenende
월요일 | Montag
화요일 | Dienstag
수요일 | Mittwoch
목요일 | Donnerstag
금요일 | Freitag
토요일 | Samstag
일요일 | Sonntag
일어나요 | aufstehen
자요 | schlafen
가요 | gehen, fahren
와요 | kommen
집에 가요 | nach Hause gehen
일해요 | arbeiten
가끔 | manchmal
자주 | oft
항상 | immer
오전 / 오후 | vormittags / nachmittags
밤 | die Nacht

# v3-dosi | 도시 | Stadt und Wege
도시 | die Stadt
역 | der Bahnhof
지하철 | die U-Bahn
버스 | der Bus
택시 | das Taxi
자전거 | das Fahrrad
가게 | der Laden
편의점 | der Mini-Markt
시장 | der Markt
병원 | das Krankenhaus
은행 | die Bank
우체국 | die Post
공원 | der Park
도서관 | die Bibliothek
카페 | das Café
길 | der Weg, die Straße
오른쪽 | rechts
왼쪽 | links
똑바로 | geradeaus
가까워요 | ist nah
멀어요 | ist weit
어디예요? | Wo ist es?
여기 / 거기 / 저기 | hier / da / dort
사요 | kaufen
타요 | einsteigen, fahren mit

# v3-chwimi | 취미 | Hobbys und Freizeit
취미 | das Hobby
음악 | die Musik
영화 | der Film
운동 | der Sport, das Training
축구 | der Fußball
수영 | das Schwimmen
게임 | das Spiel
노래 | das Lied
춤 | der Tanz
사진 | das Foto
요리 | das Kochen
그림 | das Bild
여행 | die Reise
들어요 | hören
봐요 | sehen, schauen
해요 | machen, tun
놀아요 | spielen, sich vergnügen
노래해요 | singen
춤을 춰요 | tanzen
좋아해요 | gern mögen
싫어해요 | nicht mögen
잘해요 | gut können
못해요 | nicht gut können
같이 | zusammen
노래방 | das Karaoke

# v3-nalssi | 날씨 | Wetter und Jahreszeiten
날씨 | das Wetter
맑아요 | es ist klar, sonnig
비가 와요 | es regnet
눈이 와요 | es schneit
흐려요 | es ist bewölkt
바람이 불어요 | es ist windig
더워요 | es ist heiß
추워요 | es ist kalt
따뜻해요 | es ist warm
시원해요 | es ist kühl, erfrischend
봄 | der Frühling
여름 | der Sommer
가을 | der Herbst
겨울 | der Winter
장마 | die Regenzeit
바다 | das Meer
산 | der Berg
강 | der Fluss
꽃 | die Blume
나무 | der Baum
하늘 | der Himmel
계절 | die Jahreszeit
우산 | der Regenschirm
기온 | die Temperatur

# v3-ot | 옷과 쇼핑 | Kleidung und Einkaufen
옷 | die Kleidung
티셔츠 | das T-Shirt
셔츠 | das Hemd
바지 | die Hose
청바지 | die Jeans
치마 | der Rock
원피스 | das Kleid
재킷 | die Jacke
코트 | der Mantel
신발 | die Schuhe
운동화 | die Turnschuhe
모자 | der Hut, die Mütze
사이즈 | die Größe
입어요 | anziehen, tragen (Kleidung)
신어요 | anziehen (Schuhe)
입어 봐도 돼요? | Darf ich es anprobieren?
비싸요 | ist teuer
싸요 | ist billig
예뻐요 | ist hübsch
멋있어요 | ist cool, stilvoll
빨간색 | rot
파란색 | blau
검은색 | schwarz
하얀색 | weiß
카드로 계산할게요 | ich zahle mit Karte

# v4-yeohaeng | 여행 | Reisen
여행해요 | reisen
호텔 | das Hotel
공항 | der Flughafen
비행기 | das Flugzeug
기차 | der Zug
표 | die Fahrkarte
예약 | die Reservierung
짐 | das Gepäck
여권 | der Reisepass
외국 | das Ausland
관광 | der Tourismus, die Besichtigung
기념품 | das Andenken
지도 | die Landkarte
부산 | Busan
제주도 | die Insel Jeju
경복궁 | der Gyeongbokgung-Palast
한옥 | das traditionelle koreanische Haus
찜질방 | das koreanische Badehaus
묵어요 | übernachten
내려요 | aussteigen
길을 잃었어요 | ich habe mich verlaufen
즐거워요 | macht Spaß
피곤해요 | ich bin müde
구경해요 | sich ansehen, besichtigen

# v4-gamjeong | 감정 | Gefühle und Eigenschaften
감정 | das Gefühl
기뻐요 | ist froh
슬퍼요 | ist traurig
외로워요 | ist einsam
무서워요 | ist unheimlich, hat Angst
부끄러워요 | ist verlegen
걱정해요 | sich Sorgen machen
화가 나요 | wütend werden
울어요 | weinen
웃어요 | lachen
놀랐어요 | war überrascht
행복해요 | ist glücklich
신나요 | ist aufgeregt (vor Freude)
심심해요 | ist gelangweilt
사랑해요 | ich liebe dich
보고 싶어요 | ich vermisse dich
착해요 | ist gutherzig
성실해요 | ist fleißig, zuverlässig
조용해요 | ist ruhig
시끄러워요 | ist laut
밝아요 | ist hell; fröhlich
졸려요 | ist schläfrig
아파요 | tut weh; ist krank
힘들어요 | ist anstrengend

# v4-il | 일과 미래 | Arbeit und Zukunft
일 | die Arbeit
회사 | die Firma
회사원 | der Angestellte, die Angestellte
의사 | der Arzt, die Ärztin
간호사 | der Krankenpfleger, die Krankenschwester
요리사 | der Koch, die Köchin
가수 | der Sänger, die Sängerin
배우 | der Schauspieler, die Schauspielerin
아르바이트 | der Nebenjob
대학교 | die Universität
대학생 | der Student, die Studentin
미래 | die Zukunft
꿈 | der Traum
경험 | die Erfahrung
회의 | die Besprechung
전화 | das Telefon
핸드폰 | das Handy
컴퓨터 | der Computer
바빠요 | ist beschäftigt
한가해요 | hat Zeit, ist frei
월급 | das Monatsgehalt
돈 | das Geld
시작해요 | anfangen
끝나요 | enden
열심히 | fleißig

# v4-munhwa | 한국 문화 | Koreanische Kultur
문화 | die Kultur
한류 | die koreanische Welle (Hallyu)
케이팝 | K-Pop
드라마 | das Drama, die Serie
아이돌 | das Idol (Popstar)
팬 | der Fan
콘서트 | das Konzert
설날 | das Neujahrsfest (Mondkalender)
추석 | Chuseok (Erntedankfest)
한복 | die traditionelle Kleidung (Hanbok)
태권도 | Taekwondo
절 | die Verbeugung; der Tempel
존댓말 | die Höflichkeitssprache
반말 | die vertraute Sprache
선배 | der/die Ältere (in Schule, Firma)
후배 | der/die Jüngere (in Schule, Firma)
나이 | das Alter
전통 | die Tradition
역사적 | historisch
남한 / 북한 | Südkorea / Nordkorea
통일 | die Wiedervereinigung
서울 타워 | der Seoul Tower
치킨 | das frittierte Hähnchen

# g1-ieyo | 이에요 / 예요 | Ich bin …, das ist …
> „A ist B“: **A은/는 B이에요/예요.**
> Nach Konsonant: **이에요** – 학생**이에요**. · Nach Vokal: **예요** – 의사**예요**.
> Themenpartikel: nach Konsonant **은**, nach Vokal **는**: 저**는** · 선생님**은**
> Verneinung: **이/가 아니에요** – 저는 선생님**이 아니에요**. · 의사**가 아니에요**.
> Sehr höflich (Nachrichten, Vorstellung): **입니다** / **입니까?**
? 저{{c1::는}} 학생이에요. (Themenpartikel)
? 저는 학생{{c1::이에요}}. (bin – nach Konsonant)
? 저는 의사{{c1::예요}}. (bin – nach Vokal)
? 선생님{{c1::은}} 한국 사람이에요.
? 저는 선생님이 {{c1::아니에요}}. (bin nicht)
? 이 사람은 의사{{c1::가}} 아니에요.
? 제 이름은 민수{{c1::예요}}.
? 저는 독일 사람{{c1::입니다}}. (sehr höflich)

# g1-ige | 이것, 그것, 저것 und Fragen | 뭐예요? 누구예요?
> **이것** (das hier) · **그것** (das da) · **저것** (das dort) – umgangssprachlich: 이거, 그거, 저거
> Vor Nomen: **이** 책 · **그** 책 · **저** 책
> Fragewörter: **뭐** (was) · **누구** (wer) · **어디** (wo) · **언제** (wann) · **얼마** (wie viel)
> Besitz: **의** (oft weggelassen): 제 책 (= 저의 책) – mein Buch · 친구**의** 가방 – die Tasche des Freundes
> Fragen haben dieselbe Form wie Aussagen, nur mit steigender Stimme und „?“.
? 이것은 {{c1::뭐}}예요? (was)
? 저 사람은 {{c1::누구}}예요? (wer)
? 화장실이 {{c1::어디}}예요? (wo)
? 생일이 {{c1::언제}}예요? (wann)
? 이 가방은 {{c1::얼마}}예요? (wie viel)
? {{c1::이것}}은 제 책이에요. (das hier)
? 친구{{c1::의}} 핸드폰이에요. (des Freundes)
? {{c1::저}} 사람은 선생님이에요. (dort)

# g2-yo | Höfliche Gegenwart: 요-Form | 가요, 먹어요, 해요
> Die Alltagsform endet auf **-요**. Vom Wortstamm (Infinitiv ohne 다):
> Stamm mit **ㅏ / ㅗ** → **-아요**: 가다 → 가요 · 보다 → 봐요 · 살다 → 살아요
> andere Vokale → **-어요**: 먹다 → 먹어요 · 마시다 → 마셔요 · 읽다 → 읽어요
> **하다** → **해요**: 공부하다 → 공부해요
> Dieselbe Form für Aussage, Frage („?“) und Aufforderung – die Stimme macht den Unterschied.
> Das Verb steht immer am Satzende.
? 저는 학교에 {{c1::가요}}. (가다)
? 밥을 {{c1::먹어요}}. (먹다)
? 친구가 한국어를 {{c1::공부해요}}. (공부하다)
? 커피를 {{c1::마셔요}}. (마시다)
? 영화를 {{c1::봐요}}. (보다)
? 서울에 {{c1::살아요}}. (살다)
? 책을 {{c1::읽어요}}. (읽다)
? 매일 운동{{c1::해요}}. (하다)
? 친구를 {{c1::만나요}}. (만나다)

# g2-josa | Partikeln | 을/를, 이/가, 에, 에서, 하고
> **을 / 를**: Objekt – 밥**을** 먹어요 · 커피**를** 마셔요 (nach Konsonant / Vokal)
> **이 / 가**: Subjekt, oft bei neuer Information – 친구**가** 와요
> **에**: Ziel, Zeitpunkt, Ort des Seins – 학교**에** 가요 · 세 시**에** · 집**에** 있어요
> **에서**: Ort einer Handlung, „aus“ – 도서관**에서** 공부해요 · 독일**에서** 왔어요
> **하고 / 와·과**: und, mit – 친구**하고** 가요
> **도**: auch – 저**도** 학생이에요
? 사과{{c1::를}} 먹어요. (Objekt – nach Vokal)
? 빵{{c1::을}} 먹어요. (Objekt – nach Konsonant)
? 학교{{c1::에}} 가요. (Ziel)
? 도서관{{c1::에서}} 공부해요. (Ort der Handlung)
? 친구{{c1::가}} 와요. (Subjekt – nach Vokal)
? 일곱 시{{c1::에}} 일어나요. (Zeitpunkt)
? 엄마{{c1::하고}} 시장에 가요. (mit)
? 저{{c1::도}} 커피를 좋아해요. (auch)
? 독일{{c1::에서}} 왔어요. (aus)

# g2-isseoyo | 있어요 und 없어요 | Es gibt, haben, sich befinden
> **있어요**: es gibt / ist da / haben – 시간이 **있어요** (ich habe Zeit)
> **없어요**: es gibt nicht / haben nicht – 돈이 **없어요**
> Ort mit **에**: 책상 위**에** 책이 있어요.
> Ortswörter: 위 (oben) · 아래 / 밑 (unten) · 안 (in) · 앞 (vor) · 뒤 (hinter) · 옆 (neben)
> **재미있어요** (ist interessant) · **맛있어요** (ist lecker) · **맛없어요** (schmeckt nicht)
? 책상 위에 책이 {{c1::있어요}}. (gibt es)
? 오늘은 시간이 {{c1::없어요}}. (habe nicht)
? 형이 {{c1::있어요}}? (hast du)
? 가방 {{c1::안}}에 핸드폰이 있어요. (in)
? 은행 {{c1::앞}}에 버스 정류장이 있어요. (vor)
? 이 영화는 재미{{c1::있어요}}. (interessant)
? 이 음식은 맛{{c1::없어요}}. (schmeckt nicht)
? 집 {{c1::옆}}에 공원이 있어요. (neben)

# g3-past | Vergangenheit | 갔어요, 먹었어요, 했어요
> Wie bei der 요-Form, nur mit **-았어요 / -었어요 / 했어요**:
> 가다 → 갔어요 · 보다 → 봤어요 · 먹다 → 먹었어요 · 마시다 → 마셨어요 · 공부하다 → 공부했어요
> 이에요 → **이었어요** (nach Konsonant) / **였어요** (nach Vokal)
> Signalwörter: 어제 (gestern) · 지난주 (letzte Woche) · 작년 (letztes Jahr)
? 어제 영화를 {{c1::봤어요}}. (보다)
? 아침에 빵을 {{c1::먹었어요}}. (먹다)
? 지난주에 부산에 {{c1::갔어요}}. (가다)
? 어제 숙제를 {{c1::했어요}}. (하다)
? 커피를 {{c1::마셨어요}}. (마시다)
? 작년에 한국에 {{c1::살았어요}}. (살다)
? 그 사람은 학생{{c1::이었어요}}. (war – nach Konsonant)
? 어제 친구를 {{c1::만났어요}}. (만나다)
? 주말에 뭐 {{c1::했어요}}? (하다)

# g3-an-mot | Verneinung | 안 가요, 못 가요, -지 않아요
> **안** + Verb: will nicht / tut nicht – 학교에 **안** 가요.
> **못** + Verb: kann nicht – 오늘 **못** 가요.
> Bei 하다-Verben steht 안/못 vor 하다: 공부 **안** 해요.
> Längere Form: Stamm + **-지 않아요** (= 안) / **-지 못해요** (= 못): 가**지 않아요**
> **안** und **못** vor Adjektiven: 안 비싸요 (ist nicht teuer)
? 오늘은 학교에 {{c1::안}} 가요. (nicht)
? 저는 수영을 {{c1::못}} 해요. (kann nicht)
? 공부 {{c1::안}} 해요. (lerne nicht)
? 고기를 먹{{c1::지 않아요}}. (esse nicht – lange Form)
? 이 옷은 {{c1::안}} 비싸요. (nicht teuer)
? 어제 잠을 {{c1::못}} 잤어요. (konnte nicht)
? 한국어를 잘 {{c1::못}}해요. (kann nicht gut)
? 커피를 마시{{c1::지 않아요}}. (trinke nicht)

# g3-sipeo | Wünsche und Bitten | -고 싶어요, -(으)세요
> **-고 싶어요**: möchte tun – 한국에 가**고 싶어요**.
> verneint: 가고 싶지 않아요 · Vergangenheit: 가고 싶었어요
> **-(으)세요**: höfliche Bitte (bitte tun Sie …) – 앉**으세요** (nach Konsonant) · 오**세요** (nach Vokal)
> **-지 마세요**: bitte nicht – 가**지 마세요**
> **-아/어 주세요**: bitte für mich tun – 도와 **주세요** (helfen Sie mir bitte) · 사진 좀 찍어 **주세요**
> **주세요** allein: geben Sie mir bitte – 물 **주세요**.
? 한국에 가{{c1::고 싶어요}}. (möchte)
? 비빔밥을 먹{{c1::고 싶어요}}.
? 여기 앉{{c1::으세요}}. (bitte setzen Sie sich)
? 내일 다시 오{{c1::세요}}. (bitte kommen Sie)
? 사진을 찍{{c1::지 마세요}}. (bitte nicht)
? 물 {{c1::주세요}}. (geben Sie mir bitte)
? 좀 도와 {{c1::주세요}}. (helfen Sie mir bitte)
? 천천히 말해 {{c1::주세요}}. (sprechen Sie bitte langsam)

# g4-future | Zukunft und Absicht | -(으)ㄹ 거예요, -(으)ㄹ게요
> **-(으)ㄹ 거예요**: werde tun / wird wohl – 내일 친구를 만**날 거예요**.
> nach Vokal **-ㄹ 거예요** (갈 거예요) · nach Konsonant **-을 거예요** (먹을 거예요)
> Vermutung: 비가 **올 거예요** (es wird wohl regnen)
> **-(으)ㄹ게요**: Versprechen, Ankündigung an den Hörer – 제가 **할게요**! (Ich mach das!)
> **-(으)ㄹ까요?**: Vorschlag – 같이 **갈까요**? (Sollen wir zusammen gehen?)
? 내일 친구를 {{c1::만날}} 거예요. (만나다)
? 주말에 영화를 {{c1::볼}} 거예요. (보다)
? 점심에 비빔밥을 {{c1::먹을}} 거예요. (먹다)
? 내일 비가 {{c1::올}} 거예요. (오다 – Vermutung)
? 제가 {{c1::할게요}}! (하다 – Versprechen)
? 같이 {{c1::갈까요}}? (가다 – Vorschlag)
? 이따가 {{c1::전화할게요}}. (전화하다 – ich rufe an)
? 방학에 뭐 {{c1::할}} 거예요?

# g4-connect | Sätze verbinden | -고, -아서/어서, -지만
> **-고**: und (Aufzählung, Reihenfolge) – 밥을 먹**고** 학교에 가요.
> **-아서 / -어서 / 해서**: weil; und dann (Grund, Folge) – 배가 고파**서** 밥을 먹어요. · 피곤**해서** 자요.
> Vor -아서/어서 steht nie die Vergangenheit!
> **-지만**: aber – 한국어는 어렵**지만** 재미있어요.
> **-(으)면**: wenn – 시간이 있으**면** 와요.
? 밥을 먹{{c1::고}} 학교에 가요. (und dann)
? 배가 고파{{c1::서}} 라면을 먹었어요. (weil)
? 피곤{{c1::해서}} 일찍 잤어요. (피곤하다 – weil)
? 한국어는 어렵{{c1::지만}} 재미있어요. (aber)
? 시간이 있으{{c1::면}} 같이 가요. (wenn)
? 비가 와{{c1::서}} 집에 있었어요. (weil)
? 이 식당은 비싸{{c1::지만}} 맛있어요. (aber)
? 숙제를 하{{c1::고}} 게임을 해요. (und dann)
? 돈이 없으{{c1::면}} 못 사요. (wenn)

# g4-bigyo | Vergleiche und Höflichkeit | 보다 더, 제일, -(으)시-
> **A이/가 B보다 더** + Adjektiv: A ist … als B – 서울**이** 부산**보다 더** 커요.
> **제일 / 가장**: am meisten – 저는 김치를 **제일** 좋아해요.
> ## Höflichkeit gegenüber der Person, über die man spricht
> Stamm + **-(으)세요** (Gegenwart) / **-(으)셨어요** (Vergangenheit): 할머니가 오**세요** · 선생님이 가**셨어요**
> Besondere Wörter: 먹다 → **드세요** · 자다 → **주무세요** · 있다 → **계세요** · 이름 → **성함**
? 서울이 부산{{c1::보다}} 더 커요. (als)
? 여름이 겨울보다 {{c1::더}} 좋아요. (mehr)
? 저는 떡볶이를 {{c1::제일}} 좋아해요. (am meisten)
? 할아버지가 신문을 읽으{{c1::세요}}. (höflich – Gegenwart)
? 할머니, 진지 {{c1::드세요}}. (essen – höflich)
? 선생님이 집에 {{c1::가셨어요}}. (가다 – höflich, Vergangenheit)
? 할아버지는 지금 {{c1::주무세요}}. (schlafen – höflich)
? 사장님이 사무실에 {{c1::계세요}}. (sein – höflich)
`;

const blocks = [
  ["v1-moeum", "v1-jaeum", "v1-insa", "v1-sutja", "g1-ieyo", "g1-ige"],
  ["v2-gajok", "v2-hakgyo", "v2-eumsik", "v2-sigan", "g2-yo", "g2-josa", "g2-isseoyo"],
  ["v3-dosi", "v3-chwimi", "v3-nalssi", "v3-ot", "g3-past", "g3-an-mot", "g3-sipeo"],
  ["v4-yeohaeng", "v4-gamjeong", "v4-il", "v4-munhwa", "g4-future", "g4-connect", "g4-bigyo"],
];

export default { units: parseCourse(text), blocks };
