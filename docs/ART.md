# ビジュアルと音の出所

- タイトル装飾: `public/art/door-atlas.webp`。OpenAIの組み込み **Imagegen** を2026-11-12に使用。生成PNGをPillowでWebP（quality 87）へ圧縮。ゲーム画面のスクリーンショットではない。
- 実際の盤面、ドア、蝶番、人物、出口、ロゴ、favicon: このリポジトリ内のSVG/CSS描画。
- 効果音: `src/audio.js` のWeb Audio oscillator。移動、開扉、UNDO、衝突、クリアを短いトーンで区別。外部音源・配信・有料APIなし。
- フォント: OSのシステムフォント。外部フォントリクエストなし。

## Imagegen 最終プロンプト

> Use case: stylized-concept. Asset type: locally bundled title-screen illustration for an elegant mobile puzzle game DOOOOOR. Create a wide 3:2 overhead architectural still life: a small sculptural maze of cool slate-blue walls on a deep midnight blue background, cream stone floor tiles, three beautiful warm honey oak and brass hinged doors shown part-open at 90 degrees. Strict top-down orthographic view, sophisticated tactile miniature craftsmanship, fine paper grain, restrained soft warm light spilling through openings, subtle long shadows. Maze is concentrated in the center and lower portion, comfortable dark negative space around edges so it can blend into a dark UI. No lettering, no logos, no typography, no characters, no interface, no photographic collage. Visually crisp, premium quiet indie puzzle atmosphere. This is decorative title art only; gameplay will use precise code-drawn geometry.

ゲーム上の正確な幾何は `src/render.js`。生成画像を盤面の当たり判定や問題定義に使わない。
