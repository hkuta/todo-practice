import { useState, useRef, useCallback, useEffect } from "react";

const CODE_BLOCKS = {
  idle: { label: "待機中", lines: null, description: "ユーザーの操作を待っています" },
  typing: {
    label: "onChange → setText",
    lines: [
      { code: `onChange={(e) => setText(e.target.value)}`, highlight: true },
      { code: `// キー入力のたびにtextステートを更新`, highlight: false },
      { code: `// → Reactが再レンダリングを実行`, highlight: false },
    ],
    description: "入力欄のonChangeイベントが発火し、setTextでstateを更新。Reactが差分を検出して再描画する",
  },
  addCheck: {
    label: "add() → バリデーション",
    lines: [
      { code: `const add = () => {`, highlight: true },
      { code: `  if (!text.trim()) return;`, highlight: true },
      { code: `  // 空白のみなら早期リターン`, highlight: false },
    ],
    description: "add関数が呼ばれ、入力値が空白のみでないかチェック。空なら何もせず終了（ガード節）",
  },
  addExecute: {
    label: "add() → setTodos",
    lines: [
      { code: `setTodos([`, highlight: true },
      { code: `  ...todos,`, highlight: true },
      { code: `  { id: Date.now(), text, done: false }`, highlight: true },
      { code: `]);`, highlight: true },
      { code: `setText("");`, highlight: true },
      { code: `// スプレッド構文で既存配列をコピー`, highlight: false },
      { code: `// + 新タスクを末尾に追加`, highlight: false },
    ],
    description: "スプレッド構文で既存todosをコピーし、新オブジェクトを追加。Date.now()で一意IDを生成。入力欄をクリア",
  },
  toggle: {
    label: "toggle() → done反転",
    lines: [
      { code: `const toggle = (id) =>`, highlight: true },
      { code: `  setTodos(todos.map((t) =>`, highlight: true },
      { code: `    t.id === id`, highlight: true },
      { code: `      ? { ...t, done: !t.done }`, highlight: true },
      { code: `      : t`, highlight: false },
      { code: `  ));`, highlight: false },
      { code: `// 該当IDのみdoneを反転（イミュータブル更新）`, highlight: false },
    ],
    description: "mapで全タスクを走査し、該当IDのタスクだけdoneを反転。スプレッド構文でオブジェクトをコピーしてから変更（イミュータブル）",
  },
  remove: {
    label: "remove() → filter",
    lines: [
      { code: `const remove = (id) =>`, highlight: true },
      { code: `  setTodos(`, highlight: true },
      { code: `    todos.filter((t) => t.id !== id)`, highlight: true },
      { code: `  );`, highlight: false },
      { code: `// 該当ID以外を残す = 削除`, highlight: false },
    ],
    description: "filterで該当IDを除外した新しい配列を生成。元の配列は変更しない（イミュータブル）",
  },
  render: {
    label: "JSX → todos.map()",
    lines: [
      { code: `{todos.map((t) => (`, highlight: true },
      { code: `  <li key={t.id}>`, highlight: true },
      { code: `    <input type="checkbox" ... />`, highlight: false },
      { code: `    <span>{t.text}</span>`, highlight: true },
      { code: `    <button>削除</button>`, highlight: false },
      { code: `  </li>`, highlight: false },
      { code: `))}`, highlight: false },
      { code: `// state変更 → 再レンダリング → UIに反映`, highlight: false },
    ],
    description: "stateが更新されるとReactが自動で再レンダリング。todos.map()でリスト描画。keyはReactの差分検出に必要",
  },
  enterKey: {
    label: "onKeyDown → Enter検知",
    lines: [
      { code: `onKeyDown={(e) =>`, highlight: true },
      { code: `  e.key === "Enter" && add()`, highlight: true },
      { code: `}`, highlight: false },
      { code: `// 短絡評価: Enterならadd()を実行`, highlight: false },
    ],
    description: "onKeyDownでキーを監視。Enterキーの場合のみadd()を実行。&&の短絡評価を利用",
  },
  countRender: {
    label: "残件数の計算",
    lines: [
      { code: `todos.filter((t) => !t.done).length`, highlight: true },
      { code: `// 未完了タスクだけを抽出してカウント`, highlight: false },
      { code: `// 毎回のレンダリングで再計算される`, highlight: false },
    ],
    description: "filterでdone=falseのタスクを抽出し、lengthで件数を取得。レンダリングのたびに最新値を計算",
  },
};

