import { configureStore } from '@reduxjs/toolkit';
import TodosReducer from '../features/todos/todosSlice';
import pageLayoutsReducer from '../features/cms/pageLayoutsSlice';

export default configureStore({
    reducer: {
        todos: TodosReducer,
        pageLayouts: pageLayoutsReducer,
    }
});