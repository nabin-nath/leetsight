import { configureStore } from "@reduxjs/toolkit";
import allListsReducer from "./slices/allListsSlice";
import companiesReducer from "./slices/companiesSlice";
import listDetailReducer from "./slices/listDetailSlice";
import postDetailReducer from "./slices/postDetailSlice";
import postsReducer from "./slices/postsSlice";
import rolesReducer from "./slices/rolesSlice";
import userListReducer from "./slices/userListSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      userList: userListReducer,
      companies: companiesReducer,
      roles: rolesReducer,
      posts: postsReducer,
      postDetail: postDetailReducer,
      allLists: allListsReducer,
      listDetail: listDetailReducer,
    },
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
