import React, { useState, useEffect } from "react";
import "./App.css";
import {
  collection,
  doc,
  addDoc, 
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { db, app } from "./firebase";
import LoginPage from "./components/LoginPage";
import TodoPage from "./components/TodoPage";

type Todo = {
  title: string;
  id: string;
  isCompleted: boolean;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setLoading(true);
        const userDocRef = doc(db, "users", currentUser.uid);
        try {
          await setDoc(
            userDocRef,
            {
              email: currentUser.email || "匿名ユーザー",
              lastLogin: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (error) {
          console.error("ユーザー情報の保存中にエラーが発生しました:", error);
        }

        const todosColRef = collection(db, "users", currentUser.uid, "todos");
        const q = query(todosColRef, orderBy("createdAt", "asc"));

        const unsubscribeTodos = onSnapshot(
          q,
          async (querySnapshot) => {
            const todosArray: Todo[] = [];
            querySnapshot.forEach((document) => {
              const data = document.data();
              todosArray.push({
                id: document.id,
                title: data.title,
                isCompleted: data.isCompleted,
              });
            });
            setTodos(todosArray);
            setLoading(false);

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
          },
          (error) => {
            console.error("リアルタイム更新中にエラーが発生しました:", error);
            setLoading(false);
          }
        );
        return () => unsubscribeTodos();
      } else {
        setTodos([]);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [auth]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      {!user ? (
        <LoginPage />
      ) : (
        <TodoPage user={user} todos={todos} setTodos={setTodos} />
      )}
    </div>
  );
}

export default App;