import { configureStore } from '@reduxjs/toolkit';
import pageState from './state/pageState';

export const store = configureStore({
	reducer: {
		page: pageState,
	},
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
