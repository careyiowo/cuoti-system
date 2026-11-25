# 错题本 · 考研错题收集与重做

面向考研的错题管理与重做系统。把做错的题拍下来，相机会连着答案和解析一起识别，自动归到科目与章节；需要查漏补缺时按条件组一张答题卡，选择题填空题自动判分，大题对照解析自评，重做结果反过来标记这道题是否已经掌握。

当前题库按 **数学二、英语二、政治、408** 四科的章节树组织。

## 功能

| 功能 | 说明 |
|---|---|
| 收集错题 | 拍照或选图上传，可一次传题目页 + 答案页；识别成题干、选项、答案、解析，核对后入库 |
| 自动归类 | 按科目 → 章节 → 题型（选择 / 填空 / 解答）归类，识别结果可以手动改 |
| 组卷练习 | 按科目、章节、题型、掌握状态、题量生成答题卡；答题卡格子显示已答与判分结果 |
| 判分 | 选择题按选项字母、填空题按答案（支持分号分隔多个答案）自动判对错；解答题交卷后给解析，由自己判 |
| 掌握标记 | 连续两次做对 → 已掌握；错过两次以上仍未连胜 → 反复错。详情页也能手动标记 |

## 运行

```bash
npm install
npm run dev
```

打开终端输出的本地地址。默认端口写在 `spark.json` 的 `dev.port`，也可以用 `npm run dev -- --port 27183` 指定。

其他命令：

```bash
npm run lint   # 类型检查 + ESLint
npm run build  # 生产构建，产物在 dist/output
```

## 识别怎么配

1. 打开系统的「设置」页
2. 填接口地址、API Key、模型名
3. 默认是智谱开放平台的 OpenAI 兼容接口，模型 `glm-4v-flash`（视觉模型，免费额度够用）

注意两点：

- 必须是能看图的模型，纯文本模型识别不了题目
- 接口要允许浏览器直连，被跨域拦截时换一家服务商，或者直接用「手动填写」录入

API Key 保存在当前浏览器的 localStorage 里，不会上传到别处。

## 数据存在哪

题目、答案、图片全部存在当前浏览器的 IndexedDB（库名 `cuoti-system`）。**换电脑、换浏览器、清理浏览器数据都会看不到**，目前是单机版，没有后端。要多设备同步需要另加一层服务。

## 目录结构

```
src/
├── app.tsx                 路由注册
├── components/
│   ├── Layout.tsx          顶部导航 + 页脚
│   ├── AnswerSheet.tsx     答题卡格子导航
│   ├── QuestionEditor.tsx  题目编辑表单（上传确认与详情编辑共用）
│   ├── MasteryMark.tsx     掌握状态标记
│   └── ui/                 shadcn 组件
├── data/taxonomy.ts        科目与章节树
├── lib/
│   ├── types.ts            数据实体类型
│   ├── db.ts               IndexedDB 读写
│   ├── draft.ts            表单草稿与实体互转
│   ├── ai.ts               图片识别调用
│   ├── question.ts         判分、掌握状态、统计
│   └── settings.ts         识别设置读写
└── pages/
    ├── BankPage/           题库首页（筛选、统计）
    ├── UploadPage/         收集错题
    ├── QuestionPage/       错题详情（标记、编辑、删除）
    ├── PracticeSetupPage/  组卷条件
    ├── PracticeRunPage/    答题与交卷
    ├── PracticeResultPage/ 结果与自评
    └── SettingsPage/       识别设置
```

## 技术栈

React 19 · TypeScript · Vite · Tailwind CSS v4 · shadcn/ui · react-router · idb
