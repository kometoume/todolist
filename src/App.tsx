import React, { useState, useEffect } from "react";
import "./App.css";
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
  setDoc,
} from "firebase/firestore";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  User,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { db, app } from "./firebase";

type Todo = {
  title: string;
  id: string;
  isCompleted: boolean;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  const auth = getAuth(app);

  // 認証状態の変更を監視し、Todoリストを取得する
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

  // 新規登録
  const handleSignUp = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      return alert("メールアドレスとパスワードを入力してください。");
    }
    if (trimmedPassword.length < 6) {
      return alert("パスワードは6文字以上で入力してください。");
    }

    try {
      await createUserWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
      alert("新規登録しました！");
      setEmail("");
      setPassword("");
    } catch (error: any) {
      console.error("新規登録エラー:", error.code);
      if (error.code === "auth/email-already-in-use") {
        alert("このメールアドレスはすでに使用されています。");
      } else if (error.code === "auth/invalid-email") {
        alert("無効なメールアドレスです。");
      } else {
        alert(error.message);
      }
    }
  };

  // ログイン
  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      return alert("メールアドレスとパスワードを入力してください。");
    }

    try {
      await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
      alert("ログインしました！");
      setEmail("");
      setPassword("");
    } catch (error: any) {
      console.error("ログインエラー:", error.code);
      if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/invalid-email"
      ) {
        alert("メールアドレスまたはパスワードが間違っています。");
      } else {
        alert(error.message);
      }
    }
  };

  // ゲストログイン
  const handleAnonymousLogin = async () => {
    try {
      await signInAnonymously(auth);
      alert("ゲストとしてログインしました！");
    } catch (error: any) {
      console.error("ゲストログインエラー:", error.code);
      alert(error.message);
    }
  };

  // Googleログイン
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      alert("Googleアカウントでログインしました！");
    } catch (error: any) {
      console.error("Googleログインエラー:", error.code);
      if (error.code === "auth/popup-closed-by-user") {
        console.log("ログインがキャンセルされました。");
      } else if (
        error.code === "auth/account-exists-with-different-credential"
      ) {
        alert(
          "このメールアドレスは、メール/パスワードで登録されています。メールアドレスとパスワードでログインしてください。"
        );
      } else {
        alert(error.message);
      }
    }
  };

  // ログアウト
  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("ログアウトしました！");
    } catch (error: any) {
      console.error("ログアウトエラー:", error.code);
      alert(error.message);
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
  const handleChecked = async (id: string, isCompleted: boolean) => {
    if (!user) return;
    const todoRef = doc(db, "users", user.uid, "todos", id);
    await updateDoc(todoRef, {
      isCompleted: !isCompleted,
    });
  };

  // Todoを削除
  const handleDeleted = async (id: string) => {
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      {!user ? (
        <div className="auth-container">
          <h2>ログイン / 新規登録</h2>
          <div className="auth-form">
            <input
              type="email"
              placeholder="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button id="login-button" onClick={handleLogin}>
              ログイン
            </button>
            <button id="signup-button" onClick={handleSignUp}>
              新規登録
            </button>
            <button id="anonymous-login-button" onClick={handleAnonymousLogin}>
              ゲストとしてログイン
            </button>
            <button id="google-login-button" onClick={handleGoogleLogin}>
              Googleでログイン
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="header-container">
            <h2>毎日掃除リスト</h2>
            <div className="user-info">
              <span>{user.email || "ゲストユーザー"}</span>
              <button id="logout-button" onClick={handleLogout}>
                ログアウト
              </button>
              <button id="purge-button" onClick={handlePurge}>
                削除
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
                <button
                  className="delete-button"
                  onClick={() => handleDeleted(todo.id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default App;
