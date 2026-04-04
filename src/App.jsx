import { useState, useRef, useCallback, useEffect } from "react";

// Todoアプリのソースコード（表示用）
const SOURCE_LINES = [
  { num: 1, code: `import { useState } from "react";` },
  { num: 2, code: `` },
  { num: 3, code: `export default function App() {` },
  { num: 4, code: `  const [todos, setTodos] = useState([]);` },
  { num: 5, code: `  const [text, setText] = useState("");` },
  { num: 6, code: `` },
  { num: 7, code: `  const add = () => {` },
  { num: 8, code: `    if (!text.trim()) return;` },
  { num: 9, code: `    setTodos([` },
  { num: 10, code: `      ...todos,` },
  { num: 11, code: `      { id: Date.now(), text, done: false }` },
  { num: 12, code: `    ]);` },
  { num: 13, code: `    setText("");` },
  { num: 14, code: `  };` },
  { num: 15, code: `` },
  { num: 16, code: `  const toggle = (id) =>` },
  { num: 17, code: `    setTodos(todos.map((t) =>` },
  { num: 18, code: `      t.id === id ? { ...t, done: !t.done } : t` },
  { num: 19, code: `    ));` },
  { num: 20, code: `` },
  { num: 21, code: `  const remove = (id) =>` },
  { num: 22, code: `    setTodos(todos.filter((t) => t.id !== id));` },
  { num: 23, code: `` },
  { num: 24, code: `  return (` },
  { num: 25, code: `    <div>` },
  { num: 26, code: `      <h1>Todo Practice</h1>` },
  { num: 27, code: `      <div>` },
  { num: 28, code: `        <input` },
  { num: 29, code: `          value={text}` },
  { num: 30, code: `          onChange={(e) => setText(e.target.value)}` },
  { num: 31, code: `          onKeyDown={(e) =>` },
  { num: 32, code: `            e.key === "Enter" && add()` },
  { num: 33, code: `          }` },
  { num: 34, code: `        />` },
  { num: 35, code: `        <button onClick={add}>追加</button>` },
  { num: 36, code: `      </div>` },
  { num: 37, code: `      <ul>` },
  { num: 38, code: `        {todos.map((t) => (` },
  { num: 39, code: `          <li key={t.id}>` },
  { num: 40, code: `            <input type="checkbox"` },
  { num: 41, code: `              checked={t.done}` },
  { num: 42, code: `              onChange={() => toggle(t.id)}` },
  { num: 43, code: `            />` },
  { num: 44, code: `            <span>{t.text}</span>` },
  { num: 45, code: `            <button onClick={() => remove(t.id)}>` },
  { num: 46, code: `              削除` },
  { num: 47, code: `            </button>` },
  { num: 48, code: `          </li>` },
  { num: 49, code: `        ))}` },
  { num: 50, code: `      </ul>` },
  { num: 51, code: `      <p>` },
  { num: 52, code: `        残り: {todos.filter((t) => !t.done).length}` },
  { num: 53, code: `        / {todos.length} 件` },
  { num: 54, code: `      </p>` },
  { num: 55, code: `    </div>` },
  { num: 56, code: `  );` },
  { num: 57, code: `}` },
];

// 各操作でハイライトする行番号と解説
const EXEC_MAP = {
  idle: {
    lines: [],
    label: "待機中",
    concept: null,
    description: "ユーザーの操作を待っています",
  },
  typing: {
    lines: [5, 30],
    label: "onChange → setText",
    concept: "制御コンポーネント（Controlled Component）",
    description: "入力欄のonChangeイベントが発火し、setTextでstateを更新。Reactが差分を検出して再描画する",
  },
  enterKey: {
    lines: [31, 32, 33],
    label: "onKeyDown → Enter検知",
    concept: "短絡評価（Short-circuit Evaluation）",
    description: "onKeyDownでキーを監視。Enterキーの場合のみadd()を実行。&&の短絡評価を利用",
  },
  addCheck: {
    lines: [7, 8],
    label: "add() → バリデーション",
    concept: "ガード節（Early Return）",
    description: "add関数が呼ばれ、入力値が空白のみでないかチェック。空なら何もせず終了",
  },
  addExecute: {
    lines: [9, 10, 11, 12, 13],
    label: "add() → setTodos / setText",
    concept: "イミュータブル更新 / スプレッド構文",
    description: "スプレッド構文で既存todosをコピーし、新オブジェクトを追加。入力欄をクリア",
  },
  toggle: {
    lines: [16, 17, 18, 19],
    label: "toggle() → done反転",
    concept: "Array.map() / イミュータブル更新",
    description: "mapで全タスクを走査し、該当IDのタスクだけdoneを反転。オブジェクトをコピーしてから変更",
  },
  remove: {
    lines: [21, 22],
    label: "remove() → filter",
    concept: "Array.filter() / 宣言的データ操作",
    description: "filterで該当IDを除外した新しい配列を生成。元の配列は変更しない",
  },
  render: {
    lines: [38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49],
    label: "JSX → todos.map() で再描画",
    concept: "リストレンダリング / key属性",
    description: "stateが更新されるとReactが自動で再レンダリング。todos.map()でリスト描画",
  },
  countRender: {
    lines: [52, 53],
    label: "残件数の再計算",
    concept: "派生データ（Derived State）",
    description: "filterでdone=falseのタスクを抽出しlengthで件数を取得。レンダリングのたびに再計算",
  },
};

