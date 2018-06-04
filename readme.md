# TweetDownloader
Twitterのツイートをダウンロードするソフトウェア

(A software to download some tweets.)

## Download
ビルド済みのファイルは、作者のブログからダウンロード出来ます。

[ダウンロード先へ](https://blog.usx.jp/software/tweetdownloader/)

## Usage
TwitterのBearerトークンは付属していないため、各自で取得してソースに入れる必要があります。

1. node+npmの環境を用意
2. 初回のみ`npm i`コマンドの実行、Bearerトークンを取得しgettoken-sample.jsに追記、gettweet.jsにリネーム
3. `npm test`コマンドで起動

## License
Copyright &copy; 2018 [Raintensity](https://blog.usx.jp/) <small>([Twitter](https://twitter.com/Raintensity)</small>). All rights reserved.

Licensed under the MIT License.
