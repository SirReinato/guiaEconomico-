import { createGlobalStyle } from 'styled-components'
const GlobalStyle = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body, #root {
    height: 100%;
    font-family: "DynaPuff", system-ui;
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.textPrimary};
    overflow-x: hidden;
    max-width: 100vw;
  }

  /* Evita zoom automático agressivo no iOS e melhora conforto de toque */
  input, select, textarea {
    font-size: 16px;
  }

  img, video {
    max-width: 100%;
    display: block;
  }

  button {
    font: inherit;
    cursor: pointer;
  }
`

export default GlobalStyle
