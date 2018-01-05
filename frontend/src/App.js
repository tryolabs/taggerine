import React, { Component } from 'react'
import { BrowserRouter as Router, Switch, Redirect, Route } from 'react-router-dom'

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

class App extends Component {
  state = {}

  render() {

    return (
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
    )
  }
}

export default App
