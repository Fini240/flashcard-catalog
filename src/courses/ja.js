// The Japanese course: self-study in four levels, starting with the kana.
// Words are written in kana on the front so a beginner can read them and the
// voice reads them once; the kanji spelling is on the back next to the German.
// Format: see parseCourse in src/courses.js.
import { parseCourse } from "../courses.js";

const text = `
# v1-hiragana | Hiragana | Die 46 Grundzeichen
あ | a
い | i
う | u
え | e
お | o
か | ka
き | ki
く | ku
け | ke
こ | ko
さ | sa
し | shi
す | su
せ | se
そ | so
た | ta
ち | chi
つ | tsu
て | te
と | to
な | na
に | ni
ぬ | nu
ね | ne
の | no
は | ha (als Partikel: wa)
ひ | hi
ふ | fu
へ | he (als Partikel: e)
ほ | ho
ま | ma
み | mi
む | mu
め | me
も | mo
や | ya
ゆ | yu
よ | yo
ら | ra
り | ri
る | ru
れ | re
ろ | ro
わ | wa
を | wo (Partikel, gesprochen o)
ん | n

# v1-katakana | Katakana | Für Fremdwörter und Namen
ア | a (Katakana)
イ | i (Katakana)
ウ | u (Katakana)
エ | e (Katakana)
オ | o (Katakana)
カ | ka (Katakana)
キ | ki (Katakana)
ク | ku (Katakana)
ケ | ke (Katakana)
コ | ko (Katakana)
サ | sa (Katakana)
シ | shi (Katakana)
ス | su (Katakana)
セ | se (Katakana)
ソ | so (Katakana)
タ | ta (Katakana)
チ | chi (Katakana)
ツ | tsu (Katakana)
テ | te (Katakana)
ト | to (Katakana)
ナ | na (Katakana)
ニ | ni (Katakana)
ヌ | nu (Katakana)
ネ | ne (Katakana)
ノ | no (Katakana)
ハ | ha (Katakana)
ヒ | hi (Katakana)
フ | fu (Katakana)
ヘ | he (Katakana)
ホ | ho (Katakana)
マ | ma (Katakana)
ミ | mi (Katakana)
ム | mu (Katakana)
メ | me (Katakana)
モ | mo (Katakana)
ヤ | ya (Katakana)
ユ | yu (Katakana)
ヨ | yo (Katakana)
ラ | ra (Katakana)
リ | ri (Katakana)
ル | ru (Katakana)
レ | re (Katakana)
ロ | ro (Katakana)
ワ | wa (Katakana)
ン | n (Katakana)
ドイツ | Deutschland (doitsu)
コーヒー | der Kaffee (kōhī)
テレビ | der Fernseher (terebi)

# v1-aisatsu | あいさつ | Begrüßen und vorstellen
こんにちは | guten Tag, hallo
おはようございます | guten Morgen
こんばんは | guten Abend
さようなら | auf Wiedersehen
またね | bis dann
ありがとうございます | vielen Dank
どういたしまして | gern geschehen
すみません | Entschuldigung
ごめんなさい | es tut mir leid
はじめまして | sehr erfreut (beim ersten Treffen)
よろしくおねがいします | auf gute Zusammenarbeit / freut mich
おなまえは？ | Wie ist Ihr Name?
わたしは … です | ich bin …
わたし | ich · 私
あなた | du, Sie
がくせい | der Schüler, der Student · 学生
せんせい | der Lehrer · 先生
ドイツじん | Deutscher, Deutsche · ドイツ人
にほん | Japan · 日本
にほんご | Japanisch (Sprache) · 日本語
はい | ja
いいえ | nein
おげんきですか | Wie geht es Ihnen?
げんきです | mir geht es gut · 元気です
いただきます | guten Appetit (vor dem Essen)
ごちそうさまでした | danke für das Essen

# v1-kazu | かず | Zahlen und Alter
いち | eins · 一
二（に） | zwei
さん | drei · 三
よん / し | vier · 四
ご | fünf · 五
ろく | sechs · 六
なな / しち | sieben · 七
はち | acht · 八
きゅう / く | neun · 九
じゅう | zehn · 十
じゅういち | elf · 十一
にじゅう | zwanzig · 二十
ひゃく | hundert · 百
せん | tausend · 千
まん | zehntausend · 万
ゼロ | null
なんさいですか | Wie alt bist du?
じゅうろくさいです | ich bin sechzehn · 十六歳です
いくらですか | Wie viel kostet das?
えん | Yen · 円
ひとつ | eins (Gegenstand) · 一つ
ふたつ | zwei (Gegenstände) · 二つ
みっつ | drei (Gegenstände) · 三つ
なんじですか | Wie spät ist es?
〜じ | … Uhr · 〜時
〜ふん / ぷん | … Minuten · 〜分

# v2-kazoku | かぞく | Familie
かぞく | die Familie · 家族
ちち | (mein) Vater · 父
はは | (meine) Mutter · 母
おとうさん | Vater (eines anderen; Anrede) · お父さん
おかあさん | Mutter (einer anderen; Anrede) · お母さん
あに | (mein) älterer Bruder · 兄
あね | (meine) ältere Schwester · 姉
おとうと | (mein) jüngerer Bruder · 弟
いもうと | (meine) jüngere Schwester · 妹
きょうだい | die Geschwister · 兄弟
そふ / そぼ | (mein) Großvater / (meine) Großmutter · 祖父 / 祖母
おじいさん | Großvater; alter Mann
おばあさん | Großmutter; alte Frau
りょうしん | die Eltern · 両親
こども | das Kind · 子供
ともだち | der Freund, die Freundin · 友達
いぬ | der Hund · 犬
ねこ | die Katze · 猫
ひと | der Mensch · 人
おとこのこ | der Junge · 男の子
おんなのこ | das Mädchen · 女の子
やさしい | freundlich, lieb · 優しい
おもしろい | lustig, interessant · 面白い
せがたかい | groß gewachsen · 背が高い
すんでいます | wohnt · 住んでいます

# v2-gakkou | がっこう | Schule
がっこう | die Schule · 学校
こうこう | die Oberschule · 高校
きょうしつ | das Klassenzimmer · 教室
じゅぎょう | der Unterricht · 授業
しゅくだい | die Hausaufgabe · 宿題
しけん | die Prüfung · 試験
ほん | das Buch · 本
ノート | das Heft
えんぴつ | der Bleistift · 鉛筆
ペン | der Stift
かばん | die Tasche
つくえ | der Tisch, das Pult · 机
いす | der Stuhl
すうがく | Mathematik · 数学
えいご | Englisch · 英語
れきし | Geschichte · 歴史
たいいく | Sport (Fach) · 体育
ぶかつ | die Schul-AG · 部活
せいふく | die Schuluniform · 制服
やすみじかん | die Pause · 休み時間
べんきょうします | lernen · 勉強します
よみます | lesen · 読みます
かきます | schreiben · 書きます
わかります | verstehen · 分かります
むずかしい | schwierig · 難しい
かんたん | einfach · 簡単

# v2-tabemono | たべもの | Essen und Trinken
たべもの | das Essen · 食べ物
のみもの | das Getränk · 飲み物
あさごはん | das Frühstück · 朝ご飯
ひるごはん | das Mittagessen · 昼ご飯
ばんごはん | das Abendessen · 晩ご飯
ごはん | der Reis; die Mahlzeit · ご飯
パン | das Brot
さかな | der Fisch · 魚
にく | das Fleisch · 肉
たまご | das Ei · 卵
やさい | das Gemüse · 野菜
くだもの | das Obst · 果物
りんご | der Apfel
すし | das Sushi · 寿司
ラーメン | die Ramen
みず | das Wasser · 水
おちゃ | der (grüne) Tee · お茶
ぎゅうにゅう | die Milch · 牛乳
たべます | essen · 食べます
のみます | trinken · 飲みます
おいしい | lecker · 美味しい
あまい | süß · 甘い
からい | scharf · 辛い
おなかがすきました | ich habe Hunger
はし | die Essstäbchen · 箸
レストラン | das Restaurant

# v2-jikan | じかん | Tage, Zeit, Tagesablauf
じかん | die Zeit · 時間
きょう | heute · 今日
あした | morgen · 明日
きのう | gestern · 昨日
いま | jetzt · 今
あさ | der Morgen · 朝
ひる | der Mittag · 昼
よる | der Abend, die Nacht · 夜
まいにち | jeden Tag · 毎日
しゅうまつ | das Wochenende · 週末
げつようび | Montag · 月曜日
かようび | Dienstag · 火曜日
すいようび | Mittwoch · 水曜日
もくようび | Donnerstag · 木曜日
きんようび | Freitag · 金曜日
どようび | Samstag · 土曜日
にちようび | Sonntag · 日曜日
おきます | aufstehen · 起きます
ねます | schlafen gehen · 寝ます
いきます | gehen, fahren · 行きます
きます | kommen · 来ます
かえります | nach Hause gehen · 帰ります
はたらきます | arbeiten · 働きます
ときどき | manchmal · 時々
よく | oft
いつも | immer

# v3-machi | まち | Stadt und Wege
まち | die Stadt · 町
えき | der Bahnhof · 駅
みせ | der Laden · 店
コンビニ | der 24-Stunden-Laden
スーパー | der Supermarkt
びょういん | das Krankenhaus · 病院
ぎんこう | die Bank · 銀行
ゆうびんきょく | die Post · 郵便局
こうえん | der Park · 公園
としょかん | die Bibliothek · 図書館
じんじゃ | der Shintō-Schrein · 神社
おてら | der buddhistische Tempel · お寺
でんしゃ | der Zug · 電車
ちかてつ | die U-Bahn · 地下鉄
バス | der Bus
くるま | das Auto · 車
じてんしゃ | das Fahrrad · 自転車
みち | der Weg · 道
みぎ | rechts · 右
ひだり | links · 左
まっすぐ | geradeaus
ちかい | nah · 近い
とおい | weit · 遠い
どこですか | Wo ist es?
ここ / そこ / あそこ | hier / da / dort drüben
かいます | kaufen · 買います

# v3-shumi | しゅみ | Hobbys und Freizeit
しゅみ | das Hobby · 趣味
おんがく | die Musik · 音楽
えいが | der Film · 映画
スポーツ | der Sport
サッカー | der Fußball
やきゅう | der Baseball · 野球
すいえい | das Schwimmen · 水泳
ゲーム | das Spiel, das Videospiel
まんが | der Manga · 漫画
アニメ | der Anime
しゃしん | das Foto · 写真
りょうり | das Kochen · 料理
えを かきます | ein Bild malen · 絵を描きます
うた | das Lied · 歌
ききます | hören · 聞きます
みます | sehen, schauen · 見ます
します | machen, tun
あそびます | spielen, sich vergnügen · 遊びます
およぎます | schwimmen · 泳ぎます
うたいます | singen · 歌います
すき | gern mögen · 好き
きらい | nicht mögen · 嫌い
じょうず | gut (in etwas) · 上手
へた | schlecht (in etwas) · 下手
いっしょに | zusammen · 一緒に

# v3-kanji1 | 漢字 1 | Die ersten Kanji
日 | Tag, Sonne · にち / ひ
月 | Monat, Mond · げつ / つき
火 | Feuer · か / ひ
水 | Wasser · すい / みず
木 | Baum · もく / き
金 | Gold, Geld · きん / かね
土 | Erde · ど / つち
山 | Berg · さん / やま
川 | Fluss · かわ
人 | Mensch · じん / ひと
口 | Mund · くち
目 | Auge · め
手 | Hand · て
大 | groß · だい / おお
小 | klein · しょう / ちい
中 | Mitte, in · ちゅう / なか
上 | oben · うえ
下 | unten · した
年 | Jahr · ねん / とし
先 | vorher, früher · せん / さき
生 | Leben, geboren · せい / い
学 | lernen · がく
本 | Buch, Ursprung · ほん
子 | Kind · こ
女 | Frau · おんな
男 | Mann · おとこ

# v3-tenki | てんき | Wetter, Jahreszeiten, Natur
てんき | das Wetter · 天気
はれ | sonnig · 晴れ
あめ | der Regen · 雨
ゆき | der Schnee · 雪
くもり | bewölkt · 曇り
かぜ | der Wind · 風
あつい | heiß · 暑い
さむい | kalt (Wetter) · 寒い
あたたかい | warm · 暖かい
すずしい | kühl · 涼しい
はる | der Frühling · 春
なつ | der Sommer · 夏
あき | der Herbst · 秋
ふゆ | der Winter · 冬
さくら | die Kirschblüte · 桜
はなみ | das Kirschblütenfest · 花見
うみ | das Meer · 海
やま | der Berg · 山
もり | der Wald · 森
はな | die Blume · 花
そら | der Himmel · 空
たいふう | der Taifun · 台風
じしん | das Erdbeben · 地震
きせつ | die Jahreszeit · 季節

# v4-ryokou | りょこう | Reisen
りょこう | die Reise · 旅行
りょこうします | reisen · 旅行します
ホテル | das Hotel
りょかん | der traditionelle Gasthof · 旅館
おんせん | die heiße Quelle · 温泉
くうこう | der Flughafen · 空港
ひこうき | das Flugzeug · 飛行機
しんかんせん | der Shinkansen (Schnellzug) · 新幹線
きっぷ | die Fahrkarte · 切符
よやく | die Reservierung · 予約
にもつ | das Gepäck · 荷物
パスポート | der Reisepass
がいこく | das Ausland · 外国
かんこう | der Tourismus, die Besichtigung · 観光
おみやげ | das Mitbringsel · お土産
ちず | die Karte · 地図
とうきょう | Tokio · 東京
きょうと | Kyōto · 京都
おおさか | Ōsaka · 大阪
ふじさん | der Fuji · 富士山
とまります | übernachten · 泊まります
のります | einsteigen, fahren mit · 乗ります
おります | aussteigen · 降ります
たのしい | schön, Spaß machend · 楽しい
つかれました | ich bin müde geworden · 疲れました

# v4-kimochi | きもち | Gefühle und Eigenschaften
きもち | das Gefühl · 気持ち
うれしい | froh · 嬉しい
かなしい | traurig · 悲しい
さびしい | einsam · 寂しい
こわい | unheimlich, beängstigend · 怖い
はずかしい | peinlich, verlegen · 恥ずかしい
しんぱい | die Sorge · 心配
あんしん | die Beruhigung · 安心
おこります | sich ärgern · 怒ります
なきます | weinen · 泣きます
わらいます | lachen · 笑います
びっくりします | erschrecken, überrascht sein
すきです | ich mag dich / es
だいすき | sehr gern mögen · 大好き
げんき | munter, fit · 元気
しんせつ | hilfsbereit · 親切
まじめ | ernsthaft, fleißig · 真面目
しずか | ruhig, leise · 静か
にぎやか | lebhaft · 賑やか
きびしい | streng · 厳しい
あかるい | hell; fröhlich · 明るい
くらい | dunkel; düster · 暗い
ねむい | müde (schläfrig) · 眠い
いたい | es tut weh · 痛い

# v4-kanji2 | 漢字 2 | Weitere Kanji
今 | jetzt · いま
何 | was · なに / なん
時 | Zeit, Stunde · じ / とき
分 | Minute, verstehen · ふん / わ(かる)
半 | halb · はん
前 | vor · まえ
後 | nach, hinten · ご / うし(ろ)
午 | Mittag · ご
東 | Osten · ひがし
西 | Westen · にし
南 | Süden · みなみ
北 | Norden · きた
食 | essen · た(べる)
飲 | trinken · の(む)
見 | sehen · み(る)
行 | gehen · い(く)
来 | kommen · く(る)
言 | sagen · い(う)
話 | sprechen · はな(す)
読 | lesen · よ(む)
書 | schreiben · か(く)
買 | kaufen · か(う)
国 | Land · くに
語 | Sprache · ご
円 | Yen, Kreis · えん
白 | weiß · しろ

# v4-shigoto | しごと | Arbeit, Alltag, Gesellschaft
しごと | die Arbeit · 仕事
かいしゃ | die Firma · 会社
かいしゃいん | der Angestellte · 会社員
いしゃ | der Arzt · 医者
エンジニア | der Ingenieur
アルバイト | der Nebenjob
だいがく | die Universität · 大学
しょうらい | die Zukunft · 将来
ゆめ | der Traum · 夢
けいけん | die Erfahrung · 経験
かいぎ | die Besprechung · 会議
でんわ | das Telefon · 電話
メール | die E-Mail
けいたい | das Handy · 携帯
パソコン | der Computer
いそがしい | beschäftigt · 忙しい
ひま | frei, unbeschäftigt · 暇
やすみ | die Pause; der freie Tag · 休み
きゅうりょう | das Gehalt · 給料
おかね | das Geld · お金
はじめます | anfangen · 始めます
おわります | enden · 終わります
つかいます | benutzen · 使います
てつだいます | helfen · 手伝います
がんばります | sich anstrengen · 頑張ります

# g1-desu | 〜は〜です | Ich bin …, das ist …
> Der einfachste Satz: **A は B です** – „A ist B“.
> **は** ist hier die Themenpartikel und wird **wa** gesprochen.
> わたし**は**がくせい**です**。 – Ich bin Schüler.
> Verneinung: **じゃありません** (oder ではありません): わたしはせんせい**じゃありません**。
> Vergangenheit: **でした** (war) · **じゃありませんでした** (war nicht)
> Das Subjekt lässt man weg, wenn es klar ist: がくせいです。 – (Ich) bin Schüler.
? わたし{{c1::は}} がくせいです。 (Themenpartikel)
? わたしは ドイツじん{{c1::です}}。 (bin)
? たなかさんは せんせい{{c1::じゃありません}}。 (ist nicht)
? きのうは にちようび{{c1::でした}}。 (war)
? これ{{c1::は}} ほんです。
? あなたは がくせい{{c1::です}}か。
? わたしの なまえは ミア{{c1::です}}。
? あには だいがくせい{{c1::でした}}。 (war)

# g1-ka-no | Fragen, の und これ / それ / あれ | 〜ですか、わたしの
> Eine Frage entsteht mit **か** am Satzende – ein Fragezeichen ist nicht nötig: がくせいですか。
> Fragewörter: **なん / なに** (was) · **だれ** (wer) · **どこ** (wo) · **いつ** (wann) · **いくら** (wie viel kostet)
> **の** verbindet Nomen (Besitz, Zugehörigkeit): わたし**の**ほん – mein Buch · にほんご**の**せんせい – Japanischlehrer
> **これ** (das hier) · **それ** (das da bei dir) · **あれ** (das dort) · **どれ** (welches)
> Vor einem Nomen: **この** ほん · **その** ほん · **あの** ほん
? がくせいです{{c1::か}}。 (Frage)
? これは {{c1::なん}}ですか。 (was)
? あのひとは {{c1::だれ}}ですか。 (wer)
? トイレは {{c1::どこ}}ですか。 (wo)
? これは わたし{{c1::の}} ほんです。 (mein)
? {{c1::それ}}は なんですか。 (das da)
? {{c1::この}} かばんは いくらですか。 (diese …)
? たんじょうびは {{c1::いつ}}ですか。 (wann)

# g2-masu | Verben: ます-Form | たべます、たべません、たべました
> Die höfliche Verbform endet auf **ます**:
> Präsens/Zukunft: たべ**ます** (esse, werde essen)
> Verneinung: たべ**ません**
> Vergangenheit: たべ**ました**
> Verneinte Vergangenheit: たべ**ませんでした**
> Vorschlag: たべ**ましょう** (lass uns essen) · Einladung: たべ**ませんか** (wollen wir nicht essen?)
> Das Verb steht immer am **Satzende**.
? まいにち がっこうに いき{{c1::ます}}。 (gehe)
? わたしは さかなを たべ{{c1::ません}}。 (esse nicht)
? きのう えいがを み{{c1::ました}}。 (sah)
? きのうは べんきょうし{{c1::ませんでした}}。 (habe nicht gelernt)
? いっしょに たべ{{c1::ましょう}}。 (lass uns)
? こんばん えいがを み{{c1::ませんか}}。 (wollen wir nicht?)
? あさ しちじに おき{{c1::ます}}。 (stehe auf)
? しゅうまつ なにを し{{c1::ました}}か。 (hast du gemacht)

# g2-particles | Partikeln | を、に、で、へ、と、も
> Partikeln stehen **nach** dem Wort, dessen Rolle sie zeigen.
> **を** (o): direktes Objekt – パン**を**たべます
> **に**: Ziel, Zeitpunkt, Ort des Seins – がっこう**に**いきます · ろくじ**に**おきます
> **へ** (e): Richtung – にほん**へ**いきます
> **で**: Ort einer Handlung, Mittel – こうえん**で**あそびます · でんしゃ**で**いきます
> **と**: mit, und – ともだち**と**いきます · パン**と**たまご
> **も**: auch – わたし**も**がくせいです
? パン{{c1::を}} たべます。 (Objekt)
? がっこう{{c1::に}} いきます。 (Ziel)
? こうえん{{c1::で}} あそびます。 (Ort der Handlung)
? でんしゃ{{c1::で}} いきます。 (Mittel)
? ともだち{{c1::と}} えいがを みます。 (mit)
? しちじ{{c1::に}} おきます。 (Zeitpunkt)
? わたし{{c1::も}} にほんごを べんきょうします。 (auch)
? みず{{c1::を}} のみます。
? にほん{{c1::へ}} いきたいです。 (Richtung)

# g2-arimasu | あります und います | Es gibt, sich befinden
> **あります**: für Dinge und Pflanzen – つくえのうえに ほんが**あります**。
> **います**: für Menschen und Tiere – こうえんに いぬが**います**。
> Die Partikel **が** markiert, was da ist. Der Ort bekommt **に**.
> Ortswörter: うえ (oben) · した (unten) · なか (in) · まえ (vor) · うしろ (hinter) · となり (neben)
> „Haben“ (Geschwister usw.): きょうだいが **います**。 / じかんが **あります**。
? つくえの うえに ほんが {{c1::あります}}。 (Ding)
? こうえんに いぬが {{c1::います}}。 (Tier)
? きょうしつに せんせいが {{c1::います}}。 (Mensch)
? へやに テレビ{{c1::が}} あります。
? かばんの {{c1::なか}}に ペンが あります。 (in)
? いもうとが ふたり {{c1::います}}。 (Geschwister)
? きょうは じかんが {{c1::ありません}}。 (habe nicht)
? えきの {{c1::まえ}}に コンビニが あります。 (vor)

# g3-adjectives | Adjektive | い-Adjektive und な-Adjektive
> **い-Adjektive** enden auf い: たかい, おいしい, おもしろい
> verneint: たか**くない**です · Vergangenheit: たか**かった**です · verneint Vergangenheit: たか**くなかった**です
> Ausnahme: いい (gut) → **よくない**, **よかった**
> **な-Adjektive**: しずか, げんき, すき, きれい – vor Nomen mit **な**: しずか**な**まち
> verneint: しずか**じゃありません** · Vergangenheit: しずか**でした**
> Vor einem Nomen: たかい やま · しずかな へや
? この ラーメンは おいし{{c1::い}}です。
? きのうは さむ{{c1::かった}}です。 (war kalt)
? この えいがは おもしろ{{c1::くない}}です。 (nicht interessant)
? しず{{c1::か}}な まちです。
? テストは {{c1::よかった}}です。 (いい – Vergangenheit)
? にほんごが {{c1::すき}}です。 (mögen)
? この へやは きれい{{c1::じゃありません}}。 (nicht sauber)
? たか{{c1::い}} やまですね。
? きのうの パーティーは たのし{{c1::かった}}です。

# g3-te-form | て-Form | 〜てください、〜ています
> Die て-Form verbindet Sätze und bildet viele Strukturen.
> Bildung (nach der Wörterbuchform): たべる → たべ**て** · みる → み**て** · かく → か**いて** · のむ → の**んで** · まつ → ま**って** · はなす → はな**して** · する → **して** · くる → **きて** · いく → **いって**
> **〜てください**: bitte tun – みて**ください**
> **〜ています**: gerade tun / Zustand – たべて**います** (esse gerade) · すんで**います** (wohne)
> **〜てもいいですか**: darf ich? – しゃしんを とって**もいいですか**
> Reihenfolge: あさ おきて、ごはんを たべて、がっこうに いきます。
? ちょっと まっ{{c1::て}}ください。 (まつ)
? ここに なまえを かい{{c1::て}}ください。 (かく)
? いま ごはんを たべ{{c1::て}}います。 (gerade)
? とうきょうに すん{{c1::で}}います。 (すむ – wohnen)
? しゃしんを とっ{{c1::て}}もいいですか。 (とる)
? みず{{c1::を}} のんで、ねました。
? もう いちど いっ{{c1::て}}ください。 (いう – sagen)
? ともだちと はな{{c1::して}}います。 (はなす)
? まどを あけ{{c1::て}}ください。 (あける)

# g3-tai | Wünsche und Gründe | 〜たい、〜から
> **〜たい** (möchte tun): ます-Stamm + たい – たべ**たい**です · いき**たい**です
> verneint: たべ**たくない**です · Vergangenheit: たべ**たかった**です
> Etwas haben wollen: Nomen + **が ほしい**です – あたらしい けいたいが **ほしい**です
> **から** (weil): Grund + から – あついです**から**、まどを あけます。
> **でも** (aber) am Satzanfang, **が** (aber) zwischen zwei Sätzen.
? にほんに いき{{c1::たい}}です。 (möchte)
? すしを たべ{{c1::たい}}です。
? きょうは べんきょうし{{c1::たくない}}です。 (möchte nicht)
? あたらしい パソコンが {{c1::ほしい}}です。 (haben wollen)
? さむいです{{c1::から}}、コートを きます。 (weil)
? アニメが すきです{{c1::から}}、にほんごを べんきょうします。
? ねむいです。{{c1::でも}}、しゅくだいを します。 (aber)
? なにが {{c1::ほしい}}ですか。

# g4-plain | Einfache Form | たべる、たべない、たべた
> Mit Freunden und in Nebensätzen benutzt man die **einfache Form** (Wörterbuchform).
> Präsens: たべ**る** · verneint: たべ**ない** · Vergangenheit: たべ**た** · verneint: たべ**なかった**
> Gruppe 1: のむ → の**まない** · の**んだ** · かく → か**かない** · か**いた**
> Unregelmäßig: する → しない, した · くる → こない, きた · ある → **ない**
> Mit Nomen und な-Adjektiven: **だ** statt です – がくせい**だ** · しずか**だった**
> Vor Nomen (Relativsatz): きのう **みた** えいが – der Film, den ich gestern sah
? あした えいがを み{{c1::る}}。 (sehe – einfach)
? きょうは がっこうに いか{{c1::ない}}。 (gehe nicht)
? きのう すしを たべ{{c1::た}}。 (aß)
? しゅくだいを し{{c1::なかった}}。 (habe nicht gemacht)
? かれは がくせい{{c1::だ}}。 (ist)
? きのう {{c1::みた}} えいがは おもしろかった。 (sah)
? おかねが {{c1::ない}}。 (ある – verneint)
? ともだちが {{c1::きた}}。 (くる – Vergangenheit)
? ビールを のま{{c1::ない}}。 (trinke nicht)

# g4-comparison | Vergleiche | 〜より、いちばん
> **A は B より** + Adjektiv: A ist … als B – とうきょうは きょうと**より** おおきいです。
> Frage: **A と B と どちらが** …? – いぬと ねこと **どちらが** すきですか。
> Antwort: **A のほうが** … – ねこ**のほうが** すきです。
> Superlativ: **いちばん** (am meisten) – くだもので なにが **いちばん** すきですか。
> **〜ほど 〜ない**: nicht so … wie – きょうは きのう**ほど** さむく**ない**です。
? とうきょうは おおさか{{c1::より}} おおきいです。 (als)
? いぬと ねこと {{c1::どちら}}が すきですか。 (welches von beiden)
? ねこ{{c1::のほう}}が すきです。
? かぞくの なかで あにが {{c1::いちばん}} せが たかいです。 (am meisten)
? なつより ふゆの{{c1::ほう}}が すきです。
? きょうは きのう{{c1::ほど}} さむくないです。 (nicht so … wie)
? にほんで なにが {{c1::いちばん}} すきですか。
? でんしゃは バス{{c1::より}} はやいです。

# g4-kanou | Können und Erfahrung | 〜ことができる、〜たことがある
> **Wörterbuchform + ことが できます**: kann tun – にほんごを はなす**ことが できます**。
> Kurz: **Potentialform** – たべる → たべ**られる** · のむ → の**める** · する → **できる** · くる → **こられる**
> **Nomen + が できます**: ピアノ**が できます**。 (kann Klavier spielen)
> **た-Form + ことが あります**: hat schon einmal getan – にほんに いった**ことが あります**。
> verneint: いった**ことが ありません** (war noch nie)
? にほんごを はなす{{c1::ことが}} できます。
? すしを たべた{{c1::ことが}} ありますか。 (schon einmal gegessen)
? にほんに いった ことが {{c1::ありません}}。 (noch nie)
? わたしは ピアノが {{c1::できます}}。 (kann)
? かんじが よ{{c1::める}}。 (読む – lesen können)
? さかなが たべ{{c1::られ}}ます。 (たべる – essen können)
? ふじさんに のぼった ことが {{c1::あります}}。 (war schon einmal)
? およぐ ことが {{c1::できません}}。 (kann nicht)
`;

const blocks = [
  ["v1-hiragana", "v1-katakana", "v1-aisatsu", "v1-kazu", "g1-desu", "g1-ka-no"],
  ["v2-kazoku", "v2-gakkou", "v2-tabemono", "v2-jikan", "g2-masu", "g2-particles", "g2-arimasu"],
  ["v3-machi", "v3-shumi", "v3-kanji1", "v3-tenki", "g3-adjectives", "g3-te-form", "g3-tai"],
  ["v4-ryokou", "v4-kimochi", "v4-kanji2", "v4-shigoto", "g4-plain", "g4-comparison", "g4-kanou"],
];

export default { units: parseCourse(text), blocks };
