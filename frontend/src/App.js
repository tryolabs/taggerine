import React, { Component } from 'react'
import { BrowserRouter as Router, Switch, Redirect, Route } from 'react-router-dom'
import { MuiThemeProvider, createMuiTheme } from 'material-ui/styles'

import { loadFromLocalStorage } from './localStorage'
import Project from './Project'
import SelectProject from './SelectProject'

import './App.css'
import 'rc-slider/assets/index.css'

const PROJECT_ID_KEY = 'project_id'

const Home = () => {
  const projectId = loadFromLocalStorage(PROJECT_ID_KEY)
  return projectId ? <Redirect to={`/project/${projectId}`} /> : <Redirect to="/selectproject" />
}

const theme = createMuiTheme({
  palette: {
    primary: {
      light: '#ffa544',
      main: '#e2750a',
      dark: '#aa4700',
      contrastText: '#fff',
    },
    secondary: {
      light: '#ffffff',
      main: '#e2e2e2',
      dark: '#b0b0b0',
      contrastText: '#000',
    },
  },
})

class App extends Component {
  state = {}

  render() {

    return (
      <MuiThemeProvider theme={theme}>
        <div className="App">
          <Router>
            <Switch>
              <Route exact path="/" component={Home} />
              <Route path="/project/:project_id" component={Project} />
              <Route
                path="/selectproject"
                component={SelectProject}
                project_id_key={PROJECT_ID_KEY}
              />
              <Redirect to="/" />
            </Switch>
          </Router>
        </div>
      </MuiThemeProvider>
    )
  }
}

export default App
