import { OdnTweetData, OdnTweets } from "../../../odnTweets"
import { OdnProfiles } from "../../../odnProfiles";
import { OdnPlugins, OdnPluginResultData } from "../../../odnPlugins";
import {Log, OdnUtils} from "../../../odnUtils";
import { TwitterProfileConfigs } from "../../../configs/twitterProfileConfigs";

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
      // TODO: ランダムにする
      const tweets = new OdnTweets(this.tweetData.accountData);
      tweets.text = ".@" + this.tweetData.user.screenName + " unsupported.";
      tweets.targetTweetId = this.tweetData.user.idStr;
      tweets.postTweet(() => {
        finish();
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
      this.updateNameBy(this.tweetData.action, (isSuccess, newName) => {
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
   * 名前をシャッフルする
   *
   * @param {(isSuccess: boolean, newName: string) => void} callback
   */
  private updateNameShuffle(callback: (isSuccess: boolean, newName: string) => void) {
    const profileData = TwitterProfileConfigs.getProfile(this.tweetData.accountData.userId);
    const currentName = this.tweetData.options && 0 < this.tweetData.options.length ? this.tweetData.options[0] : profileData.name;
    let newNameList = OdnUtils.getSurrogatePairList(currentName);
    newNameList = OdnUtils.shuffleList(newNameList);
    const newName = newNameList.join("");
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
    const newName = newNameList.join("");
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
