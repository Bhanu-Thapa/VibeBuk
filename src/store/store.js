import { configureStore } from '@reduxjs/toolkit';
import authSlice from './authSlice';

const store = configureStore({
  reducer: {
    auth: authSlice,
    // post: postSlice, (todo : work in progress)
  },
});

export default store;
