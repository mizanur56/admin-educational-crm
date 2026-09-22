import { persistReducer } from 'redux-persist'
import { AUTH_PERSIST_KEY } from '@/constants'
import { baseApi } from '../api/baseApi'
import storage from '../storage'
import authReducer from './auth/authSlice'
import sidebarReducer from './sidebar/sidebarSlice'

/** Side-effect imports so injectEndpoints register before the store boots. */
import './auth/authApi'
import './users/usersApi'
import './roles/rolesApi'
import './employees/employeesApi'
import './masterData/masterDataApi'
import './activities/activitiesApi'
import './auditLogs/auditLogsApi'
import './search/searchApi'
import './pipeline/pipelineApi'

const authPersistConfig = {
  key: AUTH_PERSIST_KEY,
  storage,
  whitelist: ['session'],
}

export const reducer = {
  [baseApi.reducerPath]: baseApi.reducer,
  auth: persistReducer(authPersistConfig, authReducer),
  sidebar: sidebarReducer,
}
