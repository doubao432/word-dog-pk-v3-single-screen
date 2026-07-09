# 单词狗狗PK 3.0 剧情闯关版本

这是从 2.0 独立复制出来的 3.0 静态网页版本，不覆盖 1.0 和 2.0。

- 1.0：`experiments/word-dog-pk-20260703/`
- 2.0：`experiments/word-dog-pk-20260703-v2/`
- 3.0：`experiments/word-dog-pk-20260703-v3/`

## 功能范围

- 保留双人PK：同题抢答、各自不同题、时间、K.O.、胜利动画、音效与背景音乐。双人PK设置页不显示闯关关卡。
- 新增剧情闯关：玩家红队对战 AI 关卡狗。
- 3.0 闯关为 6 个章节、36 个关卡，前一关打败后才解锁后一关。
- 未解锁关卡不显示狗图和狗名，统一用问号卡表示。
- 每个章节有主题、剧情、奖励骨牌和 6 条不同风格的狗。
- 每关开局先弹出剧情对话，再进入答题战斗。
- 通关结算会显示奖励、胜利台词和下一关入口。
- 闯关战斗左侧显示 6 枚星词骨牌收集栏，用于表现“修复狗狗王国词力核心”的长期目标。
- 设置页和战斗页已重构为白板/平板横屏单屏布局，1366x768、1024x768 不需要浏览器滚动。
- 手机横屏战斗页做了压缩适配；手机竖屏/极窄屏保留纵向滚动兜底。
- 答对反馈统一为绿色，答错反馈统一为红色。
- 底部答题区已放大，按钮和题卡更适合白板点击。
- 设置页新增“击败动画”秒数，默认 2 秒，可在 1-8 秒之间测试。

## 章节

1. 词骨城堡：门卫、弓手、厨师、训练兵、骑士、国王大狗。
2. 荧光森林：蘑菇、藤蔓、沼泽、蜂蜜、古树、荧光鹿角Boss。
3. 沙漠遗迹：商队、骆驼背包、石庙、盗犬、法老、木乃伊Boss。
4. 海底王国：潜水、海草、海盗、贝壳贵族、灯笼鱼、海王Boss。
5. 机械未来城：维修、齿轮、电工、街机、半机械、机器人Boss。
6. 月球宇宙：宇航员、陨石矿工、星际快递、黑洞斗篷、银河裁判、终极国王大狗。

## 主要文件

- `index.html`：3.0 游戏入口。
- `src/app.js`：双人PK、剧情闯关、解锁、战斗、结算和动效逻辑。
- `src/data.js`：词库、6 章剧情数据、36 关配置。
- `src/styles.css`：白板/平板横屏 UI、章节页签、剧情弹窗、战斗和结算样式。
- `assets/stage-dogs-v3/dogs/`：36 条 AI 生成狗狗透明 PNG。
- `assets/stage-dogs-v3/sheets/`：6 张章节狗狗九宫格素材源图。
- `assets/stage-dogs-v3/dogs-contact-sheet.png`：36 条狗总预览图。
- `assets/stage-dogs-v3/dogs-before-component-clean-20260705/`：清理孤立残留前的狗图备份。
- `assets/reward-items-v3/`：6 枚章节奖励骨牌 PNG。
- `data/3.0_36关剧本与素材提示词.md`：关卡剧本、数值和素材提示词。
- `tools/build-v3-data.cjs`：从章节设计生成 3.0 关卡数据和提示词文档的工具。
- `tools/clean-v3-assets.py`：清理狗图孤立残留、重建狗图总览、裁切奖励骨牌图标。

## 运行

可直接打开 `index.html`，也可用静态服务：

```powershell
cd "E:\zimeiti project\跑游戏\experiments\word-dog-pk-20260703-v3"
python -m http.server 5230 --bind 127.0.0.1
```

然后打开：

```text
http://127.0.0.1:5230/
```

## 已发布地址

3.0 GitHub Pages 站点：

```text
https://doubao432.github.io/word-dog-pk-v3-single-screen/
```

3.0 独立 Netlify 站点（Netlify 积分/生产发布不可用时可能不是最新）：

```text
https://word-dog-pk-v3-20260705-8a0612.netlify.app/
```

站点 ID：

```text
03822438-4e47-4f81-afb1-0e74efced2e7
```

## 验证入口

```text
http://127.0.0.1:5230/?autostart=1
http://127.0.0.1:5230/?autostart=1&play=challenge&stage=1
http://127.0.0.1:5230/?autostart=1&play=challenge&stage=1&fxdemo=correct&fxhold=1
http://127.0.0.1:5230/?autostart=1&play=challenge&stage=1&victorydemo=left&victory=2
```

闯关进度保存在浏览器 localStorage：

```text
word-dog-pk-v3-challenge-unlocked
```

## 素材边界

3.0 狗狗素材是位图 PNG，不再用 SVG 临摹狗。画风目标是粗线条、彩铅、潦草、搞笑、叫得很用力的课堂游戏角色。后续如果要做攻击、眩晕、胜利、失败分状态，可以在现有 `dogImage` 字段旁新增状态图字段，不需要重写战斗规则。

2026-07-05 返修：狗图已用连通域规则清理。处理逻辑是保留主体最大透明组件，删除相邻格子残留的小块；原图备份保存在 `assets/stage-dogs-v3/dogs-before-component-clean-20260705/`。

2026-07-07 单屏重构：设置页和战斗页改为固定视口布局，题库和关卡列表只在各自面板内滚动，浏览器页面本身不再需要滚轮下翻。Playwright 已验证 1366x768、1024x768 和 844x390 横屏战斗不产生整页滚动。

2026-07-09 反馈和击败节奏返修：答对按钮和反馈改为绿色，答错按钮和反馈改为红色；底部答题区增高；击败动画默认缩短到 2 秒，并新增设置项支持 1-8 秒自定义测试。
