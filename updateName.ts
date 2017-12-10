import { OdnTweetData, OdnTweets } from "../../../odnTweets"
import { OdnProfiles } from "../../../odnProfiles";
import { OdnPlugins, OdnPluginResultData } from "../../../odnPlugins";
import {Log, OdnUtils} from "../../../odnUtils";
import { TwitterProfileConfigs } from "../../../configs/twitterProfileConfigs";
import NAME_LEN_MAX = Constants.NAME_LEN_MAX;

export class UpdateName {
  constructor(private tweetData: OdnTweetData, private fullName: string) {}

  /**
   * プラグインのメイン処理を実行
   *
   * @param {(isProcessed?: boolean) => void} finish
   */
  run(finish: (isProcessed?: boolean) => void) {
    Log.t(this.tweetData.text);
    if (UpdateName.isRandAction(this.tweetData)) {
      // ランダムにする
      this.updateNameRand((isSuccess, newName) => {
        this.postResult(isSuccess, newName, () => {
          finish();
        });
      });
    } else if (UpdateName.isShuffleAction(this.tweetData)) {
      // シャッフルする
      this.updateNameShuffle((isSuccess, newName) => {
        this.postResult(isSuccess, newName, () => {
          finish();
        });
      });
    } else if (UpdateName.isSortAction(this.tweetData)) {
      // ランダムにソートする
      this.updateNameSort((isSuccess, newName) => {
        this.postResult(isSuccess, newName, () => {
          finish();
        });
      });
    } else {
      // それ以外
      const newName = OdnUtils.getSurrogatePairList(this.tweetData.action).slice(0, Constants.NAME_LEN_MAX).join("");
      this.updateNameBy(newName, (isSuccess, newName) => {
        this.postResult(isSuccess, newName, () => {
          finish();
        });
      });
    }
  }

  /**
   * プラグインを実行するかどうか判定
   *
   * @param {OdnTweetData} tweetData
   * @returns {boolean}
   */
  static isValid(tweetData: OdnTweetData): boolean {
    let result: boolean = true;
    result = result ? tweetData.isReplyToMe() : false;
    result = result ? (tweetData.command.match(/^update_name$/gi) ? result : false) : false;
    result = result ? this.isValidAction(tweetData) : false;
    return result;
  }

  /**
   * ランダムにするアクションか
   *
   * @param {OdnTweetData} tweetData
   * @returns {boolean}
   */
  static isRandAction(tweetData: OdnTweetData): boolean {
    return tweetData.action.match(/^(rand|random)$/) ? true : false;
  }

  /**
   * シャッフルにするアクションか
   *
   * @param {OdnTweetData} tweetData
   * @returns {boolean}
   */
  static isShuffleAction(tweetData: OdnTweetData): boolean {
    return tweetData.action.match(/^(shuffle)$/) ? true : false;
  }

  /**
   * ソートするアクションか
   *
   * @param {OdnTweetData} tweetData
   * @returns {boolean}
   */
  static isSortAction(tweetData: OdnTweetData): boolean {
    return tweetData.action.match(/^(sort)$/) ? true : false;
  }

  /**
   * アクションが指定されているか
   *
   * @param {OdnTweetData} tweetData
   * @returns {boolean}
   */
  static isValidAction(tweetData: OdnTweetData): boolean {
    return tweetData.action && 0 < tweetData.action.length;
  }

  /**
   * 指定された文字列でnameを更新
   *
   * @param {string} name
   * @param {(isSuccess: boolean, newName: string) => void} callback
   */
  private updateNameBy(name: string, callback: (isSuccess: boolean, newName: string) => void) {
    const profiles = new OdnProfiles(this.tweetData.accountData);
    profiles.user.name = name;
    profiles.updateProfile((isSuccess) => {
      callback(isSuccess, name);
    });
  }

