
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { todos } from '@db/todos';
export interface Todo {
    id: string;
    name: string;
    label: string;
    timestamp: string;
    complete: boolean;
    expanded: boolean;
}

export interface TodosState {
    todos: Todo[];
}

const initialState: TodosState = {
    todos: todos,
};

export const Todos = createSlice({
    name: 'todos',
    initialState,
    reducers: {
        toggleComplete: (state, action: PayloadAction<{ id: string }>) => {
            const todo = state.todos.find(todo => todo.id === action.payload.id);
            if (todo) {
                todo.complete = !todo.complete;
            }
        },
        updateOrder: (state, action: PayloadAction<Todo[]>) => {
            state.todos = action.payload;
        },
        removeTodo: (state, action: PayloadAction<{ id: string }>) => {
            state.todos = state.todos.filter(todo => todo.id !== action.payload.id);
        },
        addTodo: (state, action: PayloadAction<Omit<Todo, 'complete'>>) => {
            state.todos.unshift({
                ...action.payload,
                complete: false,
            });
        },
        toggleCollapse: (state, action: PayloadAction<{ id: string }>) => {
            const todo = state.todos.find(todo => todo.id === action.payload.id);
            if (todo) {
                todo.expanded = !todo.expanded;
            }
        }
    }
})

export const { toggleComplete, updateOrder, removeTodo, addTodo, toggleCollapse } = Todos.actions
export default Todos.reducer