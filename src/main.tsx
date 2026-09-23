import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { RouterProvider } from 'react-router-dom'
import { ConfigProvider, theme as antdTheme } from 'antd'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import router from './routes/routes'
import { persistor, store } from './redux/features/store'
import AuthSessionProvider from './providers/AuthSessionProvider'
import { ThemeProvider, useTheme } from './theme/ThemeProvider'
import PageLoader from './components/PageLoader'
import './index.css'
import './styles/antd.css'

const root = document.getElementById('root')

if (!root) {
  throw new Error('Root element not found')
}

function ThemedApp() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <ConfigProvider
      getPopupContainer={() => document.body}
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          zIndexPopupBase: 2000,
          colorPrimary: '#35AD0B',
          borderRadius: 10,
          fontFamily: 'Inter, Segoe UI, system-ui, sans-serif',
          controlHeight: 42,
          controlHeightLG: 42,
          controlHeightSM: 34,
          colorBgLayout: isDark ? '#101418' : '#fafafa',
          colorBgContainer: isDark ? '#1c232b' : '#ffffff',
          colorBorder: isDark ? '#2a343e' : '#e2e8f0',
          colorText: isDark ? '#e7edf3' : '#16324f',
        },
      }}
    >
      <ToastContainer
        position="bottom-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDark ? 'dark' : 'colored'}
      />
      <RouterProvider router={router} />
    </ConfigProvider>
  )
}

createRoot(root).render(
  <StrictMode>
    <HelmetProvider>
      <Provider store={store}>
        <PersistGate loading={<PageLoader />} persistor={persistor}>
          <ThemeProvider>
            <AuthSessionProvider>
              <ThemedApp />
            </AuthSessionProvider>
          </ThemeProvider>
        </PersistGate>
      </Provider>
    </HelmetProvider>
  </StrictMode>,
)
