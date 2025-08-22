import React, { useState } from "react";
import "./App.css";

function App() {
  const [inputValue, setInputValue] = useState("");
  const [todos, setTodos] = useState<Todo[]>([
  {
    inputValue: "ゴミ出し",
    id: 1,
    checked: false,
  },
  {
    inputValue: "洗濯",
    id: 2,
    checked: false,
  },
  {
    inputValue: "皿洗い",
    id: 3,
    checked: false,
  },
]);

  type Todo = {
    inputValue: string;
    id: number;
    checked: boolean;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (inputValue.trim() === "") {
      return;
    }

    // 新しいTodoを作成
    const newTodo: Todo = {
      inputValue: inputValue,
      id: Date.now(),
      checked: false,
    };

    setTodos([newTodo, ...todos]);
    setInputValue("");
  };

  const handleEdit = (id: number, inputValue: string) => {
    const newTodos = todos.map((todo) => {
      if (todo.id === id) {
        return { ...todo, inputValue: inputValue };
      }
      return todo;
    });
    setTodos(newTodos);
  };

  const handleChecked = (id: number, checked: boolean) => {
    const newTodos = todos.map((todo) => {
      if (todo.id === id) {
        return { ...todo, checked: !checked };
      }
      return todo;
    });
    setTodos(newTodos);
  };

  const handleDeleted = (id: number) => {
    const newTodos = todos.filter((todo) => todo.id !== id);
    setTodos(newTodos);
  };

  const handlePurge = () => {
    const newTodos = todos.filter((todo) => !todo.checked);
    setTodos(newTodos);
  };

  return (
    <div className="App">
      <div></div>
      <div className="header-container">
  <h2>毎日掃除リスト</h2>
  <button onClick={handlePurge}>完了済みを削除</button>
</div>
  <form onSubmit={(e) => handleSubmit(e)}> 
        <input
          type="text"
          onChange={(e) => handleChange(e)}
          className="inputText"
          value={inputValue}
          placeholder="タスクを追加"
        />
        <input type="submit" value="追加" className="submitButton" />
      </form>
      <ul className="todoList">
        {todos.map((todo) => (
          <li key={todo.id}>
            <input
              type="text"
              onChange={(e) => handleEdit(todo.id, e.target.value)}
              className="inputText"
              value={todo.inputValue}
              disabled={todo.checked}
            />
            <input
              type="checkbox"
              onChange={(e) => handleChecked(todo.id, todo.checked)}
            />
            <button onClick={() => handleDeleted(todo.id)}>削除</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