  /**
   * 名前をランダムで変更
   *
   * @param {(isSuccess: boolean, newName: string) => void} callback
   */
  private updateNameRand(callback: (isSuccess: boolean, newName: string) => void) {
    let c = "";
    const resouceOption = this.tweetData.options && 1 < this.tweetData.options.length ? this.tweetData.options[1] : "";
    let len = this.tweetData.options && 0 < this.tweetData.options.length ? parseInt(this.tweetData.options[0]) : 4;
    if (isNaN(len)) {
      len = 4;
    } else if (Constants.NAME_LEN_MAX < len) {
      len = Constants.NAME_LEN_MAX;
    } else if (len <= 0) {
      len = 1;
    }

    if (resouceOption.match(/^(h).*$/gi)) {
      c += UpdateNameResouces.getHiragana();
      c += UpdateNameResouces.getKigou();
    } else if (resouceOption.match(/^(kat).*$/gi)) {
      c += UpdateNameResouces.getKatakana();
      c += UpdateNameResouces.getKigou();
    } else if (resouceOption.match(/^(kan).*$/gi)) {
      c += UpdateNameResouces.getKanji();
    } else if (resouceOption.match(/^(e).*$/gi)) {
      c += UpdateNameResouces.getEmoji();
    } else if (resouceOption.match(/^(c).*$/gi)) {
      c += UpdateNameResouces.getHiragana();
      c += UpdateNameResouces.getKatakana();
      c += UpdateNameResouces.getKigou();
      c += UpdateNameResouces.getKanji();
      c += UpdateNameResouces.getEmoji();
    } else {
      // 文字列リソースをランダムで取得
      const randNum = OdnUtils.rand(0, 3);
      if (0 === randNum) {
        c += UpdateNameResouces.getHiragana();
        c += UpdateNameResouces.getKigou();
      } else if (1 === randNum) {
        c += UpdateNameResouces.getKatakana();
        c += UpdateNameResouces.getKigou();
      } else if (2 === randNum) {
        c += UpdateNameResouces.getKanji();
      } else {
        c += UpdateNameResouces.getEmoji();
      }
    }

    const newNameList = OdnUtils.getSurrogatePairList(c);
    const newName = OdnUtils.shuffleList(newNameList).slice(0, len).join("");
    Log.d("name: " + newName);
    this.updateNameBy(newName, (isSuccess) => {
      callback(isSuccess, newName);
    })
  }

  /**
   * 名前をシャッフルする
   *
   * @param {(isSuccess: boolean, newName: string) => void} callback
   */
  private updateNameShuffle(callback: (isSuccess: boolean, newName: string) => void) {
    const profileData = TwitterProfileConfigs.getProfile(this.tweetData.accountData.userId);
    const currentName = this.tweetData.options && 0 < this.tweetData.options.length ? this.tweetData.options[0] : profileData.name;
    let newNameList = OdnUtils.getSurrogatePairList(currentName);
    newNameList = OdnUtils.shuffleList(newNameList);
    const newName = newNameList.slice(0, Constants.NAME_LEN_MAX).join("");
    Log.d("name: " + newName);

    this.updateNameBy(newName, (isSuccess) => {
      callback(isSuccess, newName);
    });
  }

  /**
   * 名前をランダムにソートする
   *
   * @param {(isSuccess: boolean, newName: string) => void} callback
   */
  private updateNameSort(callback: (isSuccess: boolean, newName: string) => void) {
    const profileData = TwitterProfileConfigs.getProfile(this.tweetData.accountData.userId);
    const currentName = this.tweetData.options && 0 < this.tweetData.options.length ? this.tweetData.options[0] : profileData.name;
    let newNameList = OdnUtils.getSurrogatePairList(currentName);
    newNameList = OdnUtils.randomSortList(newNameList);
    const newName = newNameList.slice(0, Constants.NAME_LEN_MAX).join("");
    Log.d("name: " + newName);

    this.updateNameBy(newName, (isSuccess) => {
      callback(isSuccess, newName);
    });
  }

