import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { RouterProvider } from 'react-router-dom'
import { ConfigProvider, theme as antdTheme } from 'antd'
import router from './routes/routes'
import { ThemeProvider, useTheme } from './theme/ThemeProvider'
import './index.css'

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
          colorBgLayout: isDark ? '#101418' : '#fcfbf8',
          colorBgContainer: isDark ? '#1c232b' : '#ffffff',
          colorBorder: isDark ? '#2a343e' : '#e6edf5',
          colorText: isDark ? '#e7edf3' : '#16324f',
        },
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  )
}

createRoot(root).render(
  <StrictMode>
    <HelmetProvider>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </HelmetProvider>
  </StrictMode>,
)
