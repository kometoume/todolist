import React, { useState } from "react";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { getAuth, signOut, User } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { db, app } from "../firebase";
import { Todo } from '../types';

type TodoPageProps = {
  user: User;
  todos: Todo[];
  setTodos: (todos: Todo[]) => void;
}

const TodoPage: React.FC<TodoPageProps> = ({ user, todos, setTodos }) => {
  const [inputValue, setInputValue] = useState("");
  const auth = getAuth(app);

  // ログアウト
  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("ログアウトしました！");
    } catch (error) {
      if (error instanceof FirebaseError) {
        console.error("ログアウトエラー:", error.code);
        alert(error.message);
      } else {
        console.error("予期せぬエラー:", error);
        alert("エラーが発生しました。");
      }
    }
  };

  // Todoを追加
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputValue.trim() === "" || !user) {
      return;
    }
    try {
      const todosColRef = collection(db, "users", user.uid, "todos");
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

  // Todoの完了状態を更新
  const handleCheck = async (id: string, isCompleted: boolean) => {
    if (!user) return;
    const todoRef = doc(db, "users", user.uid, "todos", id);
    await updateDoc(todoRef, {
      isCompleted: !isCompleted,
    });
  };

  // Todoを削除
  const handleDelete = async (id: string) => {
    if (!window.confirm("削除しますか？") || !user) return;
    const todoRef = doc(db, "users", user.uid, "todos", id);
    await deleteDoc(todoRef);
  };

  // 完了済みTodoを全て削除
  const handlePurge = async () => {
    if (!window.confirm("完了済みのタスクをすべて削除しますか？") || !user)
      return;
    const todosColRef = collection(db, "users", user.uid, "todos");
    const q = query(todosColRef, where("isCompleted", "==", true));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (document) => {
      await deleteDoc(doc(db, todosColRef.path, document.id));
    });
  };

  return (
    <>
      <div className="header-container">
        <h2>毎日掃除リスト</h2>
        <div className="user-info">
          <span>{user.email || "ゲストユーザー"}</span>
          <button id="logout-button" onClick={handleLogout}>
            ログアウト
          </button>
          <button id="purge-button" onClick={handlePurge}>
            完了タスク削除
          </button>
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
        <button type="submit" className="submitButton">
          追加
        </button>
      </form>
      <ul className="todoList">
        {todos.map((todo) => (
          <li key={todo.id} className={todo.isCompleted ? "completed" : ""}>
            <input
              type="checkbox"
              checked={todo.isCompleted}
              onChange={() => handleCheck(todo.id, todo.isCompleted)}
            />
            <span
              className="todo-title"
              style={{
                textDecoration: todo.isCompleted ? "line-through" : "none",
              }}
            >
              {todo.title}
            </span>
            <button
              className="delete-button"
              onClick={() => handleDelete(todo.id)}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </>
  );
};

export default TodoPage;