const REACT_CONCEPTS = {
  typing: "制御コンポーネント（Controlled Component）",
  addCheck: "ガード節（Early Return）",
  addExecute: "イミュータブル更新 / スプレッド構文",
  toggle: "Array.map() / イミュータブル更新",
  remove: "Array.filter() / 宣言的データ操作",
  render: "リストレンダリング / key属性",
  enterKey: "短絡評価（Short-circuit Evaluation）",
  countRender: "派生データ（Derived State）",
};

export default function TodoEducation() {
  const [todos, setTodos] = useState([
    { id: 1, text: "Reactの基本を学ぶ", done: true },
    { id: 2, text: "Todoアプリを作る", done: false },
  ]);
  const [text, setText] = useState("");
  const [execFlow, setExecFlow] = useState([]);
  const [activeBlock, setActiveBlock] = useState("idle");
  const flowEndRef = useRef(null);
  const flowTimerRef = useRef(null);

  const pushFlow = useCallback((blockKey) => {
    const now = new Date();
    const time = `${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}.${now.getMilliseconds().toString().padStart(3, "0")}`;
    setExecFlow((prev) => [...prev.slice(-30), { key: blockKey, time, label: CODE_BLOCKS[blockKey].label }]);
    setActiveBlock(blockKey);
    clearTimeout(flowTimerRef.current);
    flowTimerRef.current = setTimeout(() => setActiveBlock("idle"), Infinity);
  }, []);

  useEffect(() => {
    flowEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [execFlow]);

  const handleTextChange = (e) => {
    setText(e.target.value);
    pushFlow("typing");
  };

  const add = () => {
    pushFlow("addCheck");
    if (!text.trim()) return;
    setTimeout(() => {
      setTodos((prev) => [...prev, { id: Date.now(), text, done: false }]);
      setText("");
      pushFlow("addExecute");
      setTimeout(() => pushFlow("render"), 200);
      setTimeout(() => pushFlow("countRender"), 400);
    }, 300);
  };

  const toggle = (id) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
    pushFlow("toggle");
    setTimeout(() => pushFlow("render"), 200);
    setTimeout(() => pushFlow("countRender"), 400);
  };

  const remove = (id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    pushFlow("remove");
    setTimeout(() => pushFlow("render"), 200);
    setTimeout(() => pushFlow("countRender"), 400);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      pushFlow("enterKey");
      setTimeout(() => add(), 200);
    }
  };

  const block = CODE_BLOCKS[activeBlock];
  const concept = REACT_CONCEPTS[activeBlock];

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      fontFamily: "'IBM Plex Mono', 'SF Mono', 'Fira Code', monospace",
      background: "#0d1117",
      color: "#c9d1d9",
      overflow: "hidden",
    }}>
      {/* === LEFT: Todo App === */}
      <div style={{
        flex: "0 0 380px",
        padding: "28px 24px",
        borderRight: "1px solid #21262d",
        overflowY: "auto",
        background: "#0d1117",
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
            fontSize: 18,
            fontWeight: 600,
            margin: 0,
            color: "#f0f6fc",
            letterSpacing: "-0.02em",
          }}>
            Todo Practice
          </h1>
          <span style={{
            fontSize: 11,
            color: "#484f58",
            marginLeft: "auto",
            background: "#161b22",
            padding: "2px 8px",
            borderRadius: 4,
          }}>LIVE</span>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <input
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="タスクを入力..."
            style={{
              flex: 1,
              padding: "10px 12px",
              fontSize: 14,
              background: "#161b22",
              border: "1px solid #30363d",
              borderRadius: 6,
              color: "#f0f6fc",
              outline: "none",
              fontFamily: "inherit",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#58a6ff")}
            onBlur={(e) => (e.target.style.borderColor = "#30363d")}
          />
          <button
            onClick={add}
            style={{
              padding: "10px 18px",
              fontSize: 14,
              background: "#238636",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
              fontFamily: "inherit",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.target.style.background = "#2ea043")}
            onMouseLeave={(e) => (e.target.style.background = "#238636")}
          >
            追加
          </button>
        </div>

        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {todos.map((t) => (
            <li
              key={t.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 0",
                borderBottom: "1px solid #161b22",
                transition: "opacity 0.2s",
              }}
            >
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => toggle(t.id)}
                style={{
                  width: 16, height: 16,
                  accentColor: "#58a6ff",
                  cursor: "pointer",
                }}
              />
              <span style={{
                flex: 1,
                fontSize: 14,
                textDecoration: t.done ? "line-through" : "none",
                color: t.done ? "#484f58" : "#f0f6fc",
                transition: "color 0.2s",
              }}>
                {t.text}
              </span>
              <button
                onClick={() => remove(t.id)}
                style={{
                  padding: "4px 10px",
                  fontSize: 12,
                  background: "transparent",
                  color: "#f85149",
                  border: "1px solid #f8514933",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#f8514922";
                  e.target.style.borderColor = "#f85149";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "transparent";
                  e.target.style.borderColor = "#f8514933";
                }}
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
      </div>

      {/* === RIGHT: Execution Visualizer === */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#010409",
      }}>
        {/* Active Code Block */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid #21262d",
          background: activeBlock !== "idle" ? "#0d1117" : "#010409",
          transition: "background 0.3s",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
          }}>
            <div style={{
              width: 8, height: 8,
              borderRadius: "50%",
              background: activeBlock !== "idle" ? "#f0883e" : "#30363d",
              boxShadow: activeBlock !== "idle" ? "0 0 8px #f0883e88" : "none",
              transition: "all 0.3s",
            }} />
            <span style={{
              fontSize: 13,
              fontWeight: 600,
              color: activeBlock !== "idle" ? "#f0883e" : "#484f58",
              transition: "color 0.3s",
            }}>
              {activeBlock !== "idle" ? "実行中" : "待機中"}
            </span>
            {concept && (
              <span style={{
                fontSize: 11,
                color: "#7ee787",
                background: "#7ee78711",
                padding: "2px 8px",
                borderRadius: 4,
                marginLeft: "auto",
              }}>
                {concept}
              </span>
            )}
          </div>

          <div style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#f0f6fc",
            marginBottom: 10,
          }}>
            {block.label}
          </div>

          {block.lines && (
            <div style={{
              background: "#161b22",
              borderRadius: 8,
              padding: "14px 16px",
              marginBottom: 12,
              border: "1px solid #21262d",
            }}>
              {block.lines.map((line, i) => (
                <div key={i} style={{
                  fontSize: 13,
                  lineHeight: 1.7,
                  color: line.highlight ? "#f0f6fc" : "#484f58",
                  fontStyle: line.code.startsWith("//") ? "italic" : "normal",
                  transition: "color 0.2s",
                  ...(line.highlight ? {
                    borderLeft: "2px solid #f0883e",
                    paddingLeft: 10,
                    marginLeft: -2,
                    background: "#f0883e08",
                  } : {
                    paddingLeft: 10,
                  }),
                }}>
                  {line.code}
                </div>
              ))}
            </div>
          )}

          <p style={{
            fontSize: 13,
            color: "#8b949e",
            margin: 0,
            lineHeight: 1.6,
          }}>
            {block.description}
          </p>
        </div>

        {/* Execution Flow Log */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 24px",
        }}>
          <div style={{
            fontSize: 11,
            color: "#484f58",
            fontWeight: 600,
            marginBottom: 12,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}>
            Execution Flow Log
          </div>
          {execFlow.length === 0 && (
            <p style={{ fontSize: 13, color: "#30363d" }}>
              Todoアプリを操作すると、ここに実行フローが表示されます
            </p>
          )}
          {execFlow.map((entry, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "6px 0",
                fontSize: 13,
                opacity: i === execFlow.length - 1 ? 1 : 0.5,
                transition: "opacity 0.3s",
              }}
            >
              <span style={{ color: "#30363d", minWidth: 72, flexShrink: 0 }}>
                {entry.time}
              </span>
              <span style={{
                color: "#f0883e",
                fontWeight: i === execFlow.length - 1 ? 600 : 400,
              }}>
                {entry.label}
              </span>
            </div>
          ))}
          <div ref={flowEndRef} />
        </div>

        {/* State Inspector */}
        <div style={{
          padding: "14px 24px",
          borderTop: "1px solid #21262d",
          background: "#0d1117",
          fontSize: 12,
        }}>
          <div style={{
            fontSize: 11,
            color: "#484f58",
            fontWeight: 600,
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}>
            State Inspector
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <div>
              <span style={{ color: "#484f58" }}>text: </span>
              <span style={{ color: "#a5d6ff" }}>"{text}"</span>
            </div>
            <div>
              <span style={{ color: "#484f58" }}>todos.length: </span>
              <span style={{ color: "#79c0ff" }}>{todos.length}</span>
            </div>
            <div>
              <span style={{ color: "#484f58" }}>done: </span>
              <span style={{ color: "#7ee787" }}>{todos.filter(t => t.done).length}</span>
            </div>
            <div>
              <span style={{ color: "#484f58" }}>undone: </span>
              <span style={{ color: "#ffa657" }}>{todos.filter(t => !t.done).length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}