  /**
   * 名前の更新結果を通知
   *
   * @param {boolean} isSuccess
   * @param {string} newName
   * @param {(isSuccess) => void} callback
   */
  private postResult(isSuccess: boolean, newName: string, callback: (isSuccess) => void) {
    const tweets = new OdnTweets(this.tweetData.accountData);
    if (isSuccess) {
      tweets.text = ".@" + this.tweetData.user.screenName + " update name complete! [" + newName + "]";
    } else {
      tweets.text = ".@" + this.tweetData.user.screenName + " update name failed. [" + newName + "]";
    }
    tweets.targetTweetId = this.tweetData.user.idStr;
    tweets.postTweet((isSuccess) => {
      callback(isSuccess);
    });
  }
}

namespace Constants {
  export const NAME_LEN_MAX = 50;
}

class UpdateNameResouces {
  /**
   * ひらがなの一覧を取得
   *
   * @returns {string}
   */
  static getHiragana(): string {
    let c = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん";
    c += "ぁぃぅぇぉゃゅょゎ";
    c += "がぎぐげござじずぜぞだぢづでどばびぶべぼ";
    c += "ぱぴぷぺぽ";
    return c;
  }

  /**
   * カタカナの一覧を取得
   *
   * @returns {string}
   */
  static getKatakana(): string {
    let c = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
    c += "ァィゥェォャュョヮ";
    c += "ヴガギグゲゴザジズゼゾダヂヅデドバビブベボ";
    c += "パピプペポ";
    return c;
  }

