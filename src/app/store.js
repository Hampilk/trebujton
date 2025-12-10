import { configureStore } from '@reduxjs/toolkit';
import TodosReducer from '../features/todos/todosSlice';
import cmsPageReducer from '../redux/slices/cmsPageSlice';

export default configureStore({
    reducer: {
        todos: TodosReducer,
        cmsPage: cmsPageReducer,
    }
});