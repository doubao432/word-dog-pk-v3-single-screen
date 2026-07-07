# 单词狗狗PK 2.0 背景音乐来源记录

生成日期：2026-07-04

## 目标

为《单词狗狗PK 2.0》制作一段适合白板/平板课堂抢答的循环背景音乐。风格要求是轻快、搞笑、卡通、校园感，适配手绘狗、操场背景和单词飞弹玩法，同时不能太吵。

## Gemini 工作流

已通过用户登录的 Gemini 网页请求生成原创背景音乐。Gemini 先生成了一个可播放的音乐作品，并提供“下载音乐作品”按钮；选择“纯音频 MP3 音轨”时，Chrome 跳转到 `contribution.usercontent.google.com` 后被客户端/扩展拦截为 `ERR_BLOCKED_BY_CLIENT`，没有获得可用的下载文件。

随后继续请求 Gemini 输出可本地合成的结构，采用更便于程序合成的方案：

- BPM: 125
- 拍号: 4/4
- 调式: C Major
- 长度: 12 小节，约 23.04 秒
- 和弦: `C | G | Am | F | C/E | Dm7 | G7 | G7 | C | F | Dm7 | G7`
- 主旋律音色建议: Marimba / Kalimba
- 低音建议: Sine Bass / Electric Bass, staccato
- 打击乐建议: Woodblock, Agogo, Shaker, light Rimshot
- 循环设计: 第 12 小节使用 G7 回到第 1 小节 C，末拍留白，让第 1 小节下拍重新进入。

Gemini 回复中明确给出的声明为：这是原创结构，可用于课堂项目和网页游戏。

## 本地生成

生成脚本：

```powershell
python "experiments\word-dog-pk-20260703-v2\tools\generate-word-dog-bgm.py"
```

MP3 编码：

```powershell
ffmpeg -y -hide_banner -loglevel error `
  -i "experiments\word-dog-pk-20260703-v2\assets\audio\word-dog-bgm-gemini-loop.wav" `
  -codec:a libmp3lame -b:a 128k `
  "experiments\word-dog-pk-20260703-v2\assets\audio\word-dog-bgm-gemini-loop.mp3"
```

## 输出文件

- `word-dog-bgm-gemini-loop.wav`: 本地合成源文件，23.04 秒。
- `word-dog-bgm-gemini-loop.mp3`: 游戏实际加载的背景音乐，128 kbps，23.04 秒。

本资产没有采样第三方歌曲录音，也没有刻意引用或模仿任何已知影视、动画、游戏旋律。