  /**
   * 漢字の一覧を取得
   *
   * @returns {string}
   */
  static getKanji(): string {
    let c = "亜哀挨愛曖悪握圧扱宛嵐安案暗以衣位囲医依委威為畏胃尉異移萎偉椅彙意違維慰遺緯域育一壱逸茨芋引印因咽姻員院淫陰飲隠韻右宇羽";
    c += "雨唄鬱畝浦運雲永泳英映栄営詠影鋭衛易疫益液駅悦越謁閲円延沿炎宴怨媛援園煙猿遠鉛塩演縁艶汚王凹央応往押旺欧殴桜翁奥横岡屋億";
    c += "憶臆虞乙俺卸音恩温穏下化火加可仮何花佳価果河苛科架夏家荷華菓悔海界皆械絵開階塊楷解潰壊懐諧貝外劾害崖涯街慨蓋該概骸垣柿各";
    c += "角拡革格核殻郭覚較隔閣確獲嚇穫学岳楽額顎掛潟括活喝渇割葛滑褐轄且株釜鎌刈干刊甘汗缶完肝官冠巻看陥乾勘患貫寒喚堪換敢棺款間";
    c += "閑勧寛幹感漢慣管関歓監緩憾還館環簡観韓艦鑑丸含岸岩玩眼頑顔願企伎危机気岐希忌汽奇祈季紀軌既記起飢鬼帰基寄規亀喜幾揮期棋貴";
    c += "棄毀旗器畿輝機騎技宜偽欺義疑儀戯擬犠議菊吉喫詰却客脚逆虐九久及弓丘旧休吸朽臼求究泣急級糾宮救球給嗅窮牛去巨居拒拠挙虚許距";
    c += "魚御漁凶共叫狂京享供協況峡挟狭恐恭胸脅強教郷境橋矯鏡競響驚仰暁業凝曲局極玉巾斤均近金菌勤琴筋僅禁緊錦謹襟吟銀区句苦駆具惧";
    c += "愚空偶遇隅串屈掘窟熊繰君訓勲薫軍郡群兄刑形系径茎係型契計恵啓掲渓経蛍敬景軽傾携継詣慶憬稽憩警鶏芸迎鯨隙劇撃激桁欠穴血決結";
    c += "傑潔月犬件見券肩建研県倹兼剣拳軒健険圏堅検嫌献絹遣権憲賢謙鍵繭顕験懸元幻玄言弦限原現舷減源厳己戸古呼固孤弧股虎故枯個庫湖";
    c += "雇誇鼓錮顧五互午呉後娯悟碁語誤護口工公勾孔功巧広甲交光向后好江考行坑孝抗攻更効幸拘肯侯厚恒洪皇紅荒郊香候校耕航貢降高康控";
    c += "梗黄喉慌港硬絞項溝鉱構綱酵稿興衡鋼講購乞号合拷剛傲豪克告谷刻国黒穀酷獄骨駒込頃今困昆恨根婚混痕紺魂墾懇左佐沙査砂唆差詐鎖";
    c += "座挫才再災妻采砕宰栽彩採済祭斎細菜最裁債催塞歳載際埼在材剤財罪崎作削昨柵索策酢搾錯咲冊札刷刹拶殺察撮擦雑皿三山参桟蚕惨産";
    c += "傘散算酸賛残斬暫士子支止氏仕史司四市矢旨死糸至伺志私使刺始姉枝祉肢姿思指施師恣紙脂視紫詞歯嗣試詩資飼誌雌摯賜諮示字寺次耳";
    c += "自似児事侍治持時滋慈辞磁餌璽鹿式識軸七叱失室疾執湿嫉漆質実芝写社車舎者射捨赦斜煮遮謝邪蛇尺借酌釈爵若弱寂手主守朱取狩首殊";
    c += "珠酒腫種趣寿受呪授需儒樹収囚州舟秀周宗拾秋臭修袖終羞習週就衆集愁酬醜蹴襲十汁充住柔重従渋銃獣縦叔祝宿淑粛縮塾熟出述術俊春";
    c += "瞬旬巡盾准殉純循順準潤遵処初所書庶暑署緒諸女如助序叙徐除小升少召匠床抄肖尚招承昇松沼昭宵将消症祥称笑唱商渉章紹訟勝掌晶焼";
    c += "焦硝粧詔証象傷奨照詳彰障憧衝賞償礁鐘上丈冗条状乗城浄剰常情場畳蒸縄壌嬢錠譲醸色拭食植殖飾触嘱織職辱尻心申伸臣芯身辛侵信津";
    c += "神唇娠振浸真針深紳進森診寝慎新審震薪親人刃仁尽迅甚陣尋腎須図水吹垂炊帥粋衰推酔遂睡穂随髄枢崇数据杉裾寸瀬是井世正生成西声";
    c += "制姓征性青斉政星牲省凄逝清盛婿晴勢聖誠精製誓静請整醒税夕斥石赤昔析席脊隻惜戚責跡積績籍切折拙窃接設雪摂節説舌絶千川仙占先";
    c += "宣専泉浅洗染扇栓旋船戦煎羨腺詮践箋銭潜線遷選薦繊鮮全前善然禅漸膳繕狙阻祖租素措粗組疎訴塑遡礎双壮早争走奏相荘草送倉捜挿桑";
    c += "巣掃曹曽爽窓創喪痩葬装僧想層総遭槽踪操燥霜騒藻造像増憎蔵贈臓即束足促則息捉速側測俗族属賊続卒率存村孫尊損遜他多汰打妥唾堕";
    c += "惰駄太対体耐待怠胎退帯泰堆袋逮替貸隊滞態戴大代台第題滝宅択沢卓拓託濯諾濁但達脱奪棚誰丹旦担単炭胆探淡短嘆端綻誕鍛団男段断";
    c += "弾暖談壇地池知値恥致遅痴稚置緻竹畜逐蓄築秩窒茶着嫡中仲虫沖宙忠抽注昼柱衷酎鋳駐著貯丁弔庁兆町長挑帳張彫眺釣頂鳥朝貼超腸跳";
    c += "徴嘲潮澄調聴懲直勅捗沈珍朕陳賃鎮追椎墜通痛塚漬坪爪鶴低呈廷弟定底抵邸亭貞帝訂庭逓停偵堤提程艇締諦泥的笛摘滴適敵溺迭哲鉄徹";
    c += "撤天典店点展添転塡田伝殿電斗吐妬徒途都渡塗賭土奴努度怒刀冬灯当投豆東到逃倒凍唐島桃討透党悼盗陶塔搭棟湯痘登答等筒統稲踏糖";
    c += "頭謄藤闘騰同洞胴動堂童道働銅導瞳峠匿特得督徳篤毒独読栃凸突届屯豚頓貪鈍曇丼那奈内梨謎鍋南軟難二尼弐匂肉虹日入乳尿任妊忍認";
    c += "寧熱年念捻粘燃悩納能脳農濃把波派破覇馬婆罵拝杯背肺俳配排敗廃輩売倍梅培陪媒買賠白伯拍泊迫剝舶博薄麦漠縛爆箱箸畑肌八鉢発髪";
    c += "伐抜罰閥反半氾犯帆汎伴判坂阪板版班畔般販斑飯搬煩頒範繁藩晩番蛮盤比皮妃否批彼披肥非卑飛疲秘被悲扉費碑罷避尾眉美備微鼻膝肘";
    c += "匹必泌筆姫百氷表俵票評漂標苗秒病描猫品浜貧賓頻敏瓶不夫父付布扶府怖阜附訃負赴浮婦符富普腐敷膚賦譜侮武部舞封風伏服副幅復福";
    c += "腹複覆払沸仏物粉紛雰噴墳憤奮分文聞丙平兵併並柄陛閉塀幣弊蔽餅米壁璧癖別蔑片辺返変偏遍編弁便勉歩保哺捕補舗母募墓慕暮簿方包";
    c += "芳邦奉宝抱放法泡胞俸倣峰砲崩訪報蜂豊飽褒縫亡乏忙坊妨忘防房肪某冒剖紡望傍帽棒貿貌暴膨謀頰北木朴牧睦僕墨撲没勃堀本奔翻凡盆";
    c += "麻摩磨魔毎妹枚昧埋幕膜枕又末抹万満慢漫未味魅岬密蜜脈妙民眠矛務無夢霧娘名命明迷冥盟銘鳴滅免面綿麺茂模毛妄盲耗猛網目黙門紋";
    c += "問冶夜野弥厄役約訳薬躍闇由油喩愉諭輸癒唯友有勇幽悠郵湧猶裕遊雄誘憂融優与予余誉預幼用羊妖洋要容庸揚揺葉陽溶腰様瘍踊窯養擁";
    c += "謡曜抑沃浴欲翌翼拉裸羅来雷頼絡落酪辣乱卵覧濫藍欄吏利里理痢裏履璃離陸立律慄略柳流留竜粒隆硫侶旅虜慮了両良料涼猟陵量僚領寮";
    c += "療瞭糧力緑林厘倫輪隣臨瑠涙累塁類令礼冷励戻例鈴零霊隷齢麗暦歴列劣烈裂恋連廉練錬呂炉賂路露老労弄郎朗浪廊楼漏籠六録麓論和話";
    c += "賄脇惑枠湾腕";
    return c;
  }

