import React, { Component } from 'react'
import { BrowserRouter as Router, Switch, Redirect, Route } from 'react-router-dom'

import { loadFromLocalStorage } from './localStorage'
import Project from './Project'
import SelectProject from './SelectProject'

//Material-ui
import { MuiThemeProvider, createMuiTheme } from 'material-ui/styles';
import orange from 'material-ui/colors/orange';
import lime from 'material-ui/colors/lime';
import red from 'material-ui/colors/red';

/*import './App.css'*/
import 'rc-slider/assets/index.css'

const defaultTheme = createMuiTheme()

// All the following keys are optional.
const theme = createMuiTheme({
  palette: {
    contrastThreshold: 3.1,
    tonalOffset: 0.07,
    primary: {
      light: orange[300],
      main: orange[500],
      dark: orange[700],
      contrastText: defaultTheme.palette.getContrastText(orange[500]),
    },
    secondary: {
      light: lime.A200,
      main: lime.A400,
      dark: lime.A700,
      contrastText: defaultTheme.palette.getContrastText(lime.A400),
    },
    error: red.A400,
  },
});

const PROJECT_ID_KEY = 'project_id'



const Home = () => {
  const projectId = loadFromLocalStorage(PROJECT_ID_KEY)
  return projectId ? <Redirect to={`/project/${projectId}`} /> : <Redirect to="/selectproject" />
}

class App extends Component {
  state = {}

  render() {

    return (
      <MuiThemeProvider className="App" muiTheme={theme}>
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
      </MuiThemeProvider>
    )
  }
}

export default App
