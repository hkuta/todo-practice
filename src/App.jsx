import { useState } from "react";

export default function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");

  const add = () => {
    if (!text.trim()) return;
    setTodos([...todos, { id: Date.now(), text, done: false }]);
    setText("");
  };

  const toggle = (id) =>
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const remove = (id) => setTodos(todos.filter((t) => t.id !== id));

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>Todo Practice</h1>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="タスクを入力..."
          style={{ flex: 1, padding: 8, fontSize: 16 }}
        />
        <button onClick={add} style={{ padding: "8px 16px", fontSize: 16 }}>
          追加
        </button>
      </div>
      <ul style={{ listStyle: "none", padding: 0, marginTop: 16 }}>
        {todos.map((t) => (
          <li
            key={t.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 0",
              borderBottom: "1px solid #eee",
            }}
          >
            <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} />
            <span style={{
              flex: 1,
              textDecoration: t.done ? "line-through" : "none",
              color: t.done ? "#999" : "#000",
            }}>
              {t.text}
            </span>
            <button onClick={() => remove(t.id)}>削除</button>
          </li>
        ))}
      </ul>
      <p style={{ color: "#888", marginTop: 16 }}>
        残り: {todos.filter((t) => !t.done).length} / {todos.length} 件
      </p>
    </div>
  );
}