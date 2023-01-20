import { CssBaseline, GeistProvider } from "@geist-ui/core"
import "./styles.css"

function App({ Component, pageProps }) {
  return (
    <GeistProvider>
      <Component {...pageProps} />
    </GeistProvider>
  )
}
export default App