  /**
   * 記号の一覧を取得
   *
   * @returns {string}
   */
  static getKigou(): string {
    let c = "ー☆♡†♣♦・";
    return c;
  }

  /**
   * 絵文字の一覧を取得
   *
   * @returns {string}
   */
  static getEmoji(): string {
    let c = "😄😃😀😊☺😉😍😘😚😙😜😝😛😳😁😔😌😒😞😣😢😂😭😪😥😰😅😓😩😫😨😱😠😡😤😖😆😋😷😎😴😵😲😟😦😧😈👿😮😬😐😕😯😶😇😏😑👲👳👮";
    c += "👷💂👶👦👧👨👩👴👵👱👼👸😺😸😻😽😼🙀😿😹😾👹👺🙈🙉🙊💀👽💩🔥✨🌟💫💥💢💦💧💤💨👂👀👃👅👄👍👎👌👊✊✌👋✋👐👆👇👉👈🙌🙏☝";
    c += "👏💪🚶🏃💃👫👪👬👭💏💑👯🙆🙅💁🙋💆💇💅👰🙎🙍🙇🎩👑👒👟👞👡👠👢👕👔👚👗🎽👖👘👙💼👜👝👛👓🎀🌂💄💛💙💜💚❤💔💗💓💕💖💞💘💌";
    c += "💋💍💎👤👥💬👣💭🐶🐺🐱🐭🐹🐰🐸🐯🐨🐻🐷🐽🐮🐗🐵🐒🐴🐑🐘🐼🐧🐦🐤🐥🐣🐔🐍🐢🐛🐝🐜🐞🐌🐙🐚🐠🐟🐬🐳🐋🐄🐏🐀🐃🐅🐇🐉🐎🐐🐓🐕🐖";
    c += "🐁🐂🐲🐡🐊🐫🐪🐆🐈🐩🐾💐🌸🌷🍀🌹🌻🌺🍁🍃🍂🌿🌾🍄🌵🌴🌲🌳🌰🌱🌼🌐🌞🌝🌚🌑🌒🌓🌔🌕🌖🌗🌘🌜🌛🌙🌍🌎🌏🌋🌌🌠⭐☀⛅☁⚡☔❄⛄";
    c += "🌀🌁🌈🌊🎍💝🎎🎒🎓🎏🎆🎇🎐🎑🎃👻🎅🎄🎁🎋🎉🎊🎈🎌🔮🎥📷📹📼💿📀💽💾💻📱☎📞📟📠📡📺📻🔊🔉🔈🔇🔔🔕📢📣⏳⌛⏰⌚🔑";
    c += "🔎💡🔦🔆🔅🔌🔋🔍🛁🛀🚿🚽🔧🔩🔨🚪🚬💣🔫🔪💊💉💰💴💵💷💶💳💸📲📧📥📤✉📩📨📯📫📪📬📭📮📦📝📄📃📑📊📈📉📜📋📅📆📇📁📂✂📌📎";
    c += "✒✏📏📐📕📗📘📙📓📔📒📚📖🔖📛🔬🔭📰🎨🎬🎤🎧🎼🎵🎶🎹🎻🎺🎷🎸👾🎮🃏🎴🀄🎲🎯🏈🏀⚽⚾🎾🎱🏉🎳⛳🚵🚴🏁🏇🏆🎿🏂🏊🏄🎣☕🍵🍶🍼";
    c += "🍺🍻🍸🍹🍷🍴🍕🍔🍟🍗🍖🍝🍛🍤🍱🍣🍥🍙🍘🍚🍜🍲🍢🍡🍳🍞🍩🍮🍦🍨🍧🎂🍰🍪🍫🍬🍭🍯🍎🍏🍊🍋🍒🍇🍉🍓🍑🍈🍌🍐🍍🍠🍆🍅🌽🏠🏡🏫🏢🏣";
    c += "🏥🏦🏪🏩🏨💒⛪🏬🏤🌇🌆🏯🏰⛺🏭🗼🗾🗻🌄🌅🌃🗽🌉🎠🎡⛲🎢🚢⛵🚤🚣⚓🚀✈💺🚁🚂🚊🚉🚞🚆🚄🚅🚈🚇🚝🚋🚃🚎🚌🚍🚙🚘🚗🚕🚖🚛🚚🚨🚓";
    c += "🚔🚒🚑🚐🚲🚡🚟🚠🚜💈🚏🎫🚦🚥⚠🚧🔰⛽🏮🎰♨🗿🎪🎭📍🚩";
    return c;
  }
}