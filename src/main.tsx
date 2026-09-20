import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, theme as antdTheme } from 'antd'
import App from './App'
import { ThemeProvider, useTheme } from './theme/ThemeProvider'
import './index.css'
import './components/Button.css'
import './components/FormControls.css'

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
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  )
}

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  </StrictMode>,
)
