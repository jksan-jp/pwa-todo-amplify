import React from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';  // Import Amplify UI styles

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api'
import { listTodos } from './graphql/queries';
import { createTodo, deleteTodo } from './graphql/mutations';
const client = generateClient();

// Define the Todo interface here
interface Todo {
  id: string;
  name: string;
  description?: string;  // Optional field
  completed: boolean;
}

const TodoApp: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const { signOut } = useAuthenticator();

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    const result: any = await client.graphql({query: listTodos});
    setTodos(result.data.listTodos.items);
  };

  const addTodo = async (name: string, description: string) => {
    const todoDetails = { name, description, completed: false };
    await client.graphql({query: createTodo, variables:{input: todoDetails}});
    fetchTodos();
  };

  const removeTodo = async (todoID: string) => {
    await client.graphql({query: deleteTodo, variables:{ input: { id: todoID }}});
    fetchTodos();
  };
  
  const [newTaskName, setNewTaskName] = useState<string>('');
  return (
    <div>
      <h1>My TODO App</h1>
      <button onClick={signOut}>Sign Out</button>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            {todo.name} - {todo.completed ? "Done" : "Pending"}
            <button onClick={() => removeTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
      <input
        type="text"
        value={newTaskName}
        onChange={(e) => setNewTaskName(e.target.value)}
        placeholder="Enter new task name"
      />
      <button onClick={() => addTodo(newTaskName, "A new task to do")}>
        Add TODO
      </button>
    </div>
  );
}

// Component to handle private routes
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { route } = useAuthenticator((context) => [context.route]);
  console.log(route)
  if (route !== 'authenticated') {
    return <Navigate to="/" />;
  }
  
  return children;
};

const App: React.FC = () => {

  return (
    <Authenticator.Provider>
      <Router>
        <Routes>
          {/* Authenticator handles login/signup */}
          <Route path="/signin"  element={<Authenticator />} />

          {/* Protect the TODO app route */}
          <Route path="/todo" element={
            <PrivateRoute>
              <TodoApp />
            </PrivateRoute>
          } />
        </Routes>
      </Router>
    </Authenticator.Provider>
  );
};

export default App;
