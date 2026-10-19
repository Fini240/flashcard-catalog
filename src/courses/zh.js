// The Chinese (Mandarin) course: self-study in four levels, starting with
// pinyin and the tones. Characters on the front so the voice reads them;
// German and the pinyin on the back. Format: see parseCourse in
// src/courses.js.
import { parseCourse } from "../courses.js";

const text = `
# v1-pinyin | 拼音 | Pinyin und die vier Töne
妈 | Mutter · mā – 1. Ton: hoch und gleichbleibend
麻 | Hanf · má – 2. Ton: steigend
马 | Pferd · mǎ – 3. Ton: fallend-steigend
骂 | schimpfen · mà – 4. Ton: scharf fallend
吗 | Fragepartikel · ma – neutraler Ton
八 | acht · bā
拔 | herausziehen · bá
把 | halten, fassen · bǎ
爸 | Papa · bà
衣 | Kleidung · yī
姨 | Tante · yí
椅 | Stuhl · yǐ
意 | Bedeutung · yì
书 | Buch · shū
熟 | reif, vertraut · shú
树 | Baum · shù
是 | sein · shì
四 | vier · sì
十 | zehn · shí
七 | sieben · qī
去 | gehen (hin) · qù
绿 | grün · lǜ (ü: i mit runden Lippen)
日 | Tag, Sonne · rì
菜 | Gemüse, Gericht · cài (c wie ts)
早 | früh · zǎo (z wie ds)
喝 | trinken · hē
雪 | Schnee · xuě (x wie ch in „ich“)

# v1-nihao | 你好 | Begrüßen und vorstellen
你好 | hallo · nǐ hǎo
您好 | guten Tag (höflich) · nín hǎo
早上好 | guten Morgen · zǎoshang hǎo
晚上好 | guten Abend · wǎnshang hǎo
再见 | auf Wiedersehen · zàijiàn
谢谢 | danke · xièxie
不客气 | gern geschehen · bú kèqi
对不起 | Entschuldigung · duìbuqǐ
没关系 | macht nichts · méi guānxi
我 | ich · wǒ
你 | du · nǐ
他 / 她 | er / sie · tā
我们 | wir · wǒmen
你叫什么名字？ | Wie heißt du? · nǐ jiào shénme míngzi?
我叫 … | ich heiße … · wǒ jiào …
你是哪国人？ | Woher kommst du? · nǐ shì nǎ guó rén?
我是德国人 | ich bin Deutsche(r) · wǒ shì Déguó rén
中国 | China · Zhōngguó
中文 | Chinesisch (Sprache) · Zhōngwén
学生 | der Schüler, der Student · xuésheng
老师 | der Lehrer · lǎoshī
朋友 | der Freund · péngyou
很高兴认识你 | freut mich, dich kennenzulernen · hěn gāoxìng rènshi nǐ
你好吗？ | Wie geht's? · nǐ hǎo ma?
我很好 | mir geht's gut · wǒ hěn hǎo

# v1-shuzi | 数字 | Zahlen und Alter
一 | eins · yī
二 | zwei · èr
三 | drei · sān
五 | fünf · wǔ
六 | sechs · liù
九 | neun · jiǔ
十一 | elf · shíyī
二十 | zwanzig · èrshí
一百 | hundert · yìbǎi
一千 | tausend · yìqiān
一万 | zehntausend · yíwàn
零 | null · líng
两 | zwei (vor Zählwörtern) · liǎng
你几岁？ | Wie alt bist du (Kind)? · nǐ jǐ suì?
你多大？ | Wie alt bist du? · nǐ duō dà?
我十六岁 | ich bin sechzehn · wǒ shíliù suì
多少钱？ | Wie viel kostet das? · duōshao qián?
块 | Yuan (umgangssprachlich) · kuài
几点？ | Wie spät? · jǐ diǎn?
点 | Uhr · diǎn
分 | Minute · fēn
半 | halb · bàn
号 | Nummer; Tag (Datum) · hào
月 | Monat · yuè
年 | Jahr · nián

# v2-jiating | 家庭 | Familie
家 | die Familie; das Zuhause · jiā
家人 | die Familienangehörigen · jiārén
爸爸 | Papa · bàba
妈妈 | Mama · māma
哥哥 | älterer Bruder · gēge
姐姐 | ältere Schwester · jiějie
弟弟 | jüngerer Bruder · dìdi
妹妹 | jüngere Schwester · mèimei
爷爷 | Großvater (väterlicherseits) · yéye
奶奶 | Großmutter (väterlicherseits) · nǎinai
儿子 | der Sohn · érzi
女儿 | die Tochter · nǚ'ér
孩子 | das Kind · háizi
狗 | der Hund · gǒu
猫 | die Katze · māo
人 | der Mensch · rén
男 / 女 | männlich / weiblich · nán / nǚ
高 | groß, hoch · gāo
矮 | klein (Körper) · ǎi
漂亮 | hübsch · piàoliang
帅 | gut aussehend · shuài
聪明 | klug · cōngming
住 | wohnen · zhù
爱 | lieben · ài
喜欢 | mögen · xǐhuan

# v2-xuexiao | 学校 | Schule
学校 | die Schule · xuéxiào
中学 | die Mittelschule · zhōngxué
教室 | das Klassenzimmer · jiàoshì
课 | der Unterricht, die Lektion · kè
作业 | die Hausaufgabe · zuòyè
考试 | die Prüfung · kǎoshì
书 (本) | das Buch · shū
本子 | das Heft · běnzi
笔 | der Stift · bǐ
书包 | die Schultasche · shūbāo
桌子 | der Tisch · zhuōzi
椅子 | der Stuhl · yǐzi
数学 | Mathematik · shùxué
英语 | Englisch · Yīngyǔ
历史 | Geschichte · lìshǐ
体育 | Sport (Fach) · tǐyù
同学 | der Mitschüler · tóngxué
学习 | lernen · xuéxí
看书 | lesen · kàn shū
写 | schreiben · xiě
说 | sprechen · shuō
听 | hören · tīng
懂 | verstehen · dǒng
难 | schwierig · nán
容易 | leicht · róngyì

# v2-shiwu | 食物 | Essen und Trinken
吃 | essen · chī
饭 | der Reis; die Mahlzeit · fàn
早饭 | das Frühstück · zǎofàn
午饭 | das Mittagessen · wǔfàn
晚饭 | das Abendessen · wǎnfàn
米饭 | gekochter Reis · mǐfàn
面条 | die Nudeln · miàntiáo
饺子 | die Jiaozi (Teigtaschen) · jiǎozi
包子 | die gefüllten Dampfbrötchen · bāozi
肉 | das Fleisch · ròu
鸡蛋 | das Ei · jīdàn
鱼 | der Fisch · yú
水果 | das Obst · shuǐguǒ
苹果 | der Apfel · píngguǒ
水 | das Wasser · shuǐ
茶 | der Tee · chá
咖啡 | der Kaffee · kāfēi
牛奶 | die Milch · niúnǎi
好吃 | lecker · hǎochī
辣 | scharf · là
甜 | süß · tián
饿 | hungrig · è
渴 | durstig · kě
筷子 | die Essstäbchen · kuàizi
饭馆 | das Restaurant · fànguǎn

# v2-shijian | 时间 | Tage, Zeit, Tagesablauf
时间 | die Zeit · shíjiān
今天 | heute · jīntiān
明天 | morgen · míngtiān
昨天 | gestern · zuótiān
现在 | jetzt · xiànzài
早上 | der Morgen · zǎoshang
中午 | der Mittag · zhōngwǔ
晚上 | der Abend · wǎnshang
每天 | jeden Tag · měitiān
周末 | das Wochenende · zhōumò
星期一 | Montag · xīngqīyī
星期二 | Dienstag · xīngqī'èr
星期三 | Mittwoch · xīngqīsān
星期四 | Donnerstag · xīngqīsì
星期五 | Freitag · xīngqīwǔ
星期六 | Samstag · xīngqīliù
星期天 | Sonntag · xīngqītiān
起床 | aufstehen · qǐchuáng
睡觉 | schlafen · shuìjiào
上课 | Unterricht haben · shàngkè
下课 | Unterrichtsschluss · xiàkè
回家 | nach Hause gehen · huí jiā
工作 | arbeiten; die Arbeit · gōngzuò
有时候 | manchmal · yǒu shíhou
常常 | oft · chángcháng

# v3-chengshi | 城市 | Stadt und Wege
城市 | die Stadt · chéngshì
北京 | Peking · Běijīng
上海 | Shanghai · Shànghǎi
火车站 | der Bahnhof · huǒchēzhàn
地铁 | die U-Bahn · dìtiě
公共汽车 | der Bus · gōnggòng qìchē
出租车 | das Taxi · chūzūchē
自行车 | das Fahrrad · zìxíngchē
商店 | der Laden · shāngdiàn
超市 | der Supermarkt · chāoshì
医院 | das Krankenhaus · yīyuàn
银行 | die Bank · yínháng
公园 | der Park · gōngyuán
图书馆 | die Bibliothek · túshūguǎn
路 | die Straße, der Weg · lù
左边 | links · zuǒbian
右边 | rechts · yòubian
一直走 | geradeaus gehen · yìzhí zǒu
近 | nah · jìn
远 | weit · yuǎn
在哪儿？ | Wo ist es? · zài nǎr?
这儿 / 那儿 | hier / dort · zhèr / nàr
买 | kaufen · mǎi
坐 | sitzen; fahren mit · zuò
到 | ankommen, bis · dào

# v3-aihao | 爱好 | Hobbys und Freizeit
爱好 | das Hobby · àihào
音乐 | die Musik · yīnyuè
电影 | der Film · diànyǐng
运动 | der Sport · yùndòng
踢足球 | Fußball spielen · tī zúqiú
打篮球 | Basketball spielen · dǎ lánqiú
游泳 | schwimmen · yóuyǒng
跑步 | joggen · pǎobù
唱歌 | singen · chàng gē
跳舞 | tanzen · tiàowǔ
画画儿 | malen · huà huàr
照相 | fotografieren · zhàoxiàng
玩儿 | spielen, sich vergnügen · wánr
游戏 | das Spiel · yóuxì
上网 | im Internet surfen · shàngwǎng
看电视 | fernsehen · kàn diànshì
旅游 | reisen · lǚyóu
做饭 | kochen · zuò fàn
一起 | zusammen · yìqǐ
有意思 | interessant · yǒu yìsi
无聊 | langweilig · wúliáo
会 | können (gelernt) · huì
能 | können (möglich sein) · néng
想 | möchten; denken · xiǎng
要 | wollen; werden · yào

# v3-tianqi | 天气 | Wetter und Jahreszeiten
天气 | das Wetter · tiānqì
晴天 | sonniger Tag · qíngtiān
下雨 | regnen · xià yǔ
下雪 | schneien · xià xuě
阴天 | bewölkter Tag · yīntiān
刮风 | windig sein · guā fēng
热 | heiß · rè
冷 | kalt · lěng
暖和 | warm · nuǎnhuo
凉快 | kühl · liángkuai
春天 | der Frühling · chūntiān
夏天 | der Sommer · xiàtiān
秋天 | der Herbst · qiūtiān
冬天 | der Winter · dōngtiān
山 | der Berg · shān
河 | der Fluss · hé
海 | das Meer · hǎi
花 | die Blume · huā
天 | der Himmel; der Tag · tiān
太阳 | die Sonne · tàiyáng
月亮 | der Mond · yuèliang
度 | Grad · dù
季节 | die Jahreszeit · jìjié
雨伞 | der Regenschirm · yǔsǎn

# v3-gouwu | 购物 | Kleidung und Einkaufen
衣服 | die Kleidung · yīfu
衬衫 | das Hemd · chènshān
T恤 | das T-Shirt · T-xù
裤子 | die Hose · kùzi
裙子 | der Rock · qúnzi
鞋 | die Schuhe · xié
帽子 | der Hut, die Mütze · màozi
大 / 小 | groß / klein · dà / xiǎo
贵 | teuer · guì
便宜 | billig · piányi
试 | anprobieren, versuchen · shì
穿 | anziehen, tragen · chuān
颜色 | die Farbe · yánsè
红色 | rot · hóngsè
蓝色 | blau · lánsè
黑色 | schwarz · hēisè
白色 | weiß · báisè
钱 | das Geld · qián
付钱 | bezahlen · fù qián
手机支付 | mit dem Handy bezahlen · shǒujī zhīfù
打折 | Rabatt geben · dǎzhé
商场 | das Kaufhaus · shāngchǎng
件 | Zählwort für Kleidung · jiàn
双 | Paar (Zählwort) · shuāng

# v4-lvxing | 旅行 | Reisen
旅行 | die Reise; reisen · lǚxíng
宾馆 | das Hotel · bīnguǎn
飞机 | das Flugzeug · fēijī
机场 | der Flughafen · jīchǎng
火车 | der Zug · huǒchē
高铁 | der Hochgeschwindigkeitszug · gāotiě
票 | die Fahrkarte · piào
护照 | der Reisepass · hùzhào
签证 | das Visum · qiānzhèng
行李 | das Gepäck · xíngli
地图 | die Landkarte · dìtú
长城 | die Große Mauer · Chángchéng
故宫 | der Kaiserpalast · Gùgōng
外国 | das Ausland · wàiguó
外国人 | der Ausländer · wàiguórén
导游 | der Reiseführer (Person) · dǎoyóu
礼物 | das Geschenk · lǐwù
照片 | das Foto · zhàopiàn
参观 | besichtigen · cānguān
迷路 | sich verlaufen · mílù
累 | müde · lèi
开心 | fröhlich, glücklich · kāixīn
出发 | aufbrechen · chūfā
离开 | verlassen · líkāi

# v4-ganqing | 感情 | Gefühle und Eigenschaften
高兴 | froh · gāoxìng
难过 | traurig · nánguò
生气 | wütend · shēngqì
害怕 | Angst haben · hàipà
担心 | sich Sorgen machen · dānxīn
紧张 | nervös · jǐnzhāng
寂寞 | einsam · jìmò
幸福 | glücklich · xìngfú
哭 | weinen · kū
笑 | lachen · xiào
我爱你 | ich liebe dich · wǒ ài nǐ
想你 | dich vermissen · xiǎng nǐ
友好 | freundlich · yǒuhǎo
热情 | herzlich · rèqíng
认真 | gewissenhaft · rènzhēn
安静 | ruhig · ānjìng
活泼 | lebhaft · huópo
害羞 | schüchtern · hàixiū
懒 | faul · lǎn
忙 | beschäftigt · máng
舒服 | bequem, wohl · shūfu
感觉 | das Gefühl; fühlen · gǎnjué
心情 | die Stimmung · xīnqíng
失望 | enttäuscht · shīwàng

# v4-gongzuo | 工作和未来 | Arbeit und Zukunft
公司 | die Firma · gōngsī
职员 | der Angestellte · zhíyuán
医生 | der Arzt · yīshēng
护士 | der Krankenpfleger, die Krankenschwester · hùshi
律师 | der Anwalt · lǜshī
工程师 | der Ingenieur · gōngchéngshī
大学 | die Universität · dàxué
大学生 | der Student · dàxuéshēng
将来 | die Zukunft · jiānglái
理想 | das Ideal, der Traumberuf · lǐxiǎng
经验 | die Erfahrung · jīngyàn
开会 | eine Besprechung haben · kāihuì
电话 | das Telefon · diànhuà
手机 | das Handy · shǒujī
电脑 | der Computer · diànnǎo
打工 | jobben · dǎgōng
工资 | der Lohn · gōngzī
挣钱 | Geld verdienen · zhèng qián
开始 | anfangen · kāishǐ
结束 | enden · jiéshù
努力 | sich anstrengen · nǔlì
成功 | Erfolg · chénggōng
机会 | die Gelegenheit · jīhuì
面试 | das Vorstellungsgespräch · miànshì

# v4-wenhua | 中国文化 | Chinesische Kultur
文化 | die Kultur · wénhuà
春节 | das Frühlingsfest (Neujahr) · Chūnjié
中秋节 | das Mondfest · Zhōngqiūjié
月饼 | der Mondkuchen · yuèbing
红包 | der rote Umschlag (Geldgeschenk) · hóngbāo
汉字 | das chinesische Schriftzeichen · Hànzì
书法 | die Kalligrafie · shūfǎ
功夫 | Kung-Fu · gōngfu
太极拳 | Taiji · tàijíquán
京剧 | die Peking-Oper · Jīngjù
熊猫 | der Panda · xióngmāo
龙 | der Drache · lóng
孔子 | Konfuzius · Kǒngzǐ
历史悠久 | eine lange Geschichte haben · lìshǐ yōujiǔ
传统 | die Tradition · chuántǒng
普通话 | Hochchinesisch · pǔtōnghuà
方言 | der Dialekt · fāngyán
筷子文化 | die Esskultur mit Stäbchen · kuàizi wénhuà
面子 | das Gesicht (Ansehen) · miànzi
关系 | die Beziehung(en) · guānxi
茶文化 | die Teekultur · chá wénhuà
长江 | der Jangtsekiang · Cháng Jiāng
黄河 | der Gelbe Fluss · Huáng Hé

# g1-shi | 是 und Sätze mit Adjektiven | 我是学生 – 我很好
> **A 是 B** – „A ist B“ (bei Nomen): 我**是**学生。
> Verneinung mit **不**: 我**不是**老师。 (bù wird vor 4. Ton zu bú: bú shì)
> **Adjektive** stehen ohne 是, meist mit **很** davor: 我**很**好。 他**很**高。
> Verben haben **keine Konjugation** – 我是, 你是, 他是: immer gleich.
> Plural bei Personen: **们** – 我们 (wir), 你们 (ihr), 他们 (sie)
? 我{{c1::是}}学生。 (bin)
? 他{{c1::不}}是老师。 (nicht)
? 我{{c1::很}}好。 (sehr – vor Adjektiv)
? 她很{{c1::高}}。 (groß)
? {{c1::我们}}是朋友。 (wir)
? 你{{c1::是}}德国人。
? 我妈妈{{c1::很}}忙。
? {{c1::他们}}不是中国人。 (sie – Pl.)
? 中文很{{c1::难}}。 (schwierig)

# g1-ma-ne | Fragen | 吗、呢、什么、谁、哪儿
> **吗** am Satzende macht aus einer Aussage eine Ja/Nein-Frage: 你是学生**吗**？
> **呢** fragt zurück: 我很好，你**呢**？ (Und du?)
> Fragewörter stehen **dort, wo die Antwort steht** – keine Umstellung:
> 你叫**什么**？ – 我叫小明。 · 他是**谁**？ · 你去**哪儿**？ · **几**点？ · **怎么样**？ (wie)
> Ja/Nein-Antwort: das Verb wiederholen – 是。/ 不是。
? 你是学生{{c1::吗}}？ (Ja/Nein-Frage)
? 我很好，你{{c1::呢}}？ (und du?)
? 你叫{{c1::什么}}名字？ (was)
? 他是{{c1::谁}}？ (wer)
? 你去{{c1::哪儿}}？ (wohin)
? 现在{{c1::几}}点？ (wie viel – Uhr)
? 这个菜{{c1::怎么样}}？ (wie)
? 你喜欢喝茶{{c1::吗}}？
? 你是哪国人？ – 我是{{c1::德国}}人。

# g2-de | 的 und Satzstellung | 我的书 – 我早上喝茶
> **的** (de) verbindet Bestimmung und Nomen: 我**的**书 (mein Buch) · 老师**的**名字 · 很漂亮**的**花
> Bei Familie und engen Beziehungen fällt 的 oft weg: 我妈妈, 我朋友
> **Satzstellung**: Subjekt – Zeit – Ort – Verb – Objekt
> 我 **明天** **在家** 学习 中文。 – Ich lerne morgen zu Hause Chinesisch.
> Zeit kann auch ganz vorne stehen: 明天我在家学习。
? 这是我{{c1::的}}书。 (mein)
? 老师{{c1::的}}名字是什么？
? 我{{c1::明天}}去北京。 (morgen – Zeit vor Verb)
? 我{{c1::在}}家学习中文。 (zu Hause)
? 这是很漂亮{{c1::的}}衣服。
? 我{{c1::妈妈}}是医生。 (ohne 的)
? 他每天早上{{c1::喝}}咖啡。 (trinken)
? 这是谁{{c1::的}}手机？ (wessen)

# g2-measure | Zählwörter | 一个人、两本书
> Zwischen Zahl und Nomen steht ein **Zählwort** (量词):
> **个** gè – allgemein, Menschen: 一**个**人, 三**个**苹果
> **本** běn – Bücher: 两**本**书 · **张** zhāng – flache Dinge: 一**张**纸 · **只** zhī – Tiere: 一**只**猫
> **杯** bēi – Tasse/Glas: 一**杯**茶 · **件** jiàn – Kleidung · **辆** liàng – Fahrzeuge
> Für „zwei“ vor Zählwort **两** statt 二: **两**个人
> Auch nach 这 (dies) / 那 (jenes): **这个**, **那本**书
? 我有一{{c1::个}}哥哥。 (allgemein)
? 桌子上有两{{c1::本}}书。 (Bücher)
? 我要一{{c1::杯}}咖啡。 (Tasse)
? 她有一{{c1::只}}猫。 (Tiere)
? 我买了一{{c1::件}}衣服。 (Kleidung)
? 我有{{c1::两}}个妹妹。 (zwei vor Zählwort)
? {{c1::这}}个苹果很好吃。 (dieser)
? 那{{c1::张}}照片很漂亮。 (flache Dinge)
? 我家有三{{c1::个}}人。

# g2-you | 有、没有、在 | haben, es gibt, sich befinden
> **有** (yǒu): haben, es gibt – 我**有**一个弟弟。 桌子上**有**一本书。
> Verneinung **immer 没有** (nie 不有): 我**没有**钱。
> **在** (zài): sich befinden – 书**在**桌子上。 我**在**学校。
> Ortswörter nach dem Nomen: 上 (auf) · 下 (unter) · 里 (in) · 前边 (vor) · 后边 (hinter) · 旁边 (neben)
> 有 = es gibt (etwas Unbestimmtes) · 在 = ist (das Bestimmte) dort.
? 我{{c1::有}}两个姐姐。 (habe)
? 我{{c1::没有}}时间。 (habe nicht)
? 我的书{{c1::在}}桌子上。 (befindet sich)
? 公园里{{c1::有}}很多人。 (es gibt)
? 妈妈{{c1::在}}家吗？
? 椅子{{c1::下}}有一只猫。 (unter)
? 书包{{c1::里}}有什么？ (in)
? 银行在超市{{c1::旁边}}。 (neben)
? 他{{c1::没}}有手机。 (nicht)

# g3-le | 了 und Vergangenheit | 我吃了 – 下雨了
> Chinesisch hat keine Zeitformen; **了** zeigt, dass etwas **abgeschlossen** ist oder sich **geändert** hat.
> Nach dem Verb: 我吃**了**两个包子。 (Ich habe zwei gegessen.)
> Am Satzende – neue Situation: 下雨**了**。 (Jetzt regnet es.) · 我十六岁**了**。
> Verneinung der Vergangenheit: **没(有)** + Verb, **ohne** 了: 我**没**吃。
> Frage: 你吃**了吗**？ / 你吃**了没有**？
? 我昨天买{{c1::了}}一件衣服。 (abgeschlossen)
? 下雨{{c1::了}}。 (neue Situation)
? 我{{c1::没}}去学校。 (nicht gegangen)
? 你吃饭了{{c1::吗}}？
? 他已经走{{c1::了}}。 (schon gegangen)
? 我十六岁{{c1::了}}。
? 昨天我{{c1::没有}}看电视。 (nicht)
? 我们看{{c1::了}}一个电影。

# g3-guo | Erfahrung mit 过 und Zukunft | 去过、要、会
> **过** (guo) nach dem Verb: hat schon einmal erlebt – 我去**过**中国。
> Verneinung: **没(有)** + Verb + **过**: 我**没**吃**过**饺子。
> Zukunft und Absicht: **要** (werden, vorhaben) – 我明天**要**去北京。 · **会** (wird wohl) – 明天**会**下雨。
> **想** (möchte): 我**想**学中文。
> **快要 … 了**: gleich, bald – 火车**快要**开**了**。
? 我去{{c1::过}}上海。 (schon einmal)
? 你吃{{c1::过}}饺子吗？
? 我{{c1::没}}看过这个电影。 (noch nie)
? 我明天{{c1::要}}去北京。 (vorhaben)
? 明天{{c1::会}}下雨吗？ (wird wohl)
? 我{{c1::想}}学中文。 (möchte)
? 火车{{c1::快要}}开了。 (gleich)
? 你学{{c1::过}}汉字吗？

# g3-modal | 会、能、可以 und 不 / 没 | können, dürfen, verneinen
> **会** huì: gelernt haben – 我**会**说中文。 · 我**会**游泳。
> **能** néng: möglich sein, in der Lage sein – 今天我不**能**来。
> **可以** kěyǐ: dürfen – 我**可以**进来吗？
> **不** bù: Gegenwart, Zukunft, Gewohnheit, Adjektive – 我**不**喝咖啡。
> **没** méi: Vergangenheit und **有** – 我昨天**没**来。 我**没**有钱。
? 我{{c1::会}}说一点儿中文。 (gelernt)
? 今天我不{{c1::能}}去。 (möglich)
? 我{{c1::可以}}用你的电脑吗？ (dürfen)
? 我{{c1::不}}喜欢吃肉。 (Gewohnheit)
? 昨天他{{c1::没}}来。 (Vergangenheit)
? 你{{c1::会}}游泳吗？
? 这儿不{{c1::可以}}照相。 (darf nicht)
? 我{{c1::没}}有兄弟姐妹。
? 天气{{c1::不}}冷。 (Adjektiv)

# g4-bi | Vergleiche | 比、没有…那么、最
> **A 比 B + Adjektiv**: A ist … als B – 北京**比**上海冷。 (ohne 很!)
> Unterschied genauer: 他**比**我高**一点儿** / **得多**
> **A 没有 B (那么) + Adjektiv**: A ist nicht so … wie B – 我**没有**他**那么**高。
> **A 跟 B 一样**: A ist genauso wie B – 我**跟**你**一样**大。
> **最**: am meisten – 我**最**喜欢夏天。
? 北京{{c1::比}}上海冷。 (als)
? 哥哥比我高{{c1::一点儿}}。 (ein bisschen)
? 我{{c1::没有}}他那么高。 (nicht so … wie)
? 我跟你一{{c1::样}}大。 (genauso)
? 我{{c1::最}}喜欢吃饺子。 (am meisten)
? 今天比昨天{{c1::热}}。 (heiß)
? 坐高铁比坐飞机{{c1::便宜}}吗？ (billig)
? 中文比英语{{c1::难}}得多。 (schwierig)

# g4-zai | Verlaufsform und Ergebnis | 正在、着、得
> **(正)在 + Verb (+ 呢)**: gerade dabei sein – 我**正在**吃饭**呢**。
> **着** (zhe): andauernder Zustand – 门开**着**。 (Die Tür steht offen.) · 他穿**着**红衣服。
> **得** (de) beschreibt, **wie** man etwas tut: Verb + 得 + Bewertung – 他说**得**很好。 · 你跑**得**真快！
> Mit Objekt: Verb wiederholen – 他说中文说**得**很好。
? 我{{c1::正在}}看书呢。 (gerade)
? 他{{c1::在}}睡觉。 (gerade)
? 门开{{c1::着}}。 (Zustand)
? 他说{{c1::得}}很好。 (wie)
? 你跑得{{c1::很快}}！ (sehr schnell)
? 她唱歌唱{{c1::得}}很好听。
? 妈妈正在做饭{{c1::呢}}。
? 他穿{{c1::着}}一件红衬衫。

# g4-yinwei | Sätze verbinden | 因为…所以、虽然…但是、如果…就
> **因为 … 所以 …**: weil … deshalb – **因为**下雨，**所以**我不去。
> **虽然 … 但是 …**: obwohl … (trotzdem) – **虽然**中文很难，**但是**很有意思。
> **如果 … 就 …**: wenn … dann – **如果**明天天气好，我们**就**去公园。
> **一 … 就 …**: sobald – 我**一**回家**就**睡觉。
> **先 … 然后 …**: zuerst … dann – 我**先**写作业，**然后**看电视。
? {{c1::因为}}下雨，所以我在家。 (weil)
? 因为他病了，{{c1::所以}}没来。 (deshalb)
? {{c1::虽然}}中文很难，但是很有意思。 (obwohl)
? 虽然很累，{{c1::但是}}很开心。 (aber)
? {{c1::如果}}你有时间，就来我家吧。 (wenn)
? 如果明天下雨，我们{{c1::就}}不去了。 (dann)
? 我一到家{{c1::就}}吃饭。 (sobald)
? 我{{c1::先}}吃饭，然后学习。 (zuerst)
`;

const blocks = [
  ["v1-pinyin", "v1-nihao", "v1-shuzi", "g1-shi", "g1-ma-ne"],
  ["v2-jiating", "v2-xuexiao", "v2-shiwu", "v2-shijian", "g2-de", "g2-measure", "g2-you"],
  ["v3-chengshi", "v3-aihao", "v3-tianqi", "v3-gouwu", "g3-le", "g3-guo", "g3-modal"],
  ["v4-lvxing", "v4-ganqing", "v4-gongzuo", "v4-wenhua", "g4-bi", "g4-zai", "g4-yinwei"],
];

export default { units: parseCourse(text), blocks };
