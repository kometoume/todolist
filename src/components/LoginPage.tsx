import React, { useState } from "react";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { app } from "../firebase";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const auth = getAuth(app);

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
    } catch (error) {
      if (error instanceof FirebaseError) {
        console.error("新規登録エラー:", error.code);
        if (error.code === "auth/email-already-in-use") {
          alert("このメールアドレスはすでに使用されています。");
        } else if (error.code === "auth/invalid-email") {
          alert("無効なメールアドレスです。");
        } else {
          alert(error.message);
        }
      } else {
        console.error("予期せぬエラー:", error);
        alert("エラーが発生しました。");
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
    } catch (error) {
      if (error instanceof FirebaseError) {
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
      } else {
        console.error("予期せぬエラー:", error);
        alert("エラーが発生しました。");
      }
    }
  };

  // ゲストログイン
  const handleAnonymousLogin = async () => {
    try {
      await signInAnonymously(auth);
      alert("ゲストとしてログインしました！");
    } catch (error) {
      if (error instanceof FirebaseError) {
        console.error("ゲストログインエラー:", error.code);
        alert(error.message);
      } else {
        console.error("予期せぬエラー:", error);
        alert("エラーが発生しました。");
      }
    }
  };

  // Googleログイン
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      alert("Googleアカウントでログインしました！");
    } catch (error) {
      if (error instanceof FirebaseError) {
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
      } else {
        console.error("予期せぬエラー:", error);
        alert("エラーが発生しました。");
      }
    }
  };

  return (
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
  );
};

export default LoginPage;
