import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'

import Typography from 'material-ui/Typography'
import IconButton from 'material-ui/IconButton'
import Button from 'material-ui/Button'
import AppBar from 'material-ui/AppBar'
import Toolbar from 'material-ui/Toolbar'
import TextField from 'material-ui/TextField'

import List, { ListItem, ListItemSecondaryAction, ListItemText } from 'material-ui/List'
import Card, { CardContent } from 'material-ui/Card'
import { withStyles } from 'material-ui/styles'

import AddIcon from 'material-ui-icons/Add'
import CancelIcon from 'material-ui-icons/Cancel'

import axios from 'axios'
import icon from './icon.png'

import './SelectProject.css'
import DialogHelper from './Dialogs/DialogHelper'

const API_URL = process.env.REACT_APP_API_URL

const projectSelectStyles = {
  icon: {
    maxHeight: '60%',
    maxWidth: '60%',
    paddingRight: 20
  },
  title: {
    fontFamily: 'Rubik',
    letterSpacing: 3
  },
  toolbar: {
    height: 0
  },
  expand: { display: 'flex', flexGrow: 1 },
  card: { marginBottom: 10 },
  addButton: { marginTop: 20, marginLeft: 15 },
  addProjectInput: { flexGrow: 1 }
}

const ProjectList = ({ projectList, onSelect, onDelete }) =>
  projectList.length ? (
    <List>
      {projectList.map((project, index) => (
        <ListItem button key={index} onClick={() => onSelect(project.id)}>
          <ListItemText primary={project.name} />
          <ListItemSecondaryAction>
            <IconButton>
              <CancelIcon onClick={() => onDelete(project)} />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  ) : (
    <Typography component="p" align="center" color="secondary">
      No previous projects
    </Typography>
  )

class SelectProject extends Component {
  state = {
    projects: [],
    currentName: '',
    projectToDelete: null
  }
  componentDidMount() {
    this._reloadProjects()
  }

  _reloadProjects = () => {
    axios.get(`${API_URL}/projects/`).then(response => {
      this.setState({ projects: response.data.projects })
    })
  }

  _selectProject = projectId => {
    window.localStorage.setItem('project_id', projectId)
    this.props.history.push('/')
  }

  handleChange = event => {
    this.setState({ currentName: event.target.value })
  }

  handleSubmit = event => {
    if (this.state.currentName) {
      const data = { name: this.state.currentName }
      axios.post(`${API_URL}/projects/`, data).then(response => {
        window.localStorage.setItem('project_id', response.data.project_id)
        this.props.history.push('/')
      })
    }
    event.preventDefault()
  }

  handleDeleteProject = project => {
    this.setState({ projectToDelete: project })
  }

  onConfirmDeleteClose = confirmDelete => {
    if (confirmDelete) {
      axios
        .delete(`${API_URL}/projects/${this.state.projectToDelete.id}`)
        .then(this._reloadProjects)
    }
    this.setState({ projectToDelete: null })
  }

  render() {
    return (
      <div className="select-project">
        <div>
          <AppBar color="secondary">
            <Toolbar className={this.props.classes.toolbar}>
              <img src={icon} alt="" className={this.props.classes.icon} />
              <Typography type="title" className={this.props.classes.title}>
                TAGGERINE
              </Typography>
            </Toolbar>
          </AppBar>
        </div>
        <Card id="new-project" className={this.props.classes.card}>
          <CardContent className={this.props.classes.expand}>
            <form onSubmit={this.handleSubmit} className={this.props.classes.expand}>
              <TextField
                label="Create new project"
                margin="normal"
                className={this.props.classes.addProjectInput}
                value={this.state.currentName}
                onChange={this.handleChange}
              />
              <Button
                color="primary"
                variant="raised"
                className={this.props.classes.addButton}
                onClick={this.handleSubmit}
              >
                <AddIcon />
              </Button>
            </form>
          </CardContent>
        </Card>
        <DialogHelper
          open={this.state.projectToDelete !== null}
          title={
            this.state.projectToDelete !== null
              ? 'Delete project ' + this.state.projectToDelete.name
              : ''
          }
          message="Are you sure that you want to delete the project, with all its images and tags? This can't be undone"
          onConfirm={() => this.onConfirmDeleteClose(true)}
          onCancel={() => this.onConfirmDeleteClose(false)}
        />

        <Card id="existing-project" className={this.props.classes.card}>
          <CardContent className={this.props.classes.expand}>
            <ProjectList
              projectList={this.state.projects}
              onSelect={this._selectProject}
              onDelete={this.handleDeleteProject}
            />
          </CardContent>
        </Card>
      </div>
    )
  }
}

export default withRouter(withStyles(projectSelectStyles)(SelectProject))