export default function TodoEducation() {
  const [todos, setTodos] = useState([
    { id: 1, text: "Reactの基本を学ぶ", done: true },
    { id: 2, text: "Todoアプリを作る", done: false },
  ]);
  const [text, setText] = useState("");
  const [activeBlock, setActiveBlock] = useState("idle");
  const [showCode, setShowCode] = useState(true);
  const codeRef = useRef(null);
  const composingRef = useRef(false);  // IME変換中フラグ

  const activate = useCallback((blockKey) => {
    setActiveBlock(blockKey);
  }, []);

  // ハイライト行が変わったら自動スクロール
  useEffect(() => {
    if (!showCode) return;
    const info = EXEC_MAP[activeBlock];
    if (info.lines.length > 0 && codeRef.current) {
      const firstLine = info.lines[0];
      const lineEl = codeRef.current.querySelector(`[data-line="${firstLine}"]`);
      if (lineEl) {
        lineEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [activeBlock, showCode]);

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (!composingRef.current) {
      activate("typing");
    }
  };

  const add = () => {
    activate("addCheck");
    if (!text.trim()) return;
    setTimeout(() => {
      setTodos((prev) => [...prev, { id: Date.now(), text, done: false }]);
      setText("");
      activate("addExecute");
      setTimeout(() => activate("render"), 2000);
      setTimeout(() => activate("countRender"), 4000);
    }, 2000);
  };

  const toggle = (id) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
    activate("toggle");
    setTimeout(() => activate("render"), 2000);
    setTimeout(() => activate("countRender"), 4000);
  };

  const remove = (id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    activate("remove");
    setTimeout(() => activate("render"), 2000);
    setTimeout(() => activate("countRender"), 4000);
  };

  const handleKeyDown = (e) => {
    // IME変換中のEnterは無視
    if (e.key === "Enter" && !composingRef.current) {
      activate("enterKey");
      setTimeout(() => add(), 2000);
    }
  };

  const handleCompositionStart = () => {
    composingRef.current = true;
  };

  const handleCompositionEnd = () => {
    composingRef.current = false;
  };

  const info = EXEC_MAP[activeBlock];
  const highlightSet = new Set(info.lines);

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      fontFamily: "'IBM Plex Mono', 'SF Mono', 'Fira Code', monospace",
      background: "#0d1117",
      color: "#c9d1d9",
      overflow: "hidden",
    }}>
      {/* ===== LEFT: Todo App ===== */}
      <div style={{
        flex: showCode ? "0 0 360px" : "1",
        maxWidth: showCode ? 360 : 600,
        padding: "28px 24px",
        borderRight: "1px solid #21262d",
        overflowY: "auto",
        background: "#0d1117",
        display: "flex",
        flexDirection: "column",
        transition: "flex 0.3s, max-width 0.3s",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 24,
        }}>
          <div style={{
            width: 10, height: 10,
            borderRadius: "50%",
            background: "#3fb950",
            boxShadow: "0 0 8px #3fb95088",
          }} />
          <h1 style={{
            fontSize: 18, fontWeight: 600, margin: 0,
            color: "#f0f6fc", letterSpacing: "-0.02em",
          }}>
            Todo Practice
          </h1>

          {/* コード表示切替ボタン */}
          <button
            onClick={() => setShowCode((prev) => !prev)}
            title={showCode ? "コードを非表示" : "コードを表示"}
            style={{
              marginLeft: "auto",
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 600,
              fontFamily: "inherit",
              background: showCode ? "#161b22" : "#238636",
              color: showCode ? "#8b949e" : "#fff",
              border: "1px solid",
              borderColor: showCode ? "#30363d" : "#238636",
              borderRadius: 4,
              cursor: "pointer",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            {showCode ? "</> 非表示" : "</> コード表示"}
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <input
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder="タスクを入力..."
            style={{
              flex: 1, padding: "10px 12px", fontSize: 14,
              background: "#161b22", border: "1px solid #30363d",
              borderRadius: 6, color: "#f0f6fc", outline: "none",
              fontFamily: "inherit",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#58a6ff")}
            onBlur={(e) => (e.target.style.borderColor = "#30363d")}
          />
          <button
            onClick={add}
            style={{
              padding: "10px 18px", fontSize: 14, background: "#238636",
              color: "#fff", border: "none", borderRadius: 6,
              cursor: "pointer", fontWeight: 600, fontFamily: "inherit",
            }}
            onMouseEnter={(e) => (e.target.style.background = "#2ea043")}
            onMouseLeave={(e) => (e.target.style.background = "#238636")}
          >
            追加
          </button>
        </div>

        <ul style={{ listStyle: "none", padding: 0, margin: 0, flex: 1 }}>
          {todos.map((t) => (
            <li key={t.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 0", borderBottom: "1px solid #161b22",
            }}>
              <input
                type="checkbox" checked={t.done}
                onChange={() => toggle(t.id)}
                style={{ width: 16, height: 16, accentColor: "#58a6ff", cursor: "pointer" }}
              />
              <span style={{
                flex: 1, fontSize: 14,
                textDecoration: t.done ? "line-through" : "none",
                color: t.done ? "#484f58" : "#f0f6fc",
              }}>
                {t.text}
              </span>
              <button
                onClick={() => remove(t.id)}
                style={{
                  padding: "4px 10px", fontSize: 12, background: "transparent",
                  color: "#f85149", border: "1px solid #f8514933",
                  borderRadius: 4, cursor: "pointer", fontFamily: "inherit",
                }}
                onMouseEnter={(e) => { e.target.style.background = "#f8514922"; e.target.style.borderColor = "#f85149"; }}
                onMouseLeave={(e) => { e.target.style.background = "transparent"; e.target.style.borderColor = "#f8514933"; }}
              >
                削除
              </button>
            </li>
          ))}
        </ul>

        <p style={{ color: "#484f58", marginTop: 16, fontSize: 13 }}>
          残り: <span style={{ color: "#58a6ff", fontWeight: 600 }}>
            {todos.filter((t) => !t.done).length}
          </span> / {todos.length} 件
        </p>

        {/* State Inspector */}
        <div style={{
          marginTop: 20, padding: "12px 14px",
          background: "#161b22", borderRadius: 8,
          border: "1px solid #21262d", fontSize: 12,
        }}>
          <div style={{
            fontSize: 11, color: "#484f58", fontWeight: 600,
            marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em",
          }}>State</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
            <div><span style={{ color: "#484f58" }}>text: </span><span style={{ color: "#a5d6ff" }}>"{text}"</span></div>
            <div><span style={{ color: "#484f58" }}>todos: </span><span style={{ color: "#79c0ff" }}>{todos.length}</span></div>
            <div><span style={{ color: "#484f58" }}>done: </span><span style={{ color: "#7ee787" }}>{todos.filter(t => t.done).length}</span></div>
            <div><span style={{ color: "#484f58" }}>undone: </span><span style={{ color: "#ffa657" }}>{todos.filter(t => !t.done).length}</span></div>
          </div>
        </div>
      </div>

      {/* ===== RIGHT: Source Code Viewer ===== */}
      {showCode && (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          overflow: "hidden", background: "#010409",
        }}>
          {/* Header */}
          <div style={{
            padding: "14px 24px",
            borderBottom: "1px solid #21262d",
            background: "#0d1117",
            display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: activeBlock !== "idle" ? "#f0883e" : "#30363d",
              boxShadow: activeBlock !== "idle" ? "0 0 8px #f0883e88" : "none",
            }} />
            <span style={{
              fontSize: 14, fontWeight: 700,
              color: activeBlock !== "idle" ? "#f0883e" : "#484f58",
            }}>
              {info.label}
            </span>
            {info.concept && (
              <span style={{
                fontSize: 11, color: "#7ee787", background: "#7ee78711",
                padding: "2px 8px", borderRadius: 4,
              }}>
                {info.concept}
              </span>
            )}
            <span style={{
              fontSize: 11, color: "#484f58", marginLeft: "auto",
              background: "#161b22", padding: "2px 8px", borderRadius: 4,
            }}>App.jsx</span>
          </div>

          {/* ソースコード全体 */}
          <div ref={codeRef} style={{
            flex: 1, overflowY: "auto", padding: "8px 0",
          }}>
            {SOURCE_LINES.map((line) => {
              const isHighlighted = highlightSet.has(line.num);
              return (
                <div
                  key={line.num}
                  data-line={line.num}
                  style={{
                    display: "flex",
                    alignItems: "stretch",
                    fontSize: 13,
                    lineHeight: "22px",
                    background: isHighlighted ? "#f0883e14" : "transparent",
                    borderLeft: isHighlighted ? "3px solid #f0883e" : "3px solid transparent",
                    transition: "background 0.3s, border-color 0.3s",
                  }}
                >
                  <span style={{
                    display: "inline-block",
                    width: 48,
                    textAlign: "right",
                    paddingRight: 16,
                    color: isHighlighted ? "#f0883e" : "#30363d",
                    userSelect: "none",
                    flexShrink: 0,
                    fontWeight: isHighlighted ? 700 : 400,
                    transition: "color 0.3s",
                  }}>
                    {line.num}
                  </span>
                  <span style={{
                    flex: 1,
                    paddingRight: 24,
                    color: isHighlighted ? "#f0f6fc" : "#6e7681",
                    fontWeight: isHighlighted ? 500 : 400,
                    whiteSpace: "pre",
                    transition: "color 0.3s",
                  }}>
                    {line.code}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 解説パネル */}
          <div style={{
            padding: "14px 24px",
            borderTop: "1px solid #21262d",
            background: "#0d1117",
            minHeight: 60,
          }}>
            <p style={{
              fontSize: 13, color: "#8b949e", margin: 0, lineHeight: 1.6,
            }}>
              {info.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}