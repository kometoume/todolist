import React, { useState, useEffect } from "react";
import "./App.css";
import db from "./firebase";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  onSnapshot,
  where,
  serverTimestamp,
  orderBy,
  getDocs,
  QueryDocumentSnapshot,
} from "firebase/firestore";

// Firestoreに保存するTodoの型を定義
type Todo = {
  title: string;
  id: string;
  isCompleted: boolean;
};

// 全ユーザー共通のIDとして固定値を使用
const GUEST_USER_ID = "guest_user";

function App() {
  const [inputValue, setInputValue] = useState("");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Todoリストのリアルタイムリスナーを設定
    const todosColRef = collection(db, "users", GUEST_USER_ID, "todos");
    const q = query(todosColRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const todosArray: Todo[] = [];
      querySnapshot.forEach((document: QueryDocumentSnapshot) => {
        const data = document.data();
        todosArray.push({
          id: document.id,
          title: data.title,
          isCompleted: data.isCompleted,
        });
      });
      setTodos(todosArray);
      setLoading(false);

      // 初回アクセス時にデフォルトのタスクを追加
      if (
        todosArray.length === 0 &&
        !querySnapshot.metadata.hasPendingWrites
      ) {
        const defaultTodos = [
          { title: "ゴミ出し", isCompleted: false },
          { title: "洗濯", isCompleted: false },
          { title: "皿洗い", isCompleted: false },
        ];
        for (const item of defaultTodos) {
          await addDoc(todosColRef, {
            ...item,
            createdAt: serverTimestamp(),
          });
        }
      }
    });

    // コンポーネントがアンマウントされたときにリスナーを解除
    return () => unsubscribe();
  }, []); // 依存配列を空にすることで、初回レンダリング時のみ実行

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputValue.trim() === "") {
      return;
    }
    try {
      const todosColRef = collection(db, "users", GUEST_USER_ID, "todos");
      await addDoc(todosColRef, {
        title: inputValue,
        isCompleted: false,
        createdAt: serverTimestamp(),
      });
      setInputValue("");
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  const handleChecked = async (id: string, isCompleted: boolean) => {
    const todoRef = doc(db, "users", GUEST_USER_ID, "todos", id);
    await updateDoc(todoRef, {
      isCompleted: !isCompleted,
    });
  };

  const handleDeleted = async (id: string) => {
    if (!window.confirm("削除しますか？")) return;
    const todoRef = doc(db, "users", GUEST_USER_ID, "todos", id);
    await deleteDoc(todoRef);
  };

  const handlePurge = async () => {
    if (!window.confirm("完了済みのタスクをすべて削除しますか？")) return;
    const todosColRef = collection(db, "users", GUEST_USER_ID, "todos");
    const q = query(todosColRef, where("isCompleted", "==", true));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (document: QueryDocumentSnapshot) => {
      await deleteDoc(doc(db, todosColRef.path, document.id));
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      <div className="header-container">
        <h2>毎日掃除リスト</h2>
        <div className="user-info">
          <span>ゲストユーザー</span>
          <button onClick={handlePurge}>完了済みを削除</button>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          onChange={(e) => setInputValue(e.target.value)}
          className="inputText"
          value={inputValue}
          placeholder="タスクを追加"
        />
        <button type="submit" className="submitButton">追加</button>
      </form>
      <ul className="todoList">
        {todos.map((todo) => (
          <li key={todo.id} className={todo.isCompleted ? "completed" : ""}>
            <input
              type="checkbox"
              checked={todo.isCompleted}
              onChange={() => handleChecked(todo.id, todo.isCompleted)}
            />
            <span
              className="todo-title"
              style={{
                textDecoration: todo.isCompleted ? "line-through" : "none",
              }}
            >
              {todo.title}
            </span>
            <button onClick={() => handleDeleted(todo.id)}>削除</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;